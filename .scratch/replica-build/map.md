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
- User approved the next bounded `/replica-build` slice: citations on frequency, duration, operating state, safety, task steps, and final verification, using reviewed applicable sources from the same analysis. Implementation is tracked in [06-field-level-pm-evidence-citations](issues/06-field-level-pm-evidence-citations.md); do not infer support or source locators.
- Issue [06-field-level-pm-evidence-citations](issues/06-field-level-pm-evidence-citations.md) is resolved. Local automated tests and authenticated synthetic `plannermc-dev` QA verified citation authoring, persistence/read-back, step remapping, approval, and retained snapshots. A JSONB key-order false negative in the server comparator was corrected and regression-tested. One explicitly labeled QA analysis remains in development; production and CMMS were untouched.
- Refreshed [`replica/parity.md`](../../replica/parity.md) and `replica/diffs/plannermc-scope.csv` after issue 06. Score remains 66.7/100 against PlannerMC MVP must-haves because source provenance is still partial while external-source citations are deferred. This is not vendor-product parity.
- Ran the local `replica-diff` parity script against the PlannerMC-only matrix at `replica/diffs/plannermc-scope.csv`. Four of nine must-haves are complete; five remain incomplete. No original workflow captures exist for layout or behavior comparison.
- Resolved [07-pm-draft-deletion](issues/07-pm-draft-deletion.md). Initial drafts can be deleted while preserving the analysis and evidence; revision drafts restore the approved snapshot and retain history. Local Chromium and authenticated synthetic `plannermc-dev` QA passed, including retry, stale-version conflict, and rejection of an approved PM without a draft. Production remained untouched; limits are recorded in the issue and test plan.
- Completed the authorized development catalog population from OPS: the live migration, TLS-verified dry-run and provision, independent read-back, and authenticated location/area selector checks passed. The current workspace has 4 OPS-derived locations and 16 areas; its 2 synthetic locations and 4 areas were preserved. Supabase documentation explains that `main / PRODUCTION` can be the default dashboard-branch label on projects without GitHub integration; that label alone does not establish production use. See issue 08 and `.scratch/replica-test` for evidence.
- Resolved [09-conversation-language-preference](issues/09-conversation-language-preference.md): authenticated planners can persist `en`/`es` for future conversation prompts. Focused tests and authenticated development reload/read-back passed. The setting does not add text conversation, translation, or voice; the full must-have remains partial.
- On 2026-11-01, measured `plannermc-dev` in a TLS-verified `READ ONLY` transaction: database size 12,375,731 bytes, one synthetic 629-byte QA manual, and 65,536 bytes for the `original_documents` relation. The only manual is too small and synthetic to derive operating limits. Supabase's current published Free-plan database-size quota is 500 MB/project; the provisioned disk is a separate quota. No project data was changed.

## Fog

- Production deployment, external research/generation/speech vendors, numeric document limits, audio retention, and recovery targets remain unresolved. The Q4 operator-managed catalog is populated and verified in `plannermc-dev`; this does not establish production readiness. Local browser OCR is implemented for manual intake in development only.
- No production project or production security properties are claimed. The original planner-data slice remains local unless Supabase mode is configured.
- The PM revision lifecycle is verified in the synthetic development project. Production deployment and database state remain untouched and unverified.

## Next flow step

Issue 08 resolves Q4 and issue 09 adds the `en`/`es` preference. `/replica-diff` reports 77.8/100. The development database-use half of the manual-capacity gate is now measured. Continue with [issue 10](issues/10-manual-capacity-bounds.md) to profile representative files locally; this is the next concrete `/replica-build` work item. Leave upload limits unset until that evidence exists. Production still requires its own plan, capacity, backup, retention, and restore gates. Research, technical generation, and voice remain deferred.
