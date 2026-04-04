/**
 * generateInvoicePdf.js - Invoice/Receipt PDF generator using PDFKit
 * No Chrome/Puppeteer required
 */
"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const COLORS = {
  primary: "#1a365d",
  primaryLight: "#e8f0fe",
  secondary: "#64748b",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray200: "#e2e8f0",
  gray300: "#cbd5e1",
  gray700: "#334155",
  gray900: "#0f172a",
  white: "#ffffff",
};

function formatCurrency(amount, currency = "₦") {
  return `${currency}${Number(amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

async function generateInvoicePdf(data, res, outputPath) {
  const { invoice, firm } = data;

  const chunks = [];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 50, left: 40, right: 40 },
    info: { Title: `Invoice ${invoice?.invoiceNumber || ""}`, Author: firm?.name || "Law Firm" },
  });

  doc.on("data", (chunk) => chunks.push(chunk));

  const pageWidth = doc.page.width - 80;
  let y = 50;

  const addPageBreak = () => {
    doc.addPage();
    y = 50;
    addHeader();
  };

  const checkPageBreak = (needed = 60) => {
    if (y > doc.page.height - needed) {
      addPageBreak();
    }
  };

  const addHeader = () => {
    doc.rect(0, 0, doc.page.width, 70).fill(COLORS.primary);
    doc.fillColor(COLORS.white).fontSize(18).font("Helvetica-Bold")
      .text(firm?.name || "Law Firm", 40, 15);
    doc.fontSize(9).font("Helvetica")
      .text("INVOICE", 40, 40);
    doc.fontSize(14).font("Helvetica-Bold")
      .text(`#${invoice?.invoiceNumber || "N/A"}`, 450, 20, { width: 130, align: "right" });
    doc.fontSize(9).font("Helvetica")
      .text(formatDate(invoice?.issueDate || invoice?.createdAt), 450, 40, { width: 130, align: "right" });
    y = 85;
  };

  const addFooter = () => {
    const pageNum = doc.bufferedPageRange().start + 1;
    doc.fontSize(8).fillColor(COLORS.secondary)
      .text(`Page ${pageNum} | ${firm?.name || "Law Firm"} | Generated: ${new Date().toLocaleDateString("en-GB")}`,
        40, doc.page.height - 30, { align: "center", width: pageWidth });
  };

  addHeader();

  // Firm & Client Info
  doc.fontSize(8).fillColor(COLORS.secondary).font("Helvetica-Bold")
    .text("FROM", 40, y);
  y += 12;
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(firm?.name || "Law Firm", 40, y);
  y += 11;
  doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
    .text(firm?.address || "", 40, y, { width: 200 });
  y += 10;
  if (firm?.email) { doc.text(firm.email, 40, y); y += 10; }
  if (firm?.phone) { doc.text(firm.phone, 40, y); y += 10; }

  const clientX = 350;
  let clientY = 85;
  doc.fontSize(8).fillColor(COLORS.secondary).font("Helvetica-Bold")
    .text("BILL TO", clientX, clientY);
  clientY += 12;
  const clientName = invoice?.client ? `${invoice.client.firstName || ""} ${invoice.client.lastName || ""}`.trim() : "N/A";
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(clientName, clientX, clientY);
  clientY += 11;
  if (invoice?.client?.companyName) {
    doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
      .text(invoice.client.companyName, clientX, clientY);
    clientY += 10;
  }
  if (invoice?.client?.address) {
    doc.text(invoice.client.address, clientX, clientY, { width: 180 });
    clientY += 10;
  }
  if (invoice?.client?.email) { doc.text(invoice.client.email, clientX, clientY); }
  if (invoice?.client?.phone) { doc.text(invoice.client.phone, clientX, clientY + 10); }

  y = Math.max(y, clientY + 30);

  // Invoice Details Box
  checkPageBreak(50);
  doc.rect(40, y, pageWidth, 35).fill(COLORS.gray100);
  const detailY = y + 8;
  const detailCol = pageWidth / 4;

  const addDetail = (label, value, x) => {
    doc.fontSize(7).fillColor(COLORS.secondary).font("Helvetica")
      .text(label, x, detailY);
    doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
      .text(value, x, detailY + 9);
  };

  addDetail("Issue Date", formatDate(invoice?.issueDate), 50);
  addDetail("Due Date", formatDate(invoice?.dueDate), 50 + detailCol);
  addDetail("Status", (invoice?.status || "draft").toUpperCase(), 50 + detailCol * 2);
  addDetail("Matter", invoice?.matter?.matterNumber || "N/A", 50 + detailCol * 3);
  y += 45;

  // Services Table
  checkPageBreak(60);
  doc.rect(40, y, pageWidth, 18).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(8).font("Helvetica-Bold");
  doc.text("Description", 45, y + 5, { width: 200 });
  doc.text("Qty/Hrs", 250, y + 5, { width: 60 });
  doc.text("Rate", 315, y + 5, { width: 80 });
  doc.text("Amount", 400, y + 5, { width: 80, align: "right" });
  y += 22;

  // Service Rows
  const services = invoice?.services || [];
  services.forEach((service, idx) => {
    checkPageBreak(25);
    const bgColor = idx % 2 === 0 ? COLORS.white : COLORS.gray50;
    doc.rect(40, y - 2, pageWidth, 18).fill(bgColor);
    doc.fillColor(COLORS.gray900).fontSize(8).font("Helvetica")
      .text(service.description || "Service", 45, y + 1, { width: 200 })
      .text(String(service.quantity || 1), 250, y + 1, { width: 60 })
      .text(formatCurrency(service.rate || service.amount), 315, y + 1, { width: 80 })
      .text(formatCurrency(service.amount), 400, y + 1, { width: 80, align: "right" });
    y += 18;
  });

  // Expenses
  const expenses = invoice?.expenses || [];
  expenses.forEach((expense, idx) => {
    checkPageBreak(25);
    const bgColor = (services.length + idx) % 2 === 0 ? COLORS.white : COLORS.gray50;
    doc.rect(40, y - 2, pageWidth, 18).fill(bgColor);
    doc.fillColor(COLORS.gray900).fontSize(8).font("Helvetica")
      .text(`[Expense] ${expense.description || "Expense"}`, 45, y + 1, { width: 200 })
      .text("-", 250, y + 1, { width: 60 })
      .text("-", 315, y + 1, { width: 80 })
      .text(formatCurrency(expense.amount), 400, y + 1, { width: 80, align: "right" });
    y += 18;
  });

  // Totals Section
  checkPageBreak(100);
  y += 10;
  const totalsX = 320;
  const totalsWidth = pageWidth - 280;

  doc.rect(totalsX, y, totalsWidth, 18).fill(COLORS.gray100);
  doc.fillColor(COLORS.gray700).fontSize(8).font("Helvetica")
    .text("Subtotal:", totalsX + 5, y + 5);
  doc.fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(formatCurrency(invoice?.currentCharges?.subtotal || invoice?.subtotal || 0), totalsX + totalsWidth - 90, y + 5, { width: 85, align: "right" });
  y += 20;

  if (invoice?.discount > 0) {
    doc.fillColor(COLORS.gray700).fontSize(8).font("Helvetica")
      .text(`Discount${invoice.discountType === "percentage" ? ` (${invoice.discount}%)` : ""}:`, totalsX + 5, y + 5);
    doc.fillColor(COLORS.success).font("Helvetica-Bold")
      .text(`-${formatCurrency(invoice.currentCharges?.discount || 0)}`, totalsX + totalsWidth - 90, y + 5, { width: 85, align: "right" });
    y += 18;
  }

  if (invoice?.taxRate > 0) {
    doc.fillColor(COLORS.gray700).fontSize(8).font("Helvetica")
      .text(`VAT (${invoice.taxRate}%):`, totalsX + 5, y + 5);
    doc.fillColor(COLORS.gray900).font("Helvetica-Bold")
      .text(formatCurrency(invoice?.currentCharges?.tax || 0), totalsX + totalsWidth - 90, y + 5, { width: 85, align: "right" });
    y += 18;
  }

  if (invoice?.previousBalance > 0) {
    doc.fillColor(COLORS.gray700).fontSize(8).font("Helvetica")
      .text("Previous Balance:", totalsX + 5, y + 5);
    doc.fillColor(COLORS.gray900).font("Helvetica-Bold")
      .text(formatCurrency(invoice.previousBalance), totalsX + totalsWidth - 90, y + 5, { width: 85, align: "right" });
    y += 18;
  }

  // Grand Total
  doc.rect(totalsX, y, totalsWidth, 25).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(9).font("Helvetica-Bold")
    .text("TOTAL DUE:", totalsX + 5, y + 8);
  doc.fontSize(12)
    .text(formatCurrency(invoice?.balance || invoice?.currentCharges?.total || 0), totalsX + totalsWidth - 100, y + 5, { width: 95, align: "right" });

  // Amount Paid
  if (invoice?.amountPaid > 0) {
    y += 30;
    doc.fillColor(COLORS.success).fontSize(9).font("Helvetica-Bold")
      .text(`Amount Paid: ${formatCurrency(invoice.amountPaid)}`, totalsX + 5, y);
  }

  // Balance Outstanding
  y += 25;
  if (invoice?.balance > 0) {
    doc.rect(totalsX, y, totalsWidth, 20).fill("#fef3c7");
    doc.fillColor("#92400e").fontSize(9).font("Helvetica-Bold")
      .text("Balance Outstanding:", totalsX + 5, y + 5);
    doc.fontSize(11)
      .text(formatCurrency(invoice.balance), totalsX + totalsWidth - 100, y + 3, { width: 95, align: "right" });
  }

  // Payments Section
  const payments = invoice?.payments || [];
  if (payments.length > 0) {
    y += 40;
    checkPageBreak(60);
    doc.fontSize(10).fillColor(COLORS.primary).font("Helvetica-Bold")
      .text("Payment History", 40, y);
    y += 15;

    doc.rect(40, y, pageWidth, 18).fill(COLORS.primary);
    doc.fillColor(COLORS.white).fontSize(8).font("Helvetica-Bold");
    doc.text("Date", 45, y + 5, { width: 100 });
    doc.text("Reference", 150, y + 5, { width: 120 });
    doc.text("Method", 275, y + 5, { width: 100 });
    doc.text("Amount", 400, y + 5, { width: 80, align: "right" });
    y += 22;

    payments.forEach((payment, idx) => {
      checkPageBreak(20);
      const bgColor = idx % 2 === 0 ? COLORS.white : COLORS.gray50;
      doc.rect(40, y - 2, pageWidth, 18).fill(bgColor);
      doc.fillColor(COLORS.gray900).fontSize(8).font("Helvetica")
        .text(formatDate(payment.paymentDate), 45, y + 1, { width: 100 })
        .text(payment.paymentReference || "N/A", 150, y + 1, { width: 120 })
        .text(payment.paymentMethod || "N/A", 275, y + 1, { width: 100 })
        .text(formatCurrency(payment.amount), 400, y + 1, { width: 80, align: "right" });
      y += 18;
    });
  }

  // Terms & Conditions
  y += 20;
  checkPageBreak(60);
  doc.fontSize(9).fillColor(COLORS.primary).font("Helvetica-Bold")
    .text("Terms & Conditions", 40, y);
  y += 15;
  const terms = firm?.settings?.defaultPaymentTerms || "Payment is due upon receipt. Please include invoice number as payment reference. Late payments may attract interest charges.";
  doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
    .text(terms, 40, y, { width: pageWidth });

  // Signature Block
  y += 40;
  checkPageBreak(60);
  doc.moveTo(40, y).lineTo(200, y).stroke(COLORS.gray300);
  doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
    .text("Authorized Signatory", 40, y + 5);
  if (firm?.signatureName) {
    doc.text(firm.signatureName, 40, y + 15);
  }
  if (firm?.signatoryTitle) {
    doc.text(firm.signatoryTitle, 40, y + 25);
  }

  addFooter();

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    doc.end();
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const filename = path.basename(outputPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
      console.log(`Invoice PDF generated: ${filename}`);
      resolve(outputPath);
    });
    doc.on("error", reject);
  });
}

