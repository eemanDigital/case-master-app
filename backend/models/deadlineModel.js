const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Deadline title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    deadlineNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    linkedEntityType: {
      type: String,
      enum: ["matter", "cac-matter", "client", "document", "custom"],
      default: "custom",
    },
    linkedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assignee is required"],
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    dueTime: {
      type: String,
    },
    timezone: {
      type: String,
      default: "Africa/Lagos",
    },

    category: {
      type: String,
      enum: [
        "court-date",
        "filing-deadline",
        "cac-renewal",
        "annual-returns",
        "client-meeting",
        "payment-due",
        "document-submission",
        "contract-expiry",
        "limitation-period",
        "custom",
      ],
      required: [true, "Category is required"],
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
    },

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "missed", "extended", "cancelled"],
      default: "pending",
    },

    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completionNotes: String,

    extensions: [{
      previousDueDate: Date,
      newDueDate: Date,
      reason: String,
      extendedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      extendedAt: {
        type: Date,
        default: Date.now,
      },
    }],

    escalation: {
      isEscalated: {
        type: Boolean,
        default: false,
      },
      escalatedAt: Date,
      escalationReason: String,
      sevenDayReminderSent: {
        type: Boolean,
        default: false,
      },
      sevenDayReminderSentAt: Date,
      oneDayReminderSent: {
        type: Boolean,
        default: false,
      },
      oneDayReminderSentAt: Date,
      supervisorAlertSent: {
        type: Boolean,
        default: false,
      },
      supervisorAlertSentAt: Date,
      overdueAlertSent: {
        type: Boolean,
        default: false,
      },
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly", "annually"],
      },
      interval: {
        type: Number,
        default: 1,
      },
      endDate: Date,
      nextOccurrence: Date,
      parentDeadlineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deadline",
      },
    },

    notificationLog: [{
      notificationType: {
        type: String,
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
      sentTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      channel: {
        type: String,
        enum: ["email", "sms", "whatsapp", "in-app"],
      },
      success: Boolean,
      errorMessage: String,
    }],

    performance: {
      wasOnTime: Boolean,
      daysEarly: Number,
      daysLate: Number,
    },

    tags: [String],
    automationFlags: {
      missedAlertSent: Boolean,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    updatedBy: {
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

deadlineSchema.index({ firmId: 1, status: 1 });
deadlineSchema.index({ firmId: 1, category: 1 });
deadlineSchema.index({ firmId: 1, assignedTo: 1 });
deadlineSchema.index({ firmId: 1, dueDate: 1 });
deadlineSchema.index({ firmId: 1, priority: 1 });
deadlineSchema.index({ linkedEntityType: 1, linkedEntityId: 1 });
deadlineSchema.index({ "escalation.sevenDayReminderSent": 1, dueDate: 1 });
deadlineSchema.index({ "escalation.oneDayReminderSent": 1, dueDate: 1 });
deadlineSchema.index({ "escalation.overdueAlertSent": 1, dueDate: 1 });

deadlineSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

deadlineSchema.virtual("isOverdue").get(function () {
  const now = new Date();
  const due = new Date(this.dueDate);
  return due < now && !["completed", "cancelled"].includes(this.status);
});

deadlineSchema.set("toJSON", { virtuals: true });
deadlineSchema.set("toObject", { virtuals: true });

deadlineSchema.statics.generateDeadlineNumber = async function (firmId) {
  const year = new Date().getFullYear();
  const prefix = `DL-${year}-`;

  const lastDeadline = await this.findOne({
    firmId,
    deadlineNumber: new RegExp(`^${prefix}`),
  })
    .sort({ deadlineNumber: -1 })
    .select("deadlineNumber");

  let lastNumber = 0;
  if (lastDeadline && lastDeadline.deadlineNumber) {
    const numStr = lastDeadline.deadlineNumber.replace(prefix, "");
    lastNumber = parseInt(numStr, 10) || 0;
  }

  const newNumber = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}${newNumber}`;
};

deadlineSchema.statics.getUpcomingDeadlines = async function (firmId, days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    firmId,
    dueDate: { $lte: futureDate, $gt: new Date() },
    status: { $in: ["pending", "in-progress"] },
    isDeleted: { $ne: true },
  })
    .populate("assignedTo", "firstName lastName email")
    .populate("supervisor", "firstName lastName email")
    .sort({ dueDate: 1 });
};

deadlineSchema.statics.getOverdueDeadlines = async function (firmId) {
  return this.find({
    firmId,
    dueDate: { $lt: new Date() },
    status: { $in: ["pending", "in-progress"] },
    isDeleted: { $ne: true },
  })
    .populate("assignedTo", "firstName lastName email")
    .populate("supervisor", "firstName lastName email")
    .sort({ dueDate: 1 });
};

deadlineSchema.statics.getAssignedDeadlines = async function (userId, firmId) {
  return this.find({
    firmId,
    assignedTo: userId,
    isDeleted: { $ne: true },
  })
    .populate("supervisor", "firstName lastName email")
    .sort({ dueDate: 1 });
};

const Deadline = mongoose.model("Deadline", deadlineSchema);

module.exports = Deadline;
