# Venture Plus application readiness audit

Evidence date: 2026-10-13. Scope: local workspace and local XAMPP database.
Checkpoint 1: BLOCKED for mobile feature implementation pending critical security repairs.
Audit and repairs are in progress; this is not a release approval.

## Verified architecture

- Active npm workspaces: `client` and `server`; no mobile workspace exists.
- `client`: React 18, TypeScript, Vite 5/SWC, React Router 6, TanStack Query 5,
  Tailwind 3, Radix/shadcn components, React Hook Form, Zod, Lucide, Recharts.
- `server`: Express 4, TypeScript, Prisma 5, MySQL, bcrypt, JWT, Zod,
  Helmet, CORS, cookie-parser, rate limiting, Multer, Pino, compression.
- `database/schema.prisma`: users, employee profiles, locations, ventures,
  plots, leads, customer records, favorites, agents, inquiries, tracking.
  EmployeeAssignment is managed by parameterized raw SQL outside Prisma models.
- Nine migration directories; all nine have completed entries in the local database.
  The venture-photo migration is deliberately a no-op. The photo service writes
  `layoutImage`, so layout and photo uploads share the same persisted field.
- `backend/` is a separate legacy Express/Mongoose application with standalone
  tests and seed scripts; root commands do not run it. `frontend/` contains a
  connection probe. Neither is the active frontend/backend reference.
- `server/uploads/ventures` stores local files exposed publicly under `/uploads`.
  Layout limit: 20 MiB; JPEG/PNG/SVG/PDF. Photo limit: 10 MiB; JPEG/PNG/WebP.
  Validation trusts client MIME declarations and preserves original extensions.
- Realtime: SSE `/api/stream`, WebSocket `/api/ws`, process-local event bus,
  optional Redis pub/sub. nginx configuration disables SSE buffering and enables
  WebSocket upgrades. This is source evidence, not deployed hosting verification.
- This folder has no Git metadata. The GitHub repository named in the brief has
  not been compared to this snapshot. No CI or Vercel manifest was found in the
  inspected application file inventory. Procfile starts only the API.

## Authentication and permissions

- Login verifies bcrypt passwords and signs an expiring JWT. Browser login
  sets an HTTP-only cookie; no access token is returned in JSON.
- Middleware accepts Authorization Bearer or the existing access cookie.
  Native clients need a compatible token-issuance endpoint and secure storage.
- Production enables double-submit CSRF protection for all unsafe HTTP methods.
  Native login/write requests currently cannot simply omit this requirement.
- Cookie settings derive from environment; Secure is enabled in production.
  Logout clears cookies but does not revoke JWTs. Existing sessions remain valid
  after password changes; middleware does not reload employee freeze status.
- Roles: ADMIN, EMPLOYEE, AGENT, CUSTOMER. Web navigation hides some links by
  role but the shared protected route checks only login; APIs remain authoritative.
- Customer venture/location/plot lists derive access from leads matching email.
  Customer records/tracking derive ownership from text searches in notes.
- Employee location/venture access uses assignment IDs. Customer-record reads
  use owner aliases. Direct plot/lead access does not consistently apply assignments.
- Agent reads currently use broad defaults; agents cannot create/edit leads,
  customer records or plots through the route role guards. Agents can post tracking.

## Verified API inventory

All paths below are relative to `/api`. `auth` means signed-in. Successful JSON
normally contains `{success, data, message}`; deletes/logout may omit `data`.
Paginated results add `{pagination:{total,page,pageSize,pageCount}}` and default
to 20 records, capped at 100. Errors generally contain `{success:false,message}`;
Zod errors add field errors. Mutation behavior is source-verified unless tested below.

