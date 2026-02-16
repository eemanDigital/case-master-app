import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  EVENT_TYPE_COLORS,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from "./calendarConstants";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// ============================================
// DATE & TIME UTILITIES
// ============================================

/**
 * Format date for display
 */
export const formatDate = (date, format = "MMM DD, YYYY") => {
  return dayjs(date).format(format);
};

/**
 * Format time for display
 */
export const formatTime = (date, format = "hh:mm A") => {
  return dayjs(date).format(format);
};

/**
 * Format date and time for display
 */
export const formatDateTime = (date, format = "MMM DD, YYYY hh:mm A") => {
  return dayjs(date).format(format);
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTime = (date) => {
  const now = dayjs();
  const target = dayjs(date);
  const diffInMinutes = target.diff(now, "minute");

  if (diffInMinutes < 0) {
    return dayjs(date).fromNow();
  }

  if (diffInMinutes < 60) {
    return `in ${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}`;
  }

  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `in ${hours} hour${hours !== 1 ? "s" : ""}`;
  }

  const days = Math.floor(diffInMinutes / 1440);
  return `in ${days} day${days !== 1 ? "s" : ""}`;
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  return dayjs(date).isSame(dayjs(), "day");
};

/**
 * Check if date is tomorrow
 */
export const isTomorrow = (date) => {
  return dayjs(date).isSame(dayjs().add(1, "day"), "day");
};

/**
 * Check if date is in the past
 */
export const isPast = (date) => {
  return dayjs(date).isBefore(dayjs());
};

/**
 * Check if date is in the future
 */
export const isFuture = (date) => {
  return dayjs(date).isAfter(dayjs());
};

/**
 * Get duration between two dates in minutes
 */
export const getDuration = (startDate, endDate) => {
  return dayjs(endDate).diff(dayjs(startDate), "minute");
};

/**
 * Format duration for display
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr${hours !== 1 ? "s" : ""}`;
  }

  return `${hours} hr${hours !== 1 ? "s" : ""} ${mins} min`;
};

/**
 * Check if two date ranges overlap
 */
export const doRangesOverlap = (start1, end1, start2, end2) => {
  const s1 = dayjs(start1);
  const e1 = dayjs(end1);
  const s2 = dayjs(start2);
  const e2 = dayjs(end2);

  return s1.isBefore(e2) && e1.isAfter(s2);
};

/**
 * Get week start and end dates
 */
export const getWeekRange = (date = new Date()) => {
  const start = dayjs(date).startOf("week");
  const end = dayjs(date).endOf("week");
  return { start: start.toDate(), end: end.toDate() };
};

/**
 * Get month start and end dates
 */
export const getMonthRange = (date = new Date()) => {
  const start = dayjs(date).startOf("month");
  const end = dayjs(date).endOf("month");
  return { start: start.toDate(), end: end.toDate() };
};

// ============================================
// EVENT UTILITIES
// ============================================

/**
 * Get event color based on type
 */
export const getEventColor = (event) => {
  if (event.color) return event.color;
  return EVENT_TYPE_COLORS[event.eventType] || "#1890ff";
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || "#1890ff";
};

/**
 * Get priority badge color
 */
export const getPriorityColor = (priority) => {
  return PRIORITY_COLORS[priority] || "#1890ff";
};

/**
 * Check if event is happening now
 */
export const isEventNow = (event) => {
  const now = dayjs();
  return now.isBetween(
    dayjs(event.startDateTime),
    dayjs(event.endDateTime),
    null,
    "[]",
  );
};

/**
 * Check if event is upcoming (within next 24 hours)
 */
export const isEventUpcoming = (event) => {
  const now = dayjs();
  const eventStart = dayjs(event.startDateTime);
  return eventStart.isAfter(now) && eventStart.diff(now, "hour") <= 24;
};

/**
 * Group events by date
 */
export const groupEventsByDate = (events) => {
  const grouped = {};

  events.forEach((event) => {
    const dateKey = formatDate(event.startDateTime, "YYYY-MM-DD");
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });

  return grouped;
};

/**
 * Sort events by start time
 */
export const sortEventsByTime = (events) => {
  return [...events].sort((a, b) => {
    return dayjs(a.startDateTime).diff(dayjs(b.startDateTime));
  });
};

/**
 * Filter events by date range
 */
export const filterEventsByDateRange = (events, startDate, endDate) => {
  return events.filter((event) => {
    const eventStart = dayjs(event.startDateTime);
    return (
      eventStart.isSameOrAfter(startDate) && eventStart.isSameOrBefore(endDate)
    );
  });
};

