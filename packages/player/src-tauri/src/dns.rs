//! DNS-over-HTTPS resolution against Cloudflare (1.1.1.1).
//!
//! Why this exists (Android):
//! - The system resolver (getaddrinfo) can block a runtime thread indefinitely
//!   on devices with a global IPv6 address but no working IPv6 route. Observed
//!   on the target device: getaddrinfo hangs not only for IPv4-only hosts like
//!   github.com but even for the numeric literal 1.1.1.1, while dual-stack hosts
//!   already in the resolver cache (api.github.com) return. Because the blocking
//!   call is off the async runtime, neither reqwest timeouts nor tokio timeouts
//!   ever fire — the request just hangs.
//!
//! The fix is to never call getaddrinfo at all. We pin the DoH server's IP with
//! reqwest's `.resolve()` (1.1.1.1 is a fixed literal), ask Cloudflare for the
//! target's A record over HTTPS, and hand that IPv4 back so callers can pin it
//! too. `port` is attached so the result drops straight into `.resolve()`.

use std::net::{Ipv4Addr, SocketAddr};
use std::sync::OnceLock;

use serde::Deserialize;

// Mozilla CA root bundle (from https://curl.se/ca/cacert.pem), embedded in the
// binary so cert verification needs no OS trust store access.
const CA_BUNDLE: &[u8] = include_bytes!("../cacert.pem");

fn root_certs() -> &'static Vec<reqwest::Certificate> {
    static CERTS: OnceLock<Vec<reqwest::Certificate>> = OnceLock::new();
    CERTS.get_or_init(|| {
        reqwest::Certificate::from_pem_bundle(CA_BUNDLE)
            .expect("embedded CA bundle must parse")
    })
}

const DOH_HOST: &str = "1.1.1.1";
const DOH_PORT: u16 = 443;
const DOH_URL: &str = "https://1.1.1.1/dns-query";
const A_RECORD_TYPE: u16 = 1;

/// Base reqwest client builder for the app. Verifies certs against the embedded
/// Mozilla CA bundle instead of `rustls-platform-verifier`.
///
/// Why: reqwest's default rustls path uses the platform verifier, which reaches
/// the Android system trust store over JNI. On the target device that TLS
/// handshake hangs indefinitely for some hosts (github.com, 1.1.1.1) while
/// working for others (api.github.com) — a nondeterministic JNI/thread stall,
/// with the raw TCP connect succeeding first. Passing our own roots via
/// `tls_certs_only` switches reqwest to the pure-Rust WebPki verifier (no JNI),
/// which resolves every host deterministically.
pub fn client_builder() -> reqwest::ClientBuilder {
    reqwest::Client::builder().tls_certs_only(root_certs().iter().cloned())
}

#[derive(Deserialize)]
struct DohResponse {
    #[serde(rename = "Answer", default)]
    answer: Vec<DohAnswer>,
}

#[derive(Deserialize)]
struct DohAnswer {
    #[serde(rename = "type")]
    record_type: u16,
    data: String,
}

pub async fn resolve_ipv4(host: &str, port: u16) -> Result<SocketAddr, String> {
    // Host already an IP literal: pin it directly, no lookup needed.
    if let Ok(ip) = host.parse::<Ipv4Addr>() {
        return Ok(SocketAddr::new(ip.into(), port));
    }

    // Pin the DoH server IP (1.1.1.1 literal) so reqwest never calls getaddrinfo,
    // which hangs on this device even for the numeric literal.
    let doh_addr = SocketAddr::new(Ipv4Addr::new(1, 1, 1, 1).into(), DOH_PORT);
    let client = client_builder()
        .resolve(DOH_HOST, doh_addr)
        .build()
        .map_err(|error| format!("DoH client build failed: {error}"))?;

    // Host names are URL-safe (letters, digits, dots, hyphens), so build the
    // query string directly without the reqwest `query` feature.
    let request_url = format!("{DOH_URL}?name={host}&type=A");
    let response = client
        .get(&request_url)
        .header("accept", "application/dns-json")
        .send()
        .await
        .map_err(|error| format!("DoH request failed for {host}: {error}"))?;

    if !response.status().is_success() {
        return Err(format!("DoH HTTP error for {host}: {}", response.status()));
    }

    let parsed: DohResponse = response
        .json()
        .await
        .map_err(|error| format!("DoH parse failed for {host}: {error}"))?;

    parsed
        .answer
        .into_iter()
        .filter(|entry| entry.record_type == A_RECORD_TYPE)
        .find_map(|entry| entry.data.parse::<Ipv4Addr>().ok())
        .map(|ip| SocketAddr::new(ip.into(), port))
        .ok_or_else(|| format!("No A record for {host}"))
}
