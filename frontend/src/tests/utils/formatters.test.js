import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatCurrency,
  formatNumber,
  truncateText,
  capitalizeFirstLetter,
  formatName,
  isValidEmail,
  isValidPhone,
  isValidDate,
  getFileExtension,
  formatFileSize,
  buildQueryString,
  debounce,
} from "../../utils/formatters";

describe("formatters", () => {
  describe("formatCurrency", () => {
    it("should format currency correctly", () => {
      const result = formatCurrency(1000, "NGN");
      expect(result).toContain("1,000");
    });

    it("should return - for null or undefined", () => {
      expect(formatCurrency(null)).toBe("-");
      expect(formatCurrency(undefined)).toBe("-");
    });

    it("should format with 2 decimal places", () => {
      const result = formatCurrency(1234.5, "NGN");
      expect(result).toContain("1,234.50");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers with thousand separators", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1000000)).toBe("1,000,000");
    });

    it("should return - for null or undefined", () => {
      expect(formatNumber(null)).toBe("-");
      expect(formatNumber(undefined)).toBe("-");
    });
  });

  describe("truncateText", () => {
    it("should truncate text longer than maxLength", () => {
      const result = truncateText("This is a very long text", 10);
      expect(result).toBe("This is a ...");
    });

    it("should not truncate text shorter than maxLength", () => {
      const result = truncateText("Short", 10);
      expect(result).toBe("Short");
    });

    it("should return - for null or undefined", () => {
      expect(truncateText(null)).toBe("-");
      expect(truncateText(undefined)).toBe("-");
    });

    it("should use default maxLength of 50", () => {
      const longText = "a".repeat(60);
      const result = truncateText(longText);
      expect(result).toBe(`${"a".repeat(50)}...`);
    });
  });

  describe("capitalizeFirstLetter", () => {
    it("should capitalize first letter", () => {
      expect(capitalizeFirstLetter("hello")).toBe("Hello");
      expect(capitalizeFirstLetter("world")).toBe("World");
    });

    it("should return empty string for null or undefined", () => {
      expect(capitalizeFirstLetter(null)).toBe("");
      expect(capitalizeFirstLetter("")).toBe("");
    });
  });

  describe("formatName", () => {
    it("should format full name correctly", () => {
      expect(formatName("John", "Doe")).toBe("John Doe");
    });

    it("should handle missing first or last name", () => {
      expect(formatName("John", null)).toBe("John");
      expect(formatName(null, "Doe")).toBe("Doe");
    });

    it("should return - if both names are missing", () => {
      expect(formatName(null, null)).toBe("-");
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("no@domain")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
    });
  });

  describe("isValidPhone", () => {
    it("should validate correct phone numbers", () => {
      expect(isValidPhone("+2348012345678")).toBe(true);
      expect(isValidPhone("08012345678")).toBe(true);
      expect(isValidPhone("+1 (555) 123-4567")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(isValidPhone("abc")).toBe(false);
      expect(isValidPhone("")).toBe(false);
    });
  });

  describe("isValidDate", () => {
    it("should validate correct dates", () => {
      expect(isValidDate("2024-06-15")).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });

    it("should reject invalid dates", () => {
      expect(isValidDate("invalid")).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe("getFileExtension", () => {
    it("should extract file extension", () => {
      expect(getFileExtension("document.pdf")).toBe("pdf");
      expect(getFileExtension("image.png")).toBe("png");
    });

    it("should return lowercase extension", () => {
      expect(getFileExtension("file.PDF")).toBe("pdf");
    });

    it("should return empty string for null or undefined", () => {
      expect(getFileExtension(null)).toBe("");
      expect(getFileExtension("")).toBe("");
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
    });

    it("should format to 2 decimal places", () => {
      const result = formatFileSize(1536);
      expect(result).toBe("1.5 KB");
    });
  });

  describe("buildQueryString", () => {
    it("should build query string from params", () => {
      const params = { page: 1, limit: 10 };
      const result = buildQueryString(params);
      expect(result).toBe("?page=1&limit=10");
    });

    it("should filter out null, undefined, and empty values", () => {
      const params = { page: 1, search: "", filter: null };
      const result = buildQueryString(params);
      expect(result).toBe("?page=1");
    });

    it("should return empty string for empty params", () => {
      expect(buildQueryString({})).toBe("");
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should delay function execution", () => {
      const callback = vi.fn();
      const fn = debounce(callback, 100);

      fn();
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should only call function once for multiple rapid calls", () => {
      const callback = vi.fn();
      const fn = debounce(callback, 100);

      fn();
      fn();
      fn();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should call with latest arguments", () => {
      const callback = vi.fn();
      const fn = debounce(callback, 100);

      fn("first");
      vi.advanceTimersByTime(99);
      fn("second");
      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledWith("second");
    });
  });
});
