// utils/seedRetainerMatters.js - Seed retainer matters + full RetainerDetail
//
// Usage:
//   node utils/seedRetainerMatters.js                       # backfill details + add new matters
//   node utils/seedRetainerMatters.js --backfill-only       # only create details for existing matters
//   node utils/seedRetainerMatters.js --count=6            # new matters per firm (default 6)
//   node utils/seedRetainerMatters.js --firm=apex-partners  # one firm only
//   node utils/seedRetainerMatters.js --clean               # wipe retainer matters/details, then seed
//
// Run seedFirm.js -> seedUser.js FIRST so firms, staff and clients exist.
//
// This script does two things:
//   1. BACKFILL - any existing matterType:"retainer" matter with no RetainerDetail
//      gets a fully populated one (the base seeders created retainer matters
//      without details, so retainer reports were rendering empty).
//   2. ADD - seeds `--count` additional retainer matters per firm, each with a
//      fully populated RetainerDetail (agreement, scope, services, billing/VAT/
//      WHT, disbursements, service levels, performance log, requests, court
//      appearances, NBA stamp, termination clause).

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const Firm = require("../models/firmModel");
const User = require("../models/userModel");
const Matter = require("../models/matterModel");
const { RetainerDetail } = require("../models/retainerAndGeneralDetailModel");

// Use local database for development, Atlas for production
let DB;
if (process.env.NODE_ENV === "production") {
  DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD,
  );
} else {
  DB = process.env.DATABASE_LOCAL || "mongodb://127.0.0.1:27017/case-master-app";
}

console.log(
  `📦 Connecting to: ${DB.includes("127.0.0.1") ? "Local MongoDB" : "MongoDB Atlas"}`,
);

const argv = process.argv.slice(2);
const CLEAN = argv.includes("--clean");
const BACKFILL_ONLY = argv.includes("--backfill-only");
const firmArg = argv.find((a) => a.startsWith("--firm="));
const ONLY_FIRM = firmArg ? firmArg.split("=")[1] : null;
const countArg = argv.find((a) => a.startsWith("--count="));
const COUNT = Math.max(1, parseInt(countArg ? countArg.split("=")[1] : "6", 10) || 6);

// ============================================
// HELPERS
// ============================================

const pick = (arr, i) => arr[i % arr.length];

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const roundTo = (value, step) => Math.round(value / step) * step;

const clientName = (client) =>
  [client?.firstName, client?.lastName].filter(Boolean).join(" ") ||
  client?.companyName ||
  "Client";

// Companies are billed at the corporate WHT rate, individuals at 5%
const whtRateFor = (client) => (client?.companyName ? 10 : 5);

// ============================================
// POOLS
// ============================================

const STATUSES = ["active", "active", "active", "pending", "completed", "active", "closed"];

const PRIORITIES = ["medium", "high", "low", "medium", "medium", "urgent"];

const COUNTERPARTIES = [
  "Zenith Holdings Plc",
  "Northwind Equity Ltd",
  "Sahara Infrastructure Ltd",
  "Cobalt Industries Ltd",
  "Trident Assurance Plc",
  "Atlas Securities Ltd",
  "Riverside Bank Ltd",
  "Mansa Telecom Ltd",
];

const COURTS = [
  "Federal High Court, Abuja",
  "Court of Justice, Lagos State",
  "Federal High Court, Port Harcourt",
  "High Court of Justice, Kano State",
];

const REQUEST_TYPES = [
  "Board resolution drafting",
  "Share capital filing",
  "Annual return preparation",
  "Contract review",
  "Legal opinion request",
  "Employment agreement review",
  "Regulatory filing",
  "Land title search",
  "Debt recovery demand",
  "Due diligence report",
];

// ============================================
// RETAINER BLUEPRINTS
// Each blueprint drives the matter title + the RetainerDetail payload.
// ============================================

