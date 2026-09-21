// utils/seedCorporateMatters.js - Seed corporate matters ONLY, with full CorporateDetail
//
// Usage:
//   node utils/seedCorporateMatters.js                      # seed (idempotent, skips existing)
//   node utils/seedCorporateMatters.js --firm=apex-partners # seed only one firm
//   node utils/seedCorporateMatters.js --count=15           # matters per firm (default 12)
//   node utils/seedCorporateMatters.js --clean              # wipe corporate matters/details, then seed
//
// Run seedFirm.js -> seedUser.js FIRST so firms, staff and clients exist.
// Each firm gets its OWN corporate matters (matterType: "corporate"), every one
// linked to its firm via firmId and to a client + account officer. Each matter
// also gets a fully populated CorporateDetail (company info, parties,
// shareholders, directors, financials, milestones, due diligence, regulatory
// approvals, compliance requirements, key agreements, governance, legal
// opinions, post-completion obligations and risks).

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const Firm = require("../models/firmModel");
const User = require("../models/userModel");
const Matter = require("../models/matterModel");
const CorporateDetail = require("../models/corporateDetailModel");

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

const CLEAN = process.argv.includes("--clean");
const firmArg = process.argv.find((a) => a.startsWith("--firm="));
const ONLY_FIRM = firmArg ? firmArg.split("=")[1] : null;
const countArg = process.argv.find((a) => a.startsWith("--count="));
const COUNT = Math.max(1, parseInt(countArg ? countArg.split("=")[1] : "12", 10) || 12);

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

// ============================================
// POOLS (rotated per firm so every firm gets its own matters)
// ============================================

const COMPANIES = [
  "First Atlantic Container Ltd",
  "Korede Int'l Traders Ltd",
  "Brightline Energy Plc",
  "Jade Agro-Allied Ltd",
  "CityGate Realty Ltd",
  "NovaLink Technologies Ltd",
  "Suncoast Transport Ltd",
  "Amber Fashion House Ltd",
  "BlueChip Manufacturing Ltd",
  "Quantum Health Ltd",
  "Echo Media Group Ltd",
  "Terra Fields Ltd",
  "Meridian Capital Partners Ltd",
  "GreenAxis Power Ltd",
  "Aurora Logistics Ltd",
  "Pinnacle Foods Nigeria Ltd",
  "Sterling Microfinance Bank Ltd",
  "Delta Petrochem Ltd",
  "Crescent Pharma Ltd",
  "Ironbridge Construction Ltd",
];

const COUNTERPARTIES = [
  "Zenith Holdings Plc",
  "Northwind Equity Ltd",
  "Sahara Infrastructure Ltd",
  "Cobalt Industries Ltd",
  "Trident Assurance Plc",
  "LagosFreezone Developments Ltd",
  "Kano Agro Processing Ltd",
  "Atlas Securities Ltd",
  "Riverside Bank Ltd",
  "Helios Ventures Ltd",
  "Mansa Telecom Ltd",
  "Onyx Retail Group Ltd",
];

const SHAREHOLDER_NAMES = [
  "Chief Emeka Okoli",
  "Mrs. Kemi Balogun",
  "Alhaji Garba Idris",
  "Chief Mrs. Ngozi Eze",
  "Barr. Yusuf Bello",
  "Chief Tunde Adebayo",
  "Mrs. Fola Ola-Bello",
  "Dr. Ikenna Obi",
  "Hajiya Aisha Musa",
  "Mr. Bayo Fashola",
  "Ms. Chiamaka Nwosu",
  "Mr. Sani Abubakar",
];

const STATUSES = ["active", "active", "pending", "completed", "active", "closed"];

const PRIORITIES = ["high", "medium", "urgent", "low", "high", "medium"];

const BILLING = ["fixed", "hourly", "fixed", "retainer", "hourly", "fixed"];

const DIRECTOR_POSITIONS = [
  "Managing Director",
  "Executive Director",
  "Non-Executive Director",
  "Company Secretary",
  "Finance Director",
];

const JURISDICTIONS = [
  "Federal Capital Territory, Nigeria",
  "Lagos State, Nigeria",
  "Rivers State, Nigeria",
  "Ogun State, Nigeria",
  "Kano State, Nigeria",
];

