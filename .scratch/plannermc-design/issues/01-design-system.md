# Build PlannerMC design tokens and component gallery

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Implement the visual system and isolated component gallery specified in [the feature specification](../spec.md).

## Scope

Use the user-directed MacroCap Labs identity and keep PlannerMC as the product name. Create the Vite gallery at `/design`, design tokens and component documentation, source sign-in screenshot, and accessible visual primitives. Do not implement complete product workflows or add excluded operations-dashboard features.

## Comments

- 2026-10-30: Claimed for implementation. The workspace contains planning documents but no Vite app or Git metadata. Use the approved workspace directory and preserve the existing planning/recon files.

## Answer

Completed the PlannerMC visual system and gallery. The application uses Vite, React, TypeScript, Tailwind CSS v4, `@theme` tokens, Radix Dialog, Lucide React, and the local Geist Variable WOFF2 with its SIL OFL 1.1 license. The gallery covers shell/navigation, action and form controls, manual selection, evidence and limitations, a direct-child asset tree, a PM editor capped at 15 steps, draft/approval/version states, bilingual text/voice preview, and copy actions. Preview content is explicitly marked as sample-only; no full business workflow was added.

Added `replica/design/tokens.json`, `tokens.css`, `components.md`, `contrast-report.md`, `source-reference.md`, the public sign-in capture, and desktop/mobile gallery screenshots. Updated `replica/architecture.md` from CSS Modules to Tailwind CSS v4.

Verification: the contrast checker reports 24 pairs and 0 failing AA; `npm run build` succeeds; browser review at 1440×1000 and 390×844 found no horizontal overflow and the logo loaded; the icon-only button and form-control name audit returned 0 missing names; keyboard navigation and Enter activation worked; the Radix dialog opened, Escape closed it, and focus returned to its trigger; the PM editor disabled Add step at 15. The browser console had 0 errors after reload.

The warning token is a proposed accessible semantic color, not an observed MacroCap color. The logo is loaded from the observed public URL; permanent hosting and reuse terms remain unverified. Workspace has no Git metadata, so no Git diff or commit was produced.

Tracking map: [map.md](../map.md). The next flow step is `/replica-build`.
