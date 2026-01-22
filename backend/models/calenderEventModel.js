const mongoose = require("mongoose");

// ============================================
// ENUM DEFINITIONS
// ============================================

const EVENT_TYPES = {
  HEARING: "hearing",
  MENTION: "mention",
  ADJOURNMENT: "adjournment",
  FILING_DEADLINE: "filing_deadline",
  STATUTORY_DEADLINE: "statutory_deadline",
  CLIENT_MEETING: "client_meeting",
  INTERNAL_MEETING: "internal_meeting",
  TASK: "task",
  REMINDER: "reminder",
  COURT_ORDER_DEADLINE: "court_order_deadline",
};

const EVENT_STATUS = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
  ADJOURNED: "adjourned",
  NO_SHOW: "no_show",
};

const VISIBILITY_LEVELS = {
  PRIVATE: "private", // Only creator can see
  TEAM: "team", // Assigned lawyers/team members
  FIRM: "firm", // All firm members
};

const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// ============================================
// SUB-SCHEMAS
// ============================================

// Participant schema - who is attending/involved
const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["organizer", "attendee", "optional", "resource"],
      default: "attendee",
    },
    responseStatus: {
      type: String,
      enum: ["pending", "accepted", "declined", "tentative"],
      default: "pending",
    },
    respondedAt: Date,
  },
  { _id: false }
);

// Location schema - where the event takes place
const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["court", "office", "client_office", "online", "other"],
      default: "office",
    },
    courtName: String, // For court events
    courtRoom: String,
    address: String,
    virtualMeetingLink: String, // For online meetings
    notes: String,
  },
  { _id: false }
);

// Recurrence pattern schema
const recurrencePatternSchema = new mongoose.Schema(
  {
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    interval: {
      type: Number,
      default: 1,
      min: 1,
    },
    daysOfWeek: [
      {
        type: String,
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      },
    ],
    endDate: Date,
    occurrences: Number, // Number of times to repeat
  },
  { _id: false }
);

// ============================================
// MAIN CALENDAR EVENT SCHEMA
// ============================================

