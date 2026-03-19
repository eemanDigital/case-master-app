import { describe, it, expect } from "vitest";
import matterReducer, {
  resetMatterState,
  resetMatter,
  resetValidationErrors,
  resetLoading,
  setFilters,
  clearFilters,
  setPagination,
  clearError,
  setCurrentMatter,
  updateMatterInList,
  removeMatterFromList,
  addMatterToList,
  selectMatter,
  deselectMatter,
  toggleSelectMatter,
  selectAllMatters,
  clearSelectedMatters,
} from "../../redux/features/matter/matterSlice";

describe("matterSlice reducers", () => {
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

  describe("resetMatterState", () => {
    it("should reset state to initial values", () => {
      const state = {
        ...initialState,
        matters: [{ _id: "1" }],
        currentMatter: { _id: "1" },
        isError: true,
        isSuccess: true,
        message: "Error message",
        selectedMatters: ["1", "2"],
        validationErrors: { field: "error" },
      };

      const result = matterReducer(state, resetMatterState());

      expect(result.matters).toEqual([]);
      expect(result.currentMatter).toBeNull();
      expect(result.isError).toBe(false);
      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe("");
      expect(result.selectedMatters).toEqual([]);
      expect(result.validationErrors).toEqual({});
    });
  });

  describe("resetMatter", () => {
    it("should reset currentMatter and loading states", () => {
      const state = {
        ...initialState,
        currentMatter: { _id: "1", title: "Test" },
        isLoading: true,
        isError: true,
        message: "Error",
        validationErrors: { field: "error" },
      };

      const result = matterReducer(state, resetMatter());

      expect(result.currentMatter).toBeNull();
      expect(result.isLoading).toBe(false);
      expect(result.isError).toBe(false);
      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe("");
      expect(result.validationErrors).toEqual({});
      expect(result.matters).toEqual(state.matters);
    });
  });

  describe("resetValidationErrors", () => {
    it("should clear validation errors", () => {
      const state = { ...initialState, validationErrors: { field: "error" } };
      const result = matterReducer(state, resetValidationErrors());
      expect(result.validationErrors).toEqual({});
    });
  });

  describe("resetLoading", () => {
    it("should reset loading states", () => {
      const state = {
        ...initialState,
        isLoading: true,
        isError: true,
        isSuccess: true,
        message: "Error",
      };

      const result = matterReducer(state, resetLoading());

      expect(result.isLoading).toBe(false);
      expect(result.isError).toBe(false);
      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe("");
    });
  });

  describe("setFilters", () => {
    it("should update filters and reset page", () => {
      const state = { ...initialState, pagination: { page: 5, limit: 20, total: 100, totalPages: 5 } };
      const result = matterReducer(state, setFilters({ status: "active", priority: "high" }));

      expect(result.filters.status).toBe("active");
      expect(result.filters.priority).toBe("high");
      expect(result.pagination.page).toBe(1);
    });

    it("should merge with existing filters", () => {
      const state = { ...initialState, filters: { status: "pending", matterType: "litigation", priority: "", search: "", client: "", accountOfficer: "" } };
      const result = matterReducer(state, setFilters({ priority: "urgent" }));

      expect(result.filters.status).toBe("pending");
      expect(result.filters.matterType).toBe("litigation");
      expect(result.filters.priority).toBe("urgent");
    });
  });

  describe("clearFilters", () => {
    it("should reset filters to initial state", () => {
      const state = { ...initialState, filters: { status: "active", matterType: "litigation", priority: "high", search: "test", client: "123", accountOfficer: "456" } };
      const result = matterReducer(state, clearFilters());

      expect(result.filters).toEqual(initialState.filters);
    });
  });

  describe("setPagination", () => {
    it("should update pagination", () => {
      const result = matterReducer(initialState, setPagination({ page: 3, limit: 50 }));
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(50);
    });
  });

  describe("clearError", () => {
    it("should clear error and message", () => {
      const state = { ...initialState, isError: true, message: "Error occurred", validationErrors: { field: "error" } };
      const result = matterReducer(state, clearError());

      expect(result.isError).toBe(false);
      expect(result.message).toBe("");
      expect(result.validationErrors).toEqual({});
    });
  });

  describe("setCurrentMatter", () => {
    it("should set current matter", () => {
      const matter = { _id: "1", title: "Test Case" };
      const result = matterReducer(initialState, setCurrentMatter(matter));
      expect(result.currentMatter).toEqual(matter);
    });
  });

  describe("updateMatterInList", () => {
    it("should update matter in the list", () => {
      const state = {
        ...initialState,
        matters: [
          { _id: "1", title: "Old Title" },
          { _id: "2", title: "Other Case" },
        ],
      };

      const result = matterReducer(state, updateMatterInList({ _id: "1", title: "New Title" }));

      expect(result.matters[0].title).toBe("New Title");
      expect(result.matters[1].title).toBe("Other Case");
    });

    it("should do nothing if matter not found", () => {
      const state = { ...initialState, matters: [{ _id: "1", title: "Case 1" }] };
      const result = matterReducer(state, updateMatterInList({ _id: "999", title: "Not Found" }));
      expect(result.matters).toEqual(state.matters);
    });
  });

  describe("removeMatterFromList", () => {
    it("should remove matter from list", () => {
      const state = {
        ...initialState,
        matters: [{ _id: "1" }, { _id: "2" }],
      };

      const result = matterReducer(state, removeMatterFromList("1"));

      expect(result.matters).toHaveLength(1);
      expect(result.matters[0]._id).toBe("2");
    });

    it("should clear currentMatter if removed", () => {
      const state = {
        ...initialState,
        matters: [{ _id: "1" }],
        currentMatter: { _id: "1" },
      };

      const result = matterReducer(state, removeMatterFromList("1"));
      expect(result.currentMatter).toBeNull();
    });
  });

  describe("addMatterToList", () => {
    it("should add matter to the beginning of the list", () => {
      const state = { ...initialState, matters: [{ _id: "1" }] };
      const result = matterReducer(state, addMatterToList({ _id: "2" }));

      expect(result.matters).toHaveLength(2);
      expect(result.matters[0]._id).toBe("2");
    });
  });

  describe("bulk selection", () => {
    describe("selectMatter", () => {
      it("should add matter to selection", () => {
        const result = matterReducer(initialState, selectMatter("1"));
        expect(result.selectedMatters).toContain("1");
      });

      it("should not add duplicate", () => {
        const state = { ...initialState, selectedMatters: ["1"] };
        const result = matterReducer(state, selectMatter("1"));
        expect(result.selectedMatters).toHaveLength(1);
      });
    });

    describe("deselectMatter", () => {
      it("should remove matter from selection", () => {
        const state = { ...initialState, selectedMatters: ["1", "2"] };
        const result = matterReducer(state, deselectMatter("1"));
        expect(result.selectedMatters).not.toContain("1");
        expect(result.selectedMatters).toContain("2");
      });
    });

    describe("toggleSelectMatter", () => {
      it("should toggle matter selection", () => {
        let result = matterReducer(initialState, toggleSelectMatter("1"));
        expect(result.selectedMatters).toContain("1");

        result = matterReducer(result, toggleSelectMatter("1"));
        expect(result.selectedMatters).not.toContain("1");
      });
    });

    describe("selectAllMatters", () => {
      it("should select all matters", () => {
        const state = {
          ...initialState,
          matters: [{ _id: "1" }, { _id: "2" }],
        };
        const result = matterReducer(state, selectAllMatters());
        expect(result.selectedMatters).toContain("1");
        expect(result.selectedMatters).toContain("2");
      });
    });

    describe("clearSelectedMatters", () => {
      it("should clear all selections", () => {
        const state = { ...initialState, selectedMatters: ["1", "2"] };
        const result = matterReducer(state, clearSelectedMatters());
        expect(result.selectedMatters).toEqual([]);
      });
    });
  });
});
