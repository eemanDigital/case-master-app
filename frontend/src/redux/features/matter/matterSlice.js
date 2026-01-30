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

  // Bulk operations
  selectedMatters: [], // Array of selected matter IDs
  bulkLoading: false,
  bulkError: null,

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

// ============================================
// BULK ACTION ASYNC THUNKS
// ============================================

// Bulk update matters
export const bulkUpdateMatters = createAsyncThunk(
  "matter/bulkUpdate",
  async ({ matterIds, updateData }, { rejectWithValue }) => {
    try {
      const response = await matterService.bulkUpdateMatters(
        matterIds,
        updateData,
      );
      return response;
    } catch (error) {
      if (error.response?.status === 400) {
        return rejectWithValue({
          message: "Validation failed",
          errors: error.response.data.errors || {},
        });
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to update matters",
      );
    }
  },
);

// Bulk delete matters
export const bulkDeleteMatters = createAsyncThunk(
  "matter/bulkDelete",
  async (matterIds, { rejectWithValue }) => {
    try {
      const response = await matterService.bulkDeleteMatters(matterIds);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete matters",
      );
    }
  },
);

// Bulk assign account officer
export const bulkAssignOfficer = createAsyncThunk(
  "matter/bulkAssignOfficer",
  async ({ matterIds, officerId }, { rejectWithValue }) => {
    try {
      const response = await matterService.bulkAssignOfficer(
        matterIds,
        officerId,
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign officer",
      );
    }
  },
);

// Bulk export matters
export const bulkExportMatters = createAsyncThunk(
  "matter/bulkExport",
  async ({ matterIds, format = "csv" }, { rejectWithValue }) => {
    try {
      const data = await matterService.bulkExportMatters(matterIds, format);
      return data; // This is now the Blob
    } catch (error) {
      // If the response is a blob, the error message is inside it
      if (error.response && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        return rejectWithValue(errorData.message || "Failed to export");
      }
      return rejectWithValue(error.message || "Failed to export");
    }
  },
);

// ============================================
// EXISTING ASYNC THUNKS (Keep these)
// ============================================