const calendarEventSchema = new mongoose.Schema(
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

    eventId: {
      type: String,
      unique: true,
      // Format: EVT-YYYY-NNNNNN (auto-generated)
    },

    // ============================================
    // EVENT TYPE & CLASSIFICATION
    // ============================================
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: Object.values(EVENT_TYPES),
        message: "Invalid event type",
      },
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(EVENT_STATUS),
        message: "Invalid event status",
      },
      default: EVENT_STATUS.SCHEDULED,
      index: true,
    },

    priority: {
      type: String,
      enum: {
        values: Object.values(PRIORITY_LEVELS),
        message: "Invalid priority level",
      },
      default: PRIORITY_LEVELS.MEDIUM,
    },

    // ============================================
    // MATTER ASSOCIATION (OPTIONAL)
    // ============================================
    matter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
      index: true,
      // Optional: Some events (like internal meetings) may not be case-related
    },

    matterType: {
      type: String,
      enum: ["litigation", "corporate", "advisory", "property", "retainer", "general"],
      // Denormalized for quick filtering
    },

    // ============================================
    // BASIC EVENT DETAILS
    // ============================================
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [500, "Title must be less than 500 characters"],
      index: "text",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description must be less than 5000 characters"],
    },

    // ============================================
    // DATE & TIME
    // ============================================
    startDateTime: {
      type: Date,
      required: [true, "Start date/time is required"],
      index: true,
    },

    endDateTime: {
      type: Date,
      required: [true, "End date/time is required"],
      validate: {
        validator: function (value) {
          return value > this.startDateTime;
        },
        message: "End date/time must be after start date/time",
      },
    },

    isAllDay: {
      type: Boolean,
      default: false,
    },

    timezone: {
      type: String,
      default: "Africa/Lagos", // Nigerian timezone
    },

    // ============================================
    // LOCATION
    // ============================================
    location: locationSchema,

    // ============================================
    // PARTICIPANTS & VISIBILITY
    // ============================================
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    participants: [participantSchema],

    visibility: {
      type: String,
      enum: {
        values: Object.values(VISIBILITY_LEVELS),
        message: "Invalid visibility level",
      },
      default: VISIBILITY_LEVELS.TEAM,
      index: true,
    },

    // ============================================
    // TYPE-SPECIFIC METADATA
    // ============================================
    // For hearings
    hearingMetadata: {
      judge: String,
      courtRoom: String,
      suitNumber: String,
      hearingType: {
        type: String,
        enum: ["mention", "trial", "ruling", "judgment", "preliminary", "appeal"],
      },
      previousHearingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CalendarEvent",
      },
      isAdjourned: {
        type: Boolean,
        default: false,
      },
      adjournmentReason: String,
    },

    // For deadlines
    deadlineMetadata: {
      deadlineType: {
        type: String,
        enum: ["filing", "statutory", "court_order", "internal", "client"],
      },
      isStatutory: {
        type: Boolean,
        default: false,
      },
      penaltyForMissing: String,
      relatedDocuments: [String],
      completionStatus: {
        type: String,
        enum: ["pending", "in_progress", "completed", "missed"],
        default: "pending",
      },
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // For meetings
    meetingMetadata: {
      meetingType: {
        type: String,
        enum: ["consultation", "strategy", "deposition", "negotiation", "internal"],
      },
      agenda: String,
      minutes: String,
      actionItems: [
        {
          description: String,
          assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          dueDate: Date,
          status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
          },
        },
      ],
    },

    // ============================================
    // RECURRENCE
    // ============================================
    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurrencePattern: recurrencePatternSchema,

    parentEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalendarEvent",
      // For recurring events, links to the master event
    },

    recurrenceExceptions: [
      {
        type: Date,
        // Dates when this recurring event should NOT occur
      },
    ],

    // ============================================
    // REMINDERS & NOTIFICATIONS
    // ============================================
    reminders: [
      {
        reminderTime: {
          type: Number,
          // Minutes before event (e.g., 60 = 1 hour before)
          required: true,
        },
        reminderType: {
          type: String,
          enum: ["email", "sms", "in_app", "push"],
          default: "in_app",
        },
        isSent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
      },
    ],

    notifyParticipants: {
      type: Boolean,
      default: true,
    },

    // ============================================
    // CONFLICT & VALIDATION
    // ============================================
    allowConflicts: {
      type: Boolean,
      default: false,
      // If false, system will check for double-bookings
    },

    conflictsWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CalendarEvent",
        // Events that overlap with this one
      },
    ],

    // ============================================
    // ATTACHMENTS & LINKS
    // ============================================
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    relatedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CalendarEvent",
      },
    ],

    // ============================================
    // TAGS & CATEGORIZATION
    // ============================================
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    color: {
      type: String,
      // Hex color code for calendar display
      default: "#1976d2",
    },

    // ============================================
    // AUDIT & TRACKING
    // ============================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledAt: Date,

    cancellationReason: String,

    // ============================================
    // SOFT DELETE
    // ============================================
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ============================================
    // METADATA
    // ============================================
    notes: {
      type: String,
      trim: true,
      maxlength: [10000, "Notes must be less than 10000 characters"],
    },

    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      // Allow firms to add custom metadata
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

// Multi-tenant uniqueness
calendarEventSchema.index({ firmId: 1, eventId: 1 }, { unique: true });

// Primary calendar queries
calendarEventSchema.index({ firmId: 1, startDateTime: 1, endDateTime: 1 });
calendarEventSchema.index({ firmId: 1, eventType: 1, status: 1 });
calendarEventSchema.index({ firmId: 1, organizer: 1, startDateTime: -1 });

// Matter-based queries
calendarEventSchema.index({ firmId: 1, matter: 1, startDateTime: 1 });

// Participant queries
calendarEventSchema.index({ firmId: 1, "participants.user": 1, startDateTime: 1 });

// Deadline tracking
calendarEventSchema.index({
  firmId: 1,
  eventType: 1,
  "deadlineMetadata.completionStatus": 1,
  startDateTime: 1,
});

// Soft delete optimization
calendarEventSchema.index({ firmId: 1, isDeleted: 1, startDateTime: 1 });

// Text search on title
calendarEventSchema.index({ title: "text", description: "text" });

// Recurring events
calendarEventSchema.index({ firmId: 1, parentEventId: 1 });

// ============================================
// VIRTUALS
// ============================================

