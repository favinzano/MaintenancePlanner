# Add local manual intake and reviewed document evidence

Type: task
Status: claimed
Triage: ready-for-agent
Blocked by: none

## Request

Implement the next approved `/replica-build` slice for attaching a manual to an analysis and reviewing its extracted evidence.

## Scope

- Support PDF, DOCX, JPG/JPEG, and PNG, one file per upload, with multiple manuals attachable to the same analysis.
- Extract PDF text with PDF.js, DOCX text with Mammoth, and OCR image or rendered PDF pages with Tesseract.js in the browser. Bundle worker, WASM, and English/Spanish language assets with the app; do not send manual bytes or extracted text to OCR, AI, search, or speech services.
- Store the requested original file in the existing Supabase PostgreSQL `BYTEA` boundary. Store a SHA-256 digest, file metadata, extracted page/section locators, limitations, applicability, and review state. Verify writes by a separate read-back of the record and bytes.
- Scope every upload, download, and source lookup to the authenticated owner/workspace. Support PM references only to reviewed sources on the same analysis.
- Make file-byte and PDF-page ceilings configurable and fail closed when unset. Do not set a production ceiling until representative manuals and live development database use have been measured. Keep production uploads disabled until capacity, backups, retention, and restore readiness have been established.
- Keep external research, content generation, and voice deferred. Preserve the existing planner-data source and workflow.
- Update the feature matrix, build log, architecture, Q2/Q3 decision records, and this map.

## Acceptance

- Each supported file type extracts in the browser without a request to a third-party processing or asset CDN.
- Malformed/unsupported files, missing configured limits, exceeded byte/page ceilings, invalid hashes, unauthorized access, and unreviewed PM source references are rejected without replacing earlier manuals.
- The stored original is returned only to its owner and its SHA-256 and bytes match the upload after an independent read-back.
- Review shows extracted text with page or section locators, extraction method, applicability, and limitations; reviewed document references survive reload and appear in PM preview/copy when selected.
- No production upload is enabled by this development slice.
- Build and requested tests pass; keyboard, mobile/desktop, and browser console review are recorded in `replica/build-log.md`.

## Comments

- 2026-10-31: User delegated Q2/Q3 to the assistant's judgment. Decision: browser-local PDF.js/Mammoth/Tesseract.js extraction for the initial four formats; no external content-processing providers; defer research, generation, and speech. Supabase remains the approved requested persistence boundary for original files. Formats are approved; numeric ceilings remain unset until representative manual and live quota measurements. Production uploads remain disabled until capacity and backup/restore requirements are resolved.

## Answer

Implemented the development manual-intake path: browser-local PDF/DOCX extraction and JPG/JPEG/PNG/image-page OCR with same-origin Tesseract assets; authenticated original persistence in `plannermc-dev` PostgreSQL; SHA-256/read-back verification; source locator ranges, applicability review, and PM references; fail-closed file/page/database limits; and production gates. Migration `20261031170000_planner_manual_documents.sql` is applied to the development project. Server tests passed (`test:server-manual` 11/11, `test:server-validation` 9/9), and the build passed. Synthetic extraction for all four formats and a 629-byte synthetic PDF save/reopen/review/PM-preview path passed in browser QA. Temporary QA limits/helpers were removed and the authenticated page now reports new uploads disabled.

The ticket remains claimed because the mobile/desktop Playwright case could not run in this environment: no local browser is installed and the official Chromium CDN failed DNS resolution. The actual OS file-picker selection and a second-account manual download denial also remain unverified. These checks and their limits are recorded in `replica/test-plan.md`, `replica/bugs.md`, and `replica/build-log.md`. No numeric operating limits or production upload readiness are claimed.
