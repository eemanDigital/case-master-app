// utils/seedUser.js - Seed users, staff and clients for the seeded law firms
//
// Usage:
//   node utils/seedUser.js                 # seed (idempotent, skips existing)
//   node utils/seedUser.js --firm=apex-partners   # seed only one firm by subdomain
//   node utils/seedUser.js --clean         # wipe users of seeded firms, then seed
//
// Every user is hard-linked to a firm via `firmId` (established by seedFirm.js).
// Run seedFirm.js FIRST, then this script. Each firm gets a managing partner
// (super-admin) plus associate lawyers, a paralegal, secretary, accountant, HR
// and IT staff, and a mix of corporate/individual/government clients.

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const Firm = require("../models/firmModel");
const User = require("../models/userModel");

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

const SEED_PASSWORD = "Seed@1234";

// ============================================
// SEED DATA - one principal per firm (managing partner)
// ============================================

const PRINCIPALS = {
  "apex-partners": { firstName: "Adaeze", lastName: "Okafor", gender: "female" },
  "sterling-bridge": { firstName: "Ibrahim", lastName: "Musa", gender: "male" },
  "kreston-mediators": { firstName: "Blessing", lastName: "Woko", gender: "female" },
  "nnamdi-obi": { firstName: "Nnamdi", lastName: "Obi", gender: "male" },
  "harmattan-solicitors": { firstName: "Amina", lastName: "Suleiman", gender: "female" },
  "coastal-guards": { firstName: "Efe", lastName: "Akpore", gender: "male" },
  "cedar-house": { firstName: "Funmilayo", lastName: "Adetiba", gender: "female" },
  "gavel-scale": { firstName: "Tunde", lastName: "Bakare", gender: "male" },
};

const STAFF_TEMPLATES = [
  { role: "lawyer", adminLevel: "admin", position: "Senior Partner", gender: "male", practiceAreas: ["corporate", "tax"], barOffset: 2008, isPartner: true },
  { role: "lawyer", adminLevel: "none", position: "Senior Associate", gender: "female", practiceAreas: ["criminal", "personal-injury"], barOffset: 2013, isPartner: false },
  { role: "lawyer", adminLevel: "none", position: "Associate", gender: "male", practiceAreas: ["family", "real-estate"], barOffset: 2016, isPartner: false },
  { role: "lawyer", adminLevel: "none", position: "Junior Associate", gender: "female", practiceAreas: ["corporate", "intellectual-property"], barOffset: 2020, isPartner: false },
  { role: "paralegal", adminLevel: "none", position: "Other", gender: "male", department: "support", practiceAreas: [], isPartner: false },
  { role: "secretary", adminLevel: "none", position: "Secretary", gender: "female", department: "administration", practiceAreas: [], isPartner: false },
  { role: "accountant", adminLevel: "admin", position: "Administrator", gender: "male", department: "finance", practiceAreas: [], isPartner: false },
  { role: "hr", adminLevel: "none", position: "HR Manager", gender: "female", department: "hr", practiceAreas: [], isPartner: false },
  { role: "it", adminLevel: "none", position: "Administrator", gender: "male", department: "it", practiceAreas: [], isPartner: false },
];

const STAFF_FIRST_NAMES = [
  "Chinedu", "Ngozi", "Yusuf", "Kemi", "Emeka", "Zainab", "Oluwaseun",
  "Halima", "Ifeanyi", "Adaobi", "Segun", "Fatima", "Tobi", "Chioma",
  "Musa", "Yetunde",
];

const STAFF_LAST_NAMES = [
  "Eze", "Okeke", "Balogun", "Adeyemi", "Nwosu", "Lawal", "Ogunleye",
  "Ibrahim", "Okonkwo", "Umeh", "Afolabi", "Yakubu", "Osagie", "Nnamdi",
  "Bello", "Akinwunmi",
];

// Client seed pool (cycled per firm, unique per firm)
const CLIENT_TEMPLATES = [
  { category: "corporate", industry: "Banking & Finance", company: "First Continental Bank Plc", preferredContactMethod: "email", contactName: "Corporate Client" },
  { category: "corporate", industry: "Oil & Gas", company: "Delta Petroleum Ltd", preferredContactMethod: "phone", contactName: "Corporate Client" },
  { category: "individual", industry: "Real Estate", company: null, preferredContactMethod: "whatsapp", contactName: "Individual Client" },
  { category: "government", industry: "Public Sector", company: "State Ministry of Works", preferredContactMethod: "email", contactName: "Government Client" },
  { category: "individual", industry: "Personal Injury", company: null, preferredContactMethod: "in-person", contactName: "Individual Client" },
  { category: "ngo", industry: "Non-Profit", company: "Hope Foundation Initiative", preferredContactMethod: "email", contactName: "NGO Client" },
  { category: "corporate", industry: "Telecommunications", company: "SwiftCom Networks Ltd", preferredContactMethod: "phone", contactName: "Corporate Client" },
  { category: "individual", industry: "Family Law", company: null, preferredContactMethod: "email", contactName: "Individual Client" },
];

