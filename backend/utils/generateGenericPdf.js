"use strict";

/**
 * generateGenericPdf.js
 * Premium matter report PDF generator.
 * Uses PDFKit — no Chrome/Puppeteer required.
 *
 * STYLE: Follows the same pattern as generateInvoicePdf and generateCauseListPdf
 * - Helper functions declared before use
 * - Simple checkY() for page breaks
 * - Footer drawn with getCurrentPageNumber()
 */

const PDFDocument = require("pdfkit");
const {
  COLORS,
  FONTS,
  SIZES,
  getStatusColors,
  formatCurrency,
  formatDate,
  formatDateTime,
  getCurrentPageNumber,
  finalizePdf,
} = require("./pdfDesignSystem");

// ─── Shared Drawing Primitives ───────────────────────────────────────────────

function drawFooter(doc, firmName, pageWidth, leftMargin = 40) {
  const pageNum = getCurrentPageNumber(doc);
  const footerY = doc.page.height - 30;

  doc.moveTo(leftMargin, footerY - 8)
    .lineTo(leftMargin + pageWidth, footerY - 8)
    .lineWidth(0.4)
    .strokeColor(COLORS.gray200)
    .stroke();

  doc.fontSize(SIZES.micro)
    .fillColor(COLORS.textMuted)
    .font(FONTS.regular)
    .text(
      `${firmName || "Law Firm"}  ·  ${formatDateTime(new Date())}  ·  Page ${pageNum}`,
      leftMargin,
      footerY,
      { align: "center", width: pageWidth },
    );
}

function drawStatusBadge(doc, status, x, y) {
  const { fg, bg } = getStatusColors(status);
  const label = String(status || "N/A").toUpperCase();
  const badgeW = doc.widthOfString(label, { fontSize: SIZES.micro }) + 10;
  doc.roundedRect(x, y - 1, badgeW, 12, 2).fill(bg);
  doc.fillColor(fg).fontSize(SIZES.micro).font(FONTS.bold).text(label, x + 5, y + 1);
}

function drawHRule(doc, x, y, width, color = COLORS.gray200, weight = 0.5) {
  doc.moveTo(x, y).lineTo(x + width, y).lineWidth(weight).strokeColor(color).stroke();
}

function drawSectionHeader(doc, title, x, y, width) {
  doc.rect(x, y, 3, 14).fill(COLORS.gold);
  doc.fontSize(SIZES.h3).font(FONTS.bold).fillColor(COLORS.navy)
    .text(title, x + 10, y + 2, { width: width - 10 });
  drawHRule(doc, x, y + 18, width, COLORS.navyLight);
  return y + 26;
}

function getStatusColor(status) {
  return getStatusColors(status).fg;
}

function getStatusBg(status) {
  return getStatusColors(status).bg;
}

// ─── Generator Class ─────────────────────────────────────────────────────────

class GenericPdfGenerator {
  constructor(options = {}) {
    this.options = options;
    this.doc = null;
    this.res = null;
    this.outputPath = null;
    this.chunks = [];
    this.leftMargin = 40;
    this.pageWidth = 0;
    this.y = 0;
    this.bottomGuard = 0;
  }

