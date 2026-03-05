const { CalendarEvent } = require("../models/calenderEventModel");
const Matter = require("../models/matterModel");
const LitigationDetail = require("../models/litigationDetailModel");

/**
 * CalendarSyncService - Unified service for syncing legal events to calendar
 *
 * This service provides a robust, centralized approach to calendar synchronization
 * for all matter types and their related events.
 *
 * Supported Event Types:
 * - Litigation: Court hearings, mentions, deadlines
 * - Corporate: Transaction deadlines, AGMs, board meetings
 * - Property: Closing dates, inspections, deadlines
 * - Advisory: Due dates, deliverable deadlines
 * - Retainer: Scheduled services, renewals
 */

class CalendarSyncService {
  constructor() {
    this.defaultReminders = {
      court_hearing: [
        { reminderTime: 1440, reminderType: "email" }, // 1 day before
        { reminderTime: 60, reminderType: "in_app" }, // 1 hour before
      ],
      deadline: [
        { reminderTime: 10080, reminderType: "email" }, // 7 days before
        { reminderTime: 2880, reminderType: "email" }, // 2 days before
        { reminderTime: 1440, reminderType: "email" }, // 1 day before
      ],
      meeting: [
        { reminderTime: 120, reminderType: "in_app" }, // 2 hours before
        { reminderTime: 30, reminderType: "push" }, // 30 mins before
      ],
    };
  }

  /**
   * Get matter with populated relations
   */
  async getMatterWithRelations(matterId, firmId) {
    const matter = await Matter.findOne({
      _id: matterId,
      firmId,
      isDeleted: false,
    }).populate("accountOfficer assignedLawyers client");

    if (!matter) {
      throw new Error(`Matter not found: ${matterId}`);
    }

    return matter;
  }

  /**
   * Get litigation detail for a matter
   */
  async getLitigationDetail(matterId, firmId) {
    return LitigationDetail.findOne({ matterId, firmId, isDeleted: false });
  }

  /**
   * Build participants list from matter
   */
  buildParticipants(matter) {
    const participants = [];

    if (matter.accountOfficer?.length > 0) {
      matter.accountOfficer.forEach((officer) => {
        const id = officer._id || officer;
        if (!participants.some((p) => p.user.toString() === id.toString())) {
          participants.push({
            user: id,
            role: "organizer",
            responseStatus: "accepted",
          });
        }
      });
    }

    if (matter.assignedLawyers?.length > 0) {
      matter.assignedLawyers.forEach((lawyer) => {
        const id = lawyer._id || lawyer;
        if (!participants.some((p) => p.user.toString() === id.toString())) {
          participants.push({
            user: id,
            role: "attendee",
            responseStatus: "pending",
          });
        }
      });
    }

    return participants;
  }

  /**
   * Get or create calendar event
   */
  async findOrCreateEvent(query, eventData) {
    let event = await CalendarEvent.findOne({
      ...query,
      isDeleted: false,
    });

    if (event) {
      Object.assign(event, eventData);
      event.lastModifiedBy = eventData.createdBy;
      await event.save();
      return { event, isNew: false };
    }

    event = await CalendarEvent.create(eventData);
    return { event, isNew: true };
  }

