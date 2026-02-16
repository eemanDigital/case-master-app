import { createSelector } from "@reduxjs/toolkit";

// ============================================
// BASE SELECTORS
// ============================================

const selectCalendarState = (state) => state.calendar;

// ============================================
// CALENDAR EVENTS SELECTORS
// ============================================

/**
 * Select all events with pagination data
 */
export const selectEvents = createSelector(
  [selectCalendarState],
  (calendar) => calendar.events,
);

/**
 * Select events array only
 */
export const selectEventsData = createSelector(
  [selectEvents],
  (events) => events.data || [],
);

/**
 * Select current event
 */
export const selectCurrentEvent = createSelector(
  [selectCalendarState],
  (calendar) => calendar.currentEvent,
);

/**
 * Select my calendar events
 */
export const selectMyCalendar = createSelector(
  [selectCalendarState],
  (calendar) => calendar.myCalendar,
);

/**
 * Select upcoming events
 */
export const selectUpcomingEvents = createSelector(
  [selectCalendarState],
  (calendar) => calendar.upcomingEvents,
);

/**
 * Select events by matter
 */
export const selectEventsByMatter = createSelector(
  [selectCalendarState],
  (calendar) => calendar.eventsByMatter,
);

/**
 * Select calendar statistics
 */
export const selectCalendarStats = createSelector(
  [selectCalendarState],
  (calendar) => calendar.calendarStats,
);

// ============================================
// BLOCKED DATES SELECTORS
// ============================================

/**
 * Select all blocked dates with pagination data
 */
export const selectBlockedDates = createSelector(
  [selectCalendarState],
  (calendar) => calendar.blockedDates,
);

/**
 * Select blocked dates array only
 */
export const selectBlockedDatesData = createSelector(
  [selectBlockedDates],
  (blockedDates) => blockedDates.data || [],
);

/**
 * Select current block
 */
export const selectCurrentBlock = createSelector(
  [selectCalendarState],
  (calendar) => calendar.currentBlock,
);

/**
 * Select my blocked dates
 */
export const selectMyBlockedDates = createSelector(
  [selectCalendarState],
  (calendar) => calendar.myBlockedDates,
);

/**
 * Select block check result
 */
export const selectBlockCheckResult = createSelector(
  [selectCalendarState],
  (calendar) => calendar.blockCheckResult,
);

// ============================================
// LOADING SELECTORS
// ============================================

/**
 * Select all loading states
 */
export const selectLoading = createSelector(
  [selectCalendarState],
  (calendar) => calendar.loading,
);

/**
 * Select events loading state
 */
export const selectEventsLoading = createSelector(
  [selectLoading],
  (loading) => loading.events,
);

/**
 * Select event loading state
 */
export const selectEventLoading = createSelector(
  [selectLoading],
  (loading) => loading.event,
);

/**
 * Select blocked dates loading state
 */
export const selectBlockedDatesLoading = createSelector(
  [selectLoading],
  (loading) => loading.blockedDates,
);

/**
 * Select block check loading state
 */
export const selectBlockCheckLoading = createSelector(
  [selectLoading],
  (loading) => loading.blockCheck,
);

/**
 * Select stats loading state
 */
export const selectStatsLoading = createSelector(
  [selectLoading],
  (loading) => loading.stats,
);

/**
 * Check if any loading is in progress
 */
export const selectIsAnyLoading = createSelector([selectLoading], (loading) =>
  Object.values(loading).some((isLoading) => isLoading),
);

// ============================================
// ERROR SELECTORS
// ============================================

/**
 * Select all error states
 */
export const selectErrors = createSelector(
  [selectCalendarState],
  (calendar) => calendar.error,
);

/**
 * Select events error
 */
export const selectEventsError = createSelector(
  [selectErrors],
  (errors) => errors.events,
);

/**
 * Select event error
 */
export const selectEventError = createSelector(
  [selectErrors],
  (errors) => errors.event,
);

/**
 * Select blocked dates error
 */
export const selectBlockedDatesError = createSelector(
  [selectErrors],
  (errors) => errors.blockedDates,
);

/**
 * Select block check error
 */
export const selectBlockCheckError = createSelector(
  [selectErrors],
  (errors) => errors.blockCheck,
);

/**
 * Select stats error
 */
export const selectStatsError = createSelector(
  [selectErrors],
  (errors) => errors.stats,
);

/**
 * Check if any error exists
 */
