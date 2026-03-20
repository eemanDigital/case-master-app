import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import * as deadlineApi from "./deadlineService";

const deadlineAdapter = createEntityAdapter({
  selectId: (deadline) => deadline._id,
  sortComparer: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
});

const initialState = deadlineAdapter.getInitialState({
  stats: null,
  performanceReport: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  filters: {
    priority: "",
    status: "",
    category: "",
    assignedTo: "",
    matterId: "",
    startDate: "",
    endDate: "",
  },
  loading: false,
  actionLoading: false,
  error: null,
});

const unwrap = (res) => res?.data ?? res;

export const fetchDeadlines = createAsyncThunk(
  "deadline/fetchDeadlines",
  async (params, { rejectWithValue }) => {
    try {
      return await deadlineApi.getAllDeadlines(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch deadlines");
    }
  }
);

export const fetchDeadline = createAsyncThunk(
  "deadline/fetchDeadline",
  async (id, { rejectWithValue }) => {
    try {
      return await deadlineApi.getDeadline(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch deadline");
    }
  }
);

export const createDeadline = createAsyncThunk(
  "deadline/createDeadline",
  async (data, { rejectWithValue }) => {
    try {
      return await deadlineApi.createDeadline(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to create deadline");
    }
  }
);

export const updateDeadline = createAsyncThunk(
  "deadline/updateDeadline",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await deadlineApi.updateDeadline(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update deadline");
    }
  }
);

export const deleteDeadline = createAsyncThunk(
  "deadline/deleteDeadline",
  async (id, { rejectWithValue }) => {
    try {
      return await deadlineApi.deleteDeadline(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to delete deadline");
    }
  }
);

export const completeDeadline = createAsyncThunk(
  "deadline/completeDeadline",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await deadlineApi.completeDeadline(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to complete deadline");
    }
  }
);

export const extendDeadline = createAsyncThunk(
  "deadline/extendDeadline",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await deadlineApi.extendDeadline(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to extend deadline");
    }
  }
);

export const fetchDeadlineStats = createAsyncThunk(
  "deadline/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await deadlineApi.getDeadlineStats();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch stats");
    }
  }
);

export const fetchPerformanceReport = createAsyncThunk(
  "deadline/fetchPerformanceReport",
  async (params, { rejectWithValue }) => {
    try {
      return await deadlineApi.getPerformanceReport(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch report");
    }
  }
);

export const exportPerformanceReport = createAsyncThunk(
  "deadline/exportReport",
  async (data, { rejectWithValue }) => {
    try {
      return await deadlineApi.exportPerformanceReport(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to export report");
    }
  }
);

const deadlineSlice = createSlice({
  name: "deadline",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearStats: (state) => {
      state.stats = null;
    },
    clearPerformanceReport: (state) => {
      state.performanceReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeadlines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeadlines.fulfilled, (state, action) => {
        state.loading = false;
        const payload = unwrap(action.payload);
        deadlineAdapter.setAll(state, payload.data || []);
        state.pagination = payload.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      })
      .addCase(fetchDeadlines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDeadline.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDeadline.fulfilled, (state, action) => {
        state.loading = false;
        deadlineAdapter.upsertOne(state, unwrap(action.payload));
      })
      .addCase(fetchDeadline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDeadline.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createDeadline.fulfilled, (state, action) => {
        state.actionLoading = false;
        deadlineAdapter.addOne(state, unwrap(action.payload));
      })
      .addCase(createDeadline.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateDeadline.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateDeadline.fulfilled, (state, action) => {
        state.actionLoading = false;
        const data = unwrap(action.payload);
        deadlineAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(updateDeadline.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteDeadline.fulfilled, (state, action) => {
        deadlineAdapter.removeOne(state, action.meta.arg);
      })
      .addCase(completeDeadline.fulfilled, (state, action) => {
        const data = unwrap(action.payload);
        deadlineAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(extendDeadline.fulfilled, (state, action) => {
        const data = unwrap(action.payload);
        deadlineAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(fetchDeadlineStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDeadlineStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = unwrap(action.payload);
      })
      .addCase(fetchDeadlineStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPerformanceReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPerformanceReport.fulfilled, (state, action) => {
        state.loading = false;
        state.performanceReport = unwrap(action.payload);
      })
      .addCase(fetchPerformanceReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearError,
  clearStats,
  clearPerformanceReport,
} = deadlineSlice.actions;

export const {
  selectAll: selectAllDeadlines,
  selectById: selectDeadlineById,
  selectIds: selectDeadlineIds,
  selectEntities: selectDeadlineEntities,
  selectTotal: selectTotalDeadlines,
} = deadlineAdapter.getSelectors((state) => state.deadline);

export const selectDeadlines = (state) => selectAllDeadlines(state);
export const selectDeadlineStats = (state) => state.deadline.stats;
export const selectPerformanceReport = (state) => state.deadline.performanceReport;
export const selectDeadlinePagination = (state) => state.deadline.pagination;
export const selectDeadlineFilters = (state) => state.deadline.filters;
export const selectDeadlineLoading = (state) => state.deadline.loading;
export const selectDeadlineActionLoading = (state) => state.deadline.actionLoading;
export const selectDeadlineError = (state) => state.deadline.error;

export default deadlineSlice.reducer;
