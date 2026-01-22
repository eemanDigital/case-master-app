const mongoose = require("mongoose");

// Sub-schemas for corporate-specific data
const partyEntitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    entityType: {
      type: String,
      enum: ["company", "individual", "partnership", "trust", "government"],
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    jurisdiction: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
      // E.g., "Buyer", "Seller", "Shareholder", "Director"
    },
  },
  { _id: false },
);

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "overdue"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const shareholderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    numberOfShares: {
      type: Number,
      min: 0,
    },
    shareClass: {
      type: String,
      trim: true,
    },
    percentageOwnership: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
);

const directorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    position: {
      type: String,
      trim: true,
    },
    appointmentDate: {
      type: Date,
    },
  },
  { _id: false },
);

// CorporateDetail Schema
const corporateDetailSchema = new mongoose.Schema(
  {
    // ============================================
    // REFERENCE TO PARENT MATTER
    // ============================================
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
    // TRANSACTION TYPE & DETAILS
    // ============================================
    transactionType: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: {
        values: [
          "merger_acquisition",
          "company_incorporation",
          "joint_venture",
          "shareholder_agreement",
          "corporate_governance",
          "securities_offering",
          "private_equity",
          "venture_capital",
          "debt_financing",
          "restructuring",
          "insolvency",
          "corporate_compliance",
          "board_advisory",
          "share_purchase",
          "asset_purchase",
          "divestiture",
          "partnership_formation",
          "franchise_agreement",
          "distribution_agreement",
          "licensing",
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
    // PARTIES INVOLVED
    // ============================================
    parties: [partyEntitySchema],

    // ============================================
    // COMPANY INFORMATION
    // ============================================
    companyName: {
      type: String,
      trim: true,
      // Primary company involved
    },

    registrationNumber: {
      type: String,
      trim: true,
      // CAC registration number
    },

    companyType: {
      type: String,
      enum: [
        "private_limited",
        "public_limited",
        "unlimited",
        "partnership",
        "sole_proprietorship",
        "incorporated_trustees",
        "business_name",
        "foreign_company",
      ],
    },

    registrationDate: {
      type: Date,
    },

    incorporationJurisdiction: {
      type: String,
      trim: true,
      // Country/state of incorporation
    },

    shareholders: [shareholderSchema],

    directors: [directorSchema],

    authorizedShareCapital: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
    },

    paidUpCapital: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
    },

    // ============================================
    // TRANSACTION VALUE & FINANCIALS
    // ============================================
    dealValue: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
    },

    paymentStructure: {
      type: String,
      enum: ["lump_sum", "installments", "milestone_based", "other"],
    },

    paymentTerms: {
      type: String,
      trim: true,
      maxlength: [2000, "Payment terms must be less than 2000 characters"],
    },

    // ============================================
    // TIMELINE & MILESTONES
    // ============================================
    expectedClosingDate: {
      type: Date,
    },

    actualClosingDate: {
      type: Date,
    },

    milestones: [milestoneSchema],

    // ============================================
    // DUE DILIGENCE
    // ============================================
    dueDiligence: {
      isRequired: {
        type: Boolean,
        default: true,
      },
      startDate: {
        type: Date,
      },
      completionDate: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["not-started", "in-progress", "completed", "waived"],
        default: "not-started",
      },
      scope: {
        type: String,
        trim: true,
        maxlength: [
          2000,
          "Due diligence scope must be less than 2000 characters",
        ],
      },
      findings: {
        type: String,
        trim: true,
        maxlength: [5000, "Findings must be less than 5000 characters"],
      },
    },

    // ============================================
    // REGULATORY & COMPLIANCE
    // ============================================
    regulatoryApprovals: [
      {
        authority: {
          type: String,
          trim: true,
          // E.g., "SEC", "CAC", "FCCPC", "CBN"
        },
        approvalType: {
          type: String,
          trim: true,
        },
        applicationDate: {
          type: Date,
        },
        approvalDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "not-required"],
          default: "pending",
        },
        referenceNumber: {
          type: String,
          trim: true,
        },
      },
    ],

    complianceRequirements: [
      {
        requirement: {
          type: String,
          trim: true,
        },
        dueDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "met", "overdue", "waived"],
          default: "pending",
        },
      },
    ],

    // ============================================
    // AGREEMENTS & DOCUMENTS
    // ============================================
    keyAgreements: [
      {
        agreementType: {
          type: String,
          trim: true,
          // E.g., "Share Purchase Agreement", "Merger Agreement"
        },
        executionDate: {
          type: Date,
        },
        effectiveDate: {
          type: Date,
        },
        expiryDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["draft", "under-review", "executed", "terminated"],
          default: "draft",
        },
      },
    ],

    // ============================================
    // GOVERNANCE
    // ============================================
    governanceStructure: {
      boardSize: {
        type: Number,
        min: 0,
      },
      boardMeetingFrequency: {
        type: String,
        trim: true,
      },
      votingStructure: {
        type: String,
        trim: true,
      },
      specialRights: {
        type: String,
        trim: true,
        maxlength: [2000, "Special rights must be less than 2000 characters"],
      },
    },

    // ============================================
    // LEGAL OPINIONS
    // ============================================
    legalOpinions: [
      {
        opinionType: {
          type: String,
          trim: true,
          // E.g., "Tax Opinion", "Regulatory Opinion"
        },
        issuedDate: {
          type: Date,
        },
        summary: {
          type: String,
          trim: true,
          maxlength: [2000, "Summary must be less than 2000 characters"],
        },
      },
    ],

    // ============================================
    // POST-COMPLETION
    // ============================================
    postCompletionObligations: [
      {
        obligation: {
          type: String,
          trim: true,
        },
        dueDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "overdue"],
          default: "pending",
        },
      },
    ],

    // ============================================
    // RISKS & ISSUES
    // ============================================
    identifiedRisks: [
      {
        risk: {
          type: String,
          trim: true,
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
        mitigation: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: ["open", "mitigated", "accepted", "closed"],
          default: "open",
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

corporateDetailSchema.index({ matterId: 1 }, { unique: true });
corporateDetailSchema.index({ firmId: 1, transactionType: 1 });
corporateDetailSchema.index({ firmId: 1, companyName: 1 });
corporateDetailSchema.index({ firmId: 1, registrationNumber: 1 });
corporateDetailSchema.index({ firmId: 1, expectedClosingDate: 1 });

// ============================================
// MIDDLEWARE
// ============================================

corporateDetailSchema.pre("save", async function (next) {
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

corporateDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

const CorporateDetail = mongoose.model(
  "CorporateDetail",
  corporateDetailSchema,
);

module.exports = CorporateDetail;
