import { describe, it, expect } from "vitest";
import { validatePassword, formatPhoneNumber } from "../../utils/validation";

describe("validation utils", () => {
  describe("validatePassword", () => {
    it("should reject empty password", async () => {
      await expect(validatePassword(null, "")).rejects.toThrow(
        "Password is required"
      );
    });

    it("should reject password shorter than 8 characters", async () => {
      await expect(validatePassword(null, "Abc1!")).rejects.toThrow(
        "Password must be at least 8 characters long"
      );
    });

    it("should reject password without uppercase letter", async () => {
      await expect(validatePassword(null, "abcdefg1!")).rejects.toThrow(
        "Password must contain at least one uppercase letter"
      );
    });

    it("should reject password without lowercase letter", async () => {
      await expect(validatePassword(null, "ABCDEFG1!")).rejects.toThrow(
        "Password must contain at least one lowercase letter"
      );
    });

    it("should reject password without number", async () => {
      await expect(validatePassword(null, "Abcdefg!")).rejects.toThrow(
        "Password must contain at least one number"
      );
    });

    it("should reject password without special character", async () => {
      await expect(validatePassword(null, "Abcdefg1")).rejects.toThrow(
        "Password must contain at least one special character"
      );
    });

    it("should accept valid password", async () => {
      await expect(validatePassword(null, "Password1!")).resolves.toBe(
        undefined
      );
    });
  });

  describe("formatPhoneNumber", () => {
    it("should convert Nigerian numbers starting with 0", () => {
      expect(formatPhoneNumber("08012345678")).toBe("+2348012345678");
      expect(formatPhoneNumber("08123456789")).toBe("+2348123456789");
    });

    it("should handle numbers with spaces and dashes", () => {
      expect(formatPhoneNumber("080 1234 5678")).toBe("+2348012345678");
      expect(formatPhoneNumber("080-123-456-78")).toBe("+2348012345678");
    });

    it("should handle numbers with parentheses", () => {
      expect(formatPhoneNumber("(080) 12345678")).toBe("+2348012345678");
    });

    it("should preserve already formatted international numbers", () => {
      expect(formatPhoneNumber("+2348012345678")).toBe("+2348012345678");
      expect(formatPhoneNumber("+15551234567")).toBe("+15551234567");
    });

    it("should handle 10-digit local numbers", () => {
      expect(formatPhoneNumber("8012345678")).toBe("+2348012345678");
    });

    it("should return empty for null or undefined", () => {
      expect(formatPhoneNumber(null)).toBeNull();
      expect(formatPhoneNumber(undefined)).toBeUndefined();
    });
  });
});
