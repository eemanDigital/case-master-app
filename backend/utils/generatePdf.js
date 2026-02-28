const pdf = require("pdf-creator-node");
const path = require("path");
const pug = require("pug");
const fs = require("fs");
const pdfoptions = require("./pdfoptions");

// Ensure output directory exists
const ensureOutputDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Clean up old PDF files (older than 1 hour)
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

// Run cleanup on startup
cleanupOldPdfs();

// pdf generator with timeout
exports.generatePdf = (dataValue, res, templateFile, fileOutPath) => {
  // Handle template path - use as-is if absolute, resolve if relative
  const templatePath = path.isAbsolute(templateFile) 
    ? templateFile 
    : path.resolve(__dirname, templateFile);
  
  // Handle output path - use as-is if absolute, resolve if relative
  const outputPath = path.isAbsolute(fileOutPath)
    ? fileOutPath
    : path.resolve(__dirname, fileOutPath);
  
  console.log("Template path:", templatePath);
  console.log("Output path:", outputPath);
  
  // Ensure output directory exists
  ensureOutputDir(outputPath);
  
  // Set timeout for pug rendering
  const pugTimeout = setTimeout(() => {
    console.error("Pug rendering timeout");
    res.status(500).json({ error: "PDF generation timeout. Please try again." });
  }, 30000); // 30 seconds
  
  pug.renderFile(
    templatePath,
    dataValue,
    function (err, html) {
      clearTimeout(pugTimeout);
      
      if (err) {
        console.error("Pug render error:", err);
        return res.status(500).json({ error: err.message });
      }
      
      // Get firm from dataValue and pass to pdfoptions
      const firm = dataValue?.firm || {};
      const options = typeof pdfoptions === 'function' ? pdfoptions(firm) : pdfoptions;

      console.log("PDF options:", JSON.stringify(options, null, 2));

      const document = {
        html: html,
        data: dataValue,
        path: outputPath,
      };

      // Set timeout for PDF creation
      const pdfTimeout = setTimeout(() => {
        console.error("PDF creation timeout");
        res.status(500).json({ error: "PDF generation timeout. Please try again." });
      }, 60000); // 60 seconds

      pdf
        .create(document, options)
        .then((result) => {
          clearTimeout(pdfTimeout);
          console.log("PDF created:", result);
          res.sendFile(outputPath);
        })
        .catch((error) => {
          clearTimeout(pdfTimeout);
          console.error("PDF creation error:", error);
          res.status(500).json({ error: error.message });
        });
    }
  );
};