const CLIENT_FIRST_NAMES = [
  "Ada", "Bamidele", "Chiamaka", "Dapo", "Ebere", "Folake",
  "Gbenga", "Hauwa", "Ikenna", "Jumoke", "Kelechi", "Lamidi",
];

const CLIENT_LAST_NAMES = [
  "Okoro", "Adewale", "Nwankwo", "Fashola", "Ezeani", "Adeleke",
  "Onyema", "Danladi", "Uche", "Olawale", "Agbaje", "Bello",
];

// ============================================
// HELPERS
// ============================================

const pick = (arr, i) => arr[i % arr.length];

const uniqueBarNumber = (firmIndex, templateIndex) =>
  `B/SC/${2010 + templateIndex}/${String(firmIndex).padStart(2, "0")}${String(templateIndex).padStart(2, "0")}`;

const phoneFor = (n) => `+23480${String(12345678 + n).padStart(8, "0")}`;

const emailFor = (firmName, userType, index) =>
  `seed.${userType}.${index}.${firmName.replace(/[^a-z0-9]/gi, "").toLowerCase()}@lawmaster.ng`;

const addressFor = (city, index) =>
  `${12 + index} Seeded Crescent, ${city}, Nigeria`;

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// ============================================
// SEEDING
// ============================================

const getClientsByFirm = async (firmId) =>
  User.find({ firmId, userType: "client" });

const getStaffByFirm = async (firmId) =>
  User.find({ firmId, userType: "staff" });

