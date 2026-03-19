import { describe, it, expect } from "vitest";
import authReducer, {
  RESET,
  clearUsersCache,
  updateUserInCache,
  removeUserFromCache,
  updateCurrentUser,
  clearStatistics,
} from "../../redux/features/auth/authSlice";

describe("authSlice reducers", () => {
  const initialState = {
    isLoggedIn: false,
    user: null,
    twoFactor: false,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: "",
    users: null,
    usersLoading: false,
    usersLastFetched: null,
    deletedUsers: null,
    userStatistics: null,
    staffStatistics: null,
    clientStatistics: null,
    statusStatistics: null,
    statisticsLoading: false,
    statisticsError: null,
  };

  describe("RESET", () => {
    it("should reset error, success, loading states and twoFactor", () => {
      const state = {
        ...initialState,
        isError: true,
        isSuccess: true,
        isLoading: true,
        message: "Some error",
        twoFactor: true,
      };

      const result = authReducer(state, RESET);

      expect(result.isError).toBe(false);
      expect(result.isSuccess).toBe(false);
      expect(result.isLoading).toBe(false);
      expect(result.message).toBe("");
      expect(result.twoFactor).toBe(false);
    });

    it("should preserve user and isLoggedIn on RESET", () => {
      const state = {
        ...initialState,
        isError: true,
        user: { name: "John" },
        isLoggedIn: true,
      };

      const result = authReducer(state, RESET);

      expect(result.user).toEqual({ name: "John" });
      expect(result.isLoggedIn).toBe(true);
    });
  });

  describe("clearUsersCache", () => {
    it("should clear users and usersLastFetched", () => {
      const state = {
        ...initialState,
        users: { data: [{ _id: "1" }] },
        usersLastFetched: Date.now(),
      };

      const result = authReducer(state, clearUsersCache());

      expect(result.users).toBeNull();
      expect(result.usersLastFetched).toBeNull();
    });
  });

  describe("updateUserInCache", () => {
    it("should update a user in the cache", () => {
      const state = {
        ...initialState,
        users: {
          data: [
            { _id: "1", name: "John" },
            { _id: "2", name: "Jane" },
          ],
        },
      };

      const result = authReducer(
        state,
        updateUserInCache({ _id: "1", name: "John Updated" })
      );

      expect(result.users.data[0].name).toBe("John Updated");
      expect(result.users.data[1].name).toBe("Jane");
    });

    it("should do nothing if users is null", () => {
      const state = { ...initialState, users: null };
      const result = authReducer(state, updateUserInCache({ _id: "1", name: "Test" }));
      expect(result).toEqual(state);
    });
  });

  describe("removeUserFromCache", () => {
    it("should remove a user from the cache by id", () => {
      const state = {
        ...initialState,
        users: {
          data: [
            { _id: "1", name: "John" },
            { _id: "2", name: "Jane" },
          ],
        },
      };

      const result = authReducer(state, removeUserFromCache("1"));

      expect(result.users.data).toHaveLength(1);
      expect(result.users.data[0]._id).toBe("2");
    });

    it("should do nothing if users is null", () => {
      const state = { ...initialState, users: null };
      const result = authReducer(state, removeUserFromCache("1"));
      expect(result).toEqual(state);
    });
  });

  describe("updateCurrentUser", () => {
    it("should update the current user", () => {
      const state = {
        ...initialState,
        user: { name: "John", email: "john@example.com" },
      };

      const result = authReducer(state, updateCurrentUser({ name: "John Updated" }));

      expect(result.user.name).toBe("John Updated");
      expect(result.user.email).toBe("john@example.com");
    });

    it("should do nothing if user is null", () => {
      const state = { ...initialState, user: null };
      const result = authReducer(state, updateCurrentUser({ name: "Test" }));
      expect(result.user).toBeNull();
    });
  });

  describe("clearStatistics", () => {
    it("should clear all statistics", () => {
      const state = {
        ...initialState,
        userStatistics: { count: 10 },
        staffStatistics: { count: 5 },
        clientStatistics: { count: 20 },
        statusStatistics: { count: 15 },
        statisticsError: "Some error",
      };

      const result = authReducer(state, clearStatistics());

      expect(result.userStatistics).toBeNull();
      expect(result.staffStatistics).toBeNull();
      expect(result.clientStatistics).toBeNull();
      expect(result.statusStatistics).toBeNull();
      expect(result.statisticsError).toBeNull();
    });
  });
});
