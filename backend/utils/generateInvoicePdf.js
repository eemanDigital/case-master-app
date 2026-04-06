"use strict";

/**
 * generateInvoicePdf.js
 * Premium invoice, receipt, and bill-of-charges PDF generator.
 * Uses PDFKit — no Chrome/Puppeteer required.
 *
 * FEATURES:
 *  - Professional invoice layout with firm branding
 *  - Two-column firm/client header
 *  - Services and disbursements table
 *  - Totals with discount, VAT, previous balance
 *  - Payment history
 *  - Bank details for payment
 *  - Notes and terms
 *  - Professional signature block
 *  - Multi-page support with headers/footers
 */

const PDFDocument = require("pdfkit");
const {
  COLORS, FONTS, SIZES,
  getStatusColors,
  formatCurrency, formatDate, formatDateTime,
  getCurrentPageNumber, finalizePdf,
} = require("./pdfDesignSystem");

// ─── Shared Drawing Primitives ───────────────────────────────────────────────

function drawFooter(doc, firm, pageWidth, invoiceNumber) {
  const pageNum = getCurrentPageNumber(doc);
  const leftMargin = 40;
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
      `${firm?.name || "Law Firm"}  ·  Invoice ${invoiceNumber}  ·  Page ${pageNum}`,
      leftMargin, footerY,
      { align: "center", width: pageWidth },
    );
}

function drawStatusBadge(doc, status, x, y) {
  const { fg, bg } = getStatusColors(status);
  const label = String(status || "N/A").toUpperCase();
  const badgeW = doc.widthOfString(label, { fontSize: SIZES.micro }) + 10;
  doc.roundedRect(x, y - 1, badgeW, 12, 2).fill(bg);
  doc.fillColor(fg).fontSize(SIZES.micro).font(FONTS.bold).text(label, x + 5, y + 1);
  return badgeW;
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

function numberToWords(num) {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  if (num === 0) return "Zero Naira Only";
  
  const naira = Math.floor(num);
  const kobo = Math.round((num - naira) * 100);
  
  const convertBelowThousand = (n) => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
    return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertBelowThousand(n % 100) : "");
  };
  
  let result = "";
  
  if (naira >= 1000000000) {
    const billions = Math.floor(naira / 1000000000);
    result += convertBelowThousand(billions) + " Billion ";
    if (naira % 1000000000 !== 0) {
      result += numberToWords(naira % 1000000000);
    }
    return result.trim() + " Naira" + (kobo > 0 ? " and " + convertBelowThousand(kobo) + " Kobo" : "") + " Only";
  }
  
  if (naira >= 1000000) {
    const millions = Math.floor(naira / 1000000);
    result += convertBelowThousand(millions) + " Million ";
    if (naira % 1000000 !== 0) {
      result += convertBelowThousand(naira % 1000000);
    }
  } else if (naira >= 1000) {
    const thousands = Math.floor(naira / 1000);
    result += convertBelowThousand(thousands) + " Thousand ";
    if (naira % 1000 !== 0) {
      result += convertBelowThousand(naira % 1000);
    }
  } else {
    result += convertBelowThousand(naira);
  }
  
  result += " Naira";
  if (kobo > 0) {
    result += " and " + convertBelowThousand(kobo) + " Kobo";
  }
  result += " Only";
  
  return result;
}

// ─── INVOICE ─────────────────────────────────────────────────────────────────

