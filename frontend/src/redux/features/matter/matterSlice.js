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
  selectedMatters: [],
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

export const bulkUpdateMatters = createAsyncThunk(
  "matter/bulkUpdate",
  async ({ matterIds, updateData }, { rejectWithValue }) => {
    try {
      return await matterService.bulkUpdateMatters(matterIds, updateData);
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

export const bulkDeleteMatters = createAsyncThunk(
  "matter/bulkDelete",
  async (matterIds, { rejectWithValue }) => {
    try {
      return await matterService.bulkDeleteMatters(matterIds);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete matters",
      );
    }
  },
);

export const bulkAssignOfficer = createAsyncThunk(
  "matter/bulkAssignOfficer",
  async ({ matterIds, officerId }, { rejectWithValue }) => {
    try {
      return await matterService.bulkAssignOfficer(matterIds, officerId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign officer",
      );
    }
  },
);

export const bulkExportMatters = createAsyncThunk(
  "matter/bulkExport",
  async ({ matterIds, format = "csv" }, { rejectWithValue }) => {
    try {
      return await matterService.bulkExportMatters(matterIds, format);
    } catch (error) {
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
// CORE ASYNC THUNKS
// ============================================

export const createMatter = createAsyncThunk(
  "matter/create",
  async (matterData, { rejectWithValue }) => {
    try {
      return await matterService.createMatter(matterData);
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
      return await matterService.getAllMatters(params);
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
      return await matterService.getMatter(matterId);
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
      return await matterService.updateMatter({ matterId, matterData });
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
      return await matterService.deleteMatter(matterId);
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
      return await matterService.getMatterStats();
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
      return await matterService.searchMatters(searchCriteria);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search matters",
      );
    }
  },
);

// ============================================
// HELPERS
// ============================================

/** Safely coerce any value to a finite integer. Objects/null/undefined → 0 */
const safeInt = (val) => {
  if (val == null || typeof val === "object") return 0;
  const n = Number(val);
  return isFinite(n) ? Math.round(n) : 0;
};

// ============================================
// SLICE
// ============================================

const matterSlice = createSlice({
  name: "matter",
  initialState,
  reducers: {
    resetMatterState: () => initialState,

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
      const idx = state.matters.findIndex((m) => m._id === action.payload._id);
      if (idx !== -1) state.matters[idx] = action.payload;
    },

    removeMatterFromList: (state, action) => {
      state.matters = state.matters.filter((m) => m._id !== action.payload);
      if (state.currentMatter?._id === action.payload) {
        state.currentMatter = null;
      }
    },

    addMatterToList: (state, action) => {
      state.matters.unshift(action.payload);
    },

    // ── Bulk selection ──────────────────────────────
    selectMatter: (state, action) => {
      if (!state.selectedMatters.includes(action.payload)) {
        state.selectedMatters.push(action.payload);
      }
    },

    deselectMatter: (state, action) => {
      state.selectedMatters = state.selectedMatters.filter(
        (id) => id !== action.payload,
      );
    },

    toggleSelectMatter: (state, action) => {
      const idx = state.selectedMatters.indexOf(action.payload);
      if (idx > -1) {
        state.selectedMatters.splice(idx, 1);
      } else {
        state.selectedMatters.push(action.payload);
      }
    },

    selectAllMatters: (state, action) => {
      const ids = action.payload || state.matters.map((m) => m._id);
      state.selectedMatters = [...new Set([...state.selectedMatters, ...ids])];
    },

    selectPageMatters: (state, action) => {
      state.selectedMatters = [
        ...new Set([...state.selectedMatters, ...action.payload]),
      ];
    },

    clearSelectedMatters: (state) => {
      state.selectedMatters = [];
    },

    setSelectedMatters: (state, action) => {
      state.selectedMatters = action.payload;
    },

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

      // ── Bulk Update ──────────────────────────────
      .addCase(bulkUpdateMatters.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(bulkUpdateMatters.fulfilled, (state, action) => {
        state.bulkLoading = false;
        state.isSuccess = true;
        const updated =
          action.payload.data?.matters || action.payload.data || [];
        updated.forEach((m) => {
          const idx = state.matters.findIndex((x) => x._id === m._id);
          if (idx !== -1) state.matters[idx] = m;
          if (state.currentMatter?._id === m._id) state.currentMatter = m;
        });
        if (action.payload.data?.clearSelection) state.selectedMatters = [];
        state.message = `Successfully updated ${updated.length} matters`;
        message.success(state.message);
      })
      .addCase(bulkUpdateMatters.rejected, (state, action) => {
        state.bulkLoading = false;
        state.isError = true;
        state.bulkError = action.payload?.message || "Failed to update matters";
        if (action.payload?.errors)
          state.validationErrors = action.payload.errors;
        message.error(state.bulkError);
      })

      // ── Bulk Delete ──────────────────────────────
      .addCase(bulkDeleteMatters.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(bulkDeleteMatters.fulfilled, (state, action) => {
        state.bulkLoading = false;
        state.isSuccess = true;
        const deletedIds =
          action.payload.data?.deletedMatterIds || action.meta.arg || [];
        state.matters = state.matters.filter(
          (m) => !deletedIds.includes(m._id),
        );
        state.selectedMatters = state.selectedMatters.filter(
          (id) => !deletedIds.includes(id),
        );
        if (deletedIds.includes(state.currentMatter?._id))
          state.currentMatter = null;
        state.message = `Successfully deleted ${deletedIds.length} matters`;
        message.success(state.message);
      })
      .addCase(bulkDeleteMatters.rejected, (state, action) => {
        state.bulkLoading = false;
        state.isError = true;
        state.bulkError = action.payload || "Failed to delete matters";
        message.error(state.bulkError);
      })

      // ── Bulk Assign Officer ──────────────────────
      .addCase(bulkAssignOfficer.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(bulkAssignOfficer.fulfilled, (state, action) => {
        state.bulkLoading = false;
        state.isSuccess = true;
        const updated =
          action.payload.data?.matters || action.payload.data || [];
        updated.forEach((m) => {
          const idx = state.matters.findIndex((x) => x._id === m._id);
          if (idx !== -1) state.matters[idx] = m;
        });
        state.message = `Successfully assigned officer to ${updated.length} matters`;
        message.success(state.message);
      })
      .addCase(bulkAssignOfficer.rejected, (state, action) => {
        state.bulkLoading = false;
        state.isError = true;
        state.bulkError = action.payload || "Failed to assign officer";
        message.error(state.bulkError);
      })

      // ── Bulk Export ──────────────────────────────
      .addCase(bulkExportMatters.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(bulkExportMatters.fulfilled, (state, action) => {
        state.bulkLoading = false;
        state.isSuccess = true;
        state.message = `Successfully exported ${action.meta.arg?.matterIds?.length || 0} matters`;
      })
      .addCase(bulkExportMatters.rejected, (state, action) => {
        state.bulkLoading = false;
        state.isError = true;
        state.bulkError = action.payload || "Failed to export matters";
        message.error(state.bulkError);
      })

      // ── Create Matter ────────────────────────────
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

      // ── Get All Matters ──────────────────────────
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

      // ── Get Single Matter ────────────────────────
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

      // ── Update Matter ────────────────────────────
      .addCase(updateMatter.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.validationErrors = {};
      })
      .addCase(updateMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updated = action.payload.data?.matter || action.payload.data;
        if (updated) {
          const idx = state.matters.findIndex((m) => m._id === updated._id);
          if (idx !== -1) state.matters[idx] = updated;
          if (state.currentMatter?._id === updated._id)
            state.currentMatter = updated;
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

      // ── Delete Matter ────────────────────────────
      .addCase(deleteMatter.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const id = action.meta.arg;
        state.matters = state.matters.filter((m) => m._id !== id);
        if (state.currentMatter?._id === id) state.currentMatter = null;
        state.message = "Matter deleted successfully";
        message.success("Matter deleted successfully");
      })
      .addCase(deleteMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to delete matter";
        message.error(state.message);
      })

      // ── Get Stats ────────────────────────────────
      // KEY FIX: normalize API response into flat primitives only.
      // Raw API: { status, data: { overview:{_id:null,...}, byType:[...], ... } }
      // matterService returns response.data → action.payload = { status, data:{...} }
      // We store ONLY extracted numbers + arrays (for charts) — no nested objects.
      .addCase(getMatterStats.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(getMatterStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const raw = action.payload?.data || {};
        // overview comes from MongoDB $group aggregate → array[0], includes _id:null
        const ov =
          raw.overview && typeof raw.overview === "object" ? raw.overview : {};

        // Store ONLY flat primitives — never store nested objects where
        // a component might accidentally render them as React children
        state.stats = {
          // ── Numbers (safe to pass as `value` props) ──
          totalMatters: safeInt(ov.totalMatters),
          activeMatters: safeInt(ov.activeMatters),
          pendingMatters: safeInt(ov.pendingMatters),
          completedMatters: safeInt(ov.completedMatters),
          closedMatters: safeInt(ov.closedMatters),
          highPriorityMatters: safeInt(ov.highPriorityMatters),
          urgentPriorityMatters: safeInt(ov.urgentPriorityMatters),
          averageAgeDays: ov.averageAgeDays
            ? Math.round(Number(ov.averageAgeDays))
            : 0,
          myMatters: safeInt(raw.myMatters),
          // ── Arrays (for charts — kept separate, never used as React children) ──
          byType: Array.isArray(raw.byType) ? raw.byType : [],
          byStatus: Array.isArray(raw.byStatus) ? raw.byStatus : [],
          byPriority: Array.isArray(raw.byPriority) ? raw.byPriority : [],
          recentActivity: Array.isArray(raw.recentActivity)
            ? raw.recentActivity
            : [],
        };
      })
      .addCase(getMatterStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch stats";
        message.error(state.message);
      })

      // ── Search Matters ───────────────────────────
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
  selectPageMatters,
  clearSelectedMatters,
  setSelectedMatters,
  setBulkLoading,
  setBulkError,
  clearBulkError,
} = matterSlice.actions;

export default matterSlice.reducer;
