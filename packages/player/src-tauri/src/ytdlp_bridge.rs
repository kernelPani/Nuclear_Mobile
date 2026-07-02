//! Android bridge to the embedded yt-dlp (Python via Chaquopy).
//!
//! The desktop build runs the yt-dlp binary as a child process. Android can't
//! do that, so `run_ytdlp` on Android forwards the same argv to the Kotlin
//! `YtdlpPlugin`, which executes it against the bundled CPython yt-dlp and
//! returns stdout. Because the output matches the CLI byte-for-byte, all of the
//! parsing in ytdlp.rs is shared between desktop and Android.

use std::sync::OnceLock;

use serde::{Deserialize, Serialize};
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
use tauri::Wry;

static PLUGIN: OnceLock<PluginHandle<Wry>> = OnceLock::new();

#[derive(Serialize)]
struct RunArgs {
    args: Vec<String>,
}

#[derive(Deserialize)]
struct RunResult {
    stdout: String,
}

pub fn init() -> TauriPlugin<Wry> {
    Builder::<Wry, ()>::new("ytdlp")
        .setup(|_app, api| {
            let handle = api.register_android_plugin("com.nuclearplayer", "YtdlpPlugin")?;
            let _ = PLUGIN.set(handle);
            Ok(())
        })
        .build()
}

pub fn run(args: &[&str]) -> Result<String, String> {
    let handle = PLUGIN
        .get()
        .ok_or_else(|| "yt-dlp plugin is not initialized".to_string())?;
    let payload = RunArgs {
        args: args.iter().map(|arg| arg.to_string()).collect(),
    };
    let result: RunResult = handle
        .run_mobile_plugin("run", payload)
        .map_err(|error| format!("yt-dlp bridge failed: {error}"))?;
    Ok(result.stdout)
}
