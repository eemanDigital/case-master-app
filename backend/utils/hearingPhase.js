const GRACE_PERIOD_HOURS = 48;
const GRACE_PERIOD_MS = GRACE_PERIOD_HOURS * 60 * 60 * 1000;

const getHearingPhaseInfo = (
  hearingDate,
  hasOutcome,
  nextHearingDate = null,
  currentTime = new Date(),
) => {
  const hearingTime = new Date(hearingDate).getTime();
  const nowTime = new Date(currentTime).getTime();

  if (!Number.isFinite(hearingTime) || !Number.isFinite(nowTime)) {
    throw new TypeError("Hearing date and current time must be valid dates.");
  }

  const gracePeriodEndTime = hearingTime + GRACE_PERIOD_MS;
  const isBeforeHearing = nowTime < hearingTime;
  const isWithinGracePeriod =
    nowTime >= hearingTime && nowTime < gracePeriodEndTime;
  const isAfterGracePeriod = nowTime >= gracePeriodEndTime;
  const nextSessionTime = nextHearingDate
    ? new Date(nextHearingDate).getTime()
    : Number.NaN;
  const hasUpcomingNextSession =
    Number.isFinite(nextSessionTime) && nextSessionTime > nowTime;

  let phase;
  if (isBeforeHearing) {
    phase = "schedule";
  } else if (isWithinGracePeriod) {
    phase = hasOutcome ? "edit" : "report";
  } else {
    phase = "locked";
  }

  return {
    phase,
    isBeforeHearing,
    isWithinGracePeriod,
    isAfterGracePeriod,
    gracePeriodEnd: new Date(gracePeriodEndTime),
    hasUpcomingNextSession,
    canAssignLawyers: isBeforeHearing || hasUpcomingNextSession,
  };
};

module.exports = {
  GRACE_PERIOD_HOURS,
  getHearingPhaseInfo,
};
