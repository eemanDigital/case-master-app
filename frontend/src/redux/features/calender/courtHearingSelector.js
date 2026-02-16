// Add these selectors to your existing calenderSelector.js file
// These should be added at the end of the file

import { createSelector } from "@reduxjs/toolkit";

// ============================================
// COURT HEARINGS SPECIFIC SELECTORS
// ============================================

// Helper function to check if date is today
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
  [selectEventsData], // Use your existing selector
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
