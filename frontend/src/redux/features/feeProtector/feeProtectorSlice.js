import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import * as feeProtectorApi from "./feeProtectorService";

const feeProtectorAdapter = createEntityAdapter({
  selectId: (doc) => doc._id,
  sortComparer: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
});

const initialState = feeProtectorAdapter.getInitialState({
  stats: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  filters: {
    status: "",
    clientId: "",
    search: "",
  },
  loading: false,
  actionLoading: false,
  downloading: false,
  error: null,
});

// Unwrap single entity: handles { data: {...} } or raw object
const unwrapOne = (res) => res?.data ?? res;

// Unwrap list: handles { data: [...], pagination } or { data: { data: [...], pagination } }
const unwrapList = (res) => {
  const outer = res?.data ?? res;
  if (Array.isArray(outer)) return { docs: outer, pagination: null };
  if (Array.isArray(outer?.data))
    return { docs: outer.data, pagination: outer.pagination ?? null };
  // backend returns combined array at top level
  return { docs: Array.isArray(outer) ? outer : [], pagination: null };
};

// ─── Thunks ────────────────────────────────────────────────────────────────

export const fetchProtectedDocuments = createAsyncThunk(
  "feeProtector/fetchDocuments",
  async (params, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.getProtectedDocuments(params);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch documents",
      );
    }
  },
);

export const fetchProtectedDocument = createAsyncThunk(
  "feeProtector/fetchDocument",
  async (id, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.getProtectedDocument(id);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch document",
      );
    }
  },
);

export const uploadProtectedDocument = createAsyncThunk(
  "feeProtector/upload",
  async (data, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.uploadProtectedDocument(data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload document",
      );
    }
  },
);

export const updateProtectedDocument = createAsyncThunk(
  "feeProtector/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.updateProtectedDocument(id, data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to update document",
      );
    }
  },
);

export const deleteProtectedDocument = createAsyncThunk(
  "feeProtector/delete",
  async (id, { rejectWithValue }) => {
    try {
      await feeProtectorApi.deleteProtectedDocument(id);
      return id; // return id directly so reducer can removeOne
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete document",
      );
    }
  },
);

// Manual confirmation: lawyer marks client as having paid (cash/bank transfer)
export const confirmPayment = createAsyncThunk(
  "feeProtector/confirmPayment",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.confirmPayment(id, data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to confirm payment",
      );
    }
  },
);

// Revoke a manual confirmation (e.g. bounced cheque)
export const revokePayment = createAsyncThunk(
  "feeProtector/revokePayment",
  async (id, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.revokePayment(id);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to revoke payment",
      );
    }
  },
);

export const fetchStats = createAsyncThunk(
  "feeProtector/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await feeProtectorApi.getFeeProtectorStats();
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch stats",
      );
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────

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
      // ── Fetch all ──────────────────────────────────────────
      .addCase(fetchProtectedDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProtectedDocuments.fulfilled, (state, action) => {
        state.loading = false;
        const { docs, pagination } = unwrapList(action.payload);
        feeProtectorAdapter.setAll(state, docs);
        if (pagination) state.pagination = pagination;
      })
      .addCase(fetchProtectedDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Fetch one ──────────────────────────────────────────
      .addCase(fetchProtectedDocument.fulfilled, (state, action) => {
        const doc = unwrapOne(action.payload);
        if (doc?._id) feeProtectorAdapter.upsertOne(state, doc);
      })

      // ── Upload ─────────────────────────────────────────────
      .addCase(uploadProtectedDocument.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(uploadProtectedDocument.fulfilled, (state, action) => {
        state.actionLoading = false;
        const doc = unwrapOne(action.payload);
        if (doc?._id) feeProtectorAdapter.addOne(state, doc);
      })
      .addCase(uploadProtectedDocument.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── Update ─────────────────────────────────────────────
      .addCase(updateProtectedDocument.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateProtectedDocument.fulfilled, (state, action) => {
        state.actionLoading = false;
        const doc = unwrapOne(action.payload);
        if (doc?._id) feeProtectorAdapter.upsertOne(state, doc);
      })
      .addCase(updateProtectedDocument.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── Delete ─────────────────────────────────────────────
      .addCase(deleteProtectedDocument.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteProtectedDocument.fulfilled, (state, action) => {
        state.actionLoading = false;
        feeProtectorAdapter.removeOne(state, action.payload); // payload = id string
      })
      .addCase(deleteProtectedDocument.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── Confirm payment (manual) ───────────────────────────
      // Backend must return the full updated document for upsert to work
      .addCase(confirmPayment.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.actionLoading = false;
        const doc = unwrapOne(action.payload);
        if (doc?._id) feeProtectorAdapter.upsertOne(state, doc);
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── Revoke payment ─────────────────────────────────────
      .addCase(revokePayment.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(revokePayment.fulfilled, (state, action) => {
        state.actionLoading = false;
        const doc = unwrapOne(action.payload);
        if (doc?._id) feeProtectorAdapter.upsertOne(state, doc);
      })
      .addCase(revokePayment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── Stats ──────────────────────────────────────────────
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = unwrapOne(action.payload);
      });
  },
});

export const { setFilters, clearFilters, clearError } =
  feeProtectorSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────

export const {
  selectAll: selectAllProtectedDocs,
  selectById: selectProtectedDocById,
  selectIds: selectProtectedDocIds,
  selectEntities: selectProtectedDocEntities,
  selectTotal: selectTotalProtectedDocs,
} = feeProtectorAdapter.getSelectors((state) => state.feeProtector);

export const selectProtectedDocuments = (state) =>
  selectAllProtectedDocs(state);
export const selectFeeProtectorStats = (state) => state.feeProtector.stats;
export const selectFeeProtectorPagination = (state) =>
  state.feeProtector.pagination;
export const selectFeeProtectorFilters = (state) => state.feeProtector.filters;
export const selectFeeProtectorLoading = (state) => state.feeProtector.loading;
export const selectFeeProtectorActionLoading = (state) =>
  state.feeProtector.actionLoading;
export const selectFeeProtectorDownloading = (state) =>
  state.feeProtector.downloading;
export const selectFeeProtectorError = (state) => state.feeProtector.error;

export const selectPendingDocs = (state) =>
  selectAllProtectedDocs(state).filter(
    (d) => !d.protectedDocument?.isBalancePaid,
  );

export const selectPaidDocs = (state) =>
  selectAllProtectedDocs(state).filter(
    (d) => d.protectedDocument?.isBalancePaid,
  );

export default feeProtectorSlice.reducer;
