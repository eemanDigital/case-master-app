// features/matter/matterSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import matterService from "./matterService";
import { message } from "antd";

const initialState = {
  matters: [],
  currentMatter: null,
  stats: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
  // Pagination
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  // Filters
  filters: {
    status: "",
    matterType: "",
    priority: "",
    search: "",
    client: "",
    accountOfficer: "",
  },
  // Validation errors from API
  validationErrors: {},
};

// Async Thunks
export const createMatter = createAsyncThunk(
  "matter/create",
  async (matterData, { rejectWithValue }) => {
    try {
      const response = await matterService.createMatter(matterData);
      return response;
    } catch (error) {
      // Handle validation errors specifically
      if (error.response?.status === 400) {
        return rejectWithValue({
          message: "Validation failed",
          errors: error.response.data.errors || {},
        });
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to create matter",
      );
    }
  },
);

export const getMatters = createAsyncThunk(
  "matter/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await matterService.getAllMatters(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch matters",
      );
    }
  },
);

export const getMatter = createAsyncThunk(
  "matter/get",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await matterService.getMatter(matterId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch matter",
      );
    }
  },
);

export const updateMatter = createAsyncThunk(
  "matter/update",
  async ({ matterId, matterData }, { rejectWithValue }) => {
    try {
      const response = await matterService.updateMatter({
        matterId,
        matterData,
      });
      return response;
    } catch (error) {
      if (error.response?.status === 400) {
        return rejectWithValue({
          message: "Validation failed",
          errors: error.response.data.errors || {},
        });
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to update matter",
      );
    }
  },
);

export const deleteMatter = createAsyncThunk(
  "matter/delete",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await matterService.deleteMatter(matterId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete matter",
      );
    }
  },
);

export const getMatterStats = createAsyncThunk(
  "matter/stats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await matterService.getMatterStats();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats",
      );
    }
  },
);

export const searchMatters = createAsyncThunk(
  "matter/search",
  async (searchCriteria, { rejectWithValue }) => {
    try {
      const response = await matterService.searchMatters(searchCriteria);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search matters",
      );
    }
  },
);

// Slice
const matterSlice = createSlice({
  name: "matter",
  initialState,
  reducers: {
    // ✅ Reset the entire matter state to initial
    resetMatterState: (state) => {
      return initialState;
    },

    // ✅ Reset only the current matter and loading states
    resetMatter: (state) => {
      state.currentMatter = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
      state.validationErrors = {};
    },

    // ✅ Reset only the validation errors
    resetValidationErrors: (state) => {
      state.validationErrors = {};
    },

    // ✅ Reset loading states only
    resetLoading: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },

    // ✅ Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page on filter change
    },

    // ✅ Clear all filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // ✅ Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // ✅ Clear error message only
    clearError: (state) => {
      state.isError = false;
      state.message = "";
      state.validationErrors = {};
    },

    // ✅ Manually set current matter (useful for optimistic updates)
    setCurrentMatter: (state, action) => {
      state.currentMatter = action.payload;
    },

    // ✅ Update matter in list (optimistic updates)
    updateMatterInList: (state, action) => {
      const updatedMatter = action.payload;
      const index = state.matters.findIndex((m) => m._id === updatedMatter._id);
      if (index !== -1) {
        state.matters[index] = updatedMatter;
      }
    },

    // ✅ Remove matter from list
    removeMatterFromList: (state, action) => {
      const matterId = action.payload;
      state.matters = state.matters.filter((m) => m._id !== matterId);
      if (state.currentMatter?._id === matterId) {
        state.currentMatter = null;
      }
    },

    // ✅ Add matter to list (for optimistic creation)
    addMatterToList: (state, action) => {
      state.matters.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Matter
      .addCase(createMatter.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.validationErrors = {};
        state.message = "";
      })
      .addCase(createMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload.data?.matter) {
          state.matters.unshift(action.payload.data.matter);
        }
        state.message = "Matter created successfully";
        message.success("Matter created successfully");
      })
      .addCase(createMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;

        if (action.payload?.errors) {
          state.validationErrors = action.payload.errors;
          state.message = "Please fix the validation errors";
        } else {
          state.message = action.payload || "Failed to create matter";
        }

        message.error(state.message);
      })

      // Get All Matters
      .addCase(getMatters.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(getMatters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.matters =
          action.payload.data?.matters || action.payload.data || [];
        state.pagination = action.payload.data?.pagination || state.pagination;
      })
      .addCase(getMatters.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch matters";
        message.error(state.message);
      })

      // Get Single Matter
      .addCase(getMatter.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.validationErrors = {};
      })
      .addCase(getMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentMatter =
          action.payload.data?.matter || action.payload.data || null;
      })
      .addCase(getMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch matter";
        message.error(state.message);
      })

      // Update Matter
      .addCase(updateMatter.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.validationErrors = {};
      })
      .addCase(updateMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const updatedMatter =
          action.payload.data?.matter || action.payload.data;
        if (updatedMatter) {
          // Update in matters array
          const index = state.matters.findIndex(
            (m) => m._id === updatedMatter._id,
          );
          if (index !== -1) {
            state.matters[index] = updatedMatter;
          }

          // Update current matter if it's the same
          if (state.currentMatter?._id === updatedMatter._id) {
            state.currentMatter = updatedMatter;
          }
        }

        state.message = "Matter updated successfully";
        message.success("Matter updated successfully");
      })
      .addCase(updateMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;

        if (action.payload?.errors) {
          state.validationErrors = action.payload.errors;
          state.message = "Please fix the validation errors";
        } else {
          state.message = action.payload || "Failed to update matter";
        }

        message.error(state.message);
      })

      // Delete Matter
      .addCase(deleteMatter.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const deletedMatterId = action.meta.arg;
        state.matters = state.matters.filter((m) => m._id !== deletedMatterId);

        if (state.currentMatter?._id === deletedMatterId) {
          state.currentMatter = null;
        }

        state.message = "Matter deleted successfully";
        message.success("Matter deleted successfully");
      })
      .addCase(deleteMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to delete matter";
        message.error(state.message);
      })

      // Get Stats
      .addCase(getMatterStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMatterStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.stats = action.payload.data || null;
      })
      .addCase(getMatterStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch stats";
        message.error(state.message);
      })

      // Search Matters
      .addCase(searchMatters.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchMatters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.matters = action.payload.data || [];
      })
      .addCase(searchMatters.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to search matters";
        message.error(state.message);
      });
  },
});

export const {
  resetMatterState, // ✅ Complete reset
  resetMatter, // ✅ Reset current matter
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
} = matterSlice.actions;

export default matterSlice.reducer;
