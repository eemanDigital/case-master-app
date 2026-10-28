import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);

export const GRACE_PERIOD_HOURS = 48;

// Server-side checks remain authoritative; this mirrors them for UI state.
export const getPhaseInfo = (
  hearingDate,
  hasOutcome,
  nextHearingDate = null,
  currentTime = dayjs(),
) => {
  const now = dayjs(currentTime);
  const hearing = dayjs(hearingDate);
  const gracePeriodEnd = hearing.add(GRACE_PERIOD_HOURS, "hour");

  const isBeforeHearing = now.isBefore(hearing);
  const isWithinGracePeriod =
    now.isSameOrAfter(hearing) && now.isBefore(gracePeriodEnd);
  const isAfterGracePeriod = now.isSameOrAfter(gracePeriodEnd);

  const hoursRemaining = isWithinGracePeriod
    ? Math.max(0, gracePeriodEnd.diff(now, "hour"))
    : 0;
  const minutesRemaining = isWithinGracePeriod
    ? Math.max(0, gracePeriodEnd.diff(now, "minute") % 60)
    : 0;

  let phase;
  if (isBeforeHearing) {
    phase = "schedule";
  } else if (isWithinGracePeriod) {
    phase = hasOutcome ? "edit" : "report";
  } else {
    phase = "locked";
  }

  let displayStatus;
  if (hasOutcome) {
    displayStatus = "completed";
  } else if (hearing.isSame(now, "day")) {
    displayStatus = "today";
  } else if (isBeforeHearing) {
    displayStatus = "upcoming";
  } else if (isWithinGracePeriod) {
    displayStatus = "pending";
  } else {
    displayStatus = "overdue";
  }

  const hasUpcomingNextSession =
    !!nextHearingDate && dayjs(nextHearingDate).isAfter(now);

  return {
    phase,
    displayStatus,
    isBeforeHearing,
    isWithinGracePeriod,
    isAfterGracePeriod,
    hoursRemaining,
    minutesRemaining,
    gracePeriodEnd,
    hearingDate: hearing,
    isUrgent: isWithinGracePeriod && hoursRemaining < 12,
    isCritical: isWithinGracePeriod && hoursRemaining < 4,
    canAssignLawyers: isBeforeHearing || hasUpcomingNextSession,
    hasUpcomingNextSession,
  };
};