/**
 * Filter events by status
 */
export const filterEventsByStatus = (events, statuses) => {
  if (!statuses || statuses.length === 0) return events;
  return events.filter((event) => statuses.includes(event.status));
};

/**
 * Filter events by type
 */
export const filterEventsByType = (events, types) => {
  if (!types || types.length === 0) return events;
  return events.filter((event) => types.includes(event.eventType));
};

/**
 * Search events
 */
export const searchEvents = (events, query) => {
  if (!query) return events;

  const lowerQuery = query.toLowerCase();
  return events.filter(
    (event) =>
      event.title?.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.eventId?.toLowerCase().includes(lowerQuery),
  );
};

// ============================================
// CALENDAR VIEW UTILITIES
// ============================================

/**
 * Get calendar days for month view
 */
export const getCalendarDays = (date) => {
  const firstDay = dayjs(date).startOf("month");
  const lastDay = dayjs(date).endOf("month");
  const startDate = firstDay.startOf("week");
  const endDate = lastDay.endOf("week");

  const days = [];
  let currentDate = startDate;

  while (currentDate.isSameOrBefore(endDate)) {
    days.push(currentDate.toDate());
    currentDate = currentDate.add(1, "day");
  }

  return days;
};

/**
 * Get events for specific date
 */
export const getEventsForDate = (events, date) => {
  return events.filter((event) => {
    const eventDate = dayjs(event.startDateTime);
    return eventDate.isSame(dayjs(date), "day");
  });
};

/**
 * Check if date has events
 */
export const dateHasEvents = (events, date) => {
  return getEventsForDate(events, date).length > 0;
};

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate event time range
 */
export const validateEventTimeRange = (startDateTime, endDateTime) => {
  if (!startDateTime || !endDateTime) {
    return { valid: false, message: "Start and end times are required" };
  }

  if (dayjs(endDateTime).isSameOrBefore(dayjs(startDateTime))) {
    return { valid: false, message: "End time must be after start time" };
  }

  return { valid: true };
};

/**
 * Check for event conflicts
 */
export const checkEventConflicts = (events, newEvent, excludeId = null) => {
  const conflicts = events.filter((event) => {
    if (excludeId && event._id === excludeId) return false;

    return doRangesOverlap(
      newEvent.startDateTime,
      newEvent.endDateTime,
      event.startDateTime,
      event.endDateTime,
    );
  });

  return conflicts;
};

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format event time range
 */
export const formatEventTimeRange = (event) => {
  if (event.isAllDay) {
    return "All Day";
  }

  const start = formatTime(event.startDateTime);
  const end = formatTime(event.endDateTime);

  return `${start} - ${end}`;
};

/**
 * Format event date range
 */
export const formatEventDateRange = (event) => {
  const startDate = dayjs(event.startDateTime);
  const endDate = dayjs(event.endDateTime);

  if (startDate.isSame(endDate, "day")) {
    return formatDate(event.startDateTime);
  }

  return `${formatDate(event.startDateTime)} - ${formatDate(event.endDateTime)}`;
};

/**
 * Get event display title with time
 */
export const getEventDisplayTitle = (event) => {
  const time = formatEventTimeRange(event);
  return `${time} - ${event.title}`;
};

// ============================================
// STATISTICS UTILITIES
// ============================================

/**
 * Get event statistics for date range
 */
export const getEventStatistics = (events) => {
  const stats = {
    total: events.length,
    byType: {},
    byStatus: {},
    byPriority: {},
    upcoming: 0,
    past: 0,
    today: 0,
  };

  events.forEach((event) => {
    // Count by type
    stats.byType[event.eventType] = (stats.byType[event.eventType] || 0) + 1;

    // Count by status
    stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;

    // Count by priority
    stats.byPriority[event.priority] =
      (stats.byPriority[event.priority] || 0) + 1;

    // Count by time
    if (isToday(event.startDateTime)) {
      stats.today++;
    } else if (isFuture(event.startDateTime)) {
      stats.upcoming++;
    } else {
      stats.past++;
    }
  });

  return stats;
};

// ============================================
// EXPORT UTILITIES
// ============================================

/**
 * Convert event to calendar format (ICS)
 */
export const convertToICSFormat = (event) => {
  // Simplified ICS format for download
  return {
    summary: event.title,
    start: dayjs(event.startDateTime).format("YYYYMMDDTHHmmss"),
    end: dayjs(event.endDateTime).format("YYYYMMDDTHHmmss"),
    description: event.description || "",
    location: event.location?.address || "",
  };
};
