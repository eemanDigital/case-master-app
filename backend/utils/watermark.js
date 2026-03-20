const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const puppeteer = require("puppeteer");

const WATERMARK_TEXT = "PROVISIONAL - BALANCE UNPAID";
const OUTPUT_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads", "protected");

const ensureDirExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
};

const getImageDimensions = async (inputPath) => {
  const metadata = await sharp(inputPath).metadata();
  return { width: metadata.width, height: metadata.height };
};

const createWatermarkSvg = (width, height, text) => {
  const lines = [];
  const spacing = 150;
  const angle = -30;

  for (let y = -height; y < height * 2; y += spacing) {
    for (let x = -width; x < width * 2; x += spacing * 3) {
      lines.push(`<text x="${x}" y="${y}" transform="rotate(${angle})" font-size="40" fill="rgba(255, 0, 0, 0.4)" font-family="Arial, sans-serif" font-weight="bold">${text}</text>`);
    }
  }

  return `<svg width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="white" fill-opacity="0"/>
    ${lines.join("\n")}
  </svg>`;
};

const isImageFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp", ".gif"].includes(ext);
};

const isPdfFile = (filePath) => {
  return path.extname(filePath).toLowerCase() === ".pdf";
};

exports.generateWatermarkedVersion = async (inputPath, outputPath, watermarkText = WATERMARK_TEXT) => {
  try {
    const inputDir = path.dirname(inputPath);
    await ensureDirExists(inputDir);
    await ensureDirExists(path.dirname(outputPath));

    if (isImageFile(inputPath)) {
      const { width, height } = await getImageDimensions(inputPath);
      const svgWatermark = Buffer.from(createWatermarkSvg(width, height, watermarkText));

      await sharp(inputPath)
        .composite([{
          input: svgWatermark,
          top: 0,
          left: 0,
        }])
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      console.log(`Watermarked image saved to: ${outputPath}`);
      return outputPath;
    }

    if (isPdfFile(inputPath)) {
      return await this.generatePdfWatermark(inputPath, outputPath, watermarkText);
    }

    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  } catch (error) {
    console.error("Error generating watermarked version:", error);
    throw error;
  }
};

exports.generateThumbnail = async (inputPath, outputPath) => {
  try {
    await ensureDirExists(path.dirname(outputPath));

    if (isImageFile(inputPath)) {
      await sharp(inputPath)
        .resize(300, null, {
          withoutEnlargement: true,
          fit: "inside",
        })
        .jpeg({ quality: 20 })
        .toFile(outputPath);

      console.log(`Thumbnail saved to: ${outputPath}`);
      return outputPath;
    }

    if (isPdfFile(inputPath)) {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      try {
        const page = await browser.newPage();
        await page.goto(`file://${inputPath}`, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });

        const screenshotBuffer = await page.screenshot({
          type: "jpeg",
          quality: 20,
          clip: { x: 0, y: 0, width: 300, height: 400 },
        });

        await sharp(screenshotBuffer)
          .resize(300, 400, { fit: "cover" })
          .jpeg({ quality: 20 })
          .toFile(outputPath);

        console.log(`PDF thumbnail saved to: ${outputPath}`);
        return outputPath;
      } finally {
        await browser.close();
      }
    }

    return inputPath;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    throw error;
  }
};

exports.generatePdfWatermark = async (inputPath, outputPath, watermarkText = WATERMARK_TEXT) => {
  let browser = null;

  try {
    await ensureDirExists(path.dirname(outputPath));

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    });

    const page = await browser.newPage();

    const pdfBuffer = await fs.readFile(inputPath);
    const base64Pdf = pdfBuffer.toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

    await page.goto(dataUrl, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const watermarkHtml = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.4;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          color: red;
          font-weight: bold;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        ">
          ${watermarkText}
        </div>
        <div style="
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 40px;
          color: red;
          font-weight: bold;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          opacity: 0.5;
        ">
          ${watermarkText}
        </div>
        <div style="
          position: absolute;
          top: 70%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 40px;
          color: red;
          font-weight: bold;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          opacity: 0.5;
        ">
          ${watermarkText}
        </div>
      </div>
    `;

    const watermarkStyle = `
      <style>
        body { margin: 0; padding: 0; }
        .watermark-container {
          position: relative;
          width: 100%;
          height: 100vh;
        }
      </style>
    `;

    const content = await page.content();
    const modifiedContent = content.replace("</head>", `${watermarkStyle}</head>`).replace("<body", `<div class="watermark-container">${watermarkHtml}<body`);

    await page.setContent(modifiedContent, { waitUntil: "networkidle0" });

    await page.screenshot({
      path: outputPath.replace(".pdf", ".png"),
      format: "png",
      fullPage: true,
    });

    console.log(`PDF watermark applied, saved as image: ${outputPath.replace(".pdf", ".png")}`);
    return outputPath.replace(".pdf", ".png");
  } catch (error) {
    console.error("Error generating PDF watermark:", error);
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

exports.generatePreview = async (inputPath, options = {}) => {
  const {
    width = 800,
    quality = 80,
    watermark = true,
  } = options;

  try {
    if (isImageFile(inputPath)) {
      let pipeline = sharp(inputPath).resize(width, null, {
        withoutEnlargement: true,
        fit: "inside",
      });

      if (watermark) {
        const metadata = await sharp(inputPath).metadata();
        const svgWatermark = Buffer.from(createWatermarkSvg(metadata.width, metadata.height, WATERMARK_TEXT));

        pipeline = pipeline.composite([{
          input: svgWatermark,
          top: 0,
          left: 0,
        }]);
      }

      return await pipeline.jpeg({ quality }).toBuffer();
    }

    if (isPdfFile(inputPath)) {
      let browser = null;
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        });

        const page = await browser.newPage();
        const pdfBuffer = await fs.readFile(inputPath);
        const base64Pdf = pdfBuffer.toString("base64");

        await page.setContent(`<html><body><img src="data:application/pdf;base64,${base64Pdf}" style="width:100%;"/></body></html>`);
        await page.setViewport({ width, height: width * 1.414 });

        return await page.screenshot({
          type: "jpeg",
          quality,
          fullPage: false,
        });
      } finally {
        if (browser) await browser.close();
      }
    }

    return null;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
};

exports.cleanupFiles = async (filePaths) => {
  for (const filePath of filePaths) {
    try {
      if (filePath && await fs.access(filePath).then(() => true).catch(() => false)) {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }
};

exports.OUTPUT_DIR = OUTPUT_DIR;
exports.WATERMARK_TEXT = WATERMARK_TEXT;
