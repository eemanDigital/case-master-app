import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(relativeTime);
dayjs.extend(isBetween);

// ============================================
// HEARING SYNC UTILITIES
// ============================================

/**
 * Calculate days until a date
 * @param {Date|string} date
 * @returns {number} Days until date (negative if past)
 */
export const getDaysUntil = (date) => {
  const now = dayjs();
  const target = dayjs(date);
  return target.diff(now, "day");
};

/**
 * Get hours until a date
 * @param {Date|string} date
 * @returns {number} Hours until date
 */
export const getHoursUntil = (date) => {
  const now = dayjs();
  const target = dayjs(date);
  return target.diff(now, "hour");
};

/**
 * Check if a hearing is upcoming (within next 30 days)
 * @param {Object} hearing - Hearing event object
 * @returns {boolean}
 */
export const isHearingUpcoming = (hearing) => {
  const now = dayjs();
  const hearingDate = dayjs(hearing.startDateTime);
  const thirtyDaysLater = now.add(30, "day");

  return (
    hearingDate.isAfter(now) &&
    hearingDate.isBefore(thirtyDaysLater) &&
    hearing.status === "scheduled"
  );
};

/**
 * Check if a hearing is urgent (within next 7 days and high/urgent priority)
 * @param {Object} hearing - Hearing event object
 * @returns {boolean}
 */
export const isHearingUrgent = (hearing) => {
  const daysUntil = getDaysUntil(hearing.startDateTime);
  return (
    daysUntil >= 0 &&
    daysUntil <= 7 &&
    (hearing.priority === "high" || hearing.priority === "urgent")
  );
};

/**
 * Check if hearing is auto-synced from litigation
 * @param {Object} hearing - Hearing event object
 * @returns {boolean}
 */
export const isAutoSyncedHearing = (hearing) => {
  return (
    hearing.hearingMetadata?.hearingId && hearing.tags?.includes("auto-synced")
  );
};

/**
 * Get hearing sync status
 * @param {Object} hearing - Hearing event object
 * @returns {Object} Sync status information
 */
export const getHearingSyncStatus = (hearing) => {
  const isAutoSynced = isAutoSyncedHearing(hearing);

  return {
    isSynced: isAutoSynced,
    hearingId: hearing.hearingMetadata?.hearingId || null,
    litigationDetailId:
      hearing.customFields?.get?.("litigationDetailId") || null,
    syncedAt: hearing.createdAt,
    lastModified: hearing.updatedAt,
  };
};

/**
 * Get deadline urgency level
 * @param {Object} deadline - Court order deadline object
 * @returns {Object} Urgency information
 */
export const getDeadlineUrgency = (deadline) => {
  const daysUntil = getDaysUntil(deadline.endDateTime);

  if (daysUntil < 0) {
    return {
      level: "overdue",
      color: "red",
      label: "Overdue",
      severity: 5,
    };
  }

  if (daysUntil === 0) {
    return {
      level: "due-today",
      color: "red",
      label: "Due Today",
      severity: 4,
    };
  }

  if (daysUntil === 1) {
    return {
      level: "due-tomorrow",
      color: "orange",
      label: "Due Tomorrow",
      severity: 4,
    };
  }

  if (daysUntil <= 2) {
    return {
      level: "critical",
      color: "red",
      label: "Critical",
      severity: 3,
    };
  }

  if (daysUntil <= 7) {
    return {
      level: "urgent",
      color: "orange",
      label: "Urgent",
      severity: 2,
    };
  }

  return {
    level: "upcoming",
    color: "blue",
    label: "Upcoming",
    severity: 1,
  };
};

/**
 * Sort hearings by urgency
 * @param {Array} hearings - Array of hearing objects
 * @returns {Array} Sorted hearings (most urgent first)
 */
