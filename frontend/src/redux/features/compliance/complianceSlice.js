import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import * as complianceApi from "./complianceService";

const complianceAdapter = createEntityAdapter({
  selectId: (entity) => entity._id,
  sortComparer: (a, b) => {
    const aOverdue = a.nextDueDate ? new Date(a.nextDueDate) : new Date(9999);
    const bOverdue = b.nextDueDate ? new Date(b.nextDueDate) : new Date(9999);
    return aOverdue - bOverdue;
  },
});

const initialState = complianceAdapter.getInitialState({
  dashboard: null,
  stats: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  filters: {
    type: "",
    status: "",
    search: "",
  },
  loading: false,
  actionLoading: false,
  error: null,
});

const unwrap = (res) => res?.data ?? res;

export const fetchEntities = createAsyncThunk(
  "compliance/fetchEntities",
  async (params, { rejectWithValue }) => {
    try {
      return await complianceApi.getAllEntities(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch entities");
    }
  }
);

export const fetchEntity = createAsyncThunk(
  "compliance/fetchEntity",
  async (id, { rejectWithValue }) => {
    try {
      return await complianceApi.getEntity(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch entity");
    }
  }
);

export const createEntity = createAsyncThunk(
  "compliance/createEntity",
  async (data, { rejectWithValue }) => {
    try {
      return await complianceApi.createEntity(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to create entity");
    }
  }
);

export const updateEntity = createAsyncThunk(
  "compliance/updateEntity",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await complianceApi.updateEntity(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update entity");
    }
  }
);

export const deleteEntity = createAsyncThunk(
  "compliance/deleteEntity",
  async (id, { rejectWithValue }) => {
    try {
      return await complianceApi.deleteEntity(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to delete entity");
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  "compliance/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      return await complianceApi.getDashboard();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch dashboard");
    }
  }
);

export const fetchStats = createAsyncThunk(
  "compliance/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await complianceApi.getComplianceStats();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch stats");
    }
  }
);

export const fetchEntityPenalty = createAsyncThunk(
  "compliance/fetchEntityPenalty",
  async (id, { rejectWithValue }) => {
    try {
      return await complianceApi.getEntityPenalty(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch penalty");
    }
  }
);

export const markPaid = createAsyncThunk(
  "compliance/markPaid",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await complianceApi.markCompliancePaid(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to mark as paid");
    }
  }
);

const complianceSlice = createSlice({
  name: "compliance",
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
    clearDashboard: (state) => {
      state.dashboard = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntities.fulfilled, (state, action) => {
        state.loading = false;
        const payload = unwrap(action.payload);
        complianceAdapter.setAll(state, payload.data || []);
        state.pagination = payload.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      })
      .addCase(fetchEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEntity.fulfilled, (state, action) => {
        complianceAdapter.upsertOne(state, unwrap(action.payload));
      })
      .addCase(createEntity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createEntity.fulfilled, (state, action) => {
        state.actionLoading = false;
        complianceAdapter.addOne(state, unwrap(action.payload));
      })
      .addCase(createEntity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateEntity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateEntity.fulfilled, (state, action) => {
        state.actionLoading = false;
        const data = unwrap(action.payload);
        complianceAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(updateEntity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteEntity.fulfilled, (state, action) => {
        complianceAdapter.removeOne(state, action.meta.arg);
      })
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = unwrap(action.payload);
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = unwrap(action.payload);
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markPaid.fulfilled, (state, action) => {
        const data = unwrap(action.payload);
        complianceAdapter.updateOne(state, { id: data._id, changes: data });
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearError,
  clearDashboard,
} = complianceSlice.actions;

export const {
  selectAll: selectAllEntities,
  selectById: selectEntityById,
  selectIds: selectEntityIds,
  selectEntities: selectEntityEntities,
  selectTotal: selectTotalEntities,
} = complianceAdapter.getSelectors((state) => state.compliance);

export const selectComplianceEntities = (state) => selectAllEntities(state);
export const selectComplianceDashboard = (state) => state.compliance.dashboard;
export const selectComplianceStats = (state) => state.compliance.stats;
export const selectCompliancePagination = (state) => state.compliance.pagination;
export const selectComplianceFilters = (state) => state.compliance.filters;
export const selectComplianceLoading = (state) => state.compliance.loading;
export const selectComplianceActionLoading = (state) => state.compliance.actionLoading;
export const selectComplianceError = (state) => state.compliance.error;

export default complianceSlice.reducer;