async function generateInvoicePdf(data, res, outputPath) {
  const { invoice, firm } = data;

  const chunks = [];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
    info: {
      Title: `Invoice ${invoice?.invoiceNumber || ""}`,
      Author: firm?.name || "Law Firm",
    },
  });

  doc.on("data", (c) => chunks.push(c));

  const leftMargin = 40;
  const pageWidth = doc.page.width - 80;
  const bottomGuard = doc.page.height - 55;
  let y = 0;

  function addHeader() {
    doc.rect(0, 0, doc.page.width, 78).fill(COLORS.navy);

    doc.fillColor(COLORS.white).fontSize(SIZES.h1).font(FONTS.bold)
      .text(firm?.name || "Law Firm", leftMargin, 14, { width: 300 });

    doc.rect(leftMargin, 36, 60, 1.5).fill(COLORS.gold);

    const headerSub = [firm?.address, firm?.city, firm?.state].filter(Boolean).join(", ");
    if (headerSub) {
      doc.fontSize(SIZES.micro).fillColor(COLORS.navyLight).font(FONTS.regular)
        .text(headerSub, leftMargin, 40, { width: 300 });
    }

    doc.fontSize(SIZES.micro).fillColor(COLORS.gold).font(FONTS.bold)
      .text("INVOICE", 400, 16, { width: 155, align: "right" });
    doc.fontSize(18).fillColor(COLORS.white).font(FONTS.bold)
      .text(`#${invoice?.invoiceNumber || "N/A"}`, 400, 28, { width: 155, align: "right" });

    y = 90;
  }

  function addPageBreak() {
    drawFooter(doc, firm, pageWidth, invoice?.invoiceNumber || "N/A");
    doc.addPage();
    addHeader();
  }

  function checkY(needed = 50) {
    if (y + needed > bottomGuard) addPageBreak();
  }

  addHeader();

  // ── Invoice Title ──
  if (invoice?.title) {
    checkY(20);
    doc.fontSize(SIZES.h1 + 2).font(FONTS.bold).fillColor(COLORS.navy)
      .text(invoice.title, leftMargin, y, { width: pageWidth });
    y += 18;
  }

  // ── Firm + Client two-column block ──
  const col1X = leftMargin;
  const col2X = 310;
  const colW  = 200;

  doc.fontSize(SIZES.micro).font(FONTS.bold).fillColor(COLORS.gold)
    .text("FROM", col1X, y)
    .text("BILL TO", col2X, y);
  y += 11;

  drawHRule(doc, col1X, y, 245, COLORS.navyLight);
  drawHRule(doc, col2X, y, colW, COLORS.navyLight);
  y += 8;

  let firmY = y;
  doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.textPrimary)
    .text(firm?.name || "Law Firm", col1X, firmY, { width: 245 });
  firmY += 12;
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary);
  const firmLines = [
    firm?.address, [firm?.city, firm?.state].filter(Boolean).join(", "),
    firm?.country, firm?.phone && `Tel: ${firm.phone}`,
    firm?.email && `Email: ${firm.email}`,
    firm?.website && `Web: ${firm.website}`,
    firm?.cacNumber && `CAC Reg: ${firm.cacNumber}`,
    firm?.taxId && `Tax ID: ${firm.taxId}`,
  ].filter(Boolean);
  firmLines.forEach((line) => {
    doc.text(line, col1X, firmY, { width: 245 });
    firmY += 11;
  });

  let clientY = y;
  const clientName = invoice?.client
    ? `${invoice.client.firstName || ""} ${invoice.client.lastName || ""}`.trim()
    : "N/A";
  doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.textPrimary)
    .text(clientName, col2X, clientY, { width: colW });
  clientY += 12;
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary);
  const clientLines = [
    invoice?.client?.companyName,
    invoice?.client?.address,
    invoice?.client?.email,
    invoice?.client?.phone,
  ].filter(Boolean);
  clientLines.forEach((line) => {
    doc.text(line, col2X, clientY, { width: colW });
    clientY += 11;
  });

  y = Math.max(firmY, clientY) + 18;

  // ── Meta Box ──
  checkY(44);
  doc.rect(leftMargin, y, pageWidth, 38).fill(COLORS.navyUltraLight);
  doc.rect(leftMargin, y, pageWidth, 38).lineWidth(0.5).strokeColor(COLORS.navyLight).stroke();

  const metaY = y + 9;
  const metaSegW = pageWidth / 4;
  const metaItems = [
    ["Issue Date", formatDate(invoice?.issueDate || invoice?.createdAt)],
    ["Due Date", formatDate(invoice?.dueDate)],
    ["Status", invoice?.status || "draft"],
    ["Matter", invoice?.matter?.matterNumber || invoice?.matterReference || "N/A"],
  ];
  metaItems.forEach(([label, val], i) => {
    const mx = leftMargin + 10 + i * metaSegW;
    doc.fontSize(SIZES.micro).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text(label, mx, metaY);
    if (label === "Status") {
      drawStatusBadge(doc, val, mx, metaY + 11);
    } else {
      doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.textPrimary)
        .text(val, mx, metaY + 11);
    }
  });
  y += 52;

  // ── Billing Period ──
  if (invoice?.billingPeriodStart || invoice?.billingPeriodEnd) {
    checkY(24);
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text("Billing Period:", leftMargin, y);
    doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.textPrimary)
      .text(
        `${formatDate(invoice.billingPeriodStart) || "N/A"} - ${formatDate(invoice.billingPeriodEnd) || "N/A"}`,
        leftMargin + 80, y
      );
    y += 18;
  }

  // ── Services Table ──
  checkY(50);
  y = drawSectionHeader(doc, "Professional Services", leftMargin, y, pageWidth);

  doc.rect(leftMargin, y, pageWidth, 20).fill(COLORS.navy);
  const tCols = { desc: leftMargin + 6, date: 290, qty: 330, rate: 370, amt: 450 };
  doc.fillColor(COLORS.white).fontSize(SIZES.small).font(FONTS.bold);
  doc.text("Description", tCols.desc, y + 6, { width: 220 });
  doc.text("Date", tCols.date, y + 6, { width: 35 });
  doc.text("Hrs/Qty", tCols.qty, y + 6, { width: 35 });
  doc.text("Rate", tCols.rate, y + 6, { width: 75 });
  doc.text("Amount", tCols.amt, y + 6, { width: 100, align: "right" });
  y += 24;

  const services = invoice?.services || [];
  services.forEach((item, idx) => {
    checkY(22);
    if (idx % 2 === 1) doc.rect(leftMargin, y - 2, pageWidth, 18).fill(COLORS.gray50);
    
    const categoryLabel = item.category ? `[${item.category.replace(/_/g, " ").toUpperCase()}] ` : "";
    doc.fillColor(COLORS.textPrimary).fontSize(SIZES.small).font(FONTS.regular)
      .text(categoryLabel + (item.description || "Service"), tCols.desc, y + 1, { width: 220 });
    doc.text(formatDate(item.date), tCols.date, y + 1, { width: 35 });
    doc.text(String(item.hours || item.quantity || "1"), tCols.qty, y + 1, { width: 35 });
    doc.text(formatCurrency(item.rate || 0), tCols.rate, y + 1, { width: 75 });
    doc.font(FONTS.bold)
      .text(formatCurrency(item.amount || 0), tCols.amt, y + 1, { width: 100, align: "right" });
    y += 18;
  });

  // ── Disbursements Table ──
  const expenses = invoice?.expenses || [];
  if (expenses.length > 0) {
    y += 10;
    checkY(40);
    y = drawSectionHeader(doc, "Disbursements", leftMargin, y, pageWidth);

    doc.rect(leftMargin, y, pageWidth, 20).fill(COLORS.navy);
    doc.fillColor(COLORS.white).fontSize(SIZES.small).font(FONTS.bold);
    doc.text("Description", tCols.desc, y + 6, { width: 280 });
    doc.text("Date", 290, y + 6, { width: 60 });
    doc.text("Amount", tCols.amt, y + 6, { width: 100, align: "right" });
    y += 24;

    expenses.forEach((item, idx) => {
      checkY(22);
      if (idx % 2 === 1) doc.rect(leftMargin, y - 2, pageWidth, 18).fill(COLORS.gray50);
      const expenseCategory = item.category ? `[${item.category.replace(/_/g, " ").toUpperCase()}] ` : "";
      doc.fillColor(COLORS.textPrimary).fontSize(SIZES.small).font(FONTS.regular)
        .text(expenseCategory + (item.description || "Expense"), tCols.desc, y + 1, { width: 280 });
      doc.text(formatDate(item.date), 290, y + 1, { width: 60 });
      doc.font(FONTS.bold)
        .text(formatCurrency(item.amount || 0), tCols.amt, y + 1, { width: 100, align: "right" });
      y += 18;
    });
  }

  drawHRule(doc, leftMargin, y, pageWidth, COLORS.gray200);
  y += 12;

  // ── Totals Block ──
  checkY(110);
  const totX   = 335;
  const totW   = pageWidth - 295;
  const totLW  = 120;
  const totVX  = totX + totLW;
  const totVW  = totW - totLW - 4;

  function totRow(label, value, { bold = false, colorFg = COLORS.textSecondary, bg = null } = {}) {
    if (bg) doc.rect(totX, y, totW, 18).fill(bg);
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(colorFg)
      .text(label, totX + 6, y + 4, { width: totLW });
    doc.font(bold ? FONTS.bold : FONTS.regular).fillColor(bold ? COLORS.textPrimary : colorFg)
      .text(value, totVX, y + 4, { width: totVW, align: "right" });
    y += 20;
  }

  totRow("Services Total", formatCurrency(invoice?.currentCharges?.services || 0), { bg: COLORS.gray50 });
  totRow("Disbursements", formatCurrency(invoice?.currentCharges?.expenses || 0), { bg: COLORS.gray50 });
  
  const subtotal = (invoice?.currentCharges?.subtotal || invoice?.subtotal || 0);
  totRow("Subtotal", formatCurrency(subtotal));

  if (invoice?.discount > 0) {
    const discLabel = `Discount${invoice.discountType === "percentage" ? ` (${invoice.discount}%)` : ""}`;
    totRow(discLabel, `−${formatCurrency(invoice.currentCharges?.discount || 0)}`, { colorFg: COLORS.success });
    if (invoice.discountReason) {
      doc.fontSize(SIZES.micro).font(FONTS.italic).fillColor(COLORS.textMuted)
        .text(`Reason: ${invoice.discountReason}`, totX + 6, y - 14, { width: totLW + totVW });
    }
  }

  if (invoice?.taxRate > 0) {
    totRow(`VAT (${invoice.taxRate}%)`, formatCurrency(invoice?.currentCharges?.tax || invoice?.taxAmount || 0));
  }

  if (invoice?.previousBalance > 0) {
    totRow("Previous Balance", formatCurrency(invoice.previousBalance), { colorFg: COLORS.warning });
  }

  // Grand total — gold bar
  checkY(28);
  doc.rect(totX, y, totW, 26).fill(COLORS.gold);
  doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.navy)
    .text("TOTAL DUE", totX + 6, y + 7, { width: totLW });
  doc.fontSize(SIZES.h2).font(FONTS.bold).fillColor(COLORS.navy)
    .text(formatCurrency(invoice?.currentCharges?.total || invoice?.totalAmount || 0), totVX - 10, y + 5, { width: totVW + 10, align: "right" });
  y += 32;

  // Amount in words
  const totalAmount = invoice?.currentCharges?.total || invoice?.totalAmount || 0;
  if (totalAmount > 0) {
    checkY(30);
    doc.rect(leftMargin, y, pageWidth, 22).fill(COLORS.goldLight);
    doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.navy)
      .text(`Amount in Words: ${numberToWords(totalAmount)}`, leftMargin + 10, y + 6, { width: pageWidth - 20 });
    y += 32;
  }

  // Amount paid + balance outstanding
  if ((invoice?.amountPaid || 0) > 0) {
    checkY(20);
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.success)
      .text(`Amount Paid:  ${formatCurrency(invoice.amountPaid)}`, totX + 6, y);
    y += 16;
  }

  const balance = invoice?.balance || 0;
  if (balance > 0 && balance < totalAmount) {
    checkY(24);
    doc.rect(totX, y, totW, 20).fill(COLORS.warningLight);
    doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.warning)
      .text("Balance Outstanding", totX + 6, y + 5, { width: totLW });
    doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.warning)
      .text(formatCurrency(balance), totVX, y + 4, { width: totVW, align: "right" });
    y += 26;
  }

  // ── Payment History ──
  const payments = invoice?.payments || [];
  if (payments.length > 0) {
    y += 16;
    checkY(60);
    y = drawSectionHeader(doc, "Payment History", leftMargin, y, pageWidth);

    doc.rect(leftMargin, y, pageWidth, 20).fill(COLORS.navy);
    doc.fillColor(COLORS.white).fontSize(SIZES.small).font(FONTS.bold);
    doc.text("Date", leftMargin + 6, y + 6, { width: 90 });
    doc.text("Reference", 160, y + 6, { width: 120 });
    doc.text("Method", 284, y + 6, { width: 90 });
    doc.text("Amount", 400, y + 6, { width: 110, align: "right" });
    y += 24;

    payments.forEach((pmt, idx) => {
      checkY(22);
      if (idx % 2 === 1) doc.rect(leftMargin, y - 2, pageWidth, 18).fill(COLORS.gray50);
      doc.fillColor(COLORS.textPrimary).fontSize(SIZES.small).font(FONTS.regular)
        .text(formatDate(pmt.paymentDate), leftMargin + 6, y + 1, { width: 90 })
        .text(pmt.reference || pmt.paymentReference || "N/A", 160, y + 1, { width: 120 })
        .text((pmt.paymentMethod || "N/A").toUpperCase(), 284, y + 1, { width: 90 });
      doc.fillColor(COLORS.success).font(FONTS.bold)
        .text(formatCurrency(pmt.amount), 400, y + 1, { width: 110, align: "right" });
      y += 18;
    });
    drawHRule(doc, leftMargin, y, pageWidth);
    y += 10;
  }

  // ── Bank Details ──
  if (firm?.bankDetails) {
    y += 14;
    checkY(70);
    y = drawSectionHeader(doc, "Payment Details", leftMargin, y, pageWidth);
    
    const bankLines = [
      firm.bankDetails.bankName && `Bank: ${firm.bankDetails.bankName}`,
      firm.bankDetails.accountName && `Account Name: ${firm.bankDetails.accountName}`,
      firm.bankDetails.accountNumber && `Account Number: ${firm.bankDetails.accountNumber}`,
      firm.bankDetails.sortCode && `Sort Code: ${firm.bankDetails.sortCode}`,
      firm.bankDetails.swiftCode && `SWIFT/BIC: ${firm.bankDetails.swiftCode}`,
    ].filter(Boolean);
    
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary);
    bankLines.forEach((line) => {
      doc.text(line, leftMargin, y, { width: 280 });
      y += 11;
    });
    y += 6;
  }

  // ── Notes ──
  if (invoice?.notes) {
    y += 14;
    checkY(55);
    y = drawSectionHeader(doc, "Notes", leftMargin, y, pageWidth);
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
      .text(invoice.notes, leftMargin, y, { width: pageWidth });
    y += doc.heightOfString(invoice.notes, { width: pageWidth }) + 10;
  }

  // ── Terms ──
  y += 14;
  checkY(55);
  y = drawSectionHeader(doc, "Terms & Conditions", leftMargin, y, pageWidth);
  const terms = invoice?.paymentTerms || firm?.settings?.defaultPaymentTerms
    || "Payment is due within the period stated above. Please quote invoice number as payment reference. Late payments may attract interest charges per our engagement letter.";
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
    .text(terms, leftMargin, y, { width: pageWidth });
  y += doc.heightOfString(terms, { width: pageWidth }) + 20;

  // ── Signature & Authorization ──
  checkY(75);
  y += 10;
  
  // Attorney/Preparer info
  if (invoice?.billingAttorney || invoice?.timekeeper) {
    const preparerName = invoice.billingAttorney?.firstName 
      ? `${invoice.billingAttorney.firstName} ${invoice.billingAttorney.lastName}`
      : invoice.timekeeper?.firstName
        ? `${invoice.timekeeper.firstName} ${invoice.timekeeper.lastName}`
        : firm?.signatureName;
    
    const preparerTitle = invoice.billingAttorney?.position 
      || invoice.timekeeper?.position 
      || firm?.signatoryTitle 
      || "Attorney";
      
    if (preparerName) {
      doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.textPrimary)
        .text(preparerName, leftMargin, y);
      y += 12;
      doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
        .text(preparerTitle, leftMargin, y);
      y += 24;
    }
  }
  
  // Signature line
  drawHRule(doc, leftMargin, y, 180, COLORS.gray400);
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
    .text("Authorized Signature", leftMargin, y + 5);
  
  if (firm?.signatoryLicenseNumber) {
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text(`SAN/License: ${firm.signatoryLicenseNumber}`, leftMargin, y + 40);
  }

  drawFooter(doc, firm, pageWidth, invoice?.invoiceNumber || "N/A");

  return finalizePdf(doc, chunks, res, outputPath);
}