  /**
   * ==========================================
   * LITIGATION HEARING SYNC
   * ==========================================
   */
  async syncHearing(matterId, firmId, hearingData, litigationDetail) {
    try {
      const matter = await this.getMatterWithRelations(matterId, firmId);

      if (matter.matterType !== "litigation") {
        throw new Error("syncHearing is only for litigation matters");
      }

      const hearing = hearingData._id
        ? hearingData
        : { ...hearingData, _id: null };
      const now = new Date();

      // Determine which date to use - prefer nextHearingDate if in future
      const hasNextHearingDate =
        hearing.nextHearingDate && new Date(hearing.nextHearingDate) > now;
      const hearingDateValue = hasNextHearingDate
        ? new Date(hearing.nextHearingDate)
        : new Date(hearing.date);

      // Determine event type - eventType uses "hearing", hearingMetadata.hearingType uses specific types
      let eventType = "hearing"; // Main event type
      let hearingTypeValue;
      const purposeLower = hearing.purpose?.toLowerCase() || "";

      if (purposeLower.includes("mention")) {
        eventType = "mention";
        hearingTypeValue = "mention";
      } else if (purposeLower.includes("trial")) {
        hearingTypeValue = "trial";
      } else if (purposeLower.includes("ruling")) {
        hearingTypeValue = "ruling";
      } else if (purposeLower.includes("judgment")) {
        hearingTypeValue = "judgment";
      } else if (purposeLower.includes("preliminary")) {
        hearingTypeValue = "preliminary";
      } else if (purposeLower.includes("appeal")) {
        hearingTypeValue = "appeal";
      } else {
        hearingTypeValue = "trial"; // Default for "hearing" event type
      }

      // Set times (using a new Date object to avoid mutating)
      const startDateTime = new Date(hearingDateValue);
      startDateTime.setHours(9, 0, 0, 0);
      const endDateTime = new Date(hearingDateValue);
      endDateTime.setHours(11, 0, 0, 0);
      const titlePrefix = hasNextHearingDate
        ? "Court Hearing (Next)"
        : "Court Hearing";
      const eventTitle = `${titlePrefix}: ${matter.title || litigationDetail?.suitNo || matter.matterNumber}`;

      let description = `Court hearing for ${matter.matterNumber}\n`;
      if (litigationDetail) {
        description += `Court: ${this.formatCourtName(litigationDetail.courtName)}`;
        if (litigationDetail.courtLocation) {
          description += ` - ${litigationDetail.courtLocation}`;
        }
        description += `\nSuit No: ${litigationDetail.suitNo}`;
        if (litigationDetail.judge?.[0]?.name) {
          description += `\nJudge: ${litigationDetail.judge[0].name}`;
        }
      }

      if (hearing.purpose) {
        description += `\nPurpose: ${hearing.purpose}`;
      }
      if (hasNextHearingDate) {
        description += `\n\n📅 Next Hearing: ${new Date(hearingDateValue).toLocaleDateString()}`;
      }
      if (hearing.outcome) {
        description += `\nOutcome: ${hearing.outcome}`;
      }

      // Determine status and color
      const isCompleted = hearing.outcome && !hasNextHearingDate;
      const eventStatus = isCompleted ? "completed" : "scheduled";
      const color = hasNextHearingDate
        ? "#fa8c16" // Orange for next hearing
        : isCompleted
          ? "#52c41a" // Green for completed
          : "#722ed1"; // Purple for scheduled

      const participants = this.buildParticipants(matter);
      if (hearingData.lawyerPresent?.length > 0) {
        hearingData.lawyerPresent.forEach((lawyer) => {
          const id = lawyer._id || lawyer;
          if (!participants.some((p) => p.user.toString() === id.toString())) {
            participants.push({
              user: id,
              role: "attendee",
              responseStatus: "accepted",
            });
          }
        });
      }

      const eventData = {
        firmId,
        eventType,
        status: eventStatus,
        priority: "high",
        matter: matter._id,
        matterType: "litigation",
        title: eventTitle,
        description,
        startDateTime,
        endDateTime,
        isAllDay: false,
        timezone: "Africa/Lagos",
        location: litigationDetail
          ? {
              type: "court",
              courtName: litigationDetail.courtName,
              courtRoom: litigationDetail.courtNo,
              address: litigationDetail.courtLocation
                ? `${litigationDetail.courtLocation}, ${litigationDetail.state}`
                : litigationDetail.state,
            }
          : undefined,
        organizer:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
        participants,
        visibility: "team",
        hearingMetadata: {
          hearingId: hearing._id,
          judge: litigationDetail?.judge?.[0]?.name,
          courtRoom: litigationDetail?.courtNo,
          suitNumber: litigationDetail?.suitNo,
          hearingType: hearingTypeValue,
          outcome: hearing.outcome,
          isNextHearing: hasNextHearingDate,
          originalHearingDate: hearing.date,
          nextHearingDate: hearing.nextHearingDate,
        },
        reminders: this.defaultReminders.court_hearing,
        tags: [
          "court-hearing",
          "auto-synced",
          litigationDetail?.courtName || "litigation",
        ],
        color,
        notes: hearing.notes,
        createdBy:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
        customFields: {
          hearingId: hearing._id?.toString() || `new-${Date.now()}`,
          originalHearingId: hasNextHearingDate
            ? hearing._id?.toString()
            : undefined,
          litigationDetailId: litigationDetail?._id?.toString(),
          isUsingNextHearingDate: hasNextHearingDate,
          originalHearingDate: new Date(hearing.date).toISOString(),
        },
      };

      // Build query for finding existing event - use fallback for new hearings
      const query = {
        firmId,
        isDeleted: false,
      };

      if (hearing._id) {
        // If there's a nextHearingDate, we need to handle differently
        if (hasNextHearingDate) {
          // For next hearing dates, create a NEW event (don't update existing)
          // Check if we already have a "next hearing" event for this hearing
          query["customFields.originalHearingId"] = hearing._id.toString();
          query["customFields.isUsingNextHearingDate"] = true;
        } else {
          query["customFields.hearingId"] = hearing._id.toString();
        }
      } else {
        // For new hearings without ID, check by matter and date range
        const startOfDay = new Date(hearingDateValue);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(hearingDateValue);
        endOfDay.setHours(23, 59, 59, 999);

        query.matter = matterId;
        query.startDateTime = { $gte: startOfDay, $lte: endOfDay };
      }

      const { event, isNew } = await this.findOrCreateEvent(query, eventData);

      return {
        success: true,
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.startDateTime,
        isNew,
        message: isNew
          ? `Created calendar event for hearing`
          : `Updated calendar event for hearing`,
      };
    } catch (error) {
      console.error("❌ Error syncing hearing to calendar:", error);
      return {
        success: false,
        error: error.message,
        message: `Failed to sync hearing: ${error.message}`,
      };
    }
  }

