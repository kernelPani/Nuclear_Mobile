package com.nuclearplayer

import android.app.Activity
import android.content.Intent
import android.webkit.WebView
import androidx.core.content.ContextCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin

@InvokeArg
class UpdateArgs {
    var title: String = ""
    var artist: String = ""
    var album: String = ""
    var artworkUrl: String? = null
    var isPlaying: Boolean = false
    var positionMs: Long = 0
    var durationMs: Long = 0
}

// Bridges the JS media-session handler to the native PlaybackService. `update`
// pushes now-playing metadata/state into the foreground service (which drives
// the notification + lock-screen controls); the service forwards transport
// actions back here, and we emit them to JS as the "action" plugin event.
@TauriPlugin
class MediaSessionPlugin(private val activity: Activity) : Plugin(activity) {
    private var webView: WebView? = null

    companion object {
        var instance: MediaSessionPlugin? = null
    }

    override fun load(webView: WebView) {
        super.load(webView)
        this.webView = webView
        instance = this
    }

    // Deliver transport actions straight into the page via evaluateJavascript.
    // The Tauri plugin event channel (trigger/addPluginListener) does not route
    // for an app-local plugin registered via register_android_plugin, so we call
    // a global function the JS media-session handler installs.
    fun emitAction(action: String, seekTime: Long) {
        val view = webView ?: return
        val script =
            "window.__nuclearMediaAction && window.__nuclearMediaAction('$action', $seekTime)"
        activity.runOnUiThread {
            view.evaluateJavascript(script, null)
        }
    }

    @Command
    fun update(invoke: Invoke) {
        val args = invoke.parseArgs(UpdateArgs::class.java)
        val intent = Intent(activity, PlaybackService::class.java).apply {
            action = PlaybackService.ACTION_UPDATE
            putExtra("title", args.title)
            putExtra("artist", args.artist)
            putExtra("album", args.album)
            putExtra("artworkUrl", args.artworkUrl)
            putExtra("isPlaying", args.isPlaying)
            putExtra("positionMs", args.positionMs)
            putExtra("durationMs", args.durationMs)
        }
        ContextCompat.startForegroundService(activity, intent)
        invoke.resolve()
    }

    @Command
    fun clear(invoke: Invoke) {
        val intent = Intent(activity, PlaybackService::class.java).apply {
            action = PlaybackService.ACTION_STOP
        }
        activity.startService(intent)
        invoke.resolve()
    }
}
