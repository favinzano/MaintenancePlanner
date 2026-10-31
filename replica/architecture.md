# PlannerMC architecture baseline

**Status:** MVP technical choices accepted; see [ADR 0001](../docs/adr/0001-supabase-auth-and-postgres.md)
**Date:** 2026-10-31
**Product scope:** `specs/001-plannermc-mvp/spec.md`  
**Technical baseline:** `specs/001-plannermc-mvp/plan.md`

This document records the approved MVP technical choices and the remaining operational choices. It does not establish that a production project exists or that any service has been deployed. `schema.sql` is the broader relational proposal; `supabase/migrations/` contains the implemented planner-data subset for the current slice.

**Stack summary:** one PlannerMC web/API application using React/Vite + TypeScript and Fastify + TypeScript, backed by managed Supabase Auth and PostgreSQL. External content providers and PlannerMC app hosting remain open where Q1–Q6 apply.

## Stack

| Layer | Proposal | Why and condition |
| --- | --- | --- |
| Web UI | React + TypeScript + Vite | Carries forward D2/D3. Fits the editing, hierarchy, conversation, copy, and conflict states in RF-1–RF-11. |
| Styling | Tailwind CSS v4 with Vite and CSS `@theme` design tokens derived from the user-directed MacroCap reference | Carries forward the design-step decision. Semantic theme variables map the observed dark palette and Geist Variable to utilities; Radix Primitives and native controls cover accessible interactions. |
| Application/API | Fastify + TypeScript + JSON Schema at the HTTP boundary | Carries forward D2/D3; schema validation stays at the boundary, while business rules remain in the domain layer. |
| Domain and application | TypeScript modules in the same application | Carries forward the modular-monolith proposal and constitution requirement C3. No microservices. |
| Database | Managed Supabase PostgreSQL; relational ownership and relationships, JSONB for structured PM content, BYTEA for original documents | Accepted in ADR 0001. PostgreSQL is the source of truth. Exact production plan, file limit, backup retention, and recovery target remain open. |
| ORM/query layer | Parameterized SQL through a small repository layer; no ORM selected | Avoids choosing an additional library before implementation. Revisit only if the chosen driver/repository approach creates a concrete need. |
| Authentication | Supabase Auth with email and password; invitation-only accounts | Accepted in ADR 0001. Fastify verifies Supabase access-token claims, resolves the user's PlannerMC profile/workspace, and applies ownership checks. PlannerMC does not store password hashes or expose public registration. |
| Extraction, research, generation, STT, TTS | Browser-local PDF.js for PDF text, Mammoth for DOCX, and locally hosted Tesseract.js assets for image OCR; external research/generation/speech are deferred | Q2 is resolved for manual processing: manual bytes and extracted text do not go to external processing services. Only a requested original is sent through the accepted Supabase/PostgreSQL boundary. Q2 remains open for the deferred capabilities and their budgets. |
| Background work | Application-coordinated persisted work state in PostgreSQL; no separate queue initially | Carries forward section 5.4 of the technical plan. Long operations must not hold a database transaction open. Revisit if measured workload requires a worker/queue. |
| File storage | PostgreSQL `BYTEA` for original manuals; compact page/paragraph range in `sources.locator` JSONB | Accepted in ADR 0001 and implemented for the development slice. Store metadata and SHA-256 with bytes; verify record and bytes by independent read-back. Byte/page ceilings remain unset until representative manuals and live DB use are measured. Development uploads currently fail closed; production uploads remain disabled pending capacity and backup/restore readiness. |
| Hosting | Supabase-managed Auth and database; PlannerMC web/API hosting unselected | Q1 still needs to decide where Fastify and the web app run and which browsers/devices support voice. |
| Payments, email, external scheduler | None in MVP | No current requirement supports adding these dependencies. |

## Application boundaries

Use one deployable application, divided by responsibility. These are internal modules, not independently deployed services.

