import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import litigationService from "./litigationService";
import { message } from "antd";

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // List state
  matters: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  // Filters
  filters: {
    courtName: "",
    suitNo: "",
    judge: "",
    currentStage: "",
    status: "",
    clientId: "",
    year: "",
  },

  // Selected matter details
  selectedMatter: null,
  selectedDetails: null,

  // Statistics
  stats: null,
  dashboard: null,
  upcomingHearings: [],

  // Loading states
  loading: false,
  detailsLoading: false,
  statsLoading: false,
  actionLoading: false,

  // Error handling
  error: null,

  // UI state
  searchMode: false,
};

// ============================================
// ASYNC THUNKS
// ============================================

// Fetch all litigation matters with pagination
export const fetchLitigationMatters = createAsyncThunk(
  "litigation/fetchMatters",
  async (params, { rejectWithValue }) => {
    try {
      const response = await litigationService.getAllLitigationMatters(params);
      return response; // apiService already returns data
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch litigation matters",
      );
    }
  },
);

// Advanced search
export const searchLitigationMatters = createAsyncThunk(
  "litigation/searchMatters",
  async ({ criteria, params = {} }, { rejectWithValue }) => {
    try {
      const response = await litigationService.searchLitigationMatters(
        criteria,
        params,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Search failed");
    }
  },
);

// Fetch litigation details
export const fetchLitigationDetails = createAsyncThunk(
  "litigation/fetchDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await litigationService.getLitigationDetails(matterId);
      return response; // Contains { status, data: { litigationDetail } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch litigation details",
      );
    }
  },
);

// Create litigation details
export const createLitigationDetails = createAsyncThunk(
  "litigation/createDetails",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await litigationService.createLitigationDetails(
        matterId,
        data,
      );
      message.success("Litigation details created successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to create litigation details",
      );
      return rejectWithValue(error.response?.data || "Creation failed");
    }
  },
);

// Update litigation details
export const updateLitigationDetails = createAsyncThunk(
  "litigation/updateDetails",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await litigationService.updateLitigationDetails(
        matterId,
        data,
      );
      message.success("Litigation details updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update litigation details",
      );
      return rejectWithValue(error.response?.data || "Update failed");
    }
  },
);

// Delete litigation details
export const deleteLitigationDetails = createAsyncThunk(
  "litigation/deleteDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      await litigationService.deleteLitigationDetails(matterId);
      message.success("Litigation details deleted successfully");
      return matterId;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to delete litigation details",
      );
      return rejectWithValue(error.response?.data || "Deletion failed");
    }
  },
);

// Add hearing
export const addHearing = createAsyncThunk(
  "litigation/addHearing",
  async ({ matterId, hearingData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.addHearing(
        matterId,
        hearingData,
      );
      message.success("Hearing added successfully and synced to calendar");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add hearing");
      return rejectWithValue(error.response?.data || "Failed to add hearing");
    }
  },
);

// Update hearing
export const updateHearing = createAsyncThunk(
  "litigation/updateHearing",
  async ({ matterId, hearingId, hearingData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.updateHearing(
        matterId,
        hearingId,
        hearingData,
      );
      message.success("Hearing updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update hearing",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update hearing",
      );
    }
  },
);

// Delete hearing
export const deleteHearing = createAsyncThunk(
  "litigation/deleteHearing",
  async ({ matterId, hearingId }, { rejectWithValue }) => {
    try {
      const response = await litigationService.deleteHearing(
        matterId,
        hearingId,
      );
      message.success("Hearing deleted successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to delete hearing",
      );
      return rejectWithValue(
        error.response?.data || "Failed to delete hearing",
      );
    }
  },
);

// Add court order
export const addCourtOrder = createAsyncThunk(
  "litigation/addCourtOrder",
  async ({ matterId, orderData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.addCourtOrder(
        matterId,
        orderData,
      );
      message.success(response.message || "Court order added successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to add court order",
      );
      return rejectWithValue(
        error.response?.data || "Failed to add court order",
      );
    }
  },
);

// Record judgment
export const recordJudgment = createAsyncThunk(
  "litigation/recordJudgment",
  async ({ matterId, judgmentData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.recordJudgment(
        matterId,
        judgmentData,
      );
      message.success("Judgment recorded successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to record judgment",
      );
      return rejectWithValue(
        error.response?.data || "Failed to record judgment",
      );
    }
  },
);

// Record settlement
export const recordSettlement = createAsyncThunk(
  "litigation/recordSettlement",
  async ({ matterId, settlementData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.recordSettlement(
        matterId,
        settlementData,
      );
      message.success("Settlement recorded successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to record settlement",
      );
      return rejectWithValue(
        error.response?.data || "Failed to record settlement",
      );
    }
  },
);

// File appeal
export const fileAppeal = createAsyncThunk(
  "litigation/fileAppeal",
  async ({ matterId, appealData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.fileAppeal(matterId, appealData);
      message.success("Appeal filed successfully");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to file appeal");
      return rejectWithValue(error.response?.data || "Failed to file appeal");
    }
  },
);

// Fetch statistics
export const fetchLitigationStats = createAsyncThunk(
  "litigation/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await litigationService.getLitigationStats();
      return response.data; // Extract data from response
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch statistics",
      );
    }
  },
);

// Fetch dashboard
export const fetchLitigationDashboard = createAsyncThunk(
  "litigation/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await litigationService.getLitigationDashboard();
      return response.data; // Extract data from response
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch dashboard",
      );
    }
  },
);

