import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.chaquo.python")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

android {
    compileSdk = 36
    namespace = "com.nuclearplayer"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "com.nuclearplayer"
        minSdk = 24
        targetSdk = 36
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
        // Chaquopy builds a Python runtime per ABI; restrict to the ABIs we ship
        // so the build stays fast. arm64-v8a covers modern devices (matches the
        // aarch64 Rust target).
        ndk {
            abiFilters += listOf("arm64-v8a")
        }
    }

    // Chaquopy: embed Python 3.12 + yt-dlp. buildPython is the build-machine
    // Python (used only at build time for pip + assembling the stdlib). These
    // are portable fallbacks tried in order, so any OS with Python 3.12 on PATH
    // works: `py -3.12` (Windows launcher), then `python3.12` (Linux/macOS).
    chaquopy {
        defaultConfig {
            version = "3.12"
            buildPython("py", "-3.12")
            buildPython("python3.12")
            pip {
                install("yt-dlp")
            }
        }
    }
    // Release signing. Credentials live in keystore.properties (gitignored).
    val keystorePropsFile = rootProject.file("keystore.properties")
    val keystoreProps = Properties().apply {
        if (keystorePropsFile.exists()) {
            keystorePropsFile.inputStream().use { load(it) }
        }
    }
    signingConfigs {
        if (keystorePropsFile.exists()) {
            create("release") {
                storeFile = file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            // R8 minification is disabled: Tauri loads plugins by class name via
            // reflection (register_android_plugin) and Chaquopy resolves Python
            // classes reflectively, so shrinking would need extensive keep rules.
            // Stripping debug symbols (default in release) already shrinks the APK
            // dramatically vs. the debug build.
            isMinifyEnabled = false
            if (keystorePropsFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

// The Tauri rust plugin always declares per-ABI product flavors (arm, x86,
// x86_64) in addition to arm64/universal. Chaquopy validates every configured
// variant and Python 3.12 has no armeabi-v7a/x86 wheels, which fails the build.
// We only ship arm64-v8a, so disable the flavors we don't build.
androidComponents {
    beforeVariants(selector().all()) { variant ->
        val keptFlavors = setOf("arm64", "universal", "x86_64")
        if (variant.flavorName !in keptFlavors) {
            variant.enable = false
        }
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    // MediaSessionCompat + MediaStyle notification for lock-screen/notification
    // media controls and background playback.
    implementation("androidx.media:media:1.7.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")