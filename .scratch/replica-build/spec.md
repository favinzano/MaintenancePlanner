# PlannerMC replica build

**Status:** implementation slice
**Date:** 2026-10-31

## Objective

Build the first PlannerMC vertical slice defined in `replica/architecture.md`: planner-led equipment intake, explicit evidence/limitation review, direct-child asset selection, planner-authored PM draft, local save/resume, approval, and manual copy.

## Scope

- Preserve the existing visual gallery at `/design`; use the product workflow at `/`.
- Use the MacroCap Labs identity and PlannerMC product name from `replica/design/`.
- Use synthetic sample catalog entries and browser-local storage, clearly labeled as a local prototype.
- Keep business rules in a domain/data layer separate from the React UI.
- Keep the PM procedure planner-authored. Do not generate technical instructions or claim OCR, OEM research, authentication, cloud persistence, or CMMS integration.
- Keep an explicit limitation decision before proceeding from planner-provided details.
- Restrict asset hierarchy to one equipment asset and direct sub-assets; permit individual selection.
- Limit the PM to 15 total steps including the opening operating/safety statement and final verification.
- Persist and verify local writes; restore saved work after reload; support approval and clipboard output without external writes.
- Update `replica/features.csv` and `replica/build-log.md`; save a workflow screenshot.

## Out of scope

- Real sign-in/account provisioning, shared users, remote APIs, PostgreSQL, OCR/document upload, external research, generated PMs, speech, revisions, CMMS writeback, scheduling, inventory, and purchasing.
- Closing Q1–Q6 from the architecture proposal.

## Acceptance criteria

- A user can create and resume an analysis in the browser prototype.
- The workflow requires a planner-entered equipment name and notes, then an explicit decision to proceed with the visible limitations.
- The user can edit and individually confirm the equipment root and direct sub-assets.
- The user can write, save, reload, approve, and copy a PM in English, with a maximum of 15 steps and a visible draft/approved state.
- Saved local writes are read back and compared before the UI reports success.
- The application is usable at mobile and desktop widths and the existing `/design` route remains available.
- Feature progress and any incomplete acceptance are recorded in the build log.

## Constraints

- `docs/constitution.md` and `specs/001-plannermc-mvp/spec.md` govern product behavior.
- The local data adapter is a prototype seam only; it does not resolve production persistence or security decisions.
- The repo has no Git metadata; commits are unavailable in this workspace.
