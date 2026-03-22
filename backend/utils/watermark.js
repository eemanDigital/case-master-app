/**
 * watermark.js
 *
 * PDF  → pdf-lib: stamps diagonal repeated text as semi-transparent overlay image.
 *         Output is a valid .pdf — renders correctly in browser iframes.
 * Image → sharp: composites an SVG watermark overlay.
 * Word  → mammoth: converts to PDF, watermarks, saves as PDF.
 * Other → copied as-is.
 *
 * npm install pdf-lib sharp mammoth
 */

const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");
const { PDFDocument, rgb, degrees } = require("pdf-lib");

const WATERMARK_TEXT =
  process.env.WATERMARK_TEXT || "PROVISIONAL - BALANCE UNPAID";
const OUTPUT_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads", "protected");

exports.ensureDirExists = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const isImage = (p) =>
  [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp", ".gif"].includes(
    path.extname(p).toLowerCase(),
  );

const isPdf = (p) => path.extname(p).toLowerCase() === ".pdf";

const isWord = (p) =>
  [".doc", ".docx"].includes(path.extname(p).toLowerCase());

// ─── Image watermark (sharp + SVG overlay) ──────────────────────────────────

const createWatermarkSvg = (width, height, text) => {
  const lines = [];
  const spacing = 160;
  const angle = -35;

  for (let y = -height; y < height * 2; y += spacing) {
    for (let x = -width; x < width * 2; x += spacing * 3) {
      lines.push(
        `<text x="${x}" y="${y}" transform="rotate(${angle})" ` +
          `font-size="36" fill="rgba(220,0,0,0.45)" ` +
          `font-family="Arial, sans-serif" font-weight="bold">${text}</text>`,
      );
    }
  }

  return Buffer.from(
    `<svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="transparent"/>
      ${lines.join("\n")}
    </svg>`,
  );
};

const watermarkImage = async (inputPath, outputPath, text) => {
  const meta = await sharp(inputPath).metadata();
  const overlay = createWatermarkSvg(meta.width, meta.height, text);

  await sharp(inputPath)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toFile(outputPath);

  return outputPath;
};

// ─── PDF watermark (pdf-lib) ─────────────────────────────────────────────────
// Creates a semi-transparent PNG overlay with diagonal text, then stamps it
// on every page. The overlay obscures content better than text-only watermarks.

const createWatermarkOverlay = async (pageWidth, pageHeight, text) => {
  const w = Math.ceil(pageWidth);
  const h = Math.ceil(pageHeight);

  const lines = [];
  const spacing = 120;
  const angle = -35;

  for (let y = -h; y < h * 2; y += spacing) {
    for (let x = -w; x < w * 2; x += spacing * 2.5) {
      lines.push(
        `<text x="${x}" y="${y}" transform="rotate(${angle}, ${x}, ${y})" ` +
          `font-size="28" fill="rgba(180, 30, 30, 0.25)" ` +
          `font-family="Arial, sans-serif" font-weight="bold" ` +
          `letter-spacing="4">${text}</text>`,
      );
    }
  }

  const svg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgba(255,255,255,0.15)"/>
      ${lines.join("\n")}
    </svg>`,
  );

  return sharp(svg).png().toBuffer();
};

const watermarkPdf = async (inputPath, outputPath, text) => {
  const existingBytes = await fs.readFile(inputPath);

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(existingBytes, { ignoreEncryption: true });
  } catch (err) {
    console.warn("pdf-lib could not load PDF, copying original:", err.message);
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }

  const pages = pdfDoc.getPages();
  const embeddedImage = await pdfDoc.embedPng(
    await createWatermarkOverlay(612, 792, text),
  );

  for (const page of pages) {
    const { width, height } = page.getSize();

    const wmBuffer = await createWatermarkOverlay(width, height, text);
    const wmImg = await pdfDoc.embedPng(wmBuffer);
    const wmDims = wmImg.scale(1);

    page.drawImage(wmImg, {
      x: 0,
      y: 0,
      width: wmDims.width,
      height: wmDims.height,
      opacity: 1,
    });
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
  return outputPath;
};

// ─── Word document watermark (.docx) ─────────────────────────────────────────
// Converts Word to PDF using mammoth, watermarks the PDF, saves as PDF.

const watermarkWord = async (inputPath, outputPath, text) => {
  let mammoth;
  try {
    mammoth = require("mammoth");
  } catch {
    console.warn("mammoth not installed, copying Word doc as-is");
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }

  try {
    const result = await mammoth.toPdf({ path: inputPath });
    const pdfBuffer = Buffer.from(result.value);

    const tempPdfPath = outputPath.replace(/\.docx?$/i, "_temp.pdf");
    await fs.writeFile(tempPdfPath, pdfBuffer);

    await watermarkPdf(tempPdfPath, outputPath, text);

    await fs.unlink(tempPdfPath).catch(() => {});

    return outputPath;
  } catch (err) {
    console.warn("Word watermark failed:", err.message);
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }
};

// ─── Public API ─────────────────────────────────────────────────────────────

exports.generateWatermarkedVersion = async (
  inputPath,
  outputPath,
  watermarkText = WATERMARK_TEXT,
) => {
  await exports.ensureDirExists(path.dirname(outputPath));

  if (isImage(inputPath))
    return watermarkImage(inputPath, outputPath, watermarkText);
  if (isPdf(inputPath))
    return watermarkPdf(inputPath, outputPath, watermarkText);
  if (isWord(inputPath))
    return watermarkWord(inputPath, outputPath, watermarkText);

  // Other formats — copy as-is
  await fs.copyFile(inputPath, outputPath);
  return outputPath;
};

exports.generateThumbnail = async (inputPath, outputPath) => {
  await exports.ensureDirExists(path.dirname(outputPath));

  if (isImage(inputPath)) {
    await sharp(inputPath)
      .resize(300, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toFile(outputPath);
    return outputPath;
  }

  // PDF thumbnails require ghostscript or puppeteer — skipped here
  return null;
};

exports.cleanupFiles = async (filePaths = []) => {
  for (const p of filePaths) {
    if (!p) continue;
    try {
      await fs.unlink(p);
    } catch (err) {
      if (err.code !== "ENOENT")
        console.warn(`cleanupFiles: ${p}:`, err.message);
    }
  }
};

exports.OUTPUT_DIR = OUTPUT_DIR;
exports.WATERMARK_TEXT = WATERMARK_TEXT;
