// utils/seedMatters.js - Seed dummy matters into the app (multi-tenant aware)
//
// Usage:
//   node utils/seedMatters.js                 # seed (idempotent, skips existing)
//   node utils/seedMatters.js --count=30      # seed at least 30 matters
//   node utils/seedMatters.js --clean         # wipe existing matters, then seed
//
// Matters are linked to real clients / officers already in the DB. If a firm
// has no clients or officers yet, minimal dummy seed users are created so the
// seeded matters are valid (client & accountOfficer are required refs).

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const Firm = require("../models/firmModel");
const User = require("../models/userModel");
const Matter = require("../models/matterModel");

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
const countArg = process.argv.find((a) => a.startsWith("--count="));
const SEED_COUNT = Math.max(
  20,
  parseInt(countArg ? countArg.split("=")[1] : "24", 10),
);

// ============================================
// SEED DATA
// ============================================

const MATTER_SEEDS = [
  // ---------------- Litigation ----------------
  {
    matterType: "litigation",
    title: "Okonkwo v. Federal Republic of Nigeria",
    natureOfMatter: "contract dispute",
    category: "civil",
    status: "active",
    priority: "high",
    billingType: "contingency",
    tags: ["breach of contract", "commercial", "appeal"],
    description:
      "Claim for breach of a government procurement contract and wrongful termination. Recovery of outstanding sums plus damages.",
  },
  {
    matterType: "litigation",
    title: "Adebayo & Sons Ltd v. Zenith Insurance Plc",
    natureOfMatter: "insurance law",
    category: "civil",
    status: "pending",
    priority: "medium",
    billingType: "hourly",
    tags: ["insurance", "indemnity"],
    description:
      "Action to enforce an indemnity under a fire insurance policy following the Oshodi warehouse fire of last year.",
  },
  {
    matterType: "litigation",
    title: "State v. David Ibrahim",
    natureOfMatter: "criminal law",
    category: "criminal",
    status: "active",
    priority: "urgent",
    billingType: "fixed",
    tags: ["criminal", "fraud", "arraignment"],
    description:
      "Defence of a client charged with obtaining money under false pretences. Pre-trial motions and bail applications pending.",
  },
  {
    matterType: "litigation",
    title: "Mrs. Chinwe Okafor v. Mr. Emeka Okafor",
    natureOfMatter: "family law",
    category: "civil",
    status: "settled",
    priority: "medium",
    billingType: "hourly",
    tags: ["family", "divorce", "settlement"],
    description:
      "Dissolution of marriage and ancillary reliefs. Concluded by consent judgment and division of matrimonial assets.",
  },
  {
    matterType: "litigation",
    title: "Lawal v. Lagos State Internal Revenue Service",
    natureOfMatter: "tax law",
    category: "civil",
    status: "won",
    priority: "high",
    billingType: "contingency",
    tags: ["tax", "appeal", "assessment"],
    description:
      "Appeal against an erroneous personal income tax assessment. Court struck out the assessment and awarded costs.",
  },

  // ---------------- Corporate ----------------
  {
    matterType: "corporate",
    title: "Acquisition of Beta Technologies Ltd by Alpha Holdings Plc",
    natureOfMatter: "merger and acquisition",
    category: "n/a",
    status: "active",
    priority: "high",
    billingType: "fixed",
    tags: ["m&a", "due diligence", "share sale"],
    description:
      "Share purchase and asset acquisition transaction. Structuring, due diligence, and regulatory filings for the transaction.",
  },
  {
    matterType: "corporate",
    title: "Incorporation of Sunrise Agro-Allied Ltd",
    natureOfMatter: "company incorporation",
    category: "n/a",
    status: "completed",
    priority: "low",
    billingType: "fixed",
    tags: ["incorporation", "cac", "startup"],
    description:
      "Incorporation of a private limited liability company with the Corporate Affairs Commission, including tax registration.",
  },
  {
    matterType: "corporate",
    title: "Shareholders' Agreement for Gemini Retail Group",
    natureOfMatter: "shareholder agreement",
    category: "n/a",
    status: "active",
    priority: "medium",
    billingType: "hourly",
    tags: ["corporate governance", "shareholders"],
    description:
      "Drafting and negotiation of a shareholders' agreement covering governance, drag-along and tag-along rights, and exit terms.",
  },
  {
    matterType: "corporate",
    title: "Joint Venture between Tolaram & Deltaco (Lekki Free Zone)",
    natureOfMatter: "joint venture",
    category: "n/a",
    status: "pending",
    priority: "high",
    billingType: "hourly",
    tags: ["joint venture", "free zone", "manufacturing"],
    description:
      "Structuring a joint venture for a packaging plant in the Lekki Free Trade Zone, including the shareholders' agreement and JV deed.",
  },
  {
    matterType: "corporate",
    title: "Restructuring of Obaji Conglomerate Plc",
    natureOfMatter: "restructuring",
    category: "n/a",
    status: "on-hold",
    priority: "medium",
    billingType: "hourly",
    tags: ["restructuring", "insolvency", "debt"],
    description:
      "Corporate and debt restructuring advisory for a conglomerate facing liquidity pressure. Scheme negotiations paused pending lender approval.",
  },

  // ---------------- Advisory ----------------
  {
    matterType: "advisory",
    title: "Legal Opinion: OFA Compliance for Listed Companies",
    natureOfMatter: "regulatory compliance",
    category: "n/a",
    status: "active",
    priority: "medium",
    billingType: "hourly",
    tags: ["securities", "ofac", "compliance"],
    description:
      "Formal legal opinion on the application of Nigerian anti-money-laundering and OFAC compliance obligations for listed issuers.",
  },
  {
    matterType: "advisory",
    title: "Due Diligence Review - Ikorodu Logistics Hub",
    natureOfMatter: "due diligence",
    category: "n/a",
    status: "active",
    priority: "high",
    billingType: "fixed",
    tags: ["due diligence", "real estate", "logistics"],
    description:
      "Legal due diligence on land title, zoning approvals, and environmental permits for a proposed logistics hub in Ikorodu.",
  },
  {
    matterType: "advisory",
    title: "Contract Review: NDP/HSH Procurement Agreement",
    natureOfMatter: "contract review",
    category: "n/a",
    status: "completed",
    priority: "medium",
    billingType: "hourly",
    tags: ["contracts", "procurement"],
    description:
      "Review and redline of a large procurement agreement, aligning warranties, indemnities, and dispute resolution clauses.",
  },
  {
    matterType: "advisory",
    title: "Legal Research on Data Protection Act 2023",
    natureOfMatter: "legal research",
    category: "n/a",
    status: "active",
    priority: "low",
    billingType: "hourly",
    tags: ["data protection", "ndpr", "research"],
    description:
      "Comparative legal research on Nigeria Data Protection Act obligations and practical compliance steps for technology clients.",
  },
  {
    matterType: "advisory",
    title: "Policy Development for Fintech Sandbox Framework",
    natureOfMatter: "policy development",
    category: "n/a",
    status: "pending",
    priority: "medium",
    billingType: "fixed",
    tags: ["fintech", "regulation", "policy"],
    description:
      "Advisory engagement to develop internal policy and compliance framework for a fintech operating under the regulatory sandbox.",
  },

  // ---------------- Retainer ----------------
  {
    matterType: "retainer",
    title: "General Corporate Retainer - Bluecrest Manufacturing",
    natureOfMatter: "general retainer",
    category: "n/a",
    status: "active",
    priority: "medium",
    billingType: "retainer",
    tags: ["retainer", "corporate", "ongoing"],
    description:
      "Ongoing corporate and commercial advisory retainer covering contracts, employment, and regulatory correspondence.",
  },
  {
    matterType: "retainer",
    title: "Annual Compliance Retainer for Nesto Retail Plc",
    natureOfMatter: "regulatory compliance",
    category: "n/a",
    status: "active",
    priority: "medium",
    billingType: "retainer",
    tags: ["compliance", "retainer", "filings"],
    description:
      "Annual regulatory compliance retainer: CAC filings, tax returns monitoring, and statutory records maintenance.",
  },
  {
    matterType: "retainer",
    title: "Litigation Support Retainer - Guardian Life Assurance",
    natureOfMatter: "general legal services",
    category: "n/a",
    status: "active",
    priority: "high",
    billingType: "retainer",
    tags: ["insurance", "litigation", "retainer"],
    description:
      "Retainer for ongoing litigation support, claims defence, and legal opinions for an insurance company.",
  },
  {
    matterType: "retainer",
    title: "Employment & HR Retainer for Kinetik Logistics",
    natureOfMatter: "employment law",
    category: "n/a",
    status: "on-hold",
    priority: "low",
    billingType: "retainer",
    tags: ["employment", "hr", "retainer"],
    description:
      "Employment retainer covering contracts of employment, disciplinary hearings, and workforce restructuring advice.",
  },

  // ---------------- Property ----------------
  {
    matterType: "property",
    title: "Property Acquisition - 12 Admiralty Way, Lekki",
    natureOfMatter: "property acquisition",
    category: "n/a",
    status: "active",
    priority: "high",
    billingType: "fixed",
    tags: ["acquisition", "lekki", "title search"],
    description:
      "Acquisition of a residential property in Lekki Phase 1: title search, deed preparation, and completion formalities.",
  },
  {
    matterType: "property",
    title: "Lease Agreement - Oshodi Industrial Warehouse",
    natureOfMatter: "lease agreement",
    category: "n/a",
    status: "completed",
    priority: "medium",
    billingType: "fixed",
    tags: ["lease", "warehouse", "commercial"],
    description:
      "Drafting and negotiation of a 5-year commercial lease for an industrial warehouse, including rent review and repair clauses.",
  },
  {
    matterType: "property",
    title: "Property Sale - 4B Anthony Village Residential",
    natureOfMatter: "property sale",
    category: "n/a",
    status: "settled",
    priority: "medium",
    billingType: "contingency",
    tags: ["sale", "conveyance"],
    description:
      "Conveyancing for the sale of a residential property, handling the transfer documents and clearances to completion.",
  },
  {
    matterType: "property",
    title: "Land Use Documentation - Ajah Freehold Estates",
    natureOfMatter: "land use",
    category: "n/a",
    status: "active",
    priority: "medium",
    billingType: "hourly",
    tags: ["land", "c-of-o", "documentation"],
    description:
      "Regularisation of land documentation and processing of Certificate of Occupancy for an estate in Ajah.",
  },

  // ---------------- General ----------------
  {
    matterType: "general",
    title: "Notarial Services - Apostille of Academic Certificates",
    natureOfMatter: "notarial services",
    category: "n/a",
    status: "completed",
    priority: "low",
    billingType: "fixed",
    tags: ["notary", "apostille", "documents"],
    description:
      "Authentication and notarisation of academic certificates for overseas submission, including Ministry attestation.",
  },
];

