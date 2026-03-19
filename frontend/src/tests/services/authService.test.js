import { describe, it, expect } from "vitest";
import { authService } from "../../redux/features/auth/authService";

describe("authService", () => {
  describe("service structure", () => {
    it("should export all auth methods", () => {
      expect(typeof authService.register).toBe("function");
      expect(typeof authService.login).toBe("function");
      expect(typeof authService.logout).toBe("function");
      expect(typeof authService.getUser).toBe("function");
      expect(typeof authService.getLoginStatus).toBe("function");
      expect(typeof authService.getUsers).toBe("function");
    });

    it("should export all statistics methods", () => {
      expect(typeof authService.getUserStatistics).toBe("function");
      expect(typeof authService.getStaffStatistics).toBe("function");
      expect(typeof authService.getClientStatistics).toBe("function");
      expect(typeof authService.getStatusStatistics).toBe("function");
    });

    it("should export all user management methods", () => {
      expect(typeof authService.sendVerificationMail).toBe("function");
      expect(typeof authService.verifyUser).toBe("function");
      expect(typeof authService.forgotUserPassword).toBe("function");
      expect(typeof authService.resetPassword).toBe("function");
      expect(typeof authService.changePassword).toBe("function");
      expect(typeof authService.deleteUser).toBe("function");
      expect(typeof authService.softDeleteUser).toBe("function");
      expect(typeof authService.restoreUser).toBe("function");
      expect(typeof authService.getDeletedUsers).toBe("function");
      expect(typeof authService.upgradeUser).toBe("function");
    });

    it("should export 2FA and social auth methods", () => {
      expect(typeof authService.sendLoginCode).toBe("function");
      expect(typeof authService.loginWithCode).toBe("function");
      expect(typeof authService.loginWithGoogle).toBe("function");
    });

    it("should export firm branding methods", () => {
      expect(typeof authService.uploadFirmLogo).toBe("function");
      expect(typeof authService.uploadFirmStamp).toBe("function");
      expect(typeof authService.uploadFirmSignature).toBe("function");
    });

    it("should export plan upgrade method", () => {
      expect(typeof authService.requestPlanUpgrade).toBe("function");
    });
  });

  describe("default export", () => {
    it("should export same object as named export", async () => {
      const defaultExport = (await import("../../redux/features/auth/authService")).default;
      expect(defaultExport).toBe(authService);
    });
  });
});