const BLUEPRINTS = [
  {
    retainerType: "general-legal",
    nature: "general retainer",
    label: "general legal",
    titleKind: "General Legal Retainer",
    fee: 450000,
    frequency: "monthly",
    tags: ["retainer", "ongoing", "advisory"],
    services: [
      { serviceType: "drafting-review", description: "Review and draft of commercial contracts, NDAs and service agreements", billingModel: "within-retainer", serviceLimit: 10, unitDescription: "contracts/quarter", lproScale: "N/A" },
      { serviceType: "legal-opinion", description: "Written legal opinions on up to two queries per quarter", billingModel: "per-item", serviceLimit: 2, unitDescription: "opinions/quarter", lproScale: "N/A" },
      { serviceType: "company-secretarial", description: "General corporate housekeeping and board secretariat support", billingModel: "within-retainer", serviceLimit: 8, unitDescription: "filings/quarter", lproScale: "N/A" },
    ],
    scope:
      "The firm shall provide on-call general legal advisory services to the client, including the drafting and review of commercial agreements, routine corporate governance support, advice on day-to-day business transactions and up to two written legal opinions per quarter. Court appearances, litigation, tax advisory and regulatory prosecution work are excluded and are quoted separately.",
    exclusions: [
      "Litigation, arbitration and court proceedings of any kind",
      "Tax planning, tax computations and tax authority representation",
      "Banking, capital markets and syndicated finance transactions",
      "Any matter requiring a dedicated lawyer for more than five working days",
    ],
  },
  {
    retainerType: "company-secretarial",
    nature: "regulatory compliance",
    label: "company secretarial and statutory compliance",
    titleKind: "Company Secretarial & Statutory Filings Retainer",
    fee: 280000,
    frequency: "quarterly",
    tags: ["retainer", "compliance", "cac"],
    services: [
      { serviceType: "company-secretarial", description: "CAC annual returns, statutory registers and company name changes", billingModel: "within-retainer", serviceLimit: 12, unitDescription: "filings/year", lproScale: "N/A" },
      { serviceType: "cac-registration", description: "Registration of new branches and subsidiaries with the CAC", billingModel: "per-item", serviceLimit: 3, unitDescription: "registrations/year", lproScale: "N/A" },
      { serviceType: "notarial-services", description: "Certification and attestation of corporate documents", billingModel: "within-retainer", serviceLimit: 6, unitDescription: "certificates/quarter", lproScale: "N/A" },
    ],
    scope:
      "The firm shall act as company secretary and shall maintain the client's statutory registers, prepare and file annual returns with the Corporate Affairs Commission, attend to director and shareholder changes, register charges and mortgages, and issue certificates and attestations as required, in each case within the annual filing calendar agreed with the client.",
    exclusions: [
      "Statutory audit and preparation of annual financial statements",
      "Tax returns and tax clearance certificates",
      "Annual general meeting facilitation beyond board administration",
    ],
  },
  {
    retainerType: "retainer-deposit",
    nature: "general retainer",
    label: "draw-down deposit",
    titleKind: "Draw-Down Retainer Agreement",
    fee: 2500000,
    frequency: "monthly",
    tags: ["retainer", "deposit", "draw-down"],
    services: [
      { serviceType: "legal-opinion", description: "General advisory and pre-litigation counselling drawn down from the deposit", billingModel: "within-retainer", lproScale: "N/A" },
      { serviceType: "litigation-advocacy", description: "Pre-action correspondence and demand recovery at the agreed discount rate", billingModel: "lpro-scale", serviceLimit: 40, unitDescription: "units", lproScale: "Scale 4", lproReference: "Item 12(a) - Sale of Land" },
      { serviceType: "drafting-review", description: "Documentation at the agreed discounted rates", billingModel: "lpro-scale", lproScale: "Scale 4", lproReference: "Item 8 - Contract Drafting" },
    ],
    scope:
      "The client shall pay an initial retainer deposit which shall be held on the firm's client account and applied against fees as work is done. The firm shall render an account every month showing units consumed, the applicable LPRO 2023 scale charged and the balance of the deposit remaining. Unutilised balance is refundable on termination, less any outstanding fees and disbursements.",
    exclusions: [
      "Willingness to hold funds in the firm's client account beyond the agreed period",
      "Interest on the deposit, which is not payable",
      "Works falling outside the agreed statement of services",
    ],
  },
  {
    retainerType: "specialized",
    nature: "intellectual property",
    label: "intellectual property and brand protection",
    titleKind: "IP & Brand Protection Retainer",
    fee: 650000,
    frequency: "monthly",
    tags: ["retainer", "ip", "trademark"],
    services: [
      { serviceType: "drafting-review", description: "IP assignments, licences and franchising documentation", billingModel: "within-retainer", serviceLimit: 6, unitDescription: "agreements/quarter", lproScale: "N/A" },
      { serviceType: "legal-opinion", description: "Clearance and infringement opinions", billingModel: "per-item", serviceLimit: 4, unitDescription: "opinions/year", lproScale: "N/A" },
      { serviceType: "arbitration-mediation", description: "UAC and NADAC mediation of IP disputes", billingModel: "within-retainer", serviceLimit: 2, unitDescription: "mediations/year", lproScale: "N/A" },
    ],
    scope:
      "The firm shall advise on the protection and enforcement of the client's trade marks, patents and copyright, including prosecution of applications, renewals and opposition proceedings, and shall conduct pre-clearance searches and infringement assessment. The retainer covers prosecution and advisory work; contentious enforcement is quoted separately.",
    exclusions: [
      "Contentious trademark litigation before the Federal High Court",
      "Passport and trade mark agency fees paid to the Registrar General",
      "Counterfeit and online enforcement operations",
    ],
  },
  {
    retainerType: "specialized",
    nature: "tax law",
    label: "tax planning and advisory",
    titleKind: "Tax Advisory Retainer",
    fee: 900000,
    frequency: "monthly",
    tags: ["retainer", "tax", "advisory"],
    services: [
      { serviceType: "legal-opinion", description: "Transfer pricing, VAT and withholding tax opinions", billingModel: "within-retainer", serviceLimit: 4, unitDescription: "opinions/quarter", lproScale: "N/A" },
      { serviceType: "regulatory-compliance", description: "FIRS filings, tax clearance and TIN/ VAT registration matters", billingModel: "per-item", serviceLimit: 6, unitDescription: "filings/year", lproScale: "N/A" },
      { serviceType: "drafting-review", description: "Review of tax clauses in commercial and financing documents", billingModel: "within-retainer", serviceLimit: 5, unitDescription: "documents/quarter", lproScale: "N/A" },
    ],
    scope:
      "The firm shall provide continuing tax advisory services covering direct and indirect tax compliance review, transfer pricing documentation, structuring of new investments and periodic review of the client's tax positions, together with a written annual tax risk memorandum for the client's board.",
    exclusions: [
      "Representation before the Tax Appeal Tribunal or Federal High Court",
      "Statutory audit of tax returns and tax computation preparation",
      "Transfer pricing filing and the preparation of local file documentation",
    ],
  },
  {
    retainerType: "general-legal",
    nature: "contract dispute",
    label: "litigation and debt recovery",
    titleKind: "Litigation & Debt Recovery Retainer",
    fee: 750000,
    frequency: "quarterly",
    tags: ["retainer", "litigation", "recovery"],
    litigation: true,
    services: [
      { serviceType: "litigation-advocacy", description: "Appearance at pre-trial conferences and trial", billingModel: "lpro-scale", serviceLimit: 12, unitDescription: "appearances/quarter", lproScale: "Scale 3", lproReference: "Item 14 - Civil Litigation" },
      { serviceType: "drafting-review", description: "Writs of summons, statements of claim and pleadings", billingModel: "lpro-scale", serviceLimit: 10, unitDescription: "documents/quarter", lproScale: "Scale 3" },
      { serviceType: "other", description: "Debt demand and pre-action settlement notices", billingModel: "within-retainer", serviceLimit: 15, unitDescription: "demands/quarter", lproScale: "N/A" },
    ],
    scope:
      "The firm shall conduct pre-action and litigation recovery of the client's outstanding debts, including the issue of demand notices, negotiation of settlements, filing and prosecution of claims, and the making of all court appearances necessary up to first appeal. The retainer is billed on the applicable LPRO 2023 scale, with court and registry disbursements charged at cost.",
    exclusions: [
      "Appeals beyond first instance",
      "Substantial cross-claims and third-party proceedings",
      "Enforcement of judgments beyond the agreed number of steps",
    ],
  },
  {
    retainerType: "general-legal",
    nature: "employment law",
    label: "employment and labour",
    titleKind: "Employment & Labour Retainer",
    fee: 350000,
    frequency: "monthly",
    tags: ["retainer", "employment", "hr"],
    services: [
      { serviceType: "drafting-review", description: "Employment contracts, policies and disciplinary documentation", billingModel: "within-retainer", serviceLimit: 10, unitDescription: "documents/quarter", lproScale: "N/A" },
      { serviceType: "legal-opinion", description: "Advice on redundancy, dismissal and employee discipline", billingModel: "per-item", serviceLimit: 4, unitDescription: "queries/quarter", lproScale: "N/A" },
      { serviceType: "arbitration-mediation", description: "Internal grievance and workplace mediation", billingModel: "within-retainer", serviceLimit: 4, unitDescription: "matters/quarter", lproScale: "N/A" },
    ],
    scope:
      "The firm shall advise the client as its external employment counsel on the drafting and enforcement of employment contracts and policies, on disciplinary and grievance procedures including internal hearings, and on redundancy, restructuring and workplace compliance matters, and shall conduct mediation of internal disputes where instructed.",
    exclusions: [
      "Representation in the National Industrial Court beyond internal stages",
      "Pension, gratuity and long-term benefit quantification",
      "Recruitment and background screening services",
    ],
  },
  {
    retainerType: "other",
    nature: "notarial services",
    label: "notarial and certification work",
    titleKind: "Notarial & Certification Retainer",
    fee: 200000,
    frequency: "quarterly",
    tags: ["retainer", "notarial"],
    services: [
      { serviceType: "notarial-services", description: "Attestation, certification and notarisation of client documents", billingModel: "within-retainer", serviceLimit: 20, unitDescription: "documents/quarter", lproScale: "N/A" },
      { serviceType: "other", description: "Affidavit drafting and verification of documents for foreign use", billingModel: "per-item", serviceLimit: 8, unitDescription: "documents/quarter", lproScale: "N/A" },
    ],
    scope:
      "The firm shall notarise, certify and attest documents presented by the client, draft and witness affidavits, and effect the verification and authentication of documents required for use outside Nigeria, subject to apostille and consulate availability.",
    exclusions: [
      "Apostille and consulate fees payable to the Federal Ministry of Justice and the embassy",
      "Commissioning of documents outside the firm's jurisdiction",
      "Substantial disbursements incurred in travelling to attest documents",
    ],
  },
];