export const selectHasAnyError = createSelector([selectErrors], (errors) =>
  Object.values(errors).some((error) => error !== null),
);

// ============================================
// OPERATION STATUS SELECTORS
// ============================================

/**
 * Select operation status
 */
export const selectOperationStatus = createSelector(
  [selectCalendarState],
  (calendar) => calendar.operationStatus,
);

// ============================================
// COMPUTED/DERIVED SELECTORS
// ============================================

/**
 * Select events grouped by date
 */
export const selectEventsGroupedByDate = createSelector(
  [selectEventsData],
  (events) => {
    const grouped = {};

    events.forEach((event) => {
      const date = new Date(event.startDateTime).toISOString().split("T")[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  },
);

/**
 * Select events by type
 */
export const selectEventsByType = createSelector(
  [selectEventsData],
  (events) => {
    const byType = {};

    events.forEach((event) => {
      if (!byType[event.eventType]) {
        byType[event.eventType] = [];
      }
      byType[event.eventType].push(event);
    });

    return byType;
  },
);

/**
 * Select events by status
 */
export const selectEventsByStatus = createSelector(
  [selectEventsData],
  (events) => {
    const byStatus = {};

    events.forEach((event) => {
      if (!byStatus[event.status]) {
        byStatus[event.status] = [];
      }
      byStatus[event.status].push(event);
    });

    return byStatus;
  },
);

/**
 * Select upcoming events count
 */
export const selectUpcomingEventsCount = createSelector(
  [selectUpcomingEvents],
  (events) => events.length,
);

/**
 * Select active blocked dates
 */
export const selectActiveBlockedDates = createSelector(
  [selectBlockedDatesData],
  (blocks) => blocks.filter((block) => block.isActive),
);

/**
 * Select blocked dates by scope
 */
export const selectBlockedDatesByScope = createSelector(
  [selectBlockedDatesData],
  (blocks) => {
    const byScope = {};

    blocks.forEach((block) => {
      if (!byScope[block.blockScope]) {
        byScope[block.blockScope] = [];
      }
      byScope[block.blockScope].push(block);
    });

    return byScope;
  },
);

/**
 * Select today's events
 */
export const selectTodaysEvents = createSelector(
  [selectEventsData],
  (events) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter((event) => {
      const eventDate = new Date(event.startDateTime);
      return eventDate >= today && eventDate < tomorrow;
    });
  },
);

/**
 * Select this week's events
 */
export const selectThisWeeksEvents = createSelector(
  [selectEventsData],
  (events) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return events.filter((event) => {
      const eventDate = new Date(event.startDateTime);
      return eventDate >= startOfWeek && eventDate < endOfWeek;
    });
  },
);

/**
 * Select overdue events (past scheduled events)
 */
export const selectOverdueEvents = createSelector(
  [selectEventsData],
  (events) => {
    const now = new Date();

    return events.filter((event) => {
      const eventDate = new Date(event.endDateTime);
      return (
        eventDate < now &&
        (event.status === "scheduled" || event.status === "confirmed")
      );
    });
  },
);

/**
 * Select event by ID factory
 */
export const makeSelectEventById = () =>
  createSelector(
    [selectEventsData, (_, eventId) => eventId],
    (events, eventId) => events.find((event) => event._id === eventId),
  );

/**
 * Select blocked date by ID factory
 */
export const makeSelectBlockedDateById = () =>
  createSelector(
    [selectBlockedDatesData, (_, blockId) => blockId],
    (blocks, blockId) => blocks.find((block) => block._id === blockId),
  );

/**
 * Select if date is blocked
 */
export const selectIsDateBlocked = createSelector(
  [selectBlockCheckResult],
  (result) => result?.isBlocked || false,
);

/**
 * Select if date has warning
 */
export const selectDateHasWarning = createSelector(
  [selectBlockCheckResult],
  (result) => result?.hasWarning || false,
);

// ============================================
// PAGINATION SELECTORS
// ============================================

/**
 * Select events pagination info
 */
export const selectEventsPagination = createSelector(
  [selectEvents],
  (events) => ({
    page: events.page,
    total: events.total,
    results: events.results,
    hasMore: events.page * events.results < events.total,
  }),
);

/**
 * Select blocked dates pagination info
 */
export const selectBlockedDatesPagination = createSelector(
  [selectBlockedDates],
  (blockedDates) => ({
    page: blockedDates.page,
    total: blockedDates.total,
    results: blockedDates.results,
    hasMore: blockedDates.page * blockedDates.results < blockedDates.total,
  }),
);

// ============================================
// COURT HEARINGS SELECTORS
// ============================================

/**
 * Helper function to check if date is today
 */
const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Select all court hearings (hearing and mention types)
 */
export const selectAllCourtHearings = createSelector(
  [selectEventsData],
  (events) => {
    return events.filter(
      (event) =>
        (event.eventType === "hearing" || event.eventType === "mention") &&
        !event.isDeleted,
    );
  },
);

/**
 * Select today's court hearings
 */
export const selectTodayCourtHearings = createSelector(
  [selectAllCourtHearings],
  (courtHearings) => {
    const todayHearings = courtHearings.filter(
      (event) => isToday(event.startDateTime) && event.status !== "cancelled",
    );

    return todayHearings.sort(
      (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime),
    );
  },
);

/**
 * Select upcoming court hearings (including today)
 */
export const selectUpcomingCourtHearings = createSelector(
  [selectAllCourtHearings],
  (courtHearings) => {
    const now = new Date();

    const upcoming = courtHearings.filter(
      (event) =>
        new Date(event.startDateTime) >= now && event.status !== "cancelled",
    );

    return upcoming.sort(
      (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime),
    );
  },
);

/**
 * Select urgent upcoming hearings (within 3 days)
 */
export const selectUrgentUpcomingHearings = createSelector(
  [selectUpcomingCourtHearings],
  (hearings) => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return hearings.filter((hearing) => {
      const hearingDate = new Date(hearing.startDateTime);
      return hearingDate <= threeDaysFromNow;
    });
  },
);

