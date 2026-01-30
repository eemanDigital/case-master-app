const { CalendarEvent } = require("../models/calenderEventModel");
const LitigationDetail = require("../models/litigationDetailModel");

// ============================================
// AUTO-SYNC LITIGATION HEARINGS TO CALENDAR
// ============================================

/**
 * Automatically create/update calendar event when hearing is added to litigation matter
 * This runs as Mongoose middleware on LitigationDetail
 */

// Helper function to create calendar event from hearing
const createCalendarEventFromHearing = async (
  litigationDetail,
  hearing,
  matter,
) => {
  try {
    // Check if calendar event already exists for this hearing
    const existingEvent = await CalendarEvent.findOne({
      firmId: litigationDetail.firmId,
      matter: matter._id,
      "hearingMetadata.hearingId": hearing._id,
      isDeleted: false,
    });

    // Determine event type based on hearing purpose
    const eventType = hearing.purpose?.toLowerCase().includes("mention")
      ? "mention"
      : "hearing";

    // Build event data
    const eventData = {
      firmId: litigationDetail.firmId,
      eventType: eventType,
      title: `${hearing.purpose || "Court Hearing"} - ${matter.title}`,
      description:
        hearing.notes || `Court hearing for ${litigationDetail.suitNo}`,
      startDateTime: hearing.date,
      // Default 2-hour duration, or use custom duration
      endDateTime: new Date(
        new Date(hearing.date).getTime() + 2 * 60 * 60 * 1000,
      ),
      isAllDay: false,
      matter: matter._id,
      matterType: matter.matterType,
      priority: "high", // Court hearings are always high priority
      status: "scheduled",
      visibility: "team", // All team members can see
      organizer: matter.accountOfficer[0], // Primary account officer
      participants: matter.accountOfficer.map((lawyer) => ({
        user: lawyer,
        role: "attendee",
        responseStatus: "pending",
      })),
      location: {
        type: "court",
        courtName: litigationDetail.courtName,
        courtRoom: litigationDetail.courtNo,
        courtLocation: litigationDetail.courtLocation,
        address: `${litigationDetail.courtLocation}, ${litigationDetail.state}`,
      },
      hearingMetadata: {
        hearingId: hearing._id, // Link back to litigation hearing
        judge: litigationDetail.judge[0]?.name,
        courtRoom: litigationDetail.courtNo,
        suitNumber: litigationDetail.suitNo,
        hearingType: eventType === "mention" ? "mention" : "trial",
      },
      reminders: [
        {
          reminderTime: 1440, // 1 day before
          reminderType: "email",
        },
        {
          reminderTime: 60, // 1 hour before
          reminderType: "in_app",
        },
      ],
      tags: ["court-hearing", "auto-synced", litigationDetail.courtName],
      color: "#f44336", // Red for court hearings
      notes: hearing.notes,
      createdBy: matter.accountOfficer[0],
    };

    if (existingEvent) {
      // Update existing event
      Object.assign(existingEvent, eventData);
      existingEvent.lastModifiedBy = matter.accountOfficer[0];
      await existingEvent.save();
      console.log(`✅ Updated calendar event for hearing: ${hearing._id}`);
      return existingEvent;
    } else {
      // Create new event
      const newEvent = await CalendarEvent.create(eventData);
      console.log(`✅ Created calendar event for hearing: ${hearing._id}`);
      return newEvent;
    }
  } catch (error) {
    console.error("❌ Error syncing hearing to calendar:", error);
    // Don't throw error - allow litigation update to proceed even if calendar sync fails
  }
};

