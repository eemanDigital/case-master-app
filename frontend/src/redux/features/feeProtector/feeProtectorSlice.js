import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import * as feeProtectorApi from "./feeProtectorService";

const feeProtectorAdapter = createEntityAdapter({
  selectId: (doc) => doc._id,
  sortComparer: (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated),
});

const initialState = feeProtectorAdapter.getInitialState({
  stats: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  filters: {
    status: "",
    clientId: "",
    matterId: "",
    search: "",
  },
  loading: false,
  actionLoading: false,
  downloading: false,
  error: null,
});

const unwrap = (res) => res?.data ?? res;

export const fetchProtectedDocuments = createAsyncThunk(
  "feeProtector/fetchDocuments",
  async (params, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.getProtectedDocuments(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch documents");
    }
  }
);

export const fetchProtectedDocument = createAsyncThunk(
  "feeProtector/fetchDocument",
  async (id, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.getProtectedDocument(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch document");
    }
  }
);

export const uploadProtectedDocument = createAsyncThunk(
  "feeProtector/upload",
  async (data, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.uploadProtectedDocument(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to upload document");
    }
  }
);

export const updateProtectedDocument = createAsyncThunk(
  "feeProtector/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.updateProtectedDocument(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update document");
    }
  }
);

export const deleteProtectedDocument = createAsyncThunk(
  "feeProtector/delete",
  async (id, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.deleteProtectedDocument(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to delete document");
    }
  }
);

export const confirmPayment = createAsyncThunk(
  "feeProtector/confirmPayment",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.confirmPayment(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to confirm payment");
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "feeProtector/verifyPayment",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.verifyPayment(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to verify payment");
    }
  }
);

export const downloadWatermarked = createAsyncThunk(
  "feeProtector/download",
  async (id, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.downloadWatermarkedDocument(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to download document");
    }
  }
);

export const fetchStats = createAsyncThunk(
  "feeProtector/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.getFeeProtectorStats();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch stats");
    }
  }
);

const feeProtectorSlice = createSlice({
  name: "feeProtector",
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProtectedDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProtectedDocuments.fulfilled, (state, action) => {
        state.loading = false;
        const payload = unwrap(action.payload);
        feeProtectorAdapter.setAll(state, payload.data || []);
        state.pagination = payload.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      })
      .addCase(fetchProtectedDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProtectedDocument.fulfilled, (state, action) => {
        feeProtectorAdapter.upsertOne(state, unwrap(action.payload));
      })
      .addCase(uploadProtectedDocument.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(uploadProtectedDocument.fulfilled, (state, action) => {
        state.actionLoading = false;
        feeProtectorAdapter.addOne(state, unwrap(action.payload));
      })
      .addCase(uploadProtectedDocument.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateProtectedDocument.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateProtectedDocument.fulfilled, (state, action) => {
        state.actionLoading = false;
        const data = unwrap(action.payload);
        feeProtectorAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(updateProtectedDocument.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteProtectedDocument.fulfilled, (state, action) => {
        feeProtectorAdapter.removeOne(state, action.meta.arg);
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        const data = unwrap(action.payload);
        feeProtectorAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        const data = unwrap(action.payload);
        feeProtectorAdapter.updateOne(state, { id: data._id, changes: data });
      })
      .addCase(downloadWatermarked.pending, (state) => {
        state.downloading = true;
      })
      .addCase(downloadWatermarked.fulfilled, (state) => {
        state.downloading = false;
      })
      .addCase(downloadWatermarked.rejected, (state, action) => {
        state.downloading = false;
        state.error = action.payload;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = unwrap(action.payload);
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearError,
} = feeProtectorSlice.actions;

export const {
  selectAll: selectAllProtectedDocs,
  selectById: selectProtectedDocById,
  selectIds: selectProtectedDocIds,
  selectEntities: selectProtectedDocEntities,
  selectTotal: selectTotalProtectedDocs,
} = feeProtectorAdapter.getSelectors((state) => state.feeProtector);

export const selectProtectedDocuments = (state) => selectAllProtectedDocs(state);
export const selectFeeProtectorStats = (state) => state.feeProtector.stats;
export const selectFeeProtectorPagination = (state) => state.feeProtector.pagination;
export const selectFeeProtectorFilters = (state) => state.feeProtector.filters;
export const selectFeeProtectorLoading = (state) => state.feeProtector.loading;
export const selectFeeProtectorActionLoading = (state) => state.feeProtector.actionLoading;
export const selectFeeProtectorDownloading = (state) => state.feeProtector.downloading;
export const selectFeeProtectorError = (state) => state.feeProtector.error;

export default feeProtectorSlice.reducer;
