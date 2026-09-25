// SPLICED INTO advisoryController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
exports.generateAdvisoryReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const Firm = require("../models/firmModel");
  const { COLORS, formatCurrency } = require("../utils/generateGenericPdf");

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "advisory",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No advisory matter found with that ID", 404));
  }

  const d = (await AdvisoryDetail.findOne({ matterId, firmId })) || {};
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Advisory Matter Report",
    headerTitle: "Advisory Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
    subtitle: matter?.title || "",
    firmContact: buildFirmContact(firm),
  });

  pdf.init(
    res,
    path.resolve(
      __dirname,
      `../output/${matter.matterNumber}_advisory_report_${Date.now()}.pdf`,
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
  const listOf = (arr) => (arr || []).filter(Boolean).join(", ") || "—";
  const personName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";
  const clientName = (c) =>
    c?.companyName ||
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    c?.email ||
    "—";
  const statusAccent = (s) => {
    const x = String(s || "").toLowerCase();
    if (["delivered", "approved", "implemented", "answered", "compliant"].includes(x)) return COLORS.success;
    if (["active", "pending", "in-progress", "researching", "on-hold"].includes(x)) return COLORS.info;
    if (["rejected", "non-compliant", "critical", "overdue"].includes(x)) return COLORS.danger;
    if (["partially-compliant", "partially-won", "medium"].includes(x)) return COLORS.warning;
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

  // ── Label maps (from advisoryDetailModel enums) ────────────────────────────
  const ADVISORY_TYPE_LABELS = {
    legal_opinion: "Legal Opinion",
    regulatory_compliance: "Regulatory Compliance",
    due_diligence: "Due Diligence",
    contract_review: "Contract Review",
    policy_development: "Policy Development",
    legal_research: "Legal Research",
    risk_assessment: "Risk Assessment",
    litigation_risk_analysis: "Litigation Risk Analysis",
    regulatory_strategy: "Regulatory Strategy",
    transaction_advisory: "Transaction Advisory",
    other: "Other",
  };
  const DELIVERABLE_TYPE_LABELS = {
    "legal-opinion": "Legal Opinion",
    memo: "Memo",
    report: "Report",
    presentation: "Presentation",
    other: "Other",
  };

  const deliverables = d.deliverables || [];
  const deliveredCount = deliverables.filter(
    (x) => x.status === "delivered" || x.status === "approved",
  ).length;
  const risk = d.riskAssessment?.overallRisk || "";
  const riskLabel =
    risk === "critical" ? "Critical" : risk === "high" ? "High" : risk === "medium" ? "Medium" : risk === "low" ? "Low" : "—";

  // ── Matter overview (KPI cards) ───────────────────────────────────────────
  pdf.addSection("Matter Overview");
  pdf.addKpiCards([
    {
      label: "Advisory Type",
      value: labelOf(ADVISORY_TYPE_LABELS, d.advisoryType),
      accent: COLORS.navyMid,
    },
    {
      label: "Overall Risk",
      value: riskLabel,
      accent: statusAccent(risk),
    },
    {
      label: "Deliverables",
      value: deliverables.length ? `${deliveredCount}/${deliverables.length}` : "—",
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

  // ── Advisory overview ─────────────────────────────────────────────────────
  pdf.addSection("Advisory Overview");
  pdf.addKeyValueGrid(
    [
      { label: "Advisory Type", value: labelOf(ADVISORY_TYPE_LABELS, d.advisoryType), bold: true },
      { label: "Other Type", value: h(d.otherAdvisoryType) },
      { label: "Request Date", value: fmtDate(d.requestDate) },
      { label: "Target Delivery", value: fmtDate(d.targetDeliveryDate) },
      { label: "Actual Delivery", value: fmtDate(d.actualDeliveryDate) },
      { label: "Confidence", value: titleCase(d.opinion?.confidence) },
      { label: "Jurisdiction(s)", value: listOf(d.jurisdiction) },
      { label: "Regulatory Body(s)", value: listOf(d.regulatoryBodies) },
      { label: "Applicable Laws", value: listOf(d.applicableLaws) },
    ],
    { cols: 2 },
  );

  // ── Request & scope ───────────────────────────────────────────────────────
  if (d.requestDescription) pdf.addLongTextField("Request Description", d.requestDescription);
  if (d.scope) pdf.addLongTextField("Scope of Engagement", d.scope);
  if (d.researchNotes) pdf.addLongTextField("Research Notes", d.researchNotes);

  // ── Research questions ────────────────────────────────────────────────────
  if ((d.researchQuestions || []).length) {
    pdf.addSection("Research Questions");
    pdf.addDataTable(
      ["Question", "Answer", "Status"],
      (d.researchQuestions || []).map((q) => [
        h(q.question),
        h(q.answer),
        titleCase(q.status || "pending"),
      ]),
      { widths: [2.8, 2.8, 1.2], statusColumns: [2] },
    );
  }

  // ── Key findings ──────────────────────────────────────────────────────────
  if ((d.keyFindings || []).length) {
    pdf.addSection("Key Findings");
    pdf.addDataTable(
      ["Finding", "Source", "Relevance"],
      (d.keyFindings || []).map((f) => [
        h(f.finding),
        h(f.source),
        h(f.relevance),
      ]),
      { widths: [3.2, 1.6, 2] },
    );
  }

  // ── Legal precedents ──────────────────────────────────────────────────────
  if ((d.legalPrecedents || []).length) {
    pdf.addSection("Legal Precedents");
    pdf.addDataTable(
      ["Case", "Citation", "Relevance"],
      (d.legalPrecedents || []).map((p) => [
        h(p.caseName),
        h(p.citation),
        h(p.relevance),
      ]),
      { widths: [2.2, 1.8, 2.8] },
    );
  }

  // ── Opinion & recommendations ─────────────────────────────────────────────
  if (d.opinion?.summary || d.opinion?.conclusion) {
    pdf.addSection("Opinion & Recommendations");
    pdf.addKeyValueGrid(
      [
        { label: "Overall Opinion", value: d.opinion?.summary ? "Provided" : "—", bold: true },
        { label: "Conclusion", value: d.opinion?.conclusion ? "Provided" : "—" },
        { label: "Confidence Level", value: titleCase(d.opinion?.confidence) },
      ],
      { cols: 2 },
    );
    if (d.opinion?.summary) pdf.addLongTextField("Opinion Summary", d.opinion.summary);
    if (d.opinion?.conclusion) pdf.addLongTextField("Conclusion", d.opinion.conclusion);
  }

  if ((d.recommendations || []).length) {
    pdf.addSection("Recommendations");
    pdf.addDataTable(
      ["Recommendation", "Priority", "Status"],
      (d.recommendations || []).map((r) => [
        h(r.recommendation),
        titleCase(r.priority || "medium"),
        titleCase(r.implementationStatus || "pending"),
      ]),
      { widths: [4, 1.1, 1.4], statusColumns: [1, 2] },
    );
  }

  // ── Deliverables ──────────────────────────────────────────────────────────
  if (deliverables.length) {
    pdf.addSection("Deliverables");
    pdf.addDataTable(
      ["Deliverable", "Type", "Due", "Delivered", "Status"],
      deliverables.map((del) => [
        h(del.title),
        labelOf(DELIVERABLE_TYPE_LABELS, del.type),
        fmtDate(del.dueDate),
        fmtDate(del.deliveryDate),
        titleCase(del.status || "pending"),
      ]),
      { widths: [2, 1.6, 1, 1, 1.2], statusColumns: [4] },
    );
  }

  // ── Compliance checklist ──────────────────────────────────────────────────
  if ((d.complianceChecklist || []).length) {
    pdf.addSection("Compliance Checklist");
    pdf.addDataTable(
      ["Requirement", "Status", "Due", "Notes"],
      (d.complianceChecklist || []).map((c) => [
        h(c.requirement),
        titleCase(c.status || "not-applicable"),
        fmtDate(c.dueDate),
        h(c.notes),
      ]),
      { widths: [3, 1.3, 1, 1.6], statusColumns: [1] },
    );
  }

  // ── Risk assessment ───────────────────────────────────────────────────────
  const risks = d.riskAssessment?.risks || [];
  pdf.addSection("Risk Assessment");
  pdf.addKeyValueGrid(
    [
      { label: "Overall Risk", value: riskLabel, bold: true, color: statusAccent(risk) },
      { label: "Risks Identified", value: String(risks.length) },
    ],
    { cols: 2 },
  );
  if (risks.length) {
    pdf.addDataTable(
      ["Risk", "Likelihood", "Impact", "Mitigation"],
      risks.map((r) => [
        h(r.risk),
        titleCase(r.likelihood || "medium"),
        titleCase(r.impact || "medium"),
        h(r.mitigation),
      ]),
      { widths: [2.6, 1, 1, 2.4], statusColumns: [] },
    );
  }

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