// Fetch upcoming hearings
export const fetchUpcomingHearings = createAsyncThunk(
  "litigation/fetchUpcomingHearings",
  async (params, { rejectWithValue }) => {
    try {
      const response = await litigationService.getUpcomingHearings(params);
      return response.data; // Extract data from response
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch upcoming hearings",
      );
    }
  },
);

// ============================================
// SLICE
// ============================================

const litigationSlice = createSlice({
  name: "litigation",
  initialState,
  reducers: {
    // Filter actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page on filter change
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },

    // Pagination
    setCurrentPage: (state, action) => {
      state.pagination.page = action.payload;
    },

    setPageSize: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },

    // Selected matter
    setSelectedMatter: (state, action) => {
      state.selectedMatter = action.payload;
    },

    clearSelectedMatter: (state) => {
      state.selectedMatter = null;
      state.selectedDetails = null;
    },

    // Search mode
    setSearchMode: (state, action) => {
      state.searchMode = action.payload;
    },

    // Clear errors
    clearError: (state) => {
      state.error = null;
    },

    // Manually update matters list
    updateMatterInList: (state, action) => {
      const updatedMatter = action.payload;
      const index = state.matters.findIndex((m) => m._id === updatedMatter._id);
      if (index !== -1) {
        state.matters[index] = { ...state.matters[index], ...updatedMatter };
      }
    },
  },

  extraReducers: (builder) => {
    // Fetch litigation matters
    builder
      .addCase(fetchLitigationMatters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLitigationMatters.fulfilled, (state, action) => {
        state.loading = false;
        state.matters = action.payload.data || [];
        state.pagination = {
          page: action.payload.pagination?.page || 1,
          limit: action.payload.pagination?.limit || 20,
          total: action.payload.pagination?.total || 0,
          pages: action.payload.pagination?.pages || 0,
        };
        state.searchMode = false;
      })
      .addCase(fetchLitigationMatters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Search litigation matters
    builder
      .addCase(searchLitigationMatters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchLitigationMatters.fulfilled, (state, action) => {
        state.loading = false;
        state.matters = action.payload.data || [];
        state.pagination = {
          page: action.payload.pagination?.page || 1,
          limit: action.payload.pagination?.limit || 20,
          total: action.payload.pagination?.total || 0,
          pages: action.payload.pagination?.pages || 0,
        };
        state.searchMode = true;
      })
      .addCase(searchLitigationMatters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch litigation details
    builder
      .addCase(fetchLitigationDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchLitigationDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(fetchLitigationDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      });

    // Create litigation details
    builder
      .addCase(createLitigationDetails.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createLitigationDetails.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(createLitigationDetails.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Update litigation details
    builder
      .addCase(updateLitigationDetails.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateLitigationDetails.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(updateLitigationDetails.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Delete litigation details
    builder
      .addCase(deleteLitigationDetails.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteLitigationDetails.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Remove from matters list
        state.matters = state.matters.filter((m) => m._id !== action.payload);
        state.selectedDetails = null;
        state.selectedMatter = null;
      })
      .addCase(deleteLitigationDetails.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Hearing actions
    builder
      .addCase(addHearing.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addHearing.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(addHearing.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateHearing.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateHearing.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(updateHearing.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteHearing.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteHearing.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(deleteHearing.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Court order
    builder
      .addCase(addCourtOrder.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addCourtOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(addCourtOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Case outcomes
    builder
      .addCase(recordJudgment.fulfilled, (state, action) => {
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(recordSettlement.fulfilled, (state, action) => {
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(fileAppeal.fulfilled, (state, action) => {
        state.selectedDetails = action.payload.data?.litigationDetail;
      });

    // Statistics
    builder
      .addCase(fetchLitigationStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchLitigationStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchLitigationStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      });

    // Dashboard
    builder
      .addCase(fetchLitigationDashboard.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchLitigationDashboard.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchLitigationDashboard.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      });

    // Upcoming hearings
    builder
      .addCase(fetchUpcomingHearings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUpcomingHearings.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingHearings = action.payload;
      })
      .addCase(fetchUpcomingHearings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  clearSelectedMatter,
  setSearchMode,
  clearError,
  updateMatterInList,
} = litigationSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectLitigationMatters = (state) => state.litigation.matters;
export const selectPagination = (state) => state.litigation.pagination;
export const selectTotalMatters = (state) => state.litigation.pagination.total;
export const selectCurrentPage = (state) => state.litigation.pagination.page;
export const selectPageSize = (state) => state.litigation.pagination.limit;
export const selectFilters = (state) => state.litigation.filters;
export const selectSelectedMatter = (state) => state.litigation.selectedMatter;
export const selectSelectedDetails = (state) =>
  state.litigation.selectedDetails;
export const selectLitigationStats = (state) => state.litigation.stats;
export const selectLitigationDashboard = (state) => state.litigation.dashboard;
export const selectUpcomingHearings = (state) =>
  state.litigation.upcomingHearings;
export const selectLitigationLoading = (state) => state.litigation.loading;
export const selectDetailsLoading = (state) => state.litigation.detailsLoading;
export const selectStatsLoading = (state) => state.litigation.statsLoading;
export const selectActionLoading = (state) => state.litigation.actionLoading;
export const selectLitigationError = (state) => state.litigation.error;
export const selectSearchMode = (state) => state.litigation.searchMode;

export default litigationSlice.reducer;
