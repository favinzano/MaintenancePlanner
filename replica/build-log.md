# PlannerMC build log

## 2026-10-31 · Supabase backend decision and first implementation slice

- **Decision.** Accepted [ADR 0001](../docs/adr/0001-supabase-auth-and-postgres.md): Supabase Auth for invitation-only email/password accounts, managed PostgreSQL as source of truth, Fastify as the only PlannerMC data API, and original manuals stored as PostgreSQL `BYTEA` when upload work is added.
- **Auth and API.** Added a Supabase Auth sign-in/password setup flow with no public registration; Fastify verifies Supabase JWT claims and maps the identity to a server-side workspace profile. Implemented authenticated workspace load and analysis create/update routes.
- **Persistence.** Added a local Supabase migration for profiles, synthetic catalog, analyses, planner data sources, assets, initial PM versions, and operation receipts. Analysis saves use an owner-scoped transaction, expected row versions, an idempotency receipt, and a separate post-commit read-back.
- **Provisioning.** Added an operator-run invite script. It uses the Supabase Auth Admin API and PostgreSQL credentials from an ignored `.env`; no project credentials or production account invitations were added.
- **Local development.** Added the Supabase CLI configuration and a synthetic local workspace/catalog seed. Set `VITE_DATA_MODE=supabase` to use the API; without it the previous browser-local prototype remains available. `/design` remains available.
- **Dependency review.** The first install reported three moderate advisories through the optional static-file plugin. Removed that plugin because production hosting remains open. The subsequent package audit reported zero vulnerabilities.
- **Build.** `npm run build` passed on 2026-10-31 after the invitation and JWT-claim refinements. The check compiled the web and API TypeScript and built the Vite bundle.
- **Live service status.** No local or hosted Supabase project was started in this step. Live Auth, invitation delivery, PostgreSQL migration application, and cross-account access have not been exercised. No production project or credentials exist in the workspace.
- **Dependency review.** `npm audit` reported zero vulnerabilities after removing the optional static-file plugin.
- **Tests.** No automated tests were added or run.

## 2026-10-31 · Hosted development project provisioning

- **Project.** Created an isolated Supabase Free development project named `plannermc-dev` in `us-east-1`; this is not a production project. Supabase reported the project healthy, with Auth, PostgreSQL, and REST healthy.
- **Auth configuration.** Set the site and allowed redirect URL to `http://127.0.0.1:4173`, disabled public sign-up, phone and anonymous sign-in, required email confirmation, and set a 12-character minimum password. No SMTP provider is configured, and no invitation was sent.
- **Database.** Applied `20261031000000_planner_data.sql` and `supabase/seed.sql` to the hosted development project. A read-only SQL check confirmed PostgreSQL 17.11, the `workspaces`, `analyses`, and `assets` tables, and the synthetic catalog of 2 locations and 4 areas.
- **Local secrets.** Project configuration and keys are stored only in the ignored `.env`; the repository contains no live credentials. No production project was created.
- **TLS configuration.** Fastify and the operator invite script require a CA file for remote PostgreSQL connections and keep certificate validation enabled. The root CA was downloaded from the project's Database → SSL Configuration page and stored at the ignored path `supabase/ssl/prod-ca-2021.crt`.
- **API smoke.** After installing the Supabase root CA, the Fastify API connected to hosted PostgreSQL with certificate validation enabled. Two temporary, confirmed test accounts signed in with email/password. Anonymous access returned 401; each account saw only its own analyses; create/save passed separate read-back; idempotent replay succeeded; a cross-account write and a stale row-version write returned 409. Both test accounts and all test rows were deleted, and the temporary API process was stopped.
- **Invitation boundary.** No invitation email was sent or tested because this development project has no SMTP provider. The operator invite-email path and production delivery remain unverified.
- **Final checks.** `npm run build`, `node --check scripts/invite-user.mjs`, and `git diff --check` passed. Vite reported the existing 590.53 kB JavaScript bundle warning. The smoke script was temporary and removed; no automated test suite was added or run.

## 2026-10-31 · Planner-data vertical slice

