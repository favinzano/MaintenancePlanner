# Implement planner-confirmed PM split proposals

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Implement the next `/replica-build` slice for RF-5 AC-10. When a complete PM has reached the 15-step limit and more required actions cannot fit, let the planner describe the overflow, choose a split point, review the resulting PMs, and explicitly confirm before saving multiple drafts.

## Scope

- Keep the current 15-step limit, counting opening and final verification.
- Collect additional planner-authored actions and allow an explicit boundary between the current PM's existing task steps.
- Preview the resulting PMs, their task steps and total counts before applying the split.
- Require a distinct confirmation action; cancelling leaves the original PM unchanged.
- Preserve asset, source references, operating state and safety details across resulting PM drafts; retain the planner-authored step wording without generating technical content.
- Persist every resulting PM in local prototype storage and the authenticated development API, including independent revision histories and read-after-write verification.
- Make multiple PMs selectable and editable after reload; do not allow any resulting PM to exceed 15 steps.
- Restrict writes to the development environment; do not apply migrations or mutate production.

## Out of scope

- Automatic technical task generation, deciding technical boundaries, CMMS writes, production changes, and more than two PMs in this slice.

## Acceptance

- The split action is available at the step cap and accepts planner-authored overflow actions.
- The planner can choose a split point and see a preview with each resulting PM at or below 15 steps.
- Confirmation creates separate editable PM drafts; the app displays the active PM and allows selecting each sibling.
- Cancelling a proposal preserves the source PM byte-for-byte and does not create a sibling draft.
- Invalid or over-limit proposals cannot be applied; no task wording is invented, paraphrased, or discarded.
- Each PM and its approved revision history persists and is returned by verified read-back in local and authenticated development modes.
- Reload restores the full PM set and selection can be changed without losing another PM's edits.
- Automated tests cover proposal confirmation/cancellation, boundary and cap validation, sibling persistence and reload; the existing PM revision lifecycle remains passing.
- No production or CMMS write is made.

## Comments

- 2026-10-31: User authorized this slice by replying “dale” to the recommendation to implement a planner-confirmed PM split proposal at the 15-step limit.

## Answer

Implemented the planner-confirmed PM split flow. At the 15-step cap, the planner supplies overflow actions, chooses a boundary, reviews both resulting PMs and their counts, then confirms or cancels. Each PM remains under the cap, keeps the source, asset, safety, and operating-state context, and persists with an independent draft/history. Both can be selected and edited after reload; approval is independent. One proposal creates two PMs; approved-revision splitting is not available.

Verification passed: build, server validation 12/12, manual validation 11/11, full E2E 8/8, focused split E2E 2/2, and authenticated synthetic development QA with read-back. The automated case covers invalid over-limit proposals, cancellation, confirmation, separate edits, reload, and independent approval. axe scans passed; responsive captures are saved under `replica/clone-screens/`. No production database or CMMS was touched.

Hosted `plannermc-dev` retains synthetic QA data for inspection. The automated suite uses isolated local-prototype storage. See `replica/test-plan.md`, `replica/build-log.md`, and `replica/parity.md` for detailed evidence and boundaries.
