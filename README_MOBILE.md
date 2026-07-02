# Nuclear Mobile — Android port

**Nuclear Mobile** is an Android port of [Nuclear](https://github.com/nukeop/nuclear),
the free, open-source, ad-free music player created by
[**nukeop**](https://github.com/nukeop) and its contributors.

This repository takes the existing Tauri 2 (Rust + React) desktop app and makes
it run as a native Android app, reusing the same frontend and Rust backend and
adding only the platform-specific pieces Android needs. It is **not** a rewrite
and does not fork away from the original — the goal is for this work to
(hopefully) be contributed back upstream.

> Nuclear is licensed under **AGPL-3.0-only**. This port keeps the same license
> and preserves the original authorship. All credit for Nuclear itself goes to
> nukeop and the upstream contributors; this repository only adds the Android
> mobile layer.

## What the mobile port adds

- **Builds & runs on Android** via Tauri's mobile target (`tauri android`),
  arm64-v8a.
- **Responsive mobile shell** — bottom tab bar (Dashboard / Search / Plugins /
  Preferences), a persistent mini player, safe-area insets, and mobile-sized
  layouts. The desktop UI is unchanged (all changes are behind Tailwind `sm:`
  breakpoints / platform checks).
- **Networking that works on Android** — all plugin/API traffic goes through the
  native Rust `http_fetch` (reqwest), switched to a bundled Mozilla CA store so
  TLS is deterministic on Android; the local stream proxy runs over loopback
  with a scoped `network_security_config`.
- **Plugins work** — download, compile (esbuild-wasm) and run exactly like on
  desktop.
- **YouTube playback via real yt-dlp** — since Android can't run a downloaded
  binary, `yt-dlp` (the real PyPI package) is embedded through
  [Chaquopy](https://chaquo.com/chaquopy/) and bridged to the existing
  `ytdlp_*` commands, so behavior matches the desktop app.
- **Native media controls & background playback** — a foreground service with
  `MediaSessionCompat` drives the notification / lock-screen controls
  (play / pause / next / previous / seek + artwork) and keeps audio alive in the
  background.

Desktop platform-only features (updater, MPD server, Discord Rich Presence,
window state) are cleanly gated off on Android.

## Try it (no build required)

The quickest way to test on a phone is to install a prebuilt APK — no toolchain
needed:

1. Download the latest `.apk` from the
   [**Releases**](https://github.com/kernelPani/Nuclear_Mobile/releases) page.
2. Copy it to an Android device (arm64 / most phones from the last several years)
   and open it, allowing "install from unknown sources" when prompted, **or**
   `adb install nuclear-mobile.apk` from a computer.

That's it — the app is self-contained (Python/yt-dlp is bundled inside the APK).

## Building

Requirements: Android SDK + NDK, Rust with Android targets
(`rustup target add aarch64-linux-android ...`), Node + pnpm, and a
build-machine Python 3.12 (used by Chaquopy at build time only).

```bash
pnpm install

# Debug APK — no keystore needed (debug-signed, installable directly)
pnpm --filter @nuclearplayer/player tauri android build --target aarch64 --apk --debug

# Signed release APK (needs gen/android/keystore.properties — see below)
pnpm --filter @nuclearplayer/player tauri android build --target aarch64 --apk
```

The **debug** command is the zero-config way to build and try it — it's signed
with the Android debug key, so it installs without you creating a keystore. A
keystore is only needed for a distributable **release** APK.

Release signing is read from `gen/android/keystore.properties` (git-ignored):

```properties
storeFile=/absolute/path/to/your.keystore
storePassword=...
keyAlias=...
keyPassword=...
```

The desktop app still builds and runs exactly as upstream (`pnpm dev`,
`pnpm tauri build`).

## Credits

- Original app, design and desktop implementation:
  [Nuclear](https://github.com/nukeop/nuclear) by **nukeop** and contributors.
- Android / mobile port: [@kernelPani](https://github.com/kernelPani).
