# Existing Venture visual reference

This records the incumbent system; it does not authorize a web redesign.

- Product labels vary between EstateHub (login) and Venture Plus (sidebar).
  Preserve those existing assets/labels; use Venture Plus as the mobile app name.
- Existing logo: `client/public/app-logo.png`. Background: `plot-bg.jpg`.
- Manrope typography, Lucide icons, dark sidebar, light operational surfaces,
  blue actions, and green/orange/red plot availability states.
- Source tokens: `client/src/index.css`; actual login screenshots:
  `docs/screenshots/login-desktop.jpg` and `login-mobile.jpg`.
- Login uses a blue background and translucent panel. Mobile preserves the logo
  and action colors, with a single accessible form and no simulated demo workflow.
- Operational mobile screens use unframed lists, compact summaries, restrained
  borders, and native stacks/tabs. Reserve cards for repeated records and framed
  tools. Touch targets are at least 44 points, with visible focus and status labels.
- Keep text scalable and at least 4.5:1 contrast. Use platform-native feedback,
  safe areas and keyboard handling. Do not copy the web's poor demo-button contrast.
- Plot state colors remain paired with labels, not color alone. Layouts use the
  real uploaded image and normalized geometry. No invented map movement.
- Native implementation uses code-first app screens as required by the master
  brief. Existing website layout/styles remain outside the mobile design changes.
