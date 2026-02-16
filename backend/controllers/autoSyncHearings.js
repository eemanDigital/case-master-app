const mongoose = require("mongoose");
const {
  CalendarEvent,
  EVENT_TYPES,
  EVENT_STATUS,
  PRIORITY_LEVELS,
} = require("../models/calenderEventModel");

/**
 * AUTOMATIC HEARING SYNC MIDDLEWARE
 * This middleware automatically creates/updates calendar events
 * whenever hearings are added or modified in litigation
 */

// ============================================
// POST-SAVE MIDDLEWARE
// ============================================

const litigationSchema = require("../models/litigationDetailModel").schema;

/**
 * After saving a litigation detail, sync all hearings to calendar
 */
litigationSchema.post("save", async function (doc, next) {
  try {
    // Only sync if hearings were modified
    if (!this.isModified("hearings")) {
      return next();
    }

    // Get the parent matter
    const Matter = mongoose.model("Matter");
    const matter = await Matter.findById(doc.matterId)
      .populate("accountOfficer")
      .populate("assignedLawyers");

    if (!matter) {
      console.log("⚠️ Matter not found for litigation:", doc._id);
      return next();
    }

    // Sync each hearing
    for (const hearing of doc.hearings) {
      await syncHearingToCalendar(doc, hearing, matter);
    }

    console.log(`✅ Auto-synced ${doc.hearings.length} hearings to calendar`);
  } catch (error) {
    console.error("❌ Error in auto-sync middleware:", error);
    // Don't block the save operation if sync fails
  }

  next();
});

/**
 * Sync a single hearing to calendar
 */
