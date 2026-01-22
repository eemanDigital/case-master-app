const mongoose = require("mongoose");
const { EVENT_TYPES } = require("./CalendarEvent.model");

// ============================================
// BLOCKED DATES/TIME SLOTS SCHEMA
// For principals and super users to block scheduling on certain dates
// ============================================

const blockedDateSchema = new mongoose.Schema(
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

    // ============================================
    // BLOCKED TIME SLOT
    // ============================================
    blockType: {
      type: String,
      required: true,
      enum: {
        values: ["full_day", "time_slot", "date_range"],
        message: "Invalid block type",
      },
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          return value >= this.startDate;
        },
        message: "End date must be on or after start date",
      },
    },

    // For time_slot blocks
    startTime: {
      type: String, // Format: "HH:mm" e.g., "09:00"
    },

    endTime: {
      type: String, // Format: "HH:mm" e.g., "17:00"
    },

    // ============================================
    // WHO IS BLOCKED / SCOPE
    // ============================================
    blockScope: {
      type: String,
      required: true,
      enum: {
        values: ["firm_wide", "specific_users", "specific_event_types"],
        message: "Invalid block scope",
      },
    },

    // If blockScope = "specific_users" - only these users are blocked
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // If blockScope = "specific_event_types" - only these event types blocked
    blockedEventTypes: [
      {
        type: String,
        enum: Object.values(EVENT_TYPES),
      },
    ],

    // ============================================
    // REASON & DETAILS
    // ============================================
    title: {
      type: String,
      required: [true, "Block title is required"],
      trim: true,
      maxlength: [200, "Title must be less than 200 characters"],
    },

    reason: {
      type: String,
      required: [true, "Block reason is required"],
      trim: true,
      maxlength: [500, "Reason must be less than 500 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must be less than 2000 characters"],
    },

    // Predefined reason categories
    blockCategory: {
      type: String,
      enum: [
        "public_holiday",
        "court_vacation",
        "firm_closure",
        "principal_engagement",
        "senior_partner_engagement",
        "training_day",
        "team_building",
        "leave_period",
        "emergency",
        "maintenance",
        "religious_observance",
        "other",
      ],
    },

    // ============================================
    // OVERRIDE PERMISSIONS
    // ============================================
    allowOverride: {
      type: Boolean,
      default: false,
      // If true, users with permission can still schedule
    },

    overrideRoles: [
      {
        type: String,
        enum: ["admin", "partner", "principal", "super_admin"],
        // Roles that can override this block
      },
    ],

    // ============================================
    // EXCEPTIONS (specific users exempt from block)
    // ============================================
    exceptions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        grantedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        grantedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ============================================
    // ENFORCEMENT LEVEL
    // ============================================
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    enforceStrict: {
      type: Boolean,
      default: true,
      // If true: Hard block - prevent scheduling completely
      // If false: Soft block - warn user but allow with confirmation
    },

    warningMessage: {
      type: String,
      trim: true,
      // Custom message shown when soft block is encountered
    },

    // ============================================
    // RECURRENCE (for recurring blocks like weekly court vacations)
    // ============================================
    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurrencePattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      daysOfWeek: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      ],
      monthlyPattern: {
        type: String,
        enum: ["date", "day"], // "15th of month" vs "second Tuesday"
      },
      endRecurrence: Date,
    },

    // ============================================
    // NOTIFICATIONS
    // ============================================
    notifyAffectedUsers: {
      type: Boolean,
      default: true,
    },

    notificationSent: {
      type: Boolean,
      default: false,
    },

    notificationSentAt: Date,

    // ============================================
    // AUDIT TRAIL
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
      maxlength: [1000, "Notes must be less than 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

// Primary queries
blockedDateSchema.index({ firmId: 1, startDate: 1, endDate: 1 });
blockedDateSchema.index({ firmId: 1, isActive: 1, isDeleted: 1 });
blockedDateSchema.index({ firmId: 1, blockScope: 1, startDate: 1 });
blockedDateSchema.index({ firmId: 1, blockedUsers: 1, startDate: 1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Check if a specific date/time is blocked for a user
 * @param {ObjectId} firmId - Firm ID
 * @param {ObjectId} userId - User attempting to schedule
 * @param {Date} startDateTime - Event start time
 * @param {Date} endDateTime - Event end time
 * @param {String} eventType - Type of event being scheduled
 * @param {String} userRole - User's role (for override check)
 * @returns {Object} { isBlocked, block, canOverride, message }
 */
blockedDateSchema.statics.isDateBlocked = async function (
  firmId,
  userId,
  startDateTime,
  endDateTime,
  eventType = null,
  userRole = null,
) {
  const blocks = await this.find({
    firmId,
    isActive: true,
    isDeleted: false,
    startDate: { $lte: endDateTime },
    endDate: { $gte: startDateTime },
  }).sort({ enforceStrict: -1 }); // Check strict blocks first

  for (const block of blocks) {
    // Check if this block applies to this user/event
    let isApplicable = false;

    if (block.blockScope === "firm_wide") {
      isApplicable = true;
    } else if (block.blockScope === "specific_users") {
      isApplicable = block.blockedUsers.some(
        (u) => u.toString() === userId.toString(),
      );
    } else if (block.blockScope === "specific_event_types" && eventType) {
      isApplicable = block.blockedEventTypes.includes(eventType);
    }

    if (!isApplicable) continue;

    // Check if user has exception
    const hasException = block.exceptions.some(
      (e) => e.user.toString() === userId.toString(),
    );
    if (hasException) continue;

    // Check if user role can override
    if (
      block.allowOverride &&
      userRole &&
      block.overrideRoles.includes(userRole)
    ) {
      return {
        isBlocked: false,
        hasWarning: true,
        block,
        message: `This date is blocked: ${block.reason}. You can override this block.`,
      };
    }

    // Check time slot if applicable
    if (block.blockType === "time_slot" && block.startTime && block.endTime) {
      const eventStart = new Date(startDateTime);
      const eventEnd = new Date(endDateTime);

      const [blockStartHour, blockStartMin] = block.startTime
        .split(":")
        .map(Number);
      const [blockEndHour, blockEndMin] = block.endTime.split(":").map(Number);

      const blockStart = new Date(startDateTime);
      blockStart.setHours(blockStartHour, blockStartMin, 0, 0);

      const blockEnd = new Date(endDateTime);
      blockEnd.setHours(blockEndHour, blockEndMin, 0, 0);

      // Check if time overlaps
      if (eventStart < blockEnd && eventEnd > blockStart) {
        return {
          isBlocked: block.enforceStrict,
          hasWarning: !block.enforceStrict,
          block,
          message:
            block.warningMessage ||
            `Time slot ${block.startTime} - ${block.endTime} is blocked: ${block.reason}`,
        };
      }
    } else {
      // Full day or date range block
      return {
        isBlocked: block.enforceStrict,
        hasWarning: !block.enforceStrict,
        block,
        message:
          block.warningMessage || `This date is blocked: ${block.reason}`,
      };
    }
  }

  return { isBlocked: false, hasWarning: false };
};

/**
 * Get all blocked dates in a date range
 */
blockedDateSchema.statics.getBlockedDatesInRange = async function (
  firmId,
  startDate,
  endDate,
  userId = null,
) {
  const query = {
    firmId,
    isActive: true,
    isDeleted: false,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };

  const blocks = await this.find(query).sort({ startDate: 1 });

  // Filter blocks that apply to this user
  if (userId) {
    return blocks.filter((block) => {
      if (block.blockScope === "firm_wide") return true;
      if (block.blockScope === "specific_users") {
        return block.blockedUsers.some(
          (u) => u.toString() === userId.toString(),
        );
      }
      return false;
    });
  }

  return blocks;
};

// ============================================
// INSTANCE METHODS
// ============================================

// Grant exception to a user
blockedDateSchema.methods.grantException = async function (
  userId,
  grantedBy,
  reason,
) {
  this.exceptions.push({
    user: userId,
    reason,
    grantedBy,
    grantedAt: new Date(),
  });
  return await this.save();
};

// Revoke exception from a user
blockedDateSchema.methods.revokeException = async function (userId) {
  this.exceptions = this.exceptions.filter(
    (e) => e.user.toString() !== userId.toString(),
  );
  return await this.save();
};

// Soft delete
blockedDateSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedAt = Date.now();
  this.deletedBy = userId;
  this.isActive = false;
  return await this.save();
};

// Restore
blockedDateSchema.methods.restore = async function () {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.isActive = true;
  return await this.save();
};

// ============================================
// MIDDLEWARE
// ============================================

// Validate time format
blockedDateSchema.pre("save", function (next) {
  if (this.blockType === "time_slot") {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (this.startTime && !timeRegex.test(this.startTime)) {
      return next(new Error("Invalid start time format. Use HH:mm"));
    }
    if (this.endTime && !timeRegex.test(this.endTime)) {
      return next(new Error("Invalid end time format. Use HH:mm"));
    }
  }
  next();
});

// Filter soft-deleted blocks
blockedDateSchema.pre(/^find/, function (next) {
  if (!this.getQuery().isDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

const BlockedDate = mongoose.model("BlockedDate", blockedDateSchema);

module.exports = BlockedDate;
