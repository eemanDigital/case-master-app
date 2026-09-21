// utils/seedPropertyMatters.js - Seed 10 property matters per firm + PropertyDetail
//
// Usage:
//   node utils/seedPropertyMatters.js                     # seed (idempotent, skips existing)
//   node utils/seedPropertyMatters.js --firm=apex-partners # seed only one firm
//   node utils/seedPropertyMatters.js --clean             # wipe property matters/details, then seed
//
// Run seedFirm.js -> seedUser.js FIRST so firms, staff and clients exist.
// Each seeded firm gets EXACTLY 10 of its OWN property matters (matterType:
// "property") covering purchase, sale, lease, land acquisition, title
// perfection, development, tenancy, mortgage, boundary dispute and management.
// Every matter is linked to its firm (firmId) and gets a fully populated
// PropertyDetail (property info, parties, financials, legal documents,
// regulatory approvals, due diligence, development and conditions).

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const Firm = require("../models/firmModel");
const User = require("../models/userModel");
const Matter = require("../models/matterModel");
const PropertyDetail = require("../models/propertyDetailModel");

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

const LOCATIONS = [
  { address: "Plot 12, Admiralty Way, Lekki Phase 1", state: "Lagos", lga: "Eti-Osa", propertyType: "residential", landSize: { value: 650, unit: "sqm" }, titleDocument: "c-of-o", titleNumber: "LA/CO/2019/0451" },
  { address: "Block 7, Adeola Odeku Street, Victoria Island", state: "Lagos", lga: "Eti-Osa", propertyType: "commercial", landSize: { value: 1200, unit: "sqm" }, titleDocument: "deed-of-assignment", titleNumber: "LA/DAS/2020/1188" },
  { address: "No. 24, Aminu Kano Crescent, Wuse II", state: "FCT", lga: "Abuja Municipal", propertyType: "commercial", landSize: { value: 900, unit: "sqm" }, titleDocument: "c-of-o", titleNumber: "FCT/ABU/2021/0772" },
  { address: "Km 12, Lagos-Ibadan Expressway, Mowe", state: "Ogun", lga: "Obafemi Owode", propertyType: "land", landSize: { value: 2.5, unit: "hectares" }, titleDocument: "survey-plan", titleNumber: "OG/SUR/2018/0093" },
  { address: "No. 8, Peter Odili Road, Trans-Amadi", state: "Rivers", lga: "Port Harcourt", propertyType: "residential", landSize: { value: 800, unit: "sqm" }, titleDocument: "governors-consent", titleNumber: "RV/GC/2019/0334" },
  { address: "Plot 33, Northern Foreshore Estate, Chevron Drive", state: "Lagos", lga: "Eti-Osa", propertyType: "mixed-use", landSize: { value: 1500, unit: "sqm" }, titleDocument: "c-of-o", titleNumber: "LA/CO/2022/0907" },
  { address: "No. 15, Herbert Macaulay Way, Yaba", state: "Lagos", lga: "Lagos Mainland", propertyType: "residential", landSize: { value: 500, unit: "sqm" }, titleDocument: "deed-of-assignment", titleNumber: "LA/DAS/2017/0655" },
  { address: "No. 3, Ahmadu Bello Way, Fagge", state: "Kano", lga: "Fagge", propertyType: "commercial", landSize: { value: 700, unit: "sqm" }, titleDocument: "c-of-o", titleNumber: "KN/CO/2020/0412" },
  { address: "Plot 45, Independence Layout, Enugu", state: "Enugu", lga: "Enugu North", propertyType: "land", landSize: { value: 4, unit: "plots" }, titleDocument: "survey-plan", titleNumber: "EN/SUR/2019/0210" },
  { address: "No. 21, Gana Street, Maitama", state: "FCT", lga: "Abuja Municipal", propertyType: "commercial", landSize: { value: 1100, unit: "sqm" }, titleDocument: "governors-consent", titleNumber: "FCT/GC/2021/0561" },
  { address: "Plot 9, Oregun Industrial Estate, Ikeja", state: "Lagos", lga: "Ikeja", propertyType: "industrial", landSize: { value: 3000, unit: "sqm" }, titleDocument: "c-of-o", titleNumber: "LA/CO/2016/0288" },
  { address: "No. 40, Aba Road, GRA Phase 2", state: "Rivers", lga: "Port Harcourt", propertyType: "agricultural", landSize: { value: 5, unit: "hectares" }, titleDocument: "other", titleNumber: "RV/OTH/2018/0044" },
];

