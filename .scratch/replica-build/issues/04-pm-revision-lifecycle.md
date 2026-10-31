# Implement the PM revision lifecycle

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Implement the next approved `/replica-build` slice from RF-9 AC-5 and AC-6: create a draft from the current approved PM, preserve prior approved versions, and approve later revisions with consecutive numbering, dates, and a change summary.

## Scope

- Start a revision only from an approved PM and retain the current approved version until the new version is approved.
- Keep one editable revision draft per PM. Draft edits do not create approved revision numbers.
- Require a planner-entered summary of changes before approving a later revision.
- Assign revision number 0 to the initial approval and consecutive revision numbers beginning at 1 to later approvals.
- Show a read-only revision history with approval dates and change summaries.
- Support the existing local prototype and authenticated Fastify/PostgreSQL store.
- Preserve existing evidence references, PM fields, owner/workspace boundaries, row-version concurrency, idempotent save behavior, and post-write read-back.
- Add an additive migration for approved revision constraints and metadata; do not change production services.

## Out of scope

- PM deletion, compare/diff between revision contents, technical generation, external research, speech, CMMS writes, and production database changes.

## Acceptance

- An approved PM can be copied to a new editable draft revision; the old approved snapshot remains visible in history and remains current until the new revision is approved.
- The revision draft restores after reload, including its change summary and edits.
- Approval rejects an empty change summary for a later revision and does not alter the existing approved version.
- The first approval is labeled as the initial version; later approvals receive consecutive numbers and UTC approval dates.
- A newly approved revision and the prior history are returned by the server and verified by read-back.
- Concurrent or stale writes return the existing conflict response; retries do not create duplicate approved revisions.
- No external CMMS write or production database mutation occurs.

## Comments

- 2026-10-31: Started from the `/replica-diff` recommendation and the user authorized implementation. At issue creation, the planned scope did not include changing a remote database; the user later authorized development activation by asking the assistant to use its judgment.
- 2026-10-31: Applied migration `pm_revision_lifecycle_20261031190000` to `plannermc-dev` only, restarted the local Fastify API, and verified the migrated constraints/indexes through read-back. Hosted browser QA passed the initial approval, revision draft reload, summary-required negative case, revision 1 approval/history, stale-tab conflict (HTTP 409), and identical retry idempotency. A focused Playwright test passed in isolated local-prototype mode with axe scans. No production project/database or CMMS was changed.

## Answer

Implemented and verified the PM revision lifecycle for the local prototype and the authenticated development path. The initial approval is revision 0; later approvals receive consecutive numbers and UTC timestamps. A revision draft retains the existing approved snapshot until approval, restores its summary and edits after reload, and preserves each approved snapshot in read-only history. Approval rejects an empty change summary. The hosted API returned revision history by read-back, rejected a stale second-tab start with HTTP 409, and returned the same result for an identical retry without creating another version.

The additive migration is applied only to the synthetic `plannermc-dev` project. Hosted QA left one clearly labeled synthetic Auth user, one synthetic analysis, a PM with approved revisions 0 and 1, and an active draft for revision 2. No invitation was sent, no manual was uploaded, no CMMS write was made, and production was not touched. The focused automated test passed against local prototype storage, separately from hosted manual QA. See `replica/test-plan.md` and `replica/build-log.md` for the evidence and limits.
