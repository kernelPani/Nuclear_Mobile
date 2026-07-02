buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")
        // Embeds a CPython runtime + pip packages (yt-dlp) into the APK so the
        // desktop yt-dlp flow works on Android, where downloading/executing a
        // native binary is not permitted.
        classpath("com.chaquo.python:gradle:16.1.0")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

tasks.register("clean").configure {
    delete("build")
}

