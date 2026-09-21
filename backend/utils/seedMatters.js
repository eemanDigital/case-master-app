// utils/seedMatters.js - Seed 15 matters per firm (firm-specific, multi-tenant)
//
// Usage:
//   node utils/seedMatters.js                 # seed (idempotent, skips existing)
//   node utils/seedMatters.js --firm=apex-partners   # seed only one firm
//   node utils/seedMatters.js --clean         # wipe target firms' matters/details/events, then seed
//
// Run seedFirm.js -> seedUser.js FIRST so firms, staff and clients exist.
// Each seeded firm gets EXACTLY 15 of its OWN matters (titles vary per firm):
//   6 litigation (several with UPCOMING hearings on the calendar),
//   3 corporate, 2 advisory, 2 retainer, 1 property, 1 general.
// Litigation matters also get a LitigationDetail (hearings + suit number) and
// upcoming hearings are pushed onto the firm's calendar as CalendarEvents.

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const Firm = require("../models/firmModel");
const User = require("../models/userModel");
const Matter = require("../models/matterModel");
const LitigationDetail = require("../models/litigationDetailModel");
const { CalendarEvent } = require("../models/calenderEventModel");

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

const hourFrom = (date) => new Date(date.getTime() + 60 * 60 * 1000);

// ============================================
// PARTY NAME POOLS (rotate per firm so every firm gets its own matters)
// ============================================

const PARTIES_A = [
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
  "Echo Media Group",
  "Terra Fields Ltd",
];

const PARTIES_B = [
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
];

const OPPONENTS = [
  "Federal Inland Revenue Service",
  "Lagos State Internal Revenue Service",
  "Zenith Insurance Plc",
  "Niger Delta Oil & Gas Ltd",
  "National Grid Plc",
  "Coastal Bank Ltd",
  "Federal Ministry of Works",
  "Nigerian Ports Authority",
  "Kaduna State Government",
  "First Continental Bank Plc",
];

const JUDGES = [
  "Hon. Justice A. O. Adewale",
  "Hon. Justice B. N. Eze",
  "Hon. Justice C. I. Obiora",
  "Hon. Justice D. K. Ibrahim",
  "Hon. Justice E. T. Fashola",
];

const COURTS = [
  { name: "federal high court", location: "Lagos Judicial Division", state: "Lagos" },
  { name: "high court", location: "Ikeja Judicial Division", state: "Lagos" },
  { name: "election tribunal", location: "Abuja", state: "FCT" },
  { name: "national industrial court", location: "Lagos", state: "Lagos" },
  { name: "high court", location: "Port Harcourt Division", state: "Rivers" },
  { name: "tax appeal tribunal", location: "Victoria Island", state: "Lagos" },
];

// ============================================
// MATTER SLOT DEFINITIONS (the 15 per firm)
// "litigation" slots flagged with upcoming hearings + suitNo/court template
// ============================================