async function generateReceiptPdf(data, res, outputPath) {
  const { receipt, firm } = data;

  const chunks = [];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 50, left: 40, right: 40 },
    info: { Title: `Receipt ${receipt?.receiptNumber || ""}`, Author: firm?.name || "Law Firm" },
  });

  doc.on("data", (chunk) => chunks.push(chunk));

  const pageWidth = doc.page.width - 80;
  let y = 50;

  // Header
  doc.rect(0, 0, doc.page.width, 70).fill(COLORS.success);
  doc.fillColor(COLORS.white).fontSize(18).font("Helvetica-Bold")
    .text(firm?.name || "Law Firm", 40, 15);
  doc.fontSize(9).font("Helvetica")
    .text("PAYMENT RECEIPT", 40, 40);
  doc.fontSize(14).font("Helvetica-Bold")
    .text(`#${receipt?.receiptNumber || "N/A"}`, 450, 20, { width: 130, align: "right" });
  doc.fontSize(9).font("Helvetica")
    .text(formatDate(receipt?.paymentDate), 450, 40, { width: 130, align: "right" });
  y = 85;

  // Firm Info
  doc.fontSize(8).fillColor(COLORS.secondary).font("Helvetica-Bold")
    .text("FROM", 40, y);
  y += 12;
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(firm?.name || "Law Firm", 40, y);
  y += 11;
  doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
    .text(firm?.address || "", 40, y);
  y += 20;

  // Client Info
  doc.fontSize(8).fillColor(COLORS.secondary).font("Helvetica-Bold")
    .text("RECEIVED FROM", 350, 85);
  const clientName = receipt?.client ? `${receipt.client.firstName || ""} ${receipt.client.lastName || ""}`.trim() : "N/A";
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(clientName, 350, 97);
  if (receipt?.client?.address) {
    doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
      .text(receipt.client.address, 350, 110);
  }

  // Receipt Details Box
  doc.rect(40, y, pageWidth, 50).fill(COLORS.gray100);
  const detailY = y + 10;
  const detailCol = pageWidth / 3;

  doc.fontSize(7).fillColor(COLORS.secondary).font("Helvetica")
    .text("Payment Date", 50, detailY);
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(formatDate(receipt?.paymentDate), 50, detailY + 10);

  doc.fontSize(7).fillColor(COLORS.secondary).font("Helvetica")
    .text("Payment Reference", 50 + detailCol, detailY);
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(receipt?.paymentReference || "N/A", 50 + detailCol, detailY + 10);

  doc.fontSize(7).fillColor(COLORS.secondary).font("Helvetica")
    .text("Payment Method", 50 + detailCol * 2, detailY);
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text((receipt?.paymentMethod || "N/A").toUpperCase(), 50 + detailCol * 2, detailY + 10);
  y += 60;

  // Amount Received - Large Display
  doc.rect(40, y, pageWidth, 50).fill(COLORS.success);
  doc.fillColor(COLORS.white).fontSize(10).font("Helvetica")
    .text("AMOUNT RECEIVED", 50, y + 10);
  doc.fontSize(20).font("Helvetica-Bold")
    .text(formatCurrency(receipt?.amount), 50, y + 25);
  y += 65;

  // Invoice Reference
  if (receipt?.invoice) {
    doc.fontSize(8).fillColor(COLORS.secondary).font("Helvetica")
      .text("In respect of Invoice:", 40, y);
    doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
      .text(receipt.invoice.invoiceNumber || "N/A", 140, y);
    y += 15;
    if (receipt.invoice.totalAmount) {
      doc.fontSize(8).fillColor(COLORS.secondary).font("Helvetica")
        .text("Invoice Amount:", 40, y);
      doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica")
        .text(formatCurrency(receipt.invoice.totalAmount), 140, y);
      y += 15;
    }
  }

  // Amount in Words
  y += 10;
  doc.fontSize(9).fillColor(COLORS.primary).font("Helvetica-Bold")
    .text(`Sum of: ${receipt?.amountInWords || "N/A"}`, 40, y);
  y += 30;

  // Signature Block
  doc.moveTo(40, y).lineTo(200, y).stroke(COLORS.gray300);
  doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
    .text("Authorized Signatory", 40, y + 5);
  if (firm?.signatureName) {
    doc.text(firm.signatureName, 40, y + 15);
  }

  // Footer
  const pageNum = doc.bufferedPageRange().start + 1;
  doc.fontSize(8).fillColor(COLORS.secondary)
    .text(`Page ${pageNum} | ${firm?.name || "Law Firm"} | Generated: ${new Date().toLocaleDateString("en-GB")}`,
      40, doc.page.height - 30, { align: "center", width: pageWidth });

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    doc.end();
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const filename = path.basename(outputPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
      console.log(`Receipt PDF generated: ${filename}`);
      resolve(outputPath);
    });
    doc.on("error", reject);
  });
}