const VENDORS = [
  "Chief Emeka Okoli",
  "Mrs. Kemi Balogun",
  "Alhaji Garba Idris",
  "Chief Mrs. Ngozi Eze",
  "Mr. Tunde Adebayo",
  "Dr. Ikenna Obi",
  "Hajiya Aisha Musa",
  "Mr. Bayo Fashola",
  "Elder S. O. Nwosu",
  "Mrs. Fola Ola-Bello",
];

const COMPANIES = [
  "First Atlantic Holdings Ltd",
  "Brightline Energy Plc",
  "Jade Agro-Allied Ltd",
  "CityGate Realty Ltd",
  "NovaLink Technologies Ltd",
  "Suncoast Transport Ltd",
  "BlueChip Manufacturing Ltd",
  "Quantum Health Ltd",
  "Echo Media Group",
  "Terra Fields Ltd",
];

const BANKS = [
  "Zenith Bank Plc",
  "First Continental Bank Plc",
  "Coastal Bank Ltd",
  "Sterling Trust Bank Plc",
  "Unity Merchant Bank Plc",
];

const NEIGHBOURS = [
  "Madam Rukayat Salami",
  "Mr. Godwin Ekpo",
  "Chief Musa Danjuma",
  "Mrs. Chioma Nnaji",
  "Mr. Peter Oladipo",
];

// ============================================
// THE 10 PROPERTY BLUEPRINTS (one per firm)
// ============================================

const BLUEPRINTS = [
  { transactionType: "purchase", natureOfMatter: "property acquisition", prefix: "Purchase of", financing: "purchase", docs: ["contractOfSale", "deedOfAssignment"], consent: true, lease: false, dev: false, land: false },
  { transactionType: "sale", natureOfMatter: "property sale", prefix: "Sale of", financing: "purchase", docs: ["contractOfSale", "deedOfAssignment"], consent: true, lease: false, dev: false, land: false },
  { transactionType: "lease", natureOfMatter: "lease agreement", prefix: "Commercial Lease of", financing: "rent", docs: ["leaseAgreement"], consent: false, lease: true, dev: false, land: false },
  { transactionType: "land_acquisition", natureOfMatter: "land use", prefix: "Land Acquisition at", financing: "purchase", docs: ["contractOfSale", "deedOfAssignment"], consent: true, lease: false, dev: false, land: true },
  { transactionType: "title_perfection", natureOfMatter: "property acquisition", prefix: "Title Perfection & Governor's Consent for", financing: "purchase", docs: ["deedOfAssignment"], consent: true, lease: false, dev: false, land: true },
  { transactionType: "property_development", natureOfMatter: "property development", prefix: "Property Development at", financing: "purchase", docs: ["contractOfSale"], consent: true, lease: false, dev: true, land: false },
  { transactionType: "tenancy_matter", natureOfMatter: "lease agreement", prefix: "Tenancy Matter -", financing: "rent", docs: ["leaseAgreement"], consent: false, lease: true, dev: false, land: false },
  { transactionType: "mortgage", natureOfMatter: "real estate finance", prefix: "Mortgage Financing for", financing: "purchase", docs: ["deedOfAssignment"], consent: false, lease: false, dev: false, land: false },
  { transactionType: "boundary_dispute", natureOfMatter: "land use", prefix: "Boundary Dispute -", financing: "purchase", docs: [], consent: false, lease: false, dev: false, land: true },
  { transactionType: "property_management", natureOfMatter: "land use", prefix: "Property Management Engagement for", financing: "rent", docs: ["leaseAgreement"], consent: false, lease: true, dev: false, land: false },
];

// ============================================
// DETAIL BUILDERS
// ============================================

const buildPaymentSchedule = (total, i) => {
  const parts = 3;
  const amount = roundTo(total / parts, 5000);
  return Array.from({ length: parts }, (_, k) => {
    const dueDate = k === 0 ? daysAgo(30 + i) : daysFromNow(30 * k + i * 2);
    const isPaid = k === 0 || (k === 1 && i % 2 === 0);
    return {
      installmentNumber: k + 1,
      amount,
      dueDate,
      paidDate: isPaid ? daysAgo(2) : undefined,
      status: isPaid ? "paid" : dueDate < new Date() ? "overdue" : "pending",
    };
  });
};

