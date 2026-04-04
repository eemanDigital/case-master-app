/**
 * generateGenericPdf.js - Reusable PDF generator for all matter types
 * Uses PDFKit - no Chrome/Puppeteer required
 */
"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const COLORS = {
  headerBg: "#1a365d",
  sectionBg: "#e2e8f0",
  labelColor: "#718096",
  valueColor: "#2d3748",
  accentColor: "#3182ce",
  successColor: "#38a169",
  warningColor: "#dd6b20",
  errorColor: "#e53e3e",
  white: "#ffffff",
};

function getStatusColor(status) {
  if (!status) return COLORS.labelColor;
  const s = status.toLowerCase();
  if (["completed", "active", "registered", "agreed", "approved"].includes(s)) return COLORS.successColor;
  if (["pending", "in-progress", "processing"].includes(s)) return COLORS.accentColor;
  if (["expired", "rejected", "terminated", "disputed"].includes(s)) return COLORS.errorColor;
  if (["executed"].includes(s)) return COLORS.warningColor;
  return COLORS.labelColor;
}

function getStatusBg(status) {
  if (!status) return "#e2e8f0";
  const s = status.toLowerCase();
  if (["completed", "active", "registered", "agreed", "approved"].includes(s)) return "#c6f6d5";
  if (["pending", "in-progress", "processing"].includes(s)) return "#bee3f8";
  if (["expired", "rejected", "terminated", "disputed"].includes(s)) return "#fed7d7";
  if (["executed"].includes(s)) return "#feebc8";
  return "#e2e8f0";
}

function formatCurrency(amount, currency = "NGN") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-GB");
}

class GenericPdfGenerator {
  constructor(options = {}) {
    this.options = options;
    this.doc = null;
    this.y = 50;
    this.chunks = [];
    this.pageWidth = 0;
    this.col1Width = 140;
    this.lineHeight = 15;
  }