async function generateBillOfChargesPdf(data, res, outputPath) {
  const { invoice, firm } = data;

  const chunks = [];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 50, left: 40, right: 40 },
    info: { Title: `Bill of Charges ${invoice?.invoiceNumber || ""}`, Author: firm?.name || "Law Firm" },
  });

  doc.on("data", (chunk) => chunks.push(chunk));

  const pageWidth = doc.page.width - 80;
  let y = 50;

  // Header
  doc.rect(0, 0, doc.page.width, 70).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(18).font("Helvetica-Bold")
    .text(firm?.name || "Law Firm", 40, 15);
  doc.fontSize(9).font("Helvetica")
    .text("BILL OF CHARGES", 40, 40);
  doc.fontSize(14).font("Helvetica-Bold")
    .text(`#${invoice?.invoiceNumber || "N/A"}`, 450, 20, { width: 130, align: "right" });
  doc.fontSize(9).font("Helvetica")
    .text(formatDate(invoice?.issueDate), 450, 40, { width: 130, align: "right" });
  y = 85;

  // Client Info
  doc.fontSize(8).fillColor(COLORS.secondary).font("Helvetica-Bold")
    .text("BILL TO", 40, y);
  y += 12;
  const clientName = invoice?.client ? `${invoice.client.firstName || ""} ${invoice.client.lastName || ""}`.trim() : "N/A";
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(clientName, 40, y);
  y += 11;
  if (invoice?.client?.companyName) {
    doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
      .text(invoice.client.companyName, 40, y);
    y += 10;
  }
  if (invoice?.client?.address) {
    doc.text(invoice.client.address, 40, y, { width: 200 });
    y += 10;
  }
  if (invoice?.client?.email) { doc.text(invoice.client.email, 40, y); y += 10; }

  y += 20;

  // Details Box
  doc.rect(40, y, pageWidth, 35).fill(COLORS.gray100);
  const detailY = y + 8;
  const detailCol = pageWidth / 4;

  doc.fontSize(7).fillColor(COLORS.secondary).font("Helvetica")
    .text("Issue Date", 50, detailY);
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(formatDate(invoice?.issueDate), 50, detailY + 9);

  doc.fontSize(7).fillColor(COLORS.secondary).font("Helvetica")
    .text("Matter", 50 + detailCol, detailY);
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(invoice?.matter?.matterNumber || "N/A", 50 + detailCol, detailY + 9);

  doc.fontSize(7).fillColor(COLORS.secondary).font("Helvetica")
    .text("Status", 50 + detailCol * 2, detailY);
  doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text((invoice?.status || "draft").toUpperCase(), 50 + detailCol * 2, detailY + 9);

  doc.fontSize(7).fillColor(COLORS.secondary).font("Helvetica")
    .text("Total Amount", 50 + detailCol * 3, detailY);
  doc.fontSize(9).fillColor(COLORS.primary).font("Helvetica-Bold")
    .text(formatCurrency(invoice?.totalAmount || invoice?.balance || 0), 50 + detailCol * 3, detailY + 9);
  y += 50;

  // Services Table
  doc.rect(40, y, pageWidth, 18).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(8).font("Helvetica-Bold");
  doc.text("Description", 45, y + 5, { width: 280 });
  doc.text("Rate", 330, y + 5, { width: 80 });
  doc.text("Amount", 420, y + 5, { width: 80, align: "right" });
  y += 22;

  const services = invoice?.services || [];
  services.forEach((service, idx) => {
    const bgColor = idx % 2 === 0 ? COLORS.white : COLORS.gray50;
    doc.rect(40, y - 2, pageWidth, 18).fill(bgColor);
    doc.fillColor(COLORS.gray900).fontSize(8).font("Helvetica")
      .text(service.description || "Service", 45, y + 1, { width: 280 })
      .text(formatCurrency(service.rate || service.amount), 330, y + 1, { width: 80 })
      .text(formatCurrency(service.amount), 420, y + 1, { width: 80, align: "right" });
    y += 18;
  });

  // Expenses
  const expenses = invoice?.expenses || [];
  expenses.forEach((expense, idx) => {
    const bgColor = (services.length + idx) % 2 === 0 ? COLORS.white : COLORS.gray50;
    doc.rect(40, y - 2, pageWidth, 18).fill(bgColor);
    doc.fillColor(COLORS.gray900).fontSize(8).font("Helvetica")
      .text(`[Expense] ${expense.description || "Expense"}`, 45, y + 1, { width: 280 })
      .text("-", 330, y + 1, { width: 80 })
      .text(formatCurrency(expense.amount), 420, y + 1, { width: 80, align: "right" });
    y += 18;
  });

  // Totals
  y += 10;
  const totalsX = 330;
  const totalsWidth = pageWidth - 290;

  doc.fillColor(COLORS.gray700).fontSize(8).font("Helvetica")
    .text("Subtotal:", totalsX, y);
  doc.fillColor(COLORS.gray900).font("Helvetica-Bold")
    .text(formatCurrency(invoice?.subtotal || 0), totalsX + totalsWidth - 90, y, { width: 90, align: "right" });
  y += 18;

  if (invoice?.taxRate > 0) {
    doc.fillColor(COLORS.gray700).fontSize(8).font("Helvetica")
      .text(`VAT (${invoice.taxRate}%):`, totalsX, y);
    doc.fillColor(COLORS.gray900).font("Helvetica-Bold")
      .text(formatCurrency(invoice?.taxAmount || 0), totalsX + totalsWidth - 90, y, { width: 90, align: "right" });
    y += 18;
  }

  doc.rect(totalsX, y, totalsWidth, 22).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(10).font("Helvetica-Bold")
    .text("TOTAL:", totalsX + 5, y + 6);
  doc.fontSize(12)
    .text(formatCurrency(invoice?.totalAmount || invoice?.balance || 0), totalsX + totalsWidth - 100, y + 3, { width: 95, align: "right" });

  // Signature
  y += 50;
  doc.moveTo(40, y).lineTo(200, y).stroke(COLORS.gray300);
  doc.fontSize(8).fillColor(COLORS.gray700).font("Helvetica")
    .text("Authorized Signatory", 40, y + 5);
  if (firm?.signatureName) doc.text(firm.signatureName, 40, y + 15);

  // Footer
  const pageNum = doc.bufferedPageRange().start + 1;
  doc.fontSize(8).fillColor(COLORS.secondary)
    .text(`Page ${pageNum} | ${firm?.name || "Law Firm"} | Generated: ${new Date().toLocaleDateString("en-GB")}`,
      40, doc.page.height - 30, { align: "center", width: pageWidth });

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    doc.end();
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const filename = path.basename(outputPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
      console.log(`Bill of Charges PDF generated: ${filename}`);
      resolve(outputPath);
    });
    doc.on("error", reject);
  });
}

module.exports = {
  generateInvoicePdf,
  generateReceiptPdf,
  generateBillOfChargesPdf,
};