  /**
   * ==========================================
   * COURT ORDER DEADLINE SYNC
   * ==========================================
   */
  async syncCourtOrderDeadline(matterId, firmId, courtOrder) {
    try {
      const matter = await this.getMatterWithRelations(matterId, firmId);

      if (!courtOrder.complianceDeadline) {
        return {
          success: true,
          message: "No compliance deadline, skipping sync",
        };
      }

      const eventData = {
        firmId,
        eventType: "court_order_deadline",
        title: `Comply with Court Order - ${matter.title}`,
        description:
          courtOrder.description || "Court order compliance deadline",
        startDateTime: new Date(courtOrder.complianceDeadline),
        endDateTime: new Date(
          new Date(courtOrder.complianceDeadline).getTime() +
            24 * 60 * 60 * 1000 -
            1,
        ),
        isAllDay: true,
        matter: matter._id,
        matterType: matter.matterType,
        priority: "urgent",
        status:
          courtOrder.complianceStatus === "complied"
            ? "completed"
            : "scheduled",
        visibility: "team",
        organizer:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
        participants: this.buildParticipants(matter),
        deadlineMetadata: {
          courtOrderId: courtOrder._id,
          deadlineType: "court_order",
          penaltyForMissing: "Contempt of court proceedings may be initiated",
          completionStatus: courtOrder.complianceStatus || "pending",
        },
        reminders: this.defaultReminders.deadline,
        tags: ["court-order", "deadline", "urgent", "auto-synced"],
        color: "#ff5722",
        createdBy:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
      };

      const { event, isNew } = await this.findOrCreateEvent(
        {
          firmId,
          "deadlineMetadata.courtOrderId": courtOrder._id,
          isDeleted: false,
        },
        eventData,
      );

      return {
        success: true,
        eventId: event._id,
        eventTitle: event.title,
        deadlineDate: event.startDateTime,
        isNew,
        message: isNew
          ? `Created deadline calendar event`
          : `Updated deadline calendar event`,
      };
    } catch (error) {
      console.error("❌ Error syncing court order deadline:", error);
      return {
        success: false,
        error: error.message,
        message: `Failed to sync deadline: ${error.message}`,
      };
    }
  }

  /**
   * ==========================================
   * MATTER CREATION SYNC
   * Creates a calendar entry when a new matter is created
   * ==========================================
   */
  async syncMatterCreation(matterId, firmId) {
    try {
      const matter = await this.getMatterWithRelations(matterId, firmId);

      const eventData = {
        firmId,
        eventType: "matter_created",
        title: `New Matter Opened: ${matter.title}`,
        description: `Matter Type: ${matter.matterType}\nNature: ${matter.natureOfMatter}\nClient: ${matter.client?.firstName} ${matter.client?.lastName || ""}`,
        startDateTime: matter.dateOpened || new Date(),
        endDateTime: matter.dateOpened || new Date(),
        isAllDay: true,
        matter: matter._id,
        matterType: matter.matterType,
        priority: "medium",
        status: "completed",
        visibility: "team",
        organizer:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
        participants: this.buildParticipants(matter),
        tags: ["matter-created", "auto-synced"],
        color: "#1890ff",
        createdBy:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
      };

      // Only create if doesn't exist
      const existing = await CalendarEvent.findOne({
        firmId,
        "customFields.matterId": matterId.toString(),
        eventType: "matter_created",
        isDeleted: false,
      });

      if (existing) {
        return { success: true, message: "Matter event already exists" };
      }

      await CalendarEvent.create({
        ...eventData,
        customFields: { matterId: matterId.toString() },
      });

      return {
        success: true,
        message: "Created calendar event for new matter",
      };
    } catch (error) {
      console.error("❌ Error syncing matter creation:", error);
      return {
        success: false,
        error: error.message,
        message: `Failed to sync matter creation: ${error.message}`,
      };
    }
  }