// ============================================
// DISBURSEMENT & ACTIVITY POOLS
// ============================================

const DISBURSEMENT_POOL = [
  { item: "NBA stamp", category: "stamps" },
  { item: "Court filing fee", category: "court-fees" },
  { item: "CAC filing fee", category: "registry-fees" },
  { item: "Land registry fee", category: "registry-fees" },
  { item: "Court transportation", category: "transport" },
  { item: "External counsel fees", category: "professional-fees" },
  { item: "Search and registry charges", category: "registry-fees" },
  { item: "Courier and document handling", category: "other" },
];

const ACTIVITY_DESCRIPTIONS = [
  "Attended to client instruction and issued substantive advice",
  "Reviewed and settled agreement documentation with the client",
  "Prepared and filed statutory documents with the registry",
  "Held conference with the client and updated the engagement scope",
  "Drafted correspondence to a counterparty and monitored response",
  "Attended pre-trial conference before the court",
  "Updated retainer usage schedule and issued monthly statement",
  "Conducted due diligence search and reported findings",
];

// Shared agreement-term calculation so the Matter dates and the RetainerDetail
// dates always agree.
const termDates = (bp, i, firmIndex) => {
  const startDate = daysAgo(150 + i * 21 + ((firmIndex * 9) % 120));
  const termMonths = pick([6, 12, 12, 24], firmIndex + i);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + termMonths);
  return { startDate, endDate, termMonths };
};

