const mongoose = require("mongoose");

// Import sub-schemas (your existing schemas)
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

    otherCourt: {
      type: String,
      trim: true,
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
    },

    judge: [judgeSchema],

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
    },

    filingDate: {
      type: Date,
      required: [true, "Filing date is required"],
      default: Date.now,
    },

    serviceDate: {
      type: Date,
    },

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
    },

    citationReference: {
      type: String,
      trim: true,
    },

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

litigationDetailSchema.index({ matterId: 1 }, { unique: true });
litigationDetailSchema.index({ firmId: 1, suitNo: 1 });
litigationDetailSchema.index({ firmId: 1, courtName: 1 });
litigationDetailSchema.index({ firmId: 1, nextHearingDate: 1 });
litigationDetailSchema.index({ firmId: 1, currentStage: 1 });
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
// Update totalHearings count
litigationDetailSchema.pre("save", function (next) {
  if (this.isModified("hearings")) {
    this.totalHearings = this.hearings.length;

    if (this.hearings.length > 0) {
      // Sort hearings by date (most recent first)
      const sortedHearings = [...this.hearings].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
      this.lastHearingDate = sortedHearings[0].date;

      // 🔥 FIX: Find the NEXT FUTURE hearing date
      // Look for hearings that have a nextHearingDate in the future
      const nextHearingDates = this.hearings
        .filter(
          (h) => h.nextHearingDate && new Date(h.nextHearingDate) > new Date(),
        )
        .map((h) => new Date(h.nextHearingDate));

      if (nextHearingDates.length > 0) {
        // Get the earliest future nextHearingDate
        this.nextHearingDate = new Date(Math.min(...nextHearingDates));
      } else {
        // No future hearings, check if any hearing itself is in the future
        const futureHearingDates = this.hearings
          .filter((h) => new Date(h.date) > new Date())
          .map((h) => new Date(h.date));

        if (futureHearingDates.length > 0) {
          this.nextHearingDate = new Date(Math.min(...futureHearingDates));
        } else {
          this.nextHearingDate = null;
        }
      }
    }
  }
  next();
});

// ============================================
// 🔥 AUTO-SYNC HEARINGS TO CALENDAR
// ============================================

/**
 * PRE-SAVE: Detect if hearings changed
 * This sets a flag that we check in post-save
 */
litigationDetailSchema.pre("save", function (next) {
  if (this.isModified("hearings")) {
    this._hearingsChanged = true;
    console.log("🔵 PRE-SAVE: Hearings detected as modified");
  }
  next();
});

/**
 * POST-SAVE: Auto-sync hearings to calendar
 * This runs AFTER the document is saved to DB
 */
litigationDetailSchema.post("save", async function (doc) {
  console.log("🟢 POST-SAVE MIDDLEWARE TRIGGERED!");

  // Check if hearings actually changed
  if (!this._hearingsChanged) {
    console.log("⚠️ Hearings not modified, skipping sync");
    return;
  }

  console.log("🟢 Hearings were modified, starting sync...");

  try {
    // Use mongoose.model to avoid circular dependency
    const CalendarEvent = mongoose.model("CalendarEvent");
    const Matter = mongoose.model("Matter");

    console.log("📦 Models loaded successfully");

    // Get the parent matter with populated fields
    const matter = await Matter.findById(doc.matterId)
      .populate("accountOfficer")
      .populate("assignedLawyers");

    if (!matter) {
      console.log("⚠️ Matter not found for litigation:", doc._id);
      return;
    }

    console.log(`📋 Found matter: ${matter.matterNumber}`);
    console.log(`👥 Account Officers: ${matter.accountOfficer?.length || 0}`);
    console.log(`👥 Assigned Lawyers: ${matter.assignedLawyers?.length || 0}`);
    console.log(`📝 Total hearings to sync: ${doc.hearings.length}`);

    // Sync all hearings in parallel for better performance
    await Promise.all(
      doc.hearings.map((hearing) =>
        syncSingleHearing(doc, hearing, matter, { CalendarEvent }),
      ),
    );

    console.log(
      `✅ Auto-synced ${doc.hearings.length} hearings to calendar for matter ${matter.matterNumber}`,
    );
  } catch (error) {
    console.error("❌ Error in auto-sync middleware:", error);
  }
});

