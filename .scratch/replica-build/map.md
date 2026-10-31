# PlannerMC replica-build map

Scope: first end-to-end planner-data slice from the architecture build order.
For: Maintenance Planner.
Date: 2026-10-31.

## Sources

| Source | Use |
| --- | --- |
| `specs/001-plannermc-mvp/spec.md` | Product behavior and acceptance criteria. |
| `replica/architecture.md` | Slice order, proposed boundaries, and unresolved Q1–Q6. |
| `replica/recon.md` | Product comparison boundaries; no vendor code or operational data. |
| `replica/design/` | MacroCap Labs visual language and component tokens. |
| `docs/constitution.md` | Domain/UI separation, persistence, language, and implementation constraints. |

## Decisions-so-far

- Keep the existing design gallery at `/design`; place the PlannerMC workflow at `/`.
- Build only the first planner-data vertical slice. The app must not imply that authentication, AI generation, manual extraction, research, or CMMS integration is active.
- Use a local browser adapter with read-back verification as a replaceable prototype seam. Mark its storage and sample catalog as local and synthetic.
- Defer live account provisioning and external integrations while Q1–Q6 remain open.
- Tracking issue: [01-planner-data-vertical-slice](issues/01-planner-data-vertical-slice.md).
- Implemented the planner-data path and retained `/design`; see [build log](../../replica/build-log.md) and [`features.csv`](../../replica/features.csv) for partial and complete items.
- Next flow step is `/replica-backend`; this is not production persistence.

## Fog

- Production persistence, deployment, identity provisioning, AI/OCR/research/speech vendors, file limits, audio retention, and recovery targets remain unresolved in the architecture proposal.
- No backend implementation or production security properties are claimed by the local prototype.