/**
 * Select court hearing statistics
 */
export const selectCourtHearingStatistics = createSelector(
  [selectAllCourtHearings],
  (courtHearings) => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: courtHearings.length,
      upcoming: courtHearings.filter(
        (h) =>
          new Date(h.startDateTime) >= now &&
          h.status !== "cancelled" &&
          h.status !== "completed",
      ).length,
      today: courtHearings.filter(
        (h) => isToday(h.startDateTime) && h.status !== "cancelled",
      ).length,
      thisWeek: courtHearings.filter(
        (h) =>
          new Date(h.startDateTime) >= now &&
          new Date(h.startDateTime) <= weekFromNow &&
          h.status !== "cancelled",
      ).length,
      completed: courtHearings.filter((h) => h.status === "completed").length,
      adjourned: courtHearings.filter(
        (h) =>
          h.tags?.includes("adjourned") || h.tags?.includes("next-hearing"),
      ).length,
      autoSynced: courtHearings.filter((h) => h.tags?.includes("auto-synced"))
        .length,
    };
  },
);

/**
 * Select hearings happening now
 */
export const selectHearingsInProgress = createSelector(
  [selectTodayCourtHearings],
  (todayHearings) => {
    const now = new Date();

    return todayHearings.filter((hearing) => {
      const start = new Date(hearing.startDateTime);
      const end = new Date(hearing.endDateTime);
      return now >= start && now <= end;
    });
  },
);

/**
 * Select hearings by court
 */
export const selectHearingsByCourt = createSelector(
  [selectUpcomingCourtHearings],
  (hearings) => {
    const byCourt = {};

    hearings.forEach((hearing) => {
      const court = hearing.location?.courtName || "Unknown Court";
      if (!byCourt[court]) {
        byCourt[court] = [];
      }
      byCourt[court].push(hearing);
    });

    return byCourt;
  },
);

// ============================================
// CALENDAR SYNC SELECTORS
// ============================================

/**
 * Select synced hearing events
 */
export const selectSyncedHearingEvents = createSelector(
  [selectEventsData],
  (events) =>
    events.filter(
      (event) =>
        event.hearingMetadata?.hearingId && event.tags?.includes("auto-synced"),
    ),
);

/**
 * Select court hearing events
 */
export const selectCourtHearingEvents = createSelector(
  [selectEventsData],
  (events) =>
    events.filter(
      (event) =>
        event.eventType === "hearing" ||
        event.eventType === "mention" ||
        event.tags?.includes("court-hearing"),
    ),
);

/**
 * Select court order deadline events
 */