const AGREEMENT_TYPES = [
  "Share Purchase Agreement",
  "Asset Purchase Agreement",
  "Merger Agreement",
  "Joint Venture Agreement",
  "Shareholders Agreement",
  "Subscription Agreement",
  "Underwriting Agreement",
  "Loan Agreement",
  "Security Agreement",
  "Franchise Agreement",
  "Distribution Agreement",
  "License Agreement",
  "Non-Disclosure Agreement",
  "Service Agreement",
  "Management Agreement",
  "Escrow Agreement",
];

const OPINION_TYPES = [
  "Tax Opinion",
  "Regulatory Opinion",
  "Legal Due Diligence Opinion",
  "Corporate Opinion",
  "Compliance Opinion",
  "IP Opinion",
];

// ============================================
// TRANSACTION BLUEPRINTS (20 corporate types)
// `authority` seeds the regulatory approval; `agreement` the key document.
// ============================================

const BLUEPRINTS = [
  { transactionType: "merger_acquisition", nature: "merger and acquisition", companyType: "private_limited", agreement: "Merger Agreement", authority: "FCCPC", paymentStructure: "milestone_based", tags: ["m&a", "merger", "regulatory"] },
  { transactionType: "company_incorporation", nature: "company incorporation", companyType: "private_limited", agreement: "Service Agreement", authority: "CAC", paymentStructure: "lump_sum", tags: ["incorporation", "cac"] },
  { transactionType: "joint_venture", nature: "joint venture", companyType: "private_limited", agreement: "Joint Venture Agreement", authority: "CAC", paymentStructure: "milestone_based", tags: ["joint venture", "structuring"] },
  { transactionType: "shareholder_agreement", nature: "shareholder agreement", companyType: "private_limited", agreement: "Shareholders Agreement", authority: "CAC", paymentStructure: "lump_sum", tags: ["governance", "shareholders"] },
  { transactionType: "corporate_governance", nature: "corporate governance", companyType: "public_limited", agreement: "Management Agreement", authority: "SEC", paymentStructure: "installments", tags: ["governance", "board"] },
  { transactionType: "securities_offering", nature: "securities", companyType: "public_limited", agreement: "Underwriting Agreement", authority: "SEC", paymentStructure: "milestone_based", tags: ["securities", "capital markets"] },
  { transactionType: "private_equity", nature: "private equity", companyType: "private_limited", agreement: "Subscription Agreement", authority: "SEC", paymentStructure: "milestone_based", tags: ["private equity", "investment"] },
  { transactionType: "venture_capital", nature: "venture capital", companyType: "private_limited", agreement: "Subscription Agreement", authority: "SEC", paymentStructure: "milestone_based", tags: ["venture capital", "funding"] },
  { transactionType: "debt_financing", nature: "banking and finance", companyType: "private_limited", agreement: "Loan Agreement", authority: "CBN", paymentStructure: "installments", tags: ["debt", "financing", "security"] },
  { transactionType: "restructuring", nature: "restructuring", companyType: "public_limited", agreement: "Security Agreement", authority: "SEC", paymentStructure: "milestone_based", tags: ["restructuring", "reorganisation"] },
  { transactionType: "insolvency", nature: "insolvency", companyType: "private_limited", agreement: "Escrow Agreement", authority: "CAC", paymentStructure: "installments", tags: ["insolvency", "receivership"] },
  { transactionType: "corporate_compliance", nature: "corporate governance", companyType: "private_limited", agreement: "Service Agreement", authority: "CAC", paymentStructure: "lump_sum", tags: ["compliance", "filings"] },
  { transactionType: "board_advisory", nature: "corporate governance", companyType: "public_limited", agreement: "Management Agreement", authority: "SEC", paymentStructure: "installments", tags: ["board advisory", "governance"] },
  { transactionType: "share_purchase", nature: "merger and acquisition", companyType: "private_limited", agreement: "Share Purchase Agreement", authority: "FCCPC", paymentStructure: "milestone_based", tags: ["share purchase", "due diligence"] },
  { transactionType: "asset_purchase", nature: "merger and acquisition", companyType: "private_limited", agreement: "Asset Purchase Agreement", authority: "FCCPC", paymentStructure: "milestone_based", tags: ["asset purchase", "acquisition"] },
  { transactionType: "divestiture", nature: "restructuring", companyType: "public_limited", agreement: "Asset Purchase Agreement", authority: "SEC", paymentStructure: "milestone_based", tags: ["divestiture", "disposal"] },
  { transactionType: "partnership_formation", nature: "joint venture", companyType: "partnership", agreement: "Joint Venture Agreement", authority: "CAC", paymentStructure: "lump_sum", tags: ["partnership", "formation"] },
  { transactionType: "franchise_agreement", nature: "other", companyType: "private_limited", agreement: "Franchise Agreement", authority: "FCCPC", paymentStructure: "installments", tags: ["franchise", "licensing"] },
  { transactionType: "distribution_agreement", nature: "other", companyType: "private_limited", agreement: "Distribution Agreement", authority: "FCCPC", paymentStructure: "installments", tags: ["distribution", "commercial"] },
  { transactionType: "licensing", nature: "other", companyType: "private_limited", agreement: "License Agreement", authority: "NOTAP", paymentStructure: "lump_sum", tags: ["licensing", "technology"] },
];

