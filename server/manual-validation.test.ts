import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { MANUAL_CONTENT_TYPES, parseManualUploadDescriptor, readManualUploadConfig, verifyPdfPageCount, type ManualUploadConfig } from "./manual-validation.js";

const configuredEnv = {
  MANUAL_UPLOAD_ENABLED: "true",
  MANUAL_MAX_FILE_BYTES: "1024",
  MANUAL_MAX_PDF_PAGES: "10",
  MANUAL_MAX_TOTAL_MANUAL_BYTES: "4096",
  NODE_ENV: "development",
};

function headersFor(bytes: Buffer, options: {
  fileName?: string;
  contentType?: string;
  extractionMethod?: string;
  pageCount?: string;
  locatorKind?: string;
  locatorCount?: string;
  operationId?: string;
  sha256?: string;
} = {}): Record<string, string> {
  return {
    "x-manual-file-name": Buffer.from(options.fileName ?? "manual.pdf").toString("base64url"),
    "x-manual-content-type": options.contentType ?? MANUAL_CONTENT_TYPES.pdf,
    "x-manual-extraction-method": options.extractionMethod ?? "pdf-text",
    "x-manual-page-count": options.pageCount ?? "1",
    "x-manual-locator-kind": options.locatorKind ?? "page",
    "x-manual-locator-count": options.locatorCount ?? (options.pageCount && options.pageCount !== "" ? options.pageCount : "1"),
    "x-operation-id": options.operationId ?? "11111111-1111-4111-8111-111111111111",
    "x-manual-sha256": options.sha256 ?? createHash("sha256").update(bytes).digest("hex"),
  };
}

function pdfConfig(overrides: Partial<ManualUploadConfig> = {}): ManualUploadConfig {
  return { enabled: true, maxFileBytes: 1024, maxPdfPages: 10, maxTotalManualBytes: 4096, message: "Ready.", ...overrides };
}

test("manual uploads fail closed when numeric limits are missing", () => {
  const config = readManualUploadConfig({ MANUAL_UPLOAD_ENABLED: "true" }, "development");
  assert.equal(config.enabled, false);
  assert.match(config.message, /MANUAL_MAX_FILE_BYTES/);
  assert.match(config.message, /MANUAL_MAX_PDF_PAGES/);
  assert.match(config.message, /MANUAL_MAX_TOTAL_MANUAL_BYTES/);
});

test("development uploads require an explicit opt-in and complete limits", () => {
  assert.equal(readManualUploadConfig(configuredEnv, "development").enabled, true);
  assert.equal(readManualUploadConfig({ ...configuredEnv, MANUAL_UPLOAD_ENABLED: "false" }, "development").enabled, false);
});

test("production uploads fail closed until plan, capacity review, and restore test are configured", () => {
  const config = readManualUploadConfig(configuredEnv, "production");
  assert.equal(config.enabled, false);
  assert.match(config.message, /MANUAL_PRODUCTION_BACKUP_RESTORE_TESTED_AT/);
  assert.equal(readManualUploadConfig({
    ...configuredEnv,
    MANUAL_PRODUCTION_UPLOADS_ENABLED: "true",
    MANUAL_PRODUCTION_DATABASE_PLAN: "pro",
    MANUAL_PRODUCTION_BACKUP_RETENTION_DAYS: "14",
    MANUAL_PRODUCTION_CAPACITY_REVIEWED_AT: "2026-10-31T00:00:00Z",
    MANUAL_PRODUCTION_BACKUP_RESTORE_TESTED_AT: "2026-10-31T00:00:00Z",
  }, "production").enabled, true);
});

test("a supported PDF is accepted after signature, hash, and configured limits are checked", () => {
  const bytes = Buffer.from("%PDF-1.7 synthetic", "ascii");
  const result = parseManualUploadDescriptor(headersFor(bytes), bytes, pdfConfig());
  assert.equal(result.fileName, "manual.pdf");
  assert.equal(result.contentType, MANUAL_CONTENT_TYPES.pdf);
  assert.equal(result.pageCount, 1);
  assert.deepEqual(result.locatorRange, { kind: "page", first: 1, last: 1 });
});

test("manual locator ranges match each supported format without persisting extracted text", () => {
  const docx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
  const descriptor = parseManualUploadDescriptor(headersFor(docx, {
    fileName: "manual.docx",
    contentType: MANUAL_CONTENT_TYPES.docx,
    extractionMethod: "docx-text",
    pageCount: "",
    locatorKind: "paragraph",
    locatorCount: "3",
  }), docx, pdfConfig());
  assert.deepEqual(descriptor.locatorRange, { kind: "paragraph", first: 1, last: 3 });
});

test("a mismatched extension, MIME type, or magic signature is rejected", () => {
  const bytes = Buffer.from("not a pdf");
  assert.throws(() => parseManualUploadDescriptor(headersFor(bytes), bytes, pdfConfig()), /signature/);
  const image = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  assert.throws(() => parseManualUploadDescriptor(headersFor(image, {
    fileName: "image.jpg", contentType: MANUAL_CONTENT_TYPES.png, extractionMethod: "image-ocr", pageCount: "1",
  }), image, pdfConfig()), /signature/);
});

test("a byte ceiling rejects the upload before database work", () => {
  const bytes = Buffer.from("%PDF-1.7 synthetic", "ascii");
  assert.throws(() => parseManualUploadDescriptor(headersFor(bytes), bytes, pdfConfig({ maxFileBytes: 4 })), /file limit/);
});

test("PDF page counts are checked against both client metadata and server parsing", () => {
  const bytes = Buffer.from("%PDF-1.7 synthetic", "ascii");
  const descriptor = parseManualUploadDescriptor(headersFor(bytes, { pageCount: "2" }), bytes, pdfConfig());
  assert.throws(() => verifyPdfPageCount(descriptor.pageCount, 1, pdfConfig()), /does not match/);
  assert.throws(() => verifyPdfPageCount(11, 11, pdfConfig()), /page limit/);
});

test("unsafe names, bad hashes, and invalid extraction methods are rejected", () => {
  const bytes = Buffer.from("%PDF-1.7 synthetic", "ascii");
  assert.throws(() => parseManualUploadDescriptor(headersFor(bytes, { fileName: "..\\manual.pdf" }), bytes, pdfConfig()), /path characters/);
  assert.throws(() => parseManualUploadDescriptor(headersFor(bytes, { sha256: "a".repeat(64) }), bytes, pdfConfig()), /integrity/);
  assert.throws(() => parseManualUploadDescriptor(headersFor(bytes, { extractionMethod: "image-ocr" }), bytes, pdfConfig()), /extraction method/);
});

test("PDF page limits are enforced on server verified counts", () => {
  assert.throws(() => verifyPdfPageCount(11, 11, pdfConfig()), /page limit/);
});

test("invalid or inconsistent locator metadata is rejected", () => {
  const bytes = Buffer.from("%PDF-1.7 synthetic", "ascii");
  assert.throws(() => parseManualUploadDescriptor(headersFor(bytes, { locatorCount: "2" }), bytes, pdfConfig()), /locator range/);
  assert.throws(() => parseManualUploadDescriptor(headersFor(bytes, { locatorKind: "paragraph" }), bytes, pdfConfig()), /locator range/);
});
