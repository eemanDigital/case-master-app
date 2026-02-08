import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import generalService from "./generalService";

// ============================================
// ASYNC THUNKS
// ============================================

// Fetch all general matters with pagination
export const fetchGeneralMatters = createAsyncThunk(
  "general/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await generalService.getAllGeneralMatters(params);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch general matters",
      );
    }
  },
);

// Search general matters
export const searchGeneralMatters = createAsyncThunk(
  "general/search",
  async ({ criteria, params }, { rejectWithValue }) => {
    try {
      const response = await generalService.searchGeneralMatters(
        criteria,
        params,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Search failed");
    }
  },
);

// Fetch statistics
export const fetchGeneralStats = createAsyncThunk(
  "general/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await generalService.getGeneralStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats",
      );
    }
  },
);

// Fetch general details
export const fetchGeneralDetails = createAsyncThunk(
  "general/fetchDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await generalService.getGeneralDetails(matterId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch details",
      );
    }
  },
);

// Create general details
export const createGeneralDetails = createAsyncThunk(
  "general/create",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.createGeneralDetails(
        matterId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create general details",
      );
    }
  },
);

// Update general details
export const updateGeneralDetails = createAsyncThunk(
  "general/update",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.updateGeneralDetails(
        matterId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update general details",
      );
    }
  },
);

// Delete general details
export const deleteGeneralDetails = createAsyncThunk(
  "general/delete",
  async (matterId, { rejectWithValue }) => {
    try {
      await generalService.deleteGeneralDetails(matterId);
      return matterId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete",
      );
    }
  },
);

// Restore general details
export const restoreGeneralDetails = createAsyncThunk(
  "general/restore",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await generalService.restoreGeneralDetails(matterId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restore",
      );
    }
  },
);

// ============================================
// REQUIREMENTS
// ============================================
export const addRequirement = createAsyncThunk(
  "general/addRequirement",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.addRequirement(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add requirement",
      );
    }
  },
);

export const updateRequirement = createAsyncThunk(
  "general/updateRequirement",
  async ({ matterId, requirementId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.updateRequirement(
        matterId,
        requirementId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update requirement",
      );
    }
  },
);

export const deleteRequirement = createAsyncThunk(
  "general/deleteRequirement",
  async ({ matterId, requirementId }, { rejectWithValue }) => {
    try {
      const response = await generalService.deleteRequirement(
        matterId,
        requirementId,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete requirement",
      );
    }
  },
);

// ============================================
// PARTIES
// ============================================
export const addParty = createAsyncThunk(
  "general/addParty",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.addParty(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add party",
      );
    }
  },
);

export const updateParty = createAsyncThunk(
  "general/updateParty",
  async ({ matterId, partyId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.updateParty(
        matterId,
        partyId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update party",
      );
    }
  },
);

export const deleteParty = createAsyncThunk(
  "general/deleteParty",
  async ({ matterId, partyId }, { rejectWithValue }) => {
    try {
      const response = await generalService.deleteParty(matterId, partyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete party",
      );
    }
  },
);

// ============================================
// DELIVERABLES
// ============================================
export const addDeliverable = createAsyncThunk(
  "general/addDeliverable",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.addDeliverable(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add deliverable",
      );
    }
  },
);

export const updateDeliverable = createAsyncThunk(
  "general/updateDeliverable",
  async ({ matterId, deliverableId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.updateDeliverable(
        matterId,
        deliverableId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update deliverable",
      );
    }
  },
);

export const deleteDeliverable = createAsyncThunk(
  "general/deleteDeliverable",
  async ({ matterId, deliverableId }, { rejectWithValue }) => {
    try {
      const response = await generalService.deleteDeliverable(
        matterId,
        deliverableId,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete deliverable",
      );
    }
  },
);

// ============================================
// DOCUMENTS
// ============================================
export const addDocument = createAsyncThunk(
  "general/addDocument",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.addDocument(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add document",
      );
    }
  },
);

export const updateDocumentStatus = createAsyncThunk(
  "general/updateDocumentStatus",
  async ({ matterId, documentId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.updateDocumentStatus(
        matterId,
        documentId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update document",
      );
    }
  },
);

export const deleteDocument = createAsyncThunk(
  "general/deleteDocument",
  async ({ matterId, documentId }, { rejectWithValue }) => {
    try {
      const response = await generalService.deleteDocument(
        matterId,
        documentId,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete document",
      );
    }
  },
);

// ============================================
// PROJECT STAGES (Nigerian Billing)
// ============================================
export const addProjectStage = createAsyncThunk(
  "general/addProjectStage",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.addProjectStage(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add stage",
      );
    }
  },
);

export const updateProjectStage = createAsyncThunk(
  "general/updateProjectStage",
  async ({ matterId, stageId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.updateProjectStage(
        matterId,
        stageId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update stage",
      );
    }
  },
);

export const completeProjectStage = createAsyncThunk(
  "general/completeProjectStage",
  async ({ matterId, stageId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.completeProjectStage(
        matterId,
        stageId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete stage",
      );
    }
  },
);

// ============================================
// DISBURSEMENTS
// ============================================
export const addDisbursement = createAsyncThunk(
  "general/addDisbursement",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.addDisbursement(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add disbursement",
      );
    }
  },
);