  init(res, outputPath) {
    this.res = res;
    this.outputPath = outputPath;

    this.doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 0, right: 0 },
      bufferPages: true,
      info: {
        Title: this.options.title || "Matter Report",
        Author: this.options.firmName || "Law Firm",
      },
    });

    this.doc.on("data", (chunk) => this.chunks.push(chunk));
    this.pageWidth = this.doc.page.width - 80;
    this.bottomGuard = this.doc.page.height - 55;

    // Bind methods
    this.addHeader = this.addHeader.bind(this);
    this.addFooter = this.addFooter.bind(this);
    this.addPageBreak = this.addPageBreak.bind(this);
    this.checkY = this.checkY.bind(this);
    this.addSection = this.addSection.bind(this);
    this.addSubSection = this.addSubSection.bind(this);
    this.addField = this.addField.bind(this);
    this.addStatusField = this.addStatusField.bind(this);
    this.addMoneyField = this.addMoneyField.bind(this);
    this.addDateField = this.addDateField.bind(this);
    this.addLongTextField = this.addLongTextField.bind(this);
    this.addTwoColumnField = this.addTwoColumnField.bind(this);
    this.addTable = this.addTable.bind(this);
    this.addTimeline = this.addTimeline.bind(this);

    return this;
  }

  addHeader() {
    const { headerTitle = "Matter Report", matterNumber = "" } = this.options;

    this.doc.rect(0, 0, this.doc.page.width, 78).fill(COLORS.navy);

    this.doc.fillColor(COLORS.white).fontSize(SIZES.h1).font(FONTS.bold)
      .text(this.options.firmName || "Law Firm", this.leftMargin, 14, { width: 300 });

    this.doc.rect(this.leftMargin, 36, 60, 1.5).fill(COLORS.gold);

    this.doc.fontSize(SIZES.micro).fillColor(COLORS.gold).font(FONTS.bold)
      .text(headerTitle.toUpperCase(), this.leftMargin, 41, { width: 300 });

    const rightX = 400;
    if (matterNumber) {
      this.doc.fontSize(SIZES.micro).fillColor(COLORS.navyLight).font(FONTS.regular)
        .text("MATTER NO.", rightX, 16, { width: 155, align: "right" });
      this.doc.fontSize(SIZES.body).fillColor(COLORS.white).font(FONTS.bold)
        .text(matterNumber, rightX, 28, { width: 155, align: "right" });
    }

    this.doc.fontSize(SIZES.micro).fillColor(COLORS.navyLight).font(FONTS.regular)
      .text(formatDateTime(new Date()), rightX, matterNumber ? 42 : 28, {
        width: 155, align: "right",
      });

    this.y = 90;
  }

  addFooter() {
    drawFooter(this.doc, this.options.firmName, this.pageWidth, this.leftMargin);
  }

  addPageBreak() {
    this.addFooter();
    this.doc.addPage();
    this.addHeader();
  }

  checkY(needed = 30) {
    if (this.y + needed > this.bottomGuard) {
      this.addPageBreak();
    }
  }

  addSection(title) {
    this.checkY(35);
    this.y = drawSectionHeader(this.doc, title, this.leftMargin, this.y, this.pageWidth);
  }

  addSubSection(title) {
    this.checkY(25);
    const startY = this.y;

    this.doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.navyMid)
      .text(title, this.leftMargin, startY);

    this.y = startY + 14;
  }

  addField(label, value, options = {}) {
    if (!value && options.skipIfEmpty !== false) return null;

    const text = String(value);
    const labelWidth = 140;
    const valueX = this.leftMargin + labelWidth + 15;
    const valueWidth = this.pageWidth - valueX - 10;

    const labelH = this.doc.heightOfString(`${label}:`, { width: labelWidth, fontSize: SIZES.small });
    const valueH = this.doc.heightOfString(text, { width: valueWidth, fontSize: SIZES.small });
    const rowH = Math.max(labelH, valueH, 12);

    this.checkY(rowH + 6);
    const startY = this.y;

    this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text(`${label}:`, this.leftMargin, startY, { width: labelWidth });

    this.doc.fontSize(SIZES.small).font(options.bold ? FONTS.bold : FONTS.regular)
      .fillColor(options.color || COLORS.textPrimary)
      .text(text, valueX, startY, { width: valueWidth });

    this.y = startY + rowH + 4;
    return text;
  }

  addStatusField(label, status) {
    const labelWidth = 140;
    const valueX = this.leftMargin + labelWidth + 15;

    this.checkY(20);
    const startY = this.y;

    this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text(`${label}:`, this.leftMargin, startY, { width: labelWidth });

    drawStatusBadge(this.doc, status, valueX, startY);

    this.y = startY + 18;
  }

  addMoneyField(label, amount, currency = "NGN") {
    const text = amount ? formatCurrency(amount, currency) : null;
    if (text) {
      this.addField(label, text, { bold: true, color: COLORS.navy });
    }
    return text;
  }

  addDateField(label, date) {
    return this.addField(label, formatDate(date));
  }

  addLongTextField(label, value) {
    if (!value) return null;

    const labelWidth = 140;
    const startY = this.y;

    this.doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.textMuted)
      .text(`${label}:`, this.leftMargin, startY, { width: labelWidth });

    const textX = this.leftMargin + labelWidth + 15;
    const textWidth = this.pageWidth - textX - 10;
    const textH = this.doc.heightOfString(value, { width: textWidth, fontSize: SIZES.small });

    this.checkY(textH + 20);

    this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textPrimary)
      .text(value, textX, startY, { width: textWidth });

    this.y = startY + textH + 10;
    return value;
  }

  addTwoColumnField(label1, val1, label2, val2) {
    this.checkY(20);
    const startY = this.y;
    const colW = 140;
    const valOffset = 155;
    const halfW = this.pageWidth / 2;
    const midX = this.leftMargin + halfW;

    this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text(`${label1}:`, this.leftMargin, startY, { width: colW });

    this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textPrimary)
      .text(String(val1 ?? "—"), this.leftMargin + valOffset, startY, { width: halfW - valOffset - 10 });

    this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text(`${label2}:`, midX, startY, { width: colW });

    this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textPrimary)
      .text(String(val2 ?? "—"), midX + valOffset, startY, { width: halfW - valOffset - 10 });

    this.y += 18;
  }

  addTable(headers, rows, options = {}) {
    const { colWidths = [] } = options;
    const defaultW = this.pageWidth / headers.length;
    const rowH = 18;

    this.checkY(30);
    this.y = drawSectionHeader(this.doc, options.title || "Details", this.leftMargin, this.y, this.pageWidth);

    // Header
    this.doc.rect(this.leftMargin, this.y, this.pageWidth, 20).fill(COLORS.navy);
    let x = this.leftMargin + 5;
    headers.forEach((h, i) => {
      const w = colWidths[i] || defaultW;
      this.doc.fillColor(COLORS.white).fontSize(SIZES.small).font(FONTS.bold)
        .text(h, x, this.y + 5, { width: w - 10 });
      x += w;
    });
    this.y += 24;

    // Rows
    rows.forEach((row, idx) => {
      this.checkY(rowH + 4);
      if (idx % 2 === 1) {
        this.doc.rect(this.leftMargin, this.y - 2, this.pageWidth, rowH).fill(COLORS.gray50);
      }
      x = this.leftMargin + 5;
      row.forEach((cell, colIdx) => {
        const w = colWidths[colIdx] || defaultW;
        const isFirst = colIdx === 0;
        const { fg } = getStatusColors(isFirst ? cell : null);
        this.doc.fillColor(isFirst ? fg : COLORS.textPrimary)
          .fontSize(SIZES.small)
          .font(isFirst ? FONTS.bold : FONTS.regular)
          .text(String(cell ?? "—").substring(0, 30), x, this.y + 2, { width: w - 10 });
        x += w;
      });
      this.y += rowH;
    });

    this.y += 10;
  }

  addTimeline(items) {
    items.forEach((item, idx) => {
      const descH = item.description
        ? this.doc.heightOfString(item.description, { width: 370 })
        : 0;
      this.checkY(22 + descH);

      const startY = this.y;
      const { fg } = getStatusColors(item.status);
      const circleX = this.leftMargin + 8;
      const circleY = startY + 5;

      if (idx < items.length - 1) {
        this.doc.moveTo(circleX, circleY + 5)
          .lineTo(circleX, circleY + 18)
          .lineWidth(1)
          .strokeColor(COLORS.gray300)
          .stroke();
      }

      this.doc.circle(circleX, circleY, 3.5).fill(fg);

      this.doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.textPrimary)
        .text(item.title, this.leftMargin + 18, startY, { width: 320 });

      if (item.date) {
        this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
          .text(formatDate(item.date), 390, startY, { width: 110, align: "right" });
      }

      this.y += 14;

      if (item.description) {
        this.doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
          .text(item.description, this.leftMargin + 18, this.y, { width: 370 });
        this.y += descH + 4;
      }
    });
  }

  async generate() {
    this.addFooter();
    return finalizePdf(this.doc, this.chunks, this.res, this.outputPath);
  }
}

module.exports = {
  GenericPdfGenerator,
  getStatusColors,
  getStatusColor,
  getStatusBg,
  formatCurrency,
  formatDate,
  formatDateTime,
  COLORS,
};