// ─── RECEIPT ─────────────────────────────────────────────────────────────────

async function generateReceiptPdf(data, res, outputPath) {
  const { receipt, firm } = data;

  const chunks = [];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
    info: {
      Title: `Receipt ${receipt?.receiptNumber || ""}`,
      Author: firm?.name || "Law Firm",
    },
  });

  doc.on("data", (c) => chunks.push(c));

  const leftMargin = 40;
  const pageWidth  = doc.page.width - 80;
  const bottomGuard = doc.page.height - 55;
  let y = 0;

  function addHeader() {
    doc.rect(0, 0, doc.page.width, 78).fill(COLORS.success);

    doc.fillColor(COLORS.white).fontSize(SIZES.h1).font(FONTS.bold)
      .text(firm?.name || "Law Firm", leftMargin, 14, { width: 300 });
    doc.rect(leftMargin, 36, 60, 1.5).fill(COLORS.white).fillOpacity(0.5);
    doc.fillOpacity(1);

    doc.fontSize(SIZES.micro).fillColor(COLORS.white).font(FONTS.bold)
      .text("PAYMENT RECEIPT", leftMargin, 41);

    doc.fontSize(SIZES.micro).fillColor(COLORS.white).font(FONTS.regular)
      .text("RECEIPT NO.", 400, 16, { width: 155, align: "right" });
    doc.fontSize(16).fillColor(COLORS.white).font(FONTS.bold)
      .text(`#${receipt?.receiptNumber || "N/A"}`, 400, 28, { width: 155, align: "right" });

    y = 90;
  }

  function addPageBreak() {
    drawFooter(doc, firm, pageWidth, receipt?.receiptNumber || "N/A");
    doc.addPage();
    addHeader();
  }

  function checkY(needed = 50) {
    if (y + needed > bottomGuard) addPageBreak();
  }

  addHeader();

  // ── Firm + Client two-column ──
  doc.fontSize(SIZES.micro).font(FONTS.bold).fillColor(COLORS.white)
    .text("ISSUED BY", leftMargin, y)
    .text("RECEIVED FROM", 310, y);
  y += 11;
  drawHRule(doc, leftMargin, y, 245, "rgba(255,255,255,0.3)");
  drawHRule(doc, 310, y, 205, "rgba(255,255,255,0.3)");
  y += 8;

  let firmY   = y;
  let clientY = y;

  doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.white)
    .text(firm?.name || "Law Firm", leftMargin, firmY, { width: 245 });
  firmY += 12;
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor("rgba(255,255,255,0.8)");
  [firm?.address, [firm?.city, firm?.state].filter(Boolean).join(", "),
   firm?.phone && `Tel: ${firm.phone}`, firm?.email && `Email: ${firm.email}`]
    .filter(Boolean)
    .forEach((line) => { doc.text(line, leftMargin, firmY, { width: 245 }); firmY += 11; });

  const clientName = receipt?.client
    ? `${receipt.client.firstName || ""} ${receipt.client.lastName || ""}`.trim()
    : "N/A";
  doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.white)
    .text(clientName, 310, clientY, { width: 205 });
  clientY += 12;
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor("rgba(255,255,255,0.8)");
  [receipt?.client?.companyName, receipt?.client?.address, receipt?.client?.email]
    .filter(Boolean)
    .forEach((line) => { doc.text(line, 310, clientY, { width: 205 }); clientY += 11; });

  y = Math.max(firmY, clientY) + 18;

  // ── Receipt meta box ──
  checkY(44);
  doc.rect(leftMargin, y, pageWidth, 38).fill(COLORS.successLight);
  doc.rect(leftMargin, y, pageWidth, 38).lineWidth(0.4).strokeColor(COLORS.success).stroke();
  const metaY = y + 9;
  const seg   = pageWidth / 3;
  [
    ["Payment Date",      formatDate(receipt?.paymentDate)],
    ["Payment Reference", receipt?.reference || receipt?.paymentReference || "N/A"],
    ["Payment Method",    (receipt?.paymentMethod || "N/A").toUpperCase()],
  ].forEach(([label, val], i) => {
    const mx = leftMargin + 10 + i * seg;
    doc.fontSize(SIZES.micro).font(FONTS.regular).fillColor(COLORS.textMuted).text(label, mx, metaY);
    doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.success).text(val, mx, metaY + 11);
  });
  y += 52;

  // ── Amount Display ──
  checkY(68);
  doc.rect(leftMargin, y, pageWidth, 58).fill(COLORS.navy);
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.gold)
    .text("AMOUNT RECEIVED", leftMargin + 16, y + 12);
  doc.fontSize(24).font(FONTS.bold).fillColor(COLORS.white)
    .text(formatCurrency(receipt?.amount), leftMargin + 16, y + 26);
  y += 72;

  // ── Amount in words ──
  checkY(30);
  doc.rect(leftMargin, y, pageWidth, 24).fill(COLORS.goldLight);
  doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.navy)
    .text(`Sum of: ${numberToWords(receipt?.amount || 0)}`, leftMargin + 10, y + 7, { width: pageWidth - 20 });
  y += 36;

  // ── Invoice reference ──
  if (receipt?.invoice) {
    checkY(50);
    y = drawSectionHeader(doc, "In Respect Of", leftMargin, y, pageWidth);
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
      .text("Invoice Number:", leftMargin, y, { width: 160 });
    doc.font(FONTS.bold).fillColor(COLORS.textPrimary)
      .text(receipt.invoice.invoiceNumber || "N/A", leftMargin + 165, y);
    y += 14;
    if (receipt.invoice.totalAmount) {
      doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
        .text("Invoice Amount:", leftMargin, y, { width: 160 });
      doc.font(FONTS.bold).fillColor(COLORS.textPrimary)
        .text(formatCurrency(receipt.invoice.totalAmount), leftMargin + 165, y);
      y += 14;
    }
    if (receipt.invoice.balance !== undefined) {
      doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
        .text("Balance After:", leftMargin, y, { width: 160 });
      doc.font(FONTS.bold).fillColor(COLORS.success)
        .text(formatCurrency(receipt.invoice.balance || 0), leftMargin + 165, y);
      y += 14;
    }
    y += 8;
  }

  // ── Notes ──
  if (receipt?.notes) {
    checkY(40);
    y = drawSectionHeader(doc, "Notes", leftMargin, y, pageWidth);
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
      .text(receipt.notes, leftMargin, y, { width: pageWidth });
    y += doc.heightOfString(receipt.notes, { width: pageWidth }) + 10;
  }

  // ── Signature ──
  y += 20;
  checkY(65);
  drawHRule(doc, leftMargin, y, 160, COLORS.gray300);
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
    .text("Authorized Signatory", leftMargin, y + 5);
  if (firm?.signatureName) {
    doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.textPrimary)
      .text(firm.signatureName, leftMargin, y + 17);
  }
  if (firm?.signatoryTitle) {
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
      .text(firm.signatoryTitle, leftMargin, y + 29);
  }
  if (firm?.signatoryLicenseNumber) {
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text(`SAN/License: ${firm.signatoryLicenseNumber}`, leftMargin, y + 41);
  }

  drawFooter(doc, firm, pageWidth, receipt?.receiptNumber || "N/A");

  return finalizePdf(doc, chunks, res, outputPath);
}

