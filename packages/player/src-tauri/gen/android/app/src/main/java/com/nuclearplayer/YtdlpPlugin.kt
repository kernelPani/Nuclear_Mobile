package com.nuclearplayer

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform

@InvokeArg
class RunArgs {
    var args: List<String> = emptyList()
}

// Bridges the desktop yt-dlp command surface to the embedded CPython runtime.
// The Rust side (ytdlp.rs on Android) hands us the exact argv it would give the
// yt-dlp binary; we run it through nuclear_ytdlp.run() and return stdout, so all
// of the existing Rust output parsing is reused untouched.
@TauriPlugin
class YtdlpPlugin(private val activity: Activity) : Plugin(activity) {
    private fun ensurePythonStarted() {
        if (!Python.isStarted()) {
            Python.start(AndroidPlatform(activity.applicationContext))
        }
    }

    @Command
    fun run(invoke: Invoke) {
        try {
            ensurePythonStarted()
            val args = invoke.parseArgs(RunArgs::class.java)
            val module = Python.getInstance().getModule("nuclear_ytdlp")
            val stdout = module.callAttr("run", args.args.toTypedArray()).toString()
            val result = JSObject()
            result.put("stdout", stdout)
            invoke.resolve(result)
        } catch (error: Exception) {
            invoke.reject(error.message ?: "yt-dlp execution failed")
        }
    }
}
