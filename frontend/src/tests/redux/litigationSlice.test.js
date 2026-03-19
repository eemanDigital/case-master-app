import { describe, it, expect } from "vitest";
import litigationReducer, {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  clearSelectedMatter,
  setSearchMode,
  clearError,
  updateMatterInList,
  updateHearingInList,
  removeHearingFromList,
  clearMatterHearings,
} from "../../redux/features/litigation/litigationSlice";

describe("litigationSlice reducers", () => {
  const initialState = {
    matters: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    filters: {
      courtName: "",
      suitNo: "",
      judge: "",
      currentStage: "",
      status: "",
      clientId: "",
      year: "",
    },
    selectedMatter: null,
    selectedDetails: null,
    stats: null,
    dashboard: null,
    upcomingHearings: [],
    hearingsStats: { total: 0, today: 0, thisWeek: 0, nextWeek: 0, thisMonth: 0, pending: 0, completed: 0 },
    matterHearings: [],
    matterHearingsStats: { total: 0, past: 0, today: 0, upcoming: 0, completed: 0, pending: 0 },
    litigationSteps: [],
    stepsLoading: false,
    loading: false,
    detailsLoading: false,
    statsLoading: false,
    actionLoading: false,
    error: null,
    searchMode: false,
  };

  describe("setFilters", () => {
    it("should update filters", () => {
      const result = litigationReducer(initialState, setFilters({ courtName: "High Court", status: "active" }));

      expect(result.filters.courtName).toBe("High Court");
      expect(result.filters.status).toBe("active");
    });

    it("should merge with existing filters", () => {
      const state = {
        ...initialState,
        filters: { ...initialState.filters, courtName: "Supreme Court", judge: "Justice Doe" },
      };
      const result = litigationReducer(state, setFilters({ status: "pending" }));

      expect(result.filters.courtName).toBe("Supreme Court");
      expect(result.filters.judge).toBe("Justice Doe");
      expect(result.filters.status).toBe("pending");
    });
  });

  describe("clearFilters", () => {
    it("should reset all filters to empty strings", () => {
      const state = {
        ...initialState,
        filters: {
          courtName: "High Court",
          suitNo: "123/2024",
          judge: "Justice Doe",
          currentStage: "trial",
          status: "active",
          clientId: "client123",
          year: "2024",
        },
      };

      const result = litigationReducer(state, clearFilters());
      expect(result.filters).toEqual(initialState.filters);
    });
  });

  describe("setCurrentPage", () => {
    it("should update pagination page", () => {
      const result = litigationReducer(initialState, setCurrentPage(3));
      expect(result.pagination.page).toBe(3);
    });
  });

  describe("setPageSize", () => {
    it("should update pagination limit and reset page", () => {
      const state = { ...initialState, pagination: { page: 5, limit: 20, total: 100, pages: 5 } };
      const result = litigationReducer(state, setPageSize(50));

      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe("setSelectedMatter", () => {
    it("should set selected matter", () => {
      const matter = { _id: "1", suitNo: "123/2024", court: "High Court" };
      const result = litigationReducer(initialState, setSelectedMatter(matter));
      expect(result.selectedMatter).toEqual(matter);
    });
  });

  describe("clearSelectedMatter", () => {
    it("should clear selected matter and details", () => {
      const state = {
        ...initialState,
        selectedMatter: { _id: "1" },
        selectedDetails: { _id: "1", details: "some data" },
      };

      const result = litigationReducer(state, clearSelectedMatter());
      expect(result.selectedMatter).toBeNull();
      expect(result.selectedDetails).toBeNull();
    });
  });

  describe("setSearchMode", () => {
    it("should toggle search mode", () => {
      const result = litigationReducer(initialState, setSearchMode(true));
      expect(result.searchMode).toBe(true);
    });
  });

  describe("clearError", () => {
    it("should clear error", () => {
      const state = { ...initialState, error: "Something went wrong" };
      const result = litigationReducer(state, clearError());
      expect(result.error).toBeNull();
    });
  });

  describe("updateMatterInList", () => {
    it("should update matter in the list", () => {
      const state = {
        ...initialState,
        matters: [
          { _id: "1", status: "pending" },
          { _id: "2", status: "active" },
        ],
      };

      const result = litigationReducer(state, updateMatterInList({ _id: "1", status: "completed" }));

      expect(result.matters[0].status).toBe("completed");
      expect(result.matters[1].status).toBe("active");
    });

    it("should do nothing if matter not found", () => {
      const state = { ...initialState, matters: [{ _id: "1" }] };
      const result = litigationReducer(state, updateMatterInList({ _id: "999", title: "Not Found" }));
      expect(result.matters).toEqual(state.matters);
    });
  });

  describe("updateHearingInList", () => {
    it("should update hearing in upcoming hearings list", () => {
      const state = {
        ...initialState,
        upcomingHearings: [
          { _id: "h1", date: "2024-06-15", outcome: "" },
          { _id: "h2", date: "2024-06-20", outcome: "" },
        ],
      };

      const result = litigationReducer(state, updateHearingInList({ _id: "h1", outcome: "Adjourned" }));

      expect(result.upcomingHearings[0].outcome).toBe("Adjourned");
      expect(result.upcomingHearings[1].outcome).toBe("");
    });

    it("should do nothing if hearing not found", () => {
      const state = {
        ...initialState,
        upcomingHearings: [{ _id: "h1" }],
      };
      const result = litigationReducer(state, updateHearingInList({ _id: "h999", outcome: "Test" }));
      expect(result.upcomingHearings).toEqual(state.upcomingHearings);
    });
  });

  describe("removeHearingFromList", () => {
    it("should remove hearing from upcoming hearings", () => {
      const state = {
        ...initialState,
        upcomingHearings: [{ _id: "h1" }, { _id: "h2" }],
        hearingsStats: { total: 2, today: 0, thisWeek: 0, nextWeek: 0, thisMonth: 0, pending: 2, completed: 0 },
      };

      const result = litigationReducer(state, removeHearingFromList("h1"));

      expect(result.upcomingHearings).toHaveLength(1);
      expect(result.upcomingHearings[0]._id).toBe("h2");
    });
  });

  describe("clearMatterHearings", () => {
    it("should clear all matter hearings and reset stats", () => {
      const state = {
        ...initialState,
        matterHearings: [{ _id: "h1" }, { _id: "h2" }],
        matterHearingsStats: { total: 2, past: 1, today: 0, upcoming: 1, completed: 0, pending: 2 },
      };

      const result = litigationReducer(state, clearMatterHearings());

      expect(result.matterHearings).toEqual([]);
      expect(result.matterHearingsStats.total).toBe(0);
      expect(result.matterHearingsStats.upcoming).toBe(0);
    });
  });
});
