package com.nuclearplayer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.media.session.MediaButtonReceiver
import java.net.URL
import kotlin.concurrent.thread

// Foreground service that owns the MediaSessionCompat. The audio itself plays in
// the WebView; this service surfaces the now-playing metadata + transport
// controls to the notification and lock screen, and keeps the process alive
// while backgrounded. Transport actions from the system are forwarded to JS via
// MediaSessionPlugin.actionListener.
class PlaybackService : Service() {
    private lateinit var session: MediaSessionCompat
    private val mainHandler = Handler(Looper.getMainLooper())

    private var currentTitle = ""
    private var currentArtist = ""
    private var currentAlbum = ""
    private var currentDurationMs = 0L
    private var currentPositionMs = 0L
    private var currentIsPlaying = false
    private var artworkUrl: String? = null
    private var artworkBitmap: Bitmap? = null

    companion object {
        const val CHANNEL_ID = "nuclear_playback"
        const val NOTIFICATION_ID = 1001
        const val ACTION_UPDATE = "com.nuclearplayer.action.UPDATE"
        const val ACTION_STOP = "com.nuclearplayer.action.STOP"

        // True while the foreground service holds a media notification. Used by
        // MainActivity to keep the WebView (and thus playback/queue JS) alive
        // when the app is backgrounded.
        @Volatile
        var isRunning = false
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        session = MediaSessionCompat(this, "NuclearPlayback")
        session.setFlags(
            MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or
                MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS,
        )
        session.setCallback(object : MediaSessionCompat.Callback() {
            override fun onPlay() = forward("play", 0)
            override fun onPause() = forward("pause", 0)
            override fun onSkipToNext() = forward("next", 0)
            override fun onSkipToPrevious() = forward("previous", 0)
            override fun onStop() = forward("stop", 0)
            override fun onSeekTo(pos: Long) = forward("seek", pos)
        })
        session.isActive = true
    }

    private fun forward(action: String, seekTime: Long) {
        MediaSessionPlugin.instance?.emitAction(action, seekTime)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        MediaButtonReceiver.handleIntent(session, intent)
        when (intent?.action) {
            ACTION_STOP -> {
                stopPlayback()
                return START_NOT_STICKY
            }
            ACTION_UPDATE -> applyUpdate(intent)
        }
        return START_NOT_STICKY
    }

    private fun applyUpdate(intent: Intent) {
        currentTitle = intent.getStringExtra("title") ?: ""
        currentArtist = intent.getStringExtra("artist") ?: ""
        currentAlbum = intent.getStringExtra("album") ?: ""
        currentIsPlaying = intent.getBooleanExtra("isPlaying", false)
        currentPositionMs = intent.getLongExtra("positionMs", 0)
        currentDurationMs = intent.getLongExtra("durationMs", 0)

        val newArtworkUrl = intent.getStringExtra("artworkUrl")
        if (newArtworkUrl != artworkUrl) {
            artworkUrl = newArtworkUrl
            artworkBitmap = null
            loadArtwork(newArtworkUrl)
        }

        refresh()
    }

    private fun refresh() {
        session.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, currentAlbum)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, currentDurationMs)
                .apply {
                    artworkBitmap?.let {
                        putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, it)
                    }
                }
                .build(),
        )

        val actions = PlaybackStateCompat.ACTION_PLAY or
            PlaybackStateCompat.ACTION_PAUSE or
            PlaybackStateCompat.ACTION_PLAY_PAUSE or
            PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
            PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
            PlaybackStateCompat.ACTION_SEEK_TO or
            PlaybackStateCompat.ACTION_STOP
        val state =
            if (currentIsPlaying) PlaybackStateCompat.STATE_PLAYING
            else PlaybackStateCompat.STATE_PAUSED
        session.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, currentPositionMs, 1.0f)
                .build(),
        )

        startForeground(NOTIFICATION_ID, buildNotification())
        isRunning = true
    }

    private fun buildNotification(): Notification {
        val contentIntent = packageManager.getLaunchIntentForPackage(packageName)?.let {
            PendingIntent.getActivity(
                this,
                0,
                it,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )
        }

        val playPause = if (currentIsPlaying) {
            NotificationCompat.Action(
                android.R.drawable.ic_media_pause,
                "Pause",
                MediaButtonReceiver.buildMediaButtonPendingIntent(
                    this,
                    PlaybackStateCompat.ACTION_PLAY_PAUSE,
                ),
            )
        } else {
            NotificationCompat.Action(
                android.R.drawable.ic_media_play,
                "Play",
                MediaButtonReceiver.buildMediaButtonPendingIntent(
                    this,
                    PlaybackStateCompat.ACTION_PLAY_PAUSE,
                ),
            )
        }
        val previous = NotificationCompat.Action(
            android.R.drawable.ic_media_previous,
            "Previous",
            MediaButtonReceiver.buildMediaButtonPendingIntent(
                this,
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS,
            ),
        )
        val next = NotificationCompat.Action(
            android.R.drawable.ic_media_next,
            "Next",
            MediaButtonReceiver.buildMediaButtonPendingIntent(
                this,
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT,
            ),
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setLargeIcon(artworkBitmap)
            .setContentIntent(contentIntent)
            .setDeleteIntent(
                MediaButtonReceiver.buildMediaButtonPendingIntent(
                    this,
                    PlaybackStateCompat.ACTION_STOP,
                ),
            )
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .addAction(previous)
            .addAction(playPause)
            .addAction(next)
            .setStyle(
                androidx.media.app.NotificationCompat.MediaStyle()
                    .setMediaSession(session.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2),
            )
            .build()
    }

    private fun loadArtwork(url: String?) {
        if (url.isNullOrEmpty()) return
        thread {
            try {
                val connection = URL(url).openConnection()
                connection.connectTimeout = 15000
                connection.readTimeout = 15000
                connection.connect()
                val bitmap = BitmapFactory.decodeStream(connection.getInputStream())
                if (bitmap != null && url == artworkUrl) {
                    mainHandler.post {
                        artworkBitmap = bitmap
                        refresh()
                    }
                }
            } catch (_: Exception) {
                // Artwork is best-effort; ignore failures.
            }
        }
    }

    private fun stopPlayback() {
        isRunning = false
        session.isActive = false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        isRunning = false
        session.release()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Playback",
                NotificationManager.IMPORTANCE_LOW,
            )
            channel.setShowBadge(false)
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }
}
