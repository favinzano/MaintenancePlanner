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
- The Supabase/Fastify backend slice and hosted development QA are documented under `.scratch/replica-backend/`; they do not establish production service behavior.
- Tracking issue: [01-planner-data-vertical-slice](issues/01-planner-data-vertical-slice.md).
- Implemented the planner-data path and retained `/design`; see [build log](../../replica/build-log.md) and [`features.csv`](../../replica/features.csv) for partial and complete items.
- Hosted development Auth/API/persistence/ownership was smoke-verified; invitation delivery and production service behavior remain open. See `replica/build-log.md` and `.scratch/replica-backend/`.
- User approved the next `/replica-build` slice: planner-provided source details → review and limitations → source reference in an editable PM draft. Track it in [02-planner-source-to-pm-draft](issues/02-planner-source-to-pm-draft.md).
- Historical scope for issue 02: it used planner-provided notes only, while manual upload/OCR, research, generated technical content, and production limits were deferred pending Q2/Q3 choices. Issue 03 records the later manual-intake decision and implementation.
- The source-to-PM reference implementation, applied dev migration, six passing validation cases, live read-back, and approval-blocker review are recorded in [the build log](../../replica/build-log.md). Issue [02](issues/02-planner-source-to-pm-draft.md) is resolved.
- User delegated Q2/Q3 for the initial manual flow to the assistant's judgment. Decision: extract PDF, DOCX, JPG/JPEG, and PNG in the browser using locally bundled PDF.js, Mammoth, and Tesseract.js assets. Do not send manuals or extracted text to external OCR, AI, search, or speech services. The original requested upload is persisted through the already-approved Supabase/PostgreSQL boundary; research, generation, and voice remain deferred.
- Q3 format choice is resolved for this slice; numeric byte/page limits remain unset until representative manuals and live development database use are measured. Production uploads stay disabled until capacity, plan, backups, retention, and a restore test are established.
- Tracking issue: [03-local-manual-intake](issues/03-local-manual-intake.md).
- Issue [03](issues/03-local-manual-intake.md) is resolved for implementation and requested checks. Chromium FileChooser selection/local extraction and second-account manual download denial passed with synthetic data; temporary identities, fixture, analysis rows, and processes were cleaned up. The Windows file dialog's visual appearance and keyboard navigation remain unverified because Playwright handled selection through `FileChooser.setFiles`. Numeric limits and production upload readiness remain open; see [test plan](../../replica/test-plan.md) and [build log](../../replica/build-log.md).
- The `/replica-diff` assessment is in [`replica/parity.md`](../../replica/parity.md). It previously scored 61.1/100 after issue 04; implementing issue 05 raised the PlannerMC-only score to 66.7/100. Neither score is vendor-app parity, and no comparable original workflow screenshots or walkthrough are available.
- Issue [04-pm-revision-lifecycle](issues/04-pm-revision-lifecycle.md) is resolved. The additive migration was applied to `plannermc-dev` only; hosted lifecycle QA and a focused local Playwright test passed. Evidence and retained synthetic QA data are documented in `replica/test-plan.md` and `replica/build-log.md`.
- Issue [05-pm-split-proposal](issues/05-pm-split-proposal.md) is resolved. The planner can author overflow actions, choose a boundary, review two PMs under the 15-step cap, and confirm or cancel. Both drafts persist independently and were verified in local E2E and authenticated `plannermc-dev` QA. Production and CMMS were not touched.
- Updated [`replica/parity.md`](../../replica/parity.md) to 66.7/100 against the PlannerMC MVP must-haves. This is not vendor-product parity.
- Ran the local `replica-diff` parity script against the PlannerMC-only matrix at `replica/diffs/plannermc-scope.csv`. Four of nine must-haves are complete; five remain incomplete. No original workflow captures exist for layout or behavior comparison.

## Fog

- Production deployment, initial catalog provisioning, external research/generation/speech vendors, numeric document limits, audio retention, and recovery targets remain unresolved. Local browser OCR is implemented for manual intake in development only.
- No production project or production security properties are claimed. The original planner-data slice remains local unless Supabase mode is configured.
- The PM revision lifecycle is verified in the synthetic development project. Production deployment and database state remain untouched and unverified.

## Next flow step

Issues 04 and 05 are resolved, and the `/replica-diff` report has been refreshed. [Inference] The next candidate is a bounded `/replica-build` slice for field-level PM evidence citations using already reviewed planner/manual sources. The user has not yet approved that implementation scope. Other remaining gaps and dependencies are ranked in `replica/parity.md`.