// ============================================
// RETAINER DETAIL BUILDER
// ============================================

const buildRetainerDetail = (firm, matter, bp, ctx, i, firmIndex) => {
  const { client, status, litigation } = ctx;

  const fee = roundTo((bp.fee * (1 + ((firmIndex + 1) * (i + 2)) % 3)) / 1, 5000);
  const { startDate, endDate, termMonths } = termDates(bp, i, firmIndex);
  const expired = status === "closed" || endDate < new Date();

  const servicesIncluded = bp.services.map((s, n) => {
    const limit = s.serviceLimit;
    let usageCount = 0;
    if (limit != null) {
      const ratio = status === "active" ? ((i + n + 1) % 5) / 6 : status === "completed" ? 0.9 : 0.2;
      usageCount = Math.min(limit, Math.round(limit * ratio));
    } else {
      usageCount = 2 + ((i + n) % 7);
    }
    return {
      serviceType: s.serviceType,
      description: s.description,
      billingModel: s.billingModel,
      unitDescription: s.unitDescription || "units",
      serviceLimit: limit != null ? Math.round(limit * (expired ? 1.15 : 1)) : undefined,
      usageCount,
      lproScale: s.lproScale || "N/A",
      lproReference: s.lproReference,
    };
  });

  // Disbursements - only for matters that are running or completed
  const disbCount = status === "pending" ? 1 : 2 + (i % 3);
  const disbursements = [];
  for (let n = 0; n < disbCount; n++) {
    const pool = pick(DISBURSEMENT_POOL, firmIndex + i + n);
    const estimated = roundTo(25000 + ((firmIndex + 1) * (i + n + 3) * 37000) % 1800000, 5000);
    const hasActual = status !== "pending" && (i + n) % 3 !== 0;
    disbursements.push({
      item: pool.item,
      category: pool.category,
      estimatedAmount: estimated,
      actualAmount: hasActual ? roundTo(estimated * (0.85 + ((i + n) % 4) * 0.08), 5000) : undefined,
      isBillableToClient: true,
      receiptRequired: pool.category !== "transport",
      receiptNumber:
        pool.category === "transport"
          ? undefined
          : `RCP/${new Date().getFullYear()}/${String(firmIndex + 1).padStart(2, "0")}${String(i + 1).padStart(3, "0")}${String(n + 1).padStart(2, "0")}`,
      incurredDate: daysAgo(10 + n * 25 + (i % 40)),
    });
  }
  const totalDisbursements = disbursements.reduce(
    (sum, d) => sum + (d.actualAmount != null ? d.actualAmount : d.estimatedAmount || 0),
    0,
  );

  // Requests - the retainer request log
  const requestCount = status === "pending" ? 2 : 4 + (i % 3);
  const requests = Array.from({ length: requestCount }, (_, n) => {
    const isLast = n === requestCount - 1;
    const requestDate = daysAgo(6 + n * 18 + ((i * 3) % 20));
    const rStatus = status === "closed" ? "completed" : isLast ? pick(["pending", "in-progress", "completed"], i) : "completed";
    return {
      requestDate,
      requestType: pick(REQUEST_TYPES, firmIndex + i + n),
      description: `${pick(REQUEST_TYPES, firmIndex + i + n)} - ${bp.label} workstream handled under the retainer.`,
      responseDate: rStatus === "completed" ? new Date(requestDate.getTime() + (2 + (n % 5)) * 24 * 60 * 60 * 1000) : undefined,
      status: rStatus,
      unitsConsumed: 1 + ((i + n) % 3),
    };
  });

  // Activity log
  const activityCount = 3 + (i % 4);
  const activityLog = Array.from({ length: activityCount }, (_, n) => ({
    actionDate: daysAgo(5 + n * 22 + ((i * 5) % 15)),
    description: pick(ACTIVITY_DESCRIPTIONS, firmIndex + i + n),
    unitsConsumed: 1 + ((i + n) % 3),
    serviceType: pick(bp.services, (firmIndex + i + n) % bp.services.length).serviceType,
  }));

  // Court appearances - only for litigation-flavoured retainers
  let courtAppearances = [];
  if (litigation) {
    const appCount = 2 + (i % 3);
    courtAppearances = Array.from({ length: appCount }, (_, n) => {
      const future = n === appCount - 1;
      const appearanceDate = future ? daysFromNow(21 + n * 30) : daysAgo(30 + n * 35);
      return {
        appearanceDate,
        court: pick(COURTS, firmIndex + i + n),
        suitNumber: `FHC/ABJ/${2024 + (i % 2)}/${1200 + firmIndex * 37 + i * 11 + n}`,
        purpose: pick(["mention", "hearing", "ruling", "adjournment"], firmIndex + i + n),
        outcome: future ? undefined : pick(["Adjourned for further filings", "Matter part-heard", "Ruling delivered", "Settled by counsel"], firmIndex + i + n),
        nextAdjourned: future ? daysFromNow(35 + n * 20) : undefined,
        withinRetainer: n % 3 !== 0,
        additionalFee:
          n % 3 === 0
            ? {
                amount: roundTo(150000 + ((i + n) % 4) * 120000, 5000),
                justification: "Appearance exceeds the number of appearances included in the retainer; charged at the agreed additional-fee rate.",
              }
            : undefined,
      };
    });
  }

  const requiresNBAStamp = true;
  const stampValue = roundTo((fee * 0.1) / 10, 100);

  return {
    matterId: matter._id,
    firmId: firm._id,
    retainerType: bp.retainerType,

    agreementStartDate: startDate,
    agreementEndDate: endDate,
    autoRenewal: bp.retainerType !== "retainer-deposit" && (i + firmIndex) % 3 !== 0,
    renewalTerms:
      bp.retainerType === "retainer-deposit"
        ? "The deposit arrangement renews on written request; unused balance carries forward for a further period of twelve months."
        : "Renews automatically for successive periods of twelve months unless either party gives written notice within thirty days of the agreement end date.",

    servicesIncluded,
    scopeDescription: bp.scope,
    exclusions: bp.exclusions,

    billing: {
      retainerFee: fee,
      currency: "NGN",
      frequency: bp.frequency,
      vatRate: 7.5,
      applyVAT: (i + firmIndex) % 5 !== 0,
      applyWHT: true,
      whtRate: whtRateFor(client),
      additionalFees: {
        isApplicable: litigation || bp.retainerType === "retainer-deposit",
        description: litigation
          ? "Court appearances beyond the number included in the retainer, and substantial documents, are charged at the agreed additional-fee rate on the LPRO 2023 scale."
          : "Work falling outside the agreed scope is charged at the firm's standard hourly rates, notified to and approved by the client before it is undertaken.",
      },
      billingCap: {
        isApplicable: bp.frequency === "monthly" && (i % 3 === 0),
        amount: fee * 4,
        period: bp.frequency === "monthly" ? "quarterly" : bp.frequency,
      },
    },

    disbursements,
    totalDisbursements,

    responseTimes: {
      routine: { value: pick([24, 48, 72], firmIndex + i), unit: "hours" },
      urgent: { value: pick([4, 6, 8], firmIndex + i), unit: "hours" },
    },
    meetingSchedule: {
      frequency: pick(["monthly", "quarterly", "monthly", "as-needed"], firmIndex + i),
      description: pick(
        [
          "Monthly status call with the client's in-house team.",
          "Quarterly retainer review meeting with the client and the account officer.",
          "Monthly status call, escalated to a meeting within five working days of any urgent instruction.",
          "Retainer review held as and when required, with a minimum of five working days' notice.",
        ],
        firmIndex + i,
      ),
    },
    reportingRequirements: {
      frequency: bp.frequency === "one-off" ? "as-needed" : bp.frequency === "annually" ? "annually" : "monthly",
      format: "Written retainer statement showing services rendered, units consumed, disbursements and the balance of the retainer.",
    },

    activityLog,
    totalRequestsHandled: requests.filter((r) => r.status === "completed").length,
    requests,
    courtAppearances,

    requiresNBAStamp,
    nbaStampDetails: {
      stampNumber: `NBA/${new Date().getFullYear()}/${String(firmIndex + 1).padStart(2, "0")}${String(i + 1).padStart(4, "0")}`,
      stampDate: startDate,
      stampValue,
    },

    terminationClause: {
      noticePeriod: { value: pick([30, 60, 90], firmIndex + i), unit: "days" },
      conditions: pick(
        [
          "Either party may terminate on thirty days' written notice. Fees and disbursements properly incurred to the date of termination remain payable, and any unutilised retainer balance is refunded within fourteen days.",
          "The client may terminate on written notice at any time; the firm may terminate only for non-payment of fees or for a serious breach of the engagement terms, in each case on thirty days' notice.",
          "Termination requires sixty days' written notice from either party, after which the firm will wind down the engagement, hand over the client's file and account for all unutilised funds.",
        ],
        firmIndex + i,
      ),
    },

    isDeleted: false,
    createdBy: matter.createdBy,
    lastModifiedBy: matter.lastModifiedBy,
  };
};