// Helper function to update calendar event when next hearing date changes
const updateNextHearingInCalendar = async (litigationDetail, matter) => {
  try {
    if (!litigationDetail.nextHearingDate) return;

    // Find the most recent calendar event for this matter
    const latestEvent = await CalendarEvent.findOne({
      firmId: litigationDetail.firmId,
      matter: matter._id,
      eventType: { $in: ["hearing", "mention"] },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (latestEvent && latestEvent.status === "scheduled") {
      // Update next hearing date in latest event
      latestEvent.hearingMetadata = {
        ...latestEvent.hearingMetadata,
        nextHearingDate: litigationDetail.nextHearingDate,
      };
      await latestEvent.save();
      console.log(`✅ Updated next hearing date in calendar`);
    }
  } catch (error) {
    console.error("❌ Error updating next hearing date:", error);
  }
};

// Helper function to mark calendar event as completed when judgment recorded
const markHearingAsCompleted = async (litigationDetail, matter) => {
  try {
    // Find all scheduled hearings for this matter
    const scheduledEvents = await CalendarEvent.find({
      firmId: litigationDetail.firmId,
      matter: matter._id,
      eventType: { $in: ["hearing", "mention"] },
      status: "scheduled",
      isDeleted: false,
    });

    // Mark all past hearings as completed
    const now = new Date();
    for (const event of scheduledEvents) {
      if (event.endDateTime < now) {
        event.status = "completed";
        await event.save();
      }
    }

    console.log(
      `✅ Marked ${scheduledEvents.length} past hearings as completed`,
    );
  } catch (error) {
    console.error("❌ Error marking hearings as completed:", error);
  }
};

// Helper function to create deadline calendar event for court orders
const createDeadlineFromCourtOrder = async (
  litigationDetail,
  courtOrder,
  matter,
) => {
  try {
    // Only create deadline if court order has a compliance deadline
    if (!courtOrder.complianceDeadline) return;

    const existingDeadline = await CalendarEvent.findOne({
      firmId: litigationDetail.firmId,
      matter: matter._id,
      "deadlineMetadata.courtOrderId": courtOrder._id,
      isDeleted: false,
    });

    const deadlineData = {
      firmId: litigationDetail.firmId,
      eventType: "court_order_deadline",
      title: `Comply with Court Order - ${matter.title}`,
      description: courtOrder.description,
      startDateTime: new Date(courtOrder.complianceDeadline).setHours(
        0,
        0,
        0,
        0,
      ),
      endDateTime: new Date(courtOrder.complianceDeadline).setHours(
        23,
        59,
        59,
        999,
      ),
      isAllDay: true,
      matter: matter._id,
      matterType: matter.matterType,
      priority: "urgent",
      status: "scheduled",
      visibility: "team",
      organizer: matter.accountOfficer[0],
      participants: matter.accountOfficer.map((lawyer) => ({
        user: lawyer,
        role: "attendee",
      })),
      deadlineMetadata: {
        courtOrderId: courtOrder._id,
        deadlineType: "court_order",
        penaltyForMissing: "Contempt of court proceedings may be initiated",
        completionStatus:
          courtOrder.complianceStatus === "complied" ? "completed" : "pending",
      },
      reminders: [
        {
          reminderTime: 10080, // 7 days before
          reminderType: "email",
        },
        {
          reminderTime: 2880, // 2 days before
          reminderType: "email",
        },
        {
          reminderTime: 1440, // 1 day before
          reminderType: "email",
        },
      ],
      tags: ["court-order", "deadline", "urgent"],
      color: "#ff5722", // Deep orange for deadlines
      createdBy: matter.accountOfficer[0],
    };

    if (existingDeadline) {
      Object.assign(existingDeadline, deadlineData);
      await existingDeadline.save();
      console.log(`✅ Updated deadline for court order: ${courtOrder._id}`);
    } else {
      await CalendarEvent.create(deadlineData);
      console.log(`✅ Created deadline for court order: ${courtOrder._id}`);
    }
  } catch (error) {
    console.error("❌ Error creating deadline from court order:", error);
  }
};

module.exports = {
  createCalendarEventFromHearing,
  updateNextHearingInCalendar,
  markHearingAsCompleted,
  createDeadlineFromCourtOrder,
};
