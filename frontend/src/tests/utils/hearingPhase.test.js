import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import {
  getPhaseInfo,
  GRACE_PERIOD_HOURS,
} from "../../utils/hearingPhase";

describe("getPhaseInfo", () => {
  const hearingDate = dayjs("2026-10-20T10:00:00.000Z");
  const gracePeriodEnd = hearingDate.add(GRACE_PERIOD_HOURS, "hour");

  it("uses the exact hearing time as the start of the report window", () => {
    const phase = getPhaseInfo(
      hearingDate,
      false,
      null,
      hearingDate,
    );

    expect(phase.phase).toBe("report");
    expect(phase.isWithinGracePeriod).toBe(true);
  });

  it("keeps the report window open until the exact 48-hour cutoff", () => {
    const phase = getPhaseInfo(
      hearingDate,
      false,
      null,
      gracePeriodEnd.subtract(1, "millisecond"),
    );

    expect(phase.phase).toBe("report");
    expect(phase.isWithinGracePeriod).toBe(true);
  });

  it("locks the report window at exactly 48 elapsed hours", () => {
    const phase = getPhaseInfo(
      hearingDate,
      false,
      null,
      gracePeriodEnd,
    );

    expect(phase.phase).toBe("locked");
    expect(phase.isAfterGracePeriod).toBe(true);
  });

  it("allows lawyer assignment for a future next session after the report window", () => {
    const phase = getPhaseInfo(
      hearingDate,
      true,
      "2026-11-25T10:00:00.000Z",
      gracePeriodEnd,
    );

    expect(phase.phase).toBe("locked");
    expect(phase.canAssignLawyers).toBe(true);
    expect(phase.hasUpcomingNextSession).toBe(true);
  });
});