const SLOTS = [
  {
    type: "litigation", nature: "contract dispute", category: "civil",
    status: "active", priority: "urgent", billing: "hourly",
    tags: ["breach of contract", "commercial"],
    upcoming: true, hearingInDays: 10, stage: "pre-trial",
  },
  {
    type: "litigation", nature: "election petition", category: "civil",
    status: "pending", priority: "high", billing: "contingency",
    tags: ["election", "petition"],
    upcoming: true, hearingInDays: 22, stage: "pre-trial",
  },
  {
    type: "litigation", nature: "criminal law", category: "criminal",
    status: "active", priority: "urgent", billing: "fixed",
    tags: ["criminal", "defence", "bail"],
    upcoming: true, hearingInDays: 33, stage: "pre-trial",
  },
  {
    type: "litigation", nature: "family law", category: "civil",
    status: "active", priority: "medium", billing: "hourly",
    tags: ["family", "ancillary relief"],
    upcoming: false, hearingInDays: -12, stage: "trial",
  },
  {
    type: "litigation", nature: "insurance law", category: "civil",
    status: "pending", priority: "high", billing: "hourly",
    tags: ["insurance", "indemnity"],
    upcoming: true, hearingInDays: 16, stage: "pre-trial",
  },
  {
    type: "litigation", nature: "tax law", category: "civil",
    status: "won", priority: "medium", billing: "contingency",
    tags: ["tax", "assessment appeal"],
    upcoming: true, hearingInDays: 0, stage: "closed",
  },

  {
    type: "corporate", nature: "merger and acquisition", category: "n/a",
    status: "active", priority: "high", billing: "fixed",
    tags: ["m&a", "due diligence", "share sale"],
  },
  {
    type: "corporate", nature: "company incorporation", category: "n/a",
    status: "completed", priority: "low", billing: "fixed",
    tags: ["incorporation", "cac"],
  },
  {
    type: "corporate", nature: "shareholder agreement", category: "n/a",
    status: "pending", priority: "medium", billing: "hourly",
    tags: ["governance", "shareholders"],
  },

  {
    type: "advisory", nature: "due diligence", category: "n/a",
    status: "active", priority: "high", billing: "fixed",
    tags: ["due diligence", "regulatory"],
  },
  {
    type: "advisory", nature: "regulatory compliance", category: "n/a",
    status: "active", priority: "medium", billing: "hourly",
    tags: ["compliance", "licensing"],
  },

  {
    type: "retainer", nature: "general retainer", category: "n/a",
    status: "active", priority: "medium", billing: "retainer",
    tags: ["retainer", "ongoing"],
  },
  {
    type: "retainer", nature: "regulatory compliance", category: "n/a",
    status: "active", priority: "medium", billing: "retainer",
    tags: ["compliance", "filings"],
  },

  {
    type: "property", nature: "property acquisition", category: "n/a",
    status: "active", priority: "high", billing: "fixed",
    tags: ["acquisition", "title search", "conveyance"],
  },

  {
    type: "general", nature: "notarial services", category: "n/a",
    status: "completed", priority: "low", billing: "fixed",
    tags: ["notary", "apostille"],
  },
];

// ============================================
// TITLE / DESCRIPTION BUILDERS
// ============================================

const partyNames = (firmIndex) => {
  const a = pick(PARTIES_A, firmIndex + 90);
  const b = pick(PARTIES_B, firmIndex + 41);
  const opp = pick(OPPONENTS, firmIndex + 7);
  return { a, b, opp };
};

const titleFor = (slot, i, firmIndex, { a, b, opp }) => {
  switch (i) {
    case 0: return `${a} v. ${opp}`;
    case 1: return `Election Petition: ${b} v. Independent National Electoral Commission`;
    case 2: return `State v. ${b}`;
    case 3: return `${pick(PARTIES_B, firmIndex + 41)} v. ${pick(PARTIES_B, firmIndex + 44)} (Dissolution of Marriage)`;
    case 4: return `${a} v. ${opp} (Indemnity under Fire Insurance Policy)`;
    case 5: return `${a} v. ${opp} (Tax Assessment Appeal)`;
    case 6: return `Acquisition of ${a} by ${pick(PARTIES_A, i + 6)} (Share Purchase)`;
    case 7: return `Incorporation of ${a} (CAC Filings & Tax Registration)`;
    case 8: return `Shareholders' Agreement for ${a}`;
    case 9: return `Due Diligence Review - ${a} (Regulatory & Title)`;
    case 10: return `Compliance Advisory for ${a} (Licensing Renewal)`;
    case 11: return `General Corporate Retainer - ${a}`;
    case 12: return `Annual Statutory Filings Retainer - ${a}`;
    case 13: return `Property Acquisition - ${pick(PARTIES_B, firmIndex + 47)} Family Estate`;
    case 14: return `Notarial & Apostille Services for ${b}`;
    default: return "";
  }
};

