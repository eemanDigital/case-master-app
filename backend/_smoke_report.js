// TEMPORARY smoke harness — mocks mongoose statics + res, invokes each
// generate*ReportPdf, writes the PDFs to ../output/smoke. Self-deleting after use.
const path = require("path");
const fs = require("fs");
const os = require("os");

const outDir = path.join(__dirname, "..", "output", "smoke");
fs.mkdirSync(outDir, { recursive: true });

async function withBody(doc) {
  return doc;
}
withBody.populate = () => withBody;

const person = (first, last, email) => ({
  firstName: first,
  lastName: last,
  email: email || `${first.toLowerCase()}@mail.com`,
  phone: "08012345678",
  companyName: null,
});

const firm = {
  _id: "64f000000000000000000001",
  name: "Pinnacle Legal Partners",
  email: "info@pinnaclelegal.ng",
  phone: "+234 1 700 0000",
  address: { street: "12 Adeola Odeku", city: "Victoria Island", state: "Lagos" },
  contact: {
    street: "12 Adeola Odeku",
    city: "Victoria Island",
    state: "Lagos",
    phone: "+234 1 700 0000",
    email: "info@pinnaclelegal.ng",
    rcNumber: "RC123456",
  },
};

const baseMatter = {
  matterNumber: "MTR/SMK/2026/0001",
  title: "Drafting & Notarial Advisory Support",
  status: "active",
  priority: "high",
  dateOpened: new Date("2026-01-10"),
  expectedClosureDate: new Date("2026-12-31"),
  actualClosureDate: null,
  billingType: "hourly",
  estimatedValue: 2500000,
  currency: "NGN",
  officeFileNo: "REF-SMK-0001",
  client: person("Ada", "Okafor", "ada@example.com"),
  accountOfficer: [person("Tunde", "Bello"), person("Ngozi", "Eze")],
};