/**
 * CORRECTED syncSingleHearing function
 * Uses NEXT HEARING DATE as the calendar event date (not the past hearing date)
 * Only shows upcoming hearings on the calendar
 */

async function syncSingleHearing(litigationDetail, hearing, matter, models) {
  const { CalendarEvent } = models;

  // Define constants
  const EVENT_TYPES = { HEARING: "hearing", MENTION: "mention" };
  const EVENT_STATUS = { SCHEDULED: "scheduled", COMPLETED: "completed" };
  const PRIORITY_LEVELS = { HIGH: "high" };

  try {
    console.log(`  🔄 Syncing hearing: ${hearing._id}`);

    // ========================================
    // DETERMINE WHICH DATE TO USE
    // ========================================

    // If hearing has a NEXT hearing date, use that for the calendar
    // Otherwise, use the current hearing date
    const useNextHearingDate =
      hearing.nextHearingDate && new Date(hearing.nextHearingDate) > new Date();

    const calendarDate = useNextHearingDate
      ? new Date(hearing.nextHearingDate)
      : new Date(hearing.date);

    const startDateTime = calendarDate;
    const endDateTime = new Date(calendarDate);
    endDateTime.setHours(endDateTime.getHours() + 2);

    // Determine if this hearing is completed (has outcome and no future next date)
    const isCompleted = hearing.outcome && !useNextHearingDate;
    const eventStatus = isCompleted
      ? EVENT_STATUS.COMPLETED
      : EVENT_STATUS.SCHEDULED;

    // Build title based on whether we're using next hearing date
    const eventTitle = useNextHearingDate
      ? `Court Hearing (Next): ${matter.title || litigationDetail.suitNo}`
      : `Court Hearing: ${matter.title || litigationDetail.suitNo}`;

    // Build description
    let description = `Court hearing for ${matter.matterNumber}\n`;
    description += `Court: ${litigationDetail.courtName}`;
    if (litigationDetail.courtLocation) {
      description += ` - ${litigationDetail.courtLocation}`;
    }
    description += `\nSuit No: ${litigationDetail.suitNo}`;

    if (hearing.purpose) {
      description += `\nPurpose: ${hearing.purpose}`;
    }

    if (useNextHearingDate) {
      description += `\n\n📅 Next Hearing Date: ${calendarDate.toLocaleDateString()}`;
      if (hearing.outcome) {
        description += `\nPrevious Outcome (${new Date(hearing.date).toLocaleDateString()}): ${hearing.outcome}`;
      }
    } else if (hearing.outcome) {
      description += `\nOutcome: ${hearing.outcome}`;
    }

    const eventType = hearing.purpose?.toLowerCase().includes("mention")
      ? EVENT_TYPES.MENTION
      : EVENT_TYPES.HEARING;

    // Build participants
    const participants = [];

    if (matter.accountOfficer && matter.accountOfficer.length > 0) {
      matter.accountOfficer.forEach((officer) => {
        participants.push({
          user: officer._id || officer,
          role: "organizer",
          responseStatus: "accepted",
        });
      });
    }

    if (matter.assignedLawyers && matter.assignedLawyers.length > 0) {
      matter.assignedLawyers.forEach((lawyer) => {
        const lawyerId = lawyer._id || lawyer;
        if (
          !participants.some((p) => p.user.toString() === lawyerId.toString())
        ) {
          participants.push({
            user: lawyerId,
            role: "attendee",
            responseStatus: "pending",
          });
        }
      });
    }

    if (hearing.lawyerPresent && hearing.lawyerPresent.length > 0) {
      hearing.lawyerPresent.forEach((lawyer) => {
        if (
          !participants.some((p) => p.user.toString() === lawyer.toString())
        ) {
          participants.push({
            user: lawyer,
            role: "attendee",
            responseStatus: "accepted",
          });
        }
      });
    }

    // Build tags
    const tags = ["court-hearing", "auto-synced", litigationDetail.courtName];
    if (useNextHearingDate) {
      tags.push("next-hearing");
    }
    if (isCompleted) {
      tags.push("completed");
    }

    // Choose color based on status
    const color = useNextHearingDate
      ? "#fa8c16" // Orange for next hearing
      : isCompleted
        ? "#52c41a" // Green for completed
        : "#722ed1"; // Purple for scheduled

    // Build event data
    const eventData = {
      firmId: litigationDetail.firmId,
      eventType,
      status: eventStatus,
      priority: PRIORITY_LEVELS.HIGH,
      matter: matter._id,
      matterType: matter.matterType,
      title: eventTitle,
      description,
      startDateTime,
      endDateTime,
      isAllDay: false,
      timezone: "Africa/Lagos",
      location: {
        type: "court",
        courtName: litigationDetail.courtName,
        courtRoom: litigationDetail.courtNo,
        address: litigationDetail.courtLocation
          ? `${litigationDetail.courtLocation}, ${litigationDetail.state}`
          : litigationDetail.state,
      },
      organizer: matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
      participants,
      visibility: "team",
      hearingMetadata: {
        hearingId: hearing._id,
        judge: litigationDetail.judge?.[0]?.name,
        courtRoom: litigationDetail.courtNo,
        suitNumber: litigationDetail.suitNo,
        hearingType: eventType === EVENT_TYPES.MENTION ? "mention" : "trial",
        outcome: hearing.outcome,
        isNextHearing: useNextHearingDate,
        originalHearingDate: hearing.date,
        nextHearingDate: hearing.nextHearingDate,
      },
      reminders: [
        { reminderTime: 1440, reminderType: "email", isSent: false },
        { reminderTime: 60, reminderType: "in_app", isSent: false },
        { reminderTime: 30, reminderType: "push", isSent: false },
      ],
      tags,
      color,
      notes: hearing.notes,
      createdBy: matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
      customFields: {
        hearingId: hearing._id.toString(),
        litigationDetailId: litigationDetail._id.toString(),
        isUsingNextHearingDate: useNextHearingDate,
        originalHearingDate: hearing.date.toISOString(),
      },
    };

    // Find existing event for this hearing
    const existingEvent = await CalendarEvent.findOne({
      firmId: litigationDetail.firmId,
      "customFields.hearingId": hearing._id.toString(),
      isDeleted: false,
    });

    if (existingEvent) {
      // Update existing event
      Object.assign(existingEvent, eventData);
      existingEvent.lastModifiedBy =
        matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0];
      await existingEvent.save();

      console.log(`  ✅ Updated calendar event: ${existingEvent.eventId}`);
      console.log(
        `     📅 Calendar date: ${calendarDate.toLocaleDateString()}`,
      );
      console.log(
        `     ${useNextHearingDate ? "🔸 Using NEXT hearing date" : "🔹 Using current hearing date"}`,
      );
    } else {
      // Create new event
      const newEvent = await CalendarEvent.create(eventData);

      console.log(`  ✅ Created calendar event: ${newEvent.eventId}`);
      console.log(
        `     📅 Calendar date: ${calendarDate.toLocaleDateString()}`,
      );
      console.log(
        `     ${useNextHearingDate ? "🔸 Using NEXT hearing date" : "🔹 Using current hearing date"}`,
      );
    }
  } catch (error) {
    console.error(`  ❌ Error syncing hearing ${hearing._id}:`, error.message);
  }
}

// Export for use in the model
module.exports = { syncSingleHearing };

// ============================================
// VIRTUALS
// ============================================

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
