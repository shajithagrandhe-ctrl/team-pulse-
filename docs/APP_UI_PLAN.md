# Venture Plus mobile UI plan

2026-10-13. Prepared from actual routes/components/services and login captures,
before mobile screen implementation. Scope/brand preservation are confirmed by
the user's master brief and explicit implementation approval. Checkpoint 2:
screen inventory and source visual plan complete. User explicitly chose source
references for protected screens; do not sign into demo accounts in the browser.

## Reference and Tokens

See DESIGN.md, client/src/index.css, tailwind.config.ts, SimpleAppSidebar.tsx,
BackendThreeLogins.tsx and the screenshots folder. The actual website uses
Manrope, blue primary actions, a dark navigation rail, light/translucent content,
Lucide icons, and green AVAILABLE / orange ADVANCE / red SOLD labels.
Mobile will preserve logo, product labels, status semantics and uploaded media;
it will improve contrast/touch handling without redesigning the website.
No protected screen is claimed to have been visually inspected in a browser yet.

## State Contract

All screens below use this contract unless a row specifies otherwise: loading
indicator/skeleton without invented records; empty state reflecting the authorized
result; error text and retry preserving unsaved input; offline state retaining
already-fetched data with writes disabled when unreachable. Mutation forms show
field validation, pending/disabled submit, real server result, and failed-submit
recovery. A 401 clears session/query data and returns to login. An account-frozen
403 closes access; an ordinary permission denial remains on a denied screen.
Screen visibility is convenience; the backend is the permission authority.

## Screen Inventory and API Mapping

Every row specifies purpose, roles, data/actions and endpoints. The State Contract
applies to loading/empty/error/offline behavior for each row.

| Screen | Roles / purpose | Data source and available actions | Specific states |
| --- | --- | --- | --- |
| Launch/session restore | All; establish access | SecureStore token, API /auth/me; clear invalid session; native issuance extension planned in Phase 4 | Splash while checking; offline restoration error offers retry; never trust cached identity alone |
| Login | All four; enter credentials | Existing login business service; native token response planned; email/password, optional admin code if required by server | Empty fields/validation, obscured password, pending request, invalid/frozen error |
| Account | All; view own identity/manage password | GET /auth/me, POST /auth/change-password, logout; mobile logout/session revocation extension planned | Do not show adminCode or passwordHash; expiry clears data |
| Home | All; role-appropriate overview | GET /stats, /total-data; open permitted inventory, records and updates | No unauthorized metrics/actions; zero means actual zero |
| Locations | All; permitted inventory groups | GET /locations; open location | Empty assignments/customer associations explained without fake properties |
| Ventures | All; choose permitted venture | GET /locations/:id or /ventures?locationId; open detail | Image failure keeps name; source photo/layout field conflation documented |
| Venture/plots | All; view allowed plots | GET /ventures/:id, /plots?ventureId/status/page/pageSize; search/status filters, open plot/layout | Paginate API results; no assumption that pageSize=1000 returns all |
| Plot detail | All; inspect actual property | GET /plots/:id, /plots/:id/leads; area/price/status, image/layout; open permitted lead actions | Missing/not-authorized is 404; customer sees only own nested leads |
| Image/layout viewer | All permitted readers | API-provided layoutImage or summary photoUrl; aspect-preserving image, pan/zoom, normalized plot overlay | One persisted image is verified; no invented multi-image gallery; PDF uses document viewing |
| Favorites | Signed-in permitted plot readers; save choices | GET/POST /favorites, DELETE /favorites/:plotId; real add/remove | No entries outside plot access; toggle reconciles server errors |
| Agent directory/detail | Signed-in users; contact agent | GET /agents and /agents/:id | Read-only; no agent create/update/delete API verified |
| Inquiry form | Signed-in app users; send inquiry | POST /inquiries; verified contact/message/optional plotId/agentId fields | Real submit acknowledgement only; no inbox/history endpoint verified |
| Customer records | ADMIN/EMPLOYEE editable; AGENT/CUSTOMER scoped readers | GET /total-data with pagination; search/filter; open record | Owner aliases and exact customer email matching preserve legacy schema |
| Record detail/form | ADMIN/EMPLOYEE; manage record | POST /total-data, PUT/DELETE /total-data/:id; name/phone/location/budget/status/owner/leadName/notes | Employee owner assigned from active account; foreign writes denied; deletion confirmation |
| Customer credentials | ADMIN/EMPLOYEE; issue access | POST /auth/customers with existing account fields | Password never stored/logged; real conflict/validation errors |
| Leads/reports | ADMIN/EMPLOYEE/CUSTOMER/AGENT scoped readers | GET /leads; search/status filters; existing fields, export permitted records | Customer/agent cannot see other leads; all-page export must use pagination |
| Lead create/edit | ADMIN/EMPLOYEE; permitted sales actions | POST /leads, PUT/DELETE /leads/:id; exact existing fields/statuses | Validate plot access and uniqueId; no invented payment/contact-history fields |
| Tracking list/detail | All scoped readers | GET /tracking + permitted /total-data; actual timestamp/status/coordinates/address; existing static map reference | No record means no live position; no fallback/random movement; no fake 360 location representation |
| Tracking update | ADMIN/EMPLOYEE/AGENT within record access | POST /tracking; manual authorized coordinate/status/address entry | Validate numeric ranges; request device permission only if a separately justified capture action is implemented |
| Admin overview | ADMIN; inspect operational data | /stats, /locations, /ventures, /total-data, /employees, /leads | Admin-only routes; paginated datasets; no fabricated conversion probabilities |
| Venture creation | ADMIN; inventory creation | POST /ventures; location/name/plot count/numbering/area/price; optional existing upload workflows | Real partial failure retains created venture and offers retry of upload; no fake rollback |
| Venture media upload | ADMIN; replace existing asset | POST /ventures/:id/layout (layout) or /photo (photo); DocumentPicker/ImagePicker multipart | Enforce verified formats/limits; warn that photo and layout share one persisted field |
| Layout geometry editor | ADMIN; map plot positions | PUT /plots/:id/coords or /plots/coords; PUT /ventures/:id/regions; normalized rectangle/polygon geometry and roads/parks | Touch selection/drawing/undo before save; no database model changes to simplify UI; SVG/raster detection adapted separately |
| Employee list/detail/edit | ADMIN; account/profile/access | GET/POST/PUT /employee-access/employees; POST /:id/status; assignments, dates, existing profile fields | No employee privilege bypass; frozen/date rules persist; typed field/date validation |
| User directories | ADMIN admins; ADMIN/EMPLOYEE employees/customers | GET /admins, /employees, /customers | Read-only outside verified provisioning; no unverified deletion capabilities |
| CSV/calendar export | ADMIN/EMPLOYEE permitted record/lead users | Existing API data plus verified web CSV/ICS logic; native file/share adaptation | Export all authorized pages; no server scheduling/notification capability claimed |
| Error/not found | All | Safe route-param validation, 403/404 recovery and retry | No data or actions from forbidden role |

