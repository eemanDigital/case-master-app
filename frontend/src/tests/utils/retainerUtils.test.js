import { describe, it, expect } from "vitest";
import { calculateRetainerMetrics, calculateTaxes, formatCurrency, validateRetainerData, getDaysBetween, isExpiringSoon, isExpired } from "../../utils/retainerUtils";

describe("Retainer Utils - Nigerian Billing Calculations", () => {
  describe("calculateTaxes", () => {
    it("should calculate VAT at 7.5% by default", () => {
      const result = calculateTaxes(100000);
      
      expect(result.vatAmount).toBe(7500);
      expect(result.vatRate).toBe(7.5);
      expect(result.totalWithTax).toBe(107500);
    });

    it("should calculate WHT at 5% by default", () => {
      const result = calculateTaxes(100000);
      
      expect(result.whtAmount).toBe(5000);
      expect(result.whtRate).toBe(5);
    });

    it("should calculate net amount correctly", () => {
      const result = calculateTaxes(100000);
      
      expect(result.netAmount).toBe(102500);
    });

    it("should calculate for large amounts correctly", () => {
      const result = calculateTaxes(5000000);
      
      expect(result.vatAmount).toBe(375000);
      expect(result.whtAmount).toBe(250000);
      expect(result.netAmount).toBe(5125000);
    });

    it("should return baseAmount in result", () => {
      const result = calculateTaxes(250000);
      
      expect(result.baseAmount).toBe(250000);
    });

    describe("VAT toggle", () => {
      it("should apply VAT when applyVAT is true", () => {
        const result = calculateTaxes(100000, { applyVAT: true });
        
        expect(result.vatAmount).toBe(7500);
      });

      it("should not apply VAT when applyVAT is false", () => {
        const result = calculateTaxes(100000, { applyVAT: false });
        
        expect(result.vatAmount).toBe(0);
        expect(result.totalWithTax).toBe(100000);
      });
    });

    describe("WHT toggle", () => {
      it("should apply WHT when applyWHT is true", () => {
        const result = calculateTaxes(100000, { applyWHT: true });
        
        expect(result.whtAmount).toBe(5000);
      });

      it("should not apply WHT when applyWHT is false", () => {
        const result = calculateTaxes(100000, { applyWHT: false });
        
        expect(result.whtAmount).toBe(0);
        expect(result.netAmount).toBe(107500);
      });
    });

    describe("custom rates", () => {
      it("should use custom VAT rate", () => {
        const result = calculateTaxes(100000, { vatRate: 10 });
        
        expect(result.vatAmount).toBe(10000);
        expect(result.vatRate).toBe(10);
      });

      it("should use custom WHT rate", () => {
        const result = calculateTaxes(100000, { whtRate: 10 });
        
        expect(result.whtAmount).toBe(10000);
        expect(result.whtRate).toBe(10);
      });

    it("should use corporate WHT rate of 10%", () => {
      const result = calculateTaxes(100000, { whtRate: 10 });
      
      expect(result.whtAmount).toBe(10000);
      expect(result.netAmount).toBe(97500);
    });
    });

    describe("edge cases", () => {
      it("should handle zero amount", () => {
        const result = calculateTaxes(0);
        
        expect(result.vatAmount).toBe(0);
        expect(result.whtAmount).toBe(0);
        expect(result.totalWithTax).toBe(0);
        expect(result.netAmount).toBe(0);
      });

      it("should handle decimal amounts", () => {
        const result = calculateTaxes(99999.99);
        
        expect(result.vatAmount).toBeCloseTo(7499.99925, 2);
      });

      it("should handle both taxes disabled", () => {
        const result = calculateTaxes(100000, { applyVAT: false, applyWHT: false });
        
        expect(result.vatAmount).toBe(0);
        expect(result.whtAmount).toBe(0);
        expect(result.totalWithTax).toBe(100000);
        expect(result.netAmount).toBe(100000);
      });
    });
  });

  describe("formatCurrency", () => {
    it("should format NGN with ₦ symbol", () => {
      const result = formatCurrency(100000);
      
      expect(result).toContain("₦");
      expect(result).toContain("100,000.00");
    });

    it("should format USD with $ symbol", () => {
      const result = formatCurrency(100000, "USD");
      
      expect(result).toContain("$");
    });

    it("should handle zero", () => {
      const result = formatCurrency(0);
      
      expect(result).toContain("0.00");
    });

    it("should return N/A for null", () => {
      const result = formatCurrency(null);
      
      expect(result).toBe("N/A");
    });

    it("should return N/A for undefined", () => {
      const result = formatCurrency(undefined);
      
      expect(result).toBe("N/A");
    });

    it("should handle large amounts with proper formatting", () => {
      const result = formatCurrency(10000000);
      
      expect(result).toContain("10,000,000.00");
    });
  });

  describe("calculateRetainerMetrics", () => {
    it("should return default values when details is null", () => {
      const result = calculateRetainerMetrics(null);
      
      expect(result.daysRemaining).toBe(0);
      expect(result.daysElapsed).toBe(0);
      expect(result.totalDays).toBe(0);
      expect(result.progressPercent).toBe(0);
      expect(result.isExpiringSoon).toBe(false);
      expect(result.isExpired).toBe(false);
      expect(result.isActive).toBe(false);
    });

    it("should calculate total days between dates", () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      const end = new Date(today);
      end.setDate(end.getDate() + 60);
      
      const result = calculateRetainerMetrics({
        agreementStartDate: start.toISOString(),
        agreementEndDate: end.toISOString(),
      });
      
      expect(result.totalDays).toBeGreaterThanOrEqual(89);
    });

    it("should detect expiring soon when within 30 days", () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 60);
      const end = new Date(today);
      end.setDate(end.getDate() + 20);
      
      const result = calculateRetainerMetrics({
        agreementStartDate: start.toISOString(),
        agreementEndDate: end.toISOString(),
      });
      
      expect(result.isExpiringSoon).toBe(true);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.daysRemaining).toBeLessThanOrEqual(30);
    });

    it("should detect expired when past end date", () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 90);
      const end = new Date(today);
      end.setDate(end.getDate() - 10);
      
      const result = calculateRetainerMetrics({
        agreementStartDate: start.toISOString(),
        agreementEndDate: end.toISOString(),
      });
      
      expect(result.isExpired).toBe(true);
      expect(result.daysRemaining).toBeLessThan(0);
    });
  });

  describe("validateRetainerData", () => {
    it("should return invalid for missing required fields", () => {
      const result = validateRetainerData({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.retainerType).toBeDefined();
      expect(result.errors.agreementStartDate).toBeDefined();
      expect(result.errors.agreementEndDate).toBeDefined();
    });

    it("should return invalid for invalid retainer fee", () => {
      const result = validateRetainerData({
        retainerType: "fixed",
        agreementStartDate: "2024-01-01",
        agreementEndDate: "2024-12-31",
        billing: { retainerFee: 0 },
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.retainerFee).toBeDefined();
    });

    it("should return invalid when end date is before start date", () => {
      const result = validateRetainerData({
        retainerType: "fixed",
        agreementStartDate: "2024-12-31",
        agreementEndDate: "2024-01-01",
        billing: { retainerFee: 50000, frequency: "monthly" },
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.agreementEndDate).toBeDefined();
    });

    it("should return invalid for missing scope description", () => {
      const result = validateRetainerData({
        retainerType: "fixed",
        agreementStartDate: "2024-01-01",
        agreementEndDate: "2024-12-31",
        billing: { retainerFee: 50000, frequency: "monthly" },
        scopeDescription: "",
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.scopeDescription).toBeDefined();
    });

    it("should return valid for complete valid data", () => {
      const result = validateRetainerData({
        retainerType: "fixed",
        agreementStartDate: "2024-01-01",
        agreementEndDate: "2024-12-31",
        billing: { retainerFee: 50000, frequency: "monthly" },
        scopeDescription: "Legal services for corporate matters",
      });
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe("getDaysBetween", () => {
    it("should return 0 for missing dates", () => {
      expect(getDaysBetween(null, "2024-01-01")).toBe(0);
      expect(getDaysBetween("2024-01-01", null)).toBe(0);
    });

    it("should calculate days between two dates", () => {
      const days = getDaysBetween("2024-01-01", "2024-01-11");
      expect(days).toBe(10);
    });

    it("should handle negative days", () => {
      const days = getDaysBetween("2024-01-11", "2024-01-01");
      expect(days).toBe(-10);
    });
  });

  describe("isExpiringSoon", () => {
    it("should return false for null date", () => {
      expect(isExpiringSoon(null)).toBe(false);
    });

    it("should return true when within threshold", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      
      expect(isExpiringSoon(futureDate.toISOString())).toBe(true);
    });

    it("should return false when past threshold", () => {
      const farFutureDate = new Date();
      farFutureDate.setDate(farFutureDate.getDate() + 60);
      
      expect(isExpiringSoon(farFutureDate.toISOString())).toBe(false);
    });

    it("should use custom threshold", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 50);
      
      expect(isExpiringSoon(futureDate.toISOString(), 60)).toBe(true);
    });
  });

  describe("isExpired", () => {
    it("should return false for null date", () => {
      expect(isExpired(null)).toBe(false);
    });

    it("should return true for past date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      
      expect(isExpired(pastDate.toISOString())).toBe(true);
    });

    it("should return false for future date", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      expect(isExpired(futureDate.toISOString())).toBe(false);
    });
  });
});