if (MATTER_SEEDS.length < 20) {
  console.error("❌ Seed dataset defines fewer than 20 matters");
  process.exit(1);
}

// ============================================
// HELPERS
// ============================================

const pick = (arr, index) => arr[index % arr.length];

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const TIMELINE = (status, seedIndex) => {
  const openedOffset = 30 + ((seedIndex * 47) % 700); // 1 month to ~2 years ago
  const dateOpened = daysAgo(openedOffset);
  let expectedClosureDate = daysFromNow(30 + ((seedIndex * 53) % 330));
  let actualClosureDate;
  if (["completed", "closed", "settled", "won", "lost", "withdrawn"].includes(status)) {
    actualClosureDate = daysAgo(((seedIndex * 23) % 30) + 5);
    expectedClosureDate = undefined;
  }
  return { dateOpened, expectedClosureDate, actualClosureDate };
};

// ============================================
// SEED USER CREATION (only when a firm has none)
// ============================================

async function getOrCreateSeedUsers(firm) {
  const clients = await User.find({
    firmId: firm._id,
    userType: "client",
    isActive: true,
  });
  const officers = await User.find({
    firmId: firm._id,
    userType: "staff",
    isActive: true,
  });

  const created = [];

  if (clients.length === 0) {
    const clientData = [
      {
        firstName: "Seed",
        lastName: `Client North ${firm.name}`,
        email: `seedclient.${firm._id}@example.com`,
        phone: "+2348012345000",
        userType: "client",
        role: "client",
        clientDetails: {
          clientCategory: "corporate",
          preferredContactMethod: "email",
        },
      },
      {
        firstName: "Seed",
        lastName: `Client South ${firm.name}`,
        email: `seedclient2.${firm._id}@example.com`,
        phone: "+2348023456111",
        userType: "client",
        role: "client",
        clientDetails: {
          clientCategory: "individual",
          preferredContactMethod: "phone",
        },
      },
    ];
    for (const c of clientData) {
      const createdUser = await User.create({
        ...c,
        firmId: firm._id,
        password: "Seed@1234",
        passwordConfirm: "Seed@1234",
        isVerified: true,
        isActive: true,
        status: "active",
        userAgent: [],
      });
      created.push(createdUser);
      console.log("   ✅ Created seed client:", createdUser.email);
    }
  }

  if (officers.length === 0) {
    const officerData = [
      {
        firstName: "Seed",
        lastName: `Lawyer ${firm.name}`,
        email: `seedlawyer.${firm._id}@example.com`,
        phone: "+2348034567222",
        address: "Seed Office Address",
        userType: "staff",
        role: "lawyer",
        lawyerDetails: { title: "Barrister" },
      },
      {
        firstName: "Seed",
        lastName: `Secretary ${firm.name}`,
        email: `seedsecretary.${firm._id}@example.com`,
        phone: "+2348045678333",
        address: "Seed Office Address",
        userType: "staff",
        role: "secretary",
        staffDetails: { department: "support", employmentType: "full-time" },
      },
    ];
    for (const o of officerData) {
      const createdUser = await User.create({
        ...o,
        firmId: firm._id,
        password: "Seed@1234",
        passwordConfirm: "Seed@1234",
        isVerified: true,
        isActive: true,
        status: "active",
        userAgent: [],
      });
      created.push(createdUser);
      console.log("   ✅ Created seed officer:", createdUser.email);
    }
  }

  const finalClients = clients.length > 0 ? clients : created.filter((u) => u.userType === "client");
  const finalOfficers = officers.length > 0 ? officers : created.filter((u) => u.userType !== "client");
  return { clients: finalClients, officers: finalOfficers };
}