const descriptionFor = (slot, i, { a, b, opp }) => {
  if (slot.type === "litigation") {
    return `Contentious matter between ${a} and ${opp}. Nature: ${slot.nature}. ${slot.category === "criminal" ? "Criminal defence work including bail applications and pre-trial motions." : "Civil proceedings involving pre-action demand, pleadings and contested interlocutory applications."}`;
  }
  if (slot.type === "corporate") {
    return `Corporate/commercial matter for ${a} relating to ${slot.nature}. Involves structuring, documentation and regulatory filings as required.`;
  }
  if (slot.type === "advisory") {
    return `Advisory engagement for ${a} covering ${slot.nature}. Includes research, written opinions and implementation support.`;
  }
  if (slot.type === "retainer") {
    return `Ongoing retainer arrangement with ${a} for ${slot.nature}. Covers routine corporate, compliance and advisory services.`;
  }
  if (slot.type === "property") {
    return `Property transaction for ${a}: title search, deed preparation and completion formalities under ${slot.nature}.`;
  }
  return `General legal services for ${b}: authentication, notarisation and certification of documents.`;
};

const courtRoomFor = (i) => `Court ${((i + 1) % 9) + 1}`;

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

async function seedFirmMatters(firm, firmIndex) {
  const { clients, officers } = await getFirmUsers(firm);
  if (clients.length === 0 || officers.length === 0) {
    console.log(
      `   ⚠️ Skipping ${firm.name}: no clients/officers. Run utils/seedUser.js first.`,
    );
    return { matters: 0, details: 0, events: 0 };
  }

  const existing = await Matter.find(
    { firmId: firm._id },
    { title: 1 },
  ).setOptions({ includeDeleted: true });
  const existingTitles = new Set(existing.map((m) => m.title));

  const year = new Date().getFullYear();
  const names = partyNames(firmIndex);
  const court = COURTS[firmIndex % COURTS.length];

  const prefix = `MTR/${year}/`;
  const existingCount = await Matter.countDocuments({
    firmId: firm._id,
    matterNumber: new RegExp(`^${prefix}`),
  });
  let sequence = existingCount;

  let created = 0;
  let details = 0;
  let events = 0;

  console.log(`\n🏢 Firm: ${firm.name} (${firm.subdomain})`);

  for (let i = 0; i < SLOTS.length; i++) {
    const slot = SLOTS[i];
    const title = titleFor(slot, i, firmIndex, names);
    const client = pick(clients, i);
    const officer = pick(officers, i);

    if (existingTitles.has(title)) {
      console.log(`   ⏭️  Skipped (already exists): ${title}`);
      continue;
    }

    const matterData = {
      firmId: firm._id,
      matterNumber: `${prefix}${String(sequence + 1).padStart(4, "0")}`,
      officeFileNo: `OFC/${year}/${String(firmIndex + 1).padStart(3, "0")}${String(i + 1).padStart(3, "0")}`,
      matterType: slot.type,
      category: slot.category,
      natureOfMatter: slot.nature,
      title,
      description: descriptionFor(slot, i, names).replace(
        "firmNamePlaceholder",
        firm.name,
      ),
      status: slot.status,
      priority: slot.priority,
      client: client._id,
      accountOfficer: [officer._id],
      opposingParties: [
        { name: slot.category === "criminal" ? "The State / Prosecution" : names.opp },
        { name: pick(PARTIES_B, i + 5) },
      ],
      contactPersons: [
        {
          name: `${client.firstName} ${client.lastName || ""}`.trim(),
          phone: client.phone,
          email: client.email,
          role: "client contact",
        },
      ],
      objectives: [{ name: "Secure a favourable determination" }, { name: "Protect client's interest" }],
      strengths: [{ name: "Strong documentary evidence" }],
      weaknesses: [{ name: "Procedural delays in courts" }],
      risks: [{ name: "Adverse cost order possible" }],
      stepsToBeTaken: [{ name: "File next process" }, { name: "Schedule conference with counsel" }],
      dateOpened: daysAgo(40 + ((i * 13) % 400)),
      expectedClosureDate: slot.status === "active" || slot.status === "pending" ? daysFromNow(60 + ((i * 29) % 300)) : undefined,
      actualClosureDate: ["completed", "won", "settled", "closed"].includes(slot.status)
        ? daysAgo(5 + ((i * 7) % 25))
        : undefined,
      lastActivityDate: daysAgo(1 + (i % 15)),
      billingType: slot.billing,
      estimatedValue: slot.type === "pro-bono" || slot.billing === "pro-bono"
        ? 0
        : Math.round((250000 + ((i * 371) % 45000000)) / 1000) * 1000,
      currency: "NGN",
      isFiledByTheOffice: i % 3 === 0,
      isConfidential: i % 5 === 0,
      conflictChecked: i % 2 === 0,
      conflictCheckDate: daysAgo(2 + (i % 20)),
      tags: slot.tags,
      generalComment: "Timetable reviewed with lead counsel.",
      internalNotes: `Seed matter ${i + 1}/15 for ${firm.name}.`,
      createdBy: officer._id,
      lastModifiedBy: officer._id,
    };

    const matter = await Matter.create(matterData);
    existingTitles.add(title);
    sequence++;
    created++;

    // ---- Type-specific detail: LitigationDetail for litigation matters ----
    let upcomingHearingDate = null;
    if (slot.type === "litigation") {
      const hearings = [];
      const lastHearing = daysAgo(30 + ((i * 5) % 60));

      hearings.push({
        date: lastHearing,
        purpose: i === 2 ? "Hearing of bail application" : "Mention / Case management",
        outcome: "Adjourned for further mention",
        hearingNoticeRequired: true,
        preparedBy: officer._id,
        lawyerPresent: [officer._id],
        hearingNoticeServed: true,
      });

      if (slot.upcoming && slot.hearingInDays > 0) {
        upcomingHearingDate = daysFromNow(slot.hearingInDays);
        hearings.push({
          date: upcomingHearingDate,
          purpose:
            i === 2
              ? "Defence to charge and plea"
              : i === 1
                ? "Pre-hearing session of the petition"
                : i === 4
                  ? "Substantive hearing of the suit"
                  : "Trial / Hearing of substantive issues",
          outcome: "",
          nextHearingDate: daysFromNow(slot.hearingInDays + 14),
          hearingNoticeRequired: true,
          preparedBy: officer._id,
          lawyerPresent: [officer._id],
          hearingNoticeServed: false,
        });
      } else if (!slot.upcoming) {
        hearings.push({
          date: daysAgo(slot.hearingInDays < 0 ? Math.abs(slot.hearingInDays) : 10),
          purpose: "Trial hearing",
          outcome: "Evidence of claimant closed; cross-examination ongoing",
          hearingNoticeRequired: true,
          preparedBy: officer._id,
          lawyerPresent: [officer._id],
          hearingNoticeServed: true,
        });
      }

      const litigationData = {
        matterId: matter._id,
        firmId: firm._id,
        suitNo: `LD/${String(firmIndex + 1).padStart(2, "0")}/${year}/${String(i + 1).padStart(3, "0")}`,
        courtName: court.name,
        courtNo: `SUIT-${firmIndex + 1}-${i + 1}`,
        courtLocation: court.location,
        state: court.state,
        division: court.name === "federal high court" ? "Lagos Division" : "Main Registry",
        judge: [{ name: pick(JUDGES, firmIndex + i) }],
        firstParty: {
          description: "Claimant / Applicant",
          name: [{ name: names.a }],
          processesFiled: [
            { name: "Statement of claim", filingDate: daysAgo(20 + i), status: "filed" },
            { name: "Further affidavit", filingDate: daysAgo(8 + i), status: "served" },
          ],
        },
        secondParty: {
          description: slot.category === "criminal" ? "Prosecution" : "Respondent / Defendant",
          name: [{ name: slot.category === "criminal" ? "The State" : names.opp }],
          processesFiled: [
            { name: "Statement of defence", filingDate: daysAgo(12 + i), status: "filed" },
          ],
        },
        modeOfCommencement:
          i === 1
            ? "petition"
            : i === 2
              ? "information"
              : i === 5
                ? "notice of appeal"
                : "writ of summons",
        filingDate: daysAgo(45 + i * 7),
        serviceDate: daysAgo(40 + i * 7),
        hearings,
        currentStage: slot.stage,
        litigationSteps: [
          { title: "File all pleadings", status: "completed", priority: "high", order: 1 },
          {
            title: "Prepare for upcoming hearing",
            status: slot.upcoming ? "pending" : "completed",
            dueDate: upcomingHearingDate || daysFromNow(10),
            priority: slot.priority,
            assignedTo: officer._id,
            order: 2,
          },
        ],
      };

      if (slot.status === "won") {
        litigationData.judgment = {
          judgmentDate: daysAgo(6),
          judgmentSummary: "Judgment delivered in favour of the client; assessment struck out.",
          outcome: "won",
          damages: 0,
          costs: 200000,
        };
        litigationData.appeal = { isAppealed: false };
        litigationData.settlement = {};
      }

      if (slot.status === "settled") {
        litigationData.settlement = {
          isSettled: true,
          settlementDate: daysAgo(10),
          settlementTerms: "Consent judgment in agreed terms",
          settlementAmount: 1500000,
        };
      }

      await LitigationDetail.create(litigationData);
      details++;

      // ---- Calendar event for upcoming hearings ----
      if (slot.upcoming && upcomingHearingDate) {
        await CalendarEvent.create({
          firmId: firm._id,
          eventId: `EVT-${year}-${String(firmIndex + 1).padStart(2, "0")}-${String(sequence).padStart(4, "0")}`,
          matter: matter._id,
          eventType: "hearing",
          status: "confirmed",
          priority: slot.priority,
          title: `Hearing - ${title}`,
          description: `Court hearing for ${title}. Suit: ${litigationData.suitNo} (${court.name}).`,
          startDateTime: upcomingHearingDate,
          endDateTime: hourFrom(upcomingHearingDate),
          timezone: "Africa/Lagos",
          location: {
            type: "court",
            courtName: court.name,
            courtRoom: courtRoomFor(i),
            address: court.location,
          },
          organizer: officer._id,
          participants: [
            { user: officer._id, role: "organizer", responseStatus: "accepted" },
            { user: client._id, role: "attendee", responseStatus: "accepted" },
          ],
          visibility: "team",
          hearingMetadata: {
            judge: pick(JUDGES, firmIndex + i),
            courtRoom: `Court ${((i + 1) % 9) + 1}`,
            suitNumber: litigationData.suitNo,
            hearingType: i === 1 ? "preliminary" : i === 4 ? "trial" : "mention",
            isAdjourned: false,
          },
          createdBy: officer._id,
          lastModifiedBy: officer._id,
          tags: slot.tags,
          color: "#1976d2",
          allowConflicts: false,
          notifyParticipants: true,
        });
        events++;
      }
    }

    console.log(`   ✅ Created: ${title}`);
  }

  return { matters: created, details, events };
}

