pub mod bridge;
pub mod commands;
pub mod discord;
pub mod dns;
pub mod http;
pub mod http_api;
pub mod logging;
pub mod mcp;
pub mod media_session;
pub mod mpd;
pub mod net;
mod setup;
pub mod stream_server;
pub mod ytdlp;
#[cfg(target_os = "android")]
pub mod ytdlp_bridge;
pub mod ytdlp_setup;

// Maximizes the window when running as a non-steam app in steam
#[cfg(target_os = "linux")]
fn maximize_for_gamescope(app: &tauri::App) {
    use tauri::Manager;

    let is_gamescope = std::env::var("GAMESCOPE_WAYLAND_DISPLAY").is_ok()
        || std::env::var("SteamDeck").map_or(false, |v| v == "1");

    if is_gamescope {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.maximize();
        }
    }
}

// tauri-plugin-window-state, tauri-plugin-updater and tauri-plugin-process are only
// pulled in as dependencies for desktop targets (see Cargo.toml), so registering them
// has to be gated the same way or the Android/iOS build fails to resolve the crates.
#[cfg(any(target_os = "macos", windows, target_os = "linux"))]
fn add_desktop_only_plugins<R: tauri::Runtime>(
    builder: tauri::Builder<R>,
    is_flatpak: bool,
) -> tauri::Builder<R> {
    let builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

    if is_flatpak {
        builder
    } else {
        builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_process::init())
    }
}

#[cfg(any(target_os = "android", target_os = "ios"))]
fn add_desktop_only_plugins<R: tauri::Runtime>(
    builder: tauri::Builder<R>,
    _is_flatpak: bool,
) -> tauri::Builder<R> {
    builder
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let is_flatpak = std::env::var("FLATPAK_ID").is_ok();

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_upload::init())
        .plugin(setup::log_plugin());

    let builder = add_desktop_only_plugins(builder, is_flatpak);

    // Bridges the yt-dlp commands to the embedded Python runtime on Android.
    #[cfg(target_os = "android")]
    let builder = builder.plugin(ytdlp_bridge::init());

    // Registers the native media-session/foreground-service plugin on Android.
    #[cfg(target_os = "android")]
    let builder = builder.plugin(media_session::init());

    builder
        .invoke_handler(tauri::generate_handler![
            commands::is_flatpak,
            commands::copy_dir_recursive,
            commands::extract_zip,
            commands::download_file,
            http::http_fetch,
            ytdlp::ytdlp_search,
            ytdlp::ytdlp_get_stream,
            ytdlp::ytdlp_get_playlist,
            logging::get_startup_logs,
            media_session::media_session_update,
            media_session::media_session_clear,
            mcp::mcp_start,
            mcp::mcp_stop,
            http_api::http_api_start,
            http_api::http_api_stop,
            mpd::mpd_start,
            mpd::mpd_stop,
            stream_server::stream_server_port,
            ytdlp_setup::ytdlp_ensure_installed,
            discord::discord_connect,
            discord::discord_disconnect,
            discord::discord_set_activity,
            discord::discord_clear_activity,
            bridge::bridge_respond,
            bridge::bridge_notify
        ])
        .setup(|app| {
            logging::mark_startup_complete();
            bridge::init_bridge(app.handle().clone());
            mcp::init_mcp(app.handle().clone());
            mpd::init_mpd(app.handle().clone());
            http_api::init_http_api(app.handle().clone());
            stream_server::init_stream_server(app.handle().clone());
            discord::init_discord(app.handle().clone());

            #[cfg(target_os = "linux")]
            maximize_for_gamescope(app);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