| Module | Owns | Must not own |
| --- | --- | --- |
| Identity | Supabase Auth identity verification, account identity, workspace ownership, authorization context | Shared-work permissions and catalog provisioning; accounts remain invitation-only and operator-managed |
| Intake and sources | Original documents, extraction references, research results, source applicability and limitations | Planner decisions or final approval |
| Asset registry | Equipment/sub-asset proposals, confirmed assets, duplicate warnings, update proposals | Automatic merging or hierarchy deeper than direct sub-assets |
| Maintenance planning | PM candidates, grouping, frequency, duration, operating state, step count, split proposals | CMMS work-order creation or unsupported technical conclusions |
| Review and decisions | Advance decisions, pending issues, optional technical validation, approval and revisions | Treating a planner's decision to continue as technical evidence |
| Persistence | Transactions, ownership-scoped repositories, row versions, operation receipts and read-back verification | Domain rules embedded in SQL-only or UI-only checks |
| Conversation and documents | English business document, es/en text/voice interaction, copy preparation | Approvals outside the same domain use cases used by UI controls |
| Web interface | Sign-in, analysis, evidence review, hierarchy, PM edit/review, errors and copy | Making authorization, approval, duplicate resolution or conflict policy decisions locally |

Dependency direction: UI → application use cases → domain. Repositories and external services implement ports used by application cases. The domain has no dependency on HTTP, database, provider SDK, file system, or UI. Voice and text invoke the same application cases.

## Schema

The proposed PostgreSQL schema contains **18 tables**. See [schema.sql](./schema.sql).

| Area | Tables | Important invariants |
| --- | --- | --- |
| Identity and catalog | `workspaces`, `users`, `user_preferences`, `locations`, `areas` | One planner identity per account; es/en conversation preference; each area references a location in the same workspace. Catalog provisioning remains Q4. |
| Analysis and evidence | `analyses`, `original_documents`, `sources`, `planner_decisions`, `pending_issues` | One equipment analysis; originals are retained; sources carry applicability and locators; decisions refer to the version presented; unresolved issues remain explicit. |
| Assets | `assets`, `asset_change_proposals` | One equipment root per analysis; only direct sub-assets; possible duplicates are indexed for warning, not blocked by unique name/serial constraints. |
| PM lifecycle | `pms`, `pm_versions`, `technical_validations` | Draft edits use `row_version`; approved snapshots receive revision numbers; each PM has one current-approved pointer; technical consultation is optional. |
| Provenance and writes | `evidence_annotations`, `evidence_sources`, `operation_receipts` | Evidence remains attached to the field/version; idempotent writes can be reconciled; delete receipts store no removed draft content. |

### Access rules

Use server-side ownership checks. Supabase Auth owns credentials and user identity; the PlannerMC profile ID references `auth.users.id`. Fastify verifies the Supabase access token using Supabase's supported claim-verification API, then derives the user and workspace from the server-side profile. The client never supplies a trusted `owner_id` or `workspace_id`. Repository methods scope reads and writes by both `workspace_id` and `owner_id`, including document downloads, duplicate searches, child-resource lookups, pending decisions, and operation receipts. Composite foreign keys reinforce ownership consistency. Browser clients do not connect directly to PostgreSQL or write PlannerMC tables. Privileged keys and database credentials stay on the server.

Every user-owned row carries `owner_id` and `workspace_id`, except the user identity/preferences and workspace/catalog roots, whose ownership is represented by their identity or workspace relationship. All timestamps use `timestamptz` and UTC. The server updates `updated_at` on every mutation. Draft edits increment `row_version`; formal revision numbers are assigned only when approving.

### Transaction boundaries and storage

- A write and its operation receipt commit in the same PostgreSQL transaction.
- PM approval serializes on the PM/version, assigns the next revision number once, stores the immutable approved snapshot, updates the current-version pointer, and records the receipt atomically.
- A repeated command with the same `operation_id` and request digest returns its existing outcome. Reusing the ID with a different digest is a conflict. A second operation ID cannot approve the same PM version twice.
- Draft edits compare `expected_row_version`; a mismatch returns a conflict and preserves both the saved version and the caller's proposed changes for review.
- After commit, read the primary store in a separate query and compare identity, owner, version, and expected result. For original files, verify bytes, digest, and link. A failed read-back yields an unverified result, not a false success/failure claim.
- Deleting a draft verifies its absence and the continued existence of protected documents, assets, and approved versions. The operation receipt retains only the minimum deletion outcome needed to reconcile retries.
- Do not keep database transactions open while waiting for a person, LLM, search service, OCR, STT, or TTS provider.
- Keep audio/transcripts transient until Q5 resolves retention and provider terms. Do not persist a chat transcript as a side effect of this design.

### API contract

The table describes the target API. Authentication actions use the Supabase Auth client directly; the current backend slice implements `GET /api/workspace`, `POST /api/analyses`, `PUT /api/analyses/{analysisId}`, and `GET /api/health`. Other rows are later routes, not implemented endpoints. `owner_id` and `workspace_id` are resolved on the server. Mutations carry an `operation_id`; edits also carry `expected_row_version`; decisions identify the presented resource/version and digest. Responses use the local plan's outcomes: `completed`, `awaitingDecision`, `failed`, `conflict`, or `resultUnverified`, with resource/version, issues, valid next actions, English UI message key, localized conversational explanation, and verification/operation metadata as applicable.

