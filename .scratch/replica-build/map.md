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
- The first planner-data slice was kept limited to planner-entered information. The authenticated backend is active in development; manual intake is now implemented for development only. The app must not imply that external research, AI generation, speech, or CMMS integration is active.
- Keep the browser-local adapter as an explicitly labeled prototype mode. Mark its storage and sample catalog as local and synthetic.
- The Supabase Auth/PostgreSQL choice and invitation-only account policy are now accepted in [ADR 0001](../../docs/adr/0001-supabase-auth-and-postgres.md). Initial production catalog and hosting decisions remain open.
- The first Supabase/Fastify backend slice is being tracked under `.scratch/replica-backend/`; it does not establish production service behavior.
- Tracking issue: [01-planner-data-vertical-slice](issues/01-planner-data-vertical-slice.md).
- Implemented the planner-data path and retained `/design`; see [build log](../../replica/build-log.md) and [`features.csv`](../../replica/features.csv) for partial and complete items.
- `/replica-backend` is in progress; local or hosted Supabase behavior has not been exercised.
- The completed authenticated planner-data backend and hosted development QA are recorded in `replica/build-log.md` and `.scratch/replica-backend/`; the bullets above describing backend work as pending are historical for the initial slice.
- User approved the next `/replica-build` slice: planner-provided source details → review and limitations → source reference in an editable PM draft. Track it in [02-planner-source-to-pm-draft](issues/02-planner-source-to-pm-draft.md).
- Historical scope for issue 02: it used planner-provided notes only, while manual upload/OCR, research, generated technical content, and production limits were deferred pending Q2/Q3 choices. Issue 03 records the later manual-intake decision and implementation.
- The source-to-PM reference implementation, applied dev migration, six passing validation cases, live read-back, and approval-blocker review are recorded in [the build log](../../replica/build-log.md). Issue [02](issues/02-planner-source-to-pm-draft.md) is resolved.
- User delegated Q2/Q3 for the initial manual flow to the assistant's judgment. Decision: extract PDF, DOCX, JPG/JPEG, and PNG in the browser using locally bundled PDF.js, Mammoth, and Tesseract.js assets. Do not send manuals or extracted text to external OCR, AI, search, or speech services. The original requested upload is persisted through the already-approved Supabase/PostgreSQL boundary; research, generation, and voice remain deferred.
- Q3 format choice is resolved for this slice; numeric byte/page limits remain unset until representative manuals and live development database use are measured. Production uploads stay disabled until capacity, plan, backups, retention, and a restore test are established.
- Tracking issue: [03-local-manual-intake](issues/03-local-manual-intake.md).
- Issue [03](issues/03-local-manual-intake.md) is resolved for the implementation and requested server/build checks. The applied development migration, local extraction checks, synthetic original read-back, PM reference, and upload shutdown after QA are recorded in [the build log](../../replica/build-log.md). Mobile E2E, a real OS file-picker selection, and manual-specific cross-account denial remain unverified and are tracked in the test plan/bug notes.

## Fog

- Production deployment, initial catalog provisioning, external research/generation/speech vendors, numeric document limits, audio retention, and recovery targets remain unresolved. Local browser OCR is implemented for manual intake in development only.
- No production project or production security properties are claimed. The original planner-data slice remains local unless Supabase mode is configured.
