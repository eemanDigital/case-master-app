const pdf = require("pdf-creator-node");
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

exports.generatePdf = (dataValue, res, templateFile, fileOutPath) => {
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
    return res.status(500).json({ error: err.message });
  }
  
  const firm = dataValue?.firm || {};
  const options = {
    format: "A4",
    orientation: "portrait",
    border: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    header: {
      height: "15mm",
      contents: `<div style="text-align: center; font-size: 10pt; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 8px; font-weight: 600;">${firm.name || 'Law Firm'}</div>`
    },
    footer: {
      height: "12mm",
      contents: `<div style="text-align: center; font-size: 9pt; color: #777; border-top: 1px solid #ddd; padding-top: 6px;">Page <span style="font-weight: bold;">{{page}}</span> of <span style="font-weight: bold;">{{pages}}</span></div>`
    },
    timeout: 180000,
  };

  const document = {
    html: html,
    data: dataValue,
    path: outputPath,
  };

  const pdfTimeout = setTimeout(() => {
    console.error("PDF creation timeout");
    res.status(500).json({ error: "PDF generation timeout. Please try again." });
  }, 180000);

  pdf.create(document, options)
    .then((result) => {
      clearTimeout(pdfTimeout);
      console.log("PDF created:", result);
      res.sendFile(outputPath);
    })
    .catch((error) => {
      clearTimeout(pdfTimeout);
      console.error("PDF creation error:", error);
      res.status(500).json({ error: "PDF generation failed: " + error.message });
    });
};