const fixtures = {
  litigation: {
    suitNo: "FHC/L/CS/2026/42",
    courtName: "federal high court",
    courtLocation: "Lagos Judicial Division",
    state: "Lagos",
    division: "Lagos",
    modeOfCommencement: "writ of summons",
    filingDate: new Date("2026-02-01"),
    serviceDate: new Date("2026-02-10"),
    judge: [{ name: "Hon. Justice A. B. Coker" }, { name: "Hon. Justice D. E. Fashola" }],
    firstParty: {
      description: "The Claimant, a licensed fintech company.",
      name: [{ name: "PaySwift Limited" }],
      processesFiled: [
        { name: "Writ of Summons", filingDate: new Date("2026-02-01"), status: "filed" },
        { name: "Statement of Claim", filingDate: new Date("2026-02-15"), status: "served" },
      ],
    },
    secondParty: {
      description: "The Defendant, a commercial bank.",
      name: [{ name: "Meridian Bank Plc" }],
      processesFiled: [{ name: "Memorandum of Appearance", filingDate: new Date("2026-02-20"), status: "filed" }],
    },
    otherParty: [{ name: [{ name: "Zenith Insurance Ltd" }], description: "Interested party." }],
    currentStage: "pre-trial",
    nextHearingDate: new Date("2026-10-15"),
    lastHearingDate: new Date("2026-09-01"),
    totalHearings: 3,
    isLandmark: false,
    citationReference: "(2026) LPELR-00000(CA)",
    hearings: [
      { date: new Date("2026-06-01"), purpose: "First Mention", outcome: "Adjourned to 15 Oct" },
      { date: new Date("2026-03-01"), purpose: "Initial Filing", outcome: "By order of court" },
    ],
    courtOrders: [
      { orderDate: new Date("2026-06-01"), description: "Order directing parties to file pre-trial briefs", complianceStatus: "complied" },
      { orderDate: new Date("2026-08-01"), description: "Interim order preserving the subject matter", complianceStatus: "partial-complied" },
    ],
    litigationSteps: [
      { title: "File claim", dueDate: new Date("2026-02-01"), completedDate: new Date("2026-02-01"), status: "completed", order: 1 },
      { title: "Serve defendant", dueDate: new Date("2026-02-10"), completedDate: null, status: "in-progress", order: 2 },
    ],
    applicableLaws: ["Sheriff and Civil Process Act", "Federal High Court (Civil Procedure) Rules"],
    legalIssues: ["Breach of contract", "Unjust enrichment"],
    precedents: [
      { caseName: "Afribank v Akwara", citation: "(2006) 7 NWLR (Pt 978) 136", relevance: "On locus standi" },
    ],
    judgment: {
      judgmentDate: new Date("2026-09-20"),
      judgmentSummary: "Judgment delivered for the claimant in part.",
      outcome: "partially-won",
      damages: 1500000,
      costs: 250000,
    },
    appeal: { isAppealed: true, appealDate: new Date("2026-10-01"), appealCourt: "Court of Appeal", appealSuitNo: "CA/L/2026/88", appealStatus: "pending" },
    settlement: { isSettled: true, settlementDate: new Date("2026-09-25"), settlementAmount: 1200000, settlementTerms: "Payment in 3 instalments" },
  },
  property: {
    transactionType: "purchase",
    paymentTerms: "installments",
    purchasePrice: { amount: 95000000, currency: "NGN" },
    rentAmount: null,
    securityDeposit: { amount: 5000000, currency: "NGN" },
    properties: [
      { propertyType: "commercial", address: "Plot 401, Admiralty Way", state: "Lagos", lga: "Eti-Osa", landSize: { value: 1200, unit: "sqm" }, titleDocument: "deed-of-assignment", titleNumber: "RA/LAG/2026/881" },
      { propertyType: "land", address: "Km 12, Lekki-Epe Expressway", state: "Lagos", lga: "Epe", landSize: { value: 2, unit: "hectares" }, titleDocument: "c-of-o", titleNumber: "CoO/EPE/09/4412" },
    ],
    vendor: { name: "Greenland Estates Ltd", contact: "vendor@greenland.ng" },
    purchaser: { name: "Adasha Property Co.", contact: "purchaser@adasha.ng" },
    landlord: null,
    tenant: null,
    contractOfSale: { executionDate: new Date("2026-03-05"), completionDate: new Date("2026-11-30"), status: "executed" },
    leaseAgreement: null,
    paymentSchedule: [
      { installmentNumber: 1, amount: 30000000, dueDate: new Date("2026-03-15"), paidDate: new Date("2026-03-14"), status: "paid" },
      { installmentNumber: 2, amount: 30000000, dueDate: new Date("2026-07-15"), paidDate: null, status: "pending" },
      { installmentNumber: 3, amount: 35000000, dueDate: new Date("2026-11-15"), paidDate: null, status: "pending" },
    ],
    leaseMilestones: [],
    renewalTracking: null,
    deedOfAssignment: { executionDate: new Date("2026-03-05"), registrationDate: new Date("2026-04-02"), status: "registered" },
    governorsConsent: { isRequired: true, applicationDate: new Date("2026-05-01"), approvalDate: null, status: "pending", referenceNumber: "GC/LA/2026/771" },
    surveyPlan: { isAvailable: true, surveyNumber: "SP 4451", surveyDate: new Date("2026-02-20") },
    titleSearch: { isCompleted: true, searchDate: new Date("2026-03-01"), findings: "No encumbrance found.", encumbrances: [] },
    physicalInspection: { isCompleted: true, inspectionDate: new Date("2026-03-10"), findings: "Structure in good condition." },
    development: { isApplicable: false },
    conditions: [
      { condition: "Obtain governor's consent", dueDate: new Date("2026-12-31"), status: "pending" },
      { condition: "Register conveyance", dueDate: new Date("2026-12-31"), status: "met" },
    ],
    leaseAlertSettings: null,
  },
  general: {
    serviceType: "drafting",
    otherServiceType: null,
    serviceDescription: "Drafting and review of a shareholders agreement.",
    requestDate: new Date("2026-03-01"),
    expectedCompletionDate: new Date("2026-06-01"),
    actualCompletionDate: null,
    billing: {
      billingType: "fixed-fee",
      fixedFee: { amount: 750000, currency: "NGN" },
      lproScale: null,
      percentage: null,
      vatRate: 7.5,
      applyVAT: true,
      applyWHT: true,
      whtRate: 5,
    },
    projectStages: [
      { stageName: "Draft v1", expectedDate: new Date("2026-03-20"), actualDate: new Date("2026-03-18"), amount: 200000, isPaid: true, isCompleted: true },
      { stageName: "Client review", expectedDate: new Date("2026-04-20"), actualDate: null, amount: 150000, isPaid: false, isCompleted: false },
      { stageName: "Finalise", expectedDate: new Date("2026-05-20"), actualDate: null, amount: 400000, isPaid: false, isCompleted: false },
    ],
    partiesInvolved: [
      { name: "Ada Okafor", role: "Client Representative", contact: "ada@example.com" },
      { name: "Bode Adeyemi", role: "Counterparty Counsel", contact: "bode@mail.com" },
    ],
    expectedDeliverables: [
      { deliverable: "Executed Shareholders Agreement", dueDate: new Date("2026-06-01"), deliveryDate: null, status: "in-progress" },
      { deliverable: "Legal Opinion on Drag-Along", dueDate: new Date("2026-04-15"), deliveryDate: new Date("2026-04-10"), status: "delivered" },
    ],
    documentsReceived: [
      { docName: "CAC Certificate", docType: "certified-copy", originalKeptByFirm: false, receivedDate: new Date("2026-03-05"), receiptNumber: "RC-0091" },
    ],
    disbursements: [
      { item: "CAC Filing Fee", category: "registry-fees", estimatedAmount: 25000, actualAmount: 25000, incurredDate: new Date("2026-03-06") },
    ],
    courtAppearances: [],
    requiresNBAStamp: true,
    nbaStampDetails: { stampNumber: "NBA/2026/5512", stampDate: new Date("2026-05-02"), stampValue: 15000 },
    specificRequirements: [
      { requirement: "Board resolution approving transaction", status: "met" },
      { requirement: "Tax clearance certificate", status: "pending" },
    ],
    jurisdiction: { state: "Lagos", lga: "Ikeja", court: null },
    procedureNotes: "Counterparty to execute in counterparts.",
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-05-02"),
  },
  retainer: {
    retainerType: "general-legal",
    agreementStartDate: new Date("2026-01-01"),
    agreementEndDate: new Date("2026-12-31"),
    autoRenewal: true,
    renewalTerms: "Annual renewal with 90-day notice.",
    scopeDescription: "General corporate legal advisory and regulatory compliance support.",
    exclusions: ["Litigation beyond one court appearance per month", "Due diligence engagements"],
    servicesIncluded: [
      { serviceType: "company-secretarial", billingModel: "within-retainer", unitDescription: "filings", serviceLimit: 24, usageCount: 6 },
      { serviceType: "legal-opinion", billingModel: "per-item", unitDescription: "opinions", serviceLimit: 4, usageCount: 1 },
    ],
    billing: {
      retainerFee: 500000,
      currency: "NGN",
      frequency: "monthly",
      vatRate: 7.5,
      applyVAT: true,
      applyWHT: true,
      whtRate: 5,
      additionalFees: { isApplicable: true, description: "Disbursements billed at cost." },
      billingCap: { isApplicable: false },
    },
    disbursements: [
      { item: "CAC Annual Returns", category: "registry-fees", estimatedAmount: 30000, actualAmount: 30000, incurredDate: new Date("2026-04-01") },
    ],
    totalDisbursements: 30000,
    responseTimes: { routine: { value: 24 }, urgent: { value: 2 } },
    meetingSchedule: { frequency: "quarterly", description: "Quarterly board/AC meetings" },
    reportingRequirements: { frequency: "monthly", format: "PDF compliance memo" },
    requests: [
      { requestDate: new Date("2026-04-10"), requestType: "Director Change", description: "CAC filing for new director", responseDate: new Date("2026-04-12"), status: "completed", unitsConsumed: 1 },
      { requestDate: new Date("2026-05-01"), requestType: "Opinion", description: "VAT treatment of SaaS", responseDate: null, status: "pending", unitsConsumed: 0 },
    ],
    courtAppearances: [
      { appearanceDate: new Date("2026-06-20"), court: "High Court, Lagos", suitNumber: "LD/AD/2026/55", purpose: "hearing", outcome: "Adjourned", withinRetainer: true },
    ],
    requiresNBAStamp: false,
    nbaStampDetails: null,
    terminationClause: { noticePeriod: { value: 60, unit: "days" }, conditions: "Either party may terminate on 60 days notice." },
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-05-10"),
  },
  advisory: {
    advisoryType: "risk_assessment",
    otherAdvisoryType: null,
    requestDescription: "Assess regulatory exposure of cross-border data transfers.",
    scope: "Review data-protection posture across 3 subsidiaries.",
    requestDate: new Date("2026-03-15"),
    targetDeliveryDate: new Date("2026-05-15"),
    actualDeliveryDate: null,
    jurisdiction: ["Nigeria", "Federal"],
    applicableLaws: ["NDPR 2019", "Data Protection Act 2023"],
    regulatoryBodies: ["NDPC", "FCCPC"],
    researchQuestions: [
      { question: "Is cross-border transfer permitted?", answer: "Subject to adequacy and derogation rules.", status: "answered" },
      { question: "What registration applies?", answer: null, status: "researching" },
    ],
    researchNotes: "Multi-jurisdictional analysis underway.",
    keyFindings: [
      { finding: "No adequacy decision for target jurisdictions", source: "Sector review", relevance: "High" },
    ],
    legalPrecedents: [
      { caseName: "In re Data Protection 2024", citation: "(2024) NDPL-R 12", summary: "On cross-border flows", relevance: "Directly on point" },
    ],
    opinion: {
      summary: "Moderate exposure; remediation advised on retention schedules.",
      conclusion: "Proceed once DPIA is completed.",
      confidence: "medium",
    },
    recommendations: [
      { recommendation: "Execute standard contractual clauses", priority: "high", implementationStatus: "in-progress" },
      { recommendation: "Update privacy notices", priority: "medium", implementationStatus: "pending" },
    ],
    deliverables: [
      { title: "Risk Assessment Report", type: "report", dueDate: new Date("2026-05-15"), deliveryDate: null, status: "in-progress" },
      { title: "Executive Memo", type: "memo", dueDate: new Date("2026-05-10"), deliveryDate: new Date("2026-05-08"), status: "delivered" },
    ],
    complianceChecklist: [
      { requirement: "DPIA completed", status: "partially-compliant", dueDate: new Date("2026-05-30"), notes: null },
      { requirement: "DPO appointed", status: "compliant", dueDate: null, notes: null },
    ],
    riskAssessment: {
      overallRisk: "high",
      risks: [
        { risk: "Unauthorised international transfer", likelihood: "high", impact: "high", mitigation: "SCCs + consent mechanism" },
        { risk: "Inadequate retention schedule", likelihood: "medium", impact: "medium", mitigation: "Retention policy update" },
      ],
    },
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-05-10"),
  },
};

