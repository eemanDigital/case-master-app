const mongoose = require("mongoose");

// ============================================
// SUB-SCHEMA: SERVICE ITEM (Nigerian Custom)
// ============================================
const serviceSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      enum: [
        "company-secretarial", // CAC filings, annual returns, director changes
        "litigation-advocacy", // Court appearances, trial representation
        "perfection-of-title", // Land registry, Governor's consent
        "regulatory-compliance", // NAFDAC, EFCC, SCUML filings
        "legal-opinion", // Advisory opinions
        "drafting-review", // Contract drafting/review
        "cac-registration", // New company incorporation
        "notarial-services", // Attestations, certifications
        "arbitration-mediation", // ADR services
        "other",
      ],
    },
    description: {
      type: String,
      trim: true,
    },

    // NIGERIAN BILLING MODEL - Units not Hours
    billingModel: {
      type: String,
      enum: ["within-retainer", "fixed-fee", "lpro-scale", "per-item"],
      default: "within-retainer",
    },

    // Usage tracking (replaces hourly)
    unitDescription: {
      type: String,
      default: "matters/filings",
    },
    serviceLimit: {
      type: Number,
      min: 0,
    }, // e.g., 5 CAC filings per year
    usageCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // LPRO 2023 Compliance
    lproScale: {
      type: String,
      enum: ["Scale 1", "Scale 2", "Scale 3", "Scale 4", "Scale 5", "N/A"],
      default: "N/A",
    },
    lproReference: {
      type: String,
      trim: true, // e.g., "Item 12(a) - Sale of Land"
    },
  },
  { _id: false },
);

// ============================================
// SUB-SCHEMA: DISBURSEMENTS (Out-of-Pockets)
// ============================================
const disbursementSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
      trim: true,
    }, // e.g., "NBA Stamp", "Filing Fee", "Court Transportation"
    category: {
      type: String,
      enum: [
        "court-fees",
        "registry-fees",
        "professional-fees",
        "transport",
        "stamps",
        "other",
      ],
      default: "other",
    },
    estimatedAmount: {
      type: Number,
      min: 0,
    },
    actualAmount: {
      type: Number,
      min: 0,
    },
    isBillableToClient: {
      type: Boolean,
      default: true,
    },
    receiptRequired: {
      type: Boolean,
      default: true,
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    incurredDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

// ============================================
// SUB-SCHEMA: COURT APPEARANCES (for Litigation)
// ============================================
const courtAppearanceSchema = new mongoose.Schema(
  {
    appearanceDate: {
      type: Date,
      required: true,
    },
    court: {
      type: String,
      trim: true,
    },
    suitNumber: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      enum: [
        "mention",
        "hearing",
        "ruling",
        "judgment",
        "adjournment",
        "other",
      ],
    },
    counsel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    outcome: {
      type: String,
      trim: true,
    },
    nextAdjourned: {
      type: Date,
    },
    withinRetainer: {
      type: Boolean,
      default: true,
    },
    additionalFee: {
      amount: Number,
      justification: String,
    },
  },
  { timestamps: true },
);