const buildLeaseExtras = (i) => ({
  leaseAlertSettings: {
    enabled: true,
    alertThresholds: [
      { days: 7, label: "critical", isActive: true },
      { days: 14, label: "warning", isActive: true },
      { days: 30, label: "notice", isActive: true },
      { days: 90, label: "notice", isActive: true },
    ],
    defaultAlerts: true,
    emailNotification: true,
    smsNotification: false,
    notifyLandlord: true,
    notifyTenant: true,
    customMessage: "Lease renewal reminder generated by the property module.",
  },
  leaseMilestones: [
    {
      title: "Execute lease agreement",
      description: "Both parties execute the lease and counterparts exchanged.",
      targetDate: daysAgo(120 + i * 5),
      completedDate: daysAgo(118 + i * 5),
      status: "completed",
      reminderDays: 7,
      notified: true,
    },
    {
      title: "Rent review / renewal notice",
      description: "Serve renewal notice ahead of the lease expiry date.",
      targetDate: daysFromNow(90 + i * 5),
      status: "pending",
      reminderDays: 30,
      notified: false,
    },
  ],
  renewalTracking: {
    renewalInitiated: false,
    renewalDeadline: daysFromNow(120 + i * 5),
    renewalNoticePeriod: 90,
    renewalStatus: "not-initiated",
    rentIncreasePercentage: 10,
    renewalTerms: "Renewal subject to a rent review of not more than 10%.",
  },
});