// ─── BILL OF CHARGES ─────────────────────────────────────────────────────────

async function generateBillOfChargesPdf(data, res, outputPath) {
  const { invoice, firm } = data;

  const chunks = [];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
    info: {
      Title: `Bill of Charges ${invoice?.invoiceNumber || ""}`,
      Author: firm?.name || "Law Firm",
    },
  });

  doc.on("data", (c) => chunks.push(c));

  const leftMargin = 40;
  const pageWidth  = doc.page.width - 80;
  const bottomGuard = doc.page.height - 55;
  let y = 0;

  function addHeader() {
    doc.rect(0, 0, doc.page.width, 78).fill(COLORS.navy);

    doc.fillColor(COLORS.white).fontSize(SIZES.h1).font(FONTS.bold)
      .text(firm?.name || "Law Firm", leftMargin, 14, { width: 300 });
    doc.rect(leftMargin, 36, 60, 1.5).fill(COLORS.gold);

    doc.fontSize(SIZES.micro).fillColor(COLORS.gold).font(FONTS.bold)
      .text("BILL OF CHARGES", leftMargin, 41);

    doc.fontSize(SIZES.micro).fillColor(COLORS.white).font(FONTS.regular)
      .text("REFERENCE", 400, 16, { width: 155, align: "right" });
    doc.fontSize(16).fillColor(COLORS.white).font(FONTS.bold)
      .text(`#${invoice?.invoiceNumber || "N/A"}`, 400, 28, { width: 155, align: "right" });

    y = 90;
  }

  function addPageBreak() {
    drawFooter(doc, firm, pageWidth, invoice?.invoiceNumber || "N/A");
    doc.addPage();
    addHeader();
  }

  function checkY(needed = 50) {
    if (y + needed > bottomGuard) addPageBreak();
  }

  addHeader();

  // ── Invoice Title ──
  if (invoice?.title) {
    checkY(20);
    doc.fontSize(SIZES.h1 + 2).font(FONTS.bold).fillColor(COLORS.navy)
      .text(invoice.title, leftMargin, y, { width: pageWidth });
    y += 18;
  }

  // ── Client block ──
  doc.fontSize(SIZES.micro).font(FONTS.bold).fillColor(COLORS.gold)
    .text("BILL TO", leftMargin, y);
  y += 11;
  drawHRule(doc, leftMargin, y, pageWidth, COLORS.navyLight);
  y += 8;

  const clientName = invoice?.client
    ? `${invoice.client.firstName || ""} ${invoice.client.lastName || ""}`.trim()
    : "N/A";
  doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.textPrimary)
    .text(clientName, leftMargin, y, { width: 300 });
  y += 12;
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary);
  const clientLines = [
    invoice?.client?.companyName,
    invoice?.client?.address,
    invoice?.client?.email,
    invoice?.client?.phone,
  ].filter(Boolean);
  clientLines.forEach((line) => { doc.text(line, leftMargin, y, { width: 300 }); y += 11; });
  y += 14;

  // ── Meta box ──
  checkY(44);
  doc.rect(leftMargin, y, pageWidth, 38).fill(COLORS.navyUltraLight);
  doc.rect(leftMargin, y, pageWidth, 38).lineWidth(0.4).strokeColor(COLORS.navyLight).stroke();
  const metaY = y + 9;
  const metaSeg = pageWidth / 4;
  [
    ["Issue Date", formatDate(invoice?.issueDate)],
    ["Matter", invoice?.matter?.matterNumber || invoice?.matterReference || "N/A"],
    ["Status", invoice?.status || "draft"],
    ["Total Amount", formatCurrency(invoice?.totalAmount || invoice?.balance || 0)],
  ].forEach(([label, val], i) => {
    const mx = leftMargin + 10 + i * metaSeg;
    doc.fontSize(SIZES.micro).font(FONTS.regular).fillColor(COLORS.textMuted).text(label, mx, metaY);
    if (label === "Status") {
      drawStatusBadge(doc, val, mx, metaY + 11);
    } else if (label === "Total Amount") {
      doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.gold).text(val, mx, metaY + 11);
    } else {
      doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.textPrimary).text(val, mx, metaY + 11);
    }
  });
  y += 52;

  // ── Services Table ──
  checkY(50);
  y = drawSectionHeader(doc, "Professional Services", leftMargin, y, pageWidth);

  doc.rect(leftMargin, y, pageWidth, 20).fill(COLORS.navy);
  const tCols = { desc: leftMargin + 6, date: 290, qty: 330, rate: 370, amt: 450 };
  doc.fillColor(COLORS.white).fontSize(SIZES.small).font(FONTS.bold);
  doc.text("Description", tCols.desc, y + 6, { width: 220 });
  doc.text("Date", tCols.date, y + 6, { width: 35 });
  doc.text("Hrs/Qty", tCols.qty, y + 6, { width: 35 });
  doc.text("Rate", tCols.rate, y + 6, { width: 75 });
  doc.text("Amount", tCols.amt, y + 6, { width: 100, align: "right" });
  y += 24;

  const services = invoice?.services || [];
  services.forEach((item, idx) => {
    checkY(22);
    if (idx % 2 === 1) doc.rect(leftMargin, y - 2, pageWidth, 18).fill(COLORS.gray50);
    const categoryLabel = item.category ? `[${item.category.replace(/_/g, " ").toUpperCase()}] ` : "";
    doc.fillColor(COLORS.textPrimary).fontSize(SIZES.small).font(FONTS.regular)
      .text(categoryLabel + (item.description || "Service"), tCols.desc, y + 1, { width: 220 });
    doc.text(formatDate(item.date), tCols.date, y + 1, { width: 35 });
    doc.text(String(item.hours || item.quantity || "1"), tCols.qty, y + 1, { width: 35 });
    doc.text(formatCurrency(item.rate || 0), tCols.rate, y + 1, { width: 75 });
    doc.font(FONTS.bold)
      .text(formatCurrency(item.amount || 0), tCols.amt, y + 1, { width: 100, align: "right" });
    y += 18;
  });

  // ── Disbursements Table ──
  const expenses = invoice?.expenses || [];
  if (expenses.length > 0) {
    y += 10;
    checkY(40);
    y = drawSectionHeader(doc, "Disbursements", leftMargin, y, pageWidth);

    doc.rect(leftMargin, y, pageWidth, 20).fill(COLORS.navy);
    doc.fillColor(COLORS.white).fontSize(SIZES.small).font(FONTS.bold);
    doc.text("Description", tCols.desc, y + 6, { width: 280 });
    doc.text("Date", 290, y + 6, { width: 60 });
    doc.text("Amount", tCols.amt, y + 6, { width: 100, align: "right" });
    y += 24;

    expenses.forEach((item, idx) => {
      checkY(22);
      if (idx % 2 === 1) doc.rect(leftMargin, y - 2, pageWidth, 18).fill(COLORS.gray50);
      const expenseCategory = item.category ? `[${item.category.replace(/_/g, " ").toUpperCase()}] ` : "";
      doc.fillColor(COLORS.textPrimary).fontSize(SIZES.small).font(FONTS.regular)
        .text(expenseCategory + (item.description || "Expense"), tCols.desc, y + 1, { width: 280 });
      doc.text(formatDate(item.date), 290, y + 1, { width: 60 });
      doc.font(FONTS.bold)
        .text(formatCurrency(item.amount || 0), tCols.amt, y + 1, { width: 100, align: "right" });
      y += 18;
    });
  }

  drawHRule(doc, leftMargin, y, pageWidth, COLORS.gray200);
  y += 12;

  // ── Totals ──
  checkY(80);
  const totX  = 345;
  const totW  = pageWidth - 305;
  const totLW = 100;
  const totVX = totX + totLW;
  const totVW = totW - totLW - 4;

  function totRow(label, value, { bold = false, colorFg = COLORS.textSecondary, bg = null } = {}) {
    if (bg) doc.rect(totX, y, totW, 18).fill(bg);
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(colorFg)
      .text(label, totX + 6, y + 3, { width: totLW });
    doc.font(bold ? FONTS.bold : FONTS.regular)
      .fillColor(bold ? COLORS.textPrimary : colorFg)
      .text(value, totVX, y + 3, { width: totVW, align: "right" });
    y += 20;
  }

  totRow("Services Total", formatCurrency(invoice?.services?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0), { bg: COLORS.gray50 });
  totRow("Disbursements", formatCurrency(invoice?.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0), { bg: COLORS.gray50 });
  totRow("Subtotal", formatCurrency(invoice?.subtotal || 0));

  if ((invoice?.taxRate || 0) > 0) {
    totRow(`VAT (${invoice.taxRate}%)`, formatCurrency(invoice?.taxAmount || 0));
  }

  // Gold total bar
  checkY(28);
  doc.rect(totX, y, totW, 26).fill(COLORS.gold);
  doc.fontSize(SIZES.body).font(FONTS.bold).fillColor(COLORS.navy)
    .text("TOTAL CHARGES", totX + 6, y + 7, { width: totLW });
  doc.fontSize(SIZES.h2).font(FONTS.bold).fillColor(COLORS.navy)
    .text(formatCurrency(invoice?.totalAmount || invoice?.balance || 0), totVX - 10, y + 5, { width: totVW + 10, align: "right" });
  y += 36;

  // ── Notes ──
  if (invoice?.notes) {
    y += 14;
    checkY(55);
    y = drawSectionHeader(doc, "Notes", leftMargin, y, pageWidth);
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
      .text(invoice.notes, leftMargin, y, { width: pageWidth });
    y += doc.heightOfString(invoice.notes, { width: pageWidth }) + 10;
  }

  // ── Signature ──
  y += 20;
  checkY(75);
  
  if (invoice?.billingAttorney || invoice?.timekeeper) {
    const preparerName = invoice.billingAttorney?.firstName 
      ? `${invoice.billingAttorney.firstName} ${invoice.billingAttorney.lastName}`
      : invoice.timekeeper?.firstName
        ? `${invoice.timekeeper.firstName} ${invoice.timekeeper.lastName}`
        : firm?.signatureName;
    
    const preparerTitle = invoice.billingAttorney?.position 
      || invoice.timekeeper?.position 
      || firm?.signatoryTitle 
      || "Attorney";
      
    if (preparerName) {
      doc.fontSize(SIZES.small).font(FONTS.bold).fillColor(COLORS.textPrimary)
        .text(preparerName, leftMargin, y);
      y += 12;
      doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textSecondary)
        .text(preparerTitle, leftMargin, y);
      y += 24;
    }
  }
  
  drawHRule(doc, leftMargin, y, 180, COLORS.gray400);
  doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
    .text("Authorized Signature", leftMargin, y + 5);
  if (firm?.signatoryLicenseNumber) {
    doc.fontSize(SIZES.small).font(FONTS.regular).fillColor(COLORS.textMuted)
      .text(`SAN/License: ${firm.signatoryLicenseNumber}`, leftMargin, y + 40);
  }

  drawFooter(doc, firm, pageWidth, invoice?.invoiceNumber || "N/A");

  return finalizePdf(doc, chunks, res, outputPath);
}

module.exports = {
  generateInvoicePdf,
  generateReceiptPdf,
  generateBillOfChargesPdf,
};