  /**
   * ==========================================
   * EXPECTED CLOSURE DATE SYNC
   * ==========================================
   */
  async syncExpectedClosure(matterId, firmId) {
    try {
      const matter = await this.getMatterWithRelations(matterId, firmId);

      if (!matter.expectedClosureDate) {
        return { success: true, message: "No expected closure date" };
      }

      const eventData = {
        firmId,
        eventType: "expected_closure",
        title: `Matter Expected Closure: ${matter.title}`,
        description: `Matter ${matter.matterNumber} expected to close\nClient: ${matter.client?.firstName} ${matter.client?.lastName || ""}`,
        startDateTime: new Date(matter.expectedClosureDate),
        endDateTime: new Date(matter.expectedClosureDate),
        isAllDay: true,
        matter: matter._id,
        matterType: matter.matterType,
        priority: "medium",
        status: "scheduled",
        visibility: "team",
        organizer:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
        participants: this.buildParticipants(matter),
        reminders: [
          { reminderTime: 4320, reminderType: "email" }, // 3 days before
          { reminderTime: 1440, reminderType: "email" }, // 1 day before
        ],
        tags: ["expected-closure", "auto-synced"],
        color: "#52c41a",
        createdBy:
          matter.accountOfficer?.[0]?._id || matter.accountOfficer?.[0],
        customFields: { matterId: matterId.toString() },
      };

      const { event, isNew } = await this.findOrCreateEvent(
        {
          firmId,
          "customFields.matterId": matterId.toString(),
          eventType: "expected_closure",
          isDeleted: false,
        },
        eventData,
      );

      return {
        success: true,
        eventId: event._id,
        isNew,
        message: isNew
          ? "Created closure date event"
          : "Updated closure date event",
      };
    } catch (error) {
      console.error("❌ Error syncing expected closure:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ==========================================
   * SYNC ALL HEARINGS FOR A MATTER
   * ==========================================
   */
  async syncAllHearings(matterId, firmId) {
    try {
      const matter = await this.getMatterWithRelations(matterId, firmId);
      const litigationDetail = await this.getLitigationDetail(matterId, firmId);

      if (!litigationDetail || !litigationDetail.hearings?.length) {
        return { success: true, message: "No hearings to sync" };
      }

      const results = [];
      for (const hearing of litigationDetail.hearings) {
        const result = await this.syncHearing(
          matterId,
          firmId,
          hearing,
          litigationDetail,
        );
        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      return {
        success: true,
        total: results.length,
        synced: successCount,
        message: `Synced ${successCount} of ${results.length} hearings`,
      };
    } catch (error) {
      console.error("❌ Error syncing all hearings:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ==========================================
   * DELETE CALENDAR EVENT
   * ==========================================
   */
  async deleteEvent(eventId, firmId) {
    try {
      const event = await CalendarEvent.findOneAndUpdate(
        { _id: eventId, firmId, isDeleted: false },
        { isDeleted: true, deletedAt: new Date(), status: "cancelled" },
        { new: true },
      );

      if (!event) {
        return { success: false, error: "Event not found" };
      }

      return { success: true, message: "Event deleted successfully" };
    } catch (error) {
      console.error("❌ Error deleting calendar event:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ==========================================
   * DELETE ALL EVENTS FOR A MATTER
   * ==========================================
   */
  async deleteAllForMatter(matterId, firmId) {
    try {
      const result = await CalendarEvent.updateMany(
        { matter: matterId, firmId, isDeleted: false },
        { isDeleted: true, deletedAt: new Date(), status: "cancelled" },
      );

      return {
        success: true,
        deleted: result.modifiedCount,
        message: `Deleted ${result.modifiedCount} calendar events`,
      };
    } catch (error) {
      console.error("❌ Error deleting calendar events:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ==========================================
   * MARK PAST HEARINGS AS COMPLETED
   * ==========================================
   */
  async markPastHearingsCompleted(matterId, firmId) {
    try {
      const events = await CalendarEvent.find({
        matter: matterId,
        firmId,
        eventType: { $in: ["hearing", "mention"] },
        status: "scheduled",
        isDeleted: false,
        endDateTime: { $lt: new Date() },
      });

      for (const event of events) {
        event.status = "completed";
        await event.save();
      }

      return {
        success: true,
        completed: events.length,
        message: `Marked ${events.length} past hearings as completed`,
      };
    } catch (error) {
      console.error("❌ Error marking hearings completed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format court name for display
   */
  formatCourtName(courtName) {
    if (!courtName) return "Unknown Court";
    return courtName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}

// Export singleton instance
module.exports = new CalendarSyncService();

// Export class for testing
module.exports.CalendarSyncService = CalendarSyncService;
