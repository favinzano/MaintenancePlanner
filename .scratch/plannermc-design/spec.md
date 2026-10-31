# PlannerMC design system and component gallery

**Date:** 2026-10-30  
**Product:** PlannerMC  
**Next flow step:** `/replica-build`

## Goal

Define and implement a visual system for PlannerMC, using the user-directed MacroCap Labs identity documented in `replica/brand-reference.md`. The product name remains PlannerMC. Use the MacroCap Labs logo, observed dark colors, Geist Variable where available, and line icons from Lucide React. Preserve known source observations and mark approximations.

## Scope

- Adopt Tailwind CSS v4 with Vite and CSS `@theme` tokens.
- Use Radix primitives for compound controls requiring managed keyboard and focus behavior; use native HTML controls when sufficient.
- Create design tokens, CSS theme, component documentation, and an automated contrast report.
- Create a Vite gallery at `/design` with visual variants and states for navigation shell, buttons, fields, manual upload, evidence and limitation cards, asset hierarchy, PM steps capped at 15, draft/approval states, version history, bilingual text/voice composition, and copy actions.
- Capture the public sign-in page as a visual source reference. Do not save authenticated operational data.
- Implement primitives only, not end-to-end PlannerMC workflows.
- Exclude KPIs, charts, Gantt, inventory, and procurement.

## Acceptance

- Every declared text/surface pair passes WCAG AA contrast; controls, icons, and focus indicators meet 3:1.
- Vite production build succeeds.
- Desktop and mobile gallery screenshots are saved and reviewed.
- Keyboard order, activation, dialog close, focus return, and accessible names for icon-only controls are reviewed.
- PlannerMC is displayed with MacroCap Labs identity and no unsupported trademark symbol.
- `replica/architecture.md` reflects the selected Tailwind v4 styling proposal.
