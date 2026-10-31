# Allow planners to delete a PM draft

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Implement manual deletion of a PM draft under RF-9 AC-10 and AC-11, preserving approved PM history and all analysis evidence.

## Scope

- Show an explicit, accessible confirmation action only for an editable draft.
- Delete a saved initial draft and its PM record when it has no approved history.
- When discarding a revision draft, remove only that draft and restore the latest approved snapshot as the current PM.
- Preserve every previously approved PM version, asset, analysis, source, and original manual.
- Enforce owner/workspace scope and an expected analysis row version at the authenticated server boundary.
- Make retries idempotent with an operation receipt that does not store deleted PM content; verify the deletion and preserved state by read-back.
- Keep local prototype behavior aligned with the authenticated store.
- Cover confirmation/cancellation, initial and revision drafts, stale writes, unauthorized/approved targets, reload, responsive keyboard-accessible UI, and failure states.

## Out of scope

- Automatic draft expiry or cleanup, deleting approved versions, deleting analyses/assets/manuals, external providers, CMMS writes, and changes to production data.

## Acceptance

- A planner can cancel or confirm deletion without changing data on cancel.
- A confirmed initial draft is removed from the PM list after verified save, while its analysis, assets, and sources remain available.
- Discarding a revision draft returns the PM to its latest approved version and preserves all approved history entries unchanged.
- Approved PMs cannot be deleted through this action; cross-owner or cross-workspace records are not disclosed or modified.
- Concurrent/stale requests fail with a conflict instead of deleting a newer state; an identical operation retry does not create duplicate side effects.
- Both stores read back the expected result before presenting success.

## Comments

- 2026-10-31: Selected as the next unblocked `/replica-build` slice after the refreshed parity report. The scope comes from RF-9 AC-10/11 and uses the accepted Supabase/PostgreSQL boundary.

## Answer

- Added an explicit Radix confirmation dialog only for saved PM drafts. Cancel and Escape leave the saved record unchanged and restore keyboard focus; after successful deletion focus moves to the next workflow heading.
- Deleting an initial draft removes its PM and returns the analysis to Assets. Deleting a revision draft removes that draft and restores the latest approved snapshot without modifying approved history. Analysis, assets, and planner/manual evidence identifiers are checked by authenticated post-commit read-back.
- The Fastify route scopes analysis, PM, versions, and receipts by authenticated owner and workspace, checks the expected analysis row version, and uses an idempotent operation receipt. New receipts stay `resultUnverified` until the deletion and preserved state pass read-back; an identical retry can complete that verification.
- Local prototype behavior matches the server behavior. The interface exposes the active PM when one remains and retains the selected analysis and assets after an initial deletion.
- Local QA: `npm run build` passed; `npm run test:domain` passed 7/7; `npm run test:server-validation` passed 24/24; full Playwright Chromium regression passed 12/12. The focused three deletion cases cover initial deletion, revision restoration, stale tabs, confirmation/cancel, keyboard focus, mobile layout, axe scans, and reload.
- Authenticated `plannermc-dev` QA used synthetic `QA ONLY` values: both initial and revision drafts were deleted and read back; assets and planner source remained; the revision-0 approval and snapshot remained after reload. Replaying the same deletion operation returned HTTP 200 without advancing row version 14. A stale row version and an approved PM with no draft both returned HTTP 409.
- Captures: `replica/clone-screens/S07-pm-draft-delete-desktop.png` and `replica/clone-screens/S07-pm-draft-delete-mobile.png`.
- Limits: no original manual was attached to this QA analysis because development uploads are disabled; the preservation check covers document IDs but that path was not exercised with an actual manual. No second-owner record was used for a live cross-owner denial test. Production, email, and CMMS were untouched.