function mockRes() {
  return {
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    end(buf) { this.body = buf; },
  };
}

const controller = {
  litigation: "generateLitigationReportPdf",
  property: "generatePropertyReportPdf",
  general: "generateGeneralReportPdf",
  retainer: "generateRetainerReportPdf",
  advisory: "generateAdvisoryReportPdf",
  corporate: "generateCorporateReportPdf",
};

(async () => {
  const queries = {
    Matter: require("./models/matterModel"),
    LitigationDetail: require("./models/litigationDetailModel"),
    PropertyDetail: require("./models/propertyDetailModel"),
    GeneralDetail: require("./models/retainerAndGeneralDetailModel").GeneralDetail,
    RetainerDetail: require("./models/retainerAndGeneralDetailModel").RetainerDetail,
    AdvisoryDetail: require("./models/advisoryDetailModel"),
    CorporateDetail: require("./models/corporateDetailModel"),
    Firm: require("./models/firmModel"),
  };
  for (const k of Object.keys(queries)) {
    const M = queries[k];
    if (k === "Firm") {
      M.findById = async () => firm;
    } else if (k === "Matter") {
      M.findOne = () => {
        const q = Promise.resolve(baseMatter);
        q.populate = () => q;
        return q;
      };
      M.findById = async () => baseMatter;
    } else {
      M.findOne = () => {
        const q = Promise.resolve(fixtures[k.replace(/Detail$/, "").toLowerCase()] || {});
        q.populate = () => q;
        return q;
      };
    }
  }

  for (const [type, fn] of Object.entries(controller)) {
    const mod = require(`./controllers/${type}Controller.js`);
    const req = { firmId: firm._id, params: { matterId: "64f000000000000000000099" } };
    const res = mockRes();
    try {
      await mod[fn](req, res, nextSafe);
      const bytes = res.body ? res.body.length : 0;
      console.log(`${type}: ${bytes > 0 ? "OK  " : "FAIL"} ${bytes} bytes in res [bodyKeys=${Object.keys(res).join(",")} bodyType=${typeof res.body}]`);
    } catch (err) {
      console.error(`${type}: ERROR`, err.message);
    }
  }

  function nextSafe(err) {
    if (err) console.error("NEXT CALLED WITH", err.message);
  }
})();