| Method and path | Action / flow | Caller | Input → output | Key checks |
| --- | --- | --- | --- | --- |
| `supabase.auth.signInWithPassword()` | Sign in | Public | Email/password → Supabase Auth session | Use a generic authentication failure; do not disclose whether another account exists. No public sign-up route. |
| `supabase.auth.signOut()` | Sign out | Authenticated | Session → cleared session | Revoke or clear the caller's Supabase Auth session only. |
| `GET /api/health` | API health | Public | None → service status | Does not expose environment values or account data. |
| `GET /api/workspace` | Load workspace catalog and analyses | Authenticated | None → catalog and owned analyses | Fastify verifies the token and scopes data through the server-side profile. |
| `POST /api/analyses` | Create analysis | Authenticated | `operation_id`, analysis, expected row version 0 → verified workspace snapshot | Validate catalog ownership, data shape, and the planner-data slice. |
| `PUT /api/analyses/{analysisId}` | Save analysis | Authenticated | `operation_id`, analysis, expected row version → verified workspace snapshot | Atomic transaction, owner/workspace scoping, idempotency receipt, optimistic version check, and post-commit read-back. |
| `GET /api/me/preferences` | Read language preference | Authenticated | None → preference | Resolve user from session. |
| `PUT /api/me/preferences/conversation-language` | Set es/en preference | Authenticated | `language`, `operation_id` → persisted preference | Verify by read-back; UI/document language remains English. |
| `GET /api/catalog/locations` | Load preconfigured locations | Authenticated | Optional search → owned-workspace locations | Catalog provisioning is not an MVP administration flow. |
| `GET /api/catalog/locations/{locationId}/areas` | Load valid areas | Authenticated | Location → its areas | Require location/workspace ownership. |
| `POST /api/analyses` | Start one-equipment analysis (F1) | Authenticated | Location, area, known equipment details → analysis | Area must belong to location; one equipment per analysis. |
| `GET /api/analyses/{analysisId}` | Resume analysis and current work | Authenticated | None → analysis, sources, assets, issues and PM references | Check owner/workspace on the analysis and every included child. |
| `POST /api/analyses/{analysisId}/documents` | Attach one manual (F1) | Authenticated | `application/octet-stream` original bytes, `operation_id`, digest and local extraction metadata → original reference and extraction state | Only PDF/DOCX/JPG/JPEG/PNG; browser extraction; configured byte/page limits; owner/workspace-scoped; preserve existing originals; production remains disabled until Q3/Q6 gates are met. |
| `GET /api/documents/{documentId}` | Retrieve original | Authenticated | None → original bytes and safe metadata | Owner-scoped; attachment/content headers set by server; do not expose database credentials or cross-workspace files. |
| `POST /api/analyses/{analysisId}/sources` | Record planner-provided data as evidence (F1/F2) | Authenticated | Source text/attributes, language, `operation_id` → source reference | Preserve original text and identify the source as planner data. |
| `POST /api/analyses/{analysisId}/research` | Search external sources (F2) | Authenticated | Description, function, available identifiers → sources and limitations | OEM-first adapter; provider and external data policy remain Q2. |
| `POST /api/analyses/{analysisId}/decisions` | Authorize step, continue with limitation, or stop (F2/F5) | Authenticated | Decision, presented digest, target, `operation_id` → recorded decision and next state | A stale or ambiguous decision cannot authorize new content. |
| `PUT /api/analyses/{analysisId}/asset-proposals` | Save/edit equipment and sub-asset proposal (F3) | Authenticated | Proposed hierarchy and version → proposal with duplicate candidates | Domain checks depth/parent; duplicate matches are warnings. |
| `POST /api/analyses/{analysisId}/assets/confirm` | Confirm selected assets (F3) | Authenticated | Selected IDs, explicit decisions, `operation_id` → confirmed assets | No implicit parent/sub-asset confirmation; valid names/location/area required. |
| `POST /api/assets/{assetId}/change-proposals` | Propose update of confirmed asset (F3) | Authenticated | Proposed changes, expected row version → pending proposal | Existing confirmed record remains unchanged pending decision. |
| `POST /api/asset-change-proposals/{proposalId}/apply` | Apply a reviewed update (F3) | Authenticated | Decision, `operation_id` → updated asset | Recheck row version and ownership in transaction. |
| `POST /api/analyses/{analysisId}/pms` | Create a planner-authored draft (F4) | Authenticated | Asset, task content, frequency/duration if known, evidence/limitations → saved draft | Enables the first vertical slice without claiming a generation provider is selected. |
| `POST /api/analyses/{analysisId}/pm-proposals` | Generate PM drafts and/or split proposal (F4) | Authenticated | Assets, authorized evidence, `operation_id` → draft versions and unresolved issues | Generator is a provider port; preserve source mapping and wait before splitting. |
| `GET /api/pm-versions/{versionId}` | Read the exact PM version for review/resume | Authenticated | None → version, evidence, pending issues and validation records | Version and every linked item must belong to the caller. |
| `PATCH /api/pm-versions/{versionId}` | Edit draft (F4/F6/F9) | Authenticated | Changed fields, expected version, `operation_id` → saved draft | Draft only; validate max 15 steps; do not silently overwrite concurrent edits. |
| `POST /api/pm-versions/{versionId}/pending-issues/{issueId}/resolve` | Provide missing information or continue with a visible limitation (F5) | Authenticated | Resolution, answer if supplied, presented digest → issue and version state | Continue does not invent a technical value or clear unresolved evidence. |
| `POST /api/pm-versions/{versionId}/technical-validations` | Record optional technical consultation | Authenticated | Collaborator and validated elements → validation record | No transcript or technician approval is required. |
| `POST /api/pm-versions/{versionId}/confirm` | Approve one reviewed PM version (F6) | Authenticated | Explicit approval, unresolved-item decisions, `operation_id`, row version → approved version | Show limitations; no CMMS write; one approval per version; read-back required. |
| `POST /api/pms/{pmId}/revisions` | Start a draft revision (F7) | Authenticated | Approved base version, `operation_id` → new draft | Previous approved version remains current until new approval. |
| `DELETE /api/pm-versions/{versionId}` | Delete own draft (F7) | Authenticated | Expected version, `operation_id` → verified absence | Reject if approved; preserve manual, assets and approved versions. |
| `GET /api/pm-versions/{versionId}/copy` | Render whole PM or one step for clipboard (F10) | Authenticated | Optional step number → English text and draft/limitation flags | Only render the requested, authorized version; no CMMS write. |
| `POST /api/conversation/turns` | Text/voice conversation using the same use cases (F10) | Authenticated | Text or transient audio, language, current context → response/action proposal | Provider is Q2/Q5; ambiguous voice confirmations require clarification. |

