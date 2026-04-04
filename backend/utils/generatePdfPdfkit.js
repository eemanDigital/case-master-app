/**
 * generatePdfPdfkit.js - PDF generation using PDFKit (no Chrome/Puppeteer required)
 */
"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generatePdf(data, res, outputPath) {
  const { matter, propertyDetails, firm } = data;
  
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const chunks = [];
  
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 60, left: 50, right: 50 },
  });

  doc.on("data", (chunk) => chunks.push(chunk));

  // Colors
  const headerBg = "#1a365d";
  const sectionBg = "#edf2f7";
  const labelColor = "#4a5568";
  const valueColor = "#1a202c";
  const accentColor = "#2b6cb0";
  const successColor = "#38a169";
  const warningColor = "#dd6b20";
  const errorColor = "#c53030";

  const pageWidth = doc.page.width - 100; // 50 margin each side

  let currentY = 60;
  const sectionGap = 15;
  const fieldGap = 8;
  const labelWidth = 150;
  const valueX = 50 + labelWidth + 10;

  const checkPageBreak = (needed = 80) => {
    if (currentY > doc.page.height - needed) {
      addFooter();
      doc.addPage();
      currentY = 60;
      addHeader();
    }
  };

  const addHeader = () => {
    // Header background
    doc.rect(0, 0, doc.page.width, 70).fill(headerBg);
    
    doc.fillColor("#ffffff")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(firm?.name || "Law Firm", 50, 20);
    
    doc.fontSize(10)
      .font("Helvetica")
      .text("Property Matter Report", 50, 45);
    
    doc.fontSize(12)
      .font("Helvetica-Bold")
      .text(matter?.matterNumber || "", doc.page.width - 150, 25, { align: "right", width: 100 });
    
    currentY = 85;
  };

  const addFooter = () => {
    doc.fontSize(8).fillColor(labelColor);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB", { 
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      })} | ${firm?.name || "Law Firm"}`,
      50, doc.page.height - 40,
      { align: "center", width: pageWidth }
    );
  };

  const addSection = (title) => {
    checkPageBreak(50);
    currentY += sectionGap;
    
    // Section background
    doc.rect(40, currentY - 5, pageWidth, 25).fill(sectionBg);
    
    doc.fillColor(headerBg)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(title, 50, currentY);
    
    currentY += 30;
  };

  const addField = (label, value, options = {}) => {
    const { bold = false, color = valueColor, showIfEmpty = true } = options;
    
    if (!value && !showIfEmpty) return;
    
    checkPageBreak(25);
    
    doc.fontSize(10)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fillColor(labelColor)
      .text(label, 50, currentY, { width: labelWidth })
      .fillColor(color)
      .text(String(value || "N/A"), valueX, currentY, { width: pageWidth - labelWidth - 10 });
    
    currentY += fieldGap + 12;
  };

  const addTwoColumnFields = (fields) => {
    fields.forEach((field) => {
      addField(field.label, field.value, field.options || {});
    });
  };

  const addStatusBadge = (status) => {
    let color = labelColor;
    let bgColor = "#e2e8f0";
    
    if (status?.toLowerCase() === "completed" || status?.toLowerCase() === "active" || status?.toLowerCase() === "registered" || status?.toLowerCase() === "agreed") {
      color = "#ffffff";
      bgColor = successColor;
    } else if (status?.toLowerCase() === "pending" || status?.toLowerCase() === "in-progress" || status?.toLowerCase() === "processing") {
      color = "#ffffff";
      bgColor = accentColor;
    } else if (status?.toLowerCase() === "expired" || status?.toLowerCase() === "rejected" || status?.toLowerCase() === "terminated" || status?.toLowerCase() === "disputed") {
      color = "#ffffff";
      bgColor = errorColor;
    } else if (status?.toLowerCase() === "executed") {
      color = "#ffffff";
      bgColor = warningColor;
    }

    const text = String(status || "N/A").toUpperCase();
    const textWidth = doc.widthOfString(text);
    
    doc.roundedRect(doc.x + 60, currentY - 2, textWidth + 12, 18, 3).fill(bgColor);
    doc.fillColor(color).fontSize(8).font("Helvetica-Bold").text(text, doc.x + 66, currentY + 2);
  };

  const addInfoCard = (title, items) => {
    checkPageBreak(60);
    
    // Card background
    const cardHeight = Math.max(60, items.length * 20 + 30);
    doc.rect(40, currentY, pageWidth, cardHeight).fill("#ffffff").stroke("#e2e8f0");
    
    // Card title
    doc.fillColor(headerBg).fontSize(10).font("Helvetica-Bold").text(title, 50, currentY + 8);
    
    // Card items
    let itemY = currentY + 28;
    items.forEach((item) => {
      doc.fontSize(9).fillColor(labelColor).text(item.label + ":", 55, itemY);
      doc.fillColor(valueColor).text(String(item.value || "N/A"), 160, itemY);
      itemY += 18;
    });
    
    currentY += cardHeight + 10;
  };

  // Build PDF
  addHeader();

  // Matter Information Section
  addSection("Matter Information");
  addField("Matter Number", matter?.matterNumber || "N/A", { bold: true });
  addField("Title", matter?.title || "N/A");
  addField("Status", matter?.status?.toUpperCase() || "N/A");
  addField("Priority", matter?.priority?.toUpperCase() || "N/A");
  addField("Date Opened", matter?.dateOpened ? new Date(matter.dateOpened).toLocaleDateString("en-GB") : "N/A");
  addField("Client", matter?.client ? `${matter.client.firstName} ${matter.client.lastName}` : "N/A");

  // Transaction Details Section
  addSection("Transaction Details");
  addField("Transaction Type", propertyDetails?.transactionType?.toUpperCase() || "N/A");
  addField("Payment Terms", propertyDetails?.paymentTerms?.replace(/-/g, " ").toUpperCase() || "N/A");

  // Financial Information Section
  addSection("Financial Information");
  
  if (propertyDetails?.purchasePrice?.amount) {
    addField("Purchase Price", `₦${propertyDetails.purchasePrice.amount.toLocaleString()}`);
  }
  if (propertyDetails?.rentAmount?.amount) {
    const freq = propertyDetails.rentAmount.frequency || "";
    addField("Rent Amount", `₦${propertyDetails.rentAmount.amount.toLocaleString()} ${freq ? '/ ' + freq : ''}`);
  }
  if (propertyDetails?.securityDeposit?.amount) {
    addField("Security Deposit", `₦${propertyDetails.securityDeposit.amount.toLocaleString()}`);
  }
  addField("Amount Paid", `₦${(propertyDetails?.amountPaid || 0).toLocaleString()}`);
  addField("Balance", `₦${(propertyDetails?.balance || 0).toLocaleString()}`);

  // Lease Information Section
  if (["lease", "sublease", "tenancy_matter"].includes(propertyDetails?.transactionType)) {
    addSection("Lease Information");
    
    const lease = propertyDetails?.leaseAgreement || {};
    
    addField("Status", lease.status?.toUpperCase() || "N/A");
    addField("Commencement Date", lease.commencementDate ? new Date(lease.commencementDate).toLocaleDateString("en-GB") : "N/A");
    addField("Expiry Date", lease.expiryDate ? new Date(lease.expiryDate).toLocaleDateString("en-GB") : "N/A");
    addField("Duration", lease.duration ? `${lease.duration.years || 0} years, ${lease.duration.months || 0} months` : "N/A");
    addField("Renewal Option", lease.renewalOption ? "Yes" : "No");

    // Time Remaining with color coding
    if (lease.expiryDate) {
      const daysRemaining = Math.ceil((new Date(lease.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      let timeText, timeColor;
      
      if (daysRemaining < 0) {
        timeText = `Expired ${Math.abs(daysRemaining)} days ago`;
        timeColor = errorColor;
      } else if (daysRemaining <= 7) {
        timeText = `${daysRemaining} days - CRITICAL`;
        timeColor = errorColor;
      } else if (daysRemaining <= 30) {
        timeText = `${daysRemaining} days - Warning`;
        timeColor = warningColor;
      } else if (daysRemaining <= 90) {
        timeText = `${daysRemaining} days - Notice`;
        timeColor = accentColor;
      } else {
        timeText = `${daysRemaining} days`;
        timeColor = valueColor;
      }
      
      addField("Time Remaining", timeText, { color: timeColor, bold: true });
    }

    // Renewal Tracking
    if (propertyDetails?.renewalTracking?.renewalInitiated) {
      currentY += 5;
      addSection("Renewal Tracking");
      addField("Renewal Status", propertyDetails.renewalTracking.renewalStatus?.replace(/-/g, " ").toUpperCase() || "N/A");
      
      if (propertyDetails.renewalTracking.renewalDeadline) {
        addField("Renewal Deadline", new Date(propertyDetails.renewalTracking.renewalDeadline).toLocaleDateString("en-GB"));
      }
      
      if (propertyDetails.renewalTracking.proposedNewRent?.amount) {
        addField("Proposed New Rent", `₦${propertyDetails.renewalTracking.proposedNewRent.amount.toLocaleString()}`);
      }
      
      if (propertyDetails.renewalTracking.rentIncreasePercentage > 0) {
        addField("Increase", `+${propertyDetails.renewalTracking.rentIncreasePercentage}%`);
      }
      
      addField("Negotiations", `${propertyDetails.renewalTracking.negotiationsHistory?.length || 0} recorded`);
    }

    // Milestones Summary
    if (propertyDetails?.leaseMilestones?.length > 0) {
      const completed = propertyDetails.leaseMilestones.filter(m => m.status === "completed").length;
      const total = propertyDetails.leaseMilestones.length;
      addField("Milestones", `${completed}/${total} completed`);
    }
  }

  // Parties Involved Section
  const hasLandlord = propertyDetails?.landlord?.name;
  const hasTenant = propertyDetails?.tenant?.name;
  const hasVendor = propertyDetails?.vendor?.name;
  const hasPurchaser = propertyDetails?.purchaser?.name;

  if (hasLandlord || hasTenant || hasVendor || hasPurchaser) {
    addSection("Parties Involved");
    
    if (hasLandlord || hasTenant) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor(headerBg).text("Land & Tenancy", 50, currentY);
      currentY += 18;
      
      if (hasLandlord) {
        addField("Landlord", propertyDetails.landlord.name);
        if (propertyDetails.landlord.contact) {
          addField("", propertyDetails.landlord.contact, { showIfEmpty: false });
        }
      }
      if (hasTenant) {
        addField("Tenant", propertyDetails.tenant.name);
        if (propertyDetails.tenant.contact) {
          addField("", propertyDetails.tenant.contact, { showIfEmpty: false });
        }
      }
    }
    
    if (hasVendor || hasPurchaser) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor(headerBg).text("Purchase/Sale", 50, currentY);
      currentY += 18;
      
      if (hasVendor) {
        addField("Vendor/Owner", propertyDetails.vendor.name);
        if (propertyDetails.vendor.contact) {
          addField("", propertyDetails.vendor.contact, { showIfEmpty: false });
        }
      }
      if (hasPurchaser) {
        addField("Purchaser/Buyer", propertyDetails.purchaser.name);
        if (propertyDetails.purchaser.contact) {
          addField("", propertyDetails.purchaser.contact, { showIfEmpty: false });
        }
      }
    }
  }

  // Property Information Section
  if (propertyDetails?.properties?.length > 0) {
    addSection("Property Information");
    
    const prop = propertyDetails.properties[0];
    addField("Address", prop?.address || "N/A");
    addField("State", prop?.state || "N/A");
    if (prop?.lga) addField("LGA", prop.lga);
    addField("Property Type", prop?.propertyType?.toUpperCase() || "N/A");
    if (prop?.titleDocument) addField("Title Document", prop.titleDocument);
    if (prop?.landSize?.value) {
      addField("Land Size", `${prop.landSize.value.toLocaleString()} ${prop.landSize.unit || ""}`);
    }
  }

  // Legal Status Section
  addSection("Legal Status");
  
  const contractStatus = propertyDetails?.contractOfSale?.status?.toUpperCase() || "NOT STARTED";
  const govStatus = propertyDetails?.governorsConsent?.status?.toUpperCase() || "NOT REQUIRED";
  const deedStatus = propertyDetails?.deedOfAssignment?.status?.toUpperCase() || "PENDING";
  
  addField("Contract of Sale", contractStatus);
  addField("Governor's Consent", govStatus);
  addField("Deed of Assignment", deedStatus);

  // Due Diligence Section
  addSection("Due Diligence");
  
  const titleSearch = propertyDetails?.titleSearch?.isCompleted ? "COMPLETED" : "PENDING";
  const inspection = propertyDetails?.physicalInspection?.isCompleted ? "COMPLETED" : "PENDING";
  const survey = propertyDetails?.surveyPlan?.isAvailable ? "AVAILABLE" : "NOT AVAILABLE";
  
  addField("Title Search", titleSearch);
  addField("Physical Inspection", inspection);
  addField("Survey Plan", survey);

  // Payment Schedule Section
  if (propertyDetails?.paymentSchedule?.length > 0) {
    addSection("Payment Schedule");
    
    const payments = propertyDetails.paymentSchedule;
    
    // Table header
    const colWidths = [40, 100, 90, 70, 80];
    const headers = ["#", "Due Date", "Amount", "Status", "Paid Date"];
    
    doc.rect(40, currentY, pageWidth, 22).fill(accentColor);
    let xPos = 45;
    headers.forEach((header, i) => {
      doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold")
        .text(header, xPos, currentY + 6);
      xPos += colWidths[i];
    });
    currentY += 28;
    
    // Table rows
    payments.forEach((payment) => {
      checkPageBreak(25);
      
      const statusColor = payment.status === "paid" ? successColor : 
                          payment.status === "overdue" ? errorColor : labelColor;
      
      xPos = 45;
      const rowData = [
        `#${payment.installmentNumber || "?"}`,
        payment.dueDate ? new Date(payment.dueDate).toLocaleDateString("en-GB") : "-",
        `₦${(payment.amount || 0).toLocaleString()}`,
        (payment.status || "pending").toUpperCase(),
        payment.paidDate ? new Date(payment.paidDate).toLocaleDateString("en-GB") : "-"
      ];
      
      rowData.forEach((cell, i) => {
        doc.fillColor(i === 3 ? statusColor : valueColor)
          .fontSize(9)
          .font(i === 3 ? "Helvetica-Bold" : "Helvetica")
          .text(cell, xPos, currentY, { width: colWidths[i] - 5 });
        xPos += colWidths[i];
      });
      
      currentY += 22;
    });
  }

  // Milestones Section
  if (propertyDetails?.leaseMilestones?.length > 0) {
    addSection("Lease Milestones");
    
    propertyDetails.leaseMilestones.forEach((milestone) => {
      checkPageBreak(35);
      
      const statusColor = milestone.status === "completed" ? successColor :
                          milestone.status === "overdue" ? errorColor : accentColor;
      const statusBg = milestone.status === "completed" ? "#c6f6d5" :
                      milestone.status === "overdue" ? "#fed7d7" : "#bee3f8";
      
      // Status badge
      doc.roundedRect(50, currentY, 80, 16, 3).fill(statusBg);
      doc.fillColor(statusColor).fontSize(8).font("Helvetica-Bold")
        .text((milestone.status || "pending").toUpperCase(), 55, currentY + 4);
      
      // Title
      doc.fillColor(valueColor).fontSize(10).font("Helvetica-Bold")
        .text(milestone.title || "N/A", 140, currentY + 2);
      
      // Target date
      if (milestone.targetDate) {
        doc.fillColor(labelColor).fontSize(9).font("Helvetica")
          .text(`Target: ${new Date(milestone.targetDate).toLocaleDateString("en-GB")}`, 350, currentY + 3);
      }
      
      currentY += 28;
      
      if (milestone.description) {
        doc.fillColor(labelColor).fontSize(9).font("Helvetica")
          .text(milestone.description, 55, currentY, { width: pageWidth - 20 });
        currentY += 16;
      }
    });
  }

  // Add footer to all pages and finalize
  addFooter();

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, pdfBuffer);
        
        const filename = path.basename(outputPath);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        res.end(pdfBuffer);
        
        console.log(`✅ PDF generated: ${outputPath}`);
        resolve(outputPath);
      } catch (err) {
        reject(err);
      }
    });
    
    doc.on("error", reject);
  });
}

module.exports = { generatePdf };
