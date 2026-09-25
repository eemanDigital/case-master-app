// SPLICED INTO retainerController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
exports.generateRetainerReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const Firm = require("../models/firmModel");
  const { COLORS, formatCurrency } = require("../utils/generateGenericPdf");

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "retainer",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No retainer matter found with that ID", 404));
  }

  const d = (await RetainerDetail.findOne({ matterId, firmId })) || {};
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Retainer Matter Report",
    headerTitle: "Retainer Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
    subtitle: matter?.title || "",
    firmContact: buildFirmContact(firm),
  });

  pdf.init(
    res,
    path.resolve(
      __dirname,
      `../output/${matter.matterNumber}_retainer_report_${Date.now()}.pdf`,
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
    if (["completed", "approved", "paid", "renewed"].includes(x)) return COLORS.success;
    if (["active", "pending", "on-hold", "in-progress", "draft"].includes(x)) return COLORS.info;
    if (["expired", "terminated", "withdrawn", "rejected", "overdue", "cancelled"].includes(x)) return COLORS.danger;
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

  // ── Label maps (from retainerDetailModel enums) ────────────────────────────
  const RETAINER_TYPE_LABELS = {
    "general-legal": "General Legal",
    "company-secretarial": "Company Secretarial",
    "retainer-deposit": "Retainer Deposit",
    specialized: "Specialized",
    other: "Other",
  };
  const FREQUENCY_LABELS = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    annually: "Annually",
    "one-off": "One Off",
  };
  const BILLING_MODEL_LABELS = {
    "within-retainer": "Within Retainer",
    "fixed-fee": "Fixed Fee",
    "lpro-scale": "LPRO Scale",
    "per-item": "Per Item",
  };

  const billing = d.billing || {};
  const fee = billing.retainerFee || 0;
  const vat = billing.applyVAT ? fee * ((billing.vatRate || 7.5) / 100) : 0;
  const gross = fee + vat;
  const wht = billing.applyWHT ? fee * ((billing.whtRate || 5) / 100) : 0;
  const net = gross - wht;

  let termLabel = "—";
  if (d.agreementEndDate) {
    const daysRemaining = Math.ceil(
      (new Date(d.agreementEndDate) - new Date()) / (1000 * 60 * 60 * 24),
    );
    termLabel =
      daysRemaining > 0
        ? `${daysRemaining} days remaining`
        : `Expired ${Math.abs(daysRemaining)} days ago`;
  }
  const pendingRequests = (d.requests || []).filter(
    (r) => r.status === "pending",
  ).length;

  // ── Matter overview (KPI cards) ───────────────────────────────────────────
  pdf.addSection("Matter Overview");
  pdf.addKpiCards([
    {
      label: "Retainer Type",
      value: labelOf(RETAINER_TYPE_LABELS, d.retainerType),
      accent: COLORS.navyMid,
    },
    { label: "Retainer Fee", value: fee ? formatCurrency(fee, billing.currency || "NGN") : "—", accent: COLORS.gold },
    { label: "Frequency", value: labelOf(FREQUENCY_LABELS, billing.frequency), accent: COLORS.info },
    {
      label: "Term",
      value: d.agreementEndDate ? fmtDate(d.agreementEndDate) : "—",
      accent: statusAccent(matter.status),
    },
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

  // ── Retainer agreement ────────────────────────────────────────────────────
  pdf.addSection("Retainer Agreement");
  pdf.addKeyValueGrid(
    [
      { label: "Retainer Type", value: labelOf(RETAINER_TYPE_LABELS, d.retainerType), bold: true },
      { label: "Start Date", value: fmtDate(d.agreementStartDate) },
      { label: "End Date", value: fmtDate(d.agreementEndDate) },
      { label: "Term", value: termLabel, bold: true },
      { label: "Auto Renewal", value: d.autoRenewal ? "Yes" : "No" },
      { label: "NBA Stamp", value: d.requiresNBAStamp ? "Required" : "Not Required" },
    ],
    { cols: 2 },
  );
  if (d.renewalTerms) pdf.addLongTextField("Renewal Terms", d.renewalTerms);

  // ── Scope of services ─────────────────────────────────────────────────────
  if (d.scopeDescription) pdf.addLongTextField("Scope of Services", d.scopeDescription);
  if ((d.exclusions || []).length) {
    pdf.addSubSection("Exclusions");
    (d.exclusions || []).forEach((e) => pdf.addField("Excluded", e));
  }

  // ── Services included ─────────────────────────────────────────────────────
  if ((d.servicesIncluded || []).length) {
    pdf.addSection("Services Included");
    pdf.addDataTable(
      ["Service", "Billing Model", "Limit", "Used"],
      (d.servicesIncluded || []).map((s) => [
        labelOf(
          {
            "company-secretarial": "Company Secretarial",
            "litigation-advocacy": "Litigation & Advocacy",
            "perfection-of-title": "Perfection of Title",
            "regulatory-compliance": "Regulatory Compliance",
            "legal-opinion": "Legal Opinion",
            "drafting-review": "Drafting & Review",
            "cac-registration": "CAC Registration",
            "notarial-services": "Notarial Services",
            "arbitration-mediation": "Arbitration & Mediation",
            other: "Other",
          },
          s.serviceType,
        ),
        labelOf(BILLING_MODEL_LABELS, s.billingModel),
        s.serviceLimit != null ? `${s.serviceLimit} ${s.unitDescription || "units"}` : "Unlimited",
        s.usageCount != null ? `${s.usageCount}${s.serviceLimit != null ? `/${s.serviceLimit}` : ""}` : "—",
      ]),
      { widths: [2.4, 1.6, 1.4, 1.2] },
    );
  }

  // ── Billing & tax summary ─────────────────────────────────────────────────
  pdf.addSection("Billing & Tax Summary");
  pdf.addKeyValueGrid(
    [
      { label: "Retainer Fee", value: formatCurrency(fee, billing.currency || "NGN"), bold: true },
      { label: "Frequency", value: labelOf(FREQUENCY_LABELS, billing.frequency) },
      { label: "VAT", value: `${billing.applyVAT ? formatCurrency(vat) : "Not applied"}${billing.applyVAT ? ` (${billing.vatRate || 7.5}%)` : ""}` },
      { label: "Gross (With VAT)", value: formatCurrency(gross) },
      { label: "WHT", value: `${billing.applyWHT ? formatCurrency(wht) : "Not applied"}${billing.applyWHT ? ` (${billing.whtRate || 5}%)` : ""}` },
      { label: "Net (After WHT)", value: formatCurrency(net), bold: true },
      { label: "Additional Fees", value: billing.additionalFees?.isApplicable ? "Applicable" : "None" },
      {
        label: "Billing Cap",
        value:
          billing.billingCap?.isApplicable
            ? `${formatCurrency(billing.billingCap.amount || 0)} / ${billing.billingCap.period || ""}`
            : "None",
      },
    ],
    { cols: 2 },
  );
  if (billing.additionalFees?.description)
    pdf.addLongTextField("Additional Fees Note", billing.additionalFees.description);

  // ── Performance & requests ────────────────────────────────────────────────
  if ((d.requests || []).length || d.totalRequestsHandled != null) {
    pdf.addSection("Performance & Requests");
    pdf.addKeyValueGrid(
      [
        { label: "Total Requests Handled", value: String(d.totalRequestsHandled ?? (d.requests || []).length), bold: true },
        { label: "Pending Requests", value: String(pendingRequests) },
        { label: "Activities Logged", value: String((d.activityLog || []).length) },
        { label: "Court Appearances", value: String((d.courtAppearances || []).length) },
      ],
      { cols: 2 },
    );
    if ((d.requests || []).length) {
      pdf.addSubSection("Requests");
      pdf.addDataTable(
        ["Date", "Type", "Status", "Units"],
        (d.requests || [])
          .slice()
          .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
          .slice(0, 15)
          .map((r) => [
            fmtDate(r.requestDate),
            h(r.requestType),
            titleCase(r.status || "pending"),
            r.unitsConsumed != null ? String(r.unitsConsumed) : "—",
          ]),
        { widths: [1.3, 2.4, 1.6, 0.9], statusColumns: [2] },
      );
    }
  }

  // ── Court appearances ─────────────────────────────────────────────────────
  if ((d.courtAppearances || []).length) {
    pdf.addSection("Court Appearances");
    pdf.addDataTable(
      ["Date", "Court", "Suit No.", "Purpose", "Outcome"],
      (d.courtAppearances || []).map((a) => [
        fmtDate(a.appearanceDate),
        h(a.court),
        h(a.suitNumber),
        titleCase(a.purpose || "other"),
        h(a.outcome),
      ]),
      { widths: [1.2, 1.8, 1.5, 1.3, 1.8] },
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
    pdf.addField("Total Disbursements", formatCurrency(d.totalDisbursements || 0));
  }

  // ── Service levels & terms ────────────────────────────────────────────────
  pdf.addSection("Service Levels & Terms");
  pdf.addKeyValueGrid(
    [
      {
        label: "Routine Response",
        value:
          d.responseTimes?.routine?.value != null
            ? `${d.responseTimes.routine.value} ${d.responseTimes.routine.unit || ""}`
            : "—",
      },
      {
        label: "Urgent Response",
        value:
          d.responseTimes?.urgent?.value != null
            ? `${d.responseTimes.urgent.value} ${d.responseTimes.urgent.unit || ""}`
            : "—",
      },
      { label: "Meetings", value: h(d.meetingSchedule?.frequency) },
      { label: "Reports", value: h(d.reportingRequirements?.frequency) },
      {
        label: "Termination Notice",
        value:
          d.terminationClause?.noticePeriod?.value != null
            ? `${d.terminationClause.noticePeriod.value} ${d.terminationClause.noticePeriod.unit || "days"}`
            : "—",
      },
      { label: "Stamp Number", value: h(d.nbaStampDetails?.stampNumber) },
    ],
    { cols: 2 },
  );
  if (d.terminationClause?.conditions)
    pdf.addLongTextField("Termination Conditions", d.terminationClause.conditions);

  // ── Closing note ──────────────────────────────────────────────────────────
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