Inbound webhooks: none. Outbound webhooks: none. Periodic jobs: none. Long-running analysis/research work may resume from persisted analysis state and return its processing status; its provider-specific execution policy remains open under Q2/Q3. No separate queue is proposed at this stage.

This table combines target API routes and Supabase Auth client operations. The implemented Fastify route subset is listed in the paragraph above; the rest remains planned.

## The parts that need explicit handling

- **Time zones and daylight saving:** store audit and approval timestamps as UTC `timestamptz`. No planner schedule is calculated in this MVP, so do not add a site timezone field until a user-visible behavior needs it.
- **Idempotency:** stable `operation_id`, request digest, unique owner/workspace operation key, same-transaction receipt, and unique approval per PM version. Verify both identical and conflicting retries.
- **Races:** optimistic `row_version` for draft/asset edits; transaction lock or equivalent per PM for revision numbering and approval; constraints backstop application checks. Two browser tabs must surface a conflict, not last-write-wins.
- **File size and formats:** PDF, DOCX, JPG/JPEG, and PNG are approved and implemented for the initial manual flow. Byte/page ceilings remain open under Q3. Require explicit configuration and fail closed when limits are missing; preserve earlier originals on every failed or over-limit upload. The development environment currently has no upload limits configured and shows uploads disabled. Production remains disabled until actual capacity and backup/restore readiness are established.
- **Search and evidence:** no vector database initially (D7). Preserve source URI, model/applicability, locator, extraction gaps and field-to-source links. Retrieval failure is distinct from no matching source.
- **AI/content safety:** provider output is an untrusted candidate. Validate structure and source references; it has no write permission. A planner decision is linked to the exact presented version and does not make unsupported evidence true.
- **Realtime/offline:** neither is specified. Browser edits must handle reload/recovery and concurrent-session conflicts; no offline-write guarantee is proposed.
- **Multi-tenancy:** workspace plus owner scoping on all repository operations, foreign-key consistency, and no client-trusted ownership identifiers. Account invitation policy is accepted; initial catalog provisioning remains open under Q4.
- **Audio/privacy:** transient processing is the proposal until Q5. No voice recording archive, transcript history, or vendor retention assertion is made.
- **Backups/recovery:** select a Supabase plan with database backups and complete a restore test before production uploads. Backup retention, capacity, and recovery targets remain open under Q6. Do not claim that durable primary storage alone meets recovery expectations; no retention purge can be used to satisfy the agreed preservation behavior.
- **External service limits:** provider quotas, payload limits, timeouts, pricing, and retention stay undecided with Q2/Q3/Q5. Adapter failures must preserve the draft/evidence and offer a planner choice.

