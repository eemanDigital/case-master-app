"use strict";

/**
 * generateGenericPdf.js
 * Reusable premium PDF generator base class for all matter types.
 *
 * FIXES:
 *  - Wrong page number: uses getCurrentPageNumber() from design system
 *  - generate() no longer double-calls addHeader (caller must call addHeader once)
 *  - generate() renamed role: only finalizes/streams; content is built by caller
 *  - All color tokens unified via pdfDesignSystem
 *
 * DESIGN UPGRADES:
 *  - Navy + gold premium palette
 *  - Left-accent section headers (gold rule) instead of flat fills
 *  - Status badges with semantic color coding
 *  - Timeline items with filled circles and connector lines
 *  - Table headers use navy background with white text
 *  - Alternating row tints for readability
 *  - Two-column fields properly aligned
 *  - Footer with separator rule and centered metadata
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

class GenericPdfGenerator {
  constructor(options = {}) {
    this.options = options;
    this.doc = null;
    this.y = 70;
    this.chunks = [];
    this.pageWidth = 0;
    this.col1Width = 145;
    this.lineHeight = 16;
    this.leftMargin = 50;
    this.res = null;
    this.outputPath = null;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  init(res, outputPath) {
    this.res = res;
    this.outputPath = outputPath;

    this.doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
      info: {
        Title: this.options.title || "Matter Report",
        Author: this.options.firmName || "Law Firm",
      },
    });

    this.doc.on("data", (chunk) => this.chunks.push(chunk));
    this.pageWidth = this.doc.page.width - 100; // 495
    this.col2X = this.leftMargin + this.col1Width + 10;
    this.bottomGuard = this.doc.page.height - 55;

    return this;
  }

  // ── Page Structure ───────────────────────────────────────────────────────

  addHeader() {
    const { headerTitle = "Matter Report", matterNumber = "" } = this.options;

    // Navy band
    this.doc.rect(0, 0, this.doc.page.width, 60).fill(COLORS.navy);

    // Firm name
    this.doc
      .fillColor(COLORS.white)
      .fontSize(SIZES.h1)
      .font(FONTS.bold)
      .text(this.options.firmName || "Law Firm", this.leftMargin, 12, {
        width: 340,
      });

    // Gold accent rule
    this.doc.rect(this.leftMargin, 34, 50, 1.5).fill(COLORS.gold);

    // Report type
    this.doc
      .fontSize(SIZES.micro)
      .fillColor(COLORS.gold)
      .font(FONTS.bold)
      .text(headerTitle.toUpperCase(), this.leftMargin, 38);

    // Matter number top-right
    if (matterNumber) {
      this.doc
        .fontSize(SIZES.small)
        .fillColor(COLORS.white)
        .font(FONTS.regular)
        .text("MATTER NO.", 400, 16, { width: 145, align: "right" });
      this.doc
        .fontSize(SIZES.body)
        .fillColor(COLORS.white)
        .font(FONTS.bold)
        .text(matterNumber, 400, 28, { width: 145, align: "right" });
    }

    // Generated date
    this.doc
      .fontSize(SIZES.micro)
      .fillColor(COLORS.navyLight)
      .font(FONTS.regular)
      .text(formatDateTime(new Date()), 400, 46, {
        width: 145,
        align: "right",
      });

    this.y = 78;
  }

  addFooter() {
    const pageNum = getCurrentPageNumber(this.doc);
    const footerY = this.doc.page.height - 30;

    this.doc
      .moveTo(this.leftMargin, footerY - 8)
      .lineTo(this.leftMargin + this.pageWidth, footerY - 8)
      .lineWidth(0.4)
      .strokeColor(COLORS.gray200)
      .stroke();

    this.doc
      .fontSize(SIZES.micro)
      .fillColor(COLORS.textMuted)
      .font(FONTS.regular)
      .text(
        `${this.options.firmName || "Law Firm"}  ·  ${formatDateTime(new Date())}  ·  Page ${pageNum}`,
        this.leftMargin,
        footerY,
        { align: "center", width: this.pageWidth },
      );
  }

  addPageBreak() {
    this.addFooter();
    this.doc.addPage();
    this.y = 78;
    this.addHeader();
  }

  checkPageBreak(needed = 50) {
    if (this.y + needed > this.bottomGuard) {
      this.addPageBreak();
    }
  }

  // ── Section & Field Primitives ───────────────────────────────────────────

  addSection(title) {
    this.checkPageBreak(55);
    this.y += 10;

    // Gold left accent bar
    this.doc.rect(this.leftMargin, this.y, 3, 16).fill(COLORS.gold);

    this.doc
      .fontSize(SIZES.h3)
      .font(FONTS.bold)
      .fillColor(COLORS.navy)
      .text(title, this.leftMargin + 10, this.y + 2, {
        width: this.pageWidth - 10,
      });

    // Underline rule
    this.doc
      .moveTo(this.leftMargin, this.y + 20)
      .lineTo(this.leftMargin + this.pageWidth, this.y + 20)
      .lineWidth(0.5)
      .strokeColor(COLORS.navyLight)
      .stroke();

    this.y += 30;
  }

  addSubSection(title) {
    this.checkPageBreak(40);
    this.y += 4;
    this.doc
      .fontSize(SIZES.body)
      .font(FONTS.bold)
      .fillColor(COLORS.navyMid)
      .text(title, this.leftMargin, this.y);
    this.y += this.lineHeight + 2;
  }

  /**
   * Renders a label: value row.
   * Returns the display value (or null if empty) so callers can branch.
   */
  addField(label, value, options = {}) {
    this.checkPageBreak(this.lineHeight + 4);

    const {
      color = COLORS.textPrimary,
      bold = false,
      skipIfEmpty = true,
    } = options;
    const display =
      value !== undefined && value !== null && value !== ""
        ? String(value)
        : null;

    if (!display && skipIfEmpty) {
      this.y += this.lineHeight;
      return null;
    }

    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textMuted)
      .text(`${label}:`, this.leftMargin, this.y, { width: this.col1Width });

    this.doc
      .fontSize(SIZES.small)
      .font(bold ? FONTS.bold : FONTS.regular)
      .fillColor(display ? color : COLORS.gray400)
      .text(display || "—", this.col2X, this.y, {
        width: this.pageWidth - this.col1Width - 10,
      });

    this.y += this.lineHeight;
    return display;
  }

  addStatusField(label, status) {
    this.checkPageBreak(this.lineHeight + 4);

    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textMuted)
      .text(`${label}:`, this.leftMargin, this.y, { width: this.col1Width });

    const { fg, bg } = getStatusColors(status);
    const statusText = String(status || "N/A").toUpperCase();
    const badgeW =
      this.doc.widthOfString(statusText, { fontSize: SIZES.micro }) + 12;
    this.doc.roundedRect(this.col2X, this.y - 1, badgeW, 13, 2).fill(bg);
    this.doc
      .fillColor(fg)
      .fontSize(SIZES.micro)
      .font(FONTS.bold)
      .text(statusText, this.col2X + 6, this.y + 2);

    this.y += this.lineHeight;
  }

  addMoneyField(label, amount, currency = "NGN") {
    const display = amount ? formatCurrency(amount, currency) : null;
    return this.addField(label, display, { bold: true, color: COLORS.navy });
  }

  addDateField(label, date) {
    return this.addField(label, formatDate(date));
  }

  addTwoColumnField(label1, value1, label2, value2) {
    this.checkPageBreak(this.lineHeight + 4);

    const halfW = this.pageWidth / 2 - 10;
    const mid = this.leftMargin + halfW + 20;

    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textMuted)
      .text(`${label1}:`, this.leftMargin, this.y, { width: this.col1Width });
    this.doc
      .fillColor(COLORS.textPrimary)
      .text(String(value1 ?? "—"), this.col2X, this.y, {
        width: halfW - this.col1Width,
      });

    this.doc
      .fillColor(COLORS.textMuted)
      .text(`${label2}:`, mid, this.y, { width: this.col1Width });
    this.doc
      .fillColor(COLORS.textPrimary)
      .text(String(value2 ?? "—"), mid + this.col1Width + 10, this.y, {
        width: halfW - this.col1Width,
      });

    this.y += this.lineHeight;
  }

  // ── Table ────────────────────────────────────────────────────────────────

  addTable(headers, rows, options = {}) {
    const { colWidths = [] } = options;
    this.checkPageBreak(50);

    // Header bar
    this.doc
      .rect(this.leftMargin, this.y, this.pageWidth, 20)
      .fill(COLORS.navy);
    let x = this.leftMargin + 5;
    headers.forEach((h, i) => {
      this.doc
        .fillColor(COLORS.white)
        .fontSize(SIZES.small)
        .font(FONTS.bold)
        .text(h, x, this.y + 6, { width: (colWidths[i] || 80) - 5 });
      x += colWidths[i] || 80;
    });
    this.y += 24;

    rows.forEach((row, rowIdx) => {
      this.checkPageBreak(20);
      if (rowIdx % 2 === 1) {
        this.doc
          .rect(this.leftMargin, this.y - 2, this.pageWidth, 18)
          .fill(COLORS.gray50);
      }
      x = this.leftMargin + 5;
      row.forEach((cell, colIdx) => {
        const isFirst = colIdx === 0;
        const { fg } = getStatusColors(isFirst ? cell : null);
        this.doc
          .fillColor(isFirst ? fg : COLORS.textPrimary)
          .fontSize(SIZES.small)
          .font(isFirst ? FONTS.bold : FONTS.regular)
          .text(String(cell ?? "—").substring(0, 30), x, this.y + 1, {
            width: (colWidths[colIdx] || 80) - 5,
          });
        x += colWidths[colIdx] || 80;
      });
      this.y += 18;
    });

    this.y += 10;
  }

  // ── Timeline ─────────────────────────────────────────────────────────────

  addTimeline(items) {
    items.forEach((item, idx) => {
      this.checkPageBreak(35);

      const { fg } = getStatusColors(item.status);
      const circleX = this.leftMargin + 8;
      const circleY = this.y + 6;

      // Connector line to next item
      if (idx < items.length - 1) {
        this.doc
          .moveTo(circleX, circleY + 6)
          .lineTo(circleX, circleY + 28)
          .lineWidth(1)
          .strokeColor(COLORS.gray300)
          .stroke();
      }

      // Status circle
      this.doc.circle(circleX, circleY, 5).fill(fg);

      // Title
      this.doc
        .fontSize(SIZES.body)
        .font(FONTS.bold)
        .fillColor(COLORS.textPrimary)
        .text(item.title, this.leftMargin + 22, this.y, { width: 320 });

      // Date (right-aligned)
      if (item.date) {
        this.doc
          .fontSize(SIZES.small)
          .font(FONTS.regular)
          .fillColor(COLORS.textMuted)
          .text(formatDate(item.date), 390, this.y, {
            width: 110,
            align: "right",
          });
      }

      this.y += 18;

      if (item.description) {
        this.checkPageBreak(16);
        this.doc
          .fontSize(SIZES.small)
          .font(FONTS.regular)
          .fillColor(COLORS.textSecondary)
          .text(item.description, this.leftMargin + 22, this.y, { width: 370 });
        this.y += this.doc.heightOfString(item.description, { width: 370 }) + 4;
      }
    });
  }

  // ── Finalize ─────────────────────────────────────────────────────────────

  /**
   * Call this AFTER all content methods.
   * Adds footer to final page, then streams/saves the PDF.
   * Does NOT call addHeader() — caller must call addHeader() once before content.
   */
  async generate() {
    this.addFooter();
    return finalizePdf(this.doc, this.chunks, this.res, this.outputPath);
  }
}

module.exports = {
  GenericPdfGenerator,
  // Re-export helpers so existing callers don't need to change imports
  getStatusColors,
  formatCurrency,
  formatDate,
  COLORS,
};
