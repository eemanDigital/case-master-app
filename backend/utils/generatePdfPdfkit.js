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
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  doc.on("data", (chunk) => chunks.push(chunk));

  // Colors
  const headerBg = "#1a365d";
  const sectionBg = "#e2e8f0";
  const labelColor = "#718096";
  const valueColor = "#2d3748";
  const accentColor = "#3182ce";
  const successColor = "#38a169";
  const warningColor = "#dd6b20";
  const errorColor = "#e53e3e";
  const white = "#ffffff";

  const pageWidth = doc.page.width - 100;
  const col1Width = 140;
  const col2X = 50 + col1Width + 10;

  let y = 50;
  const lineHeight = 16;
  const sectionTitleHeight = 22;
  const sectionPadding = 8;
  const fieldGap = 4;

  const getStatusColor = (status) => {
    if (!status) return labelColor;
    const s = status.toLowerCase();
    if (["completed", "active", "registered", "agreed", "approved"].includes(s)) return successColor;
    if (["pending", "in-progress", "processing"].includes(s)) return accentColor;
    if (["expired", "rejected", "terminated", "disputed"].includes(s)) return errorColor;
    if (["executed"].includes(s)) return warningColor;
    return labelColor;
  };

  const getStatusBg = (status) => {
    if (!status) return "#e2e8f0";
    const s = status.toLowerCase();
    if (["completed", "active", "registered", "agreed", "approved"].includes(s)) return "#c6f6d5";
    if (["pending", "in-progress", "processing"].includes(s)) return "#bee3f8";
    if (["expired", "rejected", "terminated", "disputed"].includes(s)) return "#fed7d7";
    if (["executed"].includes(s)) return "#feebc8";
    return "#e2e8f0";
  };

  const addPageBreak = () => {
    addFooter();
    doc.addPage();
    y = 50;
    addHeader();
  };

  const addHeader = () => {
    // Header bar
    doc.rect(0, 0, doc.page.width, 60).fill(headerBg);
    
    // Firm name
    doc.fillColor(white)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(firm?.name || "Law Firm", 50, 15);
    
    // Report title
    doc.fontSize(9)
      .font("Helvetica")
      .text("Property Matter Report", 50, 38);
    
    // Matter number
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .text(matter?.matterNumber || "", 400, 20, { width: 150, align: "right" });
    
    y = 75;
  };

  const addFooter = () => {
    const pageNum = doc.bufferedPageRange().start + 1;
    doc.fontSize(8)
      .fillColor(labelColor)
      .text(
        `Generated: ${new Date().toLocaleDateString("en-GB", { 
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        })} | Page ${pageNum}`,
        50, doc.page.height - 35,
        { align: "center", width: pageWidth }
      );
  };

  const addSection = (title) => {
    if (y > doc.page.height - 60) {
      addPageBreak();
    }
    
    y += sectionPadding;
    
    // Section background
    doc.rect(40, y, pageWidth, sectionTitleHeight).fill(sectionBg);
    
    doc.fillColor(headerBg)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(title, 50, y + 5);
    
    y += sectionTitleHeight + sectionPadding;
  };

  const addField = (label, value, options = {}) => {
    if (y > doc.page.height - 50) {
      addPageBreak();
    }
    
    const { color = valueColor, bold = false } = options;
    const displayValue = value !== undefined && value !== null ? String(value) : "N/A";
    
    doc.fontSize(9)
      .font("Helvetica")
      .fillColor(labelColor)
      .text(label + ":", 50, y, { width: col1Width });
    
    doc.fontSize(9)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fillColor(color)
      .text(displayValue, col2X, y, { width: pageWidth - col1Width - 10 });
    
    y += lineHeight;
  };

  const addMultiField = (label, values) => {
    if (y > doc.page.height - 50) {
      addPageBreak();
    }
    
    doc.fontSize(9)
      .font("Helvetica")
      .fillColor(labelColor)
      .text(label + ":", 50, y, { width: col1Width });
    
    let x = col2X;
    values.forEach((v, i) => {
      const text = String(v || "N/A");
      doc.fontSize(9)
        .font("Helvetica")
        .fillColor(valueColor)
        .text(text, x, y, { width: 100 });
      x += 110;
    });
    
    y += lineHeight;
  };

  const addStatusField = (label, status) => {
    if (y > doc.page.height - 50) {
      addPageBreak();
    }
    
    const statusText = String(status || "N/A").toUpperCase();
    const statusColor = getStatusColor(status);
    const statusBg = getStatusBg(status);
    
    doc.fontSize(9)
      .font("Helvetica")
      .fillColor(labelColor)
      .text(label + ":", 50, y, { width: col1Width });
    
    // Draw badge
    const textWidth = doc.widthOfString(statusText);
    doc.roundedRect(col2X, y - 1, textWidth + 12, 14, 3).fill(statusBg);
    doc.fillColor(statusColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(statusText, col2X + 6, y + 1);
    
    y += lineHeight;
  };

  const addMoneyField = (label, amount, currency = "₦") => {
    if (y > doc.page.height - 50) {
      addPageBreak();
    }
    
    const displayValue = amount ? `${currency}${Number(amount).toLocaleString()}` : "N/A";
    
    doc.fontSize(9)
      .font("Helvetica")
      .fillColor(labelColor)
      .text(label + ":", 50, y, { width: col1Width });
    
    doc.fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(valueColor)
      .text(displayValue, col2X, y, { width: 150 });
    
    y += lineHeight;
  };

  // ==================== BUILD PDF ====================
  addHeader();
  addFooter();

  // Firm Information Section
  addSection("Firm Information");
  addField("Firm Name", firm?.name);
  addField("Email", firm?.email);
  addField("Phone", firm?.phone);
  addField("Address", firm?.address);
  if (firm?.city || firm?.state) {
    addField("Location", [firm?.city, firm?.state].filter(Boolean).join(", "));
  }

  // Matter Information Section
  addSection("Matter Information");
  addField("Matter Number", matter?.matterNumber);
  addField("Title", matter?.title);
  addStatusField("Status", matter?.status);
  addStatusField("Priority", matter?.priority);
  addField("Date Opened", matter?.dateOpened ? new Date(matter.dateOpened).toLocaleDateString("en-GB") : null);
  addField("Client", matter?.client ? `${matter.client.firstName} ${matter.client.lastName}` : null);
  if (matter?.client?.email) addField("Client Email", matter.client.email);
  if (matter?.client?.phone) addField("Client Phone", matter.client.phone);
  if (matter?.assignedTo) {
    addField("Assigned To", `${matter.assignedTo.firstName} ${matter.assignedTo.lastName}`);
  }

  // Transaction Details Section
  addSection("Transaction Details");
  addField("Transaction Type", propertyDetails?.transactionType?.replace(/_/g, " ").toUpperCase());
  addField("Payment Terms", propertyDetails?.paymentTerms?.replace(/-/g, " ").toUpperCase());

  // Financial Information Section
  addSection("Financial Information");
  
  if (propertyDetails?.purchasePrice?.amount) {
    addMoneyField("Purchase Price", propertyDetails.purchasePrice.amount, "₦");
  }
  
  if (propertyDetails?.rentAmount?.amount) {
    const freq = propertyDetails.rentAmount.frequency || "";
    addField("Rent Amount", `${formatCurrency(propertyDetails.rentAmount.amount, "₦")} / ${freq}`);
  }
  
  if (propertyDetails?.securityDeposit?.amount) {
    addMoneyField("Security Deposit", propertyDetails.securityDeposit.amount, "₦");
  }
  
  addMoneyField("Amount Paid", propertyDetails?.amountPaid);
  addMoneyField("Balance", propertyDetails?.balance);

  // Lease Information Section
  if (["lease", "sublease", "tenancy_matter"].includes(propertyDetails?.transactionType)) {
    addSection("Lease Agreement");
    
    const lease = propertyDetails?.leaseAgreement || {};
    
    addStatusField("Lease Status", lease?.status);
    addField("Commencement Date", lease?.commencementDate ? new Date(lease.commencementDate).toLocaleDateString("en-GB") : null);
    addField("Expiry Date", lease?.expiryDate ? new Date(lease.expiryDate).toLocaleDateString("en-GB") : null);
    
    if (lease?.duration) {
      const years = lease.duration.years || 0;
      const months = lease.duration.months || 0;
      addField("Duration", `${years} year(s), ${months} month(s)`);
    }
    
    addField("Renewal Option", lease?.renewalOption ? "Yes" : "No");

    // Time Remaining
    if (lease?.expiryDate) {
      const daysRemaining = Math.ceil((new Date(lease.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      let timeText, timeColor;
      
      if (daysRemaining < 0) {
        timeText = `Expired ${Math.abs(daysRemaining)} days ago`;
        timeColor = errorColor;
      } else if (daysRemaining <= 7) {
        timeText = `${daysRemaining} days - CRITICAL`;
        timeColor = errorColor;
      } else if (daysRemaining <= 30) {
        timeText = `${daysRemaining} days - WARNING`;
        timeColor = warningColor;
      } else if (daysRemaining <= 90) {
        timeText = `${daysRemaining} days - NOTICE`;
        timeColor = accentColor;
      } else {
        timeText = `${daysRemaining} days`;
        timeColor = successColor;
      }
      
      addField("Time Remaining", timeText, { color: timeColor, bold: true });
    }

    // Alert Settings
    if (propertyDetails?.leaseAlertSettings?.enabled) {
      addSection("Alert Settings");
      addField("Alerts Enabled", "Yes");
      addField("Email Notifications", propertyDetails.leaseAlertSettings.emailNotification ? "Yes" : "No");
      addField("SMS Notifications", propertyDetails.leaseAlertSettings.smsNotification ? "Yes" : "No");
      addField("Notify Landlord", propertyDetails.leaseAlertSettings.notifyLandlord ? "Yes" : "No");
      addField("Notify Tenant", propertyDetails.leaseAlertSettings.notifyTenant ? "Yes" : "No");
    }

    // Renewal Tracking
    if (propertyDetails?.renewalTracking?.renewalInitiated) {
      addSection("Renewal Tracking");
      addStatusField("Renewal Status", propertyDetails.renewalTracking.renewalStatus);
      
      if (propertyDetails.renewalTracking.renewalInitiatedDate) {
        addField("Initiated Date", new Date(propertyDetails.renewalTracking.renewalInitiatedDate).toLocaleDateString("en-GB"));
      }
      
      if (propertyDetails.renewalTracking.renewalDeadline) {
        addField("Renewal Deadline", new Date(propertyDetails.renewalTracking.renewalDeadline).toLocaleDateString("en-GB"));
      }
      
      if (propertyDetails.renewalTracking.renewalNoticePeriod) {
        addField("Notice Period", `${propertyDetails.renewalTracking.renewalNoticePeriod} days`);
      }
      
      if (propertyDetails.renewalTracking.proposedNewRent?.amount) {
        addMoneyField("Proposed New Rent", propertyDetails.renewalTracking.proposedNewRent.amount, "₦");
      }
      
      if (propertyDetails.renewalTracking.rentIncreasePercentage) {
        addField("Proposed Increase", `+${propertyDetails.renewalTracking.rentIncreasePercentage}%`);
      }
      
      if (propertyDetails.renewalTracking.renewalTerms) {
        addField("Renewal Terms", propertyDetails.renewalTracking.renewalTerms);
      }
      
      if (propertyDetails.renewalTracking.negotiationsHistory?.length > 0) {
        addSection("Negotiation History");
        propertyDetails.renewalTracking.negotiationsHistory.forEach((neg, idx) => {
          addField(
            `Negotiation ${idx + 1}`,
            `${neg.proposedBy === "landlord" ? "Landlord" : "Tenant"}: ₦${Number(neg.proposedAmount).toLocaleString()} - ${neg.response?.toUpperCase() || "PENDING"}`
          );
        });
      }
    }

    // Milestones
    if (propertyDetails?.leaseMilestones?.length > 0) {
      addSection("Lease Milestones");
      propertyDetails.leaseMilestones.forEach((milestone) => {
        const statusColor = getStatusColor(milestone.status);
        addField(
          milestone.title,
          `${milestone.status?.toUpperCase() || "PENDING"}${milestone.targetDate ? " | Target: " + new Date(milestone.targetDate).toLocaleDateString("en-GB") : ""}`,
          { color: statusColor }
        );
      });
    }
  }

  // Parties Involved Section
  addSection("Parties Involved");
  
  if (propertyDetails?.landlord?.name) {
    addField("Landlord Name", propertyDetails.landlord.name);
    if (propertyDetails.landlord.contact) addField("Landlord Contact", propertyDetails.landlord.contact);
    if (propertyDetails.landlord.address) addField("Landlord Address", propertyDetails.landlord.address);
    if (propertyDetails.landlord.email) addField("Landlord Email", propertyDetails.landlord.email);
  }
  
  if (propertyDetails?.tenant?.name) {
    addField("Tenant Name", propertyDetails.tenant.name);
    if (propertyDetails.tenant.contact) addField("Tenant Contact", propertyDetails.tenant.contact);
    if (propertyDetails.tenant.address) addField("Tenant Address", propertyDetails.tenant.address);
    if (propertyDetails.tenant.email) addField("Tenant Email", propertyDetails.tenant.email);
  }
  
  if (propertyDetails?.vendor?.name) {
    addField("Vendor Name", propertyDetails.vendor.name);
    if (propertyDetails.vendor.contact) addField("Vendor Contact", propertyDetails.vendor.contact);
  }
  
  if (propertyDetails?.purchaser?.name) {
    addField("Purchaser Name", propertyDetails.purchaser.name);
    if (propertyDetails.purchaser.contact) addField("Purchaser Contact", propertyDetails.purchaser.contact);
  }

  // Property Information Section
  if (propertyDetails?.properties?.length > 0) {
    addSection("Property Information");
    
    propertyDetails.properties.forEach((prop, idx) => {
      if (propertyDetails.properties.length > 1) {
        y += 5;
        doc.fontSize(10).font("Helvetica-Bold").fillColor(headerBg)
          .text(`Property ${idx + 1}`, 50, y);
        y += lineHeight;
      }
      
      if (prop?.address) addField("Address", prop.address);
      if (prop?.state) addField("State", prop.state);
      if (prop?.lga) addField("LGA", prop.lga);
      if (prop?.propertyType) addField("Property Type", prop.propertyType.replace(/_/g, " ").toUpperCase());
      if (prop?.titleDocument) addField("Title Document", prop.titleDocument.replace(/-/g, " ").toUpperCase());
      if (prop?.landSize?.value) {
        addField("Land Size", `${prop.landSize.value.toLocaleString()} ${prop.landSize.unit || ""}`);
      }
      if (prop?.buildingType) addField("Building Type", prop.buildingType);
      if (prop?.numberOfRooms) addField("Number of Rooms", prop.numberOfRooms);
      if (prop?.propertyId) addField("Property ID", prop.propertyId);
    });
  }

  // Legal Status Section
  addSection("Legal Status");
  
  const contract = propertyDetails?.contractOfSale || {};
  addStatusField("Contract of Sale", contract?.status);
  if (contract?.executionDate) addField("Contract Execution Date", new Date(contract.executionDate).toLocaleDateString("en-GB"));
  if (contract?.completionDate) addField("Contract Completion Date", new Date(contract.completionDate).toLocaleDateString("en-GB"));

  const govConsent = propertyDetails?.governorsConsent || {};
  addStatusField("Governor's Consent", govConsent?.status);
  if (govConsent?.isRequired !== undefined) addField("Consent Required", govConsent.isRequired ? "Yes" : "No");
  if (govConsent?.applicationDate) addField("Application Date", new Date(govConsent.applicationDate).toLocaleDateString("en-GB"));
  if (govConsent?.approvalDate) addField("Approval Date", new Date(govConsent.approvalDate).toLocaleDateString("en-GB"));
  if (govConsent?.referenceNumber) addField("Reference Number", govConsent.referenceNumber);

  const deed = propertyDetails?.deedOfAssignment || {};
  addStatusField("Deed of Assignment", deed?.status);
  if (deed?.executionDate) addField("Deed Execution Date", new Date(deed.executionDate).toLocaleDateString("en-GB"));
  if (deed?.registrationDate) addField("Registration Date", new Date(deed.registrationDate).toLocaleDateString("en-GB"));
  if (deed?.registrationNumber) addField("Registration Number", deed.registrationNumber);

  // Due Diligence Section
  addSection("Due Diligence");
  
  const titleSearch = propertyDetails?.titleSearch || {};
  addStatusField("Title Search", titleSearch.isCompleted ? "Completed" : "Pending");
  if (titleSearch?.searchDate) addField("Title Search Date", new Date(titleSearch.searchDate).toLocaleDateString("en-GB"));
  if (titleSearch?.findings) addField("Title Search Findings", titleSearch.findings);
  if (titleSearch?.encumbrances?.length > 0) {
    addField("Encumbrances", titleSearch.encumbrances.join(", "));
  }

  const inspection = propertyDetails?.physicalInspection || {};
  addStatusField("Physical Inspection", inspection.isCompleted ? "Completed" : "Pending");
  if (inspection?.inspectionDate) addField("Inspection Date", new Date(inspection.inspectionDate).toLocaleDateString("en-GB"));
  if (inspection?.findings) addField("Inspection Findings", inspection.findings);
  if (inspection?.inspectorName) addField("Inspector", inspection.inspectorName);

  const survey = propertyDetails?.surveyPlan || {};
  addStatusField("Survey Plan", survey.isAvailable ? "Available" : "Not Available");
  if (survey?.surveyNumber) addField("Survey Number", survey.surveyNumber);
  if (survey?.surveyDate) addField("Survey Date", new Date(survey.surveyDate).toLocaleDateString("en-GB"));

  // Payment Schedule Section
  if (propertyDetails?.paymentSchedule?.length > 0) {
    addSection("Payment Schedule");
    
    const payments = propertyDetails.paymentSchedule;
    
    // Table
    const tableTop = y;
    const colWidths = [30, 90, 90, 70, 80];
    const headers = ["#", "Due Date", "Amount", "Status", "Paid Date"];
    
    // Header row
    doc.rect(40, y, pageWidth, 18).fill(accentColor);
    let x = 45;
    headers.forEach((h, i) => {
      doc.fillColor(white).fontSize(8).font("Helvetica-Bold").text(h, x, y + 5);
      x += colWidths[i];
    });
    y += 22;
    
    // Data rows
    payments.forEach((payment) => {
      if (y > doc.page.height - 40) {
        addPageBreak();
      }
      
      const statusColor = getStatusColor(payment.status);
      
      x = 45;
      const rowData = [
        `#${payment.installmentNumber || "?"}`,
        payment.dueDate ? new Date(payment.dueDate).toLocaleDateString("en-GB") : "-",
        `₦${Number(payment.amount || 0).toLocaleString()}`,
        (payment.status || "pending").toUpperCase(),
        payment.paidDate ? new Date(payment.paidDate).toLocaleDateString("en-GB") : "-"
      ];
      
      rowData.forEach((cell, i) => {
        doc.fillColor(i === 3 ? statusColor : valueColor)
          .fontSize(8)
          .font(i === 3 ? "Helvetica-Bold" : "Helvetica")
          .text(cell, x, y, { width: colWidths[i] - 5 });
        x += colWidths[i];
      });
      
      y += 18;
    });
    
    y += 10;
  }

  // Conditions Section
  if (propertyDetails?.conditions?.length > 0) {
    addSection("Conditions");
    propertyDetails.conditions.forEach((condition) => {
      const statusColor = getStatusColor(condition.status);
      addField(
        condition.condition || "Condition",
        `${condition.status?.toUpperCase() || "PENDING"}${condition.dueDate ? " | Due: " + new Date(condition.dueDate).toLocaleDateString("en-GB") : ""}`,
        { color: statusColor }
      );
    });
  }

  // Finalize
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

function formatCurrency(amount, symbol = "₦") {
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
}

module.exports = { generatePdf };
