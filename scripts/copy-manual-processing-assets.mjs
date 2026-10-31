import { mkdir, readdir, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const destination = join(root, "public", "tesseract");
const coreSource = join(root, "node_modules", "tesseract.js-core");
const coreDestination = join(destination, "core");
const languageDestination = join(destination, "lang");

await Promise.all([
  mkdir(coreDestination, { recursive: true }),
  mkdir(languageDestination, { recursive: true }),
]);

await copyFile(
  join(root, "node_modules", "tesseract.js", "dist", "worker.min.js"),
  join(destination, "worker.min.js"),
);

for (const name of await readdir(coreSource)) {
  if (name.startsWith("tesseract-core") && /\.(?:js|wasm)$/.test(name)) {
    await copyFile(join(coreSource, name), join(coreDestination, name));
  }
}

for (const language of ["eng", "spa"]) {
  const source = join(root, "node_modules", "@tesseract.js-data", language, "4.0.0_best_int", `${language}.traineddata.gz`);
  await copyFile(source, join(languageDestination, `${language}.traineddata.gz`));
}

console.log("Copied local OCR worker, WASM cores, and English/Spanish language data.");
