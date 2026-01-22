const mongoose = require("mongoose");

// Sub-schemas for litigation-specific data
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

const judgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Judge name is required"],
      minlength: [2, "Judge name must be at least 2 characters long"],
      maxlength: [100, "Judge name must be less than 100 characters long"],
    },
  },
  { _id: false },
);

const partyProcessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Process name is required"],
    },
    filingDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "filed", "served", "completed"],
      default: "pending",
    },
  },
  { _id: false },
);

const hearingSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    outcome: {
      type: String,
      trim: true,
    },
    nextHearingDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes must be less than 2000 characters"],
    },
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lawyerPresent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

const courtOrderSchema = new mongoose.Schema(
  {
    orderDate: {
      type: Date,
      required: true,
    },
    orderType: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must be less than 2000 characters"],
    },
    complianceStatus: {
      type: String,
      enum: ["pending", "complied", "partially-complied", "not-complied"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// LitigationDetail Schema
const litigationDetailSchema = new mongoose.Schema(
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

    // Dual firmId for safety and direct querying
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },

    // ============================================
    // COURT & CASE IDENTIFICATION
    // ============================================
    suitNo: {
      type: String,
      trim: true,
      required: [true, "Suit number is required"],
      minlength: [3, "Suit number must be at least 3 characters long"],
    },

    courtName: {
      type: String,
      trim: true,
      required: [true, "Court name is required"],
      enum: {
        values: [
          "supreme court",
          "court of appeal",
          "federal high court",
          "high court",
          "national industrial court",
          "sharia courts of appeal",
          "customary court of appeal",
          "magistrate court",
          "customary court",
          "sharia court",
          "area court",
          "coroner",
          "tribunal",
          "election tribunal",
          "code of conduct tribunal",
          "tax appeal tribunal",
          "rent tribunal",
          "others",
        ],
        message: "Invalid court name",
      },
    },

    otherCourt: {
      type: String,
      trim: true,
      // Used when courtName is "others"
    },

    courtNo: {
      type: String,
      trim: true,
    },

    courtLocation: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
      required: [true, "State is required"],
    },

    division: {
      type: String,
      trim: true,
      // E.g., "Lagos Division", "Abuja Division"
    },

    judge: [judgeSchema],

    // ============================================
    // PARTIES
    // ============================================
    firstParty: {
      description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description must be less than 1000 characters long"],
      },
      name: [nameSchema],
      processesFiled: [partyProcessSchema],
    },

    secondParty: {
      description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description must be less than 1000 characters long"],
      },
      name: [nameSchema],
      processesFiled: [partyProcessSchema],
    },

    otherParty: [
      {
        description: {
          type: String,
          trim: true,
          maxlength: [
            1000,
            "Description must be less than 1000 characters long",
          ],
        },
        name: [nameSchema],
        processesFiled: [partyProcessSchema],
      },
    ],

    // ============================================
    // CASE COMMENCEMENT
    // ============================================
    modeOfCommencement: {
      type: String,
      trim: true,
      required: [true, "Specify mode of commencement of the suit"],
      enum: {
        values: [
          "writ of summons",
          "originating summons",
          "originating motion",
          "petition",
          "information",
          "charge",
          "complaint",
          "indictment",
          "application",
          "notice of appeal",
          "notice of application",
          "other",
        ],
        message: "Invalid mode of commencement",
      },
    },

    otherModeOfCommencement: {
      type: String,
      trim: true,
      // Used when modeOfCommencement is "other"
    },

    filingDate: {
      type: Date,
      required: [true, "Filing date is required"],
      default: Date.now,
    },

    serviceDate: {
      type: Date,
      // Date when suit was served on defendant
    },

    // ============================================
    // HEARINGS & PROCEEDINGS
    // ============================================
    hearings: [hearingSchema],

    nextHearingDate: {
      type: Date,
      index: true,
    },

    lastHearingDate: {
      type: Date,
    },

    totalHearings: {
      type: Number,
      default: 0,
    },

    // ============================================
    // ORDERS & JUDGMENTS
    // ============================================
    courtOrders: [courtOrderSchema],

    judgment: {
      judgmentDate: {
        type: Date,
      },
      judgmentSummary: {
        type: String,
        trim: true,
        maxlength: [5000, "Judgment summary must be less than 5000 characters"],
      },
      outcome: {
        type: String,
        enum: [
          "won",
          "lost",
          "partially-won",
          "dismissed",
          "struck-out",
          "pending",
        ],
      },
      damages: {
        type: Number,
        min: 0,
      },
      costs: {
        type: Number,
        min: 0,
      },
    },

    // ============================================
    // APPEAL INFORMATION
    // ============================================
    appeal: {
      isAppealed: {
        type: Boolean,
        default: false,
      },
      appealDate: {
        type: Date,
      },
      appealCourt: {
        type: String,
        trim: true,
      },
      appealSuitNo: {
        type: String,
        trim: true,
      },
      appealStatus: {
        type: String,
        enum: ["pending", "won", "lost", "withdrawn", "dismissed"],
      },
    },

    // ============================================
    // SETTLEMENT
    // ============================================
    settlement: {
      isSettled: {
        type: Boolean,
        default: false,
      },
      settlementDate: {
        type: Date,
      },
      settlementTerms: {
        type: String,
        trim: true,
        maxlength: [5000, "Settlement terms must be less than 5000 characters"],
      },
      settlementAmount: {
        type: Number,
        min: 0,
      },
    },

    // ============================================
    // CASE TRACKING
    // ============================================
    currentStage: {
      type: String,
      enum: [
        "pre-trial",
        "trial",
        "judgment",
        "appeal",
        "execution",
        "settled",
        "closed",
      ],
      default: "pre-trial",
    },

    isLandmark: {
      type: Boolean,
      default: false,
      // Flag for significant/landmark cases
    },

    citationReference: {
      type: String,
      trim: true,
      // For reported cases: e.g., "(2024) LPELR-12345(CA)"
    },

    // ============================================
    // STATUTE & LEGAL BASIS
    // ============================================
    applicableLaws: [
      {
        type: String,
        trim: true,
      },
    ],

    legalIssues: [
      {
        type: String,
        trim: true,
      },
    ],

    precedents: [
      {
        caseName: String,
        citation: String,
        relevance: String,
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

// Ensure one litigation detail per matter
litigationDetailSchema.index({ matterId: 1 }, { unique: true });

// Multi-tenant queries
litigationDetailSchema.index({ firmId: 1, suitNo: 1 });
litigationDetailSchema.index({ firmId: 1, courtName: 1 });
litigationDetailSchema.index({ firmId: 1, nextHearingDate: 1 });
litigationDetailSchema.index({ firmId: 1, currentStage: 1 });

// Soft delete
litigationDetailSchema.index({ firmId: 1, isDeleted: 1 });

// ============================================
// MIDDLEWARE
// ============================================

// Sync firmId from parent Matter on save
litigationDetailSchema.pre("save", async function (next) {
  if (this.isNew && this.matterId) {
    const Matter = mongoose.model("Matter");
    const matter = await Matter.findById(this.matterId).select("firmId");
    if (matter) {
      this.firmId = matter.firmId;
    }
  }
  next();
});

// Update totalHearings count
litigationDetailSchema.pre("save", function (next) {
  if (this.isModified("hearings")) {
    this.totalHearings = this.hearings.length;

    // Update last hearing date
    if (this.hearings.length > 0) {
      const sortedHearings = this.hearings.sort((a, b) => b.date - a.date);
      this.lastHearingDate = sortedHearings[0].date;

      // Update next hearing date if available
      const futureHearings = this.hearings.filter(
        (h) => h.nextHearingDate > new Date(),
      );
      if (futureHearings.length > 0) {
        const sortedFuture = futureHearings.sort(
          (a, b) => a.nextHearingDate - b.nextHearingDate,
        );
        this.nextHearingDate = sortedFuture[0].nextHearingDate;
      }
    }
  }
  next();
});

// ============================================
// VIRTUALS
// ============================================

// Virtual to get parent matter
litigationDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

const LitigationDetail = mongoose.model(
  "LitigationDetail",
  litigationDetailSchema,
);

module.exports = LitigationDetail;
