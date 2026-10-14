# Android Test APK

> Historical checkpoint. Superseded by `MOBILE_REDESIGN_DELIVERY.md`; do not use
> the version, endpoint, checksum, or output path below for the current build.

Delivered 2026-10-14: `D:\shaji desktop\VenturePlus.apk`.
Project copy: `mobile/dist/apk/VenturePlus.apk`.
Debug-signed release variant, login/account foundation only; not a store release.
No device install/launch/login verification has been performed.

The physical build snapshot is `D:\vapk\mobile`, containing mobile/shared source
and dependencies only. This avoids canonical Windows paths exceeding 260 chars.
Source and lockfile hashes were checked against the original before building.
The earlier junction/subst approaches failed; do not use them for this build.

Run in `D:\vapk\mobile\android` with these process-local settings:

```powershell
$tools='D:\shaji downloads\venture +fnl\android-tools'
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME="$tools\sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:ANDROID_USER_HOME="$tools\android-user"
$env:GRADLE_USER_HOME="$tools\gradle-cache"
$env:TEMP="$tools\tmp"
$env:TMP=$env:TEMP
$env:EXPO_NO_TELEMETRY='1'
$env:EXPO_PUBLIC_BUILD_CHANNEL='local-preview'
$env:EXPO_PUBLIC_API_URL='http://10.214.67.200:4000/api'
$env:NODE_ENV='production'
$env:CMAKE_BUILD_PARALLEL_LEVEL='2'
.\gradlew.bat :app:assembleRelease `
  '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a' `
  '-Pandroid.cmakeVersion=3.31.6' `
  '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -Djbr.java.io.use.nio=false' `
  --no-daemon --max-workers=2 --console=plain
```

Output: `app/build/outputs/apk/release/app-release.apk`.
Gradle 9.3.1 completed 507 tasks in 1h 10m 33s. Dependency deprecation and
metaspace warnings occurred, but the build exited successfully.
The JBR flag selects standard JVM filesystem handling for this build process.
No global PATH or SDK settings were changed.

APK v2 signature verification passed with SDK build-tools 36.0.0 apksigner.
Package: `com.ventureplus.mobile.preview`; version 1.0.0 (1), min SDK 24,
target SDK 36. Size 53,954,025 bytes. SHA256:
`188C04C1A9CE6432EEBED40A843C9479D0E1FF04D328836258BD5D9DEC3186DC`.

The backend and XAMPP MySQL must be running, with the phone on a reachable local
network. The preview allows HTTP only to its configured private host. Rebuild
after an IP change. Production needs a hosted HTTPS API, production signing,
permission review, full feature implementation and native-device QA.