// ============================================
// MATTER BUILDER
// ============================================

const descriptionFor = (bp, clientLabel) =>
  `Ongoing ${bp.label} retainer arrangement with ${clientLabel} covering the services set out in the ` +
  `retainer agreement, with services provided on the agreed billing model and reported in accordance with the ` +
  `statement of services.`;

const buildMatterData = (firm, bp, client, officer, firmIndex, i, sequence, year) => {
  const clientLabel = clientName(client);
  const status = pick(STATUSES, firmIndex + i);
  const counterparty = pick(COUNTERPARTIES, firmIndex + i + 2);

  return {
    firmId: firm._id,
    matterNumber: `MTR/${year}/${String(sequence).padStart(4, "0")}`,
    officeFileNo: `OFC/${year}/R${String(firmIndex + 1).padStart(3, "0")}${String(i + 1).padStart(3, "0")}`,
    matterType: "retainer",
    category: "n/a",
    natureOfMatter: bp.nature,
    title: `${bp.titleKind} - ${clientLabel}`,
    description: descriptionFor(bp, clientLabel),
    status,
    priority: pick(PRIORITIES, firmIndex + i),
    client: client._id,
    accountOfficer: [officer._id],
    opposingParties: bp.litigation ? [{ name: counterparty }] : [],
    contactPersons: [
      {
        name: clientLabel,
        phone: client.phone,
        email: client.email,
        role: "client contact",
      },
    ],
    objectives: [
      { name: "Deliver the retainer services within the agreed service levels" },
      { name: "Maintain an accurate record of retainer usage, fees and disbursements" },
    ],
    strengths: [
      { name: "Defined scope of services with agreed service levels" },
      { name: "Dedicated account officer and named contact at the client" },
    ],
    weaknesses: [{ name: "Retainer units are finite and require re-engagement once exhausted" }],
    risks: [{ name: "Unanticipated work outside the agreed scope may increase fees" }],
    stepsToBeTaken: [
      { name: "Confirm retainer scope and billing model with the client" },
      { name: "Apply the NBA stamp and record the agreement on the firm's register of retainers" },
    ],
    dateOpened: termDates(bp, i, firmIndex).startDate,
    expectedClosureDate:
      status === "active" || status === "pending"
        ? termDates(bp, i, firmIndex).endDate
        : undefined,
    actualClosureDate: ["completed", "won", "settled", "closed"].includes(status)
      ? daysAgo(5 + ((i * 7) % 25))
      : undefined,
    lastActivityDate: daysAgo(1 + (i % 12)),
    billingType: "retainer",
    estimatedValue: bp.fee * 12,
    currency: "NGN",
    isFiledByTheOffice: i % 2 === 0,
    isConfidential: true,
    conflictChecked: true,
    conflictCheckDate: daysAgo(160 + i * 20),
    tags: bp.tags,
    generalComment: "Retainer agreement on file; review of usage and scope is diarised for the next review date.",
    internalNotes: `Seed retainer matter ${i + 1}/${COUNT} for ${firm.name}.`,
    createdBy: officer._id,
    lastModifiedBy: officer._id,
  };
};