const buildPropertyDetail = ({ bp, loc, matter, firm, client, officer, firmIndex, i }) => {
  const year = new Date().getFullYear();
  const name = clientName(client);
  const contact = client?.phone || client?.email || "N/A";

  const seller = pick(VENDORS, firmIndex + i);
  const company = pick(COMPANIES, firmIndex + i + 3);
  const bank = pick(BANKS, firmIndex + i);
  const neighbour = pick(NEIGHBOURS, firmIndex + i);
  const landlord = pick(VENDORS, firmIndex + i + 5);
  const tenant = pick(COMPANIES, firmIndex + i + 7);

  const purchasePrice = roundTo(
    15_000_000 + ((firmIndex * 7 + i * 3) % 40) * 2_500_000,
    100_000,
  );
  const annualRent = roundTo(
    2_500_000 + ((firmIndex + i) % 12) * 750_000,
    50_000,
  );
  const deposit = roundTo(annualRent * 0.3, 50_000);
  const isRent = bp.financing === "rent";
  const principal = isRent ? annualRent : purchasePrice;

  // ---- Parties (depends on who the firm acts for) ----
  let vendor;
  let purchaser;
  let landlordParty;
  let tenantParty;

  if (bp.transactionType === "sale") {
    vendor = { name, contact };
    purchaser = { name: company, contact: "+2348030000001" };
  } else if (bp.transactionType === "lease" || bp.transactionType === "property_management") {
    landlordParty = { name, contact };
    tenantParty = { name: tenant, contact: "+2348030000002" };
  } else if (bp.transactionType === "tenancy_matter") {
    landlordParty = { name: landlord, contact: "+2348030000003" };
    tenantParty = { name, contact };
  } else if (bp.transactionType === "mortgage") {
    vendor = { name, contact };
    purchaser = { name: bank, contact: "+2348030000004" };
  } else if (bp.transactionType === "boundary_dispute") {
    vendor = { name: neighbour, contact: "+2348030000005" };
    purchaser = { name, contact };
  } else {
    vendor = { name: seller, contact: "+2348030000006" };
    purchaser = { name, contact };
  }

  // ---- Financials ----
  const financial = isRent
    ? {
        rentAmount: { amount: annualRent, currency: "NGN", frequency: "annually" },
        securityDeposit: { amount: deposit, currency: "NGN" },
        paymentTerms: "installments",
      }
    : {
        purchasePrice: { amount: purchasePrice, currency: "NGN" },
        paymentTerms:
          bp.transactionType === "mortgage"
            ? "mortgage"
            : i % 2 === 0
              ? "lump-sum"
              : "installments",
      };

  // ---- Legal documents ----
  const legal = {};
  if (bp.docs.includes("contractOfSale")) {
    legal.contractOfSale = {
      executionDate: daysAgo(70 - i),
      completionDate: daysFromNow(30 + i),
      status: i % 3 === 0 ? "completed" : "executed",
    };
  }
  if (bp.docs.includes("deedOfAssignment")) {
    legal.deedOfAssignment = {
      executionDate: daysAgo(60 - i),
      registrationDate: daysAgo(20 + i),
      status: i % 2 === 0 ? "registered" : "executed",
    };
  }
  if (bp.docs.includes("leaseAgreement")) {
    legal.leaseAgreement = {
      commencementDate: daysAgo(120 + i * 5),
      expiryDate: daysFromNow(365 + i * 30),
      duration: { years: 2, months: 0 },
      renewalOption: true,
      status: "active",
    };
  }
  if (bp.lease) Object.assign(legal, buildLeaseExtras(i));

  // ---- Regulatory & due diligence ----
  const governorsConsent = bp.consent
    ? {
        isRequired: true,
        applicationDate: daysAgo(50),
        approvalDate: daysAgo(12),
        status: "approved",
        referenceNumber: `GC/${year}/${String(firmIndex + 1).padStart(2, "0")}${String(i + 1).padStart(2, "0")}`,
      }
    : { isRequired: false, status: "not-required" };

  const detail = {
    matterId: matter._id,
    firmId: firm._id,
    transactionType: bp.transactionType,
    properties: [
      {
        propertyType: loc.propertyType,
        address: loc.address,
        state: loc.state,
        lga: loc.lga,
        landSize: loc.landSize,
        titleDocument: loc.titleDocument,
        titleNumber: loc.titleNumber,
      },
    ],
    vendor,
    purchaser,
    landlord: landlordParty,
    tenant: tenantParty,
    ...financial,
    paymentSchedule: buildPaymentSchedule(principal, i),
    ...legal,
    governorsConsent,
    surveyPlan: {
      isAvailable: true,
      surveyNumber: `SUR/${year}/${String(firmIndex + 1).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`,
      surveyDate: daysAgo(80),
    },
    titleSearch: {
      isCompleted: true,
      searchDate: daysAgo(55),
      findings:
        "Search conducted at the relevant Lands Registry. Title is clean and free from adverse claims; root of title traced to a valid allocation.",
      encumbrances: i % 3 === 0 ? [`Registered mortgage in favour of ${bank}`] : [],
    },
    physicalInspection: {
      isCompleted: true,
      inspectionDate: daysAgo(50),
      findings:
        "Property physically inspected. Beacons are intact and boundaries are consistent with the survey plan.",
    },
    development: bp.dev
      ? {
          isApplicable: true,
          planningPermit: { status: "approved", approvalDate: daysAgo(30) },
          buildingPermit: { status: "pending" },
          estimatedCost: { amount: roundTo(purchasePrice * 0.4, 100_000), currency: "NGN" },
          expectedCompletion: daysFromNow(300),
        }
      : { isApplicable: false },
    conditions: [
      {
        condition: "Obtain Governor's consent for the assignment",
        dueDate: daysFromNow(45),
        status: bp.consent ? "met" : "pending",
      },
      {
        condition: "Payment of balance of consideration",
        dueDate: daysFromNow(60),
        status: i % 2 === 0 ? "pending" : "met",
      },
      {
        condition: "Delivery of vacant possession and documents",
        dueDate: daysFromNow(75),
        status: "pending",
      },
    ],
    isDeleted: false,
  };

  return detail;
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

async function seedFirmPropertyMatters(firm, firmIndex) {
  const { clients, officers } = await getFirmUsers(firm);
  if (clients.length === 0 || officers.length === 0) {
    console.log(
      `   ⚠️ Skipping ${firm.name}: no clients/officers. Run utils/seedUser.js first.`,
    );
    return { matters: 0, details: 0 };
  }

  const existing = await Matter.find(
    { firmId: firm._id },
    { title: 1 },
  ).setOptions({ includeDeleted: true });
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

  console.log(`\n🏢 Firm: ${firm.name} (${firm.subdomain})`);

  for (let i = 0; i < BLUEPRINTS.length; i++) {
    const bp = BLUEPRINTS[i];
    const loc = pick(LOCATIONS, firmIndex + i);
    const client = pick(clients, i);
    const officer = pick(officers, i);
    const name = clientName(client);

    const title = `${bp.prefix} ${loc.address} (${name})`;
    if (existingTitles.has(title)) {
      console.log(`   ⏭️  Skipped (already exists): ${title}`);
      continue;
    }

    const isRent = bp.financing === "rent";
    const estimatedValue = isRent
      ? roundTo(2_500_000 + ((firmIndex + i) % 12) * 750_000, 50_000)
      : roundTo(15_000_000 + ((firmIndex * 7 + i * 3) % 40) * 2_500_000, 100_000);

    const matterData = {
      firmId: firm._id,
      matterNumber: `${prefix}${String(sequence + 1).padStart(4, "0")}`,
      officeFileNo: `OFC/${year}/${String(firmIndex + 1).padStart(3, "0")}P${String(i + 1).padStart(3, "0")}`,
      matterType: "property",
      category: "n/a",
      natureOfMatter: bp.natureOfMatter,
      title,
      description: `${bp.prefix} ${loc.address}, ${loc.state} State. Transaction type: ${bp.transactionType.replace(/_/g, " ")}. Acting for ${name}. Covers title investigation, documentation and completion formalities for the ${loc.propertyType} property.`,
      status: ["active", "pending", "completed", "on-hold"][i % 4],
      priority: ["high", "medium", "urgent", "low"][i % 4],
      client: client._id,
      accountOfficer: [officer._id],
      opposingParties: [
        { name: isRent ? "N/A - non-contentious" : pick(VENDORS, firmIndex + i + 9) },
      ],
      contactPersons: [
        {
          name,
          phone: client.phone,
          email: client.email,
          role: "client contact",
        },
      ],
      objectives: [
        { name: "Perfect and protect the client's title" },
        { name: "Complete the transaction within agreed timelines" },
      ],
      strengths: [{ name: "Clean and searchable root of title" }],
      weaknesses: [{ name: "Registry delays in obtaining consent" }],
      risks: [{ name: "Potential statutory encumbrances" }],
      stepsToBeTaken: [
        { name: "Conduct title search and physical inspection" },
        { name: "Prepare and execute transaction documents" },
      ],
      dateOpened: daysAgo(45 + ((i * 17) % 300)),
      expectedClosureDate: daysFromNow(60 + ((i * 23) % 240)),
      lastActivityDate: daysAgo(1 + (i % 12)),
      billingType: bp.land && bp.transactionType === "boundary_dispute" ? "hourly" : "fixed",
      estimatedValue,
      currency: "NGN",
      isFiledByTheOffice: i % 2 === 0,
      isConfidential: i % 5 === 0,
      conflictChecked: true,
      conflictCheckDate: daysAgo(3 + (i % 15)),
      tags: ["property", bp.transactionType, loc.propertyType, loc.state.toLowerCase()],
      generalComment: "Transaction timetable reviewed with the client.",
      internalNotes: `Seed property matter ${i + 1}/${BLUEPRINTS.length} for ${firm.name}.`,
      createdBy: officer._id,
      lastModifiedBy: officer._id,
    };

    const matter = await Matter.create(matterData);
    existingTitles.add(title);
    sequence++;
    created++;

    const detail = buildPropertyDetail({
      bp,
      loc,
      matter,
      firm,
      client,
      officer,
      firmIndex,
      i,
    });
    await PropertyDetail.create(detail);
    details++;

    console.log(`   ✅ Created: ${title}`);
  }

  return { matters: created, details };
}

// ============================================
// MAIN
// ============================================

const seedPropertyMatters = async () => {
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
      const propertyMatters = await Matter.find({
        firmId: { $in: firmIds },
        matterType: "property",
      }).select("_id");
      const matterIds = propertyMatters.map((m) => m._id);
      const delDetails = await PropertyDetail.deleteMany({
        matterId: { $in: matterIds },
      });
      const delMatters = await Matter.deleteMany({ _id: { $in: matterIds } });
      console.log(
        `🧹 Cleaned target firms: ${delMatters.deletedCount} property matter(s), ${delDetails.deletedCount} property detail(s)`,
      );
    }

    let totalMatters = 0;
    let totalDetails = 0;
    const summaries = [];

    for (let f = 0; f < firms.length; f++) {
      const res = await seedFirmPropertyMatters(firms[f], f);
      totalMatters += res.matters;
      totalDetails += res.details;
      summaries.push(
        `${firms[f].subdomain}: ${res.matters} matter(s), ${res.details} detail(s)`,
      );
    }

    console.log("\n========================================");
    console.log(`📊 Property Seeding Complete!`);
    console.log(`   Firms: ${firms.length}`);
    console.log(`   Property matters created: ${totalMatters}`);
    console.log(`   Property details created: ${totalDetails}`);
    console.log(`   Summary:`);
    for (const s of summaries) console.log(`      - ${s}`);
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding property matters:", error);
    process.exit(1);
  }
};

seedPropertyMatters();
