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

No representative maintenance manuals are present in the repository. The single live development record is a 629-byte synthetic QA PDF and cannot establish normal or worst-case size, page count, scanned-image behavior, or extraction memory. The user needs to place authorized representative copies in a local, non-version-controlled folder and identify that folder before this measurement can be completed.

## Acceptance

- Include representative documents for the common case and the expected upper end of size/pages, including at least one scanned PDF or image if those are used operationally.
- Preserve evidence that profiling is local-only and does not save sample files to the cloud database.
- Record the sample count and ranges without exposing filenames or manual contents.
- Derive and document development limits with enough database quota headroom; keep production gates unchanged.
- Update `replica/parity.md`, `.scratch/replica-build/map.md`, and `.env.example` only if numeric limits are supported by the measurements.

## Comments

- 2026-11-01: Development DB measurement completed in a verified-TLS `READ ONLY` transaction: 12,375,731 database bytes, one 629-byte synthetic document, and a 65,536-byte `original_documents` relation. This resolves only the live database-use baseline. Current published Supabase Free quota is 500 MB database size per project; the provisioned disk quota is distinct. Representative maintenance samples and extraction-performance measurements remain outstanding.