// ============================================
// MAIN
// ============================================

const seedMatters = async () => {
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
      const matters = await Matter.find({ firmId: { $in: firmIds } });
      const matterIds = matters.map((m) => m._id);
      const delDetails = await LitigationDetail.deleteMany({
        matterId: { $in: matterIds },
      });
      const delEvents = await CalendarEvent.deleteMany({
        matter: { $in: matterIds },
      });
      const delMatters = await Matter.deleteMany({ firmId: { $in: firmIds } });
      console.log(
        `🧹 Cleaned target firms: ${matters.length} matter(s), ${delDetails.deletedCount} litigation detail(s), ${delEvents.deletedCount} event(s)`,
      );
    }

    let totalMatters = 0;
    let totalDetails = 0;
    let totalEvents = 0;
    const summaries = [];

    for (let f = 0; f < firms.length; f++) {
      const res = await seedFirmMatters(firms[f], f);
      totalMatters += res.matters;
      totalDetails += res.details;
      totalEvents += res.events;
      summaries.push(
        `${firms[f].subdomain}: ${res.matters} matter(s), ${res.details} detail(s), ${res.events} event(s)`,
      );
    }

    console.log("\n========================================");
    console.log(`📊 Seeding Complete!`);
    console.log(`   Firms: ${firms.length}`);
    console.log(`   Matters created: ${totalMatters}`);
    console.log(`   Litigation details created: ${totalDetails}`);
    console.log(`   Upcoming hearing events: ${totalEvents}`);
    console.log(`   Summary:`);
    for (const s of summaries) console.log(`      - ${s}`);
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding matters:", error);
    process.exit(1);
  }
};

seedMatters();