## Build order

Each milestone lists proposed screens (S-IDs), tables, and routes. These S-IDs name PlannerMC screens proposed for planning and are not observed screens of an existing product.

1. **Vertical slice, planner-data path:** Sign in → start one analysis from a preconfigured location/area → record planner-provided equipment/task/frequency details → confirm selected assets → create a planner-authored PM draft → save, reload, approve, and copy. Screens: S01 Sign in, S02 Analysis intake, S03 Evidence and decisions, S04 Asset proposal, S05 PM editor/review. Implement Supabase Auth identity and the Fastify/PostgreSQL persistence boundary. This slice uses planner-entered content and does not claim OCR or generation quality.
2. **Must-haves: intake and evidence:** Implemented for the development slice: authenticated original storage in PostgreSQL `BYTEA`, in-browser extraction, page/paragraph locators, visible limitations, applicability review, and references in PM preview/copy. Migration `20261031170000_planner_manual_documents.sql` is applied to `plannermc-dev`. PDF/DOCX/JPG/JPEG/PNG use locally bundled PDF.js/Mammoth/Tesseract.js. Research remains deferred under Q2. Numeric byte/page limits remain open under Q3; development and production uploads are fail-closed until their limits are configured, and production also requires measured capacity and tested backups/restore.
3. **Must-haves: full asset and PM review:** Add duplicate warnings, update proposals, task/frequency/operating-state grouping, 15-step validation, requested split decisions, unresolved issue handling, optional technical validation, conflict review, revisions and draft deletion. Tables: `asset_change_proposals`, `technical_validations`; add/use `pending_issues`, `planner_decisions`, `pm_versions`, and `operation_receipts`. Routes: proposals, issue resolution, validations, revisions, deletion.
4. **Must-haves: conversation and voice:** Add es/en text/voice using shared use cases, speech response, explicit confirmation context and English document rendering. Routes: conversation turns. Resolve Q1–Q3/Q5 first; do not persist audio/transcripts until Q5 is answered.
5. **Acceptance and hardening:** Run the documented acceptance matrix alongside implementation, verify read-after-write, owner isolation, retries, concurrent edits, all failure paths, source traceability and the full no-manual/manual/planner-data paths. Select the backup plan/retention and complete a restore test before production uploads. Use only recorded test evidence to claim completion.

## Three highest-risk areas

1. **Evidence fidelity and safe PM wording:** a structurally valid 15-step document can still omit or misstate a maintenance instruction. Preserve source locators and limitations and require planner review; automated tests must not be reported as proof of technical correctness.
2. **Persistence, retries, and concurrent approval:** approval, formal numbering, pointer update, and operation receipt must remain atomic and recoverable; two tabs and ambiguous commit/read outcomes are called out by RF-9.
3. **External-provider and data-handling decisions:** manuals and voice may be sensitive; Q1–Q3/Q5 block a production choice for hosting, providers, limits, and retention. Ports can be designed now, but a real integration cannot be declared selected or verified.

## Next flow step

The first planner-data and manual-intake slices, plus hosted development QA, are recorded in [build-log.md](./build-log.md). The PM revision lifecycle is implemented and verified against local prototype storage and the migrated `plannermc-dev` project; production remains untouched. The `/replica-diff` assessment is recorded in [parity.md](./parity.md): it scores implementation coverage against PlannerMC's own MVP scope and does not claim parity with iMPS, GWOS-AI, or another original application. Invitation delivery remains unverified until SMTP is configured; production hosting, catalog provisioning, and deployment remain unconfigured. The MacroCap Labs logo is referenced from the URL recorded in [brand-reference.md](./brand-reference.md); hosting and reuse terms remain unverified.
