# Measure representative manual capacity and set development limits

Type: research
Status: needs-info
Triage: needs-info
Blocked by: none

## Request

Use representative, authorized maintenance documents to establish configurable development limits for the existing local-extraction and PostgreSQL persistence flow.

## Scope

- Profile representative PDF, DOCX, JPG/JPEG, and PNG files on this workstation only, using the existing PlannerMC-local extraction path.
- Record only format, byte size, PDF page count, image dimensions, extraction method, elapsed time, and browser-memory observations. Do not persist or report file contents, extracted text, hashes, or sensitive filenames.
- Compare observations against the read-only `plannermc-dev` database baseline in `replica/parity.md` and current provider quotas.
- Recommend separate configurable per-file, PDF-page, and total-manual-storage limits for development with explicit headroom. Do not enable production uploads or write sample documents to Supabase.
- Keep all sample files outside the repository and do not send them or extracted text to external processing services.

## Required input

The user provided a local ZIP with 20 PDFs. The PDF sample was profiled successfully. No DOCX, JPG/JPEG, or PNG samples were present, so confirm whether those formats are needed in the development pilot. If they are, add authorized representative copies locally before applying one shared per-file limit across all formats. The single live development record is a 629-byte synthetic QA PDF and remains unsuitable for deriving limits.

## Acceptance

- Include representative documents for the common case and the expected upper end of size/pages, including at least one scanned PDF or image if those are used operationally.
- Preserve evidence that profiling is local-only and does not save sample files to the cloud database or allow outside-origin HTTP requests.
- Record the sample count and ranges without exposing filenames or manual contents.
- Confirm which formats are in the development pilot, then derive and document development limits with enough database quota headroom; keep production gates unchanged.
- Update `replica/parity.md`, `.scratch/replica-build/map.md`, and `.env.example` only if numeric limits are supported by the measurements.

## Comments

- 2026-11-01: Development DB measurement completed in a verified-TLS `READ ONLY` transaction: 12,375,731 database bytes, one 629-byte synthetic document, and a 65,536-byte `original_documents` relation. This resolves only the live database-use baseline. Current published Supabase Free quota is 500 MB database size per project; the provisioned disk quota is distinct. Representative maintenance samples and extraction-performance measurements remain outstanding.
- 2026-11-01: The provided archive contained 20 PDFs only, 344,937–2,951,262 bytes and 3–25 pages (173 pages total). PDF.js found all pages scanned with no selectable text; no parse failures. PlannerMC browser OCR processed a 6-page/885,297-byte PDF in 19.6 s, an 11-page/2,951,262-byte PDF in 39.1 s, and a 25-page/1,103,087-byte PDF in 33.4 s. Chromium JS heap peaked at 193,775,703 bytes; this excludes or incompletely represents WebAssembly/native memory. The isolated context blocked one request outside the allowed local origin; zero external-origin requests were allowed, zero page errors occurred, and no Supabase call was made. Temporary sanitized copies were deleted and the source archive was unchanged. DOCX and image formats remain unmeasured.
- [Inference] Candidate for a PDF-only development pilot: 4 MiB per file, 25 PDF pages, and 100 MiB total original bytes. The file cap gives about 42% headroom over the largest observed PDF, the page cap covers the observed maximum, and the total cap reserves most of the published Free-plan database-size quota. Do not activate these shared limits until the user confirms PDF-only or supplies DOCX/image samples, because the same byte cap applies across formats.
