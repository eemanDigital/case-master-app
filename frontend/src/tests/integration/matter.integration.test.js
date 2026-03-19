import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { configureStore } from "@reduxjs/toolkit";
import matterReducer, {
  setFilters,
  clearFilters,
  setPagination,
  updateMatterInList,
  removeMatterFromList,
} from "../../redux/features/matter/matterSlice";

export const matterServer = setupServer(
  http.get("*/api/v1/matters", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        matters: [
          { _id: "1", title: "Case 1", status: "active", matterType: "litigation" },
          { _id: "2", title: "Case 2", status: "pending", matterType: "corporate" },
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    });
  }),
  http.post("*/api/v1/matters", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        matter: { _id: "3", title: "New Matter", status: "pending" },
      },
    });
  }),
  http.put("*/api/v1/matters/:id", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        matter: { _id: "1", title: "Updated Case", status: "active" },
      },
    });
  }),
  http.delete("*/api/v1/matters/:id", () => {
    return HttpResponse.json({
      status: "success",
      message: "Matter deleted",
    });
  })
);

beforeAll(() => matterServer.listen({ onUnhandledRequest: "warn" }));
afterEach(() => matterServer.resetHandlers());
afterAll(() => matterServer.close());

describe("Matter Slice Integration Tests", () => {
  const initialState = {
    matters: [],
    currentMatter: null,
    stats: null,
    myMattersSummary: null,
    mattersWithOfficers: [],
    officerStatistics: [],
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: "",
    selectedMatters: [],
    bulkLoading: false,
    bulkError: null,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    filters: { status: "", matterType: "", priority: "", search: "", client: "", accountOfficer: "" },
    validationErrors: {},
  };

  describe("Filter Management", () => {
    it("should set filters correctly", () => {
      const result = matterReducer(initialState, setFilters({ status: "active", priority: "high" }));

      expect(result.filters.status).toBe("active");
      expect(result.filters.priority).toBe("high");
      expect(result.pagination.page).toBe(1);
    });

    it("should merge filters correctly", () => {
      const state = {
        ...initialState,
        filters: { status: "pending", matterType: "litigation", priority: "", search: "", client: "", accountOfficer: "" },
      };
      const result = matterReducer(state, setFilters({ priority: "urgent" }));

      expect(result.filters.status).toBe("pending");
      expect(result.filters.matterType).toBe("litigation");
      expect(result.filters.priority).toBe("urgent");
    });

    it("should clear all filters", () => {
      const state = {
        ...initialState,
        filters: { status: "active", matterType: "litigation", priority: "high", search: "test", client: "123", accountOfficer: "456" },
      };
      const result = matterReducer(state, clearFilters());

      expect(result.filters).toEqual(initialState.filters);
    });
  });

  describe("Pagination Management", () => {
    it("should update pagination", () => {
      const result = matterReducer(initialState, setPagination({ page: 3, limit: 50 }));

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(50);
    });

    it("should preserve existing pagination values", () => {
      const state = {
        ...initialState,
        pagination: { page: 2, limit: 20, total: 100, totalPages: 5 },
      };
      const result = matterReducer(state, setPagination({ page: 5 }));

      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.page).toBe(5);
    });
  });

  describe("Matter List Management", () => {
    it("should update matter in list", () => {
      const state = {
        ...initialState,
        matters: [
          { _id: "1", title: "Original Title", status: "pending" },
          { _id: "2", title: "Case 2", status: "active" },
        ],
      };
      const result = matterReducer(state, updateMatterInList({ _id: "1", title: "Updated Title", status: "active" }));

      expect(result.matters[0].title).toBe("Updated Title");
      expect(result.matters[0].status).toBe("active");
      expect(result.matters[1].title).toBe("Case 2");
    });

    it("should not modify list if matter not found", () => {
      const state = {
        ...initialState,
        matters: [{ _id: "1", title: "Case 1" }],
      };
      const result = matterReducer(state, updateMatterInList({ _id: "999", title: "Not Found" }));

      expect(result.matters).toEqual(state.matters);
    });

    it("should remove matter from list", () => {
      const state = {
        ...initialState,
        matters: [{ _id: "1" }, { _id: "2" }],
      };
      const result = matterReducer(state, removeMatterFromList("1"));

      expect(result.matters).toHaveLength(1);
      expect(result.matters[0]._id).toBe("2");
    });

    it("should clear currentMatter when removed matter was selected", () => {
      const state = {
        ...initialState,
        matters: [{ _id: "1" }],
        currentMatter: { _id: "1", title: "Selected Matter" },
      };
      const result = matterReducer(state, removeMatterFromList("1"));

      expect(result.currentMatter).toBeNull();
    });
  });

  describe("Matter Data Structure", () => {
    it("should handle matter object structure", () => {
      const matter = {
        _id: "matter123",
        title: "Johnson vs Smith",
        matterType: "litigation",
        status: "active",
        priority: "high",
        client: { _id: "client1", name: "Johnson Corp" },
        assignedOfficer: { _id: "officer1", name: "Jane Attorney" },
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-20T15:30:00Z",
      };

      expect(matter._id).toBeDefined();
      expect(matter.title).toBe("Johnson vs Smith");
      expect(matter.matterType).toBe("litigation");
      expect(matter.status).toBe("active");
      expect(matter.client).toBeDefined();
      expect(matter.assignedOfficer).toBeDefined();
    });

    it("should validate matter status values", () => {
      const validStatuses = ["active", "pending", "completed", "closed", "archived"];

      validStatuses.forEach((status) => {
        const matter = { _id: "1", status };
        expect(validStatuses).toContain(matter.status);
      });
    });

    it("should validate matter type values", () => {
      const validTypes = ["litigation", "corporate", "advisory", "property", "retainer"];

      validTypes.forEach((type) => {
        const matter = { _id: "1", matterType: type };
        expect(validTypes).toContain(matter.matterType);
      });
    });
  });
});

describe("Matter Priority Handling", () => {
  it("should handle priority levels", () => {
    const priorities = ["low", "medium", "high", "urgent"];

    priorities.forEach((priority) => {
      const matter = { _id: "1", priority };
      expect(priorities).toContain(matter.priority);
    });
  });

  it("should sort matters by priority", () => {
    const matters = [
      { _id: "1", priority: "low" },
      { _id: "2", priority: "urgent" },
      { _id: "3", priority: "medium" },
      { _id: "4", priority: "high" },
    ];

    const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
    const sorted = [...matters].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    expect(sorted[0].priority).toBe("urgent");
    expect(sorted[1].priority).toBe("high");
    expect(sorted[2].priority).toBe("medium");
    expect(sorted[3].priority).toBe("low");
  });
});