export const sortHearingsByUrgency = (hearings) => {
  return [...hearings].sort((a, b) => {
    // First by date (closest first)
    const dateA = new Date(a.startDateTime);
    const dateB = new Date(b.startDateTime);

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }

    // Then by priority
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
};

/**
 * Sort deadlines by urgency
 * @param {Array} deadlines - Array of deadline objects
 * @returns {Array} Sorted deadlines (most urgent first)
 */
export const sortDeadlinesByUrgency = (deadlines) => {
  return [...deadlines].sort((a, b) => {
    const urgencyA = getDeadlineUrgency(a);
    const urgencyB = getDeadlineUrgency(b);

    if (urgencyA.severity !== urgencyB.severity) {
      return urgencyB.severity - urgencyA.severity;
    }

    // If same urgency level, sort by date
    return new Date(a.endDateTime) - new Date(b.endDateTime);
  });
};

/**
 * Filter hearings by court
 * @param {Array} hearings - Array of hearing objects
 * @param {string} courtName - Court name to filter by
 * @returns {Array} Filtered hearings
 */
export const filterHearingsByCourt = (hearings, courtName) => {
  if (!courtName) return hearings;

  return hearings.filter(
    (hearing) =>
      hearing.location?.courtName?.toLowerCase() === courtName.toLowerCase(),
  );
};

/**
 * Filter hearings by judge
 * @param {Array} hearings - Array of hearing objects
 * @param {string} judgeName - Judge name to filter by
 * @returns {Array} Filtered hearings
 */
export const filterHearingsByJudge = (hearings, judgeName) => {
  if (!judgeName) return hearings;

  return hearings.filter(
    (hearing) =>
      hearing.hearingMetadata?.judge?.toLowerCase() === judgeName.toLowerCase(),
  );
};

/**
 * Filter hearings by suit number
 * @param {Array} hearings - Array of hearing objects
 * @param {string} suitNumber - Suit number to filter by
 * @returns {Array} Filtered hearings
 */
export const filterHearingsBySuitNumber = (hearings, suitNumber) => {
  if (!suitNumber) return hearings;

  return hearings.filter(
    (hearing) =>
      hearing.hearingMetadata?.suitNumber?.toLowerCase() ===
      suitNumber.toLowerCase(),
  );
};

/**
 * Group hearings by month
 * @param {Array} hearings - Array of hearing objects
 * @returns {Object} Hearings grouped by month
 */
export const groupHearingsByMonth = (hearings) => {
  const grouped = {};

  hearings.forEach((hearing) => {
    const month = dayjs(hearing.startDateTime).format("YYYY-MM");
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(hearing);
  });

  return grouped;
};

/**
 * Group hearings by court
 * @param {Array} hearings - Array of hearing objects
 * @returns {Object} Hearings grouped by court
 */
export const groupHearingsByCourt = (hearings) => {
  const grouped = {};

  hearings.forEach((hearing) => {
    const court = hearing.location?.courtName || "Unknown Court";
    if (!grouped[court]) {
      grouped[court] = [];
    }
    grouped[court].push(hearing);
  });

  return grouped;
};

/**
 * Calculate hearing statistics
 * @param {Array} hearings - Array of hearing objects
 * @returns {Object} Hearing statistics
 */
export const calculateHearingStatistics = (hearings) => {
  const now = new Date();

  return {
    total: hearings.length,
    scheduled: hearings.filter((h) => h.status === "scheduled").length,
    completed: hearings.filter((h) => h.status === "completed").length,
    adjourned: hearings.filter((h) => h.status === "adjourned").length,
    cancelled: hearings.filter((h) => h.status === "cancelled").length,
    upcoming: hearings.filter(
      (h) => new Date(h.startDateTime) > now && h.status === "scheduled",
    ).length,
    past: hearings.filter((h) => new Date(h.endDateTime) < now).length,
    urgent: hearings.filter((h) => isHearingUrgent(h)).length,
    autoSynced: hearings.filter((h) => isAutoSyncedHearing(h)).length,
    mentions: hearings.filter((h) => h.eventType === "mention").length,
    trials: hearings.filter((h) => h.eventType === "hearing").length,
  };
};

/**
 * Calculate deadline statistics
 * @param {Array} deadlines - Array of deadline objects
 * @returns {Object} Deadline statistics
 */
export const calculateDeadlineStatistics = (deadlines) => {
  const now = new Date();

  return {
    total: deadlines.length,
    pending: deadlines.filter(
      (d) => d.deadlineMetadata?.completionStatus === "pending",
    ).length,
    completed: deadlines.filter(
      (d) => d.deadlineMetadata?.completionStatus === "completed",
    ).length,
    overdue: deadlines.filter((d) => {
      const deadlineDate = new Date(d.endDateTime);
      return (
        deadlineDate < now && d.deadlineMetadata?.completionStatus === "pending"
      );
    }).length,
    dueThisWeek: deadlines.filter((d) => {
      const deadlineDate = new Date(d.endDateTime);
      const weekLater = new Date();
      weekLater.setDate(now.getDate() + 7);
      return (
        deadlineDate > now &&
        deadlineDate <= weekLater &&
        d.deadlineMetadata?.completionStatus === "pending"
      );
    }).length,
    critical: deadlines.filter((d) => getDeadlineUrgency(d).severity >= 3)
      .length,
  };
};

/**
 * Format hearing for display
 * @param {Object} hearing - Hearing object
 * @returns {Object} Formatted hearing data
 */
export const formatHearingForDisplay = (hearing) => {
  return {
    id: hearing._id,
    title: hearing.title,
    date: dayjs(hearing.startDateTime).format("MMM DD, YYYY"),
    time: dayjs(hearing.startDateTime).format("hh:mm A"),
    relativeTime: dayjs(hearing.startDateTime).fromNow(),
    court: hearing.location?.courtName || "Not specified",
    courtRoom: hearing.location?.courtRoom || "Not specified",
    judge: hearing.hearingMetadata?.judge || "Not specified",
    suitNumber: hearing.hearingMetadata?.suitNumber || "Not specified",
    type: hearing.eventType === "mention" ? "Mention" : "Hearing",
    status: hearing.status,
    priority: hearing.priority,
    isUrgent: isHearingUrgent(hearing),
    isAutoSynced: isAutoSyncedHearing(hearing),
    daysUntil: getDaysUntil(hearing.startDateTime),
  };
};

/**
 * Generate hearing reminder text
 * @param {Object} hearing - Hearing object
 * @returns {string} Reminder text
 */
export const generateHearingReminderText = (hearing) => {
  const daysUntil = getDaysUntil(hearing.startDateTime);
  const date = dayjs(hearing.startDateTime).format("MMM DD, YYYY [at] hh:mm A");
  const court = hearing.location?.courtName || "court";

  if (daysUntil === 0) {
    return `Reminder: Court hearing TODAY at ${court} - ${date}`;
  } else if (daysUntil === 1) {
    return `Reminder: Court hearing TOMORROW at ${court} - ${date}`;
  } else if (daysUntil <= 7) {
    return `Reminder: Court hearing in ${daysUntil} days at ${court} - ${date}`;
  }

  return `Upcoming court hearing at ${court} - ${date}`;
};

export default {
  getDaysUntil,
  getHoursUntil,
  isHearingUpcoming,
  isHearingUrgent,
  isAutoSyncedHearing,
  getHearingSyncStatus,
  getDeadlineUrgency,
  sortHearingsByUrgency,
  sortDeadlinesByUrgency,
  filterHearingsByCourt,
  filterHearingsByJudge,
  filterHearingsBySuitNumber,
  groupHearingsByMonth,
  groupHearingsByCourt,
  calculateHearingStatistics,
  calculateDeadlineStatistics,
  formatHearingForDisplay,
  generateHearingReminderText,
};
