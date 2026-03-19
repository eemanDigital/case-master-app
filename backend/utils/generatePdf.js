const puppeteer = require("puppeteer");
const path = require("path");
const pug = require("pug");
const fs = require("fs");

const ensureOutputDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const cleanupOldPdfs = () => {
  const outputDir = path.resolve(__dirname, "../output");
  if (!fs.existsSync(outputDir)) return;
  
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  try {
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
      if (file.endsWith(".pdf")) {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath);
        }
      }
    });
  } catch (err) {
    console.error("Error cleaning up old PDFs:", err);
  }
};

cleanupOldPdfs();

exports.generatePdf = async (dataValue, res, templateFile, fileOutPath) => {
  const templatePath = path.isAbsolute(templateFile) 
    ? templateFile 
    : path.resolve(__dirname, templateFile);
  
  const outputPath = path.isAbsolute(fileOutPath)
    ? fileOutPath
    : path.resolve(__dirname, fileOutPath);
  
  console.log("Template path:", templatePath);
  console.log("Output path:", outputPath);
  
  ensureOutputDir(outputPath);
  
  let html;
  try {
    html = pug.renderFile(templatePath, dataValue);
  } catch (err) {
    console.error("Pug render error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
    return;
  }
  
  const firm = dataValue && dataValue.firm ? dataValue.firm : {};
  const firmName = firm.name || 'Law Firm';
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
    
    const page = await browser.newPage();
    
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"]
    });
    
    await page.emulateMediaType("screen");
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "10mm",
        bottom: "15mm",
        left: "10mm"
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; text-align: center; font-size: 10px; font-family: Arial, sans-serif; color: #1a365d; border-bottom: 2px solid #1a365d; padding: 8px 0;">
          <strong>${firmName}</strong>
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; text-align: center; font-size: 9px; font-family: Arial, sans-serif; color: #666; border-top: 1px solid #ddd; padding: 6px 0;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span> | ${firmName}
        </div>
      `
    });
    
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log("PDF created successfully at:", outputPath);
    
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${path.basename(outputPath)}"`);
      res.send(pdfBuffer);
    }
    
  } catch (error) {
    console.error("PDF creation error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "PDF generation failed: " + error.message });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