// ============================================
// FIRM USERS
// ============================================

async function getFirmUsers(firm) {
  const clients = await User.find({
    firmId: firm._id,
    userType: "client",
    isActive: true,
  });
  const lawyers = await User.find({
    firmId: firm._id,
    userType: "staff",
    role: "lawyer",
    isActive: true,
  });
  const fallbackStaff = await User.find({
    firmId: firm._id,
    userType: "staff",
    isActive: true,
  });
  const officers = lawyers.length > 0 ? lawyers : fallbackStaff;
  return { clients, officers };
}

// Choose the blueprint that best matches an existing matter title
const blueprintForExistingMatter = (title) => {
  const t = String(title || "").toLowerCase();
  if (t.includes("secretarial") || t.includes("statutory") || t.includes("filings")) return BLUEPRINTS[1];
  if (t.includes("litigation") || t.includes("recovery") || t.includes("debt")) return BLUEPRINTS[5];
  if (t.includes("ip") || t.includes("trademark") || t.includes("brand")) return BLUEPRINTS[3];
  if (t.includes("tax")) return BLUEPRINTS[4];
  if (t.includes("notarial") || t.includes("certification")) return BLUEPRINTS[7];
  if (t.includes("employment") || t.includes("labour")) return BLUEPRINTS[6];
  if (t.includes("deposit") || t.includes("draw-down")) return BLUEPRINTS[2];
  return BLUEPRINTS[0];
};

