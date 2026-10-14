# Master Prompt Compliance Review

Reviewed on 2026-10-14 against the complete Venture Plus website-to-mobile
redesign prompt. This document distinguishes implemented source from checks that
require external infrastructure or a physical device.

## Completed

- Inspected the existing website, mobile source, API contracts, roles, assets,
  platform integrations, Android configuration, tests, and supplied references.
- Retained Expo SDK 57, React Native 0.86, TypeScript, Expo Router, TanStack Query,
  React Hook Form, Zod, SecureStore, and the existing backend contracts.
- Established centralized brand tokens and reusable native controls based on the
  website's navy, blue, gold, semantic status colors, spacing, radii, and assets.
- Redesigned login, dashboard, account, inventory, locations, ventures, plots,
  layout editor, favorites, agents, inquiry, leads, customers, tracking, reports,
  credentials, directories, and employee access workflows.
- Preserved real API data, mutations, uploads, geometry, pagination, role gates,
  session persistence, realtime invalidation, and error/loading/empty states.
- Added mobile search and sorting for location and venture discovery, plot search
  and status filtering, and CRM search/status filtering.
- Added safe-area/status-bar contrast, keyboard avoidance, accessible touch
  targets, disabled control semantics, role-gated plot lead details, and an
  accessible plot-layout navigation fallback.
- Verified there are no dummy dashboard totals, fabricated listings, fake
  payments, decorative action buttons, tracked secrets, or backend/database
  changes in the redesign commits.
- Created editable Figma reference screens at:
  https://www.figma.com/design/stDeCyMC5Uv1S1FRBaaLAd

## Verification Gates

- TypeScript, ESLint, unit/contract/security tests, component tests, Expo Doctor,
  dependency validation, three-platform export, Android assembly, APK metadata,
  signature, ABI, checksum, and embedded endpoint are release gates.
- Source-level route and role coverage is complete for every Expo Router screen.
- Protected screens were reviewed from source in accordance with the user's
  earlier instruction not to sign into the website for protected-screen capture.

## External Or Deferred Verification

- No Android device or emulator is connected. Installation, native launch,
  SecureStore persistence, keyboard behavior, maps, uploads, and role-by-role
  end-to-end acceptance remain manual device checks.
- The local-preview APK requires the configured LAN API host to be running and
  reachable. Backend/database deployment work is intentionally deferred to the
  user's separate backend integration prompt.
- No production keystore or stable HTTPS API hostname was supplied. The local
  preview is therefore debug-signed and is not a Play Store release.
- Manrope font binaries are absent from both source repositories, so the mobile
  app uses native system typography rather than downloading a font at runtime.
- Very large CRM datasets are loaded for client-side filtering. Server-side
  search/filter contracts can be introduced only with the later backend prompt.

These external items do not justify inventing backend behavior, signing keys, or
test evidence. They must be completed before describing the app as production
deployed or fully device-verified.
