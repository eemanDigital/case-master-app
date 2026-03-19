import { describe, it, expect } from "vitest";
import {
  formatYear,
  formatDate,
  deepDateFormat,
} from "../../utils/formatDate";

describe("formatDate utils", () => {
  describe("formatYear", () => {
    it("should extract year from a valid date", () => {
      expect(formatYear(new Date("2024-06-15"))).toBe(2024);
      expect(formatYear("2023-12-31")).toBe(2023);
      expect(formatYear("2025-01-01")).toBe(2025);
    });
  });

  describe("formatDate", () => {
    it("should format a valid date correctly", () => {
      const result = formatDate("2024-06-15");
      expect(result).toBe("June 15, 2024");
    });

    it("should return N/A for invalid date string", () => {
      expect(formatDate("invalid-date")).toBe("N/A");
      expect(formatDate("")).toBe("N/A");
    });

    it("should format different months correctly", () => {
      expect(formatDate("2024-01-01")).toContain("January");
      expect(formatDate("2024-02-15")).toContain("February");
      expect(formatDate("2024-12-25")).toContain("December");
    });
  });

  describe("deepDateFormat", () => {
    it("should return Just now for very recent dates", () => {
      const now = new Date();
      expect(deepDateFormat(now)).toBe("Just now");
    });

    it("should return minutes ago for dates within an hour", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(deepDateFormat(fiveMinutesAgo)).toBe("5 minutes ago");
    });

    it("should return hours ago for dates within a day", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(deepDateFormat(twoHoursAgo)).toBe("2 hours ago");
    });

    it("should return days ago for dates older than 24 hours", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(deepDateFormat(threeDaysAgo)).toBe("3 days ago");
    });

    it("should handle singular forms correctly", () => {
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
      expect(deepDateFormat(oneMinuteAgo)).toBe("1 minute ago");

      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      expect(deepDateFormat(oneHourAgo)).toBe("1 hour ago");

      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      expect(deepDateFormat(oneDayAgo)).toBe("1 day ago");
    });
  });
});
