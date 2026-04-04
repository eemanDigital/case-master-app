/**
 * generateCauseListPdf.js - Cause List PDF generator using PDFKit
 * No Chrome/Puppeteer required
 */
"use strict";

const PDFDocument = require("pdfkit");

const COLORS = {
  primary: "#1a237e",
  primaryLight: "#e8eaf6",
  secondary: "#666666",
  gray100: "#f9f9f9",
  gray300: "#dddddd",
  white: "#ffffff",
};

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

async function generateCauseListPdf(data, res, outputPath) {
  const { hearings, firm, periodName, startDate, endDate, totalHearings } = data;

  const chunks = [];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 50, left: 40, right: 40 },
    info: { Title: `Cause List - ${periodName}`, Author: firm?.name || "Law Firm" },
  });

  doc.on("data", (chunk) => chunks.push(chunk));

  const pageWidth = doc.page.width - 80;
  let y = 50;

  doc.rect(0, 0, doc.page.width, 60).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(16).font("Helvetica-Bold")
    .text("CAUSE LIST", 40, 15, { align: "center", width: pageWidth });
  doc.fontSize(10).font("Helvetica")
    .text(`${firm?.name || "Law Firm"}`, 40, 38, { align: "center", width: pageWidth });
  y = 75;

  doc.rect(40, y, pageWidth, 35).fill(COLORS.primaryLight);
  doc.fillColor(COLORS.primary).fontSize(11).font("Helvetica-Bold")
    .text(periodName || "Upcoming Hearings", 45, y + 5, { width: pageWidth - 10, align: "center" });
  doc.fontSize(8).fillColor(COLORS.secondary).font("Helvetica")
    .text(`${startDate} - ${endDate}`, 45, y + 22, { width: pageWidth - 10, align: "center" });
  y += 45;

  doc.fontSize(9).fillColor(COLORS.secondary).font("Helvetica")
    .text(`Total Hearings: ${totalHearings || hearings?.length || 0}`, 40, y, { align: "center", width: pageWidth });
  y += 20;

  doc.rect(40, y, pageWidth, 18).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(7).font("Helvetica-Bold");
  doc.text("S/N", 42, y + 5, { width: 25 });
  doc.text("Date", 70, y + 5, { width: 55 });
  doc.text("Day", 128, y + 5, { width: 45 });
  doc.text("Case/Matter No.", 175, y + 5, { width: 80 });
  doc.text("Case Title", 258, y + 5, { width: 100 });
  doc.text("Court", 360, y + 5, { width: 60 });
  doc.text("Purpose", 422, y + 5, { width: 80 });
  doc.text("Lawyer", 505, y + 5, { width: 55 });
  y += 22;

  hearings?.forEach((hearing, idx) => {
    if (y > doc.page.height - 50) {
      const pageNum = doc.bufferedPageRange().start + 1;
      doc.fontSize(7).fillColor(COLORS.secondary)
        .text(`Page ${pageNum} | ${firm?.name || "Law Firm"} | Generated: ${new Date().toLocaleDateString("en-GB")}`,
          40, doc.page.height - 30, { align: "center", width: pageWidth });
      doc.addPage();
      y = 40;
      doc.rect(0, 0, doc.page.width, 40).fill(COLORS.primary);
      doc.fillColor(COLORS.white).fontSize(12).font("Helvetica-Bold")
        .text("CAUSE LIST (Continued)", 40, 12, { align: "center", width: pageWidth });
      y = 55;
      doc.rect(40, y, pageWidth, 18).fill(COLORS.primary);
      doc.fillColor(COLORS.white).fontSize(7).font("Helvetica-Bold");
      doc.text("S/N", 42, y + 5, { width: 25 });
      doc.text("Date", 70, y + 5, { width: 55 });
      doc.text("Day", 128, y + 5, { width: 45 });
      doc.text("Case/Matter No.", 175, y + 5, { width: 80 });
      doc.text("Case Title", 258, y + 5, { width: 100 });
      doc.text("Court", 360, y + 5, { width: 60 });
      doc.text("Purpose", 422, y + 5, { width: 80 });
      doc.text("Lawyer", 505, y + 5, { width: 55 });
      y += 22;
    }

    const bgColor = idx % 2 === 0 ? COLORS.white : COLORS.gray100;
    doc.rect(40, y - 2, pageWidth, 18).fill(bgColor);

    const lawyerName = hearing.lawyerPresent?.map(l => `${l.firstName?.[0] || ""}. ${l.lastName || ""}`).join(", ") || "N/A";

    doc.fillColor("#333333").fontSize(7).font("Helvetica")
      .text(String(idx + 1), 42, y + 1, { width: 25 })
      .text(formatDate(hearing.hearingDate), 70, y + 1, { width: 55 })
      .text(hearing.hearingDay || "", 128, y + 1, { width: 45 })
      .text(hearing.suitNo || hearing.matterNumber || "N/A", 175, y + 1, { width: 80 })
      .text((hearing.title || "N/A").substring(0, 25), 258, y + 1, { width: 100 })
      .text(hearing.courtName || "N/A", 360, y + 1, { width: 60 })
      .text((hearing.purpose || "N/A").substring(0, 15), 422, y + 1, { width: 80 })
      .text(lawyerName.substring(0, 15), 505, y + 1, { width: 55 });
    y += 18;
  });

  const pageNum = doc.bufferedPageRange().start + 1;
  doc.fontSize(7).fillColor(COLORS.secondary)
    .text(`Page ${pageNum} | ${firm?.name || "Law Firm"} | Generated: ${new Date().toLocaleDateString("en-GB")}`,
      40, doc.page.height - 30, { align: "center", width: pageWidth });

  return new Promise((resolve, reject) => {
    doc.end();
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${outputPath.split("/").pop()}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
      console.log(`Cause List PDF generated: ${outputPath.split("/").pop()}`);
      resolve(outputPath);
    });
    doc.on("error", reject);
  });
}

module.exports = { generateCauseListPdf };
