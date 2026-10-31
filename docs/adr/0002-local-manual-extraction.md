# ADR 0002: Local manual extraction for the initial intake flow

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decision owners:** Product owner (decision delegated to assistant in conversation)

## Context

PlannerMC needs to read evidence from equipment manuals while keeping technical content under planner review. The initial policy must avoid sending manual bytes or extracted text to external OCR, AI, research, or speech services. Original-file persistence was already accepted in [ADR 0001](0001-supabase-auth-and-postgres.md), subject to capacity and recovery readiness before production uploads.

## Decision

- Initially accept PDF, DOCX, JPG/JPEG, and PNG.
- Extract selectable PDF text with PDF.js; extract DOCX text with Mammoth; OCR images and rendered PDF pages with Tesseract.js in the browser.
- Host the extraction workers, WebAssembly files, and language data with PlannerMC. Do not call third-party CDNs during manual processing.
- Send an original manual only through the authenticated PlannerMC API to the already-approved Supabase/PostgreSQL persistence boundary when the planner requests a save. Do not send manual bytes or extracted text to an external processing provider.
- Keep extracted content as a candidate for human review, preserve page/section locators and extraction limitations, and require explicit review before the source can be attached to a PM.
- Defer external research, technical generation, speech recognition, and speech synthesis.
- Keep byte and page limits configurable but unset until representative manuals and live database usage are measured. Fail closed when limits are not configured. Do not enable production uploads until capacity, plan, backup retention, and a restore test are established.

## Consequences

- OCR and text extraction happen in the user's browser; performance and browser memory limits need measurement with representative manuals.
- Tesseract.js does not read PDFs directly, so scanned PDF pages must be rendered to images by PDF.js before OCR.
- DOCX raw-text extraction does not preserve complex layout, and OCR may produce errors. The UI must preserve those limitations and require planner review.
- Local assets increase the app download size but avoid delivering a user's manual or its text to a processing CDN.
- Original files are still transmitted to and stored by the configured Supabase database when the user saves them. This is storage, not third-party text processing.
- Numerical limits and production enablement remain unresolved. No production upload readiness is claimed by this ADR.

## References

- [Tesseract.js local installation](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md)
- [Tesseract.js project scope and PDF limitation](https://github.com/naptha/tesseract.js)
- [Mammoth.js raw text and DOCX conversion](https://github.com/mwilliamson/mammoth.js/)
- [PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html)
