const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const Template = require("../models/templateModel");
const templateSeeds = require("./templateSeeds");

// Use local database for development, Atlas for production
let DB;
if (process.env.NODE_ENV === "production") {
  // Production: Use Atlas with password replacement
  DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
  );
} else {
  // Development: Use local database
  DB = process.env.DATABASE_LOCAL || "mongodb://127.0.0.1:27017/case-master-app";
}

console.log(`📦 Connecting to: ${DB.includes("127.0.0.1") ? "Local MongoDB" : "MongoDB Atlas"}`);

const seedTemplates = async () => {
  try {
    await mongoose.connect(DB);
    console.log("✅ Database connected");

    console.log(`📋 Found ${templateSeeds.length} templates to seed`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const templateData of templateSeeds) {
      const existingTemplate = await Template.findOne({
        title: templateData.title,
        isSystemTemplate: true,
        firmId: null,
      });

      if (existingTemplate) {
        console.log(`⏭️  Skipped (already exists): ${templateData.title}`);
        skippedCount++;
        continue;
      }

      await Template.create({
        ...templateData,
        firmId: null,
        isSystemTemplate: true,
      });

      console.log(`✅ Created: ${templateData.title}`);
      createdCount++;
    }

    console.log("\n========================================");
    console.log(`📊 Seeding Complete!`);
    console.log(`   Created: ${createdCount} templates`);
    console.log(`   Skipped: ${skippedCount} templates`);
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
};

seedTemplates();