export const selectCourtOrderDeadlines = createSelector(
  [selectEventsData],
  (events) =>
    events.filter(
      (event) =>
        event.eventType === "court_order_deadline" ||
        event.deadlineMetadata?.deadlineType === "court_order",
    ),
);

/**
 * Select pending court order deadlines
 */
export const selectPendingCourtOrderDeadlines = createSelector(
  [selectCourtOrderDeadlines],
  (deadlines) =>
    deadlines.filter(
      (deadline) =>
        deadline.deadlineMetadata?.completionStatus === "pending" &&
        deadline.status === "scheduled",
    ),
);

/**
 * Select hearing events by matter (factory)
 */
export const makeSelectHearingEventsByMatter = () =>
  createSelector(
    [selectEventsData, (_, matterId) => matterId],
    (events, matterId) =>
      events.filter(
        (event) =>
          event.matter === matterId &&
          (event.eventType === "hearing" || event.eventType === "mention"),
      ),
  );

/**
 * Select next scheduled hearing
 */
export const selectNextScheduledHearing = createSelector(
  [selectCourtHearingEvents],
  (hearings) => {
    const now = new Date();
    const futureHearings = hearings
      .filter(
        (hearing) =>
          new Date(hearing.startDateTime) > now &&
          hearing.status === "scheduled",
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      );

    return futureHearings.length > 0 ? futureHearings[0] : null;
  },
);

/**
 * Select overdue court order deadlines
 */
export const selectOverdueCourtOrderDeadlines = createSelector(
  [selectCourtOrderDeadlines],
  (deadlines) => {
    const now = new Date();

    return deadlines.filter((deadline) => {
      const deadlineDate = new Date(deadline.endDateTime);
      return (
        deadlineDate < now &&
        deadline.deadlineMetadata?.completionStatus === "pending"
      );
    });
  },
);

/**
 * Select hearings by matter with next hearing (factory)
 */
export const makeSelectMatterHearingsWithNext = () =>
  createSelector(
    [selectEventsData, (_, matterId) => matterId],
    (events, matterId) => {
      const matterHearings = events.filter(
        (event) =>
          event.matter === matterId &&
          (event.eventType === "hearing" || event.eventType === "mention"),
      );

      const now = new Date();
      const nextHearing = matterHearings
        .filter(
          (h) => new Date(h.startDateTime) > now && h.status === "scheduled",
        )
        .sort(
          (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime),
        )[0];

      return {
        allHearings: matterHearings,
        nextHearing: nextHearing || null,
        totalHearings: matterHearings.length,
      };
    },
  );

/**
 * Select completed hearings
 */
export const selectCompletedHearings = createSelector(
  [selectCourtHearingEvents],
  (hearings) => hearings.filter((hearing) => hearing.status === "completed"),
);

/**
 * Select adjourned hearings
 */
export const selectAdjournedHearings = createSelector(
  [selectCourtHearingEvents],
  (hearings) => hearings.filter((hearing) => hearing.status === "adjourned"),
);

/**
 * Select court order deadline statistics
 */
export const selectCourtOrderDeadlineStatistics = createSelector(
  [selectCourtOrderDeadlines],
  (deadlines) => {
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
          deadlineDate < now &&
          d.deadlineMetadata?.completionStatus === "pending"
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
    };
  },
);

/**
 * Select events by court (factory)
 */
export const makeSelectEventsByCourt = () =>
  createSelector(
    [selectCourtHearingEvents, (_, courtName) => courtName],
    (hearings, courtName) =>
      hearings.filter(
        (hearing) =>
          hearing.location?.courtName?.toLowerCase() ===
          courtName?.toLowerCase(),
      ),
  );

/**
 * Select events by judge (factory)
 */
export const makeSelectEventsByJudge = () =>
  createSelector(
    [selectCourtHearingEvents, (_, judgeName) => judgeName],
    (hearings, judgeName) =>
      hearings.filter(
        (hearing) =>
          hearing.hearingMetadata?.judge?.toLowerCase() ===
          judgeName?.toLowerCase(),
      ),
  );

/**
 * Select events by suit number (factory)
 */
export const makeSelectEventsBySuitNumber = () =>
  createSelector(
    [selectCourtHearingEvents, (_, suitNumber) => suitNumber],
    (hearings, suitNumber) =>
      hearings.filter(
        (hearing) =>
          hearing.hearingMetadata?.suitNumber?.toLowerCase() ===
          suitNumber?.toLowerCase(),
      ),
  );
