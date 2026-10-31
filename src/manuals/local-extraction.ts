import { createWorker } from "tesseract.js";
import * as mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { ManualExtraction, ManualExtractionMethod, ManualIntakeConfig, ManualTextSegment } from "../domain/planner";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type ManualProgress = (message: string, progress?: number) => void;

const contentTypeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const baseLimitations = [
  "Extracted content is a candidate for planner review and is not independently verified.",
];

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function hashHex(bytes: ArrayBuffer): Promise<string> {
  return crypto.subtle.digest("SHA-256", bytes).then((digest) =>
    [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join(""),
  );
}

function normalizeText(value: string): string {
  return value.replace(/\u0000/g, "").replace(/[\t\u00a0]+/g, " ").replace(/ *\n */g, "\n").trim();
}

async function createOcrWorker(onProgress: ManualProgress) {
  const base = import.meta.env.BASE_URL;
  return createWorker(["eng", "spa"], 1, {
    workerPath: `${base}tesseract/worker.min.js`,
    langPath: `${base}tesseract/lang/`,
    corePath: `${base}tesseract/core/`,
    workerBlobURL: false,
    logger: (event) => {
      if (event.status === "recognizing text") onProgress("Reading image text locally", event.progress);
    },
  });
}

async function imageToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("This image could not be decoded.");
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This browser could not prepare the image for local OCR.");
    context.drawImage(image, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function extractPdf(file: File, maxPdfPages: number, onProgress: ManualProgress): Promise<{
  pageCount: number;
  segments: ManualTextSegment[];
  extractionMethod: ManualExtractionMethod;
  limitations: string[];
}> {
  onProgress("Opening PDF locally");
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data, useWorkerFetch: false });
  const documentProxy = await loadingTask.promise;
  const pageCount = documentProxy.numPages;
  let worker: Awaited<ReturnType<typeof createOcrWorker>> | null = null;
  const segments: ManualTextSegment[] = [];
  let usedOcr = false;
  try {
    if (pageCount > maxPdfPages) {
      throw new Error(`This PDF has ${pageCount} pages and exceeds the configured ${maxPdfPages}-page limit.`);
    }
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      onProgress(`Reading PDF page ${pageNumber} of ${pageCount}`, pageNumber / pageCount);
      const page = await documentProxy.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const extractedText = normalizeText(textContent.items.map((item) => "str" in item ? item.str : "").join(" "));
      if (extractedText) {
        segments.push({ locator: `Page ${pageNumber}`, text: extractedText, extractionMethod: "pdf-text" });
        continue;
      }

      worker ??= await createOcrWorker(onProgress);
      usedOcr = true;
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("This browser could not render the PDF page for local OCR.");
      await page.render({ canvas, canvasContext: context, viewport, intent: "display" }).promise;
      const result = await worker.recognize(canvas);
      segments.push({ locator: `Page ${pageNumber}`, text: normalizeText(result.data.text), extractionMethod: "pdf-ocr" });
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await worker?.terminate();
    await loadingTask.destroy();
  }

  const limitations = [...baseLimitations];
  if (usedOcr) limitations.push("OCR can introduce recognition errors. Compare each OCR page with the original manual.");
  if (segments.some((segment) => segment.extractionMethod === "pdf-text")) {
    limitations.push("PDF text extraction reads selectable text; text embedded only in figures may not appear unless the page required OCR.");
  }
  return {
    pageCount,
    segments,
    extractionMethod: usedOcr ? "pdf-ocr" : "pdf-text",
    limitations,
  };
}

async function extractDocx(file: File, onProgress: ManualProgress): Promise<{
  segments: ManualTextSegment[];
  limitations: string[];
}> {
  onProgress("Reading DOCX text locally");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  const paragraphs = normalizeText(result.value).split(/\n{2,}/).map((text) => text.trim()).filter(Boolean);
  const segments = paragraphs.length
    ? paragraphs.map((text, index) => ({ locator: `Paragraph ${index + 1}`, text, extractionMethod: "docx-text" as const }))
    : [{ locator: "Document text", text: "", extractionMethod: "docx-text" as const }];
  const limitations = [...baseLimitations, "DOCX extraction does not preserve complex layout or page breaks. Review tables and figures in the original file."];
  if (result.messages.length) limitations.push(`The DOCX parser reported ${result.messages.length} formatting or conversion note(s).`);
  return { segments, limitations };
}

async function extractImage(file: File, onProgress: ManualProgress): Promise<{
  segments: ManualTextSegment[];
  limitations: string[];
}> {
  onProgress("Preparing image for local OCR");
  const canvas = await imageToCanvas(file);
  const worker = await createOcrWorker(onProgress);
  try {
    const result = await worker.recognize(canvas);
    return {
      segments: [{ locator: "Page 1", text: normalizeText(result.data.text), extractionMethod: "image-ocr" }],
      limitations: [...baseLimitations, "OCR can introduce recognition errors. Compare the extracted text with the original image."],
    };
  } finally {
    await worker.terminate();
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function extractManualLocally(
  file: File,
  config: ManualIntakeConfig,
  onProgress: ManualProgress = () => undefined,
): Promise<ManualExtraction> {
  if (!config.enabled || config.maxFileBytes === null || config.maxPdfPages === null) {
    throw new Error(config.message || "Manual uploads are not configured for this environment.");
  }
  if (file.size <= 0) throw new Error("Choose a non-empty manual file.");
  if (file.size > config.maxFileBytes) throw new Error(`This file exceeds the configured ${config.maxFileBytes}-byte file limit.`);
  const extension = extensionOf(file.name);
  const contentType = contentTypeByExtension[extension];
  if (!contentType || (file.type && file.type !== contentType)) {
    throw new Error("Choose a PDF, DOCX, JPG/JPEG, or PNG file with a matching file type.");
  }
  const bytes = await file.arrayBuffer();
  const prefixBytes = new Uint8Array(bytes.slice(0, 1024));
  const firstBytes = prefixBytes.slice(0, 8);
  const signatureMatches = contentType === "application/pdf"
    ? new TextDecoder().decode(prefixBytes).includes("%PDF-")
    : contentType === "image/jpeg"
      ? firstBytes[0] === 0xff && firstBytes[1] === 0xd8 && firstBytes[2] === 0xff
      : contentType === "image/png"
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => firstBytes[index] === value)
        : firstBytes[0] === 0x50 && firstBytes[1] === 0x4b;
  if (!signatureMatches) throw new Error("The file contents do not match its selected manual format.");

  const sha256 = await hashHex(bytes);
  if (contentType === "application/pdf") {
    const result = await extractPdf(file, config.maxPdfPages, onProgress);
    return { fileName: file.name, contentType, byteSize: file.size, sha256, ...result };
  }
  if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await extractDocx(file, onProgress);
    return { fileName: file.name, contentType, byteSize: file.size, sha256, pageCount: null, extractionMethod: "docx-text", ...result };
  }
  const result = await extractImage(file, onProgress);
  return { fileName: file.name, contentType, byteSize: file.size, sha256, pageCount: 1, extractionMethod: "image-ocr", ...result };
}