// ============================================
// MATTER SEEDING
// ============================================

async function seedFirm(firm, firmIndex) {
  console.log(`\n🏢 Firm: ${firm.name}`);
  const { clients, officers } = await getOrCreateSeedUsers(firm);
  if (clients.length === 0 || officers.length === 0) {
    console.log(
      `   ⚠️ Skipping firm ${firm.name} (no clients/officers available)`,
    );
    return 0;
  }

  const year = new Date().getFullYear();
  const existing = await Matter.find(
    { firmId: firm._id },
    { title: 1 },
  ).setOptions({ includeDeleted: true });
  const existingTitles = new Set(existing.map((m) => m.title));

  // Continue numbering from any previously seeded matters (the schema hook that
  // auto-generates matterNumber can't run here because Mongoose validates before
  // pre('save') hooks, so we generate it ourselves like the frontend does).
  const prefix = `MTR/${year}/`;
  const existingCount = await Matter.countDocuments({
    firmId: firm._id,
    matterNumber: new RegExp(`^${prefix}`),
  });
  let sequence = existingCount;

  let created = 0;
  for (let i = 0; i < SEED_COUNT; i++) {
    const seed = pick(MATTER_SEEDS, firmIndex + i);
    if (existingTitles.has(seed.title)) {
      console.log(`   ⏭️  Skipped (already exists): ${seed.title}`);
      continue;
    }

    const timeline = TIMELINE(seed.status, i);
    const officeFileNo = `OFC-${year}-${String(i + 1).padStart(4, "0")}-${firmIndex + 1}`;
    const matterNumber = `${prefix}${String(sequence + 1).padStart(4, "0")}`;
    sequence++;

    const matterData = {
      firmId: firm._id,
      matterNumber,
      officeFileNo,
      matterType: seed.matterType,
      category: seed.category || "n/a",
      natureOfMatter: seed.natureOfMatter,
      title: seed.title,
      description: seed.description,
      status: seed.status,
      priority: seed.priority,
      client: pick(clients, i)._id,
      accountOfficer: [pick(officers, i)._id],
      opposingParties: [
        { name: "Opposing Party Representative" },
        { name: "Second Respondent" },
      ],
      contactPersons: [
        {
          name: `${pick(clients, i).firstName} ${pick(clients, i).lastName}`,
          phone: pick(clients, i).phone,
          email: pick(clients, i).email,
          role: "client contact",
        },
      ],
      objectives: [{ name: "Secure a favourable determination" }, { name: "Minimise exposure" }],
      strengths: [{ name: "Strong documentary evidence" }],
      weaknesses: [{ name: "Witness availability uncertain" }],
      risks: [{ name: "Adverse cost order possible" }],
      stepsToBeTaken: [{ name: "File next process" }, { name: "Schedule conference" }],
      dateOpened: timeline.dateOpened,
      expectedClosureDate: timeline.expectedClosureDate,
      actualClosureDate: timeline.actualClosureDate,
      billingType: seed.billingType,
      estimatedValue: Math.round((500000 + ((i * 371) % 50000000)) / 1000) * 1000,
      currency: "NGN",
      isFiledByTheOffice: i % 3 === 0,
      isConfidential: i % 5 === 0,
      conflictChecked: i % 2 === 0,
      conflictCheckDate: daysAgo(2 + (i % 20)),
      tags: seed.tags,
      generalComment: "Regular case review with the account officer.",
      internalNotes: "Seed matter for development and testing.",
      createdBy: pick(officers, i)._id,
      lastModifiedBy: pick(officers, i)._id,
    };

    await Matter.create(matterData);
    existingTitles.add(seed.title);
    created++;
    console.log(`   ✅ Created: ${seed.title}`);
  }

  return created;
}

// ============================================
// MAIN
// ============================================

const seedMatters = async () => {
  try {
    await mongoose.connect(DB);
    console.log("✅ Database connected");

    if (CLEAN) {
      const result = await Matter.deleteMany({});
      console.log(`🧹 Deleted ${result.deletedCount} existing matter(s)`);
    }

    const firms = await Firm.find();
    if (firms.length === 0) {
      console.log("❌ No firms found. Register a firm first, then re-run.");
      process.exit(0);
    }

    let totalCreated = 0;
    for (let f = 0; f < firms.length; f++) {
      totalCreated += await seedFirm(firms[f], f);
    }

    console.log("\n========================================");
    console.log(`📊 Seeding Complete!`);
    console.log(`   Firms: ${firms.length}`);
    console.log(`   Matters created: ${totalCreated}`);
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding matters:", error);
    process.exit(1);
  }
};

seedMatters();