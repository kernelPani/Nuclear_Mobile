//! Media-session commands. On Android these drive the native PlaybackService
//! (foreground service + MediaSessionCompat) via the Kotlin MediaSessionPlugin,
//! giving notification/lock-screen controls and background playback. On desktop
//! they are no-ops (the desktop OS media integration is handled elsewhere).

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaMetadata {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub artwork_url: Option<String>,
    pub is_playing: bool,
    pub position_ms: i64,
    pub duration_ms: i64,
}

#[cfg(target_os = "android")]
mod android {
    use std::sync::OnceLock;

    use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
    use tauri::Wry;

    use super::MediaMetadata;

    static PLUGIN: OnceLock<PluginHandle<Wry>> = OnceLock::new();

    pub fn init() -> TauriPlugin<Wry> {
        Builder::<Wry, ()>::new("media-session")
            .setup(|_app, api| {
                let handle =
                    api.register_android_plugin("com.nuclearplayer", "MediaSessionPlugin")?;
                let _ = PLUGIN.set(handle);
                Ok(())
            })
            .build()
    }

    pub fn update(metadata: MediaMetadata) -> Result<(), String> {
        let handle = PLUGIN
            .get()
            .ok_or_else(|| "media-session plugin is not initialized".to_string())?;
        handle
            .run_mobile_plugin::<serde_json::Value>("update", metadata)
            .map_err(|error| format!("media-session update failed: {error}"))?;
        Ok(())
    }

    pub fn clear() -> Result<(), String> {
        let handle = PLUGIN
            .get()
            .ok_or_else(|| "media-session plugin is not initialized".to_string())?;
        handle
            .run_mobile_plugin::<serde_json::Value>("clear", ())
            .map_err(|error| format!("media-session clear failed: {error}"))?;
        Ok(())
    }
}

#[cfg(target_os = "android")]
pub fn init() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    android::init()
}

#[tauri::command]
pub async fn media_session_update(metadata: MediaMetadata) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        android::update(metadata)
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = metadata;
        Ok(())
    }
}

#[tauri::command]
pub async fn media_session_clear() -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        android::clear()
    }
    #[cfg(not(target_os = "android"))]
    {
        Ok(())
    }
}
