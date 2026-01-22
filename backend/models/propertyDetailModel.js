const mongoose = require("mongoose");

// Sub-schemas
const propertyDetailsSchema = new mongoose.Schema(
  {
    propertyType: {
      type: String,
      enum: [
        "residential",
        "commercial",
        "industrial",
        "agricultural",
        "mixed-use",
        "land",
      ],
    },
    address: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    lga: {
      type: String,
      trim: true,
    },
    landSize: {
      value: Number,
      unit: {
        type: String,
        enum: ["sqm", "sqft", "hectares", "acres", "plots"],
      },
    },
    titleDocument: {
      type: String,
      enum: [
        "c-of-o",
        "deed-of-assignment",
        "governors-consent",
        "survey-plan",
        "other",
      ],
    },
    titleNumber: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const paymentScheduleSchema = new mongoose.Schema(
  {
    installmentNumber: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "waived"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// PropertyDetail Schema
const propertyDetailSchema = new mongoose.Schema(
  {
    matterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
      required: [true, "Matter ID is required"],
      unique: true,
      index: true,
    },

    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },

    // ============================================
    // TRANSACTION TYPE
    // ============================================
    transactionType: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: {
        values: [
          "purchase",
          "sale",
          "lease",
          "sublease",
          "mortgage",
          "property_development",
          "land_acquisition",
          "title_perfection",
          "boundary_dispute",
          "tenancy_matter",
          "property_management",
          "foreclosure",
          "partition",
          "right_of_way",
          "easement",
          "other",
        ],
        message: "Invalid transaction type",
      },
    },

    otherTransactionType: {
      type: String,
      trim: true,
    },

    // ============================================
    // PROPERTY INFORMATION
    // ============================================
    properties: [propertyDetailsSchema],

    // ============================================
    // PARTIES
    // ============================================
    vendor: {
      name: {
        type: String,
        trim: true,
      },
      contact: {
        type: String,
        trim: true,
      },
    },

    purchaser: {
      name: {
        type: String,
        trim: true,
      },
      contact: {
        type: String,
        trim: true,
      },
    },

    landlord: {
      name: {
        type: String,
        trim: true,
      },
      contact: {
        type: String,
        trim: true,
      },
    },

    tenant: {
      name: {
        type: String,
        trim: true,
      },
      contact: {
        type: String,
        trim: true,
      },
    },

    // ============================================
    // FINANCIAL DETAILS
    // ============================================
    purchasePrice: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
    },

    rentAmount: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually", "one-time"],
      },
    },

    securityDeposit: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
    },

    paymentTerms: {
      type: String,
      enum: ["lump-sum", "installments", "mortgage", "other"],
    },

    paymentSchedule: [paymentScheduleSchema],

    // ============================================
    // LEGAL DOCUMENTATION
    // ============================================
    contractOfSale: {
      executionDate: {
        type: Date,
      },
      completionDate: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["draft", "executed", "completed", "terminated"],
      },
    },

    leaseAgreement: {
      commencementDate: {
        type: Date,
      },
      expiryDate: {
        type: Date,
      },
      duration: {
        years: Number,
        months: Number,
      },
      renewalOption: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ["draft", "executed", "active", "expired", "terminated"],
      },
    },

    deedOfAssignment: {
      executionDate: {
        type: Date,
      },
      registrationDate: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["pending", "executed", "registered"],
      },
    },

    // ============================================
    // REGULATORY & APPROVALS
    // ============================================
    governorsConsent: {
      isRequired: {
        type: Boolean,
        default: false,
      },
      applicationDate: {
        type: Date,
      },
      approvalDate: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["not-required", "pending", "approved", "rejected"],
      },
      referenceNumber: {
        type: String,
        trim: true,
      },
    },

    surveyPlan: {
      isAvailable: {
        type: Boolean,
        default: false,
      },
      surveyNumber: {
        type: String,
        trim: true,
      },
      surveyDate: {
        type: Date,
      },
    },

    // ============================================
    // DUE DILIGENCE
    // ============================================
    titleSearch: {
      isCompleted: {
        type: Boolean,
        default: false,
      },
      searchDate: {
        type: Date,
      },
      findings: {
        type: String,
        trim: true,
        maxlength: [2000, "Findings must be less than 2000 characters"],
      },
      encumbrances: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    physicalInspection: {
      isCompleted: {
        type: Boolean,
        default: false,
      },
      inspectionDate: {
        type: Date,
      },
      findings: {
        type: String,
        trim: true,
        maxlength: [2000, "Findings must be less than 2000 characters"],
      },
    },

    // ============================================
    // DEVELOPMENT (if applicable)
    // ============================================
    development: {
      isApplicable: {
        type: Boolean,
        default: false,
      },
      planningPermit: {
        status: {
          type: String,
          enum: ["not-required", "pending", "approved", "rejected"],
        },
        approvalDate: {
          type: Date,
        },
      },
      buildingPermit: {
        status: {
          type: String,
          enum: ["not-required", "pending", "approved", "rejected"],
        },
        approvalDate: {
          type: Date,
        },
      },
      estimatedCost: {
        amount: Number,
        currency: {
          type: String,
          default: "NGN",
        },
      },
      expectedCompletion: {
        type: Date,
      },
    },

    // ============================================
    // OBLIGATIONS & CONDITIONS
    // ============================================
    conditions: [
      {
        condition: {
          type: String,
          trim: true,
        },
        dueDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "met", "waived", "overdue"],
          default: "pending",
        },
      },
    ],

    // ============================================
    // SOFT DELETE & AUDIT
    // ============================================
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
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
// INDEXES
// ============================================

propertyDetailSchema.index({ matterId: 1 }, { unique: true });
propertyDetailSchema.index({ firmId: 1, transactionType: 1 });
propertyDetailSchema.index({ firmId: 1, "properties.state": 1 });

// ============================================
// MIDDLEWARE
// ============================================

propertyDetailSchema.pre("save", async function (next) {
  if (this.isNew && this.matterId) {
    const Matter = mongoose.model("Matter");
    const matter = await Matter.findById(this.matterId).select("firmId");
    if (matter) {
      this.firmId = matter.firmId;
    }
  }
  next();
});

// ============================================
// VIRTUALS
// ============================================

propertyDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

const PropertyDetail = mongoose.model("PropertyDetail", propertyDetailSchema);

module.exports = PropertyDetail;
