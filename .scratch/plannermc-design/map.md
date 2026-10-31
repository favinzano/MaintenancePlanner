# PlannerMC design map

Scope: design system and component gallery for the PlannerMC MVP.  
For: Maintenance Planner.  
Date: 2026-10-30.

## Sources

| Source | Use |
| --- | --- |
| `specs/001-plannermc-mvp/spec.md` | Product behavior and scope authority. |
| `replica/brand-reference.md` | User-directed MacroCap Labs logo, palette, typography, and observed visual direction. |
| `replica/architecture.md` | Architecture proposal and styling decision to update. |
| `.scratch/plannermc-design/spec.md` | Scope and acceptance for this design step. |

## Decisions-so-far

- Keep PlannerMC as the product name and display the MacroCap Labs identity.
- Use Tailwind CSS v4 with Vite, CSS theme variables, Lucide React, and Radix primitives where compound keyboard behavior is needed.
- Use the higher contrast `#707070` input/control border token while retaining the observed subtle divider separately.
- Implement visual primitives only. Do not add end-to-end business behavior.
- Delivered the Vite gallery at `/design`, tokens, component inventory, source sign-in capture, Geist license notice, and desktop/mobile screenshots. Tracking issue: [01-design-system](issues/01-design-system.md).
- Contrast checker passed 24 declared pairs with 0 AA failures; Vite production build and browser keyboard/dialog checks passed. The editor caps the local sample at 15 steps.
- Next flow step: `/replica-build`.

## Fog

- The source icon package and formal brand guide were not identified in the public reference.
- The warning color will be recorded as approximate if it cannot be sampled reliably from the public sign-in page.
- The exact MacroCap logo URL is publicly observed but its permanent hosting and reuse terms have not been confirmed.
- Warning yellow is a documented semantic proposal because the public sign-in reference did not show a warning state.
