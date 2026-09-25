// SPLICED INTO propertyController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
exports.generatePropertyReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const Firm = require("../models/firmModel");
  const { COLORS, formatCurrency } = require("../utils/generateGenericPdf");

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "property",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No property matter found with that ID", 404));
  }

  const d = (await PropertyDetail.findOne({ matterId, firmId })) || {};
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Property Matter Report",
    headerTitle: "Property Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
    subtitle: matter?.title || "",
    firmContact: buildFirmContact(firm),
  });

  pdf.init(
    res,
    path.resolve(
      __dirname,
      `../output/${matter.matterNumber}_property_report_${Date.now()}.pdf`,
    ),
  );
  pdf.addHeader();

  // ── Helpers (self-contained per this report) ──────────────────────────────
  const h = (v) => (v == null || String(v).trim() === "" ? "—" : v);
  const cols = (arr) => (arr || []).map((p) => p?.name || p).filter(Boolean);
  const namesOf = (val) =>
    Array.isArray(val) ? cols(val).join(", ") || "—" : h(val?.name || val);
  const personName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";
  const clientName = (c) =>
    c?.companyName ||
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    c?.email ||
    "—";
  const titleCase = (v) =>
    String(v || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const fmtDate = (v) => (v ? formatDate(v) : "—");
  const money = (m) => {
    if (m == null) return "—";
    if (typeof m === "object" && m.amount != null)
      return formatCurrency(m.amount, m.currency || "NGN");
    if (typeof m === "number") return formatCurrency(m, "NGN");
    return "—";
  };
  const enumLabel = (map, v) => (v == null || v === "" ? "—" : map[v] || titleCase(v));
  const statusAccent = (s) => {
    const x = String(s || "").toLowerCase();
    if (["completed", "approved", "executed", "registered", "paid", "met"].includes(x)) return COLORS.success;
    if (["active", "pending", "draft", "in-progress", "agreed"].includes(x)) return COLORS.info;
    if (["overdue", "rejected", "terminated", "expired", "not-required", "skipped", "disputed", "declined"].includes(x)) return COLORS.warning;
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

  // ── Label maps (from propertyDetailModel enums) ───────────────────────────
  const TX_TYPE_LABELS = {
    purchase: "Purchase",
    sale: "Sale",
    lease: "Lease",
    sublease: "Sublease",
    mortgage: "Mortgage",
    property_development: "Property Development",
    land_acquisition: "Land Acquisition",
    title_perfection: "Title Perfection",
    boundary_dispute: "Boundary Dispute",
    tenancy_matter: "Tenancy Matter",
    property_management: "Property Management",
    foreclosure: "Foreclosure",
    partition: "Partition",
    right_of_way: "Right of Way",
    easement: "Easement",
    other: "Other",
  };
  const PROPERTY_TYPE_LABELS = {
    residential: "Residential",
    commercial: "Commercial",
    industrial: "Industrial",
    agricultural: "Agricultural",
    "mixed-use": "Mixed Use",
    land: "Land",
  };
  const STATUS_LABELS = {
    pending: "Pending",
    paid: "Paid",
    overdue: "Overdue",
    waived: "Waived",
    completed: "Completed",
    skipped: "Skipped",
    executed: "Executed",
    active: "Active",
    expired: "Expired",
    terminated: "Terminated",
    draft: "Draft",
    "in-progress": "In Progress",
    agreed: "Agreed",
    disputed: "Disputed",
    declined: "Declined",
    approved: "Approved",
    rejected: "Rejected",
    "not-required": "Not Required",
    "not-initiated": "Not Initiated",
    met: "Met",
    registered: "Registered",
  };
  const lbl = (v) => STATUS_LABELS[v] || titleCase(v);

  // ── Key performance cards ─────────────────────────────────────────────────
  const nextPayment = (d.paymentSchedule || []).find(
    (p) => p.status === "pending" && p.dueDate,
  );
  const propertyCount = (d.properties || []).length;
  pdf.addKpiCards([
    {
      label: "Transaction Type",
      value: enumLabel(TX_TYPE_LABELS, d.transactionType),
      accent: COLORS.navyMid,
    },
    {
      label: "Properties",
      value: String(propertyCount),
      accent: COLORS.info,
    },
    {
      label: "Next Payment",
      value: nextPayment ? fmtDate(nextPayment.dueDate) : "—",
      accent: COLORS.gold,
    },
    {
      label: "Title / Consent",
      value:
        d.governorsConsent?.status === "approved"
          ? "Approved"
          : d.titleSearch?.isCompleted
            ? "Title Cleared"
            : "Pending",
      accent: statusAccent(d.governorsConsent?.status || d.titleSearch?.isCompleted ? "approved" : "pending"),
    },
  ]);

  // ── Matter overview ────────────────────────────────────────────────────────
  pdf.addSection("Matter Overview");
  pdf.addKeyValueGrid(
    [
      { label: "Matter Number", value: h(matter.matterNumber), bold: true },
      { label: "Status", value: lbl(matter.status), bold: true },
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

  // ── Transaction summary ────────────────────────────────────────────────────
  pdf.addSection("Transaction Summary");
  pdf.addKeyValueGrid(
    [
      {
        label: "Transaction Type",
        value: enumLabel(TX_TYPE_LABELS, d.transactionType),
        bold: true,
      },
      { label: "Other Type", value: h(d.otherTransactionType) },
      { label: "Purchase Price", value: money(d.purchasePrice), bold: true },
      {
        label: "Rent Amount",
        value:
          d.rentAmount?.amount != null
            ? `${money(d.rentAmount)} / ${lbl(d.rentAmount.frequency)}`
            : "—",
      },
      { label: "Security Deposit", value: money(d.securityDeposit) },
      {
        label: "Payment Terms",
        value: enumLabel(
          { "lump-sum": "Lump Sum", installments: "Installments", mortgage: "Mortgage", other: "Other" },
          d.paymentTerms,
        ),
      },
    ],
    { cols: 2 },
  );

  // ── Properties ─────────────────────────────────────────────────────────────
  pdf.addSection("Properties");
  pdf.addKeyValueGrid(
    (d.properties || []).flatMap((p) => [
      { label: "Property Type", value: enumLabel(PROPERTY_TYPE_LABELS, p.propertyType), bold: true },
      { label: "Address", value: h(p.address) },
      { label: "Location", value: [p.state, p.lga].filter(Boolean).join(", ") || "—" },
      {
        label: "Land Size",
        value:
          p.landSize?.value != null
            ? `${p.landSize.value} ${p.landSize.unit || ""}`.trim()
            : "—",
      },
      { label: "Title Document", value: titleCase(p.titleDocument) },
      { label: "Title Number", value: h(p.titleNumber) },
    ]),
    { cols: 2 },
  );

  // ── Parties ────────────────────────────────────────────────────────────────
  const partyRow = (title, p) => {
    if (p?.name != null && p.name !== "") return { label: title, value: namesOf(p.name), bold: true };
    return null;
  };
  pdf.addSection("Parties");
  pdf.addKeyValueGrid(
    [
      partyRow("Vendor", d.vendor),
      partyRow("Purchaser", d.purchaser),
      partyRow("Landlord", d.landlord),
      partyRow("Tenant", d.tenant),
    ]
      .filter(Boolean)
      .concat([
        { label: "Vendor Contact", value: h(d.vendor?.contact) },
        { label: "Purchaser Contact", value: h(d.purchaser?.contact) },
        { label: "Landlord Contact", value: h(d.landlord?.contact) },
        { label: "Tenant Contact", value: h(d.tenant?.contact) },
      ]),
    { cols: 2 },
  );

  // ── Contract & lease agreement ─────────────────────────────────────────────
  if (d.contractOfSale) {
    pdf.addSection("Contract of Sale");
    pdf.addKeyValueGrid(
      [
        { label: "Execution Date", value: fmtDate(d.contractOfSale.executionDate) },
        { label: "Completion Date", value: fmtDate(d.contractOfSale.completionDate) },
        { label: "Status", value: lbl(d.contractOfSale.status) },
      ],
      { cols: 2 },
    );
  }

  if (d.leaseAgreement) {
    pdf.addSection("Lease Agreement");
    pdf.addKeyValueGrid(
      [
        { label: "Commencement Date", value: fmtDate(d.leaseAgreement.commencementDate) },
        { label: "Expiry Date", value: fmtDate(d.leaseAgreement.expiryDate) },
        {
          label: "Duration",
          value:
            d.leaseAgreement.duration?.years || d.leaseAgreement.duration?.months
              ? `${d.leaseAgreement.duration.years || 0} yr ${
                  d.leaseAgreement.duration.months || 0
                } mo`
              : "—",
        },
        { label: "Renewal Option", value: d.leaseAgreement.renewalOption ? "Yes" : "No" },
        { label: "Status", value: lbl(d.leaseAgreement.status) },
      ],
      { cols: 2 },
    );
  }

  // ── Payment schedule ───────────────────────────────────────────────────────
  if ((d.paymentSchedule || []).length) {
    pdf.addSection("Payment Schedule");
    pdf.addDataTable(
      ["No.", "Amount", "Due Date", "Paid Date", "Status"],
      (d.paymentSchedule || []).map((p) => [
        String(p.installmentNumber || ""),
        money(p),
        fmtDate(p.dueDate),
        fmtDate(p.paidDate),
        lbl(p.status),
      ]),
      { widths: [0.7, 1.6, 1.2, 1.2, 1.2], statusColumns: [4] },
    );
  }

  // ── Lease milestones & renewal ─────────────────────────────────────────────
  if ((d.leaseMilestones || []).length) {
    pdf.addSection("Lease Milestones");
    pdf.addDataTable(
      ["Milestone", "Target Date", "Completed", "Status"],
      (d.leaseMilestones || []).map((m) => [
        m.title || "—",
        fmtDate(m.targetDate),
        fmtDate(m.completedDate),
        lbl(m.status),
      ]),
      { widths: [2.8, 1.1, 1.1, 1.1], statusColumns: [3] },
    );
  }

  if (d.renewalTracking?.renewalInitiated) {
    pdf.addSection("Renewal Tracking");
    pdf.addKeyValueGrid(
      [
        { label: "Renewal Initiated", value: fmtDate(d.renewalTracking.renewalInitiatedDate) },
        { label: "Renewal Deadline", value: fmtDate(d.renewalTracking.renewalDeadline) },
        { label: "Notice Period", value: `${d.renewalTracking.renewalNoticePeriod || "—"} days` },
        { label: "Proposed Rent", value: money(d.renewalTracking.proposedNewRent) },
        { label: "Rent Increase", value: `${d.renewalTracking.rentIncreasePercentage || 0}%` },
        { label: "Renewal Status", value: lbl(d.renewalTracking.renewalStatus) },
      ],
      { cols: 2 },
    );
    if (d.renewalTracking.renewalTerms)
      pdf.addLongTextField("Renewal Terms", d.renewalTracking.renewalTerms);
    if ((d.renewalTracking.negotiationsHistory || []).length) {
      pdf.addSubSection("Negotiations History");
      pdf.addDataTable(
        ["Proposed By", "Amount", "Proposed Date", "Response"],
        d.renewalTracking.negotiationsHistory.map((n) => [
          titleCase(n.proposedBy),
          money({ amount: n.proposedAmount }),
          fmtDate(n.proposedDate),
          titleCase(n.response),
        ]),
        { widths: [1.6, 1.4, 1.3, 1.7] },
      );
    }
  }

  // ── Title & perfection ─────────────────────────────────────────────────────
  if (
    d.deedOfAssignment ||
    d.governorsConsent ||
    d.surveyPlan ||
    d.titleSearch ||
    d.physicalInspection ||
    d.development
  ) {
    pdf.addSection("Title & Perfection");
    if (d.deedOfAssignment?.status) {
      pdf.addKeyValueGrid(
        [
          { label: "Deed of Assignment", value: lbl(d.deedOfAssignment.status) },
          { label: "Execution Date", value: fmtDate(d.deedOfAssignment.executionDate) },
          { label: "Registration Date", value: fmtDate(d.deedOfAssignment.registrationDate) },
        ],
        { cols: 2 },
      );
    }
    if (d.governorsConsent?.status) {
      pdf.addKeyValueGrid(
        [
          { label: "Governor's Consent", value: lbl(d.governorsConsent.status) },
          { label: "Application Date", value: fmtDate(d.governorsConsent.applicationDate) },
          { label: "Approval Date", value: fmtDate(d.governorsConsent.approvalDate) },
          { label: "Reference Number", value: h(d.governorsConsent.referenceNumber) },
        ],
        { cols: 2 },
      );
    }
    if (d.surveyPlan?.isAvailable) {
      pdf.addKeyValueGrid(
        [
          { label: "Survey Plan", value: d.surveyPlan.isAvailable ? "Available" : "No" },
          { label: "Survey Number", value: h(d.surveyPlan.surveyNumber) },
          { label: "Survey Date", value: fmtDate(d.surveyPlan.surveyDate) },
        ],
        { cols: 2 },
      );
    }
    if (d.titleSearch) {
      pdf.addKeyValueGrid(
        [
          { label: "Title Search", value: d.titleSearch.isCompleted ? "Completed" : "Incomplete" },
          { label: "Search Date", value: fmtDate(d.titleSearch.searchDate) },
          { label: "Encumbrances", value: (d.titleSearch.encumbrances || []).join(", ") || "None" },
        ],
        { cols: 2 },
      );
      if (d.titleSearch.findings)
        pdf.addLongTextField("Title Search Findings", d.titleSearch.findings);
    }
    if (d.physicalInspection) {
      pdf.addKeyValueGrid(
        [
          { label: "Physical Inspection", value: d.physicalInspection.isCompleted ? "Completed" : "Incomplete" },
          { label: "Inspection Date", value: fmtDate(d.physicalInspection.inspectionDate) },
        ],
        { cols: 2 },
      );
      if (d.physicalInspection.findings)
        pdf.addLongTextField("Physical Inspection Findings", d.physicalInspection.findings);
    }
    if (d.development?.isApplicable) {
      pdf.addKeyValueGrid(
        [
          { label: "Planning Permit", value: lbl(d.development.planningPermit?.status) },
          { label: "Building Permit", value: lbl(d.development.buildingPermit?.status) },
          { label: "Estimated Cost", value: money(d.development.estimatedCost) },
          { label: "Expected Completion", value: fmtDate(d.development.expectedCompletion) },
        ],
        { cols: 2 },
      );
    }
  }

  // ── Conditions ─────────────────────────────────────────────────────────────
  if ((d.conditions || []).length) {
    pdf.addSection("Conditions");
    pdf.addDataTable(
      ["Condition", "Due Date", "Status"],
      (d.conditions || []).map((c) => [
        c.condition || "—",
        fmtDate(c.dueDate),
        lbl(c.status),
      ]),
      { widths: [4, 1.3, 1.3], statusColumns: [2] },
    );
  }

  // ── Lease alerts ───────────────────────────────────────────────────────────
  if (d.leaseAlertSettings?.enabled) {
    pdf.addSection("Lease Alert Settings");
    pdf.addKeyValueGrid(
      [
        { label: "Email Notification", value: d.leaseAlertSettings.emailNotification ? "Yes" : "No" },
        { label: "SMS Notification", value: d.leaseAlertSettings.smsNotification ? "Yes" : "No" },
        { label: "Notify Landlord", value: d.leaseAlertSettings.notifyLandlord ? "Yes" : "No" },
        { label: "Notify Tenant", value: d.leaseAlertSettings.notifyTenant ? "Yes" : "No" },
      ],
      { cols: 2 },
    );
    if (d.leaseAlertSettings.customMessage)
      pdf.addNote(d.leaseAlertSettings.customMessage, { type: "gold" });
  }

  // ── Closing note ───────────────────────────────────────────────────────────
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