async function seedFirmUsers(firm, firmIndex) {
  const existingStaff = await getStaffByFirm(firm._id);
  const existingClients = await getClientsByFirm(firm._id);

  const staffEmails = new Set(existingStaff.map((u) => u.email));
  const clientEmails = new Set(existingClients.map((u) => u.email));

  const created = [];
  let partnerId = null;

  console.log(`\n🏢 Firm: ${firm.name} (${firm.subdomain})`);

  // ---- Prioritize treating PRINCIPALS as the managing partner ----
  // Create 1 super-admin managing partner per firm
  const principal = PRINCIPALS[firm.subdomain] || {
    firstName: "Managing",
    lastName: "Partner",
    gender: "male",
  };

  const principalEmail = emailFor(firm.subdomain, "staff", 0);
  if (!staffEmails.has(principalEmail)) {
    const partner = await User.create({
      firmId: firm._id,
      firstName: principal.firstName,
      lastName: principal.lastName,
      email: principalEmail,
      phone: phoneFor(firmIndex * 100 + 1),
      gender: principal.gender,
      address: addressFor(firm.contact.address.city, firmIndex),
      userType: "staff",
      role: "lawyer",
      adminLevel: "super-admin",
      position: "Managing Partner",
      password: SEED_PASSWORD,
      passwordConfirm: SEED_PASSWORD,
      isVerified: true,
      isActive: true,
      status: "active",
      userAgent: [],
      lawyerDetails: {
        barNumber: uniqueBarNumber(firmIndex, 0),
        yearOfCall: daysAgo(365 * 18),
        practiceAreas: ["corporate", "tax"],
        isPartner: true,
        partnershipPercentage: 25,
        hourlyRate: 250000,
        retainerFee: 1500000,
        languages: [{ language: "English", proficiency: "native" }],
      },
      professionalInfo: {
        bio: `Managing Partner at ${firm.name}.`,
        socialLinks: { linkedIn: "", twitter: "", website: "" },
      },
    });
    created.push(partner);
    staffEmails.add(principalEmail);
    partnerId = partner._id;
    console.log(`   ✅ Created managing partner: ${partner.fullName}`);
  } else {
    const existingPartner = existingStaff.find((u) => u.email === principalEmail);
    partnerId = existingPartner ? existingPartner._id : existingStaff[0]._id;
    console.log(`   ⏭️  Managing partner already exists`);
  }

  // ---- Create the rest of the staff ----
  for (let i = 0; i < STAFF_TEMPLATES.length; i++) {
    const template = STAFF_TEMPLATES[i];
    const email = emailFor(firm.subdomain, "staff", i + 1);
    if (staffEmails.has(email)) {
      console.log(`   ⏭️  Skipped (exists): ${email}`);
      continue;
    }

    const firstName = pick(STAFF_FIRST_NAMES, firmIndex * 3 + i);
    const lastName = pick(STAFF_LAST_NAMES, firmIndex * 3 + i + 2);

    const staffData = {
      firmId: firm._id,
      firstName,
      lastName,
      email,
      phone: phoneFor(firmIndex * 100 + i + 2),
      gender: template.gender,
      address: addressFor(firm.contact.address.city, i),
      userType: "staff",
      role: template.role,
      adminLevel: template.adminLevel,
      position: template.position,
      password: SEED_PASSWORD,
      passwordConfirm: SEED_PASSWORD,
      isVerified: true,
      isActive: true,
      status: "active",
      userAgent: [],
      createdBy: partnerId || undefined,
      staffDetails: {
        department: template.department || "support",
        dateOfJoining: daysAgo(30 * (i + 2)),
        employmentType: "full-time",
        workSchedule: "9-5",
        skills: template.role === "lawyer" ? ["Advocacy", "Research", "Drafting"] : ["Administration"],
      },
    };

    if (template.isPartner || partnerId) {
      staffData.staffDetails.reportingTo = partnerId || undefined;
    }

    if (template.role === "lawyer") {
      staffData.lawyerDetails = {
        barNumber: uniqueBarNumber(firmIndex, i + 1),
        yearOfCall: daysAgo(365 * (template.barOffset - 1990)),
        practiceAreas: template.practiceAreas,
        hourlyRate: 85000,
        retainerFee: 600000,
        isPartner: template.isPartner,
      };
    }

    const staff = await User.create(staffData);
    created.push(staff);
    staffEmails.add(email);
    console.log(`   ✅ Created staff: ${firstName} ${lastName} (${template.role}, ${email})`);
  }

  // ---- Create clients ----
  const clientCount = Math.min(4, CLIENT_TEMPLATES.length);
  for (let i = 0; i < clientCount; i++) {
    const template = CLIENT_TEMPLATES[(firmIndex + i) % CLIENT_TEMPLATES.length];
    const email = emailFor(firm.subdomain, "client", i);
    if (clientEmails.has(email)) {
      console.log(`   ⏭️  Skipped (exists): ${email}`);
      continue;
    }

    const firstName = pick(CLIENT_FIRST_NAMES, firmIndex + i);
    const lastName = pick(CLIENT_LAST_NAMES, firmIndex * 2 + i);

    const client = await User.create({
      firmId: firm._id,
      firstName,
      lastName,
      email,
      phone: phoneFor(firmIndex * 100 + 50 + i),
      gender: i % 2 === 0 ? "female" : "male",
      userType: "client",
      role: "client",
      adminLevel: "none",
      password: SEED_PASSWORD,
      passwordConfirm: SEED_PASSWORD,
      isVerified: true,
      isActive: true,
      status: "active",
      userAgent: [],
      clientDetails: {
        company: template.company,
        industry: template.industry,
        clientSince: daysAgo(120 + i * 30),
        clientCategory: template.category,
        preferredContactMethod: template.preferredContactMethod,
        referralSource: "referral",
        clientNotes: `Seed ${template.contactName.toLowerCase()} for ${firm.name}.`,
      },
    });

    created.push(client);
    clientEmails.add(email);
    console.log(`   ✅ Created client: ${firstName} ${lastName} (${template.category}, ${email})`);
  }

  // ---- Sync firm usage count ----
  const totalUsers =
    created.length + existingStaff.length + existingClients.length;
  if (firm.usage.currentUserCount !== totalUsers) {
    firm.usage.currentUserCount = totalUsers;
    await firm.save();
    console.log(`   📈 Firm user count synced to ${totalUsers}`);
  }

  return created.length;
}

// ============================================
// MAIN
// ============================================

const seedUsers = async () => {
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
      const result = await User.deleteMany({ firmId: { $in: firmIds } });
      console.log(`🧹 Deleted ${result.deletedCount} existing user(s) of target firms`);
      for (const firm of firms) {
        firm.usage.currentUserCount = 0;
        await firm.save();
      }
    }

    let totalCreated = 0;
    const summaries = [];

    for (let f = 0; f < firms.length; f++) {
      const firm = firms[f];
      const created = await seedFirmUsers(firm, f);
      totalCreated += created;
      summaries.push(`${firm.subdomain}: ${created} created`);
    }

    console.log("\n========================================");
    console.log(`📊 Seeding Complete!`);
    console.log(`   Firms: ${firms.length}`);
    console.log(`   Users created: ${totalCreated}`);
    console.log(`   Summary: ${summaries.join(" | ")}`);
    console.log(`   Password for all seeded users: ${SEED_PASSWORD}`);
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
};

seedUsers();