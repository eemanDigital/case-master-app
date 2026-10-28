const {
  GRACE_PERIOD_HOURS,
  getHearingPhaseInfo,
} = require("../utils/hearingPhase");

describe("getHearingPhaseInfo", () => {
  const hearingDate = new Date("2026-10-20T10:00:00.000Z");
  const gracePeriodEnd = new Date(
    hearingDate.getTime() + GRACE_PERIOD_HOURS * 60 * 60 * 1000,
  );

  it("starts the report window at the exact hearing time", () => {
    const phase = getHearingPhaseInfo(
      hearingDate,
      false,
      null,
      hearingDate,
    );

    expect(phase.phase).toBe("report");
    expect(phase.isWithinGracePeriod).toBe(true);
  });

  it("keeps the report window open one millisecond before the cutoff", () => {
    const phase = getHearingPhaseInfo(
      hearingDate,
      false,
      null,
      new Date(gracePeriodEnd.getTime() - 1),
    );

    expect(phase.phase).toBe("report");
  });

  it("locks reports at exactly 48 elapsed hours", () => {
    const phase = getHearingPhaseInfo(
      hearingDate,
      false,
      null,
      gracePeriodEnd,
    );

    expect(phase.phase).toBe("locked");
    expect(phase.isAfterGracePeriod).toBe(true);
  });

  it("keeps lawyer assignment open when a future next session exists", () => {
    const phase = getHearingPhaseInfo(
      hearingDate,
      true,
      "2026-11-25T10:00:00.000Z",
      gracePeriodEnd,
    );

    expect(phase.phase).toBe("locked");
    expect(phase.canAssignLawyers).toBe(true);
  });
});
