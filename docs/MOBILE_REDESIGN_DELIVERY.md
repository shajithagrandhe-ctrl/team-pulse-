# Venture Plus Mobile Redesign Delivery

## Build

- App version: `1.2.1` (`versionCode` 4)
- Package: `com.ventureplus.mobile.preview`
- Variant: Android release, locally debug-signed
- Architecture: `arm64-v8a`
- Minimum SDK: 24
- Target SDK: 36
- API URL: `http://192.168.88.13:4000/api`
- APK: `artifacts/venture-plus-redesigned-1.2.1.apk`
- Desktop copy: `D:\shaji desktop\VenturePlus-Redesigned-1.2.1.apk`
- Size: 43,996,118 bytes
- SHA-256: `A782552CBEEF2C742E5AEB09EBB1303BFA360B80FEF0EAEFE2EDA19020F65D6F`

The APK verifies with Android APK Signature Scheme v2. It is signed with the
standard Android debug certificate because no production release keystore was
available in the project.

## Verification Performed

- TypeScript typecheck passed.
- ESLint passed.
- Component tests passed: 8/8.
- Unit, contract, and security tests passed: 25/25.
- Expo dependency validation passed.
- Expo Doctor passed: 21/21 checks.
- Production export succeeded for Android, iOS, and web.
- Android release APK assembly succeeded.
- APK package, version, ABI, signature, checksum, and embedded API URL were
  inspected. The packaged bundle contains
  `http://192.168.88.13:4000/api`.
- All four supplied role accounts authenticated successfully against the local backend during integration testing.
- Login screen was visually and interactively checked at a 390 x 844 mobile viewport.

## Manual Verification Remaining

No Android device or emulator was connected at delivery time, so installation
and native launch were not performed. The phone must be on the same network as
the backend host, and `http://192.168.88.13:4000/api/health` must remain
reachable. The final health check on 2026-10-14 timed out because that LAN
backend was not running or reachable at packaging time; this does not change the
verified address embedded in the APK. A production-distributed build should use
HTTPS, a stable hostname, and a protected release signing key.