| Methods and paths | Access / identifiable format |
| --- | --- |
| GET /health | Public process liveness; does not test database |
| GET /auth/csrf | Public; `data.token`, sets CSRF cookie |
| POST /auth/login | Public; email/password/optional adminCode; `data.user` and cookies |
| POST /auth/register | Public employee signup; email/password/displayName/fullName/role=EMPLOYEE plus profile fields |
| POST /auth/logout | Clears browser cookies |
| GET /auth/me | Auth; `data.user` |
| POST /auth/change-password | Auth; currentPassword/newPassword |
| POST /auth/customers | ADMIN/EMPLOYEE; customer credentials and contact fields |
| GET /admins | ADMIN; user array |
| GET /employees, /customers | ADMIN/EMPLOYEE; user arrays |
| GET /locations, /locations/:id | Auth; summary/list and venture data |
| GET /ventures, /ventures/:id | Auth; optional locationId query; ventures/plots/layout data |
| POST /ventures | ADMIN; name/locationName/plotCount/defaultArea/defaultPricePerSqYard, optional numbering |
| POST /ventures/:id/layout, /ventures/:id/photo | ADMIN; multipart fields layout/photo; updated venture |
| PUT /ventures/:id/regions | ADMIN; `{regions}`; updated venture; no route Zod schema |
| GET /plots, /plots/:id | Auth; ventureId/status/page/pageSize filters; plot data |
| GET /plots/:plotId/leads | Auth; paginated leads |
| PUT /plots/:id | ADMIN/EMPLOYEE; status/area/pricePerSqYard/plotNumber |
| PUT /plots/:id/coords, /plots/coords | ADMIN; x/y/width/height/shapeData; batch `{plots}` |
| GET /leads | Auth; page/pageSize; lead array |
| POST /leads | ADMIN/EMPLOYEE; plotId/customerName/email/contactNumber/location/uniqueId/pricePerSqYard and optional notes/photoUrl/agentId |
| PUT /leads/:leadId | ADMIN/EMPLOYEE; notes/status/price/contact/location/uniqueId |
| DELETE /leads/:leadId | ADMIN/EMPLOYEE |
| GET /total-data | Auth; customer-record array with service ownership filtering |
| POST /total-data, PUT /total-data/:id | ADMIN/EMPLOYEE; contactName/contactNumber/location/budget/recordOwner, optional interested/status/leadName/notes |
| DELETE /total-data/:id | ADMIN/EMPLOYEE |
| GET /stats | Auth; counts and plotsByStatus; employee branch scopes some counts |
| GET /favorites, POST /favorites, DELETE /favorites/:plotId | Auth; own favorites, POST `{plotId}` |
| GET /agents, /agents/:id | Auth; agent/employee public-profile selections |
| POST /inquiries | Public; customerName/customerEmail/message, optional customerPhone/plotId/agentId |
| GET /tracking | Auth; tracking array, customer branch filters notes |
| POST /tracking | ADMIN/EMPLOYEE/AGENT; customerId/latitude/longitude/status/address |
| GET /employee-access/employees | ADMIN; employee/profile/assignment data |
| POST /employee-access/employees, PUT /employee-access/employees/:id | ADMIN; account/profile/assignment fields validated in routes |
| POST /employee-access/employees/:id/status | ADMIN; `{status:ACTIVE or FROZEN}` |
| POST /employee-access/otp/request, /employee-access/otp/verify | ADMIN; type/target; requestId/otp; OTP returned by request |
| GET /stream, WS /ws | Auth; change events with reconnect/heartbeat support |

## Features and reuse boundary

| Existing screen or capability | Verified behavior / mobile implications |
| --- | --- |
| /backend-auth and /auth | Employee/admin/customer portals, employee signup, demo-account shortcuts; no separate agent portal |
| / | Role-aware dashboard using stats and inventory; preserve real data only |
| /ventures | Locations; customers see locations associated with their leads |
| /ventures/:locationId | Venture listings and image URLs |
| /ventures/:locationId/:ventureId | Plot statuses, filters, details, layouts, lead dialogs; mobile touch/zoom adaptation |
| /reports | Lead reports, search/filter, detail/edit/create, CSV export; some display metrics are hardcoded |
| /track-customers | Customer records, search/filter, status/edit/delete, customer credentials, CSV and ICS downloads |
| /total-data | Customer-record CRUD/status views; ownership filtering |
| /live-tracking | API tracking plus static map and decorative 360 view; missing tracking falls back to location coordinates and random movement |
| /admin | Administration/dashboard using users, inventory, leads, records |
| /employee-access | Admin employee account/profile/assignment/freeze and OTP controls |
| /new-venture | Admin API for venture/plot creation; sidebar also shows it to non-admins |
| /layout-editor | Admin layout upload, regions, plot geometry; SVG DOM parsing and raster canvas detection require native adaptation |
| Sidebar password/logout | Real API actions; mobile secure session restoration needed |
| /payment | Hardcoded customer/amount and timer-based success; no payment API/provider verified. Exclude from mobile transactions |
| /plot-available and /sold-out | Static explanatory screens; no authoritative purchase flow |
| Favorites, inquiries, agent directory | Real backend routes and API wrappers; no connected web UI caller found for these wrappers |
| Loading/error/404 | Existing web states; mobile must add cancellation, network/offline and session expiry handling |

