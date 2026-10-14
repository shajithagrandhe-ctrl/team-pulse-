# Venture Plus Mobile Redesign Audit

Editable Figma reference: https://www.figma.com/design/stDeCyMC5Uv1S1FRBaaLAd

The mobile implementation intentionally uses native system fonts because the
website's Manrope font files were not present in either source repository. This
avoids a runtime font download and keeps the test APK usable offline.

## Verified Architecture

- Mobile: Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router.
- State/data: TanStack Query, local component state, React Hook Form, Zod.
- Authentication: bearer-token native login, Expo SecureStore persistence, `/auth/me` session validation, explicit logout and local cache clearing.
- Backend: Express and TypeScript with Prisma/MySQL, REST endpoints under `/api`, role middleware, multipart uploads, and optional WebSocket real-time updates.
- Android: Expo prebuild, min SDK 24, target SDK 36. Local preview builds use a separate package ID and a host-specific cleartext exception.

## Mobile Route And Feature Inventory

- Authentication: role-aware login for admin, employee, agent, and customer accounts; optional admin code; secure session restore and logout.
- Dashboard: role identity, live plot statistics for operational users, property shortcuts, CRM shortcuts, administration links, and account access.
- Inventory: locations, ventures, venture media, plot lists and details, plot status editing, favorites, agents, inquiries, venture creation, photo/layout upload, and interactive layout geometry editing.
- CRM: leads and customer records with search, status filters, pagination, create/edit/delete, CSV reports, customer credential provisioning, follow-up calendar export, and tracking updates.
- Administration: role-scoped user directories and admin-only employee creation, profile editing, venture/location assignment, freeze, and reactivation.
- Account: identity, role, password change, and logout.

## Verified API Surface Used By Mobile

- Auth: `POST /auth/native/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-password`, `POST /auth/customers`.
- Dashboard: `GET /stats`.
- Inventory: `GET /locations`, `GET/POST /ventures`, `GET /ventures/:id`, `POST /ventures/:id/layout`, `POST /ventures/:id/photo`, `PUT /ventures/:id/regions`, `GET /plots`, `GET/PUT /plots/:id`, `GET /plots/:id/leads`, `PUT /plots/coords`, `GET/POST /favorites`, `DELETE /favorites/:plotId`, `GET /agents`, `GET /agents/:id`, `POST /inquiries`.
- CRM: `GET/POST /leads`, `PUT/DELETE /leads/:id`, `GET/POST /total-data`, `PUT/DELETE /total-data/:id`, `GET/POST /tracking`.
- Admin: `GET /admins`, `GET /employees`, `GET /customers`, `GET/POST /employee-access/employees`, `PUT /employee-access/employees/:id`, `POST /employee-access/employees/:id/status`.

Request and response validation remains in the existing Zod contracts. The redesign did not change endpoint paths, payloads, pagination, or authorization rules.

## Environment And Platform Dependencies

- `EXPO_PUBLIC_API_URL`: public API base URL embedded into the client bundle.
- `EXPO_PUBLIC_BUILD_CHANNEL`: enables the isolated local-preview package and LAN network exception.
- Native storage: Expo SecureStore. Web preview storage is intentionally memory-only.
- Device/platform APIs: document picker, file cache, system sharing, telephone/email links, external maps/PDF links, alerts, app lifecycle, and WebSockets.
- Not present: payments, push notifications, camera capture, biometric login, device GPS capture, or offline record synchronization.

Secret values are not stored in tracked mobile configuration.

## Design System

The website and source repository were used as the visual reference. The mobile system reuses:

- The existing Venture Plus logo and aerial layout background.
- Navy product chrome, blue primary actions, gold accents, and semantic plot status colors.
- Compact information hierarchy, dark dashboard headers, light operational surfaces, image-led inventory, status badges, and Lucide icons.
- A 4/8/12/16/24/32 spacing rhythm with 44-50 px touch targets and restrained 4-8 px radii for native controls.

The implemented mobile layouts adapt the website rather than copying desktop grids. Dense tables became searchable cards, the sidebar became grouped dashboard navigation, and plot/layout tools remain touch-oriented.

## Reuse And Adaptation

Reused unchanged:

- Backend, database, API contracts, authentication token protocol, permissions, mutations, queries, uploads, and geometry calculations.

Adapted for mobile:

- Navigation, visual hierarchy, list/table presentation, forms, feedback states, touch controls, safe areas, keyboard behavior, and long-text handling.

Still required for a public production release:

- A stable HTTPS API hostname reachable outside the local network.
- Protected production signing credentials and release signing configuration.
- Device/emulator verification across representative Android versions.
- Store assets, privacy disclosures, and distribution configuration.

## Security And Operational Risks

- Frontend role hiding is not a security boundary; backend authorization must remain authoritative for every write and record-level read.
- CRM visibility for customer/agent roles depends on backend record scoping.
- The LAN preview APK only works while the API host is reachable on the same network and its IP remains unchanged.
- The local preview release is debug-signed. It is installable for testing but is not suitable for Play Store distribution.
- Native WebSocket updates require the backend WebSocket transport; otherwise query refresh and app-lifecycle refresh provide fallback updates.

## Recommended Conversion Approach

Retaining the existing Expo React Native application is the correct approach. It already provides native Android/iOS builds, SecureStore, file selection/sharing, native links, and touch-native plot editing while reusing the existing TypeScript contracts. A Capacitor wrapper or PWA would reduce native session and device integration quality, and a Flutter migration would duplicate established TypeScript business and validation logic without a verified benefit.
