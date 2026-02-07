import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import retainerService from "./retainerService";

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

export const fetchRetainerMatters = createAsyncThunk(
  "retainer/fetchMatters",
  async (params, { rejectWithValue }) => {
    try {
      const response = await retainerService.getAllRetainerMatters(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const searchRetainerMatters = createAsyncThunk(
  "retainer/searchMatters",
  async ({ criteria, options }, { rejectWithValue }) => {
    try {
      const response = await retainerService.searchRetainerMatters(
        criteria,
        options,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const fetchRetainerStats = createAsyncThunk(
  "retainer/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await retainerService.getRetainerStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const fetchExpiringRetainers = createAsyncThunk(
  "retainer/fetchExpiring",
  async (params, { rejectWithValue }) => {
    try {
      const response = await retainerService.getExpiringRetainers(params);
      return response.data.retainers;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const fetchPendingRequests = createAsyncThunk(
  "retainer/fetchPendingRequests",
  async (params, { rejectWithValue }) => {
    try {
      const response = await retainerService.getPendingRequests(params);
      return response.data.pendingRequests;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const fetchRetainerDetails = createAsyncThunk(
  "retainer/fetchDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await retainerService.getRetainerDetails(matterId);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const createRetainerDetails = createAsyncThunk(
  "retainer/createDetails",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.createRetainerDetails(
        matterId,
        data,
      );
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const updateRetainerDetails = createAsyncThunk(
  "retainer/updateDetails",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.updateRetainerDetails(
        matterId,
        data,
      );
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const deleteRetainerDetails = createAsyncThunk(
  "retainer/deleteDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      await retainerService.deleteRetainerDetails(matterId);
      return matterId;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const restoreRetainerDetails = createAsyncThunk(
  "retainer/restoreDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await retainerService.restoreRetainerDetails(matterId);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const addService = createAsyncThunk(
  "retainer/addService",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.addService(matterId, data);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const updateService = createAsyncThunk(
  "retainer/updateService",
  async ({ matterId, serviceId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.updateService(
        matterId,
        serviceId,
        data,
      );
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const removeService = createAsyncThunk(
  "retainer/removeService",
  async ({ matterId, serviceId }, { rejectWithValue }) => {
    try {
      const response = await retainerService.removeService(matterId, serviceId);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const updateServiceUsage = createAsyncThunk(
  "retainer/updateServiceUsage",
  async ({ matterId, serviceId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.updateServiceUsage(
        matterId,
        serviceId,
        data,
      );
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const addDisbursement = createAsyncThunk(
  "retainer/addDisbursement",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.addDisbursement(matterId, data);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const updateDisbursement = createAsyncThunk(
  "retainer/updateDisbursement",
  async ({ matterId, disbursementId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.updateDisbursement(
        matterId,
        disbursementId,
        data,
      );
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const deleteDisbursement = createAsyncThunk(
  "retainer/deleteDisbursement",
  async ({ matterId, disbursementId }, { rejectWithValue }) => {
    try {
      const response = await retainerService.deleteDisbursement(
        matterId,
        disbursementId,
      );
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const addCourtAppearance = createAsyncThunk(
  "retainer/addCourtAppearance",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.addCourtAppearance(matterId, data);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const logActivity = createAsyncThunk(
  "retainer/logActivity",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.logActivity(matterId, data);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const addRequest = createAsyncThunk(
  "retainer/addRequest",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.addRequest(matterId, data);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const updateRequest = createAsyncThunk(
  "retainer/updateRequest",
  async ({ matterId, requestId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.updateRequest(
        matterId,
        requestId,
        data,
      );
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const deleteRequest = createAsyncThunk(
  "retainer/deleteRequest",
  async ({ matterId, requestId }, { rejectWithValue }) => {
    try {
      const response = await retainerService.deleteRequest(matterId, requestId);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const updateNBAStamp = createAsyncThunk(
  "retainer/updateNBAStamp",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.updateNBAStamp(matterId, data);
      return response.data.retainerDetail;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const renewRetainer = createAsyncThunk(
  "retainer/renew",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.renewRetainer(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const terminateRetainer = createAsyncThunk(
  "retainer/terminate",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await retainerService.terminateRetainer(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const fetchRetainerSummary = createAsyncThunk(
  "retainer/fetchSummary",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await retainerService.getRetainerSummary(matterId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const bulkUpdateRetainerMatters = createAsyncThunk(
  "retainer/bulkUpdate",
  async (data, { rejectWithValue }) => {
    try {
      const response = await retainerService.bulkUpdateRetainerMatters(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  },
);

const retainerSlice = createSlice({
  name: "retainer",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 1;
    },
    setSelectedMatter: (state, action) => {
      state.selectedMatter = action.payload;
    },
    clearSelectedMatter: (state) => {
      state.selectedMatter = null;
    },
    setSearchMode: (state, action) => {
      state.searchMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSummary: (state) => {
      state.retainerSummary = null;
    },
  },
  extraReducers: (builder) => {
    // FIXED: Proper pagination handling
    builder.addCase(fetchRetainerMatters.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRetainerMatters.fulfilled, (state, action) => {
      state.loading = false;
      state.matters = action.payload?.data || action.payload || [];
      state.pagination = {
        currentPage: action.payload?.page || 1,
        pageSize: action.payload?.limit || 50,
        totalItems: action.payload?.total || 0,
        totalPages: action.payload?.totalPages || 0,
      };
      state.searchMode = false;
    });
    builder.addCase(fetchRetainerMatters.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to fetch";
    });

    builder.addCase(searchRetainerMatters.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(searchRetainerMatters.fulfilled, (state, action) => {
      state.loading = false;
      state.matters = action.payload?.data || [];
      state.pagination = {
        currentPage: action.payload?.page || 1,
        pageSize: action.payload?.limit || 50,
        totalItems: action.payload?.total || 0,
        totalPages: action.payload?.totalPages || 0,
      };
      state.searchMode = true;
    });
    builder.addCase(searchRetainerMatters.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message;
    });

    builder.addCase(fetchRetainerStats.pending, (state) => {
      state.statsLoading = true;
    });
    builder.addCase(fetchRetainerStats.fulfilled, (state, action) => {
      state.statsLoading = false;
      state.stats = action.payload;
    });
    builder.addCase(fetchRetainerStats.rejected, (state, action) => {
      state.statsLoading = false;
      state.error = action.payload?.message;
    });

    builder.addCase(fetchExpiringRetainers.fulfilled, (state, action) => {
      state.expiringRetainers = action.payload || [];
    });
    builder.addCase(fetchPendingRequests.fulfilled, (state, action) => {
      state.pendingRequests = action.payload || [];
    });

    builder.addCase(fetchRetainerDetails.pending, (state) => {
      state.detailsLoading = true;
    });
    builder.addCase(fetchRetainerDetails.fulfilled, (state, action) => {
      state.detailsLoading = false;
      state.selectedDetails = action.payload;
    });
    builder.addCase(fetchRetainerDetails.rejected, (state, action) => {
      state.detailsLoading = false;
      state.error = action.payload?.message;
    });

    const crudOperations = [
      createRetainerDetails,
      updateRetainerDetails,
      deleteRetainerDetails,
      restoreRetainerDetails,
    ];
    crudOperations.forEach((thunk) => {
      builder.addCase(thunk.pending, (state) => {
        state.actionLoading = true;
      });
      builder.addCase(thunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails =
          thunk === deleteRetainerDetails ? null : action.payload;
      });
      builder.addCase(thunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message;
      });
    });

    const detailUpdateOperations = [
      addService,
      updateService,
      removeService,
      updateServiceUsage,
      addDisbursement,
      updateDisbursement,
      deleteDisbursement,
      addCourtAppearance,
      logActivity,
      addRequest,
      updateRequest,
      deleteRequest,
      updateNBAStamp,
    ];
    detailUpdateOperations.forEach((thunk) => {
      builder.addCase(thunk.pending, (state) => {
        state.actionLoading = true;
      });
      builder.addCase(thunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload;
      });
      builder.addCase(thunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message;
      });
    });

    builder.addCase(fetchRetainerSummary.pending, (state) => {
      state.summaryLoading = true;
    });
    builder.addCase(fetchRetainerSummary.fulfilled, (state, action) => {
      state.summaryLoading = false;
      state.retainerSummary = action.payload;
    });
    builder.addCase(fetchRetainerSummary.rejected, (state, action) => {
      state.summaryLoading = false;
      state.error = action.payload?.message;
    });

    builder.addCase(renewRetainer.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(renewRetainer.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.selectedDetails = action.payload?.newRetainer;
    });
    builder.addCase(renewRetainer.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload?.message;
    });

    builder.addCase(terminateRetainer.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(terminateRetainer.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.selectedDetails = action.payload?.retainerDetail;
    });
    builder.addCase(terminateRetainer.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload?.message;
    });

    builder.addCase(bulkUpdateRetainerMatters.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(bulkUpdateRetainerMatters.fulfilled, (state) => {
      state.actionLoading = false;
    });
    builder.addCase(bulkUpdateRetainerMatters.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload?.message;
    });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  clearSelectedMatter,
  setSearchMode,
  clearError,
  clearSummary,
} = retainerSlice.actions;

export const selectRetainerMatters = (state) => state.retainer.matters;
export const selectPagination = (state) => state.retainer.pagination;
export const selectFilters = (state) => state.retainer.filters;
export const selectSelectedMatter = (state) => state.retainer.selectedMatter;
export const selectSelectedDetails = (state) => state.retainer.selectedDetails;
export const selectRetainerSummary = (state) => state.retainer.retainerSummary;
export const selectRetainerStats = (state) => state.retainer.stats;
export const selectExpiringRetainers = (state) =>
  state.retainer.expiringRetainers;
export const selectPendingRequests = (state) => state.retainer.pendingRequests;
export const selectRetainerLoading = (state) => state.retainer.loading;
export const selectDetailsLoading = (state) => state.retainer.detailsLoading;
export const selectStatsLoading = (state) => state.retainer.statsLoading;
export const selectActionLoading = (state) => state.retainer.actionLoading;
export const selectSummaryLoading = (state) => state.retainer.summaryLoading;
export const selectRetainerError = (state) => state.retainer.error;
export const selectSearchMode = (state) => state.retainer.searchMode;

export default retainerSlice.reducer;
