// audit-schema.js
// Enhanced MongoDB schema audit tool

const mongoose = require("mongoose");
// require("dotenv").config(); // For environment variables

async function auditSchema() {
  let connection = null;

  try {
    // 1. Connect to MongoDB
    const mongoURI = process.env.DATABASE || process.env.DATABASE_LOCAL;

    console.log(
      `Connecting to MongoDB: ${mongoURI.split("@").pop() || mongoURI}`,
    ); // Hide credentials

    connection = await mongoose.connect(mongoURI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("✓ MongoDB connected successfully\n");

    // 2. Get all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    if (collections.length === 0) {
      console.log("No collections found in the database.");
      return;
    }

    console.log(`=== Found ${collections.length} Collections ===\n`);

    // 3. Analyze each collection
    for (const collection of collections) {
      const collectionName = collection.name;

      try {
        const coll = mongoose.connection.db.collection(collectionName);

        // Get document count
        const count = await coll.estimatedDocumentCount();

        console.log(`📁 Collection: ${collectionName}`);
        console.log(`   📊 Document Count: ${count}`);

        if (count === 0) {
          console.log("   ⚠️  No documents in this collection\n");
          continue;
        }

        // Get multiple samples for better schema understanding
        const samples = await coll.find({}).limit(3).toArray();

        console.log(`   🔍 Sample Documents (${samples.length} of ${count}):`);

        // Analyze schema from samples
        const fieldAnalysis = analyzeFields(samples);

        console.log("   📋 Schema Analysis:");
        for (const [field, types] of Object.entries(fieldAnalysis)) {
          const typeStr = Array.from(types).join(" | ");
          console.log(`     - ${field}: ${typeStr}`);
        }

        // Check for indexes
        const indexes = await coll.indexes();
        console.log(`   🗂️  Indexes: ${indexes.length - 1} custom indexes`); // -1 for default _id index

        // Show collection stats if available
        try {
          const stats = await coll.stats();
          console.log(
            `   💾 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          );
          console.log(
            `   🏗️  Avg Document Size: ${(stats.avgObjSize || 0).toFixed(
              2,
            )} bytes`,
          );
        } catch (statsError) {
          // Stats might not be available
        }

        console.log("---\n");
      } catch (collError) {
        console.error(
          `❌ Error analyzing collection "${collectionName}":`,
          collError.message,
        );
        console.log("---\n");
      }
    }

    // 4. Overall database stats
    try {
      const dbStats = await mongoose.connection.db.stats();
      console.log("=== Database Summary ===");
      console.log(`Collections: ${dbStats.collections}`);
      console.log(`Total Documents: ${dbStats.objects}`);
      console.log(
        `Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(
        `Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      );
    } catch (dbStatsError) {
      console.log("Could not retrieve database statistics");
    }
  } catch (error) {
    console.error("❌ Critical error during schema audit:", error.message);
    if (error.code) console.error(`   Error code: ${error.code}`);
  } finally {
    // 5. Clean disconnect
    if (connection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("\n✓ MongoDB connection closed");
    }
  }
}

// Helper function to analyze field types across multiple documents
function analyzeFields(documents) {
  const fieldTypes = {};

  documents.forEach((doc) => {
    Object.entries(doc).forEach(([key, value]) => {
      if (!fieldTypes[key]) {
        fieldTypes[key] = new Set();
      }

      const type = Array.isArray(value)
        ? "Array"
        : value === null
          ? "null"
          : typeof value;

      // For objects, check if it's a Date or nested object
      if (type === "object" && value !== null) {
        if (value instanceof Date) {
          fieldTypes[key].add("Date");
        } else if (value instanceof mongoose.Types.ObjectId) {
          fieldTypes[key].add("ObjectId");
        } else {
          fieldTypes[key].add("Object");
          // Recursively analyze nested objects if needed
          if (Object.keys(value).length > 0) {
            fieldTypes[key].add(
              JSON.stringify(value, null, 0).substring(0, 50) + "...",
            );
          }
        }
      } else {
        fieldTypes[key].add(type);
      }
    });
  });

  return fieldTypes;
}

// Handle command line execution
if (require.main === module) {
  auditSchema()
    .then(() => {
      console.log("\n✅ Schema audit completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Schema audit failed:", error);
      process.exit(1);
    });
}

module.exports = auditSchema;
