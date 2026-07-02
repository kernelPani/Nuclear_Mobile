package com.nuclearplayer

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  private var webView: WebView? = null

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    this.webView = webView
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    requestNotificationPermission()
  }

  // Android 13+ requires runtime consent for POST_NOTIFICATIONS; without it the
  // media playback notification / lock-screen controls won't appear.
  private fun requestNotificationPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (
        checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
        PackageManager.PERMISSION_GRANTED
      ) {
        requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
      }
    }
  }

  // wry pauses the WebView when the activity is backgrounded, which freezes the
  // page's JavaScript. For a music player that means auto-advance to the next
  // track and the media-notification transport controls (which route through JS)
  // stop working while backgrounded, even though audio keeps playing. While the
  // foreground playback service is active, keep the WebView/JS alive so that
  // logic continues to run.
  override fun onPause() {
    super.onPause()
    if (PlaybackService.isRunning) {
      webView?.onResume()
      webView?.resumeTimers()
    }
  }

  override fun onStop() {
    super.onStop()
    if (PlaybackService.isRunning) {
      webView?.onResume()
      webView?.resumeTimers()
    }
  }
}