// ============================================
// MATTER TITLE / DESCRIPTION
// ============================================

const titleFor = (bp, company, counterparty) => {
  switch (bp.transactionType) {
    case "merger_acquisition":
      return `Acquisition of ${company} by ${counterparty}`;
    case "company_incorporation":
      return `Incorporation of ${company} (CAC Filings & Tax Registration)`;
    case "joint_venture":
      return `Joint Venture between ${company} and ${counterparty}`;
    case "shareholder_agreement":
      return `Shareholders' Agreement for ${company}`;
    case "corporate_governance":
      return `Corporate Governance Review - ${company}`;
    case "securities_offering":
      return `${company} Public Offer & Securities Registration`;
    case "private_equity":
      return `Private Equity Investment in ${company} by ${counterparty}`;
    case "venture_capital":
      return `Series A Investment in ${company} by ${counterparty}`;
    case "debt_financing":
      return `Term Loan Facility for ${company} from ${counterparty}`;
    case "restructuring":
      return `Corporate Restructuring of ${company}`;
    case "insolvency":
      return `Insolvency & Receivership Advisory - ${company}`;
    case "corporate_compliance":
      return `Annual Statutory Compliance for ${company}`;
    case "board_advisory":
      return `Board Advisory Engagement - ${company}`;
    case "share_purchase":
      return `Share Purchase Agreement - ${counterparty} / ${company}`;
    case "asset_purchase":
      return `Asset Acquisition by ${company} from ${counterparty}`;
    case "divestiture":
      return `Divestiture of ${counterparty} Assets to ${company}`;
    case "partnership_formation":
      return `Formation of ${company} & ${counterparty} Partnership`;
    case "franchise_agreement":
      return `Franchise Agreement for ${company}`;
    case "distribution_agreement":
      return `Distribution Agreement - ${company} / ${counterparty}`;
    case "licensing":
      return `Technology Licensing for ${company}`;
    default:
      return `Corporate Matter - ${company}`;
  }
};

const descriptionFor = (bp, company) =>
  `Corporate/commercial transaction for ${company} relating to ${bp.nature}. ` +
  `Involves structuring, documentation, due diligence and the regulatory filings required to complete the ${bp.transactionType.replace(/_/g, " ")}.`;

// ============================================
// CORPORATE DETAIL BUILDER
// ============================================

