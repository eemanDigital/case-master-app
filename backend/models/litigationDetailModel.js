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

litigationDetailSchema.index({ matterId: 1 }, { unique: true });
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

// Flag for post-save sync - store the specific hearing ID that changed
litigationDetailSchema.pre("save", async function (next) {
  if (this.isModified("hearings")) {
    // Store original hearings for comparison (only for updates)
    if (!this.isNew) {
      try {
        const original = await this.constructor.findById(this._id).select("hearings");
        this._original = original?.toObject?.() || { hearings: original?.hearings || [] };
      } catch (err) {
        console.log("⚠️ Could not fetch original hearings:", err.message);
        this._original = { hearings: [] };
      }
    }

    // Get the previous hearings array (if updating)
    const previousHearings = this._original?.hearings || [];
    const currentHearings = this.hearings;

    // Find newly added hearings
    const currentIds = currentHearings.map(h => h._id?.toString()).filter(Boolean);
    const previousIds = previousHearings.map(h => h._id?.toString()).filter(Boolean);
    
    // New hearing added
    const addedIds = currentIds.filter(id => !previousIds.includes(id));
    
    // Check if any hearing was modified (not new, but existing)
    this._hearingChanges = {
      added: addedIds,
      hasChanges: true,
    };
    
    console.log("🔵 PRE-SAVE: Hearings modified", { added: addedIds.length });
  }
  next();
});

// ============================================
// POST-SAVE MIDDLEWARE - CALENDAR SYNC (OPTIMIZED)
// ============================================

litigationDetailSchema.post("save", async function (doc) {
  console.log("🟢 POST-SAVE: Triggered");

  if (!this._hearingChanges?.hasChanges) {
    console.log("⚠️ No hearing changes, skipping sync");
    return;
  }

  console.log("🟢 Syncing hearings to calendar...");

  try {
    const CalendarEvent = mongoose.model("CalendarEvent");
    const Matter = mongoose.model("Matter");

    const matter = await Matter.findById(doc.matterId)
      .populate("accountOfficer")
      .populate("assignedLawyers");

    if (!matter) {
      console.log("⚠️ Matter not found:", doc.matterId);
      return;
    }

    console.log(
      `📋 Matter: ${matter.matterNumber}, Hearings: ${doc.hearings.length}`,
    );

    // Only sync hearings that were added or modified
    // For new hearings, sync the newly added ones
    // For updates, we need to find which hearing was updated
    const hearingsToSync = [];

    if (this._hearingChanges.added?.length > 0) {
      // New hearings were added - find them in current hearings
      this._hearingChanges.added.forEach(addedId => {
        const hearing = doc.hearings.find(h => h._id?.toString() === addedId);
        if (hearing) {
          hearingsToSync.push(hearing);
        }
      });
    }

    // If no new hearings but hearings were modified, sync all 
    // (since we can't easily track which one was modified without more logic)
    if (hearingsToSync.length === 0 && doc.hearings.length > 0) {
      // This is an update scenario - sync all hearings to ensure calendar is up to date
      hearingsToSync.push(...doc.hearings);
    }

    if (hearingsToSync.length === 0) {
      console.log("⚠️ No hearings to sync");
      return;
    }

    await Promise.all(
      hearingsToSync.map((hearing) =>
        syncHearingToCalendar(doc, hearing, matter, CalendarEvent),
      ),
    );

    console.log(`✅ Sync complete for ${hearingsToSync.length} hearing(s)`);
  } catch (error) {
    console.error("❌ Sync error:", error);
  }
});

// ============================================
// CALENDAR SYNC FUNCTION
// ============================================

