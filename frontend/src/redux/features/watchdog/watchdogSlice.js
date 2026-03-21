import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as watchdogApi from "./watchdogService";

const initialState = {
  monitoredEntities: [],
  alerts: [],
  dashboard: null,
  stats: null,
  pagination: { current: 1, limit: 20, totalRecords: 0, total: 0 },
  loading: false,
  actionLoading: false,
  checking: null, // store entity ID being checked, not boolean
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchMonitoredEntities = createAsyncThunk(
  "watchdog/fetchMonitored",
  async (params, { rejectWithValue }) => {
    try {
      return await watchdogApi.getMonitoredEntities(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch monitored entities",
      );
    }
  },
);

export const fetchAlerts = createAsyncThunk(
  "watchdog/fetchAlerts",
  async (params, { rejectWithValue }) => {
    try {
      // ✅ FIXED: calls getWatchdogReport which is what the backend has
      return await watchdogApi.getWatchdogReport(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch alerts",
      );
    }
  },
);

export const fetchDashboard = createAsyncThunk(
  "watchdog/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ FIXED: calls getWatchdogStats which is what the backend has
      return await watchdogApi.getWatchdogStats();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch dashboard",
      );
    }
  },
);

export const addMonitoredEntity = createAsyncThunk(
  "watchdog/addMonitored",
  async (data, { rejectWithValue }) => {
    try {
      return await watchdogApi.addMonitoredEntity(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to add entity",
      );
    }
  },
);

export const removeMonitoredEntity = createAsyncThunk(
  "watchdog/removeMonitored",
  async (id, { rejectWithValue }) => {
    try {
      return await watchdogApi.removeMonitoredEntity(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to remove entity",
      );
    }
  },
);

export const checkEntityStatus = createAsyncThunk(
  "watchdog/checkStatus",
  async (id, { rejectWithValue }) => {
    try {
      return await watchdogApi.checkEntityStatus(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to check status",
      );
    }
  },
);

export const acknowledgeAlert = createAsyncThunk(
  "watchdog/acknowledgeAlert",
  async (id, { rejectWithValue }) => {
    try {
      // ✅ FIXED: backend has acknowledgeStatusChange not dismissAlert
      return await watchdogApi.acknowledgeStatusChange(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to acknowledge alert",
      );
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

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

      // ── fetchMonitoredEntities ─────────────────────────────────────────
      .addCase(fetchMonitoredEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonitoredEntities.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        // ✅ FIXED: backend returns { status, data: [...], pagination }
        // api service already unwraps res.data, so payload = { status, data, pagination }
        state.monitoredEntities = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        state.pagination = payload?.pagination || initialState.pagination;
      })
      .addCase(fetchMonitoredEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.monitoredEntities = [];
      })

      // ── fetchAlerts (getWatchdogReport) ───────────────────────────────
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        // backend returns { status, data: [...], summary }
        state.alerts = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.alerts = [];
      })

      // ── fetchDashboard (getWatchdogStats) ─────────────────────────────
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        // backend returns { status, data: { totalMonitored, statusDistribution, ... } }
        state.dashboard = payload?.data || payload || null;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── addMonitoredEntity ────────────────────────────────────────────
      .addCase(addMonitoredEntity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addMonitoredEntity.fulfilled, (state, action) => {
        state.actionLoading = false;
        const payload = action.payload;
        // backend returns { status, data: entity }
        const newEntity = payload?.data || payload;
        if (newEntity && newEntity._id) {
          state.monitoredEntities.unshift(newEntity);
        }
      })
      .addCase(addMonitoredEntity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── removeMonitoredEntity ─────────────────────────────────────────
      .addCase(removeMonitoredEntity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(removeMonitoredEntity.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Remove by the ID that was passed as the argument
        state.monitoredEntities = state.monitoredEntities.filter(
          (e) => e._id !== action.meta.arg,
        );
      })
      .addCase(removeMonitoredEntity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── checkEntityStatus ─────────────────────────────────────────────
      .addCase(checkEntityStatus.pending, (state, action) => {
        // ✅ FIXED: store which entity ID is being checked
        state.checking = action.meta.arg;
      })
      .addCase(checkEntityStatus.fulfilled, (state, action) => {
        state.checking = null;
        const payload = action.payload;
        // Backend returns:
        // { status, data: { entityId, previousStatus, currentStatus,
        //   lastChecked, statusChanged, requiresAttention, checkResult } }
        const result = payload?.data || payload;

        if (result?.entityId) {
          const idx = state.monitoredEntities.findIndex(
            (e) => e._id === result.entityId,
          );
          if (idx !== -1) {
            // ✅ FIXED: update the nested cacPortalStatus fields in place
            state.monitoredEntities[idx] = {
              ...state.monitoredEntities[idx],
              cacPortalStatus: {
                ...state.monitoredEntities[idx].cacPortalStatus,
                portalStatus: result.currentStatus,
                previousPortalStatus: result.previousStatus,
                lastChecked: result.lastChecked,
                requiresAttention: result.requiresAttention,
              },
            };

            // If status changed to bad status, add to alerts array
            if (
              result.statusChanged &&
              ["INACTIVE", "STRUCK-OFF", "WOUND-UP"].includes(
                result.currentStatus,
              )
            ) {
              state.alerts.unshift({
                _id: `alert-${Date.now()}`,
                type: "status_change",
                entityName:
                  state.monitoredEntities[idx]?.entityName || "Unknown",
                message: `Status changed from ${result.previousStatus} to ${result.currentStatus}`,
                createdAt: new Date().toISOString(),
                entityId: result.entityId,
                requiresAttention: true,
              });
            }
          }
        }
      })
      .addCase(checkEntityStatus.rejected, (state, action) => {
        state.checking = null;
        state.error = action.payload;
      })

      // ── acknowledgeAlert ──────────────────────────────────────────────
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const id = action.meta.arg;
        // Remove from alerts list
        state.alerts = state.alerts.filter((a) => a._id !== id);
        // Also update the entity's requiresAttention flag
        const result = action.payload?.data || action.payload;
        if (result?.entityId) {
          const idx = state.monitoredEntities.findIndex(
            (e) => e._id === result.entityId,
          );
          if (idx !== -1) {
            state.monitoredEntities[idx] = {
              ...state.monitoredEntities[idx],
              cacPortalStatus: {
                ...state.monitoredEntities[idx].cacPortalStatus,
                requiresAttention: false,
              },
            };
          }
        }
      });
  },
});

export const { clearError, clearDashboard } = watchdogSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectMonitoredEntities = (state) =>
  state.watchdog.monitoredEntities;
export const selectWatchdogAlerts = (state) => state.watchdog.alerts;
export const selectWatchdogDashboard = (state) => state.watchdog.dashboard;
export const selectWatchdogStats = (state) => state.watchdog.stats;
export const selectWatchdogPagination = (state) => state.watchdog.pagination;
export const selectWatchdogLoading = (state) => state.watchdog.loading;
export const selectWatchdogActionLoading = (state) =>
  state.watchdog.actionLoading;
export const selectWatchdogChecking = (state) => state.watchdog.checking;
export const selectWatchdogError = (state) => state.watchdog.error;

export default watchdogSlice.reducer;
