import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import * as automationApi from "./automationService";

const automationAdapter = createEntityAdapter({
  selectId: (automation) => automation._id,
  sortComparer: (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated),
});

const initialState = automationAdapter.getInitialState({
  recipes: [],
  logs: [],
  stats: null,
  selectedAutomation: null,
  executing: false,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  loading: false,
  actionLoading: false,
  error: null,
});

const unwrap = (res) => res?.data ?? res;

export const fetchAutomations = createAsyncThunk(
  "automation/fetchAutomations",
  async (params, { rejectWithValue }) => {
    try {
      return await automationApi.getAutomations(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch automations");
    }
  }
);

export const fetchRecipes = createAsyncThunk(
  "automation/fetchRecipes",
  async (_, { rejectWithValue }) => {
    try {
      return await automationApi.getRecipes();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch recipes");
    }
  }
);

export const fetchAutomation = createAsyncThunk(
  "automation/fetchAutomation",
  async (id, { rejectWithValue }) => {
    try {
      return await automationApi.getAutomation(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch automation");
    }
  }
);

export const createAutomation = createAsyncThunk(
  "automation/create",
  async (data, { rejectWithValue }) => {
    try {
      return await automationApi.createAutomation(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to create automation");
    }
  }
);

export const updateAutomation = createAsyncThunk(
  "automation/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await automationApi.updateAutomation(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update automation");
    }
  }
);

export const deleteAutomation = createAsyncThunk(
  "automation/delete",
  async (id, { rejectWithValue }) => {
    try {
      return await automationApi.deleteAutomation(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to delete automation");
    }
  }
);

export const toggleAutomation = createAsyncThunk(
  "automation/toggle",
  async (id, { rejectWithValue }) => {
    try {
      return await automationApi.toggleAutomation(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to toggle automation");
    }
  }
);

export const executeAutomation = createAsyncThunk(
  "automation/execute",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await automationApi.executeAutomation(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to execute automation");
    }
  }
);

export const fetchLogs = createAsyncThunk(
  "automation/fetchLogs",
  async ({ id, params }, { rejectWithValue }) => {
    try {
      return await automationApi.getAutomationLogs(id, params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch logs");
    }
  }
);

export const fetchStats = createAsyncThunk(
  "automation/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await automationApi.getAutomationStats();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch stats");
    }
  }
);

export const applyRecipe = createAsyncThunk(
  "automation/applyRecipe",
  async ({ recipeId, data }, { rejectWithValue }) => {
    try {
      return await automationApi.applyRecipe(recipeId, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to apply recipe");
    }
  }
);

const automationSlice = createSlice({
  name: "automation",
  initialState,
  reducers: {
    setSelectedAutomation: (state, action) => {
      state.selectedAutomation = action.payload;
    },
    clearSelectedAutomation: (state) => {
      state.selectedAutomation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearLogs: (state) => {
      state.logs = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAutomations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAutomations.fulfilled, (state, action) => {
        state.loading = false;
        const payload = unwrap(action.payload);
        automationAdapter.setAll(state, payload || []);
        state.pagination = payload.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      })
      .addCase(fetchAutomations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = unwrap(action.payload)?.data || unwrap(action.payload) || [];
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAutomation.fulfilled, (state, action) => {
        const data = unwrap(action.payload);
        state.selectedAutomation = data;
        automationAdapter.upsertOne(state, data);
      })
      .addCase(createAutomation.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createAutomation.fulfilled, (state, action) => {
        state.actionLoading = false;
        automationAdapter.addOne(state, unwrap(action.payload));
      })
      .addCase(createAutomation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateAutomation.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateAutomation.fulfilled, (state, action) => {
        state.actionLoading = false;
        const data = unwrap(action.payload);
        automationAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(updateAutomation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteAutomation.fulfilled, (state, action) => {
        automationAdapter.removeOne(state, action.meta.arg);
      })
      .addCase(toggleAutomation.fulfilled, (state, action) => {
        const data = unwrap(action.payload);
        automationAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(executeAutomation.pending, (state) => {
        state.executing = true;
      })
      .addCase(executeAutomation.fulfilled, (state, action) => {
        state.executing = false;
        const data = unwrap(action.payload);
        if (data?.logs) {
          state.logs = [...data.logs, ...state.logs].slice(0, 100);
        }
      })
      .addCase(executeAutomation.rejected, (state, action) => {
        state.executing = false;
        state.error = action.payload;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.logs = unwrap(action.payload)?.data || [];
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = unwrap(action.payload);
      })
      .addCase(applyRecipe.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(applyRecipe.fulfilled, (state, action) => {
        state.actionLoading = false;
        automationAdapter.addOne(state, unwrap(action.payload));
      })
      .addCase(applyRecipe.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedAutomation,
  clearSelectedAutomation,
  clearError,
  clearLogs,
} = automationSlice.actions;

export const {
  selectAll: selectAllAutomations,
  selectById: selectAutomationById,
  selectIds: selectAutomationIds,
  selectEntities: selectAutomationEntities,
  selectTotal: selectTotalAutomations,
} = automationAdapter.getSelectors((state) => state.automation);

export const selectAutomations = (state) => selectAllAutomations(state);
export const selectRecipes = (state) => state.automation.recipes;
export const selectAutomationLogs = (state) => state.automation.logs;
export const selectAutomationStats = (state) => state.automation.stats;
export const selectSelectedAutomation = (state) => state.automation.selectedAutomation;
export const selectAutomationPagination = (state) => state.automation.pagination;
export const selectAutomationLoading = (state) => state.automation.loading;
export const selectAutomationActionLoading = (state) => state.automation.actionLoading;
export const selectAutomationExecuting = (state) => state.automation.executing;
export const selectAutomationError = (state) => state.automation.error;

export default automationSlice.reducer;
