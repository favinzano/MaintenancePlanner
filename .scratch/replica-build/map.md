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
- Keep the browser-local adapter as an explicitly labeled prototype mode. Mark its storage and sample catalog as local and synthetic.
- The Supabase Auth/PostgreSQL choice and invitation-only account policy are now accepted in [ADR 0001](../../docs/adr/0001-supabase-auth-and-postgres.md). Initial production catalog and hosting decisions remain open.
- The first Supabase/Fastify backend slice is being tracked under `.scratch/replica-backend/`; it does not establish production service behavior.
- Tracking issue: [01-planner-data-vertical-slice](issues/01-planner-data-vertical-slice.md).
- Implemented the planner-data path and retained `/design`; see [build log](../../replica/build-log.md) and [`features.csv`](../../replica/features.csv) for partial and complete items.
- `/replica-backend` is in progress; local or hosted Supabase behavior has not been exercised.
- The completed authenticated planner-data backend and hosted development QA are recorded in `replica/build-log.md` and `.scratch/replica-backend/`; the bullets above describing backend work as pending are historical for the initial slice.
- User approved the next `/replica-build` slice: planner-provided source details → review and limitations → source reference in an editable PM draft. Track it in [02-planner-source-to-pm-draft](issues/02-planner-source-to-pm-draft.md).
- This slice will use planner-provided notes only. Manual upload, OCR, external research, generated technical content, and production file limits remain out of scope pending Q2/Q3 choices.
- The source-to-PM reference implementation, applied dev migration, six passing validation cases, live read-back, and approval-blocker review are recorded in [the build log](../../replica/build-log.md). Issue [02](issues/02-planner-source-to-pm-draft.md) is resolved.

## Fog

- Production deployment, initial catalog provisioning, AI/OCR/research/speech vendors, file limits, audio retention, and recovery targets remain unresolved in the architecture proposal.
- No production project or production security properties are claimed. The original planner-data slice remains local unless Supabase mode is configured.