// ============================================
// SEEDING
// ============================================

async function seedFirmRetainers(firm, firmIndex) {
  const { clients, officers } = await getFirmUsers(firm);
  if (clients.length === 0 || officers.length === 0) {
    console.log(`   ⚠️ Skipping ${firm.name}: no clients/officers. Run utils/seedUser.js first.`);
    return { matters: 0, details: 0, backfilled: 0, skipped: 0 };
  }

  const year = new Date().getFullYear();
  const prefix = `MTR/${year}/`;

  console.log(`\n💼 Firm: ${firm.name} (${firm.subdomain})`);

  // ---------------------------------------------------------
  // 1) BACKFILL: create details for retainer matters that lack one
  // ---------------------------------------------------------
  const retainerMatters = await Matter.find(
    { firmId: firm._id, matterType: "retainer" },
    { title: 1, client: 1, accountOfficer: 1, createdBy: 1, lastModifiedBy: 1 },
  ).setOptions({ includeDeleted: true });

  const existingDetails = await RetainerDetail.find(
    { firmId: firm._id },
    { matterId: 1 },
  );
  const detailedMatterIds = new Set(existingDetails.map((d) => String(d.matterId)));

  let backfilled = 0;
  for (let k = 0; k < retainerMatters.length; k++) {
    const m = retainerMatters[k];
    if (detailedMatterIds.has(String(m._id))) continue;
    const bp = blueprintForExistingMatter(m.title);
    const client = clients.find((c) => String(c._id) === String(m.client)) || pick(clients, k);
    const detailData = buildRetainerDetail(
      firm,
      m,
      bp,
      { client, status: m.status, litigation: !!bp.litigation },
      k,
      firmIndex,
    );
    await RetainerDetail.create(detailData);
    backfilled++;
    console.log(`   🩹 Backfilled detail: ${m.title}`);
  }

  if (BACKFILL_ONLY) {
    return { matters: 0, details: backfilled, backfilled, skipped: retainerMatters.length };
  }

  // ---------------------------------------------------------
  // 2) ADD: new retainer matters + details
  // ---------------------------------------------------------
  const allTitles = await Matter.find({ firmId: firm._id }, { title: 1 }).setOptions({
    includeDeleted: true,
  });
  const existingTitles = new Set(allTitles.map((m) => m.title));

  const existingCount = await Matter.countDocuments({
    firmId: firm._id,
    matterNumber: new RegExp(`^${prefix}`),
  });
  let sequence = existingCount;

  let created = 0;
  let details = 0;
  let skipped = 0;

  for (let i = 0; i < COUNT; i++) {
    const bp = pick(BLUEPRINTS, firmIndex * 5 + i);
    const client = pick(clients, i + firmIndex);
    const officer = pick(officers, i);
    const clientLabel = clientName(client);
    const title = `${bp.titleKind} - ${clientLabel}`;

    if (existingTitles.has(title)) {
      console.log(`   ⏭️  Skipped (already exists): ${title}`);
      skipped++;
      continue;
    }

    const status = pick(STATUSES, firmIndex + i);
    const matterData = buildMatterData(
      firm,
      bp,
      client,
      officer,
      firmIndex,
      i,
      sequence + 1,
      year,
    );

    const matterDoc = await Matter.create(matterData);
    existingTitles.add(title);
    sequence++;
    created++;

    const detailData = buildRetainerDetail(
      firm,
      matterDoc,
      bp,
      { client, status, litigation: !!bp.litigation },
      i,
      firmIndex,
    );
    await RetainerDetail.create(detailData);
    details++;

    console.log(`   ✅ Created: ${title}  [${bp.retainerType} / ${bp.frequency}]`);
  }

  return { matters: created, details, backfilled, skipped };
}