// ============================================
// SUB-SCHEMA: ACTIVITY LOG
// ============================================
const activityLogSchema = new mongoose.Schema(
  {
    actionDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    unitsConsumed: {
      type: Number,
      default: 1,
    },
    serviceType: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

// ============================================
// MAIN RETAINER MODEL
// ============================================
const retainerDetailSchema = new mongoose.Schema(
  {
    matterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
      required: true,
      unique: true,
      index: true,
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      index: true,
    },

    // ============================================
    // RETAINER TYPE & AGREEMENT
    // ============================================
    retainerType: {
      type: String,
      required: true,
      enum: [
        "general-legal", // General legal advisory
        "company-secretarial", // CAC & corporate compliance
        "retainer-deposit", // Draw-down retainer
        "specialized", // IP, Tax, etc.
        "other",
      ],
    },

    agreementStartDate: {
      type: Date,
      required: true,
    },
    agreementEndDate: {
      type: Date,
    },

    autoRenewal: {
      type: Boolean,
      default: false,
    },
    renewalTerms: {
      type: String,
      trim: true,
    },

    // ============================================
    // SCOPE OF SERVICES
    // ============================================
    servicesIncluded: [serviceSchema],

    scopeDescription: {
      type: String,
      trim: true,
      required: true,
      maxlength: 5000,
    },

    exclusions: [
      {
        type: String,
        trim: true,
      },
    ],

    // ============================================
    // BILLING & NIGERIAN TAXATION
    // ============================================
    billing: {
      // Base Retainer Fee
      retainerFee: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually", "one-off"],
        required: true,
      },

      // Nigerian Tax Compliance
      vatRate: {
        type: Number,
        default: 7.5,
      },
      applyVAT: {
        type: Boolean,
        default: true,
      },
      applyWHT: {
        type: Boolean,
        default: true,
      },
      whtRate: {
        type: Number,
        enum: [5, 10],
        default: 5,
      }, // 5% Individual / 10% Corporate

      // Additional Fees
      additionalFees: {
        isApplicable: {
          type: Boolean,
          default: false,
        },
        description: {
          type: String,
          trim: true,
        },
      },

      // Billing Cap
      billingCap: {
        isApplicable: {
          type: Boolean,
          default: false,
        },
        amount: {
          type: Number,
          min: 0,
        },
        period: {
          type: String,
          enum: ["monthly", "quarterly", "annually"],
        },
      },
    },

    // ============================================
    // DISBURSEMENTS (Out-of-Pockets)
    // ============================================
    disbursements: [disbursementSchema],

    totalDisbursements: {
      type: Number,
      default: 0,
    },

    // ============================================
    // SERVICE DELIVERY & SLA
    // ============================================
    responseTimes: {
      routine: {
        value: Number,
        unit: {
          type: String,
          enum: ["hours", "days"],
        },
      },
      urgent: {
        value: Number,
        unit: {
          type: String,
          enum: ["hours", "days"],
        },
      },
    },

    meetingSchedule: {
      frequency: {
        type: String,
        enum: ["weekly", "bi-weekly", "monthly", "quarterly", "as-needed"],
      },
      description: {
        type: String,
        trim: true,
      },
    },

    reportingRequirements: {
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually", "as-needed"],
      },
      format: {
        type: String,
        trim: true,
      },
    },

    // ============================================
    // PERFORMANCE TRACKING
    // ============================================
    activityLog: [activityLogSchema],

    totalRequestsHandled: {
      type: Number,
      default: 0,
    },

    requests: [
      {
        requestDate: {
          type: Date,
          required: true,
        },
        requestType: {
          type: String,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        responseDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed", "on-hold"],
          default: "pending",
        },
        unitsConsumed: {
          type: Number,
          min: 0,
        },
      },
    ],

    // ============================================
    // COURT APPEARANCES (if applicable)
    // ============================================
    courtAppearances: [courtAppearanceSchema],

    // ============================================
    // NBA/STAMP COMPLIANCE
    // ============================================
    requiresNBAStamp: {
      type: Boolean,
      default: false,
    },
    nbaStampDetails: {
      stampNumber: String,
      stampDate: Date,
      stampValue: Number,
    },

    // ============================================
    // TERMINATION
    // ============================================
    terminationClause: {
      noticePeriod: {
        value: { type: Number, default: 30 },
        unit: {
          type: String,
          enum: ["days", "weeks", "months"],
          default: "days",
        },
      },
      conditions: {
        type: String,
        trim: true,
      },
    },

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
// GENERAL DETAIL MODEL (Non-Retainer Services)
// ============================================
const generalDetailSchema = new mongoose.Schema(
  {
    matterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
      required: true,
      unique: true,
      index: true,
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      index: true,
    },

    // ============================================
    // SERVICE TYPE
    // ============================================
    serviceType: {
      type: String,
      required: true,
      enum: [
        "notarial-services", // Attestations
        "cac-registration", // New company incorporation
        "perfection-of-title", // Land registry/Governor's consent
        "litigation", // Court cases
        "arbitration", // Arbitration proceedings
        "mediation", // Mediation services
        "legal-opinion", // Opinion writing
        "drafting", // Contract/agreement drafting
        "attestation", // Document attestation
        "certification", // Document certification
        "verification", // Document verification
        "regulatory-filing", // NAFDAC, CAC, etc.
        "other",
      ],
    },

    otherServiceType: {
      type: String,
      trim: true,
    },

    serviceDescription: {
      type: String,
      trim: true,
      required: true,
      maxlength: 5000,
    },

    // ============================================
    // BILLING (Nigerian Context)
    // ============================================
    billing: {
      billingType: {
        type: String,
        enum: ["fixed-fee", "lpro-scale", "percentage", "hybrid"],
        required: true,
      },

      // Fixed Fee
      fixedFee: {
        amount: Number,
        currency: { type: String, default: "NGN" },
      },

      // LPRO Scale
      lproScale: {
        scale: {
          type: String,
          enum: ["Scale 1", "Scale 2", "Scale 3", "Scale 4", "Scale 5"],
        },
        reference: String, // Item reference from LPRO
        calculatedAmount: Number,
      },

      // Percentage (e.g., % of property value)
      percentage: {
        rate: Number,
        baseAmount: Number,
        calculatedFee: Number,
      },

      // Tax
      vatRate: { type: Number, default: 7.5 },
      applyVAT: { type: Boolean, default: true },
      applyWHT: { type: Boolean, default: true },
      whtRate: { type: Number, enum: [5, 10], default: 5 },
    },

    // ============================================
    // PROJECT STAGES (Nigerian billing pattern)
    // ============================================
    projectStages: [
      {
        stageName: { type: String, trim: true },
        expectedDate: Date,
        actualDate: Date,
        percentageOfFee: Number,
        amount: Number,
        isPaid: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
      },
    ],

    // ============================================
    // PARTIES INVOLVED
    // ============================================
    partiesInvolved: [
      {
        name: { type: String, trim: true },
        role: { type: String, trim: true },
        contact: { type: String, trim: true },
      },
    ],

    // ============================================
    // DELIVERABLES
    // ============================================
    expectedDeliverables: [
      {
        deliverable: { type: String, trim: true },
        dueDate: Date,
        deliveryDate: Date,
        status: {
          type: String,
          enum: ["pending", "in-progress", "delivered", "approved"],
          default: "pending",
        },
      },
    ],

    // ============================================
    // DOCUMENT TRACKING (Critical for Land/CAC)
    // ============================================
    documentsReceived: [
      {
        docName: { type: String, trim: true },
        docType: {
          type: String,
          enum: ["original", "certified-copy", "photocopy"],
        },
        originalKeptByFirm: { type: Boolean, default: false },
        receivedDate: Date,
        returnDate: Date,
        receiptNumber: String,
      },
    ],

    // ============================================
    // DISBURSEMENTS
    // ============================================
    disbursements: [disbursementSchema],

    totalDisbursements: {
      type: Number,
      default: 0,
    },

    // ============================================
    // COURT DETAILS (if litigation)
    // ============================================
    courtAppearances: [courtAppearanceSchema],

    // ============================================
    // NBA/STAMP COMPLIANCE
    // ============================================
    requiresNBAStamp: { type: Boolean, default: false },
    nbaStampDetails: {
      stampNumber: String,
      stampDate: Date,
      stampValue: Number,
    },

    // ============================================
    // TIMELINE
    // ============================================
    requestDate: {
      type: Date,
      default: Date.now,
    },
    expectedCompletionDate: Date,
    actualCompletionDate: Date,

    // ============================================
    // NOTES
    // ============================================
    procedureNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    specificRequirements: [
      {
        requirement: { type: String, trim: true },
        status: {
          type: String,
          enum: ["pending", "met", "not-applicable"],
          default: "pending",
        },
      },
    ],

    // ============================================
    // JURISDICTION (Important for Nigerian matters)
    // ============================================
    jurisdiction: {
      state: String, // e.g., "Lagos", "Abuja"
      lga: String, // Local Government Area
      court: String, // If litigation
    },

    // ============================================
    // SOFT DELETE & AUDIT
    // ============================================
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
retainerDetailSchema.index({ matterId: 1 }, { unique: true });
retainerDetailSchema.index({ firmId: 1, retainerType: 1 });
retainerDetailSchema.index({ firmId: 1, agreementEndDate: 1 });
retainerDetailSchema.index({ firmId: 1, "billing.retainerFee": 1 });

generalDetailSchema.index({ matterId: 1 }, { unique: true });
generalDetailSchema.index({ firmId: 1, serviceType: 1 });
generalDetailSchema.index({ firmId: 1, expectedCompletionDate: 1 });
generalDetailSchema.index({ firmId: 1, "jurisdiction.state": 1 });

// ============================================
// MIDDLEWARE
// ============================================

// Auto-populate firmId from Matter
retainerDetailSchema.pre("save", async function (next) {
  if (this.isNew && this.matterId) {
    const Matter = mongoose.model("Matter");
    const matter = await Matter.findById(this.matterId).select("firmId");
    if (matter) {
      this.firmId = matter.firmId;
    }
  }

  // Calculate total disbursements
  if (this.isModified("disbursements")) {
    this.totalDisbursements = this.disbursements.reduce(
      (sum, d) => sum + (d.actualAmount || d.estimatedAmount || 0),
      0,
    );
  }

  // Update total requests count
  if (this.isModified("requests")) {
    this.totalRequestsHandled = this.requests.length;
  }

  next();
});

generalDetailSchema.pre("save", async function (next) {
  if (this.isNew && this.matterId) {
    const Matter = mongoose.model("Matter");
    const matter = await Matter.findById(this.matterId).select("firmId");
    if (matter) {
      this.firmId = matter.firmId;
    }
  }

  // Calculate total disbursements
  if (this.isModified("disbursements")) {
    this.totalDisbursements = this.disbursements.reduce(
      (sum, d) => sum + (d.actualAmount || d.estimatedAmount || 0),
      0,
    );
  }

  next();
});

// ============================================
// VIRTUALS
// ============================================

// Virtual for Matter relationship
retainerDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

generalDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

// Calculate Total with VAT and WHT
retainerDetailSchema.virtual("totalWithTax").get(function () {
  const fee = this.billing.retainerFee || 0;
  const vat = this.billing.applyVAT ? fee * (this.billing.vatRate / 100) : 0;
  const gross = fee + vat;
  const wht = this.billing.applyWHT ? fee * (this.billing.whtRate / 100) : 0;
  const net = gross - wht;

  return {
    baseFee: fee,
    vat: vat,
    gross: gross,
    wht: wht,
    net: net,
  };
});

generalDetailSchema.virtual("totalWithTax").get(function () {
  let baseFee = 0;

  if (this.billing.billingType === "fixed-fee") {
    baseFee = this.billing.fixedFee?.amount || 0;
  } else if (this.billing.billingType === "lpro-scale") {
    baseFee = this.billing.lproScale?.calculatedAmount || 0;
  } else if (this.billing.billingType === "percentage") {
    baseFee = this.billing.percentage?.calculatedFee || 0;
  }

  const vat = this.billing.applyVAT
    ? baseFee * (this.billing.vatRate / 100)
    : 0;
  const gross = baseFee + vat;
  const wht = this.billing.applyWHT
    ? baseFee * (this.billing.whtRate / 100)
    : 0;
  const net = gross - wht;

  return {
    baseFee: baseFee,
    vat: vat,
    gross: gross,
    wht: wht,
    net: net,
    disbursements: this.totalDisbursements || 0,
    grandTotal: net + (this.totalDisbursements || 0),
  };
});

// ============================================
// EXPORT MODELS
// ============================================

const RetainerDetail = mongoose.model("RetainerDetail", retainerDetailSchema);
const GeneralDetail = mongoose.model("GeneralDetail", generalDetailSchema);

module.exports = {
  RetainerDetail,
  GeneralDetail,
};