const buildCorporateDetail = (firm, matter, bp, ctx, i, firmIndex) => {
  const { company, counterparty, registrationNumber, incorporationJurisdiction, status } =
    ctx;

  const baseCapital = roundTo(1000000 + ((firmIndex + 1) * (i + 3) * 2500000) % 90000000, 100000);
  const dealValue = roundTo(5000000 + ((firmIndex + 1) * (i + 7) * 8300000) % 950000000, 10000);

  const shareholders = [0, 1, 2].map((n) => {
    const pct = n === 0 ? 51 : n === 1 ? 29 : 20;
    return {
      name: pick(SHAREHOLDER_NAMES, firmIndex + i + n),
      numberOfShares: Math.round((baseCapital / 1) * (pct / 100)) || 0,
      shareClass: n === 0 ? "Ordinary" : "Ordinary",
      percentageOwnership: pct,
    };
  });

  const directors = [0, 1, 2].map((n) => ({
    name: pick(SHAREHOLDER_NAMES, firmIndex + i + n + 3),
    position: pick(DIRECTOR_POSITIONS, n),
    appointmentDate: daysAgo(400 + n * 90 + (i % 30)),
  }));

  const milestones = [
    { title: "Execute engagement letter", status: "completed", completedDate: daysAgo(50 + i) },
    { title: "Complete due diligence", status: i % 3 === 0 ? "in-progress" : "completed", completedDate: i % 3 === 0 ? undefined : daysAgo(30 + i) },
    { title: "Negotiate and finalise documents", status: i % 2 === 0 ? "in-progress" : "pending" },
    { title: "Obtain regulatory approvals", status: i % 4 === 0 ? "completed" : "pending", completedDate: i % 4 === 0 ? daysAgo(12) : undefined },
    { title: "Completion / closing", status: "pending" },
  ].map((m, idx) => ({
    ...m,
    dueDate: daysFromNow(15 + idx * 21 + ((i * 3) % 30)),
    notes: idx === 0 ? "Engagement terms agreed with client." : undefined,
  }));

  const regulatoryApprovals = [
    {
      authority: bp.authority,
      approvalType:
        bp.transactionType === "merger_acquisition" || bp.transactionType === "share_purchase" || bp.transactionType === "asset_purchase"
          ? "Merger Notification / Competition Clearance"
          : bp.authority === "CAC"
            ? "CAC Filing & Registration"
            : bp.authority === "SEC"
              ? "Securities Registration"
              : "Sector Approval",
      applicationDate: daysAgo(45 + i),
      approvalDate: i % 3 === 0 ? daysAgo(10) : undefined,
      status: i % 3 === 0 ? "approved" : "pending",
      referenceNumber: `${bp.authority}/APP/${new Date().getFullYear()}/${String(firmIndex + 1).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`,
    },
  ];

  const complianceRequirements = [
    { requirement: "File annual returns with CAC", dueDate: daysFromNow(30 + i), status: "pending" },
    { requirement: "Maintain statutory registers", dueDate: daysFromNow(60 + i), status: i % 2 === 0 ? "met" : "pending" },
    { requirement: "Hold board meeting and file minutes", dueDate: daysFromNow(90 + i), status: "pending" },
  ];

  const keyAgreements = [
    {
      agreementType: bp.agreement,
      executionDate: i % 2 === 0 ? daysAgo(20 + i) : undefined,
      effectiveDate: i % 2 === 0 ? daysAgo(15 + i) : undefined,
      status: i % 2 === 0 ? "executed" : "under-review",
    },
    {
      agreementType: "Non-Disclosure Agreement",
      executionDate: daysAgo(60 + i),
      effectiveDate: daysAgo(60 + i),
      status: "executed",
    },
  ];

  const legalOpinions = [
    {
      opinionType: pick(OPINION_TYPES, firmIndex + i),
      issuedDate: i % 2 === 0 ? daysAgo(8 + i) : undefined,
      summary: `Opinion covering the ${bp.nature} aspects of the transaction and the enforceability of the ${bp.agreement}.`,
    },
  ];

  const postCompletionObligations = [
    { obligation: "Update CAC register of members/directors", dueDate: daysFromNow(14 + i), status: "pending" },
    { obligation: "Deliver executed completion documents to client", dueDate: daysFromNow(7 + i), status: i % 2 === 0 ? "completed" : "pending" },
  ];

  const identifiedRisks = [
    { risk: "Regulatory approval may be delayed", severity: "medium", mitigation: "Engage regulator early and track application", status: "open" },
    { risk: "Title / ownership warranties may be inaccurate", severity: "high", mitigation: "Comprehensive due diligence and warranty protection", status: "mitigated" },
  ];

  return {
    matterId: matter._id,
    firmId: firm._id,
    transactionType: bp.transactionType,
    otherTransactionType: bp.transactionType === "other" ? "General corporate transaction" : undefined,

    parties: [
      { name: company, entityType: "company", registrationNumber, jurisdiction: incorporationJurisdiction, role: "Client / Principal" },
      { name: counterparty, entityType: "company", registrationNumber: `RC ${2000000 + firmIndex * 5000 + i * 211}`, jurisdiction: pick(JURISDICTIONS, firmIndex + i + 1), role: "Counterparty" },
    ],

    companyName: company,
    registrationNumber,
    companyType: bp.companyType,
    registrationDate: daysAgo(1500 + i * 30),
    incorporationJurisdiction,
    shareholders,
    directors,
    authorizedShareCapital: { amount: baseCapital, currency: "NGN" },
    paidUpCapital: { amount: roundTo(baseCapital * 0.75, 100000), currency: "NGN" },

    dealValue: { amount: dealValue, currency: "NGN" },
    paymentStructure: bp.paymentStructure,
    paymentTerms:
      bp.paymentStructure === "installments"
        ? "30% on execution, 40% on regulatory approval, 30% on completion."
        : bp.paymentStructure === "milestone_based"
          ? "Fees invoiced against agreed transaction milestones."
          : "Lump sum payable on execution of the engagement letter.",

    expectedClosingDate: daysFromNow(45 + (i * 17) % 150),
    actualClosingDate: status === "completed" ? daysAgo(5 + (i % 20)) : undefined,
    milestones,

    dueDiligence: {
      isRequired: true,
      startDate: daysAgo(40 + i),
      completionDate: i % 3 === 0 ? undefined : daysAgo(15 + i),
      status: i % 3 === 0 ? "in-progress" : "completed",
      scope: "Corporate, financial, regulatory and (where relevant) competition and tax due diligence.",
      findings: i % 3 === 0 ? undefined : "No material adverse findings; certain registrations require updating.",
    },

    regulatoryApprovals,
    complianceRequirements,
    keyAgreements,

    governanceStructure: {
      boardSize: directors.length,
      boardMeetingFrequency: "Quarterly",
      votingStructure: "Simple majority; reserved matters require 75% shareholder approval.",
      specialRights: "Investor reserved matters include changes to share capital, disposal of material assets and related-party transactions.",
    },

    legalOpinions,
    postCompletionObligations,
    identifiedRisks,
    isDeleted: false,
  };
};

