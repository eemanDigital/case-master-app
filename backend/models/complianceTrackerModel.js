const mongoose = require("mongoose");

const PENALTY_RATES = {
  "business-name": 5000,
  "private-limited": 10000,
  "public-limited": 25000,
  llp: 10000,
  "incorporated-trustee": 5000,
  other: 5000,
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
      required: [true, "Client ID is required"],
    },
    cacMatterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CacMatter",
    },

    entityName: {
      type: String,
      required: [true, "Entity name is required"],
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
      required: [true, "Incorporation date is required"],
    },
    stateOfRegistration: String,

    annualReturns: [{
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
    }],

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

    penaltyTracking: {
      isPenaltyAccruing: {
        type: Boolean,
        default: false,
      },
      penaltyStartDate: Date,
      monthlyPenaltyRate: Number,
      currentPenaltyAmount: {
        type: Number,
        default: 0,
      },
      lastCalculatedAt: Date,
      totalPenaltyToPay: Number,
    },

    notificationsSent: [{
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
    }],

    nextFilingDueDate: Date,
    nextReminderDate: Date,

    isRevenueOpportunity: {
      type: Boolean,
      default: false,
    },
    revenueOpportunityNote: String,
    revenueOpportunityAmount: Number,

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
  }
);

complianceTrackerSchema.index({ firmId: 1, entityType: 1 });
complianceTrackerSchema.index({ firmId: 1, currentComplianceStatus: 1 });
complianceTrackerSchema.index({ firmId: 1, clientId: 1 });
complianceTrackerSchema.index({ firmId: 1, isRevenueOpportunity: 1 });
complianceTrackerSchema.index({ rcNumber: 1 });
complianceTrackerSchema.index({ "cacPortalStatus.portalStatus": 1 });
complianceTrackerSchema.index({ nextFilingDueDate: 1 });

complianceTrackerSchema.set("toJSON", { virtuals: true });
complianceTrackerSchema.set("toObject", { virtuals: true });

complianceTrackerSchema.statics.calculatePenalty = function (entityType, monthsLate) {
  const monthlyRate = PENALTY_RATES[entityType] || PENALTY_RATES.other;
  return monthlyRate * Math.max(0, monthsLate);
};

complianceTrackerSchema.statics.getPenaltyRate = function (entityType) {
  return PENALTY_RATES[entityType] || PENALTY_RATES.other;
};

complianceTrackerSchema.statics.getNextFilingDueDate = function (entityType, incorporationDate, lastFiledYear) {
  const incorporation = new Date(incorporationDate);
  const currentYear = new Date().getFullYear();

  if (entityType === "business-name") {
    return new Date(currentYear, ANNUAL_RETURN_DEADLINES["business-name"].month, ANNUAL_RETURN_DEADLINES["business-name"].day);
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

complianceTrackerSchema.statics.getNonCompliantEntities = async function (firmId) {
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
        "cacPortalStatus.portalStatus": { $in: ["INACTIVE", "STRUCK-OFF", "WOUND-UP"] },
      },
    ],
  })
    .populate("clientId", "firstName lastName email")
    .populate("assignedTo", "firstName lastName email")
    .sort({ "penaltyTracking.currentPenaltyAmount": -1 });
};

complianceTrackerSchema.methods.calculateCurrentPenalty = function () {
  if (!this.penaltyTracking.isPenaltyAccruing || !this.penaltyTracking.penaltyStartDate) {
    return 0;
  }

  const startDate = new Date(this.penaltyTracking.penaltyStartDate);
  const now = new Date();

  const monthsLate = Math.max(0,
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())
  );

  const monthlyRate = this.penaltyTracking.monthlyPenaltyRate ||
    PENALTY_RATES[this.entityType] ||
    PENALTY_RATES.other;

  return monthlyRate * monthsLate;
};

const ComplianceTracker = mongoose.model("ComplianceTracker", complianceTrackerSchema);

module.exports = ComplianceTracker;
