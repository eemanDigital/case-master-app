// utils/seedFirm.js - Seed 8 dummy law firms into the app (multi-tenant aware)
//
// Usage:
//   node utils/seedFirm.js                 # seed (idempotent, skips existing firms)
//   node utils/seedFirm.js --clean         # wipe existing firms, then seed
//
// Firms are the tenant root. Run this BEFORE any script that seeds users, staff
// or matters so those records have a firmId to attach to. Each seeded firm is
// matched by its unique `subdomain`, so re-running is safe.

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const Firm = require("../models/firmModel");

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

// ============================================
// SEED DATA
// ============================================

const FIRM_SEEDS = [
  {
    name: "Apex & Partners LLP",
    subdomain: "apex-partners",
    contact: {
      phone: "+2348012345678",
      email: "info@apexpartners.ng",
      rcNumber: "RC123456",
      address: {
        street: "14 Adeola Odeku Street, Victoria Island",
        city: "Lagos",
        state: "Lagos",
      },
    },
    settings: {
      timezone: "Africa/Lagos",
      dateFormat: "DD/MM/YYYY",
      currency: "NGN",
      language: "en",
      invoicePrefix: "APX",
      receiptPrefix: "APR",
      billOfChargesPrefix: "APB",
      taxRate: 7.5,
      defaultPaymentTerms: "Payment due within 14 days",
      invoiceFooter: "Thank you for your continued patronage.",
    },
    subscription: {
      plan: "PRO",
      status: "ACTIVE",
      trialEndsAt: null,
      expiresAt: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    isActive: true,
  },
  {
    name: "Sterling Bridge Legal Counsel",
    subdomain: "sterling-bridge",
    contact: {
      phone: "+2349034567890",
      email: "contact@sterlingbridge.ng",
      rcNumber: "RC223344",
      address: {
        street: "2 Aguiyi Ironsi Street, Maitama",
        city: "Abuja",
        state: "FCT",
      },
    },
    settings: {
      timezone: "Africa/Lagos",
      dateFormat: "DD-MM-YYYY",
      currency: "NGN",
      language: "en",
      invoicePrefix: "SBL",
      receiptPrefix: "SBR",
      billOfChargesPrefix: "SBB",
      taxRate: 7.5,
    },
    subscription: {
      plan: "ENTERPRISE",
      status: "ACTIVE",
      trialEndsAt: null,
      expiresAt: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    isActive: true,
  },
  {
    name: "Kreston Laywers & Mediators",
    subdomain: "kreston-mediators",
    contact: {
      phone: "+2348056789012",
      email: "info@krestonmediators.ng",
      rcNumber: "RC334455",
      address: {
        street: "7 Woji Road, GRA Phase 2",
        city: "Port Harcourt",
        state: "Rivers",
      },
    },
    settings: {
      timezone: "Africa/Lagos",
      dateFormat: "DD/MM/YYYY",
      currency: "NGN",
      language: "pcm",
      invoicePrefix: "KRM",
      receiptPrefix: "KRR",
      billOfChargesPrefix: "KRB",
      taxRate: 5,
    },
    subscription: {
      plan: "BASIC",
      status: "ACTIVE",
      trialEndsAt: null,
      expiresAt: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
    isActive: true,
  },
  {
    name: "Nnamdi Obi & Associates",
    subdomain: "nnamdi-obi",
    contact: {
      phone: "+2347065432109",
      email: "info@nnamdiobi.ng",
      rcNumber: "RC445566",
      address: {
        street: "22 Zik Avenue, Uwani",
        city: "Enugu",
        state: "Enugu",
      },
    },
    settings: {
      timezone: "Africa/Lagos",
      dateFormat: "DD/MM/YYYY",
      currency: "NGN",
      language: "ig",
      invoicePrefix: "NOA",
      receiptPrefix: "NOR",
      billOfChargesPrefix: "NOB",
      taxRate: 0,
    },
    subscription: {
      plan: "FREE",
      status: "ACTIVE",
      trialEndsAt: null,
    },
    isActive: true,
  },
  {
    name: "Harmattan Solicitors",
    subdomain: "harmattan-solicitors",
    contact: {
      phone: "+2348123456789",
      email: "contact@harmattansolicitors.ng",
      rcNumber: "RC556677",
      address: {
        street: "5 Airport Road, Hotoro",
        city: "Kano",
        state: "Kano",
      },
    },
    settings: {
      timezone: "Africa/Lagos",
      dateFormat: "DD-MM-YYYY",
      currency: "NGN",
      language: "ha",
      invoicePrefix: "HTS",
      receiptPrefix: "HTR",
      billOfChargesPrefix: "HTB",
      taxRate: 0,
    },
    subscription: {
      plan: "FREE",
      status: "TRIAL",
      trialEndsAt: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    isActive: true,
  },
  {
    name: "Coastal Guards & Co",
    subdomain: "coastal-guards",
    contact: {
      phone: "+2348098765432",
      email: "info@coastalguards.ng",
      rcNumber: "RC667788",
      address: {
        street: "Plot 3 Admiralty Way, Lekki Phase 1",
        city: "Lekki",
        state: "Lagos",
      },
    },
    settings: {
      timezone: "Africa/Lagos",
      dateFormat: "DD/MM/YYYY",
      currency: "NGN",
      language: "en",
      invoicePrefix: "CGC",
      receiptPrefix: "CGR",
      billOfChargesPrefix: "CGB",
      taxRate: 7.5,
    },
    subscription: {
      plan: "BASIC",
      status: "ACTIVE",
      trialEndsAt: null,
      expiresAt: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
    isActive: true,
  },
  {
    name: "Cedar House Legal",
    subdomain: "cedar-house",
    contact: {
      phone: "+2348019876543",
      email: "info@cedarhouselegal.ng",
      rcNumber: "RC778899",
      address: {
        street: "30 Oyo Road, Felele",
        city: "Ibadan",
        state: "Oyo",
      },
    },
    settings: {
      timezone: "Africa/Lagos",
      dateFormat: "DD/MM/YYYY",
      currency: "NGN",
      language: "yo",
      invoicePrefix: "CHL",
      receiptPrefix: "CHR",
      billOfChargesPrefix: "CHB",
      taxRate: 0,
    },
    subscription: {
      plan: "FREE",
      status: "ACTIVE",
      trialEndsAt: null,
    },
    isActive: true,
  },
  {
    name: "Gavel & Scale Attorneys",
    subdomain: "gavel-scale",
    contact: {
      phone: "+2347045671234",
      email: "info@gavelandscale.ng",
      rcNumber: "RC889900",
      address: {
        street: "8a Ozumba Mbadiwe Avenue, Victoria Island",
        city: "Lagos",
        state: "Lagos",
      },
    },
    settings: {
      timezone: "Africa/Lagos",
      dateFormat: "DD/MM/YYYY",
      currency: "NGN",
      language: "en",
      invoicePrefix: "GSA",
      receiptPrefix: "GSR",
      billOfChargesPrefix: "GSB",
      taxRate: 7.5,
      defaultPaymentTerms: "Payment due within 30 days",
    },
    subscription: {
      plan: "PRO",
      status: "ACTIVE",
      trialEndsAt: null,
      expiresAt: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    isActive: true,
  },
];

// ============================================
// MAIN
// ============================================

const resolveDates = (obj) => {
  if (typeof obj === "function") return obj();
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(resolveDates);
  const resolved = {};
  for (const [key, value] of Object.entries(obj)) {
    resolved[key] = resolveDates(value);
  }
  return resolved;
};

const seedFirms = async () => {
  try {
    await mongoose.connect(DB);
    console.log("✅ Database connected");

    if (CLEAN) {
      const result = await Firm.deleteMany({});
      console.log(`🧹 Deleted ${result.deletedCount} existing firm(s)`);
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const seed of FIRM_SEEDS) {
      const existingFirm = await Firm.findOne({
        subdomain: seed.subdomain,
      });

      if (existingFirm) {
        console.log(`⏭️  Skipped (already exists): ${seed.name} (${seed.subdomain})`);
        skippedCount++;
        continue;
      }

      const firmData = {
        name: seed.name,
        subdomain: seed.subdomain,
        contact: seed.contact,
        settings: seed.settings,
        subscription: resolveDates(seed.subscription),
        isActive: seed.isActive,
      };

      const firm = await Firm.create(firmData);

      console.log(
        `✅ Created: ${firm.name} (subdomain: ${firm.subdomain}, id: ${firm._id}, plan: ${firm.subscription.plan})`,
      );
      createdCount++;
    }

    console.log("\n========================================");
    console.log(`📊 Seeding Complete!`);
    console.log(`   Created: ${createdCount} firms`);
    console.log(`   Skipped: ${skippedCount} firms`);
    console.log(`   Total: ${FIRM_SEEDS.length} firms defined in seed data`);
    console.log("========================================");

    console.log("\n🔑 Seeded subdomains for downstream scripts:");
    for (const seed of FIRM_SEEDS) {
      console.log(`   - ${seed.subdomain} (${seed.name})`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding firms:", error);
    process.exit(1);
  }
};

seedFirms();