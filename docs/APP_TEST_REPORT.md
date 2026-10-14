# Current App Test Report

> Historical implementation log. Current redesign verification is recorded in
> `MOBILE_REDESIGN_DELIVERY.md`.

2026-10-13. Interim foundation/authentication checkpoint, not full-app acceptance.

| Check | Actual Command/Method | Result |
|---|---|---|
| Original clean install | Isolated temporary copy npm ci --ignore-scripts --no-audit --no-fund | PASS, 763 packages (earlier audit batch) |
| Original web build | npm run build -w client | PASS; existing ~670 KB bundle warning |
| Original web TS | node ../node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json from client | PASS |
| Original web tests | npm run test -w client | PASS, 5 tests |
| Backend TS | node ../node_modules/typescript/bin/tsc -p tsconfig.json from server | PASS |
| Backend regressions | node --test tests/*.test.mjs from server | PASS, 19 tests |
| Prisma client | npm run prisma:generate from server | PASS, Prisma 5.22.0 |
| Local additive migration | npm run prisma:deploy from server after local host/database verification | PASS, AuthSession only |
| Local DB | Read-only prisma.authSession.count | PASS, connection/table verified, zero sessions at check |
| Health/web availability | GET /api/health and /backend-auth | PASS, 200 |
| Mobile install | npm install --ignore-scripts --no-audit --no-fund --workspaces=false from mobile | PASS |
| SDK versions | EXPO_NO_TELEMETRY=1 npx expo install --check | PASS after version alignment |
| Mobile TS | npm run typecheck from mobile | PASS |
| Mobile lint | npm run lint from mobile | PASS after provider fixes; no rules disabled |
| Mobile transport | npm run test from mobile | PASS, 7 tests |
| Expo diagnostics | EXPO_NO_TELEMETRY=1 npm run doctor | PASS, 21/21 |
| Native JS export | EXPO_NO_TELEMETRY=1 npm run bundle | PASS, Android/iOS Hermes + web; not signed binaries |
| Public native UI | Browser at emulated 390x844 and 1440x1000 | Logo loads; zero horizontal control overflow; no console errors |
| Protected native UI | Source only, per user instruction | NOT browser/device exercised |
| Existing web/server lint | Initial audit commands | FAIL: web 66 errors/30 warnings; server ESLint config absent. Not rerun as a passing claim |
| Android APK/AAB/device | adb devices -l; SDK/toolchain inspection | NOT RUN: no device, no emulator, Java not on PATH |
| iOS IPA/device | Host inspection | NOT RUN: Windows, no Apple tooling/signing |

## Coverage Boundaries

Backend tests use isolated mocked Prisma methods and real local HTTP/SSE/WS
servers. They do not create/modify business database records. Auth uses bcrypt
fixture hashes, persisted-session fixture maps and production CSRF middleware.
It verifies actual handlers/services for native and cookie login, role sourcing,
bad credentials, session revocation/expiry, password changes, protected routes,
signup permissions and account status. It is not proof of a live-device login.

Transport tests cover configuration, bearer headers/no cookies, URL/query handling,
missing and expired sessions, stale responses, multipart boundaries, cancellation,
timeouts, malformed responses and safe network/internal-error messages.

Multipart coverage uses memory storage and real parsing. Actual venture disk
storage, interrupted upload cleanup and file-content verification are not covered.
Protected account interactions, native keychain/keystore behavior, keyboard and
screen-reader behavior still require native/component validation. Customer,
employee/agent/admin feature modules and their tests are pending.

## Environment Failures and Limits

Expo initially selected incompatible optional worklets/screens versions; these
were pinned to SDK requirements. Initial provider lint and upload-error TS issues
were repaired and rerun. Doctor ignore warnings were repaired with mobile ignore
rules. Normal dev warnings about NO_COLOR are not application failures.

React Native DevTools extraction failed with OS error 112. C: free space was
174,354,432 bytes (about 166 MiB); D: still has room. No broad filesystem cleanup
was attempted. Free several GB before installing native tools; Android builds
need substantially more space. No connected Android device or emulator is
available; no macOS/Xcode is available. Production HTTPS/API URL, hosting and
signing credentials are not verified. Do not treat bundle export as release-ready.

## Android Test APK Follow-Up (2026-10-14)

This supersedes the earlier Android build/toolchain limitation, not the device
validation limitation. Mobile typecheck/lint passed; mobile tests now pass 8 tests,
including production/preview network configuration isolation.

- `:app:assembleRelease` passed (507 tasks). Release variant uses a debug/test
  signing key, not production signing. APK v2 signature verification passed.
- Package `com.ventureplus.mobile.preview`, label `Venture Plus Test`, version
  1.0.0 (1), minimum Android 7.0/API 24, target API 36; ARM64 and ARM32.
- APK ZIP contains `assets/index.android.bundle`, `classes.dex`, and 42 native
  library entries. The embedded bundle contains `10.214.67.200:4000/api`.
- Desktop: `D:\shaji desktop\VenturePlus.apk`. Identical project copy:
  `mobile/dist/apk/VenturePlus.apk`. Size: 53,954,025 bytes.
- SHA256 of both copies:
  `188C04C1A9CE6432EEBED40A843C9479D0E1FF04D328836258BD5D9DEC3186DC`.
- Login/account foundation only. Customer/staff/admin business modules remain
  pending. No physical device/emulator install, launch, login, or SecureStore
  validation was performed. This is not a production-ready/full-app release.
- Local API health passed during packaging setup, but MySQL was unavailable.
  Start XAMPP MySQL and keep the backend running on the same reachable network
  as the phone. Private HTTP is limited to the preview host; production requires
  HTTPS. A changed PC IP requires rebuilding this test APK.

Android SDK/tools and Gradle cache are under the workspace `android-tools`.
JBR Java 21 is supplied through the process environment. A physical source and
dependency snapshot at `D:\vapk\mobile` avoids Windows canonical long-path
failures; original application files were not moved. CMake 3.31.6/Ninja 1.12.1
were used. The build command and settings are recorded in `APK_BUILD.md`.
