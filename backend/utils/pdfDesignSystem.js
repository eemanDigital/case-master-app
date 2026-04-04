"use strict";

/**
 * pdfDesignSystem.js
 * Shared design tokens, utilities, and helpers for all PDF generators.
 * Single source of truth — import this in every generator.
 */

const fs = require("fs");
const path = require("path");

// ─── Design Tokens ──────────────────────────────────────────────────────────

const COLORS = {
  // Brand
  navy: "#0f2744",
  navyMid: "#1a3a5c",
  navyLight: "#d6e4f0",
  navyUltraLight: "#eef4fa",

  // Accent
  gold: "#c8972a",
  goldLight: "#fdf3dc",

  // Semantic
  success: "#0d7c59",
  successLight: "#d4f0e6",
  warning: "#b45309",
  warningLight: "#fef3c7",
  danger: "#b91c1c",
  dangerLight: "#fee2e2",
  info: "#1d4ed8",
  infoLight: "#dbeafe",

  // Neutrals
  white: "#ffffff",
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray200: "#e2e8f0",
  gray300: "#cbd5e1",
  gray400: "#94a3b8",
  gray500: "#64748b",
  gray700: "#334155",
  gray900: "#0f172a",

  // Text
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
};

const FONTS = {
  regular: "Helvetica",
  bold: "Helvetica-Bold",
  oblique: "Helvetica-Oblique",
};

const SIZES = {
  h1: 16,
  h2: 12,
  h3: 10,
  body: 8,
  small: 7,
  micro: 6.5,
};

// ─── Status Helpers ──────────────────────────────────────────────────────────

function getStatusColors(status) {
  if (!status) return { fg: COLORS.gray500, bg: COLORS.gray100 };
  const s = status.toLowerCase();
  if (
    [
      "completed",
      "active",
      "registered",
      "agreed",
      "approved",
      "paid",
      "full",
    ].includes(s)
  )
    return { fg: COLORS.success, bg: COLORS.successLight };
  if (["pending", "in-progress", "processing", "partial", "draft"].includes(s))
    return { fg: COLORS.info, bg: COLORS.infoLight };
  if (
    [
      "expired",
      "rejected",
      "terminated",
      "disputed",
      "overdue",
      "cancelled",
    ].includes(s)
  )
    return { fg: COLORS.danger, bg: COLORS.dangerLight };
  if (["executed", "sent", "issued"].includes(s))
    return { fg: COLORS.warning, bg: COLORS.warningLight };
  return { fg: COLORS.gray700, bg: COLORS.gray100 };
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatCurrency(amount, currency = "NGN") {
  const num = Number(amount || 0);
  return `${currency} ${num.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page Helpers ────────────────────────────────────────────────────────────

/**
 * Returns correct 1-based current page number.
 * bufferedPageRange().start is the first buffered page index (0-based);
 * adding bufferedPageRange().count gives pages rendered so far.
 */
function getCurrentPageNumber(doc) {
  const range = doc.bufferedPageRange();
  return range.start + range.count;
}

function ensureOutputDir(outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFilename(outputPath) {
  return path.basename(outputPath);
}

// ─── Stream Finalizer ────────────────────────────────────────────────────────

/**
 * Ends the PDFDocument, streams buffer to res, and optionally saves to disk.
 */
function finalizePdf(doc, chunks, res, outputPath) {
  return new Promise((resolve, reject) => {
    doc.end();
    doc.on("end", () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const filename = getFilename(outputPath);

        // Optionally persist to disk
        ensureOutputDir(outputPath);
        fs.writeFileSync(outputPath, pdfBuffer);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.setHeader("Content-Length", pdfBuffer.length);
        res.end(pdfBuffer);

        console.log(`✅ PDF generated: ${filename}`);
        resolve(outputPath);
      } catch (err) {
        reject(err);
      }
    });
    doc.on("error", reject);
  });
}

module.exports = {
  COLORS,
  FONTS,
  SIZES,
  getStatusColors,
  formatCurrency,
  formatDate,
  formatDateTime,
  getCurrentPageNumber,
  ensureOutputDir,
  getFilename,
  finalizePdf,
};
