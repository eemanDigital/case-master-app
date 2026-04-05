"use strict";

/**
 * generateGenericPdf.js
 * Premium matter report PDF generator.
 * Uses PDFKit — no Chrome/Puppeteer required.
 *
 * FIXES APPLIED:
 * 1. Blank pages: addHeader() called once; addPageBreak() only adds a page +
 *    continuation banner. Footers stamped exclusively in generate().
 * 2. Two-column alignment: proportional colWidth math, no hardcoded offsets.
 * 3. addSubSection y-tracking: uses heightOfString, not fixed +12.
 * 4. Status badge: fillColor reset to textPrimary after each badge.
 * 5. Trailing blank pages — pure PDFKit, zero external deps (no pdf-lib,
 *    no Python, no execSync):
 *    a) isCurrentPageDirty set ONLY by real content draws — never by banners,
 *       addPageBreak(), addHeader(), or addSection().
 *    b) checkY() resets isCurrentPageDirty = false BEFORE addPageBreak() so
 *       every fresh page starts clean.
 *    c) addPageBreak() does NOT touch isCurrentPageDirty.
 *    d) generate() reads the flag after all content: dirty → include last page;
 *       clean → exclude it from footer stamping.
 * 6. Page X of Y stamped in footer on every content page.
 * 7. Chunks collected via "data" in init(); doc.end() called inside generate()
 *    Promise — no data loss race condition.
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const {
  COLORS,
  FONTS,
  SIZES,
  getStatusColors,
  formatCurrency,
  formatDate,
  formatDateTime,
  ensureOutputDir,
  getFilename,
} = require("./pdfDesignSystem");

// ─── Shared Drawing Primitives ───────────────────────────────────────────────

function drawStatusBadge(doc, status, x, y) {
  const { fg, bg } = getStatusColors(status);
  const label = String(status || "N/A").toUpperCase();
  const badgeW = doc.widthOfString(label, { fontSize: SIZES.micro }) + 10;
  doc.roundedRect(x, y - 1, badgeW, 12, 2).fill(bg);
  doc
    .fillColor(fg)
    .fontSize(SIZES.micro)
    .font(FONTS.bold)
    .text(label, x + 5, y + 1);
  doc.fillColor(COLORS.textPrimary); // reset so next draw isn't tinted
}

function drawHRule(doc, x, y, width, color = COLORS.gray200, weight = 0.5) {
  doc
    .moveTo(x, y)
    .lineTo(x + width, y)
    .lineWidth(weight)
    .strokeColor(color)
    .stroke();
}

function drawSectionHeader(doc, title, x, y, width) {
  doc.rect(x, y, 3, 14).fill(COLORS.gold);
  doc
    .fontSize(SIZES.h3)
    .font(FONTS.bold)
    .fillColor(COLORS.navy)
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
    this.spacing = { xs: 2, sm: 4, md: 6, lg: 10 };

    // ── Dirty-flag ────────────────────────────────────────────────────────
    // true  = current page has received at least one real content draw
    // false = current page has only infrastructure (banner/header/section bar)
    //
    // SET TO TRUE:  addField, addStatusField, addLongTextField,
    //               addTwoColumnField, addSubSection, addTable, addTimeline
    // SET TO FALSE: checkY() — immediately before opening a new page
    // NEVER TOUCHED: addHeader(), _addContinuationBanner(), addPageBreak(),
    //                addSection()
    this.isCurrentPageDirty = false;
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  init(res, outputPath) {
    this.res = res;
    this.outputPath = outputPath;
    this.chunks = [];
    this.isCurrentPageDirty = false;

    this.doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: this.options.title || "Matter Report",
        Author: this.options.firmName || "Law Firm",
      },
    });

    // Collect chunks before doc.end() is ever called
    this.doc.on("data", (chunk) => this.chunks.push(chunk));

    this.pageWidth = this.doc.page.width - 80; // 595 - 80 = 515 pt
    this.bottomGuard = this.doc.page.height - 60; // 841 - 60 = 781 pt

    return this;
  }

  // ── Header ────────────────────────────────────────────────────────────────

  /** Full navy header — call ONCE on the first page only. */
  addHeader() {
    const { headerTitle = "Matter Report", matterNumber = "" } = this.options;

    this.doc.rect(0, 0, this.doc.page.width, 78).fill(COLORS.navy);

    this.doc
      .fillColor(COLORS.white)
      .fontSize(SIZES.h1)
      .font(FONTS.bold)
      .text(this.options.firmName || "Law Firm", this.leftMargin, 14, {
        width: 300,
      });

    this.doc.rect(this.leftMargin, 36, 60, 1.5).fill(COLORS.gold);

    this.doc
      .fontSize(SIZES.micro)
      .fillColor(COLORS.gold)
      .font(FONTS.bold)
      .text(headerTitle.toUpperCase(), this.leftMargin, 41, { width: 300 });

    const rightX = 400;
    if (matterNumber) {
      this.doc
        .fontSize(SIZES.micro)
        .fillColor(COLORS.navyLight)
        .font(FONTS.regular)
        .text("MATTER NO.", rightX, 16, { width: 155, align: "right" });
      this.doc
        .fontSize(SIZES.body)
        .fillColor(COLORS.white)
        .font(FONTS.bold)
        .text(matterNumber, rightX, 28, { width: 155, align: "right" });
    }

    this.doc
      .fontSize(SIZES.micro)
      .fillColor(COLORS.navyLight)
      .font(FONTS.regular)
      .text(formatDateTime(new Date()), rightX, matterNumber ? 42 : 28, {
        width: 155,
        align: "right",
      });

    this.y = 90;
    // ← NOT setting isCurrentPageDirty — first field draw will do that.
  }

  /** Slim banner for continuation pages. Infrastructure — does NOT dirty page. */
  _addContinuationBanner() {
    const { matterNumber = "", firmName = "Law Firm" } = this.options;

    this.doc.rect(0, 0, this.doc.page.width, 28).fill(COLORS.navy);

    this.doc
      .fontSize(SIZES.small)
      .fillColor(COLORS.white)
      .font(FONTS.bold)
      .text(firmName, this.leftMargin, 9, { width: 250 });

    if (matterNumber) {
      this.doc
        .fontSize(SIZES.small)
        .fillColor(COLORS.navyLight)
        .font(FONTS.regular)
        .text(`Matter No. ${matterNumber}`, 0, 9, {
          width: this.doc.page.width - this.leftMargin,
          align: "right",
        });
    }

    this.y = 40;
    // ← NOT setting isCurrentPageDirty.
  }

  // ── Page break ────────────────────────────────────────────────────────────

  /**
   * Opens a new PDFKit page and draws the continuation banner.
   * Does NOT modify isCurrentPageDirty — checkY() is responsible for that.
   */
  addPageBreak() {
    this.doc.addPage();
    this._addContinuationBanner();
    // ← NOT setting isCurrentPageDirty.
  }

  /**
   * Checks vertical space. If content won't fit:
   *   1. Clears isCurrentPageDirty (new page starts clean)
   *   2. Calls addPageBreak()
   */
  checkY(needed = 20) {
    if (this.y + needed > this.bottomGuard) {
      this.isCurrentPageDirty = false; // ← MUST come before addPageBreak()
      this.addPageBreak();
    }
  }

  // ── Section helpers ───────────────────────────────────────────────────────

  /**
   * Section header bar — infrastructure draw.
   * Does NOT set isCurrentPageDirty so a section with no following fields
   * cannot prevent an empty page from being detected.
   */
  addSection(title) {
    this.checkY(26 + this.spacing.md);
    this.y = drawSectionHeader(
      this.doc,
      title,
      this.leftMargin,
      this.y,
      this.pageWidth,
    );
  }

  addSubSection(title) {
    const textH = this.doc.heightOfString(title, {
      width: this.pageWidth,
      fontSize: SIZES.body,
    });
    this.checkY(textH + this.spacing.sm);

    const startY = this.y;
    this.doc
      .fontSize(SIZES.body)
      .font(FONTS.bold)
      .fillColor(COLORS.navyMid)
      .text(title, this.leftMargin, startY, { width: this.pageWidth });

    this.isCurrentPageDirty = true;
    this.y = startY + textH + this.spacing.sm;
  }

  // ── Field helpers ─────────────────────────────────────────────────────────

  addField(label, value, options = {}) {
    if (!value && options.skipIfEmpty !== false) return null;

    const text = String(value);
    const labelWidth = 140;
    const valueX = this.leftMargin + labelWidth + 10;
    const valueWidth = this.pageWidth - labelWidth - 10;

    const rowH =
      Math.max(
        this.doc.heightOfString(`${label}:`, {
          width: labelWidth,
          fontSize: SIZES.small,
        }),
        this.doc.heightOfString(text, {
          width: valueWidth,
          fontSize: SIZES.small,
        }),
      ) + 2;

    this.checkY(rowH + this.spacing.sm);
    const startY = this.y;

    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textMuted)
      .text(`${label}:`, this.leftMargin, startY, { width: labelWidth });

    this.doc
      .fontSize(SIZES.small)
      .font(options.bold ? FONTS.bold : FONTS.regular)
      .fillColor(options.color || COLORS.textPrimary)
      .text(text, valueX, startY, { width: valueWidth, lineBreak: true });

    this.isCurrentPageDirty = true;
    this.y = startY + rowH + this.spacing.sm;
    return text;
  }

  addStatusField(label, status) {
    const labelWidth = 140;
    const valueX = this.leftMargin + labelWidth + 10;

    this.checkY(20);
    const startY = this.y;

    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textMuted)
      .text(`${label}:`, this.leftMargin, startY, { width: labelWidth });

    drawStatusBadge(this.doc, status, valueX, startY);

    this.isCurrentPageDirty = true;
    this.y = startY + 16;
  }

  addMoneyField(label, amount, currency = "NGN") {
    const text = amount ? formatCurrency(amount, currency) : null;
    if (text) this.addField(label, text, { bold: true, color: COLORS.navy });
    return text;
  }

  addDateField(label, date) {
    return this.addField(label, formatDate(date));
  }

  addLongTextField(label, value) {
    if (!value) return null;

    const labelWidth = 140;
    const textX = this.leftMargin + labelWidth + 10;
    const textWidth = this.pageWidth - labelWidth - 10;
    const estimatedHeight = this.doc.heightOfString(value, {
      width: textWidth,
      fontSize: SIZES.small,
    });

    this.checkY(estimatedHeight + this.spacing.md);
    const startY = this.y;

    if (label) {
      this.doc
        .fontSize(SIZES.small)
        .font(FONTS.bold)
        .fillColor(COLORS.textMuted)
        .text(`${label}:`, this.leftMargin, startY, { width: labelWidth });
    }

    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textPrimary)
      .text(value, textX, startY, { width: textWidth, lineGap: 2 });

    this.isCurrentPageDirty = true;
    this.y = startY + estimatedHeight + this.spacing.md;
    return value;
  }

  addTwoColumnField(label1, val1, label2, val2) {
    const colWidth = this.pageWidth / 2; // ~257 pt each
    const labelWidth = 90;
    const valueWidth = colWidth - labelWidth - 10;
    const col2X = this.leftMargin + colWidth;

    const rowH =
      Math.max(
        this.doc.heightOfString(String(val1 ?? "—"), {
          width: valueWidth,
          fontSize: SIZES.small,
        }),
        this.doc.heightOfString(String(val2 ?? "—"), {
          width: valueWidth,
          fontSize: SIZES.small,
        }),
      ) + 2;

    this.checkY(rowH + this.spacing.sm);
    const startY = this.y;

    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textMuted)
      .text(`${label1 || ""}:`, this.leftMargin, startY, { width: labelWidth });
    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textPrimary)
      .text(String(val1 ?? "—"), this.leftMargin + labelWidth, startY, {
        width: valueWidth,
        lineBreak: true,
      });

    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textMuted)
      .text(`${label2 || ""}:`, col2X, startY, { width: labelWidth });
    this.doc
      .fontSize(SIZES.small)
      .font(FONTS.regular)
      .fillColor(COLORS.textPrimary)
      .text(String(val2 ?? "—"), col2X + labelWidth, startY, {
        width: valueWidth,
        lineBreak: true,
      });

    this.isCurrentPageDirty = true;
    this.y = startY + rowH + this.spacing.sm;
  }

  addTable(headers, rows, options = {}) {
    const { colWidths = [] } = options;
    const defaultW = this.pageWidth / headers.length;
    const rowH = 18;

    this.checkY(26);
    this.y = drawSectionHeader(
      this.doc,
      options.title || "Details",
      this.leftMargin,
      this.y,
      this.pageWidth,
    );

    // Table header bar
    this.doc
      .rect(this.leftMargin, this.y, this.pageWidth, 20)
      .fill(COLORS.navy);
    let x = this.leftMargin + 5;
    headers.forEach((h, i) => {
      const w = colWidths[i] || defaultW;
      this.doc
        .fillColor(COLORS.white)
        .fontSize(SIZES.small)
        .font(FONTS.bold)
        .text(h, x, this.y + 5, { width: w - 10 });
      x += w;
    });
    this.y += 24;

    // Data rows
    rows.forEach((row, idx) => {
      this.checkY(rowH + this.spacing.sm);
      if (idx % 2 === 1) {
        this.doc
          .rect(this.leftMargin, this.y - 2, this.pageWidth, rowH)
          .fill(COLORS.gray50);
      }
      x = this.leftMargin + 5;
      row.forEach((cell, colIdx) => {
        const w = colWidths[colIdx] || defaultW;
        const isFirst = colIdx === 0;
        const { fg } = getStatusColors(isFirst ? cell : null);
        this.doc
          .fillColor(isFirst ? fg : COLORS.textPrimary)
          .fontSize(SIZES.small)
          .font(isFirst ? FONTS.bold : FONTS.regular)
          .text(String(cell ?? "—").substring(0, 30), x, this.y + 2, {
            width: w - 10,
          });
        x += w;
      });
      this.y += rowH;
    });

    this.isCurrentPageDirty = true;
    this.y += this.spacing.md;
  }

  addTimeline(items) {
    items.forEach((item, idx) => {
      const descH = item.description
        ? this.doc.heightOfString(item.description, { width: 370 })
        : 0;
      this.checkY(20 + descH);

      const startY = this.y;
      const { fg } = getStatusColors(item.status);
      const circleX = this.leftMargin + 8;
      const circleY = startY + 5;

      if (idx < items.length - 1) {
        this.doc
          .moveTo(circleX, circleY + 5)
          .lineTo(circleX, circleY + 18)
          .lineWidth(1)
          .strokeColor(COLORS.gray300)
          .stroke();
      }

      this.doc.circle(circleX, circleY, 3.5).fill(fg);
      this.doc
        .fontSize(SIZES.body)
        .font(FONTS.bold)
        .fillColor(COLORS.textPrimary)
        .text(item.title, this.leftMargin + 18, startY, { width: 320 });

      if (item.date) {
        this.doc
          .fontSize(SIZES.small)
          .font(FONTS.regular)
          .fillColor(COLORS.textMuted)
          .text(formatDate(item.date), 390, startY, {
            width: 110,
            align: "right",
          });
      }

      this.y += 14;

      if (item.description) {
        this.doc
          .fontSize(SIZES.small)
          .font(FONTS.regular)
          .fillColor(COLORS.textSecondary)
          .text(item.description, this.leftMargin + 18, this.y, { width: 370 });
        this.y += descH + this.spacing.sm;
      }

      this.isCurrentPageDirty = true;
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────

  _drawFooterOnPage(pageNumber, totalPages) {
    const footerY = this.doc.page.height - 30;

    this.doc
      .moveTo(this.leftMargin, footerY - 8)
      .lineTo(this.leftMargin + this.pageWidth, footerY - 8)
      .lineWidth(0.4)
      .strokeColor(COLORS.gray200)
      .stroke();

    // Centre: firm + timestamp
    this.doc
      .fontSize(SIZES.micro)
      .fillColor(COLORS.textMuted)
      .font(FONTS.regular)
      .text(
        `${this.options.firmName || "Law Firm"}  ·  ${formatDateTime(new Date())}`,
        this.leftMargin,
        footerY,
        { align: "center", width: this.pageWidth },
      );

    // Right: page counter
    this.doc
      .fontSize(SIZES.micro)
      .fillColor(COLORS.textMuted)
      .font(FONTS.regular)
      .text(`Page ${pageNumber} of ${totalPages}`, this.leftMargin, footerY, {
        align: "right",
        width: this.pageWidth,
      });
  }

  // ── Finalize ──────────────────────────────────────────────────────────────

  /**
   * Stamps footers and ends the document.
   *
   * isCurrentPageDirty after all content writes:
   *   true  → last buffered page has content → totalPages = bufferedCount
   *   false → last buffered page is phantom  → totalPages = bufferedCount - 1
   *
   * No pdf-lib, no Python, no execSync.
   */
  async generate() {
    const range = this.doc.bufferedPageRange();
    const bufferedCount = range.count;

    const totalPages = this.isCurrentPageDirty
      ? bufferedCount
      : Math.max(1, bufferedCount - 1);

    for (let i = 0; i < totalPages; i++) {
      this.doc.switchToPage(range.start + i);
      this._drawFooterOnPage(i + 1, totalPages);
    }

    // Park on last real page before ending
    this.doc.switchToPage(range.start + totalPages - 1);

    return new Promise((resolve, reject) => {
      this.doc.on("end", () => {
        try {
          const pdfBuffer = Buffer.concat(this.chunks);
          const filename = getFilename(this.outputPath);

          ensureOutputDir(this.outputPath);
          fs.writeFileSync(this.outputPath, pdfBuffer);

          this.res.setHeader("Content-Type", "application/pdf");
          this.res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`,
          );
          this.res.setHeader("Content-Length", pdfBuffer.length);
          this.res.end(pdfBuffer);

          console.log(`✅ PDF generated (${totalPages} pages): ${filename}`);
          resolve(this.outputPath);
        } catch (err) {
          reject(err);
        }
      });
      this.doc.on("error", reject);
      this.doc.end();
    });
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
