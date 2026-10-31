import { createHash } from "node:crypto";
import { basename } from "node:path";

export const MANUAL_CONTENT_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

export type ManualContentType = typeof MANUAL_CONTENT_TYPES[keyof typeof MANUAL_CONTENT_TYPES];
export type ManualExtractionMethod = "pdf-text" | "pdf-ocr" | "docx-text" | "image-ocr";
export type ManualLocatorKind = "page" | "paragraph" | "document";
export type ManualLocatorRange = { kind: ManualLocatorKind; first: 1; last: number };

export type ManualUploadConfig = {
  enabled: boolean;
  maxFileBytes: number | null;
  maxPdfPages: number | null;
  maxTotalManualBytes: number | null;
  message: string;
};

export type ManualUploadDescriptor = {
  operationId: string;
  fileName: string;
  contentType: ManualContentType;
  byteSize: number;
  sha256: string;
  pageCount: number | null;
  extractionMethod: ManualExtractionMethod;
  locatorRange: ManualLocatorRange;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha256Pattern = /^[a-f0-9]{64}$/i;
const typeByExtension = new Map<string, ManualContentType>([
  [".pdf", MANUAL_CONTENT_TYPES.pdf],
  [".docx", MANUAL_CONTENT_TYPES.docx],
  [".jpg", MANUAL_CONTENT_TYPES.jpeg],
  [".jpeg", MANUAL_CONTENT_TYPES.jpeg],
  [".png", MANUAL_CONTENT_TYPES.png],
]);

function positiveInteger(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function validDate(value: string | undefined): boolean {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

export function readManualUploadConfig(env: NodeJS.ProcessEnv, nodeEnv = env.NODE_ENV): ManualUploadConfig {
  const maxFileBytes = positiveInteger(env.MANUAL_MAX_FILE_BYTES);
  const maxPdfPages = positiveInteger(env.MANUAL_MAX_PDF_PAGES);
  const maxTotalManualBytes = positiveInteger(env.MANUAL_MAX_TOTAL_MANUAL_BYTES);
  const missing: string[] = [];
  if (maxFileBytes === null) missing.push("MANUAL_MAX_FILE_BYTES");
  if (maxPdfPages === null) missing.push("MANUAL_MAX_PDF_PAGES");
  if (maxTotalManualBytes === null) missing.push("MANUAL_MAX_TOTAL_MANUAL_BYTES");

  if (nodeEnv === "production") {
    if (env.MANUAL_PRODUCTION_UPLOADS_ENABLED !== "true") missing.push("MANUAL_PRODUCTION_UPLOADS_ENABLED");
    if (!env.MANUAL_PRODUCTION_DATABASE_PLAN?.trim()) missing.push("MANUAL_PRODUCTION_DATABASE_PLAN");
    if (positiveInteger(env.MANUAL_PRODUCTION_BACKUP_RETENTION_DAYS) === null) missing.push("MANUAL_PRODUCTION_BACKUP_RETENTION_DAYS");
    if (!validDate(env.MANUAL_PRODUCTION_CAPACITY_REVIEWED_AT)) missing.push("MANUAL_PRODUCTION_CAPACITY_REVIEWED_AT");
    if (!validDate(env.MANUAL_PRODUCTION_BACKUP_RESTORE_TESTED_AT)) missing.push("MANUAL_PRODUCTION_BACKUP_RESTORE_TESTED_AT");
  }

  const explicitlyEnabled = env.MANUAL_UPLOAD_ENABLED === "true";
  const enabled = explicitlyEnabled && missing.length === 0;
  const message = !explicitlyEnabled
    ? "Manual uploads are disabled for this environment."
    : missing.length
      ? `Manual uploads require reviewed configuration: ${missing.join(", ")}.`
      : "Manual uploads are available with the configured limits.";

  return {
    enabled,
    maxFileBytes,
    maxPdfPages,
    maxTotalManualBytes,
    message,
  };
}

function headerValue(headers: Record<string, string | string[] | undefined>, name: string): string {
  const value = headers[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function fail(message: string, statusCode: number): never {
  throw Object.assign(new Error(message), { statusCode });
}

function decodeFileName(value: string): string {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) return fail("The manual file name is invalid.", 400);
  let decoded: string;
  try {
    decoded = Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return fail("The manual file name is invalid.", 400);
  }
  const fileName = basename(decoded.replace(/[\\/]/g, "\\"));
  if (fileName !== decoded || fileName.length < 1 || fileName.length > 255 || /[\u0000-\u001f\u007f]/.test(fileName)) {
    return fail("Use a file name without path characters or control characters.", 400);
  }
  return fileName;
}

function hasExpectedSignature(bytes: Buffer, contentType: ManualContentType): boolean {
  if (contentType === MANUAL_CONTENT_TYPES.pdf) return bytes.subarray(0, 1024).includes(Buffer.from("%PDF-", "ascii"));
  if (contentType === MANUAL_CONTENT_TYPES.jpeg) return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === MANUAL_CONTENT_TYPES.png) return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === MANUAL_CONTENT_TYPES.docx) return bytes.length >= 4 && bytes.subarray(0, 4).toString("binary") === "PK\u0003\u0004";
  return false;
}

export function parseManualUploadDescriptor(
  headers: Record<string, string | string[] | undefined>,
  bytes: Buffer,
  config: ManualUploadConfig,
): ManualUploadDescriptor {
  if (!config.enabled || config.maxFileBytes === null || config.maxPdfPages === null || config.maxTotalManualBytes === null) {
    return fail(config.message, 503);
  }
  if (bytes.length === 0) return fail("Choose a non-empty manual file.", 400);
  if (bytes.length > config.maxFileBytes) return fail(`This manual exceeds the configured ${config.maxFileBytes}-byte file limit.`, 413);

  const fileName = decodeFileName(headerValue(headers, "x-manual-file-name"));
  const contentType = headerValue(headers, "x-manual-content-type") as ManualContentType;
  const expectedType = typeByExtension.get(fileName.slice(fileName.lastIndexOf(".")).toLowerCase());
  if (!expectedType || contentType !== expectedType || !hasExpectedSignature(bytes, contentType)) {
    return fail("The file name, content type, or file signature is not a supported manual format.", 415);
  }

  const sha256 = headerValue(headers, "x-manual-sha256").toLowerCase();
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (!sha256Pattern.test(sha256) || sha256 !== actualSha256) return fail("The manual integrity check failed.", 400);

  const operationId = headerValue(headers, "x-operation-id");
  if (!uuidPattern.test(operationId)) return fail("The manual upload operation ID is invalid.", 400);

  const method = headerValue(headers, "x-manual-extraction-method") as ManualExtractionMethod;
  const expectedMethods: Record<ManualContentType, ManualExtractionMethod[]> = {
    [MANUAL_CONTENT_TYPES.pdf]: ["pdf-text", "pdf-ocr"],
    [MANUAL_CONTENT_TYPES.docx]: ["docx-text"],
    [MANUAL_CONTENT_TYPES.jpeg]: ["image-ocr"],
    [MANUAL_CONTENT_TYPES.png]: ["image-ocr"],
  };
  if (!expectedMethods[contentType]?.includes(method)) return fail("The extraction method does not match the manual format.", 400);

  const pageHeader = headerValue(headers, "x-manual-page-count");
  let pageCount: number | null = null;
  if (contentType === MANUAL_CONTENT_TYPES.pdf) {
    if (!/^\d+$/.test(pageHeader)) return fail("The PDF page count is invalid.", 400);
    pageCount = Number(pageHeader);
    if (!Number.isSafeInteger(pageCount) || pageCount < 1) return fail("The PDF page count is invalid.", 400);
    if (pageCount > config.maxPdfPages) return fail(`This PDF exceeds the configured ${config.maxPdfPages}-page limit.`, 413);
  } else if (contentType === MANUAL_CONTENT_TYPES.docx) {
    if (pageHeader !== "") return fail("DOCX files do not have a stable page count before rendering.", 400);
  } else {
    if (pageHeader !== "1") return fail("An image manual must contain one page.", 400);
    pageCount = 1;
    if (pageCount > config.maxPdfPages) return fail("This image exceeds the configured page limit.", 413);
  }

  const locatorKind = headerValue(headers, "x-manual-locator-kind") as ManualLocatorKind;
  const locatorCountHeader = headerValue(headers, "x-manual-locator-count");
  if (!/^(page|paragraph|document)$/.test(locatorKind) || !/^\d+$/.test(locatorCountHeader)) {
    return fail("The manual page or section locator metadata is invalid.", 400);
  }
  const locatorCount = Number(locatorCountHeader);
  if (!Number.isSafeInteger(locatorCount) || locatorCount < 1 || locatorCount > 100_000) {
    return fail("The manual page or section locator count is invalid.", 400);
  }
  if (contentType === MANUAL_CONTENT_TYPES.pdf && (locatorKind !== "page" || locatorCount !== pageCount)) {
    return fail("The PDF page locator range does not match its page count.", 400);
  }
  if (contentType === MANUAL_CONTENT_TYPES.jpeg || contentType === MANUAL_CONTENT_TYPES.png) {
    if (locatorKind !== "page" || locatorCount !== 1) return fail("The image page locator is invalid.", 400);
  }
  if (contentType === MANUAL_CONTENT_TYPES.docx &&
      ((locatorKind === "document" && locatorCount !== 1) || (locatorKind !== "document" && locatorKind !== "paragraph"))) {
    return fail("The DOCX section locator range is invalid.", 400);
  }

  return {
    operationId,
    fileName,
    contentType,
    byteSize: bytes.length,
    sha256,
    pageCount,
    extractionMethod: method,
    locatorRange: { kind: locatorKind, first: 1, last: locatorCount },
  };
}

export function verifyPdfPageCount(clientPageCount: number | null, serverPageCount: number, config: ManualUploadConfig): void {
  if (!config.enabled || config.maxPdfPages === null) return fail(config.message, 503);
  if (!Number.isSafeInteger(serverPageCount) || serverPageCount < 1 || clientPageCount !== serverPageCount) {
    return fail("The PDF page count does not match the verified document.", 400);
  }
  if (serverPageCount > config.maxPdfPages) return fail(`This PDF exceeds the configured ${config.maxPdfPages}-page limit.`, 413);
}