export const updateDisbursement = createAsyncThunk(
  "general/updateDisbursement",
  async ({ matterId, disbursementId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.updateDisbursement(
        matterId,
        disbursementId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update disbursement",
      );
    }
  },
);

export const deleteDisbursement = createAsyncThunk(
  "general/deleteDisbursement",
  async ({ matterId, disbursementId }, { rejectWithValue }) => {
    try {
      const response = await generalService.deleteDisbursement(
        matterId,
        disbursementId,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete disbursement",
      );
    }
  },
);

// ============================================
// COMPLETION & BULK OPERATIONS
// ============================================
export const completeGeneralService = createAsyncThunk(
  "general/complete",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.completeGeneralService(
        matterId,
        data,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete service",
      );
    }
  },
);

export const updateNBAStamp = createAsyncThunk(
  "general/updateNBAStamp",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await generalService.updateNBAStamp(matterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update NBA stamp",
      );
    }
  },
);

export const bulkUpdateGeneralMatters = createAsyncThunk(
  "general/bulkUpdate",
  async (data, { rejectWithValue }) => {
    try {
      const response = await generalService.bulkUpdateGeneralMatters(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Bulk update failed",
      );
    }
  },
);

// ============================================
// INITIAL STATE
// ============================================
const initialState = {
  // Data
  matters: [],
  selectedDetails: null,
  stats: null,

  // Pagination
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },

  // Filters
  filters: {
    search: "",
    serviceType: "",
    status: "",
    jurisdictionState: "",
  },

  // Loading states
  loading: false,
  detailsLoading: false,
  statsLoading: false,
  actionLoading: false,

  // Error
  error: null,
};

// ============================================
// SLICE
// ============================================
const generalSlice = createSlice({
  name: "general",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearSelectedDetails: (state) => {
      state.selectedDetails = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchGeneralMatters.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchGeneralMatters.fulfilled, (state, action) => {
      state.loading = false;
      state.matters = action.payload;
      state.pagination = {
        page: action.payload.page,
        limit: action.payload.limit,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
      };
    });
    builder.addCase(fetchGeneralMatters.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Search
    builder.addCase(searchGeneralMatters.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(searchGeneralMatters.fulfilled, (state, action) => {
      state.loading = false;
      state.matters = action.payload.data;
      state.pagination = {
        page: action.payload.page,
        limit: action.payload.limit,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
      };
    });
    builder.addCase(searchGeneralMatters.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Stats
    builder.addCase(fetchGeneralStats.pending, (state) => {
      state.statsLoading = true;
    });
    builder.addCase(fetchGeneralStats.fulfilled, (state, action) => {
      state.statsLoading = false;
      state.stats = action.payload.data;
    });
    builder.addCase(fetchGeneralStats.rejected, (state, action) => {
      state.statsLoading = false;
      state.error = action.payload;
    });

    // Fetch details
    builder.addCase(fetchGeneralDetails.pending, (state) => {
      state.detailsLoading = true;
    });
    builder.addCase(fetchGeneralDetails.fulfilled, (state, action) => {
      state.detailsLoading = false;
      state.selectedDetails = action.payload.data?.generalDetail;
    });
    builder.addCase(fetchGeneralDetails.rejected, (state, action) => {
      state.detailsLoading = false;
      state.error = action.payload;
    });

    // Create
    builder.addCase(createGeneralDetails.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(createGeneralDetails.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.selectedDetails = action.payload.data?.generalDetail;
    });
    builder.addCase(createGeneralDetails.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload;
    });

    // Update
    builder.addCase(updateGeneralDetails.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(updateGeneralDetails.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.selectedDetails = action.payload.data?.generalDetail;
    });
    builder.addCase(updateGeneralDetails.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload;
    });

    // Delete
    builder.addCase(deleteGeneralDetails.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(deleteGeneralDetails.fulfilled, (state) => {
      state.actionLoading = false;
      state.selectedDetails = null;
    });
    builder.addCase(deleteGeneralDetails.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload;
    });

    // All sub-entity operations (requirements, parties, deliverables, etc.)
    const subEntityActions = [
      addRequirement,
      updateRequirement,
      deleteRequirement,
      addParty,
      updateParty,
      deleteParty,
      addDeliverable,
      updateDeliverable,
      deleteDeliverable,
      addDocument,
      updateDocumentStatus,
      deleteDocument,
      addProjectStage,
      updateProjectStage,
      completeProjectStage,
      addDisbursement,
      updateDisbursement,
      deleteDisbursement,
      updateNBAStamp,
      completeGeneralService,
    ];

    subEntityActions.forEach((action) => {
      builder.addCase(action.pending, (state) => {
        state.actionLoading = true;
      });
      builder.addCase(action.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.data?.generalDetail) {
          state.selectedDetails = action.payload.data.generalDetail;
        }
      });
      builder.addCase(action.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
    });

    // Bulk update
    builder.addCase(bulkUpdateGeneralMatters.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(bulkUpdateGeneralMatters.fulfilled, (state) => {
      state.actionLoading = false;
    });
    builder.addCase(bulkUpdateGeneralMatters.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload;
    });
  },
});

export const {
  setFilters,
  clearFilters,
  setPagination,
  clearSelectedDetails,
  clearError,
} = generalSlice.actions;
export default generalSlice.reducer;