// Duration in minutes
calendarEventSchema.virtual("durationMinutes").get(function () {
  if (this.startDateTime && this.endDateTime) {
    return Math.round((this.endDateTime - this.startDateTime) / (1000 * 60));
  }
  return 0;
});

// Is past event
calendarEventSchema.virtual("isPast").get(function () {
  return this.endDateTime < new Date();
});

// Is upcoming
calendarEventSchema.virtual("isUpcoming").get(function () {
  return this.startDateTime > new Date();
});

// Is today
calendarEventSchema.virtual("isToday").get(function () {
  const today = new Date();
  const eventDate = new Date(this.startDateTime);
  return (
    eventDate.getDate() === today.getDate() &&
    eventDate.getMonth() === today.getMonth() &&
    eventDate.getFullYear() === today.getFullYear()
  );
});

// ============================================
// MIDDLEWARE
// ============================================

// Auto-generate eventId before save
calendarEventSchema.pre("save", async function (next) {
  if (this.isNew && !this.eventId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      firmId: this.firmId,
      eventId: new RegExp(`^EVT-${year}-`),
    });
    this.eventId = `EVT-${year}-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Denormalize matterType from Matter
calendarEventSchema.pre("save", async function (next) {
  if (this.isModified("matter") && this.matter) {
    const Matter = mongoose.model("Matter");
    const matter = await Matter.findById(this.matter).select("matterType");
    if (matter) {
      this.matterType = matter.matterType;
    }
  }
  next();
});

// Validate end time is after start time
calendarEventSchema.pre("save", function (next) {
  if (this.endDateTime <= this.startDateTime) {
    next(new Error("End date/time must be after start date/time"));
  }
  next();
});

// Filter out soft-deleted events in queries
calendarEventSchema.pre(/^find/, function (next) {
  if (!this.getQuery().isDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

// Soft delete
calendarEventSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedAt = Date.now();
  this.deletedBy = userId;
  this.status = EVENT_STATUS.CANCELLED;
  return await this.save();
};

// Restore from soft delete
calendarEventSchema.methods.restore = async function () {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.status = EVENT_STATUS.SCHEDULED;
  return await this.save();
};

// Check if user is participant
calendarEventSchema.methods.isParticipant = function (userId) {
  return this.participants.some((p) => p.user.toString() === userId.toString());
};

// Check if user is organizer
calendarEventSchema.methods.isOrganizer = function (userId) {
  return this.organizer.toString() === userId.toString();
};

// Check if user can view this event
calendarEventSchema.methods.canView = function (userId, userFirmId) {
  // Must be same firm
  if (this.firmId.toString() !== userFirmId.toString()) {
    return false;
  }

  // Visibility rules
  if (this.visibility === VISIBILITY_LEVELS.FIRM) {
    return true;
  }

  if (this.visibility === VISIBILITY_LEVELS.TEAM) {
    return this.isOrganizer(userId) || this.isParticipant(userId);
  }

  if (this.visibility === VISIBILITY_LEVELS.PRIVATE) {
    return this.isOrganizer(userId);
  }

  return false;
};

// ============================================
// STATIC METHODS
// ============================================

// Find conflicts for a time slot
calendarEventSchema.statics.findConflicts = async function (
  firmId,
  participants,
  startDateTime,
  endDateTime,
  excludeEventId = null
) {
  const query = {
    firmId,
    isDeleted: false,
    status: { $in: [EVENT_STATUS.SCHEDULED, EVENT_STATUS.CONFIRMED] },
    "participants.user": { $in: participants },
    $or: [
      // Event starts during this slot
      {
        startDateTime: { $gte: startDateTime, $lt: endDateTime },
      },
      // Event ends during this slot
      {
        endDateTime: { $gt: startDateTime, $lte: endDateTime },
      },
      // Event spans this entire slot
      {
        startDateTime: { $lte: startDateTime },
        endDateTime: { $gte: endDateTime },
      },
    ],
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  return await this.find(query);
};

// ============================================
// EXPORT
// ============================================

const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);

module.exports = {
  CalendarEvent,
  EVENT_TYPES,
  EVENT_STATUS,
  VISIBILITY_LEVELS,
  PRIORITY_LEVELS,
};