import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import litigationService from "./litigationService";
import { message } from "antd";

// ============================================
// INITIAL STATE
// ============================================

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
  hearingsStats: { total: 0, today: 0, thisWeek: 0, pending: 0, completed: 0 },
  matterHearings: [],
  matterHearingsStats: {
    total: 0,
    past: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
    pending: 0,
  },
  loading: false,
  detailsLoading: false,
  statsLoading: false,
  actionLoading: false,
  error: null,
  searchMode: false,
};

// ============================================
// HELPERS
// ============================================

/**
 * Generates a temporary client-side ID for optimistic items.
 * Prefixed with "optimistic_" so reducers can identify and replace them
 * once the server responds with the real _id.
 */
const makeOptimisticId = () =>
  `optimistic_${Date.now()}_${Math.random().toString(36).slice(2)}`;

/**
 * Recomputes matterHearingsStats from a hearings array locally.
 * Used after every optimistic mutation so the stat cards stay in sync
 * without waiting for the server.
 */
const computeHearingsStats = (hearings) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return hearings.reduce(
    (acc, h) => {
      const d = new Date(h.date);
      d.setHours(0, 0, 0, 0);
      acc.total += 1;
      if (d < now) acc.past += 1;
      else if (d.getTime() === now.getTime()) acc.today += 1;
      else acc.upcoming += 1;
      if (h.outcome) acc.completed += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, past: 0, today: 0, upcoming: 0, completed: 0, pending: 0 },
  );
};

// ============================================
// ASYNC THUNKS — standard (no optimism needed)
// ============================================

export const fetchLitigationMatters = createAsyncThunk(
  "litigation/fetchMatters",
  async (params, { rejectWithValue }) => {
    try {
      return await litigationService.getAllLitigationMatters(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch litigation matters",
      );
    }
  },
);

export const searchLitigationMatters = createAsyncThunk(
  "litigation/searchMatters",
  async ({ criteria, params = {} }, { rejectWithValue }) => {
    try {
      return await litigationService.searchLitigationMatters(criteria, params);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Search failed");
    }
  },
);

export const fetchLitigationDetails = createAsyncThunk(
  "litigation/fetchDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      return await litigationService.getLitigationDetails(matterId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch litigation details",
      );
    }
  },
);

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

// ============================================
// HEARINGS THUNKS
//
// We pass _snapshot inside meta.arg so the reducer can roll back
// without needing a dedicated "rollback" state field.
// The snapshot is attached in the pending reducer (not here) because
// that's where we have access to current state.
// ============================================

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

// ============================================
// COURT ORDERS
// ============================================

export const addCourtOrder = createAsyncThunk(
  "litigation/addCourtOrder",
  async ({ matterId, orderData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.addCourtOrder(
        matterId,
        orderData,
      );
      message.success("Court order added successfully");
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

export const updateCourtOrder = createAsyncThunk(
  "litigation/updateCourtOrder",
  async ({ matterId, orderId, orderData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.updateCourtOrder(
        matterId,
        orderId,
        orderData,
      );
      message.success("Court order updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update court order",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update court order",
      );
    }
  },
);

export const deleteCourtOrder = createAsyncThunk(
  "litigation/deleteCourtOrder",
  async ({ matterId, orderId }, { rejectWithValue }) => {
    try {
      const response = await litigationService.deleteCourtOrder(
        matterId,
        orderId,
      );
      message.success("Court order deleted successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to delete court order",
      );
      return rejectWithValue(
        error.response?.data || "Failed to delete court order",
      );
    }
  },
);

// ============================================
// PROCESSES FILED
// ============================================

export const addProcessFiled = createAsyncThunk(
  "litigation/addProcessFiled",
  async ({ matterId, party, processData }, { rejectWithValue }) => {
    try {
      const response = await litigationService.addProcessFiled(matterId, {
        party,
        processData,
      });
      message.success("Process added successfully");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add process");
      return rejectWithValue(error.response?.data || "Failed to add process");
    }
  },
);

export const updateProcessFiled = createAsyncThunk(
  "litigation/updateProcessFiled",
  async (
    { matterId, party, processIndex, processData },
    { rejectWithValue },
  ) => {
    try {
      const response = await litigationService.updateProcessFiled(
        matterId,
        party,
        processIndex,
        processData,
      );
      message.success("Process updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update process",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update process",
      );
    }
  },
);

// ============================================
// CASE OUTCOMES
// ============================================

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

// ============================================
// STATISTICS & DASHBOARD
// ============================================

export const fetchLitigationStats = createAsyncThunk(
  "litigation/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await litigationService.getLitigationStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch statistics",
      );
    }
  },
);