- **S01 Workspace entry — partial.** Added a local-prototype entry and resume list. Account sign-in is not implemented because provisioning/recovery decisions remain open under Q4.
- **S02 Analysis intake — done for this slice.** Added equipment name, optional original label/manufacturer/model, planner notes, and a synthetic location/area catalog.
- **S03 Evidence and decision — done for this slice.** Shows planner-supplied information and the limits of this build; requires an explicit choice before continuing.
- **S04 Asset proposal — done for this slice.** Supports one equipment asset and direct sub-assets, individual confirmation, and an explicit warning for a selected child without a confirmed parent. Duplicate search and asset updates are not included.
- **S05 PM editor/review — partial.** Supports planner-authored draft fields, unresolved safety acknowledgment, a 15-step maximum, local save/read-back, reload, initial approval, full PM copy, and per-step copy. It does not generate technical content or provide later revision history.
- **Data layer.** `src/data/local-prototype-store.ts` provides a replaceable browser-local prototype adapter. Every reported save is read back and compared. It is not an authenticated or server-backed store.
- **Scope boundary.** No manual upload/OCR, external research, AI generation, speech, real sign-in, CMMS write, scheduling, inventory, purchasing, or reporting was added.
- **Visuals.** Workflow captures are in `replica/clone-screens/`; the existing component gallery remains at `/design`.
- **Build.** `npm run build` completed successfully on 2026-10-31.
- **Manual browser review.** Walked the intake → limitation decision → asset confirmation → PM draft/save/reload → approval → clipboard flow. Tab + Enter activated the workspace start action. Each workflow step had no horizontal overflow at 390 CSS px; the PM screen measured 1440 CSS px at the 1440 px desktop viewport. The browser reported zero console errors after a clean reload. Automated tests were not added or run.
- **Repository.** Local Git metadata is initialized and the workspace baseline is recorded in the first commit. Browser automation logs, traces, and snapshots under `.playwright-mcp/` are excluded as generated artifacts. No remote is configured.

## 2026-10-31 · Reviewed planner source to PM reference

- **Source record.** Planner-provided notes now carry a reference label, locator, equipment applicability, applicability details, limitations, and review timestamp. The persistent limitation states that planner-provided information is not independently verified.
- **Review gate.** Editing the source clears the continuation acknowledgment. Continuing records the source review timestamp together with the explicit decision to proceed with limitations.
- **PM draft.** The editor can attach the reviewed planner source to an editable PM. The PM preview and copied text show the source label, locator, applicability, applicability details, and limitations. New drafts attach it by default only when applicability was marked applicable; the planner can change that choice.
- **Persistence and validation.** Local prototype data normalizes older records. Fastify validates source metadata and references, rejects a reference that does not match the analysis source, stores metadata on the owner-scoped planner-data source, stores PM references with the PM version, and compares canonical read-back after save. Added additive migration `20261031120000_planner_source_metadata.sql` for the hosted development schema.
- **Scope boundary.** This slice uses planner notes only. Manual upload/OCR, external research, field-level citations, technical generation, and production file limits remain open or out of scope.
- **Development database.** Applied the additive migration to the confirmed `plannermc-dev` project through the authorized Supabase connection. Read-only schema inspection confirmed the six new columns and the migration history entry. No production project was touched.
- **Verification.** `npm run test:server-validation` passed all 6 cases, including mismatched source IDs, duplicate references, malformed IDs, and missing review. `npm run build` passed; Vite reported a 597.74 kB JavaScript chunk warning. In the authenticated browser, a synthetic QA source was reviewed, saved, and read back. Its PM draft reference remained selected and visible in the preview after reload. Attempting approval with a blank PM and unchecked review showed the complete blocker list and left the PM as a draft.
- **Capture and QA data.** Captured the current PM/reference screen in the active browser review. The synthetic `QA ONLY` development analysis now has a saved planner source and draft PM; no production data was touched. The screenshot was shown inline in the review but was not saved as a repository file.

## Remaining in the next steps

- `/replica-backend`: the bounded authenticated planner-data slice is implemented and its hosted development Auth/API/persistence/ownership path was smoke-verified. Invitation email delivery remains open until SMTP is configured. Production hosting, real account/catalog provisioning, manual limits, backup retention, and recovery targets remain open.
- Later build milestones: manual intake and source locators, external research, full asset/PM review and revision lifecycle, and bilingual text/voice conversation.
