const mongoose = require("mongoose");

// Reusable sub-schemas
const nameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [2000, "Field should be less than 2000 characters long"],
    },
  },
  { _id: false },
);

const contactPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [200, "Name must be less than 200 characters long"],
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

// Matter Schema - Universal container for all legal work
const matterSchema = new mongoose.Schema(
  {
    // ============================================
    // MULTI-TENANT & IDENTIFICATION
    // ============================================
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },

    matterNumber: {
      type: String,
      required: [true, "Matter number is required"],
      trim: true,
      uppercase: true,
      // Format: MTR/2024/001, MTR/2024/002, etc.
      // Generated automatically on creation
    },

    officeFileNo: {
      type: String,
      trim: true,
      // Internal tracking number used by the law firm
    },

    // ============================================
    // MATTER TYPE & CLASSIFICATION
    // ============================================
    matterType: {
      type: String,
      required: [true, "Matter type is required"],
      enum: {
        values: [
          "litigation",
          "corporate",
          "advisory",
          "retainer",
          "property",
          "general",
        ],
        message: "Invalid matter type",
      },
      index: true,
    },

    category: {
      type: String,
      trim: true,
      // Only required for litigation, optional for others
      enum: {
        values: ["civil", "criminal", "n/a"],
        message: "Category must be civil, criminal, or n/a",
      },
      default: "n/a",
    },

    natureOfMatter: {
      type: String,
      trim: true,
      required: [true, "Nature of matter is required"],
      enum: {
        values: [
          // Litigation
          "contract dispute",
          "personal injury",
          "real estate",
          "land law",
          "pre-election",
          "election petition",
          "family law",
          "intellectual property",
          "employment law",
          "bankruptcy",
          "estate law",
          "tortious liability",
          "immigration",
          "maritime",
          "tax law",
          "constitutional law",
          "environmental law",
          "human rights",
          "criminal law",
          "insurance law",
          "consumer protection",
          "cyber law",

          // Corporate/Commercial
          "merger and acquisition",
          "corporate governance",
          "company incorporation",
          "joint venture",
          "shareholder agreement",
          "securities",
          "banking and finance",
          "capital markets",
          "private equity",
          "venture capital",
          "restructuring",
          "insolvency",

          // Property
          "property acquisition",
          "property sale",
          "lease agreement",
          "property development",
          "land use",
          "real estate finance",

          // Advisory
          "legal opinion",
          "regulatory compliance",
          "due diligence",
          "contract review",
          "legal research",
          "policy development",

          // General
          "general retainer",
          "general legal services",
          "notarial services",
          "documentation",

          // Others
          "energy law",
          "entertainment law",
          "healthcare law",
          "media law",
          "military law",
          "public international law",
          "private international law",
          "telecommunications law",
          "transportation law",
          "trusts and estates",
          "urban development law",
          "water law",
          "other",
        ],
        message: "Invalid nature of matter",
      },
    },

    // ============================================
    // CLIENT & RELATIONSHIP MANAGEMENT
    // ============================================
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client is required"],
      index: true,
    },

    accountOfficer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    opposingParties: [nameSchema],

    contactPersons: [contactPersonSchema],

    // ============================================
    // STATUS & WORKFLOW
    // ============================================
    status: {
      type: String,
      trim: true,
      required: [true, "Matter status is required"],
      enum: {
        values: [
          "active",
          "pending",
          "on-hold",
          "completed",
          "closed",
          "archived",
          "settled",
          "withdrawn",
          "won",
          "lost",
        ],
        message: "Invalid matter status",
      },
      default: "active",
      index: true,
    },

    priority: {
      type: String,
      required: [true, "Matter priority is required"],
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "Invalid priority level",
      },
      default: "medium",
      index: true,
    },

    // ============================================
    // DESCRIPTION & SUMMARY
    // ============================================
    title: {
      type: String,
      trim: true,
      required: [true, "Matter title is required"],
      maxlength: [500, "Title must be less than 500 characters long"],
      // E.g., "Jones v. State" or "ABC Corp Merger" or "Property Acquisition - Lekki"
    },

    description: {
      type: String,
      trim: true,
      required: [true, "Matter description is required"],
      maxlength: [5000, "Description must be less than 5000 characters long"],
    },

    objectives: [nameSchema],

    strengths: [nameSchema],

    weaknesses: [nameSchema],

    risks: [nameSchema],

    stepsToBeTaken: [nameSchema],

    // ============================================
    // DATES & TIMELINE
    // ============================================
    dateOpened: {
      type: Date,
      required: [true, "Date opened is required"],
      default: Date.now,
      index: true,
    },

    expectedClosureDate: {
      type: Date,
    },

    actualClosureDate: {
      type: Date,
    },

    lastActivityDate: {
      type: Date,
      default: Date.now,
    },

    // ============================================
    // FINANCIAL
    // ============================================
    billingType: {
      type: String,
      enum: ["hourly", "fixed", "contingency", "retainer", "pro-bono"],
      default: "hourly",
    },

    estimatedValue: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
    },

    // ============================================
    // FLAGS & METADATA
    // ============================================
    isFiledByTheOffice: {
      type: Boolean,
      default: false,
    },

    isConfidential: {
      type: Boolean,
      default: false,
    },

    conflictChecked: {
      type: Boolean,
      default: false,
    },

    conflictCheckDate: {
      type: Date,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // ============================================
    // COMMENTS & NOTES
    // ============================================
    generalComment: {
      type: String,
      trim: true,
      maxlength: [
        5000,
        "General comment must be less than 5000 characters long",
      ],
    },

    internalNotes: {
      type: String,
      trim: true,
      maxlength: [
        10000,
        "Internal notes must be less than 10000 characters long",
      ],
    },

    // ============================================
    // SOFT DELETE & AUDIT
    // ============================================
    active: {
      type: Boolean,
      default: true,
      select: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================
// INDEXES - CRITICAL FOR PERFORMANCE
// ============================================

// Multi-tenant uniqueness
matterSchema.index({ firmId: 1, matterNumber: 1 }, { unique: true });

// Core listing & filtering (compound indexes)
matterSchema.index({ firmId: 1, dateOpened: -1 });
matterSchema.index({ firmId: 1, status: 1, priority: -1 });
matterSchema.index({ firmId: 1, matterType: 1, status: 1 });
matterSchema.index({ firmId: 1, natureOfMatter: 1 });

// Relationship-based queries
matterSchema.index({ firmId: 1, client: 1, status: 1 });
matterSchema.index({ firmId: 1, accountOfficer: 1, status: 1 });

// Soft delete optimization
matterSchema.index({ firmId: 1, isDeleted: 1, status: 1 });

// Date-based queries (reporting, dashboards)
matterSchema.index({ firmId: 1, lastActivityDate: -1 });
matterSchema.index({ firmId: 1, expectedClosureDate: 1 });

// Text search (optional - enable if needed)
// matterSchema.index({ title: "text", description: "text" });

// ============================================
// VIRTUALS
// ============================================

// Virtual populate for type-specific details
matterSchema.virtual("litigationDetail", {
  ref: "LitigationDetail",
  foreignField: "matterId",
  localField: "_id",
  justOne: true,
});

matterSchema.virtual("corporateDetail", {
  ref: "CorporateDetail",
  foreignField: "matterId",
  localField: "_id",
  justOne: true,
});

matterSchema.virtual("advisoryDetail", {
  ref: "AdvisoryDetail",
  foreignField: "matterId",
  localField: "_id",
  justOne: true,
});

matterSchema.virtual("retainerDetail", {
  ref: "RetainerDetail",
  foreignField: "matterId",
  localField: "_id",
  justOne: true,
});

matterSchema.virtual("propertyDetail", {
  ref: "PropertyDetail",
  foreignField: "matterId",
  localField: "_id",
  justOne: true,
});

matterSchema.virtual("generalDetail", {
  ref: "GeneralDetail",
  foreignField: "matterId",
  localField: "_id",
  justOne: true,
});

// Virtual populate for documents
matterSchema.virtual("documents", {
  ref: "File",
  foreignField: "entityId",
  localField: "_id",
  match: {
    entityType: "Matter",
    isDeleted: { $ne: true },
    isArchived: { $ne: true },
  },
});

// Virtual populate for reports
matterSchema.virtual("reports", {
  ref: "Report",
  foreignField: "matter",
  localField: "_id",
});

// Virtual populate for tasks
matterSchema.virtual("tasks", {
  ref: "Task",
  foreignField: "matter",
  localField: "_id",
});

// Virtual populate for calendar events
matterSchema.virtual("events", {
  ref: "Event",
  foreignField: "matter",
  localField: "_id",
});

// Virtual populate for invoices
matterSchema.virtual("invoices", {
  ref: "Invoice",
  foreignField: "matter",
  localField: "_id",
});

// ============================================
// MIDDLEWARE
// ============================================

// Auto-populate account officers
matterSchema.pre(/^find/, function (next) {
  if (!this.getOptions().skipPopulate) {
    this.populate({
      path: "accountOfficer",
      select: "firstName lastName phone email photo role",
    });
  }
  next();
});

// Filter out inactive and deleted matters
matterSchema.pre(/^find/, function (next) {
  // Only apply if not explicitly querying for deleted items
  if (!this.getQuery().isDeleted) {
    this.find({ active: { $ne: false }, isDeleted: { $ne: true } });
  }
  next();
});

// Update lastActivityDate on save
matterSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityDate = Date.now();
  }
  next();
});

// Generate matterNumber if not provided
matterSchema.pre("save", async function (next) {
  if (this.isNew && !this.matterNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      firmId: this.firmId,
      matterNumber: new RegExp(`^MTR/${year}/`),
    });
    this.matterNumber = `MTR/${year}/${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

// Get the appropriate detail model reference
matterSchema.methods.getDetailModel = function () {
  const detailModelMap = {
    litigation: "LitigationDetail",
    corporate: "CorporateDetail",
    advisory: "AdvisoryDetail",
    retainer: "RetainerDetail",
    property: "PropertyDetail",
    general: "GeneralDetail",
  };
  return detailModelMap[this.matterType];
};

// Soft delete
matterSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedAt = Date.now();
  this.deletedBy = userId;
  this.active = false;
  return await this.save();
};

// Restore from soft delete
matterSchema.methods.restore = async function () {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.active = true;
  return await this.save();
};

const Matter = mongoose.model("Matter", matterSchema);

module.exports = Matter;
