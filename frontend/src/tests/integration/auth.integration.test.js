import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { authService } from "../../redux/features/auth/authService";

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Auth Integration Tests with MSW", () => {
  describe("Authentication Flow", () => {
    it("should login user successfully", async () => {
      const credentials = { email: "user@example.com", password: "Password123!" };
      const result = await authService.login(credentials);

      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe("user@example.com");
      expect(result.data.token).toBeDefined();
    });

    it("should register new user successfully", async () => {
      const userData = {
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
        password: "Password123!",
      };
      const result = await authService.register(userData);

      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe("new@example.com");
    });

    it("should fetch current user profile", async () => {
      const result = await authService.getUser();

      expect(result.data).toBeDefined();
      expect(result.data.email).toBe("user@example.com");
    });

    it("should send password reset email", async () => {
      const result = await authService.forgotUserPassword("user@example.com");

      expect(result).toBe("Password reset email sent");
    });
  });

  describe("User Management", () => {
    it("should fetch all users", async () => {
      const result = await authService.getUsers();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].firstName).toBe("John");
      expect(result.data[1].firstName).toBe("Jane");
    });

    it("should fetch single user by id", async () => {
      const result = await authService.getUser("user123");

      expect(result.data).toBeDefined();
      expect(result.data._id).toBe("user123");
    });

    it("should delete user", async () => {
      const result = await authService.deleteUser("user123");

      expect(result).toBe("User deleted");
    });
  });

  describe("Statistics", () => {
    it("should fetch user statistics", async () => {
      const result = await authService.getUserStatistics();

      expect(result.data.total).toBe(100);
      expect(result.data.active).toBe(80);
    });

    it("should fetch staff statistics", async () => {
      const result = await authService.getStaffStatistics();

      expect(result.data.total).toBe(50);
      expect(result.data.active).toBe(45);
    });

    it("should fetch client statistics", async () => {
      const result = await authService.getClientStatistics();

      expect(result.data.total).toBe(500);
      expect(result.data.active).toBe(450);
    });

    it("should fetch status statistics", async () => {
      const result = await authService.getStatusStatistics();

      expect(result.data.active).toBe(100);
      expect(result.data.inactive).toBe(20);
    });
  });
});

describe("Redux Integration Tests with MSW", () => {
  describe("Login Flow", () => {
    it("should handle successful login", async () => {
      const credentials = { email: "user@example.com", password: "Password123!" };
      
      const result = await authService.login(credentials);
      
      expect(result.data.user).toBeDefined();
      expect(result.data.token).toBeDefined();
    });
  });

  describe("Register Flow", () => {
    it("should handle successful registration", async () => {
      const userData = {
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
        password: "Password123!",
      };

      const result = await authService.register(userData);

      expect(result.data.user).toBeDefined();
    });
  });
});