// ============================================
// MAIN
// ============================================

const seedRetainers = async () => {
  try {
    await mongoose.connect(DB);
    console.log("✅ Database connected");

    const firms = await Firm.find(ONLY_FIRM ? { subdomain: ONLY_FIRM } : {});
    if (firms.length === 0) {
      console.error(
        `❌ No firms found${ONLY_FIRM ? ` for subdomain "${ONLY_FIRM}"` : ""}. Run utils/seedFirm.js first.`,
      );
      process.exit(0);
    }

    if (CLEAN) {
      const firmIds = firms.map((f) => f._id);
      const matters = await Matter.find({
        firmId: { $in: firmIds },
        matterType: "retainer",
      });
      const matterIds = matters.map((m) => m._id);
      const delDetails = await RetainerDetail.deleteMany({
        matterId: { $in: matterIds },
      });
      const delMatters = await Matter.deleteMany({ _id: { $in: matterIds } });
      console.log(
        `🧹 Cleaned target firms: ${delMatters.deletedCount} retainer matter(s), ${delDetails.deletedCount} retainer detail(s)`,
      );
    }

    let totalMatters = 0;
    let totalDetails = 0;
    let totalBackfilled = 0;
    let totalSkipped = 0;
    const summaries = [];

    for (let f = 0; f < firms.length; f++) {
      const res = await seedFirmRetainers(firms[f], f);
      totalMatters += res.matters;
      totalDetails += res.details;
      totalBackfilled += res.backfilled;
      totalSkipped += res.skipped;
      summaries.push(
        `${firms[f].subdomain}: ${res.matters} new, ${res.backfilled} backfilled, ${res.skipped} skipped, ${res.details} detail(s)`,
      );
    }

    console.log("\n========================================");
    console.log("📊 Retainer seeding complete!");
    console.log(`   Firms: ${firms.length}`);
    console.log(`   New retainer matters: ${totalMatters}`);
    console.log(`   Retainer details created: ${totalDetails} (backfilled ${totalBackfilled})`);
    console.log(`   Skipped (already existed): ${totalSkipped}`);
    console.log(`   Summary:`);
    for (const s of summaries) console.log(`      - ${s}`);
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding retainer matters:", error);
    process.exit(1);
  }
};

seedRetainers();
