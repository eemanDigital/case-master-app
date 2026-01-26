// matterSlice.js (updated to match routes)

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import matterService from "./matterService";

const initialState = {
  matters: [],
  matter: null,
  stats: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
};

// Create new matter
export const createMatter = createAsyncThunk(
  "matter/create",
  async (matterData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await matterService.createMatter(matterData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// Get all matters with pagination
export const getMatters = createAsyncThunk(
  "matter/getAll",
  async (filters, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await matterService.getAllMatters(filters, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// Get single matter
export const getMatter = createAsyncThunk(
  "matter/get",
  async (matterId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await matterService.getMatter(matterId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// Update matter
export const updateMatter = createAsyncThunk(
  "matter/update",
  async ({ matterId, matterData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await matterService.updateMatter(matterId, matterData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// Delete matter
export const deleteMatter = createAsyncThunk(
  "matter/delete",
  async (matterId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await matterService.deleteMatter(matterId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// Get stats
export const getMatterStats = createAsyncThunk(
  "matter/stats",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await matterService.getMatterStats(token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// Search matters
export const searchMatters = createAsyncThunk(
  "matter/search",
  async (searchCriteria, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await matterService.searchMatters(searchCriteria, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const matterSlice = createSlice({
  name: "matter",
  initialState,
  reducers: {
    resetMatterState: (state) => {
      state.matter = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    resetMattersState: (state) => {
      return initialState;
    },
    clearError: (state) => {
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Matter
      .addCase(createMatter.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
      })
      .addCase(createMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload.data?.matter) {
          state.matters.unshift(action.payload.data.matter); // Add to beginning
        }
        state.message = "Matter created successfully";
      })
      .addCase(createMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to create matter";
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
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.totalItems = action.payload.totalItems || 0;
      })
      .addCase(getMatters.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch matters";
      })
      // Get Single Matter
      .addCase(getMatter.pending, (state) => {
        state.isLoading = true;
        state.matter = null;
        state.isError = false;
      })
      .addCase(getMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.matter =
          action.payload.data?.matter || action.payload.data || null;
      })
      .addCase(getMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch matter";
      })
      // Update Matter
      .addCase(updateMatter.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(updateMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedMatter =
          action.payload.data?.matter || action.payload.data;
        if (updatedMatter) {
          // Update in matters array
          const index = state.matters.findIndex(
            (matter) => matter._id === updatedMatter._id,
          );
          if (index !== -1) {
            state.matters[index] = updatedMatter;
          }
          // Update current matter if it's the same
          if (state.matter?._id === updatedMatter._id) {
            state.matter = updatedMatter;
          }
        }
        state.message = "Matter updated successfully";
      })
      .addCase(updateMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to update matter";
      })
      // Delete Matter
      .addCase(deleteMatter.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMatter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const deletedMatterId = action.payload.data?._id || action.meta.arg;
        if (deletedMatterId) {
          state.matters = state.matters.filter(
            (matter) => matter._id !== deletedMatterId,
          );
          if (state.matter?._id === deletedMatterId) {
            state.matter = null;
          }
        }
        state.message = "Matter deleted successfully";
      })
      .addCase(deleteMatter.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to delete matter";
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
      });
  },
});

export const { resetMatterState, resetMattersState, clearError } =
  matterSlice.actions;
export default matterSlice.reducer;
