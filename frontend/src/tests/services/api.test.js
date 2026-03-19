import { describe, it, expect } from "vitest";

describe("api service", () => {
  describe("configuration", () => {
    it("should export api service module", async () => {
      const apiService = await import("../../services/api");
      expect(apiService.default).toBeDefined();
    });

    it("should have expected methods exported", async () => {
      const apiService = await import("../../services/api");
      const service = apiService.default;
      
      expect(typeof service.get).toBe("function");
      expect(typeof service.post).toBe("function");
      expect(typeof service.put).toBe("function");
      expect(typeof service.patch).toBe("function");
      expect(typeof service.delete).toBe("function");
      expect(typeof service.upload).toBe("function");
      expect(typeof service.download).toBe("function");
      expect(typeof service.downloadPost).toBe("function");
      expect(typeof service.setToken).toBe("function");
      expect(typeof service.removeToken).toBe("function");
      expect(typeof service.isAuthenticated).toBe("function");
      expect(typeof service.getToken).toBe("function");
      expect(typeof service.getBaseURL).toBe("function");
    });
  });
});