// ============================================
// SEEDING
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

async function seedFirmCorporateMatters(firm, firmIndex) {
  const { clients, officers } = await getFirmUsers(firm);
  if (clients.length === 0 || officers.length === 0) {
    console.log(
      `   ⚠️ Skipping ${firm.name}: no clients/officers. Run utils/seedUser.js first.`,
    );
    return { matters: 0, details: 0, skipped: 0 };
  }

  const existing = await Matter.find({ firmId: firm._id }, { title: 1 }).setOptions({
    includeDeleted: true,
  });
  const existingTitles = new Set(existing.map((m) => m.title));

  const year = new Date().getFullYear();
  const prefix = `MTR/${year}/`;
  const existingCount = await Matter.countDocuments({
    firmId: firm._id,
    matterNumber: new RegExp(`^${prefix}`),
  });
  let sequence = existingCount;

  let created = 0;
  let details = 0;
  let skipped = 0;

  console.log(`\n🏢 Firm: ${firm.name} (${firm.subdomain})`);

  for (let i = 0; i < COUNT; i++) {
    const bp = pick(BLUEPRINTS, firmIndex * 3 + i);
    const company = pick(COMPANIES, firmIndex * 4 + i);
    const counterparty = pick(COUNTERPARTIES, firmIndex * 2 + i + 1);
    const title = titleFor(bp, company, counterparty);

    if (existingTitles.has(title)) {
      console.log(`   ⏭️  Skipped (already exists): ${title}`);
      skipped++;
      continue;
    }

    const client = pick(clients, i);
    const officer = pick(officers, i);

    const isCompany = bp.companyType !== "business_name" && bp.companyType !== "partnership";
    const registrationNumber = isCompany
      ? `RC ${1000000 + firmIndex * 10000 + i * 137}`
      : `BN ${2000000 + firmIndex * 10000 + i * 137}`;
    const incorporationJurisdiction = pick(JURISDICTIONS, firmIndex + i);

    const status = pick(STATUSES, i);
    const priority = pick(PRIORITIES, i);
    const billing = pick(BILLING, i);

    const matterData = {
      firmId: firm._id,
      matterNumber: `${prefix}${String(sequence + 1).padStart(4, "0")}`,
      officeFileNo: `OFC/${year}/C${String(firmIndex + 1).padStart(3, "0")}${String(i + 1).padStart(3, "0")}`,
      matterType: "corporate",
      category: "n/a",
      natureOfMatter: bp.nature,
      title,
      description: descriptionFor(bp, company),
      status,
      priority,
      client: client._id,
      accountOfficer: [officer._id],
      opposingParties: [{ name: counterparty }],
      contactPersons: [
        {
          name: clientName(client),
          phone: client.phone,
          email: client.email,
          role: "client contact",
        },
      ],
      objectives: [
        { name: "Complete the transaction within agreed timelines" },
        { name: "Protect the client's commercial and legal interests" },
      ],
      strengths: [{ name: "Experienced transaction team and clear documentation" }],
      weaknesses: [{ name: "Third-party regulatory approvals outside our control" }],
      risks: [{ name: "Delay in regulatory clearance could affect closing" }],
      stepsToBeTaken: [
        { name: "Finalise due diligence report" },
        { name: "Negotiate and execute transaction documents" },
      ],
      dateOpened: daysAgo(30 + ((i * 11) % 400)),
      expectedClosureDate:
        status === "active" || status === "pending"
          ? daysFromNow(45 + ((i * 23) % 300))
          : undefined,
      actualClosureDate: ["completed", "won", "settled", "closed"].includes(status)
        ? daysAgo(5 + ((i * 7) % 25))
        : undefined,
      lastActivityDate: daysAgo(1 + (i % 15)),
      billingType: billing,
      estimatedValue: roundTo(200000 + ((i * 419) % 40000000), 1000),
      currency: "NGN",
      isFiledByTheOffice: i % 2 === 0,
      isConfidential: i % 4 === 0,
      conflictChecked: true,
      conflictCheckDate: daysAgo(3 + (i % 20)),
      tags: bp.tags,
      generalComment: "Transaction timetable reviewed with the deal team.",
      internalNotes: `Seed corporate matter ${i + 1}/${COUNT} for ${firm.name}.`,
      createdBy: officer._id,
      lastModifiedBy: officer._id,
    };

    const matterDoc = await Matter.create(matterData);
    existingTitles.add(title);
    sequence++;
    created++;

    const detailData = buildCorporateDetail(
      firm,
      matterDoc,
      bp,
      { company, counterparty, registrationNumber, incorporationJurisdiction, status },
      i,
      firmIndex,
    );
    await CorporateDetail.create(detailData);
    details++;

    console.log(`   ✅ Created: ${title}  [${bp.transactionType}]`);
  }

  return { matters: created, details, skipped };
}

