# Native and Web Session Protocol

Implemented foundation only; role modules and signed native builds remain pending.

## Contracts

- POST /api/auth/login retains its body and {user} response. Credentials are
  verified against existing users; HttpOnly access and CSRF cookies are issued.
- POST /api/auth/native/login accepts the same {email,password,adminCode?} body.
  It returns {success,data:{user,token},message}, with Cache-Control: no-store,
  and no cookie. Roles come from persisted users, never from the submitted body.
- GET /api/auth/me restores the current account. Use Authorization: Bearer for
  native; web retains credentials/cookies. Native requests omit cookies.
- POST /api/auth/logout revokes the presented session and clears web cookies.
  On network failure, native does not report successful remote logout.
- POST /api/auth/change-password accepts {currentPassword,newPassword}; a
  transaction changes the hash and revokes all of that user's sessions. Both
  UIs clear cached private data and return to sign-in after success.

JWT HS256 verification checks identity, known role, expiry and nonempty jti.
AuthSession binds jti to userId, expiry and revokedAt. Every authenticated request
and realtime heartbeat/event rechecks session and current account state. Tokens
issued before this migration are rejected; users must sign in again. There is no
refresh endpoint or second identity provider. Expiry requires fresh login.

## CSRF and Storage

Production cookie-based unsafe requests still require matching CSRF header/cookie.
The sole credential-only native login exemption never acts on ambient cookies.
Bearer unsafe requests are exempt only after JWT/session/account validation; they
do not fall back to cookie identity. Route role and object checks still apply.
Login attempts are limited to 20 per source IP per 15 minutes (in-process; use
shared limiter/proxy configuration for multi-instance production).

Native stores tokens only in Expo SecureStore, device-only keychain accessibility.
No password, refresh token or cached identity is persisted by the native app.
The optional Expo web QA target stores its token in memory only. The shipped web
remains Vite with HttpOnly cookie authentication. Clear/cancel private Query data
on logout/account switch/expiry. Native platform storage tests remain unexecuted.

## Local Migration and Future Rollout

database/migrations/20261013000100_auth_sessions/migration.sql only adds AuthSession
and its User foreign key/indexes. Applied and generated locally on 127.0.0.1/estatehub.
No existing business record/table was reset or changed. No production operation
was performed. Before a separately authorized production rollout, back up MySQL,
review SQL on staging, apply the migration before the backend, generate the client,
verify login/CSRF/logout/expiry and inform users that prior sessions expire.
Do not drop existing business tables to roll back. A compatible rollback must
preserve the new table/data until a separate reviewed cleanup. Schedule eventual
pruning of expired sessions through a reviewed operational procedure.

Set EXPO_PUBLIC_API_URL to a reachable HTTPS /api endpoint for release. Private
HTTP is accepted only in development; local .env.local uses the machine's current
LAN address and must not be committed or used as production configuration.
Use npm --prefix mobile start for Expo; npm run dev at root for the existing
website/API. Native validation still needs free C: space and a test device/toolchain.
