import { describe, it, expect } from "vitest";
import retainerReducer, {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  clearSelectedMatter,
  setSearchMode,
  clearError,
  clearSummary,
} from "../../redux/features/retainer/retainerSlice";

describe("retainerSlice reducers", () => {
  const initialState = {
    matters: [],
    selectedMatter: null,
    selectedDetails: null,
    retainerSummary: null,
    stats: null,
    expiringRetainers: [],
    pendingRequests: [],
    pagination: { currentPage: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
    filters: { retainerType: "", status: "", expiringInDays: "", search: "" },
    loading: false,
    detailsLoading: false,
    statsLoading: false,
    actionLoading: false,
    summaryLoading: false,
    error: null,
    searchMode: false,
  };

  describe("setFilters", () => {
    it("should update filters", () => {
      const result = retainerReducer(initialState, setFilters({ retainerType: "corporate", status: "active" }));

      expect(result.filters.retainerType).toBe("corporate");
      expect(result.filters.status).toBe("active");
    });

    it("should merge with existing filters", () => {
      const state = {
        ...initialState,
        filters: { retainerType: "litigation", status: "pending", expiringInDays: "30", search: "" },
      };
      const result = retainerReducer(state, setFilters({ status: "active" }));

      expect(result.filters.retainerType).toBe("litigation");
      expect(result.filters.status).toBe("active");
      expect(result.filters.expiringInDays).toBe("30");
    });
  });

  describe("clearFilters", () => {
    it("should reset all filters to empty strings", () => {
      const state = {
        ...initialState,
        filters: { retainerType: "corporate", status: "active", expiringInDays: "30", search: "test" },
      };

      const result = retainerReducer(state, clearFilters());
      expect(result.filters).toEqual(initialState.filters);
    });
  });

  describe("setCurrentPage", () => {
    it("should update pagination current page", () => {
      const result = retainerReducer(initialState, setCurrentPage(3));
      expect(result.pagination.currentPage).toBe(3);
    });
  });

  describe("setPageSize", () => {
    it("should update page size and reset current page", () => {
      const state = { ...initialState, pagination: { currentPage: 5, pageSize: 50, totalItems: 200, totalPages: 4 } };
      const result = retainerReducer(state, setPageSize(100));

      expect(result.pagination.pageSize).toBe(100);
      expect(result.pagination.currentPage).toBe(1);
    });
  });

  describe("setSelectedMatter", () => {
    it("should set selected matter", () => {
      const matter = { _id: "1", client: "Acme Corp" };
      const result = retainerReducer(initialState, setSelectedMatter(matter));
      expect(result.selectedMatter).toEqual(matter);
    });
  });

  describe("clearSelectedMatter", () => {
    it("should clear selected matter", () => {
      const state = { ...initialState, selectedMatter: { _id: "1" } };
      const result = retainerReducer(state, clearSelectedMatter());
      expect(result.selectedMatter).toBeNull();
    });
  });

  describe("setSearchMode", () => {
    it("should toggle search mode", () => {
      const result = retainerReducer(initialState, setSearchMode(true));
      expect(result.searchMode).toBe(true);
    });
  });

  describe("clearError", () => {
    it("should clear error", () => {
      const state = { ...initialState, error: "Something went wrong" };
      const result = retainerReducer(state, clearError());
      expect(result.error).toBeNull();
    });
  });

  describe("clearSummary", () => {
    it("should clear retainer summary", () => {
      const state = { ...initialState, retainerSummary: { total: 50000 } };
      const result = retainerReducer(state, clearSummary());
      expect(result.retainerSummary).toBeNull();
    });
  });

  describe("extra reducers - pending states", () => {
    it("should set loading true on fetchRetainerMatters.pending", () => {
      const action = { type: "retainer/fetchMatters/pending" };
      const result = retainerReducer(initialState, action);
      expect(result.loading).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should set detailsLoading true on fetchRetainerDetails.pending", () => {
      const action = { type: "retainer/fetchDetails/pending" };
      const result = retainerReducer(initialState, action);
      expect(result.detailsLoading).toBe(true);
    });

    it("should set statsLoading true on fetchRetainerStats.pending", () => {
      const action = { type: "retainer/fetchStats/pending" };
      const result = retainerReducer(initialState, action);
      expect(result.statsLoading).toBe(true);
    });
  });

  describe("extra reducers - fulfilled states", () => {
    it("should set matters on fetchRetainerMatters.fulfilled", () => {
      const matters = [{ _id: "1" }, { _id: "2" }];
      const action = {
        type: "retainer/fetchMatters/fulfilled",
        payload: { data: matters, page: 1, limit: 50, total: 2, totalPages: 1 },
      };
      const result = retainerReducer(initialState, action);

      expect(result.loading).toBe(false);
      expect(result.matters).toEqual(matters);
      expect(result.pagination.totalItems).toBe(2);
    });

    it("should set selectedDetails on fetchRetainerDetails.fulfilled", () => {
      const details = { _id: "1", status: "active" };
      const action = { type: "retainer/fetchDetails/fulfilled", payload: details };
      const result = retainerReducer(initialState, action);

      expect(result.detailsLoading).toBe(false);
      expect(result.selectedDetails).toEqual(details);
    });

    it("should set stats on fetchRetainerStats.fulfilled", () => {
      const stats = { total: 10, active: 5 };
      const action = { type: "retainer/fetchStats/fulfilled", payload: stats };
      const result = retainerReducer(initialState, action);

      expect(result.statsLoading).toBe(false);
      expect(result.stats).toEqual(stats);
    });

    it("should set expiringRetainers on fetchExpiringRetainers.fulfilled", () => {
      const retainers = [{ _id: "1", expiresOn: "2024-12-31" }];
      const action = { type: "retainer/fetchExpiring/fulfilled", payload: retainers };
      const result = retainerReducer(initialState, action);
      expect(result.expiringRetainers).toEqual(retainers);
    });

    it("should set pendingRequests on fetchPendingRequests.fulfilled", () => {
      const requests = [{ _id: "1", status: "pending" }];
      const action = { type: "retainer/fetchPendingRequests/fulfilled", payload: requests };
      const result = retainerReducer(initialState, action);
      expect(result.pendingRequests).toEqual(requests);
    });
  });

  describe("extra reducers - rejected states", () => {
    it("should set error on fetchRetainerMatters.rejected", () => {
      const action = {
        type: "retainer/fetchMatters/rejected",
        payload: { message: "Failed to fetch" },
      };
      const result = retainerReducer(initialState, action);
      expect(result.loading).toBe(false);
      expect(result.error).toBe("Failed to fetch");
    });

    it("should set error on fetchRetainerDetails.rejected", () => {
      const action = {
        type: "retainer/fetchDetails/rejected",
        payload: { message: "Failed to fetch details" },
      };
      const result = retainerReducer(initialState, action);
      expect(result.detailsLoading).toBe(false);
      expect(result.error).toBe("Failed to fetch details");
    });
  });
});
