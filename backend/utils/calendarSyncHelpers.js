const {
  EVENT_TYPES,
  EVENT_STATUS,
  PRIORITY_LEVELS,
} = require("../models/CalendarEvent");

/**
 * Sync a single hearing to calendar (creates/updates both current and next hearing events)
 */
async function syncHearingToCalendar(
  litigationDetail,
  hearing,
  matter,
  { CalendarEvent },
) {
  try {
    console.log(`  🔄 Syncing hearing: ${hearing._id}`);

    // ========================================
    // PART 1: Sync the CURRENT hearing date
    // ========================================
    await syncCurrentHearing(litigationDetail, hearing, matter, {
      CalendarEvent,
    });

    // ========================================
    // PART 2: Sync the NEXT hearing date (if exists)
    // ========================================
    await syncNextHearing(litigationDetail, hearing, matter, { CalendarEvent });
  } catch (error) {
    console.error(`  ❌ Error syncing hearing ${hearing._id}:`, error.message);
  }
}

/**
 * Sync the current hearing date
 */
async function syncCurrentHearing(
  litigationDetail,
  hearing,
  matter,
  { CalendarEvent },
) {
  const startDateTime = new Date(hearing.date);
  const endDateTime = new Date(hearing.date);
  endDateTime.setHours(endDateTime.getHours() + 2); // Default 2-hour hearing

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

  const eventType = hearing.purpose?.toLowerCase().includes("mention")
    ? EVENT_TYPES.MENTION
    : EVENT_TYPES.HEARING;

  // Build participants list
  const participants = [];

  // Add account officers
  if (matter.accountOfficer && matter.accountOfficer.length > 0) {
    matter.accountOfficer.forEach((officer) => {
      participants.push({
        user: officer._id,
        role: "organizer",
        responseStatus: "accepted",
      });
    });
  }

  // Add assigned lawyers
  if (matter.assignedLawyers && matter.assignedLawyers.length > 0) {
    matter.assignedLawyers.forEach((lawyer) => {
      if (
        !participants.some((p) => p.user.toString() === lawyer._id.toString())
      ) {
        participants.push({
          user: lawyer._id,
          role: "attendee",
          responseStatus: "pending",
        });
      }
    });
  }

  // Add lawyers present
  if (hearing.lawyerPresent && hearing.lawyerPresent.length > 0) {
    hearing.lawyerPresent.forEach((lawyerId) => {
      const lawyerIdStr = lawyerId.toString ? lawyerId.toString() : lawyerId;
      if (!participants.some((p) => p.user.toString() === lawyerIdStr)) {
        participants.push({
          user: lawyerId,
          role: "attendee",
          responseStatus: "accepted",
        });
      }
    });
  }

  // Build event data
  const eventData = {
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
    organizer: matter.accountOfficer?.[0]?._id,
    participants,
    visibility: "team",
    hearingMetadata: {
      hearingId: hearing._id,
      judge: litigationDetail.judge?.[0]?.name,
      courtRoom: litigationDetail.courtNo,
      suitNumber: litigationDetail.suitNo,
      hearingType: eventType === EVENT_TYPES.MENTION ? "mention" : "trial",
      outcome: hearing.outcome,
    },
    tags: ["court-hearing", "auto-synced", litigationDetail.courtName],
    color: hearing.outcome ? "#52c41a" : "#722ed1", // Green if completed, purple if scheduled
    notes: hearing.notes,
    createdBy: matter.accountOfficer?.[0]?._id,
    customFields: {
      hearingId: hearing._id.toString(),
      litigationDetailId: litigationDetail._id.toString(),
      eventType: "current",
    },
  };

  // Upsert current hearing event
  const existingEvent = await CalendarEvent.findOne({
    firmId: litigationDetail.firmId,
    "customFields.hearingId": hearing._id.toString(),
    "customFields.eventType": "current",
    isDeleted: false,
  });

  if (existingEvent) {
    // Update existing event
    Object.assign(existingEvent, eventData);
    existingEvent.lastModifiedBy = matter.accountOfficer?.[0]?._id;
    await existingEvent.save();
    console.log(
      `    ✅ Updated current hearing event: ${existingEvent.eventId}`,
    );
  } else {
    // Create new event
    const newEvent = await CalendarEvent.create(eventData);
    console.log(`    ✅ Created current hearing event: ${newEvent.eventId}`);
  }
}

