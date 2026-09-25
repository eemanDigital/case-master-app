// SPLICED INTO litigationController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
exports.generateLitigationReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const Firm = require("../models/firmModel");
  const { COLORS, formatCurrency } = require("../utils/generateGenericPdf");

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "litigation",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No litigation matter found with that ID", 404));
  }

  const d = (await LitigationDetail.findOne({ matterId, firmId })) || {};
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Litigation Matter Report",
    headerTitle: "Litigation Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
    subtitle: matter?.title || "",
    firmContact: buildFirmContact(firm),
  });

  pdf.init(
    res,
    path.resolve(
      __dirname,
      `../output/${matter.matterNumber}_litigation_report_${Date.now()}.pdf`,
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
  const namesOf = (val) =>
    Array.isArray(val)
      ? (val || []).map((p) => p?.name || p).filter(Boolean).join(", ") || "—"
      : h(val);
  const personName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";
  const clientName = (c) =>
    c?.companyName ||
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    c?.email ||
    "—";
  const statusAccent = (s) => {
    const x = String(s || "").toLowerCase();
    if (["completed", "won", "settled", "closed", "complied"].includes(x)) return COLORS.success;
    if (["active", "pending", "on-hold", "scheduled", "in-progress"].includes(x)) return COLORS.info;
    if (["lost", "withdrawn", "archived", "dismissed", "struck-out", "not-complied", "cancelled"].includes(x)) return COLORS.danger;
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

  // ── Label maps (from litigationDetailModel enums) ─────────────────────────
  const LitigationCourt = {
    "supreme court": "Supreme Court",
    "court of appeal": "Court of Appeal",
    "federal high court": "Federal High Court",
    "high court": "High Court",
    "national industrial court": "National Industrial Court",
    "sharia courts of appeal": "Sharia Courts of Appeal",
    "customary court of appeal": "Customary Court of Appeal",
    "magistrate court": "Magistrate Court",
    "customary court": "Customary Court",
    "sharia court": "Sharia Court",
    "area court": "Area Court",
    coroner: "Coroner",
    tribunal: "Tribunal",
    "election tribunal": "Election Tribunal",
    "code of conduct tribunal": "Code of Conduct Tribunal",
    "tax appeal tribunal": "Tax Appeal Tribunal",
    "rent tribunal": "Rent Tribunal",
    others: "Other",
  };
  const LitigationStage = {
    "pre-trial": "Pre-Trial",
    trial: "Trial",
    judgment: "Judgment",
    appeal: "Appeal",
    execution: "Execution",
    settled: "Settled",
    closed: "Closed",
  };
  const LitigationModeOfCommencement = {
    "writ of summons": "Writ of Summons",
    "originating summons": "Originating Summons",
    "originating motion": "Originating Motion",
    petition: "Petition",
    information: "Information",
    charge: "Charge",
    complaint: "Complaint",
    indictment: "Indictment",
    application: "Application",
    "notice of appeal": "Notice of Appeal",
    "notice of application": "Notice of Application",
    other: "Other",
  };
  const LitigationOutcome = {
    won: "Won",
    lost: "Lost",
    "partially-won": "Partially Won",
    dismissed: "Dismissed",
    "struck-out": "Struck Out",
    pending: "Pending",
  };
  const LitigationAppealStatus = {
    pending: "Pending",
    won: "Won",
    lost: "Lost",
    withdrawn: "Withdrawn",
    dismissed: "Dismissed",
  };

  // ── Matter overview (KPI cards) ───────────────────────────────────────────
  pdf.addSection("Matter Overview");
  pdf.addKpiCards([
    { label: "Status", value: titleCase(matter.status), accent: statusAccent(matter.status) },
    { label: "Priority", value: titleCase(matter.priority), accent: COLORS.warning },
    { label: "Stage", value: labelOf(LitigationStage, d.currentStage), accent: COLORS.info },
    { label: "Next Hearing", value: fmtDate(d.nextHearingDate), accent: COLORS.gold },
  ]);

  pdf.addKeyValueGrid(
    [
      { label: "Matter Number", value: matter.matterNumber, bold: true },
      { label: "Status", value: titleCase(matter.status), bold: true },
      { label: "Priority", value: titleCase(matter.priority) },
      { label: "Date Opened", value: fmtDate(matter.dateOpened) },
      { label: "Expected Closure", value: fmtDate(matter.expectedClosureDate) },
      { label: "Billing Type", value: titleCase(matter.billingType) },
      {
        label: "Estimated Value",
        value:
          matter.estimatedValue != null
            ? formatCurrency(matter.estimatedValue, matter.currency || "NGN")
            : h(matter.estimatedValue),
      },
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

  // ── Case information ──────────────────────────────────────────────────────
  pdf.addSection("Case Information");
  pdf.addKeyValueGrid(
    [
      { label: "Suit Number", value: h(d.suitNo), bold: true },
      { label: "Court", value: labelOf(LitigationCourt, d.courtName) },
      { label: "Court Location", value: h(d.courtLocation) },
      { label: "State", value: h(d.state) },
      { label: "Division", value: h(d.division) },
      { label: "Mode of Commencement", value: labelOf(LitigationModeOfCommencement, d.modeOfCommencement) },
      { label: "Filing Date", value: fmtDate(d.filingDate) },
      { label: "Service Date", value: fmtDate(d.serviceDate) },
    ],
    { cols: 2 },
  );

  if ((d.judge || []).length)
    pdf.addLongTextField("Judge(s)", (d.judge || []).map((j) => j.name).join(", "));

  // ── Parties ───────────────────────────────────────────────────────────────
  pdf.addSection("Parties");
  [
    { title: "First Party (Claimant/Plaintiff)", p: d.firstParty },
    { title: "Second Party (Defendant/Respondent)", p: d.secondParty },
  ].forEach(({ title, p }) => {
    if (p?.name?.length) {
      pdf.addSubSection(title);
      pdf.addField("Name", namesOf(p.name));
      if (p.description) pdf.addLongTextField("Description", p.description);
      if (p.processesFiled?.length) {
        pdf.addDataTable(
          ["Process", "Filing Date", "Status"],
          (p.processesFiled || []).map((pf) => [
            pf.name || "—",
            fmtDate(pf.filingDate),
            titleCase(pf.status || "pending"),
          ]),
          { widths: [2.4, 1.4, 1.2], statusColumns: [2] },
        );
      }
    }
  });

  if ((d.otherParty || []).length) {
    pdf.addSection("Other Parties");
    (d.otherParty || []).forEach((p) => {
      if (p?.name?.length) {
        pdf.addSubSection("Party");
        pdf.addField("Name", namesOf(p.name));
        if (p.description) pdf.addLongTextField("Description", p.description);
      }
    });
  }

  // ── Case status ───────────────────────────────────────────────────────────
  pdf.addSection("Case Status");
  pdf.addKeyValueGrid(
    [
      { label: "Current Stage", value: labelOf(LitigationStage, d.currentStage), bold: true },
      { label: "Next Hearing Date", value: fmtDate(d.nextHearingDate) },
      { label: "Last Hearing Date", value: fmtDate(d.lastHearingDate) },
      { label: "Total Hearings", value: String(d.totalHearings ?? 0) },
      { label: "Landmark Case", value: d.isLandmark || matter.isLandmark ? "Yes" : "No" },
      { label: "Citation Reference", value: h(d.citationReference) },
    ],
    { cols: 2 },
  );

  // ── Hearings ──────────────────────────────────────────────────────────────
  if ((d.hearings || []).length) {
    const hearings = (d.hearings || [])
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const upcoming = hearings.filter((x) => new Date(x.date) >= new Date());
    pdf.addSection("Hearings");
    pdf.addSubSection("Recent Hearings");
    pdf.addDataTable(
      ["Date", "Purpose", "Outcome / Notes"],
      hearings.slice(0, 12).map((x) => [
        fmtDate(x.date),
        h(x.purpose),
        h(x.outcome),
      ]),
      { widths: [1.3, 2, 3.3] },
    );
    if (upcoming.length) {
      pdf.addSubSection("Upcoming Hearings");
      pdf.addDataTable(
        ["Date", "Purpose"],
        upcoming.slice(0, 5).map((x) => [fmtDate(x.date), h(x.purpose)]),
        { widths: [1.4, 5] },
      );
    }
  }

  // ── Court orders ──────────────────────────────────────────────────────────
  if ((d.courtOrders || []).length) {
    pdf.addSection("Court Orders");
    pdf.addDataTable(
      ["Order Date", "Description", "Status"],
      (d.courtOrders || []).slice(0, 12).map((o) => [
        fmtDate(o.orderDate),
        h(o.description),
        titleCase(o.complianceStatus || "pending"),
      ]),
      { widths: [1.4, 3.6, 1.3], statusColumns: [2] },
    );
  }

  // ── Case progress ─────────────────────────────────────────────────────────
  if ((d.litigationSteps || []).length) {
    pdf.addSection("Case Progress");
    pdf.addDataTable(
      ["Step", "Due Date", "Completed", "Status"],
      (d.litigationSteps || [])
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((s) => [
          h(s.title),
          fmtDate(s.dueDate),
          fmtDate(s.completedDate),
          titleCase(s.status || "pending"),
        ]),
      { widths: [2.6, 1.3, 1.3, 1.2], statusColumns: [3] },
    );
  }

  // ── Applicable law & issues ───────────────────────────────────────────────
  if ((d.applicableLaws || []).length || (d.legalIssues || []).length) {
    pdf.addSection("Legal Framework");
    if ((d.applicableLaws || []).length) {
      pdf.addSubSection("Applicable Laws");
      (d.applicableLaws || []).forEach((law) => pdf.addField("Law", law));
    }
    if ((d.legalIssues || []).length) {
      pdf.addSubSection("Legal Issues");
      (d.legalIssues || []).forEach((issue) => pdf.addField("Issue", issue));
    }
  }

  // ── Precedents ────────────────────────────────────────────────────────────
  if ((d.precedents || []).length) {
    pdf.addSection("Precedents");
    pdf.addDataTable(
      ["Case", "Citation", "Relevance"],
      (d.precedents || []).map((p) => [
        p.caseName || "—",
        p.citation || "—",
        p.relevance || "—",
      ]),
      { widths: [2, 2, 2.6] },
    );
  }

  // ── Judgment ──────────────────────────────────────────────────────────────
  if (d.judgment) {
    pdf.addSection("Judgment");
    pdf.addKeyValueGrid(
      [
        { label: "Judgment Date", value: fmtDate(d.judgment.judgmentDate) },
        { label: "Outcome", value: labelOf(LitigationOutcome, d.judgment.outcome) },
        { label: "Damages", value: money(d.judgment.damages) },
        { label: "Costs", value: money(d.judgment.costs) },
      ],
      { cols: 2 },
    );
    if (d.judgment.judgmentSummary)
      pdf.addLongTextField("Judgment Summary", d.judgment.judgmentSummary);
  }

  // ── Appeal ────────────────────────────────────────────────────────────────
  if (d.appeal?.isAppealed) {
    pdf.addSection("Appeal");
    pdf.addKeyValueGrid(
      [
        { label: "Appeal Date", value: fmtDate(d.appeal.appealDate) },
        { label: "Appeal Court", value: h(d.appeal.appealCourt) },
        { label: "Appeal Suit Number", value: h(d.appeal.appealSuitNo) },
        { label: "Appeal Status", value: labelOf(LitigationAppealStatus, d.appeal.appealStatus) },
      ],
      { cols: 2 },
    );
  }

  // ── Settlement ────────────────────────────────────────────────────────────
  if (d.settlement?.isSettled) {
    pdf.addSection("Settlement");
    pdf.addKeyValueGrid(
      [
        { label: "Settlement Date", value: fmtDate(d.settlement.settlementDate) },
        { label: "Settlement Amount", value: money(d.settlement.settlementAmount) },
      ],
      { cols: 2 },
    );
    if (d.settlement.settlementTerms)
      pdf.addLongTextField("Settlement Terms", d.settlement.settlementTerms);
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