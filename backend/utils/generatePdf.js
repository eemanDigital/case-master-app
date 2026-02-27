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

// pdf generator
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
  
  pug.renderFile(
    templatePath,
    dataValue,
    function (err, html) {
      if (err) {
        console.error("Pug render error:", err);
        res.status(500).json({ error: err.message });
      } else {
        const options = pdfoptions;

        const document = {
          html: html,
          data: dataValue,
          path: outputPath,
        };

        pdf
          .create(document, options)
          .then((result) => {
            console.log("PDF created:", result);
            res.sendFile(outputPath);
          })
          .catch((error) => {
            console.error("PDF creation error:", error);
            res.status(500).json({ error: error.message });
          });
      }
    }
  );
};
