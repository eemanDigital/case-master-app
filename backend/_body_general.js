// SPLICED INTO generalController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
exports.generateGeneralReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const Firm = require("../models/firmModel");
  const { COLORS, formatCurrency } = require("../utils/generateGenericPdf");

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "general",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No general matter found with that ID", 404));
  }

  const d =
    (await GeneralDetail.findOne({ matterId, firmId })
      .populate("createdBy", "firstName lastName")
      .populate("lastModifiedBy", "firstName lastName")) || {};
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "General Matter Report",
    headerTitle: "General Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
    subtitle: matter?.title || "",
    firmContact: buildFirmContact(firm),
  });

  pdf.init(
    res,
    path.resolve(
      __dirname,
      `../output/${matter.matterNumber}_general_report_${Date.now()}.pdf`,
    ),
  );
  pdf.addHeader();

  // ── Helpers (self-contained per this report) ──────────────────────────────
  const h = (v) => (v == null || String(v).trim() === "" ? "—" : v);
  const titleCase = (v) =>
    String(v || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const labelOf = (map, v) => (v == null || v === "" ? "—" : map[v] || titleCase(v));
  const fmtDate = (v) => (v ? formatDate(v) : "—");
  const money = (m) => {
    if (m == null) return "—";
    if (typeof m === "object" && m.amount != null)
      return formatCurrency(m.amount, m.currency || "NGN");
    if (typeof m === "number") return formatCurrency(m, "NGN");
    return "—";
  };
  const personName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";
  const clientName = (c) =>
    c?.companyName ||
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    c?.email ||
    "—";
  const statusAccent = (s) => {
    const x = String(s || "").toLowerCase();
    if (["completed", "delivered", "approved", "met", "paid"].includes(x)) return COLORS.success;
    if (["active", "pending", "in-progress", "draft"].includes(x)) return COLORS.info;
    if (["withdrawn", "rejected", "overdue", "not-applicable", "cancelled"].includes(x)) return COLORS.warning;
    return COLORS.navyMid;
  };
  function buildFirmContact(firm) {
    const c = firm?.contact || {};
    const parts = [];
    if (c.address) {
      const seen = new Set();
      const addr = [c.address.street, c.address.city, c.address.state]
        .filter(Boolean)
        .filter((part) => {
          const k = String(part).trim().toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .join(", ");
      if (addr) parts.push(addr);
    }
    if (c.phone) parts.push(c.phone);
    if (c.email) parts.push(c.email);
    if (c.rcNumber) {
      const rc = String(c.rcNumber).trim();
      parts.push(/^rc/i.test(rc) ? rc : `RC ${rc}`);
    }
    return parts.join("   ·   ");
  }

  // ── Label maps (from generalDetailModel enums) ─────────────────────────────
  const SERVICE_TYPE_LABELS = {
    "notarial-services": "Notarial Services",
    "cac-registration": "CAC Registration",
    "perfection-of-title": "Perfection of Title",
    litigation: "Litigation",
    arbitration: "Arbitration",
    mediation: "Mediation",
    "legal-opinion": "Legal Opinion",
    drafting: "Contract Drafting",
    attestation: "Document Attestation",
    certification: "Document Certification",
    verification: "Document Verification",
    "regulatory-filing": "Regulatory Filing",
    other: "Other",
  };
  const BILLING_TYPE_LABELS = {
    "fixed-fee": "Fixed Fee",
    "lpro-scale": "LPRO Scale",
    percentage: "Percentage Based",
    hybrid: "Hybrid",
  };

  const stages = d.projectStages || [];
  const completedStages = stages.filter((s) => s.isCompleted).length;
  const tw = d.totalWithTax || {};
  const baseFee = tw.baseFee || 0;

  // ── Matter overview (KPI cards) ───────────────────────────────────────────
  pdf.addSection("Matter Overview");
  pdf.addKpiCards([
    {
      label: "Service Type",
      value: labelOf(SERVICE_TYPE_LABELS, d.serviceType),
      accent: COLORS.navyMid,
    },
    { label: "Fee", value: baseFee ? formatCurrency(baseFee) : "—", accent: COLORS.gold },
    {
      label: "Progress",
      value: stages.length ? `${completedStages}/${stages.length}` : "—",
      accent: COLORS.info,
    },
    { label: "Status", value: titleCase(matter.status), accent: statusAccent(matter.status) },
  ]);

  pdf.addKeyValueGrid(
    [
      { label: "Matter Number", value: matter.matterNumber, bold: true },
      { label: "Status", value: titleCase(matter.status), bold: true },
      { label: "Priority", value: titleCase(matter.priority) },
      { label: "Date Opened", value: fmtDate(matter.dateOpened) },
      { label: "Expected Closure", value: fmtDate(matter.expectedClosureDate) },
      { label: "Billing Type", value: titleCase(matter.billingType) },
      { label: "Client", value: clientName(matter.client), bold: true },
      { label: "Reference", value: matter.officeFileNo || "—" },
    ],
    { cols: 2 },
  );

  // ── Client & team ─────────────────────────────────────────────────────────
  pdf.addSection("Client & Legal Team");
  pdf.addKeyValueGrid(
    [
      { label: "Client", value: clientName(matter.client), bold: true },
      { label: "Client Company", value: matter.client?.companyName || "—" },
      { label: "Client Email", value: matter.client?.email || "—" },
      { label: "Client Phone", value: matter.client?.phone || "—" },
      { label: "Account Officer(s)", value: (matter.accountOfficer || []).map(personName).join(", ") || "—" },
      { label: "Reference", value: matter.officeFileNo || "—" },
    ],
    { cols: 2 },
  );

  // ── Service information ───────────────────────────────────────────────────
  pdf.addSection("Service Information");
  pdf.addKeyValueGrid(
    [
      { label: "Service Type", value: labelOf(SERVICE_TYPE_LABELS, d.serviceType), bold: true },
      { label: "Other Service", value: h(d.otherServiceType) },
      { label: "Request Date", value: fmtDate(d.requestDate) },
      { label: "Expected Completion", value: fmtDate(d.expectedCompletionDate) },
      { label: "Actual Completion", value: fmtDate(d.actualCompletionDate) },
      { label: "Jurisdiction", value: h(d.jurisdiction?.state) },
    ],
    { cols: 2 },
  );
  if (d.serviceDescription)
    pdf.addLongTextField("Service Description", d.serviceDescription);

  // ── Billing & tax summary ─────────────────────────────────────────────────
  pdf.addSection("Billing & Tax Summary");
  pdf.addKeyValueGrid(
    [
      { label: "Billing Type", value: labelOf(BILLING_TYPE_LABELS, d.billing?.billingType), bold: true },
      {
        label: "Fixed Fee",
        value: d.billing?.billingType === "fixed-fee" ? money(d.billing?.fixedFee) : "—",
      },
      {
        label: "LPRO Scale",
        value:
          d.billing?.billingType === "lpro-scale"
            ? `${h(d.billing?.lproScale?.scale)}${d.billing?.lproScale?.reference ? ` (${d.billing.lproScale.reference})` : ""}`
            : "—",
      },
      {
        label: "LPRO Amount",
        value:
          d.billing?.lproScale?.calculatedAmount != null
            ? formatCurrency(d.billing.lproScale.calculatedAmount)
            : "—",
      },
      {
        label: "Percentage Fee",
        value:
          d.billing?.percentage?.calculatedFee != null
            ? `${formatCurrency(d.billing.percentage.calculatedFee)}${d.billing.percentage.rate != null ? ` @ ${d.billing.percentage.rate}%` : ""}`
            : "—",
      },
      { label: "Fee (Base)", value: formatCurrency(tw.baseFee || 0) },
      { label: "VAT", value: `${tw.vat != null ? formatCurrency(tw.vat) : "—"}${d.billing?.applyVAT ? ` (${d.billing.vatRate || 7.5}%)` : ""}` },
      { label: "WHT", value: `${tw.wht != null ? formatCurrency(tw.wht) : "—"}${d.billing?.applyWHT ? ` (${d.billing.whtRate || 5}%)` : ""}` },
      { label: "Gross (With Tax)", value: tw.gross != null ? formatCurrency(tw.gross) : "—" },
      { label: "Net (After WHT)", value: tw.net != null ? formatCurrency(tw.net) : "—" },
      { label: "Disbursements", value: tw.disbursements != null ? formatCurrency(tw.disbursements) : "—" },
      { label: "Grand Total", value: tw.grandTotal != null ? formatCurrency(tw.grandTotal) : "—", bold: true },
    ],
    { cols: 2 },
  );

  // ── Project stages ────────────────────────────────────────────────────────
  if (stages.length) {
    pdf.addSection("Project Stages");
    pdf.addDataTable(
      ["Stage", "Expected", "Actual", "Amount", "Paid", "Completed"],
      stages.map((s) => [
        s.stageName || "—",
        fmtDate(s.expectedDate),
        fmtDate(s.actualDate),
        formatCurrency(s.amount || 0),
        s.isPaid ? "Paid" : "Pending",
        s.isCompleted ? "Completed" : "Pending",
      ]),
      {
        widths: [2.2, 1.1, 1.1, 1.2, 1, 1.2],
        statusColumns: [4, 5],
      },
    );
  }

  // ── Parties involved ──────────────────────────────────────────────────────
  if ((d.partiesInvolved || []).length) {
    pdf.addSection("Parties Involved");
    pdf.addDataTable(
      ["Name", "Role", "Contact"],
      (d.partiesInvolved || []).map((p) => [
        p.name || "—",
        p.role || "—",
        p.contact || "—",
      ]),
      { widths: [2.4, 1.6, 2.4] },
    );
  }

  // ── Deliverables ──────────────────────────────────────────────────────────
  if ((d.expectedDeliverables || []).length) {
    pdf.addSection("Deliverables");
    pdf.addDataTable(
      ["Deliverable", "Due Date", "Delivered", "Status"],
      (d.expectedDeliverables || []).map((del) => [
        h(del.deliverable),
        fmtDate(del.dueDate),
        fmtDate(del.deliveryDate),
        titleCase(del.status || "pending"),
      ]),
      { widths: [2.8, 1.1, 1.1, 1.2], statusColumns: [3] },
    );
  }

  // ── Documents received ────────────────────────────────────────────────────
  if ((d.documentsReceived || []).length) {
    pdf.addSection("Documents Received");
    pdf.addDataTable(
      ["Document", "Type", "Received", "Kept by Firm"],
      (d.documentsReceived || []).map((doc) => [
        h(doc.docName),
        titleCase(doc.docType || "other"),
        fmtDate(doc.receivedDate),
        doc.originalKeptByFirm ? "Yes" : "No",
      ]),
      { widths: [3, 1.6, 1.4, 1.2] },
    );
  }

  // ── Disbursements ─────────────────────────────────────────────────────────
  if ((d.disbursements || []).length) {
    pdf.addSection("Disbursements");
    pdf.addDataTable(
      ["Item", "Category", "Estimated", "Actual", "Incurred"],
      (d.disbursements || []).map((disb) => [
        h(disb.item),
        titleCase(disb.category || "other"),
        disb.estimatedAmount != null ? formatCurrency(disb.estimatedAmount) : "—",
        disb.actualAmount != null ? formatCurrency(disb.actualAmount) : "—",
        fmtDate(disb.incurredDate),
      ]),
      { widths: [2.2, 1.4, 1.4, 1.4, 1.2] },
    );
  }
  if (d.totalDisbursements != null) {
    pdf.addField("Total Disbursements", formatCurrency(d.totalDisbursements));
  }

  // ── Court appearances ─────────────────────────────────────────────────────
  if ((d.courtAppearances || []).length) {
    pdf.addSection("Court Appearances");
    pdf.addDataTable(
      ["Date", "Court", "Purpose", "Outcome"],
      (d.courtAppearances || []).map((a) => [
        fmtDate(a.appearanceDate),
        h(a.court),
        titleCase(a.purpose || "other"),
        h(a.outcome),
      ]),
      { widths: [1.3, 2.2, 1.5, 2] },
    );
  }

  // ── Specific requirements ─────────────────────────────────────────────────
  if ((d.specificRequirements || []).length) {
    pdf.addSection("Requirements");
    pdf.addDataTable(
      ["Requirement", "Status"],
      (d.specificRequirements || []).map((r) => [
        h(r.requirement),
        titleCase(r.status || "pending"),
      ]),
      { widths: [4.5, 1.5], statusColumns: [1] },
    );
  }

  // ── NBA stamp & jurisdiction ──────────────────────────────────────────────
  if (d.requiresNBAStamp || d.jurisdiction?.state) {
    pdf.addSection("NBA Stamp & Jurisdiction");
    pdf.addKeyValueGrid(
      [
        { label: "NBA Stamp Required", value: d.requiresNBAStamp ? "Yes" : "No" },
        { label: "Stamp Number", value: h(d.nbaStampDetails?.stampNumber) },
        { label: "Stamp Date", value: fmtDate(d.nbaStampDetails?.stampDate) },
        { label: "Stamp Value", value: d.nbaStampDetails?.stampValue != null ? formatCurrency(d.nbaStampDetails.stampValue) : "—" },
        { label: "State", value: h(d.jurisdiction?.state) },
        { label: "LGA", value: h(d.jurisdiction?.lga) },
        { label: "Court", value: h(d.jurisdiction?.court) },
      ],
      { cols: 2 },
    );
  }

  // ── Procedure notes ───────────────────────────────────────────────────────
  if (d.procedureNotes) pdf.addLongTextField("Procedure Notes", d.procedureNotes);

  // ── Audit & closing note ──────────────────────────────────────────────────
  pdf.addSection("Audit Information");
  pdf.addKeyValueGrid(
    [
      { label: "Created By", value: d.createdBy ? personName(d.createdBy) : "—" },
      { label: "Created At", value: fmtDate(d.createdAt) },
      { label: "Last Modified By", value: d.lastModifiedBy ? personName(d.lastModifiedBy) : "—" },
      { label: "Last Modified At", value: fmtDate(d.updatedAt) },
    ],
    { cols: 2 },
  );

  pdf.addNote(
    `This report was generated from ${firm?.name || "the firm's"} matter management system on ${formatDate(
      new Date(),
    )}. It reflects the information recorded against matter ${
      matter.matterNumber
    } at the time of generation and is confidential to the firm and its client.`,
    { type: "gold" },
  );

  await pdf.generate();
}