async function syncSingleHearing(litigationDetail, hearing, matter, models) {
  const { CalendarEvent } = models;

  // Define constants
  const EVENT_TYPES = { HEARING: "hearing", MENTION: "mention" };
  const EVENT_STATUS = { SCHEDULED: "scheduled" };
  const PRIORITY_LEVELS = { HIGH: "high" };

  try {
    console.log(`  🔄 Syncing hearing: ${hearing._id}`);

    // ========================================
    // PART 1: Sync the CURRENT hearing date
    // ========================================

    const eventTitle = `Court Hearing: ${matter.title || litigationDetail.suitNo}`;

    let description = `Court hearing for ${matter.matterNumber}\n`;
    description += `Court: ${litigationDetail.courtName}`;
    if (litigationDetail.courtLocation) {
      description += ` - ${litigationDetail.courtLocation}`;
    }
    description += `\nSuit No: ${litigationDetail.suitNo}`;
    if (hearing.purpose) {
      description += `\nPurpose: ${hearing.purpose}`;
    }
    if (hearing.outcome) {
      description += `\nOutcome: ${hearing.outcome}`;
    }

    const startDateTime = new Date(hearing.date);
    const endDateTime = new Date(hearing.date);
    endDateTime.setHours(endDateTime.getHours() + 2);

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

    // Build current hearing event data
    const currentEventData = {
      firmId: litigationDetail.firmId,
      eventType,
      status: hearing.outcome ? EVENT_STATUS.COMPLETED : EVENT_STATUS.SCHEDULED,
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
        hasNextHearing: !!hearing.nextHearingDate,
      },
      reminders: [
        { reminderTime: 1440, reminderType: "email", isSent: false },
        { reminderTime: 60, reminderType: "in_app", isSent: false },
        { reminderTime: 30, reminderType: "push", isSent: false },
      ],
      tags: ["court-hearing", "auto-synced", litigationDetail.courtName],
      color: "#722ed1",
      notes: hearing.notes,
      createdBy: matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
      customFields: {
        hearingId: hearing._id.toString(),
        litigationDetailId: litigationDetail._id.toString(),
        isCurrentHearing: true,
      },
    };

    // Check if current hearing event exists
    const existingCurrentEvent = await CalendarEvent.findOne({
      firmId: litigationDetail.firmId,
      "customFields.hearingId": hearing._id.toString(),
      "customFields.isCurrentHearing": true,
      isDeleted: false,
    });

    if (existingCurrentEvent) {
      Object.assign(existingCurrentEvent, currentEventData);
      existingCurrentEvent.lastModifiedBy =
        matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0];
      await existingCurrentEvent.save();
      console.log(
        `  ✅ Updated current hearing event: ${existingCurrentEvent.eventId}`,
      );
    } else {
      const newEvent = await CalendarEvent.create(currentEventData);
      console.log(`  ✅ Created current hearing event: ${newEvent.eventId}`);
    }

    // ========================================
    // PART 2: Sync the NEXT hearing date (if exists)
    // ========================================

    if (hearing.nextHearingDate) {
      console.log(`  🔄 Syncing next hearing date: ${hearing.nextHearingDate}`);

      const nextStartDateTime = new Date(hearing.nextHearingDate);
      const nextEndDateTime = new Date(hearing.nextHearingDate);
      nextEndDateTime.setHours(nextEndDateTime.getHours() + 2);

      const nextEventTitle = `Court Hearing (Adjourned): ${matter.title || litigationDetail.suitNo}`;

      let nextDescription = `Next hearing date for ${matter.matterNumber}\n`;
      nextDescription += `Court: ${litigationDetail.courtName}`;
      if (litigationDetail.courtLocation) {
        nextDescription += ` - ${litigationDetail.courtLocation}`;
      }
      nextDescription += `\nSuit No: ${litigationDetail.suitNo}`;
      nextDescription += `\n\nThis is the adjourned hearing from ${new Date(hearing.date).toLocaleDateString()}`;
      if (hearing.outcome) {
        nextDescription += `\nPrevious Outcome: ${hearing.outcome}`;
      }

      const nextEventData = {
        firmId: litigationDetail.firmId,
        eventType,
        status: EVENT_STATUS.SCHEDULED,
        priority: PRIORITY_LEVELS.HIGH,
        matter: matter._id,
        matterType: matter.matterType,
        title: nextEventTitle,
        description: nextDescription,
        startDateTime: nextStartDateTime,
        endDateTime: nextEndDateTime,
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
        organizer:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
        participants,
        visibility: "team",
        hearingMetadata: {
          hearingId: hearing._id,
          judge: litigationDetail.judge?.[0]?.name,
          courtRoom: litigationDetail.courtNo,
          suitNumber: litigationDetail.suitNo,
          hearingType: eventType === EVENT_TYPES.MENTION ? "mention" : "trial",
          isAdjourned: true,
          previousHearingDate: hearing.date,
        },
        reminders: [
          { reminderTime: 1440, reminderType: "email", isSent: false },
          { reminderTime: 60, reminderType: "in_app", isSent: false },
          { reminderTime: 30, reminderType: "push", isSent: false },
        ],
        tags: [
          "court-hearing",
          "auto-synced",
          "adjourned",
          litigationDetail.courtName,
        ],
        color: "#fa8c16", // Orange for adjourned hearings
        notes: `Next hearing for: ${hearing.notes || "N/A"}`,
        createdBy:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
        customFields: {
          hearingId: hearing._id.toString(),
          litigationDetailId: litigationDetail._id.toString(),
          isNextHearing: true,
          previousHearingDate: hearing.date,
        },
      };

      // Check if next hearing event exists
      const existingNextEvent = await CalendarEvent.findOne({
        firmId: litigationDetail.firmId,
        "customFields.hearingId": hearing._id.toString(),
        "customFields.isNextHearing": true,
        isDeleted: false,
      });

      if (existingNextEvent) {
        Object.assign(existingNextEvent, nextEventData);
        existingNextEvent.lastModifiedBy =
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0];
        await existingNextEvent.save();
        console.log(
          `  ✅ Updated next hearing event: ${existingNextEvent.eventId}`,
        );
      } else {
        const newNextEvent = await CalendarEvent.create(nextEventData);
        console.log(`  ✅ Created next hearing event: ${newNextEvent.eventId}`);
      }
    } else {
      // If no next hearing date, delete any existing next hearing event
      await CalendarEvent.deleteMany({
        firmId: litigationDetail.firmId,
        "customFields.hearingId": hearing._id.toString(),
        "customFields.isNextHearing": true,
      });
      console.log(`  🗑️ Removed next hearing event (no next date set)`);
    }
  } catch (error) {
    console.error(`  ❌ Error syncing hearing ${hearing._id}:`, error.message);
  }
}

module.exports = {
  syncHearingToCalendar,
};