Reuse Express services, database and API response contracts wherever secure;
reuse compatible types, constants, formatting and validation logic. React DOM,
Radix, CSS, browser storage/downloads, FileReader, DOMParser and canvas cannot be
copied unchanged to React Native. Preserve web implementation separately.

## Environment and external dependencies

Server names verified in `config/env.ts`: NODE_ENV, PORT, DATABASE_URL,
JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN, REALTIME_TRANSPORT, REALTIME_REDIS_URL,
COOKIE_SAMESITE, COOKIE_DOMAIN, CSRF_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME,
LOG_LEVEL. Client reads VITE_API_URL, VITE_CSRF_COOKIE_NAME,
VITE_REALTIME_TRANSPORT. Example files exist; root has no example.
No secret values are reproduced here. Local database uses the XAMPP root account
without a password; production requires a dedicated restricted database user.
Existing environment examples and seed/demo code use fixed development credentials.

Verified external references: Google Fonts Manrope; OpenStreetMap static-map
service; optional Redis. Unsplash images occur in the static payment page.
No real payments, email/SMS delivery, push notifications or background device
location capture were verified. Do not infer delivery from the OTP UI.

## Checks actually executed

| Check | Result |
| --- | --- |
| npm run build | PASS after sandbox subprocess restriction was lifted: Vite and server TypeScript |
| Prisma generation during backend prebuild | PASS v5.22; sync helper skips locked server client files |
| npm test | PASS 1 example test; no business coverage |
| npm run test -w server | PASS 2 new tests; isolated ephemeral SSE/WS servers, no database writes |
| npm run lint | FAIL client: 66 errors, 30 warnings |
| npm run lint -w server | FAIL missing ESLint 9 flat config |
| Client tsc --noEmit | FAIL 5 diagnostics: stale totalDataAPI import, 2 unreachable signup comparisons, report notes mismatch, ES2020 replaceAll |
| npm ci --ignore-scripts --dry-run --offline | FAIL uncached registry metadata; not an installation verification |
| npm ci --ignore-scripts --dry-run | FAIL EUSAGE: root lockfile lacks both workspaces and their dependency trees; fresh install is not reproducible |
| GET /api/health | PASS local HTTP 200; liveness only |
| Local MySQL reads | PASS six users; all nine migration records completed |
| Login/me/logout | PASS all four seed roles; after logout /me is 401; invalid credentials 401 |
| Read endpoints | locations/ventures/plots/leads/total-data/stats/tracking/favorites/agents PASS for each role |
| Admin employee-access guard | ADMIN 200; other three roles 403 |
| Original website visual check | Login rendered in actual browser; desktop screenshot inspected in tool output, not yet saved as artifact |

Vite warns about a 646 kB main JavaScript chunk and old Browserslist data.
Fresh installation, Android/iOS builds, mutation end-to-end tests, production
deployment, Redis fanout, upload lifecycle and device behavior remain unverified.
Windows has not established Apple signing/Xcode or Expo/EAS credentials.

## Security findings and checkpoint repairs

1. FIXED/tested: full records broadcast to every SSE/WS client. Non-admin events
   now contain empty payloads and the same type/id/time; clients invalidate queries
   and refetch through authorized APIs. Admin notifications retain their payloads.
   Non-admin clients still learn that a change happened, not its record contents.
2. FIXED: `.env` files were not ignored. Added ignores with example-file exceptions.
   No Git history is available to verify historical exposure or perform rotation.
3. OPEN/critical: unauthenticated employee signup gives a privileged role; employee
   plot/lead routes and writes lack consistent assignment checks. Runtime confirms
   an unassigned employee sees zero ventures but twenty plots and five leads.
4. OPEN/high: customer plot details include all leads for a matching plot, not only
   that customer's leads. Customer records/tracking depend on notes substring
   ownership. Agent records use broad defaults; authorized scope requires review.
5. OPEN/high: JWT roles/freeze state are accepted until expiration; logout/password
   changes do not revoke bearer sessions. SSE/WS do not close at token expiry.
6. OPEN/high: adminCode can be omitted at login; user responses expose adminCode;
   auth controller catch blocks return raw exception messages, including database
   connection details. Default development JWT secret must not reach production.
7. OPEN: OTP is a local demo returning the code to the requester, with no delivery
   provider or durable verification proof. Verified flags are submitted by admins.
8. OPEN: public file serving, MIME-only upload checks, SVG active content,
   unvalidated regions, coarse 200-request limit, no specialized login throttling,
   and missing WebSocket Origin enforcement need targeted protection.