export const fetchLitigationDashboard = createAsyncThunk(
  "litigation/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await litigationService.getLitigationDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch dashboard",
      );
    }
  },
);

export const fetchUpcomingHearings = createAsyncThunk(
  "litigation/fetchUpcomingHearings",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await litigationService.getUpcomingHearings(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch upcoming hearings",
      );
    }
  },
);

export const fetchMatterHearings = createAsyncThunk(
  "litigation/fetchMatterHearings",
  async (matterId, { rejectWithValue }) => {
    try {
      return await litigationService.getMatterHearings(matterId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch matter hearings",
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
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setCurrentPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    setSelectedMatter: (state, action) => {
      state.selectedMatter = action.payload;
    },
    clearSelectedMatter: (state) => {
      state.selectedMatter = null;
      state.selectedDetails = null;
    },
    setSearchMode: (state, action) => {
      state.searchMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateMatterInList: (state, action) => {
      const idx = state.matters.findIndex((m) => m._id === action.payload._id);
      if (idx !== -1)
        state.matters[idx] = { ...state.matters[idx], ...action.payload };
    },
    updateHearingInList: (state, action) => {
      const idx = state.upcomingHearings.findIndex(
        (h) => h._id === action.payload._id,
      );
      if (idx !== -1)
        state.upcomingHearings[idx] = {
          ...state.upcomingHearings[idx],
          ...action.payload,
        };
    },
    removeHearingFromList: (state, action) => {
      state.upcomingHearings = state.upcomingHearings.filter(
        (h) => h._id !== action.payload,
      );
    },
    clearMatterHearings: (state) => {
      state.matterHearings = [];
      state.matterHearingsStats = initialState.matterHearingsStats;
    },
  },

  extraReducers: (builder) => {
    // ── Fetch matters ──────────────────────────────────────────────────────
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

    // ── Search matters ─────────────────────────────────────────────────────
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

    // ── Litigation details ─────────────────────────────────────────────────
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
      })
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
      })
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
      })
      .addCase(deleteLitigationDetails.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteLitigationDetails.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.matters = state.matters.filter((m) => m._id !== action.payload);
        state.selectedDetails = null;
        state.selectedMatter = null;
      })
      .addCase(deleteLitigationDetails.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── ADD HEARING — optimistic ───────────────────────────────────────────
    //
    // pending:   Prepend a temporary hearing immediately so the UI shows it
    //            without waiting for the network. Save the pre-insert snapshot
    //            into a dedicated state field so rejected can restore it.
    //
    // fulfilled: Replace the entire list with authoritative server data.
    //            If the server doesn't return a list, remove the temp item.
    //
    // rejected:  Restore from snapshot so the UI reverts cleanly.
    builder
      .addCase(addHearing.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;

        // Snapshot current list for rollback.
        state._hearingsSnapshot = [...state.matterHearings];

        // Build optimistic item from submitted form values.
        const { hearingData } = action.meta.arg;
        const optimisticHearing = {
          ...hearingData,
          _id: makeOptimisticId(),
          _optimistic: true,
        };

        state.matterHearings = [optimisticHearing, ...state.matterHearings];
        state.matterHearingsStats = computeHearingsStats(state.matterHearings);
      })
      .addCase(addHearing.fulfilled, (state, action) => {
        state.actionLoading = false;
        state._hearingsSnapshot = null;

        const serverHearings = action.payload.data?.hearings;
        if (serverHearings) {
          // Use authoritative server list — removes the optimistic item.
          state.matterHearings = serverHearings;
        } else {
          // Server didn't return a list — just strip the optimistic flag.
          state.matterHearings = state.matterHearings.filter(
            (h) => !h._optimistic,
          );
        }
        state.matterHearingsStats = computeHearingsStats(state.matterHearings);

        if (action.payload.data?.litigationDetail) {
          state.selectedDetails = action.payload.data.litigationDetail;
        }
      })
      .addCase(addHearing.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;

        // Roll back to pre-insert state.
        if (state._hearingsSnapshot) {
          state.matterHearings = state._hearingsSnapshot;
          state.matterHearingsStats = computeHearingsStats(
            state._hearingsSnapshot,
          );
          state._hearingsSnapshot = null;
        }
      });

    // ── UPDATE HEARING — optimistic ────────────────────────────────────────
    //
    // pending:   Patch the matching hearing in place immediately.
    //            Save the original hearing object for rollback.
    //
    // fulfilled: Swap in the authoritative server record (or strip the flag).
    //
    // rejected:  Restore the original hearing object.
    builder
      .addCase(updateHearing.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;

        const { hearingId, hearingData } = action.meta.arg;
        const index = state.matterHearings.findIndex(
          (h) => h._id === hearingId,
        );

        if (index !== -1) {
          // Save original for rollback.
          state._hearingSnapshot = { ...state.matterHearings[index] };

          // Apply patch optimistically.
          state.matterHearings[index] = {
            ...state.matterHearings[index],
            ...hearingData,
            _optimistic: true,
          };
          state.matterHearingsStats = computeHearingsStats(
            state.matterHearings,
          );
        }
      })
      .addCase(updateHearing.fulfilled, (state, action) => {
        state.actionLoading = false;
        state._hearingSnapshot = null;

        const serverHearings = action.payload.data?.hearings;
        if (serverHearings) {
          state.matterHearings = serverHearings;
        } else {
          // Strip optimistic flag from the updated item.
          const { hearingId } = action.meta.arg;
          const index = state.matterHearings.findIndex(
            (h) => h._id === hearingId,
          );
          if (index !== -1) {
            const { _optimistic, ...clean } = state.matterHearings[index];
            state.matterHearings[index] = clean;
          }
        }
        state.matterHearingsStats = computeHearingsStats(state.matterHearings);

        if (action.payload.data?.litigationDetail) {
          state.selectedDetails = action.payload.data.litigationDetail;
        }
      })
      .addCase(updateHearing.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;

        // Restore original hearing.
        const { hearingId } = action.meta.arg;
        if (state._hearingSnapshot) {
          const index = state.matterHearings.findIndex(
            (h) => h._id === hearingId,
          );
          if (index !== -1) {
            state.matterHearings[index] = state._hearingSnapshot;
            state.matterHearingsStats = computeHearingsStats(
              state.matterHearings,
            );
          }
          state._hearingSnapshot = null;
        }
      });

    // ── DELETE HEARING — optimistic ────────────────────────────────────────
    //
    // pending:   Remove the hearing immediately.
    //            Save the full list snapshot for rollback.
    //
    // fulfilled: If server returns an updated list, use it. Otherwise the
    //            optimistic removal already applied — nothing more to do.
    //
    // rejected:  Restore the full list.
    builder
      .addCase(deleteHearing.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;

        const { hearingId } = action.meta.arg;

        // Snapshot full list before removal.
        state._hearingsSnapshot = [...state.matterHearings];

        state.matterHearings = state.matterHearings.filter(
          (h) => h._id !== hearingId,
        );
        state.matterHearingsStats = computeHearingsStats(state.matterHearings);
      })
      .addCase(deleteHearing.fulfilled, (state, action) => {
        state.actionLoading = false;
        state._hearingsSnapshot = null;

        // Prefer authoritative server list if returned.
        const serverHearings = action.payload.data?.hearings;
        if (serverHearings) {
          state.matterHearings = serverHearings;
          state.matterHearingsStats = computeHearingsStats(serverHearings);
        }

        if (action.payload.data?.litigationDetail) {
          state.selectedDetails = action.payload.data.litigationDetail;
        }
      })
      .addCase(deleteHearing.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;

        // Restore the full list.
        if (state._hearingsSnapshot) {
          state.matterHearings = state._hearingsSnapshot;
          state.matterHearingsStats = computeHearingsStats(
            state._hearingsSnapshot,
          );
          state._hearingsSnapshot = null;
        }
      });

    // ── Court orders ───────────────────────────────────────────────────────
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
      })
      .addCase(updateCourtOrder.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateCourtOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(updateCourtOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteCourtOrder.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteCourtOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(deleteCourtOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── Processes ──────────────────────────────────────────────────────────
    builder
      .addCase(addProcessFiled.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addProcessFiled.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(addProcessFiled.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateProcessFiled.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateProcessFiled.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(updateProcessFiled.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── Case outcomes ──────────────────────────────────────────────────────
    builder
      .addCase(recordJudgment.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(recordJudgment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(recordJudgment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(recordSettlement.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(recordSettlement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(recordSettlement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(fileAppeal.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(fileAppeal.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.litigationDetail;
      })
      .addCase(fileAppeal.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── Stats & dashboard ──────────────────────────────────────────────────
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
      })
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

    // ── Upcoming hearings ──────────────────────────────────────────────────
    builder
      .addCase(fetchUpcomingHearings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingHearings.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingHearings = action.payload.data || [];
        state.hearingsStats = action.payload.stats || {
          total: 0,
          today: 0,
          thisWeek: 0,
          pending: 0,
          completed: 0,
        };
      })
      .addCase(fetchUpcomingHearings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.upcomingHearings = [];
        state.hearingsStats = {
          total: 0,
          today: 0,
          thisWeek: 0,
          pending: 0,
          completed: 0,
        };
      });

    // ── Matter hearings ────────────────────────────────────────────────────
    builder
      .addCase(fetchMatterHearings.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchMatterHearings.fulfilled, (state, action) => {
        state.detailsLoading = false;
        const { hearings, stats } = action.payload.data || {};
        state.matterHearings = hearings || [];
        state.matterHearingsStats = stats || {
          total: 0,
          past: 0,
          today: 0,
          upcoming: 0,
          completed: 0,
          pending: 0,
        };
      })
      .addCase(fetchMatterHearings.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
        state.matterHearings = [];
        state.matterHearingsStats = {
          total: 0,
          past: 0,
          today: 0,
          upcoming: 0,
          completed: 0,
          pending: 0,
        };
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
  updateHearingInList,
  removeHearingFromList,
  clearMatterHearings,
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
  state.litigation.upcomingHearings || [];
export const selectHearingsStats = (state) => state.litigation.hearingsStats;
export const selectMatterHearings = (state) =>
  state.litigation.matterHearings || [];
export const selectMatterHearingsStats = (state) =>
  state.litigation.matterHearingsStats;
export const selectLitigationLoading = (state) => state.litigation.loading;
export const selectDetailsLoading = (state) => state.litigation.detailsLoading;
export const selectStatsLoading = (state) => state.litigation.statsLoading;
export const selectActionLoading = (state) => state.litigation.actionLoading;
export const selectLitigationError = (state) => state.litigation.error;
export const selectSearchMode = (state) => state.litigation.searchMode;

// ── Derived selectors ──────────────────────────────────────────────────────

export const selectHearingsByDate = (state) => {
  const hearings = selectUpcomingHearings(state);
  return hearings.reduce((grouped, hearing) => {
    const date = hearing.nextHearingDate || hearing.date;
    const key = new Date(date).toISOString().split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(hearing);
    return grouped;
  }, {});
};

export const selectTodayHearings = (state) => {
  const hearings = selectUpcomingHearings(state);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return hearings.filter((h) => {
    const d = new Date(h.nextHearingDate || h.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
};

export const selectUrgentHearings = (state) => {
  const hearings = selectUpcomingHearings(state);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 3);
  return hearings.filter((h) => {
    const d = new Date(h.nextHearingDate || h.date);
    return d > today && d <= limit;
  });
};

export const selectHearingsForMatter = (matterId) => (state) =>
  selectUpcomingHearings(state).filter((h) => h.matterId === matterId);

export default litigationSlice.reducer;
