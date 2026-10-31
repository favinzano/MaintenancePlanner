# PlannerMC architecture map

Scope: propose an application architecture and persistence/API design for the current PlannerMC MVP.  
For: Maintenance Planner.  
Date: 2026-10-29.

## Sources

| Source | Use |
| --- | --- |
| `specs/001-plannermc-mvp/spec.md` | Product behavior and scope authority. |
| `specs/001-plannermc-mvp/plan.md` | Existing proposed modules, stack decisions D1–D15, interaction contract, data model, and open questions Q1–Q6. |
| `docs/constitution.md` | Stack minimization, separation of domain rules, traceability, persistence verification, and language constraints. |
| `replica/recon.md`, `replica/features.csv` | Functional reference boundaries for iMPS and GWOS-AI. |
| `replica/brand-reference.md` | User-directed MacroCap visual reference for the later design step. |

## Decisions-so-far

- Treat the existing local spec as authoritative; the architecture adds no product scope.
- Carry forward TypeScript, React/Vite, Fastify, PostgreSQL, and server-side data-layer ownership checks as proposals already recorded in technical-plan decisions D1–D4 and D9.
- Keep OCR, external research, generation, STT, and TTS behind ports. Providers, data-transfer policy, deployment, limits, provisioning, voice retention, and recovery remain Q1–Q6.
- Use a single application and transactional database; no service integration or CMMS writeback is added.
- Use MacroCap Operations branding only when the design step begins; preserve PlannerMC as the product name in these architecture documents.
- Deliverables: [replica/architecture.md](../../replica/architecture.md) and [replica/schema.sql](../../replica/schema.sql); the design flow is next.

## Fog

- Q1: deployment location and supported voice clients.
- Q2: extraction/OCR, research, generation, STT/TTS providers and whether protected materials may be sent externally.
- Q3: file/audio limits and supported Word/image variants.
- Q4: account/catalog provisioning and account recovery.
- Q5: voice audio/transcript retention and vendor terms.
- Q6: backup, restore, capacity, and recovery criteria.
- Storage of originals as PostgreSQL `BYTEA` remains conditional on Q1/Q3; no production hosting or capacity decision is made.
- The API and schema are proposals; they are not an approved implementation or evidence of operational behavior.
