<div align="center">

# 🎵 Nuclear Mobile

### A native **Android** build of [Nuclear](https://github.com/nukeop/nuclear) — the free, open-source, ad-free music player

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android%207.0%2B-3DDC84?logo=android&logoColor=white)](#-compatibility--which-devices-can-run-it)
[![Architecture](https://img.shields.io/badge/arch-arm64--v8a-orange)](#-compatibility--which-devices-can-run-it)
[![Latest release](https://img.shields.io/github/v/release/kernelPani/Nuclear_Mobile?label=download&color=success)](https://github.com/kernelPani/Nuclear_Mobile/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/kernelPani/Nuclear_Mobile/total?color=success)](https://github.com/kernelPani/Nuclear_Mobile/releases)

**Search any song or artist, build playlists, install plugins, and listen — now in your pocket.**

[**⬇️ Download the APK**](https://github.com/kernelPani/Nuclear_Mobile/releases/latest) · [Install guide](#-installation-2-minutes-no-computer-needed) · [Compatibility](#-compatibility--which-devices-can-run-it) · [Build from source](#-building-from-source) · [Credits](#-credits--license)

</div>

---

> ### ℹ️ What this is (and isn't)
> **Nuclear Mobile is an independent, community Android port** of [Nuclear by **nukeop**](https://github.com/nukeop/nuclear). It reuses Nuclear's React frontend and Rust backend and adds only the Android-specific layer.
>
> It is **not official** and **not affiliated with or endorsed by** nukeop. The upstream project [does not accept external contributions](https://github.com/nukeop/nuclear/blob/master/CONTRIBUTING.md), so this port lives as its own fork under the same **AGPL-3.0** license, which expressly permits it. All credit for Nuclear itself goes to nukeop and the upstream contributors — this repo only adds the mobile build. See [Credits](#-credits--license).

---

## ✨ What you get

- 🔎 **Search & stream** music from any source, right on your phone
- 🎨 **Mobile-first UI** — bottom tab bar (Dashboard / Search / Plugins / Preferences), a persistent mini-player, and layouts sized for touch and for Android's gesture/navigation bar
- 🔌 **Full plugin system** — download, install and run plugins from the built-in store, exactly like on desktop
- ▶️ **Real YouTube playback** — the actual `yt-dlp` engine runs *inside* the app (embedded Python), so YouTube sources work just like on the desktop version — no external binaries, no companion server
- 🔒 **Native media controls** — play / pause / next / previous / seek and album art on your **lock screen and notification shade**
- 🎧 **Background playback** — keeps playing (and auto-advances the queue) when the screen is off or you switch apps
- 📚 Artist & album pages, queue management, favorites, playlists, themes
- 🚫 **No ads, no tracking, no account required** — same philosophy as upstream Nuclear

## 📱 Screenshots

> _Screenshots are added per release. Want to see it live? [Install it](#-installation-2-minutes-no-computer-needed) — it takes two minutes._

<!-- SCREENSHOTS:START -->
<!-- images added in docs/screenshots/ -->
<!-- SCREENSHOTS:END -->

## ✅ Compatibility — which devices can run it?

| Requirement | Details |
|---|---|
| **Android version** | **Android 7.0 (Nougat) or newer** — API level 24+ |
| **Processor (very important)** | **64-bit ARM only (`arm64-v8a`)** — this is the chip in essentially every mainstream phone made since ~2016: Qualcomm **Snapdragon**, Samsung **Exynos**, MediaTek **Helio/Dimensity**, Google **Tensor**, HiSilicon **Kirin**, etc. |
| **RAM** | 2 GB or more recommended (the app carries an embedded Python runtime for yt-dlp) |
| **Free storage** | ≈ 200 MB installed |
| **Internet** | Required — Nuclear streams music, it doesn't bundle it |

**In plain terms:** if you have a normal Android phone from the last several years, **it will run.** ✅

**What is _not_ supported** ❌
- **32-bit-only devices** (very old or ultra-budget phones that are `armeabi-v7a` only)
- **Intel / x86 / x86_64 devices** (a few old tablets — and this is why it won't install on a standard Android Studio x86 **emulator**; use a real phone or an arm64 emulator)
- Android TV / Wear OS / Chromebooks are untested

> 🧪 **Tested on:** Samsung Galaxy S25 (SM-S931B), Android 15 — full end-to-end: install, plugin store, search, YouTube playback, background audio, and lock-screen controls. Android 7.0 is the *declared* minimum from the build config; if you run it on an older device, let me know how it goes in [Issues](https://github.com/kernelPani/Nuclear_Mobile/issues).

## 🚀 Installation (2 minutes, no computer needed)

1. On your phone, open the **[Releases page](https://github.com/kernelPani/Nuclear_Mobile/releases/latest)** and download the `.apk` file (e.g. `Nuclear-Mobile-arm64.apk`).
2. Tap the downloaded file. Android will ask permission to **install from this source** the first time — allow it (Settings → *Install unknown apps* → your browser → *Allow*).
3. Tap **Install**, then **Open**. Done — grant the notification permission when asked so media controls show up. 🎉

**Prefer a computer?** With [ADB](https://developer.android.com/tools/adb):

```bash
adb install Nuclear-Mobile-arm64.apk
```

> 🔐 The APK is signed with the project's release key. Because it's not distributed through the Play Store, Android's "unknown sources" prompt is expected and normal for sideloaded open-source apps.

## 🛠️ Building from source

The desktop app is unchanged — this only adds an Android target. Full build notes, architecture, and signing details live in **[README_MOBILE.md](README_MOBILE.md)**.

**Requirements:** Android SDK + NDK · Rust with Android targets (`rustup target add aarch64-linux-android`) · Node + pnpm · **Python 3.12** (used by [Chaquopy](https://chaquo.com/chaquopy/) at build time only).

```bash
pnpm install

# Debug APK — no keystore needed, installs directly (easiest way to try a build):
pnpm --filter @nuclearplayer/player tauri android build --target aarch64 --apk --debug
```

The build machine's Python is auto-detected (`py -3.12` on Windows, `python3.12` on Linux/macOS), so it's portable across operating systems.

## 🧩 How the port works (the interesting parts)

- **Networking is deterministic on Android.** All plugin/API traffic goes through the native Rust `http_fetch` (reqwest), switched to a **bundled Mozilla CA store** — the default `rustls-platform-verifier` path hangs over JNI on-device. The local audio-stream proxy runs over loopback with a scoped `network_security_config`.
- **YouTube via real yt-dlp.** Android can't execute a downloaded binary, so the genuine `yt-dlp` PyPI package is embedded through **Chaquopy** (CPython 3.12 in the APK) and bridged to the existing `ytdlp_*` commands — same JSON contract, zero frontend changes.
- **Native media session.** A foreground service + `MediaSessionCompat` drives the notification / lock-screen controls and keeps the WebView alive so playback and queue auto-advance survive in the background.
- **One codebase.** Everything mobile is behind Tailwind `sm:` breakpoints and runtime platform checks — the desktop build (Windows/macOS/Linux) is byte-for-byte unaffected.

## 🙏 Credits & License

- **Nuclear** — the original app, its design, and the entire desktop implementation — is created and maintained by **[nukeop](https://github.com/nukeop)** and the [Nuclear contributors](https://github.com/nukeop/nuclear/graphs/contributors). Please **star and support the original project**: 👉 https://github.com/nukeop/nuclear
- **Android / mobile port:** [@kernelPani](https://github.com/kernelPani).
- Uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) (via [Chaquopy](https://chaquo.com/chaquopy/)) and [Tauri](https://tauri.app/).

Licensed under **[AGPL-3.0-only](LICENSE)**, the same license as upstream Nuclear. The original license and authorship are preserved in full. If you distribute this app or a modified version, you must make the corresponding source available under the same license.

> ⚖️ **Note on sources:** Nuclear Mobile is a player; it does not host any music. Streaming from third-party services may be subject to those services' terms. Use it for personal, lawful listening.

---

<div align="center">
<sub>Made with ❤️ for people who just want their music on their phone. Not affiliated with nukeop or the Nuclear project.</sub>
</div>