## Navigation and Permissions

- Customers: Home, My Properties, Saved, Updates, Account. Agent directory and
  inquiry are nested within permitted plot/detail paths.
- Employees: Home, Inventory, Leads, Customers, Account. Tracking/report exports
  are nested; creation/edit actions appear only where server access permits.
- Agents: Home, Inventory, Assigned Leads, Updates, Account. Customer records are
  scoped readers; lead/plot/customer writes remain unavailable under current guards.
- Admins: Home, Inventory, Customers, More, Account. More groups employee access,
  reports/users/tracking; inventory detail hosts venture/media/layout management.
- Compact phones use tabs/stacks and one-column forms. Tablets use wider lists
  and optional detail panes. Web retains existing routes and sidebar conventions.

## Reusable Native Components

BrandHeader, screen/safe-area container, labeled field, password field, icon
button, status badge, list row/property card, filter controls, query-state view,
confirmation dialog, paginated list, image viewer, geometry surface and form
validation summary. Use a native icon library and real assets; no DOM components,
Radix dialogs, browser canvas or localStorage copied into native screens.

## Accessibility and Responsive Requirements

44-point minimum targets; scalable text; labeled controls; semantic headings;
keyboard-aware forms; no hover-only actions; screen-reader descriptions; status
text plus color; image alt/accessibility descriptions; reduced-motion support;
contrast at least 4.5:1 for normal text. Fixed-format layout canvases preserve
aspect ratio and normalize coordinates; long lists use virtualized rendering.

## Unsupported or Unverified Capabilities

Payments are a hardcoded timer demo, not a verified transaction integration.
OTP is a local code-returning demo with no email/SMS provider. Do not ship it as
proof of delivery/ownership. Reports contain hardcoded display metrics; omit
unverified metrics. Tracking fallback/random motion is not live data. No push,
background GPS, multi-image property gallery, agent administration mutations,
inquiry inbox or durable appointment scheduling backend was verified.

Native signing/accounts, production HTTPS/API/storage, real map availability,
protected browser visual references and device testing remain separate checks.