9. OPEN/data correctness: simulated payments/tracking/report metrics must not be
   presented as backend functionality in mobile. Photo upload overwrites layout.

## Decision and next checkpoint

Production release: BLOCKED. Continue safe local audit and backend repairs.
Do not implement mobile role modules until critical auth/object-access issues are
fixed and covered by tests. The requested React Native/Expo + preserved Vite web
architecture is compatible with the verified stack; Flutter would duplicate TS
logic, while a wrapper would carry current DOM layouts and simulated flows into
mobile. No concrete need to replace the preferred Expo stack was found.

Next: repair dependency lock reproducibility and critical access controls; capture actual
desktop/mobile references and complete APP_UI_PLAN before mobile UI work.

## Follow-up evidence and repairs

2026-10-13: this section supersedes the initial failures where explicitly stated.

- Root lockfile repaired; network-enabled clean-install dry run passes. Actual
  clean install in a temporary copy passes with 763 packages. Scripts now use
  npm-resolved executables rather than workspace-local node_modules paths.
  Original project build passes using the resolved versions (Vite 5.4.21).
- All five client standalone typecheck diagnostics repaired; typecheck passes.
- Five backend security tests pass: three access tests plus two realtime tests.
  Employee plot/lead lists and writes now enforce venture/location assignments;
  frozen/relieved employee scope fails closed. Customer plot details filter their
  nested leads by email. Agent lead lists use agentId. Employee lead creation
  cannot attribute records to another account.
- Actual local employee login confirms ventures=0, plots=0 and leads=0 when no
  assignments exist. This closes the previously verified direct-list gap.
- Public employee signup, customer-record/tracking writes and account/session
  state remain open. Do not infer that the entire authorization audit has passed.
- A temporary-copy directory-change failure initially ran npm ci in the project
  and failed on a locked esbuild file. Dependencies were restored with npm install;
  current build/security tests pass and website/API were restarted successfully.
  Business data and migrations were untouched.
- Clean-copy full build PASS, including Prisma generation/backend TypeScript;
  new-lockfile web test PASS (1 example); client typecheck PASS. After restarting,
  admin still sees 20 plots/5 leads while the unassigned employee sees 0/0.
  API health and login page return 200. Lint remains unresolved.
- Existing style warnings were retained to preserve the website's identity.

Checkpoint 1 remains open. No native application or release readiness is claimed.

## Current Checkpoint Update (2026-10-13)

This supersedes older open items where explicitly listed. Critical local access
and session repairs are implemented and tested; local foundation/auth work is
allowed. Production release remains BLOCKED, and full feature implementation is
not complete. APP_PROGRESS.md and APP_TEST_REPORT.md contain current evidence.

Public signup is now admin-only; current account checks reject deleted/changed,
frozen and relieved users. Customer record/tracking writes and favorites are
scoped. Customer email matching is exact and precedes pagination. Realtime payloads
are filtered by role. Nested plot/venture leads are filtered using lead ownership.
Login errors do not expose database exceptions. Sensitive auth headers are redacted.
Uploads use canonical randomized names and sandbox/nosniff headers; Multer is 2.4.0.
Coordinates, statuses and pagination are bounded. Broader legacy ownership and
upload content/cleanup limitations remain; this is not a blanket security approval.

New endpoint (introduced for native, not present in original audit):
POST /api/auth/native/login, body {email,password,adminCode?}, response
{success:true,data:{user,token},message}. It shares existing credentials/roles,
issues no cookies, and returns no passwordHash/adminCode. Both login variants
create a durable AuthSession referenced by JWT jti. Existing /auth/me, /auth/logout
and /auth/change-password serve native bearer clients as well as cookie web.
Production cookie CSRF is retained; bearer exemption validates current session.
Logout/password changes revoke sessions. Pre-upgrade tokens require fresh login.

Only the local estatehub database received an additive AuthSession migration.
Read-only connectivity/session-table query and client generation pass. Business
records were not reset. Production migration/deployment is not authorized/performed.
No valid live native account login was performed; valid login coverage uses isolated
fixtures. Public website/API health is verified locally, not on remote deployment.

Expo SDK 57 independent package preserves the original web dependency graph.
Native login/account screens and typed transport exist, not the role modules.
Current mobile typecheck/lint and Expo doctor pass; three-platform JS export passes.
Original web build/typecheck and 5 tests pass; backend compile and 19 tests pass.
Native device checks are blocked by missing test hardware/emulator/toolchain and
very low C: disk space. Signed mobile builds and deployment readiness are unverified.