export const createMatter = createAsyncThunk(
  "matter/create",
  async (matterData, { rejectWithValue }) => {
    try {
      const response = await matterService.createMatter(matterData);
      return response;
    } catch (error) {
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

// ============================================
// SLICE DEFINITION
// ============================================

const matterSlice = createSlice({
  name: "matter",
  initialState,
  reducers: {
    // ✅ Existing reducers...
    resetMatterState: (state) => {
      return initialState;
    },
    resetMatter: (state) => {
      state.currentMatter = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
      state.validationErrors = {};
    },
    resetValidationErrors: (state) => {
      state.validationErrors = {};
    },
    resetLoading: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.isError = false;
      state.message = "";
      state.validationErrors = {};
    },
    setCurrentMatter: (state, action) => {
      state.currentMatter = action.payload;
    },
    updateMatterInList: (state, action) => {
      const updatedMatter = action.payload;
      const index = state.matters.findIndex((m) => m._id === updatedMatter._id);
      if (index !== -1) {
        state.matters[index] = updatedMatter;
      }
    },
    removeMatterFromList: (state, action) => {
      const matterId = action.payload;
      state.matters = state.matters.filter((m) => m._id !== matterId);
      if (state.currentMatter?._id === matterId) {
        state.currentMatter = null;
      }
    },
    addMatterToList: (state, action) => {
      state.matters.unshift(action.payload);
    },

    // ✅ NEW: Bulk Action Selection Reducers
    selectMatter: (state, action) => {
      const matterId = action.payload;
      if (!state.selectedMatters.includes(matterId)) {
        state.selectedMatters.push(matterId);
      }
    },

    deselectMatter: (state, action) => {
      const matterId = action.payload;
      state.selectedMatters = state.selectedMatters.filter(
        (id) => id !== matterId,
      );
    },

    toggleSelectMatter: (state, action) => {
      const matterId = action.payload;
      const index = state.selectedMatters.indexOf(matterId);
      if (index > -1) {
        state.selectedMatters.splice(index, 1);
      } else {
        state.selectedMatters.push(matterId);
      }
    },

    selectAllMatters: (state, action) => {
      const matterIds = action.payload || state.matters.map((m) => m._id);
      state.selectedMatters = [
        ...new Set([...state.selectedMatters, ...matterIds]),
      ];
    },

    selectPageMatters: (state, action) => {
      // Select all matters in current page
      const pageMatters = action.payload;
      state.selectedMatters = [
        ...new Set([...state.selectedMatters, ...pageMatters]),
      ];
    },

    clearSelectedMatters: (state) => {
      state.selectedMatters = [];
    },

    setSelectedMatters: (state, action) => {
      state.selectedMatters = action.payload;
    },

    // Bulk operations loading states
    setBulkLoading: (state, action) => {
      state.bulkLoading = action.payload;
    },

    setBulkError: (state, action) => {
      state.bulkError = action.payload;
    },

    clearBulkError: (state) => {
      state.bulkError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ================ BULK ACTIONS ================

      // Bulk Update Matters
      .addCase(bulkUpdateMatters.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(bulkUpdateMatters.fulfilled, (state, action) => {
        state.bulkLoading = false;
        state.isSuccess = true;

        const updatedMatters =
          action.payload.data?.matters || action.payload.data || [];

        // Update matters in state
        updatedMatters.forEach((updatedMatter) => {
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
        });

        // Clear selection if option is set
        if (action.payload.data?.clearSelection) {
          state.selectedMatters = [];
        }

        state.message = `Successfully updated ${updatedMatters.length} matters`;
        message.success(state.message);
      })
      .addCase(bulkUpdateMatters.rejected, (state, action) => {
        state.bulkLoading = false;
        state.isError = true;
        state.bulkError = action.payload?.message || "Failed to update matters";

        if (action.payload?.errors) {
          state.validationErrors = action.payload.errors;
        }

        message.error(state.bulkError);
      })

      // Bulk Delete Matters
      .addCase(bulkDeleteMatters.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(bulkDeleteMatters.fulfilled, (state, action) => {
        state.bulkLoading = false;
        state.isSuccess = true;

        const deletedMatterIds =
          action.payload.data?.deletedMatterIds || action.meta.arg || [];

        // Remove deleted matters from state
        state.matters = state.matters.filter(
          (m) => !deletedMatterIds.includes(m._id),
        );

        // Remove from selected matters
        state.selectedMatters = state.selectedMatters.filter(
          (id) => !deletedMatterIds.includes(id),
        );

        // Clear current matter if it was deleted
        if (deletedMatterIds.includes(state.currentMatter?._id)) {
          state.currentMatter = null;
        }

        state.message = `Successfully deleted ${deletedMatterIds.length} matters`;
        message.success(state.message);
      })
      .addCase(bulkDeleteMatters.rejected, (state, action) => {
        state.bulkLoading = false;
        state.isError = true;
        state.bulkError = action.payload || "Failed to delete matters";
        message.error(state.bulkError);
      })

      // Bulk Assign Officer
      .addCase(bulkAssignOfficer.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(bulkAssignOfficer.fulfilled, (state, action) => {
        state.bulkLoading = false;
        state.isSuccess = true;

        const updatedMatters =
          action.payload.data?.matters || action.payload.data || [];

        // Update matters with new officer
        updatedMatters.forEach((updatedMatter) => {
          const index = state.matters.findIndex(
            (m) => m._id === updatedMatter._id,
          );
          if (index !== -1) {
            state.matters[index] = updatedMatter;
          }
        });

        state.message = `Successfully assigned officer to ${updatedMatters.length} matters`;
        message.success(state.message);
      })
      .addCase(bulkAssignOfficer.rejected, (state, action) => {
        state.bulkLoading = false;
        state.isError = true;
        state.bulkError = action.payload || "Failed to assign officer";
        message.error(state.bulkError);
      })

      // Bulk Export Matters
      .addCase(bulkExportMatters.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(bulkExportMatters.fulfilled, (state, action) => {
        state.bulkLoading = false;
        state.isSuccess = true;

        const exportCount = action.meta.arg?.matterIds?.length || 0;
        state.message = `Successfully exported ${exportCount} matters`;

        // Note: File download is handled in the component
      })
      .addCase(bulkExportMatters.rejected, (state, action) => {
        state.bulkLoading = false;
        state.isError = true;
        state.bulkError = action.payload || "Failed to export matters";
        message.error(state.bulkError);
      })

      // ================ EXISTING CASES ================

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

// Export all actions
export const {
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

  // Bulk action selectors
  selectMatter,
  deselectMatter,
  toggleSelectMatter,
  selectAllMatters,
  selectPageMatters,
  clearSelectedMatters,
  setSelectedMatters,

  // Bulk loading states
  setBulkLoading,
  setBulkError,
  clearBulkError,
} = matterSlice.actions;

export default matterSlice.reducer;
