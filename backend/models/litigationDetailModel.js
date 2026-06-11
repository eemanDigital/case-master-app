const mongoose = require("mongoose");

// ============================================
// SUB-SCHEMAS
// ============================================

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

    hearingNoticeRequired: {
      type: Boolean,
      default: false,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [10000, "Notes must be less than 10000 characters"],
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
    hearingNoticeServed: {
      type: Boolean,
      default: false,
    },
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

const litigationStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Step title is required"],
      maxlength: [500, "Title must be less than 500 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must be less than 2000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    dueDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes must be less than 2000 characters"],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// ============================================
// LITIGATION DETAIL SCHEMA
// ============================================

const litigationDetailSchema = new mongoose.Schema(
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

    otherCourt: String,
    courtNo: String,
    courtLocation: String,
    state: {
      type: String,
      trim: true,
      required: [true, "State is required"],
    },
    division: String,
    judge: [judgeSchema],

    firstParty: {
      description: String,
      name: [nameSchema],
      processesFiled: [partyProcessSchema],
    },

    secondParty: {
      description: String,
      name: [nameSchema],
      processesFiled: [partyProcessSchema],
    },

    otherParty: [
      {
        description: String,
        name: [nameSchema],
        processesFiled: [partyProcessSchema],
      },
    ],

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

    otherModeOfCommencement: String,
    filingDate: {
      type: Date,
      required: [true, "Filing date is required"],
      default: Date.now,
    },
    serviceDate: Date,
    hearings: [hearingSchema],
    nextHearingDate: {
      type: Date,
      index: true,
    },
    lastHearingDate: Date,
    totalHearings: {
      type: Number,
      default: 0,
    },

    courtOrders: [courtOrderSchema],

    litigationSteps: [litigationStepSchema],

    judgment: {
      judgmentDate: Date,
      judgmentSummary: String,
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
      damages: Number,
      costs: Number,
    },

    appeal: {
      isAppealed: { type: Boolean, default: false },
      appealDate: Date,
      appealCourt: String,
      appealSuitNo: String,
      appealStatus: {
        type: String,
        enum: ["pending", "won", "lost", "withdrawn", "dismissed"],
      },
    },

    settlement: {
      isSettled: { type: Boolean, default: false },
      settlementDate: Date,
      settlementTerms: String,
      settlementAmount: Number,
    },

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

    isLandmark: { type: Boolean, default: false },
    citationReference: String,
    applicableLaws: [String],
    legalIssues: [String],
    precedents: [
      {
        caseName: String,
        citation: String,
        relevance: String,
      },
    ],

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
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


litigationDetailSchema.index({ firmId: 1, suitNo: 1 });
litigationDetailSchema.index({ firmId: 1, courtName: 1 });
litigationDetailSchema.index({ firmId: 1, nextHearingDate: 1 });
litigationDetailSchema.index({ firmId: 1, currentStage: 1 });
litigationDetailSchema.index({ firmId: 1, isDeleted: 1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

// Sync firmId from parent Matter
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

// Update hearing counters and dates
litigationDetailSchema.pre("save", function (next) {
  if (this.isModified("hearings")) {
    this.totalHearings = this.hearings.length;

    if (this.hearings.length > 0) {
      // Most recent hearing date
      const sortedHearings = [...this.hearings].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
      this.lastHearingDate = sortedHearings[0].date;

      // Earliest future nextHearingDate
      const now = new Date();
      const futureNextHearingDates = this.hearings
        .filter((h) => h.nextHearingDate && new Date(h.nextHearingDate) > now)
        .map((h) => new Date(h.nextHearingDate))
        .sort((a, b) => a - b);

      if (futureNextHearingDates.length > 0) {
        this.nextHearingDate = futureNextHearingDates[0];
      } else {
        // Fallback: any hearing.date in the future
        const futureHearingDates = this.hearings
          .filter((h) => new Date(h.date) > now)
          .map((h) => new Date(h.date))
          .sort((a, b) => a - b);
        this.nextHearingDate =
          futureHearingDates.length > 0 ? futureHearingDates[0] : null;
      }
    }
  }
  next();
});

// ============================================
// VIRTUALS
// ============================================

litigationDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

// ============================================
// MODEL EXPORT
// ============================================

const LitigationDetail = mongoose.model(
  "LitigationDetail",
  litigationDetailSchema,
);

module.exports = LitigationDetail;
