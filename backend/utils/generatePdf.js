// const puppeteer = require("puppeteer");
// const path = require("path");
// const pug = require("pug");
// const fs = require("fs");

// const ensureOutputDir = (filePath) => {
//   const dir = path.dirname(filePath);
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// };

// const cleanupOldPdfs = () => {
//   const outputDir = path.resolve(__dirname, "../output");
//   if (!fs.existsSync(outputDir)) return;

//   const oneHourAgo = Date.now() - 60 * 60 * 1000;
//   try {
//     const files = fs.readdirSync(outputDir);
//     files.forEach(file => {
//       if (file.endsWith(".pdf")) {
//         const filePath = path.join(outputDir, file);
//         const stats = fs.statSync(filePath);
//         if (stats.mtimeMs < oneHourAgo) {
//           fs.unlinkSync(filePath);
//         }
//       }
//     });
//   } catch (err) {
//     console.error("Error cleaning up old PDFs:", err);
//   }
// };

// cleanupOldPdfs();

// exports.generatePdf = async (dataValue, res, templateFile, fileOutPath) => {
//   const templatePath = path.isAbsolute(templateFile)
//     ? templateFile
//     : path.resolve(__dirname, templateFile);

//   const outputPath = path.isAbsolute(fileOutPath)
//     ? fileOutPath
//     : path.resolve(__dirname, fileOutPath);

//   console.log("Template path:", templatePath);
//   console.log("Output path:", outputPath);

//   ensureOutputDir(outputPath);

//   let html;
//   try {
//     html = pug.renderFile(templatePath, dataValue);
//   } catch (err) {
//     console.error("Pug render error:", err);
//     if (!res.headersSent) {
//       return res.status(500).json({ error: err.message });
//     }
//     return;
//   }

//   const firm = dataValue && dataValue.firm ? dataValue.firm : {};
//   const firmName = firm.name || 'Law Firm';

//   let browser;
//   try {
//     browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
//     });

//     const page = await browser.newPage();

//     await page.setContent(html, {
//       waitUntil: ["networkidle0", "domcontentloaded"]
//     });

//     await page.emulateMediaType("screen");

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: {
//         top: "15mm",
//         right: "10mm",
//         bottom: "15mm",
//         left: "10mm"
//       },
//       displayHeaderFooter: true,
//       headerTemplate: `
//         <div style="width: 100%; text-align: center; font-size: 10px; font-family: Arial, sans-serif; color: #1a365d; border-bottom: 2px solid #1a365d; padding: 8px 0;">
//           <strong>${firmName}</strong>
//         </div>
//       `,
//       footerTemplate: `
//         <div style="width: 100%; text-align: center; font-size: 9px; font-family: Arial, sans-serif; color: #666; border-top: 1px solid #ddd; padding: 6px 0;">
//           Page <span class="pageNumber"></span> of <span class="totalPages"></span> | ${firmName}
//         </div>
//       `
//     });

//     fs.writeFileSync(outputPath, pdfBuffer);

//     console.log("PDF created successfully at:", outputPath);

//     if (!res.headersSent) {
//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader("Content-Disposition", `attachment; filename="${path.basename(outputPath)}"`);
//       res.send(pdfBuffer);
//     }

//   } catch (error) {
//     console.error("PDF creation error:", error);
//     if (!res.headersSent) {
//       return res.status(500).json({ error: "PDF generation failed: " + error.message });
//     }
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };

/**
 * generatePdf.js  –  Drop-in replacement for the html-pdf / PhantomJS version.
 *
 * Uses Puppeteer (headless Chrome) which fully supports:
 *   • CSS custom properties (variables)
 *   • Google Fonts @import
 *   • linear-gradient, flexbox, grid, etc.
 *
 * Chrome resolution order:
 *   1. PUPPETEER_EXECUTABLE_PATH env var  (highest priority, set this in .env)
 *   2. Puppeteer's own downloaded Chromium cache
 *   3. Auto-detected system Chrome (Windows / macOS / Linux common paths)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const pug = require("pug");

// ── Locate an installed Chrome/Chromium on the host machine ──────────────────
function findSystemChrome() {
  const candidates = [
    // Windows – standard install paths
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA
      ? path.join(
          process.env.LOCALAPPDATA,
          "Google\\Chrome\\Application\\chrome.exe",
        )
      : null,
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log(`🔍 Found system Chrome: ${p}`);
      return p;
    }
  }
  return null;
}

/**
 * generatePdf(data, res, templatePath, outputPath)
 *
 * @param {object}         data         – Template locals (matter, firm, …)
 * @param {ServerResponse} res          – Express response object
 * @param {string}         templatePath – Absolute path to the .pug template
 * @param {string}         outputPath   – Absolute path where the PDF will be saved
 */
async function generatePdf(data, res, templatePath, outputPath) {
  // ── Guard: make sure we haven't already started sending a response ──────────
  if (res.headersSent) {
    console.error("generatePdf: headers already sent – aborting PDF render");
    return;
  }

  let browser;

  try {
    // ── 1. Render the Pug template to HTML ────────────────────────────────────
    const html = pug.renderFile(templatePath, {
      ...data,
      pretty: false,
      cache: process.env.NODE_ENV === "production",
    });

    // ── 2. Resolve Chrome executable ─────────────────────────────────────────
    const puppeteer = require("puppeteer");

    // Priority: env var → system Chrome → let Puppeteer use its own cache
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || findSystemChrome() || undefined; // undefined = Puppeteer uses its bundled Chromium

    if (executablePath) {
      console.log(`🚀 Launching Chrome from: ${executablePath}`);
    } else {
      console.log("🚀 Launching Puppeteer bundled Chromium");
    }

    // ── 3. Launch Puppeteer ───────────────────────────────────────────────────
    browser = await puppeteer.launch({
      headless: "new",
      executablePath, // undefined = use Puppeteer's own download
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
      ],
      timeout: 60_000,
    });

    const page = await browser.newPage();

    // Load the HTML; use domcontentloaded for faster rendering, then wait a bit for styles
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60_000 });
    
    // Give a short delay for CSS to apply
    await page.waitForTimeout(1000);

    // ── 3. Generate PDF buffer ─────────────────────────────────────────────────
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // required for coloured backgrounds
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
      displayHeaderFooter: false,
    });

    await browser.close();
    browser = null;

    // ── 4. Save to disk (create dirs if necessary) ────────────────────────────
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, pdfBuffer);

    // ── 5. Stream the PDF back to the client ──────────────────────────────────
    const filename = path.basename(outputPath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);

    console.log(`✅ PDF generated: ${outputPath}`);
  } catch (err) {
    // Close browser if still open
    if (browser) {
      try {
        await browser.close();
      } catch (_) {
        /* ignore */
      }
    }

    console.error("❌ PDF generation error:", err.message);

    // Only send an error response if headers have not been sent yet
    if (!res.headersSent) {
      res.status(500).json({
        status: "error",
        message: "PDF generation failed",
        detail:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
}

module.exports = { generatePdf };
