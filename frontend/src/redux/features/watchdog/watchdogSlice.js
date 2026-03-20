import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as watchdogApi from "./watchdogService";

const initialState = {
  monitoredEntities: [],
  alerts: [],
  dashboard: null,
  stats: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  loading: false,
  actionLoading: false,
  checking: false,
  error: null,
};

const unwrap = (res) => res?.data ?? res;

export const fetchMonitoredEntities = createAsyncThunk(
  "watchdog/fetchMonitored",
  async (params, { rejectWithValue }) => {
    try {
      return await watchdogApi.getMonitoredEntities(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch monitored entities");
    }
  }
);

export const fetchAlerts = createAsyncThunk(
  "watchdog/fetchAlerts",
  async (params, { rejectWithValue }) => {
    try {
      return await watchdogApi.getWatchdogAlerts(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch alerts");
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  "watchdog/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      return await watchdogApi.getWatchdogDashboard();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch dashboard");
    }
  }
);

export const fetchStats = createAsyncThunk(
  "watchdog/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await watchdogApi.getWatchdogStats();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch stats");
    }
  }
);

export const addMonitoredEntity = createAsyncThunk(
  "watchdog/addMonitored",
  async (data, { rejectWithValue }) => {
    try {
      return await watchdogApi.addMonitoredEntity(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to add entity");
    }
  }
);

export const removeMonitoredEntity = createAsyncThunk(
  "watchdog/removeMonitored",
  async (id, { rejectWithValue }) => {
    try {
      return await watchdogApi.removeMonitoredEntity(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to remove entity");
    }
  }
);

export const checkEntityStatus = createAsyncThunk(
  "watchdog/checkStatus",
  async (id, { rejectWithValue }) => {
    try {
      return await watchdogApi.checkEntityStatus(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to check status");
    }
  }
);

export const dismissAlert = createAsyncThunk(
  "watchdog/dismissAlert",
  async (id, { rejectWithValue }) => {
    try {
      return await watchdogApi.dismissAlert(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to dismiss alert");
    }
  }
);

export const dismissAllAlerts = createAsyncThunk(
  "watchdog/dismissAll",
  async (_, { rejectWithValue }) => {
    try {
      return await watchdogApi.dismissAllAlerts();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to dismiss alerts");
    }
  }
);

const watchdogSlice = createSlice({
  name: "watchdog",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDashboard: (state) => {
      state.dashboard = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonitoredEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonitoredEntities.fulfilled, (state, action) => {
        state.loading = false;
        const payload = unwrap(action.payload);
        state.monitoredEntities = payload.data || [];
        state.pagination = payload.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      })
      .addCase(fetchMonitoredEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        const payload = unwrap(action.payload);
        state.alerts = payload.data || [];
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
      .addCase(addMonitoredEntity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addMonitoredEntity.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.monitoredEntities.push(unwrap(action.payload));
      })
      .addCase(addMonitoredEntity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(removeMonitoredEntity.fulfilled, (state, action) => {
        state.monitoredEntities = state.monitoredEntities.filter(
          (e) => e._id !== action.meta.arg
        );
      })
      .addCase(checkEntityStatus.pending, (state) => {
        state.checking = true;
      })
      .addCase(checkEntityStatus.fulfilled, (state, action) => {
        state.checking = false;
        const updated = unwrap(action.payload);
        const idx = state.monitoredEntities.findIndex((e) => e._id === updated._id);
        if (idx !== -1) {
          state.monitoredEntities[idx] = updated;
        }
      })
      .addCase(checkEntityStatus.rejected, (state, action) => {
        state.checking = false;
        state.error = action.payload;
      })
      .addCase(dismissAlert.fulfilled, (state, action) => {
        state.alerts = state.alerts.filter((a) => a._id !== action.meta.arg);
      })
      .addCase(dismissAllAlerts.fulfilled, (state) => {
        state.alerts = [];
      });
  },
});

export const { clearError, clearDashboard } = watchdogSlice.actions;

export const selectMonitoredEntities = (state) => state.watchdog.monitoredEntities;
export const selectWatchdogAlerts = (state) => state.watchdog.alerts;
export const selectWatchdogDashboard = (state) => state.watchdog.dashboard;
export const selectWatchdogStats = (state) => state.watchdog.stats;
export const selectWatchdogPagination = (state) => state.watchdog.pagination;
export const selectWatchdogLoading = (state) => state.watchdog.loading;
export const selectWatchdogActionLoading = (state) => state.watchdog.actionLoading;
export const selectWatchdogChecking = (state) => state.watchdog.checking;
export const selectWatchdogError = (state) => state.watchdog.error;

export default watchdogSlice.reducer;
