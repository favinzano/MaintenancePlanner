# Add field-level evidence citations to PMs

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Implement the next `/replica-build` slice: let planners attach source citations to individual PM fields using only reviewed, applicable planner-provided or manual sources already linked to the same analysis.

## Scope

- Add citations for PM frequency, estimated duration, operating state, safety precautions, each task step, and final verification.
- A citation identifies a source from the current analysis and may include a planner-entered precise page, section, or other locator. Never invent a locator or claim that a source supports text beyond the planner's selection.
- Permit only sources with a saved review and applicability marked applicable. Keep source title, default locator, applicability, and limitations available in the UI.
- Persist citations with PM drafts and approved snapshots in local prototype and authenticated development modes. Preserve citations across reload, revision, approval history, and PM split; remap task-step citations to the matching resulting PM step.
- Show field citations in the PM preview and copied PM text. Editing a PM field must not silently remove its citation. Removing a task step removes only that step's citation and reindexes later task-step citations.
- Validate citation shape, source membership, review state, applicability, source linkage, field key, and locator length at save boundary. Verify development read-back with citations included.
- Add automated happy, negative, edge, persistence, rendering, and accessible responsive coverage.

## Out of scope

- External research, AI-generated citations or technical content, unsupported-source inference, bulk citation matching, citations to unreviewed or non-applicable sources, production data/migrations, CMMS writes, or claims that citation presence verifies technical correctness.

## Acceptance

- A planner can attach, update, and remove one or more reviewed applicable citations for each supported PM field.
- The preview/copy associates every citation with the field it was selected for and displays the source's actual locator or the planner-entered locator.
- Invalid, stale, unreviewed, non-applicable, or cross-analysis source citations are rejected by server validation; citations are preserved in drafts and immutable version snapshots.
- Task-step citations remain aligned after step deletion, PM splitting, editing, reload, approval, and revision.
- Automated tests cover valid and invalid citations, rendered output, split/reindex behavior, save/reload, and responsive accessible UI.
- No production database, external provider, or CMMS is accessed.

## Comments

- 2026-10-31: User approved continuing with the field-level PM evidence citation slice after `/replica-diff` identified it as the next build candidate.

## Answer

Implemented citations for frequency, estimated duration, operating state, safety precautions, every task step, and final verification. The planner can add multiple sources per field, change a locator, or remove a citation. Only reviewed applicable sources on the current analysis are offered; citations also attach their source to the PM. Preview and copied PM text show the cited source and selected/default locator beside the corresponding field. Drafts, splits, revisions, and approved snapshots preserve field citations; task-step citations are removed or remapped with their steps.

The save boundary rejects malformed or unsupported fields, invalid or overlong locators, missing/cross-analysis sources, sources not attached to the PM, unreviewed/non-applicable sources, and duplicate references within a field. Manual citations are independently checked against owner/workspace/analysis-scoped database rows. Canonical JSONB comparison sorts field keys and citation object fields, avoiding false read-back mismatches caused by PostgreSQL object-key order. No migration was required.

Verification passed: `npm run build`; server validation 18/18; server manual validation 11/11; domain tests 3/3; full E2E 9/9. The E2E scans reported no axe violations or runtime errors and no horizontal overflow at 390 CSS px; desktop/mobile screenshots are in `replica/clone-screens/`. Authenticated `plannermc-dev` QA verified cited draft save/read-back, reload, approval, and citations retained in the approved snapshot. One synthetic `QA ONLY` development analysis remains for inspection. No production database, uploaded manual, external provider, or CMMS was used.

Field citations document a planner's source selection; they do not establish that the source technically supports the PM text. External research and citations remain deferred, so the feature matrix remains `partial`.