async function syncHearingToCalendar(
  litigationDetail,
  hearing,
  matter,
  CalendarEvent,
) {
  try {
    console.log(`  🔄 Syncing: ${hearing._id}`);

    const now = new Date();

    // Determine which date to show on calendar
    const hasNextHearingDate =
      hearing.nextHearingDate && new Date(hearing.nextHearingDate) > now;
    const calendarDate = hasNextHearingDate
      ? new Date(hearing.nextHearingDate)
      : new Date(hearing.date);

    // Set default time 9:00 AM - 11:00 AM
    const startDateTime = new Date(calendarDate);
    startDateTime.setHours(9, 0, 0, 0);

    const endDateTime = new Date(calendarDate);
    endDateTime.setHours(11, 0, 0, 0);

    // Status
    const isCompleted = hearing.outcome && !hasNextHearingDate;
    const eventStatus = isCompleted ? "completed" : "scheduled";

    // Title
    const titlePrefix = hasNextHearingDate
      ? "Court Hearing (Next)"
      : "Court Hearing";
    const eventTitle = `${titlePrefix}: ${matter.title || litigationDetail.suitNo}`;

    // Description
    let description = `Court hearing for ${matter.matterNumber}\n`;
    description += `Court: ${litigationDetail.courtName}`;
    if (litigationDetail.courtLocation) {
      description += ` - ${litigationDetail.courtLocation}`;
    }
    description += `\nSuit No: ${litigationDetail.suitNo}`;

    if (hearing.purpose) {
      description += `\nPurpose: ${hearing.purpose}`;
    }

    if (hasNextHearingDate) {
      description += `\n\n📅 Next Hearing: ${calendarDate.toLocaleDateString()}`;
      if (hearing.outcome) {
        description += `\nPrevious Outcome (${new Date(hearing.date).toLocaleDateString()}): ${hearing.outcome}`;
      }
    } else if (hearing.outcome) {
      description += `\nOutcome: ${hearing.outcome}`;
    }

    // Event type
    const eventType = hearing.purpose?.toLowerCase().includes("mention")
      ? "mention"
      : "hearing";

    // Participants
    const participants = [];

    if (matter.accountOfficer?.length > 0) {
      matter.accountOfficer.forEach((officer) => {
        participants.push({
          user: officer._id || officer,
          role: "organizer",
          responseStatus: "accepted",
        });
      });
    }

    if (matter.assignedLawyers?.length > 0) {
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

    if (hearing.lawyerPresent?.length > 0) {
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

    // Tags
    const tags = ["court-hearing", "auto-synced", litigationDetail.courtName];
    if (hasNextHearingDate) tags.push("next-hearing");
    if (isCompleted) tags.push("completed");

    // Color
    const color = hasNextHearingDate
      ? "#fa8c16"
      : isCompleted
        ? "#52c41a"
        : "#722ed1";

    // Event data
    const eventData = {
      firmId: litigationDetail.firmId,
      eventType,
      status: eventStatus,
      priority: "high",
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
        hearingType: eventType === "mention" ? "mention" : "trial",
        outcome: hearing.outcome,
        isNextHearing: hasNextHearingDate,
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
        isUsingNextHearingDate: hasNextHearingDate,
        originalHearingDate: hearing.date.toISOString(),
      },
    };

    // Find or create event
    const existingEvent = await CalendarEvent.findOne({
      firmId: litigationDetail.firmId,
      "customFields.hearingId": hearing._id.toString(),
      isDeleted: false,
    });

    if (existingEvent) {
      Object.assign(existingEvent, eventData);
      existingEvent.lastModifiedBy =
        matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0];
      await existingEvent.save();
      console.log(
        `  ✅ Updated: ${existingEvent.eventId} → ${calendarDate.toLocaleDateString()}`,
      );
    } else {
      const newEvent = await CalendarEvent.create(eventData);
      console.log(
        `  ✅ Created: ${newEvent.eventId} → ${calendarDate.toLocaleDateString()}`,
      );
    }

    console.log(
      `     ${hasNextHearingDate ? "🔸 Using NEXT date" : "🔹 Using current date"}`,
    );
  } catch (error) {
    console.error(`  ❌ Error syncing ${hearing._id}:`, error.message);
  }
}

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