// ============================================
// MAIN
// ============================================

const seedCorporateMatters = async () => {
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
        matterType: "corporate",
      });
      const matterIds = matters.map((m) => m._id);
      const delDetails = await CorporateDetail.deleteMany({
        matterId: { $in: matterIds },
      });
      const delMatters = await Matter.deleteMany({
        _id: { $in: matterIds },
      });
      console.log(
        `🧹 Cleaned target firms: ${delMatters.deletedCount} corporate matter(s), ${delDetails.deletedCount} corporate detail(s)`,
      );
    }

    let totalMatters = 0;
    let totalDetails = 0;
    let totalSkipped = 0;
    const summaries = [];

    for (let f = 0; f < firms.length; f++) {
      const res = await seedFirmCorporateMatters(firms[f], f);
      totalMatters += res.matters;
      totalDetails += res.details;
      totalSkipped += res.skipped;
      summaries.push(
        `${firms[f].subdomain}: ${res.matters} created, ${res.skipped} skipped, ${res.details} detail(s)`,
      );
    }

    console.log("\n========================================");
    console.log(`📊 Corporate seeding complete!`);
    console.log(`   Firms: ${firms.length}`);
    console.log(`   Corporate matters created: ${totalMatters}`);
    console.log(`   Corporate details created: ${totalDetails}`);
    console.log(`   Skipped (already existed): ${totalSkipped}`);
    console.log(`   Summary:`);
    for (const s of summaries) console.log(`      - ${s}`);
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding corporate matters:", error);
    process.exit(1);
  }
};

seedCorporateMatters();