/**
 * Sync the next hearing date (adjourned date)
 */
async function syncNextHearing(
  litigationDetail,
  hearing,
  matter,
  { CalendarEvent },
) {
  // If no next hearing date, delete any existing next hearing event
  if (!hearing.nextHearingDate) {
    await CalendarEvent.deleteMany({
      firmId: litigationDetail.firmId,
      "customFields.hearingId": hearing._id.toString(),
      "customFields.eventType": "next",
    });
    console.log(`    🗑️ Removed next hearing event (no next date set)`);
    return;
  }

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
  nextDescription += `\n\nAdjourned from: ${new Date(hearing.date).toLocaleDateString()}`;

  if (hearing.outcome) {
    nextDescription += `\nPrevious Outcome: ${hearing.outcome}`;
  }

  if (hearing.notes) {
    nextDescription += `\nNotes: ${hearing.notes}`;
  }

  // Build participants (same as current hearing)
  const participants = [];

  if (matter.accountOfficer && matter.accountOfficer.length > 0) {
    matter.accountOfficer.forEach((officer) => {
      participants.push({
        user: officer._id,
        role: "organizer",
        responseStatus: "accepted",
      });
    });
  }

  if (matter.assignedLawyers && matter.assignedLawyers.length > 0) {
    matter.assignedLawyers.forEach((lawyer) => {
      if (
        !participants.some((p) => p.user.toString() === lawyer._id.toString())
      ) {
        participants.push({
          user: lawyer._id,
          role: "attendee",
          responseStatus: "pending",
        });
      }
    });
  }

  if (hearing.lawyerPresent && hearing.lawyerPresent.length > 0) {
    hearing.lawyerPresent.forEach((lawyerId) => {
      const lawyerIdStr = lawyerId.toString ? lawyerId.toString() : lawyerId;
      if (!participants.some((p) => p.user.toString() === lawyerIdStr)) {
        participants.push({
          user: lawyerId,
          role: "attendee",
          responseStatus: "accepted",
        });
      }
    });
  }

  const eventType = hearing.purpose?.toLowerCase().includes("mention")
    ? EVENT_TYPES.MENTION
    : EVENT_TYPES.HEARING;

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
    organizer: matter.accountOfficer?.[0]?._id,
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
    tags: [
      "court-hearing",
      "auto-synced",
      "adjourned",
      litigationDetail.courtName,
    ],
    color: "#fa8c16", // Orange for adjourned hearings
    notes: `Adjourned from ${new Date(hearing.date).toLocaleDateString()}`,
    createdBy: matter.accountOfficer?.[0]?._id,
    customFields: {
      hearingId: hearing._id.toString(),
      litigationDetailId: litigationDetail._id.toString(),
      eventType: "next",
      previousHearingDate: hearing.date.toISOString(),
    },
  };

  // Upsert next hearing event
  const existingNextEvent = await CalendarEvent.findOne({
    firmId: litigationDetail.firmId,
    "customFields.hearingId": hearing._id.toString(),
    "customFields.eventType": "next",
    isDeleted: false,
  });

  if (existingNextEvent) {
    // Update existing event
    Object.assign(existingNextEvent, nextEventData);
    existingNextEvent.lastModifiedBy = matter.accountOfficer?.[0]?._id;
    await existingNextEvent.save();
    console.log(
      `    ✅ Updated next hearing event: ${existingNextEvent.eventId}`,
    );
  } else {
    // Create new event
    const newNextEvent = await CalendarEvent.create(nextEventData);
    console.log(`    ✅ Created next hearing event: ${newNextEvent.eventId}`);
  }
}

module.exports = {
  syncHearingToCalendar,
};