  init(res, outputPath) {
    this.doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: this.options.title || "Matter Report",
        Author: this.options.firmName || "Law Firm",
      },
    });

    this.doc.on("data", (chunk) => this.chunks.push(chunk));

    this.pageWidth = this.doc.page.width - 100;
    this.col2X = 50 + this.col1Width + 10;

    this.res = res;
    this.outputPath = outputPath;

    return this;
  }

  addPageBreak() {
    this.addFooter();
    this.doc.addPage();
    this.y = 50;
    this.addHeader();
  }

  addHeader() {
    const { headerTitle = "Matter Report", matterNumber = "" } = this.options;

    this.doc.rect(0, 0, this.doc.page.width, 55).fill(COLORS.headerBg);

    this.doc.fillColor(COLORS.white)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(this.options.firmName || "Law Firm", 50, 12);

    this.doc.fontSize(8)
      .font("Helvetica")
      .text(headerTitle, 50, 32);

    this.doc.fontSize(10)
      .font("Helvetica-Bold")
      .text(matterNumber, 450, 18, { width: 100, align: "right" });

    this.y = 70;
  }

  addFooter() {
    const pageNum = this.doc.bufferedPageRange().start + 1;
    this.doc.fontSize(7)
      .fillColor(COLORS.labelColor)
      .text(
        `Generated: ${new Date().toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        })} | ${this.options.firmName || "Law Firm"} | Page ${pageNum}`,
        50, this.doc.page.height - 25,
        { align: "center", width: this.pageWidth }
      );
  }

  checkPageBreak(needed = 50) {
    if (this.y > this.doc.page.height - needed) {
      this.addPageBreak();
    }
  }

  addSection(title) {
    this.checkPageBreak(50);
    this.y += 8;

    this.doc.rect(40, this.y, this.pageWidth, 20).fill(COLORS.sectionBg);
    this.doc.fillColor(COLORS.headerBg)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(title, 50, this.y + 5);

    this.y += 28;
  }

  addField(label, value, options = {}) {
    if (this.y > this.doc.page.height - 40) {
      this.addPageBreak();
    }

    const { color = COLORS.valueColor, bold = false } = options;
    const displayValue = value !== undefined && value !== null ? String(value) : null;

    if (displayValue) {
      this.doc.fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.labelColor)
        .text(label + ":", 50, this.y, { width: this.col1Width });

      this.doc.fontSize(8)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(color)
        .text(displayValue, this.col2X, this.y, { width: this.pageWidth - this.col1Width - 10 });
    }

    this.y += this.lineHeight;
    return displayValue;
  }

  addStatusField(label, status) {
    if (this.y > this.doc.page.height - 40) {
      this.addPageBreak();
    }

    const statusText = String(status || "N/A").toUpperCase();
    const statusColor = getStatusColor(status);
    const statusBg = getStatusBg(status);

    this.doc.fontSize(8)
      .font("Helvetica")
      .fillColor(COLORS.labelColor)
      .text(label + ":", 50, this.y, { width: this.col1Width });

    const textWidth = this.doc.widthOfString(statusText);
    this.doc.roundedRect(this.col2X, this.y - 1, textWidth + 10, 13, 2).fill(statusBg);
    this.doc.fillColor(statusColor)
      .fontSize(7)
      .font("Helvetica-Bold")
      .text(statusText, this.col2X + 5, this.y + 1);

    this.y += this.lineHeight;
  }

  addMoneyField(label, amount, currency = "NGN") {
    const displayValue = amount ? formatCurrency(amount, currency) : null;
    return this.addField(label, displayValue);
  }

  addTwoColumnField(label1, value1, label2, value2) {
    if (this.y > this.doc.page.height - 40) {
      this.addPageBreak();
    }

    this.doc.fontSize(8).font("Helvetica").fillColor(COLORS.labelColor)
      .text(label1 + ":", 50, this.y, { width: this.col1Width })
      .text(label2 + ":", 280, this.y, { width: this.col1Width });

    this.doc.fontSize(8).font("Helvetica").fillColor(COLORS.valueColor)
      .text(String(value1 || "N/A"), this.col2X, this.y, { width: 120 })
      .text(String(value2 || "N/A"), 280 + this.col1Width + 10, this.y, { width: 120 });

    this.y += this.lineHeight;
  }

  addSubSection(title) {
    this.checkPageBreak(40);
    this.doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.headerBg)
      .text(title, 50, this.y);
    this.y += this.lineHeight;
  }

  addTable(headers, rows, options = {}) {
    const { colWidths = [] } = options;
    const startY = this.y;

    if (this.y > this.doc.page.height - 60) {
      this.addPageBreak();
    }

    // Header
    this.doc.rect(40, this.y, this.pageWidth, 18).fill(COLORS.accentColor);
    let x = 45;
    headers.forEach((h, i) => {
      this.doc.fillColor(COLORS.white).fontSize(7).font("Helvetica-Bold")
        .text(h, x, this.y + 5);
      x += colWidths[i] || 80;
    });
    this.y += 22;

    // Rows
    rows.forEach((row) => {
      this.checkPageBreak(20);

      x = 45;
      row.forEach((cell, i) => {
        const cellColor = i === 0 ? getStatusColor(cell) : COLORS.valueColor;
        this.doc.fillColor(cellColor)
          .fontSize(7)
          .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
          .text(String(cell || "-").substring(0, 25), x, this.y, { width: colWidths[i] - 5 });
        x += colWidths[i] || 80;
      });
      this.y += 16;
    });

    this.y += 8;
  }

  addTimeline(items) {
    items.forEach((item) => {
      this.checkPageBreak(30);

      const color = getStatusColor(item.status);

      this.doc.circle(52, this.y + 4, 4).fill(color);
      this.doc.moveTo(56, this.y + 4).lineTo(70, this.y + 4).stroke(COLORS.labelColor);

      this.doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.valueColor)
        .text(item.title, 75, this.y, { width: 300 });

      if (item.date) {
        this.doc.fontSize(7).font("Helvetica").fillColor(COLORS.labelColor)
          .text(formatDate(item.date), 380, this.y);
      }

      this.y += 18;

      if (item.description) {
        this.doc.fontSize(7).font("Helvetica").fillColor(COLORS.labelColor)
          .text(item.description, 75, this.y, { width: 400 });
        this.y += 14;
      }
    });
  }

  async generate() {
    this.addHeader();
    this.addFooter();

    return new Promise((resolve, reject) => {
      this.doc.end();

      this.doc.on("end", () => {
        try {
          const pdfBuffer = Buffer.concat(this.chunks);

          if (!fs.existsSync(path.dirname(this.outputPath))) {
            fs.mkdirSync(path.dirname(this.outputPath), { recursive: true });
          }
          fs.writeFileSync(this.outputPath, pdfBuffer);

          const filename = path.basename(this.outputPath);
          this.res.setHeader("Content-Type", "application/pdf");
          this.res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          this.res.setHeader("Content-Length", pdfBuffer.length);
          this.res.end(pdfBuffer);

          console.log(`✅ PDF generated: ${this.outputPath}`);
          resolve(this.outputPath);
        } catch (err) {
          reject(err);
        }
      });

      this.doc.on("error", reject);
    });
  }
}

module.exports = {
  GenericPdfGenerator,
  getStatusColor,
  getStatusBg,
  formatCurrency,
  formatDate,
};
