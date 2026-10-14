# Venture Plus architecture and implementation plan

2026-10-13. Prepared after source/visual audit and before mobile implementation.

## Structure and Decisions

Keep `client/`, `server/`, `database/` and existing root commands. Add `mobile/`
as an independently installed Expo package, `shared/` for compatible pure TS
contracts/constants, and the required `docs/APP_*.md` records.

Expo SDK 57's official dependency table uses React 19.2.3 / React Native 0.86;
the existing web uses React 18. This is a concrete reason to isolate native
dependencies and prevent Metro from resolving the web's React. Do not upgrade
the web to accommodate mobile. Root commands delegate with `npm --prefix mobile`;
root web/server workspace install/build remains intact. Metro watches shared
pure source only. No database duplication or second authentication provider.

References: https://docs.expo.dev/versions/latest/ and
https://docs.expo.dev/router/installation/ (verified 2026-10-13).
Registry template: Expo ~57.0.28, React 19.2.3, React Native 0.86.3.
Exact installed dependency/doctor results must be recorded after setup.

## Shared Code and API

Reuse existing statuses/roles and API field shapes in pure TS contracts.
Keep browser and native transport/storage adapters separate. Backend Prisma
models remain authoritative. Avoid importing React DOM, cookies/document,
FileReader, canvas or DOMParser into native. API base URL comes from
EXPO_PUBLIC_API_URL and must be reachable from the device; physical devices
cannot use localhost. Production requires HTTPS and explicit environment config.

Native API client: typed envelopes, validated boundary data, timeouts/AbortSignal,
normalized errors, current-session bearer handling and multipart requests.
Paginated queries follow pageCount/page/pageSize; never treat 1000 requested
records as a complete result. Query caches clear on session changes and use
user-specific keys. Mutation success is solely the backend's response.

## Authentication Strategy

Existing web cookie/CSRF behavior stays intact. Current login does not return
an access token, and native cannot rely on browser-readable CSRF cookies.
Phase 4 requires a small native-only token-issuance path backed by the existing
login/password service. Native stores tokens with Expo SecureStore, not
AsyncStorage/localStorage. Bearer requests must not silently fall back to cookies.
Any CSRF adaptation must verify explicit bearer authorization and retain cookie
protection; test both web and native paths in production-mode middleware.

Durable logout/password-change revocation is still required. Prefer an additive
session record keyed by JWT identifier over an in-memory denylist, with expiry
and revocation and existing user linkage. This is a justified auth enhancement,
not a UI-driven schema change. Do not deploy/migrate production without approval;
local additive migration must be inspected and checked against a local DB first.
Existing cookie sessions need an explicit compatibility/reauthentication strategy.

## Permissions Matrix

| Capability | ADMIN | EMPLOYEE | AGENT | CUSTOMER |
| --- | --- | --- | --- | --- |
| Own account/password/logout | Yes | Yes | Yes | Yes |
| Inventory reads | All | Assigned venture/location scope | Existing inventory read scope | Own lead-associated properties |
| Plot detail/status writes | Yes | Assigned scope | Read only | Read only; own nested leads |
| Lead reads | All | Assigned plot scope | agentId=own ID | email=own email |
| Lead mutations | Yes | Assigned plot scope | No | No |
| Customer record reads | All | Persisted owner aliases | Persisted owner aliases | Exact email in legacy notes |
| Customer record mutations | Yes | Owned records | No | No |
| Customer credentials | Yes | Active account | No | No |
| Tracking reads/writes | All | Owned records | Owned records | Own records; read only |
| Favorites | Permitted plots | Permitted plots | Permitted plots | Permitted plots |
| Inquiry submit/directory | Supported | Supported | Supported | Supported |
| Venture/media/layout mutations | Yes | No | No | No |
| Employee administration | Yes | No | No | No |

Backend guards remain the final authority. Legacy owner-alias collisions and
notes ownership are documented limitations; no stronger schema relationship is
invented or assumed. No role is granted unsupported mutation capabilities.

## Sequence and Tests

1. Verify critical source/permission repairs and original build. Record existing
   lint failures as release work rather than silently disabling lint rules.
2. Complete UI reference/role/screen inventory (APP_UI_PLAN).
3. Install/pin Expo; typecheck, dependency doctor and native bundle validation.
   Original web/server builds must still pass.
4. Implement typed client, secure auth/session restoration and native/web auth
   regressions before feature modules.
5. Customer browsing then favorites/inquiries/records/tracking, one module at a time.
6. Employee/agent workflows then admin inventory, geometry, employees and reports.
7. Verify realtime, files/maps and failed/retried/offline interactions against real API.
8. Run original web regression, native component/unit/API integration tests,
   Android validation where tooling exists, and iOS validation where supported.
9. Publish deployment/test/completion records, distinguishing implemented,
   tested, buildable, deployment-ready and actually deployed.

Test fixtures are limited to isolated tests. Never fake feature success or run
destructive tests on production. Document commands/results after every module.

## Deployment and Remaining Infrastructure

Web remains Vite static hosting. API needs a long-lived Express host, MySQL,
HTTPS, explicit CORS/cookies/CSRF, persistent uploads, and unbuffered SSE/WS.
Redis is optional for multi-instance realtime. Frontend hosting does not provide
the backend or durable filesystem. Expo builds require Android SDK/JDK or EAS;
iOS requires compatible macOS/Xcode or EAS and Apple signing/provisioning.
SDK directory presence alone is not proof of a build toolchain.
No production URL, hosting account, signing credential or deployment is assumed.
