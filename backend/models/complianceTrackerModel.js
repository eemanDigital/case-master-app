const mongoose = require("mongoose");

const PENALTY_RATES_DAILY = {
  "business-name": 5000,
  "private-limited": 10000,
  "public-limited": 25000,
  llp: 10000,
  "incorporated-trustee": 5000,
  other: 5000,
};

const PENALTY_RATES_MONTHLY = {
  "business-name": 150000,
  "private-limited": 300000,
  "public-limited": 750000,
  llp: 300000,
  "incorporated-trustee": 150000,
  other: 150000,
};

const PENALTY_RATES_YEARLY = {
  "business-name": 1800000,
  "private-limited": 3600000,
  "public-limited": 9000000,
  llp: 3600000,
  "incorporated-trustee": 1800000,
  other: 1800000,
};

const ANNUAL_RETURN_DEADLINES = {
  "business-name": { month: 5, day: 30 },
  "private-limited": null,
  "public-limited": null,
  llp: null,
  "incorporated-trustee": null,
  other: null,
};

const complianceTrackerSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    trackingType: {
      type: String,
      enum: ["compliance", "watchdog", "both"],
      default: "both",
    },
    cacMatterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CacMatter",
    },

    entityName: {
      type: String,
      // required: [true, "Entity name is required"],
      trim: true,
    },
    entityType: {
      type: String,
      enum: [
        "business-name",
        "private-limited",
        "public-limited",
        "llp",
        "incorporated-trustee",
        "other",
      ],
      required: [true, "Entity type is required"],
    },
    rcNumber: {
      type: String,
      required: [true, "RC/BN number is required"],
      trim: true,
      index: true,
    },
    bnNumber: String,
    incorporationDate: {
      type: Date,
    },
    stateOfRegistration: String,

    annualReturns: [
      {
        year: {
          type: Number,
          required: true,
        },
        dueDate: {
          type: Date,
          required: true,
        },
        filingDeadline: Date,
        status: {
          type: String,
          enum: ["pending", "filed", "overdue", "exempted"],
          default: "pending",
        },
        filedDate: Date,
        filedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        receiptNumber: String,
        filingFee: Number,
        latePenalty: Number,
        totalPaid: Number,
        notes: String,
      },
    ],

    currentComplianceStatus: {
      type: String,
      enum: ["compliant", "at-risk", "non-compliant", "unknown"],
      default: "unknown",
    },

    cacPortalStatus: {
      lastChecked: Date,
      portalStatus: String,
      previousPortalStatus: String,
      statusChangedAt: Date,
      requiresAttention: {
        type: Boolean,
        default: false,
      },
      watchdogNotes: String,
    },

    statusChangeDetails: {
      changeDate: Date,
      previousStatus: String,
      newStatus: String,
      reason: String,
    },

    actionItems: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        title: {
          type: String,
          required: true,
        },
        description: String,
        type: {
          type: String,
          enum: [
            "contact_client",
            "restore_status",
            "file_documents",
            "send_notice",
            "follow_up",
            "other",
          ],
          default: "follow_up",
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high", "urgent"],
          default: "medium",
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "cancelled"],
          default: "pending",
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        dueDate: Date,
        completedAt: Date,
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: Date,
      },
    ],

    clientOutreach: {
      outreachDate: Date,
      outreachMethod: {
        type: String,
        enum: ["email", "phone", "sms", "letter", "meeting", "visit", "none"],
        default: "none",
      },
      outreachNotes: String,
      clientAcknowledged: {
        type: Boolean,
        default: false,
      },
      clientResponse: String,
      responseDate: Date,
      followUpDate: Date,
      communicationTemplates: {
        emailDraft: String,
        letterDraft: String,
        smsDraft: String,
      },
      templatesSent: {
        email: { type: Boolean, default: false },
        letter: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      },
      templatesSentAt: {
        email: Date,
        letter: Date,
        sms: Date,
      },
    },

    linkedMatterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
    },

    penaltyTracking: {
      penaltyType: {
        type: String,
        enum: ["daily", "monthly", "yearly"],
        default: "monthly",
      },
      penaltyRate: {
        type: Number,
        default: 5000,
      },
      isPenaltyAccruing: {
        type: Boolean,
        default: false,
      },
      penaltyStartDate: Date,
      currentPenaltyAmount: {
        type: Number,
        default: 0,
      },
      lastCalculatedAt: Date,
      totalPenaltyToPay: Number,
      gracePeriodDays: {
        type: Number,
        default: 0,
      },
      hasGracePeriod: {
        type: Boolean,
        default: false,
      },
    },

    otherFees: {
      filingFee: {
        type: Number,
        default: 0,
      },
      processingFee: {
        type: Number,
        default: 0,
      },
      administrativeCharge: {
        type: Number,
        default: 0,
      },
      otherFeeDescription: {
        type: String,
        trim: true,
      },
      otherFeesTotal: {
        type: Number,
        default: 0,
      },
    },

    professionalFee: {
      amount: {
        type: Number,
        default: 0,
      },
      description: {
        type: String,
        trim: true,
      },
      isIncluded: {
        type: Boolean,
        default: false,
      },
    },

    notificationsSent: [
      {
        type: {
          type: String,
          enum: [
            "filing-reminder",
            "penalty-warning",
            "status-change",
            "inactive-alert",
            "revenue-opportunity",
          ],
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        sentTo: String,
        channel: {
          type: String,
          enum: ["email", "whatsapp"],
        },
        wasOpened: Boolean,
        messagePreview: String,
      },
    ],

    nextFilingDueDate: Date,
    nextReminderDate: Date,

    isRevenueOpportunity: {
      type: Boolean,
      default: false,
    },
    revenueOpportunityNote: String,
    revenueOpportunityAmount: Number,

    revenueOpportunityDetails: {
      serviceType: {
        type: String,
        enum: [
          "status_restoration",
          "annual_return_filing",
          "compliance_filing",
          "name_change",
          "amendment",
          "other",
        ],
        default: "status_restoration",
      },
      estimatedFee: {
        type: Number,
        default: 0,
      },
      governmentFee: {
        type: Number,
        default: 0,
      },
      totalQuote: {
        type: Number,
        default: 0,
      },
      quoteSentDate: Date,
      quoteExpiryDate: Date,
      quoteStatus: {
        type: String,
        enum: ["draft", "sent", "approved", "rejected", "expired", "none"],
        default: "none",
      },
      proposalDocument: String,
      leadScore: {
        type: String,
        enum: ["hot", "warm", "cold"],
        default: "warm",
      },
      expectedCloseDate: Date,
      wonDate: Date,
      lostDate: Date,
      lostReason: String,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    internalNotes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    createdBy: {
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

complianceTrackerSchema.index({ firmId: 1, entityType: 1 });
complianceTrackerSchema.index({ firmId: 1, currentComplianceStatus: 1 });
complianceTrackerSchema.index({ firmId: 1, clientId: 1 });
complianceTrackerSchema.index({ firmId: 1, isRevenueOpportunity: 1 });

complianceTrackerSchema.index({ "cacPortalStatus.portalStatus": 1 });
complianceTrackerSchema.index({ nextFilingDueDate: 1 });

complianceTrackerSchema.set("toJSON", { virtuals: true });
complianceTrackerSchema.set("toObject", { virtuals: true });

complianceTrackerSchema.statics.getPenaltyRates = function (entityType) {
  return {
    daily: PENALTY_RATES_DAILY[entityType] || PENALTY_RATES_DAILY.other,
    monthly: PENALTY_RATES_MONTHLY[entityType] || PENALTY_RATES_MONTHLY.other,
    yearly: PENALTY_RATES_YEARLY[entityType] || PENALTY_RATES_YEARLY.other,
  };
};

complianceTrackerSchema.statics.getPenaltyRate = function (
  entityType,
  penaltyType = "monthly",
) {
  switch (penaltyType) {
    case "daily":
      return PENALTY_RATES_DAILY[entityType] || PENALTY_RATES_DAILY.other;
    case "yearly":
      return PENALTY_RATES_YEARLY[entityType] || PENALTY_RATES_YEARLY.other;
    default:
      return PENALTY_RATES_MONTHLY[entityType] || PENALTY_RATES_MONTHLY.other;
  }
};

complianceTrackerSchema.statics.getNextFilingDueDate = function (
  entityType,
  incorporationDate,
  lastFiledYear,
) {
  const incorporation = new Date(incorporationDate);
  const currentYear = new Date().getFullYear();

  if (entityType === "business-name") {
    return new Date(
      currentYear,
      ANNUAL_RETURN_DEADLINES["business-name"].month,
      ANNUAL_RETURN_DEADLINES["business-name"].day,
    );
  }

  if (["private-limited", "public-limited", "llp"].includes(entityType)) {
    const lastFiled = lastFiledYear || incorporation.getFullYear();
    const agmDueDate = new Date(lastFiled + 1, 6, 29);
    agmDueDate.setTime(agmDueDate.getTime() + 42 * 24 * 60 * 60 * 1000);
    return agmDueDate;
  }

  const year = lastFiledYear || incorporation.getFullYear();
  return new Date(year + 1, 5, 30);
};

complianceTrackerSchema.statics.getAtRiskEntities = async function (firmId) {
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  return this.find({
    firmId,
    isActive: true,
    isDeleted: { $ne: true },
    nextFilingDueDate: {
      $lte: sixtyDaysFromNow,
      $gt: new Date(),
    },
    currentComplianceStatus: { $ne: "non-compliant" },
  })
    .populate("clientId", "firstName lastName email")
    .populate("assignedTo", "firstName lastName email")
    .sort({ nextFilingDueDate: 1 });
};

complianceTrackerSchema.statics.getNonCompliantEntities = async function (
  firmId,
) {
  return this.find({
    firmId,
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
      {
        nextFilingDueDate: { $lt: new Date() },
        currentComplianceStatus: "non-compliant",
      },
      {
        "cacPortalStatus.portalStatus": {
          $in: ["INACTIVE", "STRUCK-OFF", "WOUND-UP"],
        },
      },
    ],
  })
    .populate("clientId", "firstName lastName email")
    .populate("assignedTo", "firstName lastName email")
    .sort({ "penaltyTracking.currentPenaltyAmount": -1 });
};

complianceTrackerSchema.methods.calculateCurrentPenalty = function () {
  const penaltyType = this.penaltyTracking?.penaltyType || "monthly";
  const rate = this.penaltyTracking?.penaltyRate || 0;

  if (
    !this.penaltyTracking?.isPenaltyAccruing ||
    !this.penaltyTracking?.penaltyStartDate
  ) {
    return {
      penaltyType,
      rate,
      periodsOverdue: 0,
      daysLate: 0,
      penaltyAmount: 0,
      breakdown: null,
    };
  }

  const startDate = new Date(this.penaltyTracking.penaltyStartDate);
  const now = new Date();
  const graceDays = this.penaltyTracking.gracePeriodDays || 0;

  const effectiveStartDate = new Date(startDate);
  effectiveStartDate.setDate(effectiveStartDate.getDate() + graceDays);

  if (now <= effectiveStartDate) {
    return {
      penaltyType,
      rate,
      periodsOverdue: 0,
      daysLate: 0,
      penaltyAmount: 0,
      breakdown: null,
      withinGracePeriod: true,
      graceEndsDate: effectiveStartDate,
    };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLate = Math.floor((now - effectiveStartDate) / msPerDay);

  let periodsOverdue = 0;
  let penaltyAmount = 0;
  let breakdown = [];

  switch (penaltyType) {
    case "daily":
      periodsOverdue = daysLate;
      penaltyAmount = rate * daysLate;
      breakdown.push({
        period: "day",
        rate,
        periods: daysLate,
        amount: penaltyAmount,
      });
      break;
    case "yearly":
      periodsOverdue = Math.floor(daysLate / 365);
      penaltyAmount = rate * periodsOverdue;
      breakdown.push({
        period: "year",
        rate,
        periods: periodsOverdue,
        amount: penaltyAmount,
      });
      break;
    case "monthly":
    default:
      const monthsLate = daysLate / 30;
      periodsOverdue = Math.floor(monthsLate);
      penaltyAmount = rate * periodsOverdue;
      breakdown.push({
        period: "month",
        rate,
        periods: periodsOverdue,
        amount: penaltyAmount,
      });
      break;
  }

  return {
    penaltyType,
    rate,
    periodsOverdue,
    daysLate,
    penaltyAmount: Math.round(penaltyAmount * 100) / 100,
    breakdown,
    withinGracePeriod: false,
  };
};

complianceTrackerSchema.methods.calculateTotalFees = function () {
  const penaltyCalc = this.calculateCurrentPenalty();
  const filingFee = this.otherFees?.filingFee || 0;
  const processingFee = this.otherFees?.processingFee || 0;
  const adminCharge = this.otherFees?.administrativeCharge || 0;
  const otherFeesTotal = this.otherFees?.otherFeesTotal || 0;
  const professionalFee = this.professionalFee?.amount || 0;

  const totalPenaltyAndFees =
    penaltyCalc.penaltyAmount +
    filingFee +
    processingFee +
    adminCharge +
    otherFeesTotal;
  const grandTotal =
    totalPenaltyAndFees +
    (this.professionalFee?.isIncluded ? 0 : professionalFee);

  return {
    penaltyAmount: penaltyCalc.penaltyAmount,
    penaltyBreakdown: penaltyCalc.breakdown,
    filingFee,
    processingFee,
    administrativeCharge: adminCharge,
    otherFeesTotal,
    otherFeesDescription: this.otherFees?.otherFeeDescription,
    professionalFee,
    professionalFeeIncluded: this.professionalFee?.isIncluded || false,
    professionalFeeDescription: this.professionalFee?.description,
    subtotal: totalPenaltyAndFees,
    totalToClient: grandTotal,
  };
};

const ComplianceTracker = mongoose.model(
  "ComplianceTracker",
  complianceTrackerSchema,
);

module.exports = ComplianceTracker;
