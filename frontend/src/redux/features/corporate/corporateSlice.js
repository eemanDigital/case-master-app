import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import corporateService from "./corporateService";
import { message } from "antd";

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // List state
  matters: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  // Filters
  filters: {
    transactionType: "",
    companyName: "",
    companyType: "",
    status: "",
    jurisdiction: "",
    dealValueMin: "",
    dealValueMax: "",
  },

  // Selected matter details
  selectedMatter: null,
  selectedDetails: null,

  // Statistics
  stats: null,
  pendingApprovals: [],

  // Loading states
  loading: false,
  detailsLoading: false,
  statsLoading: false,
  actionLoading: false,

  // Error handling
  error: null,

  // UI state
  searchMode: false,
};

// ============================================
// ASYNC THUNKS - LISTING & DETAILS
// ============================================

export const fetchCorporateMatters = createAsyncThunk(
  "corporate/fetchMatters",
  async (params, { rejectWithValue }) => {
    try {
      const response = await corporateService.getAllCorporateMatters(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch corporate matters",
      );
    }
  },
);

export const searchCorporateMatters = createAsyncThunk(
  "corporate/searchMatters",
  async ({ criteria, params = {} }, { rejectWithValue }) => {
    try {
      const response = await corporateService.searchCorporateMatters(
        criteria,
        params,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Search failed");
    }
  },
);

export const fetchCorporateDetails = createAsyncThunk(
  "corporate/fetchDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await corporateService.getCorporateDetails(matterId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch corporate details",
      );
    }
  },
);

export const createCorporateDetails = createAsyncThunk(
  "corporate/createDetails",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.createCorporateDetails(
        matterId,
        data,
      );
      message.success("Corporate details created successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to create corporate details",
      );
      return rejectWithValue(error.response?.data || "Creation failed");
    }
  },
);

export const updateCorporateDetails = createAsyncThunk(
  "corporate/updateDetails",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateCorporateDetails(
        matterId,
        data,
      );
      message.success("Corporate details updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update corporate details",
      );
      return rejectWithValue(error.response?.data || "Update failed");
    }
  },
);

// ============================================
// PARTIES MANAGEMENT
// ============================================

export const addParty = createAsyncThunk(
  "corporate/addParty",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.addParty(matterId, data);
      message.success("Party added successfully");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add party");
      return rejectWithValue(error.response?.data || "Failed to add party");
    }
  },
);

export const updateParty = createAsyncThunk(
  "corporate/updateParty",
  async ({ matterId, partyId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateParty(
        matterId,
        partyId,
        data,
      );
      message.success("Party updated successfully");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to update party");
      return rejectWithValue(error.response?.data || "Failed to update party");
    }
  },
);

export const removeParty = createAsyncThunk(
  "corporate/removeParty",
  async ({ matterId, partyId }, { rejectWithValue }) => {
    try {
      const response = await corporateService.removeParty(matterId, partyId);
      message.success("Party removed successfully");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to remove party");
      return rejectWithValue(error.response?.data || "Failed to remove party");
    }
  },
);

// ============================================
// SHAREHOLDERS MANAGEMENT
// ============================================

export const addShareholder = createAsyncThunk(
  "corporate/addShareholder",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.addShareholder(matterId, data);
      message.success("Shareholder added successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to add shareholder",
      );
      return rejectWithValue(
        error.response?.data || "Failed to add shareholder",
      );
    }
  },
);

export const updateShareholder = createAsyncThunk(
  "corporate/updateShareholder",
  async ({ matterId, shareholderId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateShareholder(
        matterId,
        shareholderId,
        data,
      );
      message.success("Shareholder updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update shareholder",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update shareholder",
      );
    }
  },
);

export const removeShareholder = createAsyncThunk(
  "corporate/removeShareholder",
  async ({ matterId, shareholderId }, { rejectWithValue }) => {
    try {
      const response = await corporateService.removeShareholder(
        matterId,
        shareholderId,
      );
      message.success("Shareholder removed successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove shareholder",
      );
      return rejectWithValue(
        error.response?.data || "Failed to remove shareholder",
      );
    }
  },
);

// ============================================
// DIRECTORS MANAGEMENT
// ============================================

export const addDirector = createAsyncThunk(
  "corporate/addDirector",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.addDirector(matterId, data);
      message.success("Director added successfully");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add director");
      return rejectWithValue(error.response?.data || "Failed to add director");
    }
  },
);

export const updateDirector = createAsyncThunk(
  "corporate/updateDirector",
  async ({ matterId, directorId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateDirector(
        matterId,
        directorId,
        data,
      );
      message.success("Director updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update director",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update director",
      );
    }
  },
);

export const removeDirector = createAsyncThunk(
  "corporate/removeDirector",
  async ({ matterId, directorId }, { rejectWithValue }) => {
    try {
      const response = await corporateService.removeDirector(
        matterId,
        directorId,
      );
      message.success("Director removed successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove director",
      );
      return rejectWithValue(
        error.response?.data || "Failed to remove director",
      );
    }
  },
);

// ============================================
// MILESTONES MANAGEMENT
// ============================================

export const addMilestone = createAsyncThunk(
  "corporate/addMilestone",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.addMilestone(matterId, data);
      message.success("Milestone added successfully");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add milestone");
      return rejectWithValue(error.response?.data || "Failed to add milestone");
    }
  },
);

export const updateMilestone = createAsyncThunk(
  "corporate/updateMilestone",
  async ({ matterId, milestoneId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateMilestone(
        matterId,
        milestoneId,
        data,
      );
      message.success("Milestone updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update milestone",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update milestone",
      );
    }
  },
);

export const completeMilestone = createAsyncThunk(
  "corporate/completeMilestone",
  async ({ matterId, milestoneId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.completeMilestone(
        matterId,
        milestoneId,
        data,
      );
      message.success("Milestone completed successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to complete milestone",
      );
      return rejectWithValue(
        error.response?.data || "Failed to complete milestone",
      );
    }
  },
);

export const removeMilestone = createAsyncThunk(
  "corporate/removeMilestone",
  async ({ matterId, milestoneId }, { rejectWithValue }) => {
    try {
      const response = await corporateService.removeMilestone(
        matterId,
        milestoneId,
      );
      message.success("Milestone removed successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove milestone",
      );
      return rejectWithValue(
        error.response?.data || "Failed to remove milestone",
      );
    }
  },
);

// ============================================
// DUE DILIGENCE
// ============================================

export const updateDueDiligence = createAsyncThunk(
  "corporate/updateDueDiligence",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateDueDiligence(
        matterId,
        data,
      );
      message.success("Due diligence updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update due diligence",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update due diligence",
      );
    }
  },
);

// ============================================
// REGULATORY APPROVALS
// ============================================

export const addRegulatoryApproval = createAsyncThunk(
  "corporate/addRegulatoryApproval",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.addRegulatoryApproval(
        matterId,
        data,
      );
      message.success("Regulatory approval added successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to add regulatory approval",
      );
      return rejectWithValue(
        error.response?.data || "Failed to add regulatory approval",
      );
    }
  },
);

export const updateRegulatoryApproval = createAsyncThunk(
  "corporate/updateRegulatoryApproval",
  async ({ matterId, approvalId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateRegulatoryApproval(
        matterId,
        approvalId,
        data,
      );
      message.success("Regulatory approval updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update regulatory approval",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update regulatory approval",
      );
    }
  },
);

export const removeRegulatoryApproval = createAsyncThunk(
  "corporate/removeRegulatoryApproval",
  async ({ matterId, approvalId }, { rejectWithValue }) => {
    try {
      const response = await corporateService.removeRegulatoryApproval(
        matterId,
        approvalId,
      );
      message.success("Regulatory approval removed successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove regulatory approval",
      );
      return rejectWithValue(
        error.response?.data || "Failed to remove regulatory approval",
      );
    }
  },
);

// ============================================
// KEY AGREEMENTS
// ============================================

export const addKeyAgreement = createAsyncThunk(
  "corporate/addKeyAgreement",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.addKeyAgreement(matterId, data);
      message.success("Agreement added successfully");
      return response;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add agreement");
      return rejectWithValue(error.response?.data || "Failed to add agreement");
    }
  },
);

export const updateKeyAgreement = createAsyncThunk(
  "corporate/updateKeyAgreement",
  async ({ matterId, agreementId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateKeyAgreement(
        matterId,
        agreementId,
        data,
      );
      message.success("Agreement updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update agreement",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update agreement",
      );
    }
  },
);

export const removeKeyAgreement = createAsyncThunk(
  "corporate/removeKeyAgreement",
  async ({ matterId, agreementId }, { rejectWithValue }) => {
    try {
      const response = await corporateService.removeKeyAgreement(
        matterId,
        agreementId,
      );
      message.success("Agreement removed successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove agreement",
      );
      return rejectWithValue(
        error.response?.data || "Failed to remove agreement",
      );
    }
  },
);

// ============================================
// COMPLIANCE REQUIREMENTS
// ============================================

export const addComplianceRequirement = createAsyncThunk(
  "corporate/addComplianceRequirement",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.addComplianceRequirement(
        matterId,
        data,
      );
      message.success("Compliance requirement added successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to add compliance requirement",
      );
      return rejectWithValue(
        error.response?.data || "Failed to add compliance requirement",
      );
    }
  },
);

export const updateComplianceRequirement = createAsyncThunk(
  "corporate/updateComplianceRequirement",
  async ({ matterId, requirementId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.updateComplianceRequirement(
        matterId,
        requirementId,
        data,
      );
      message.success("Compliance requirement updated successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Failed to update compliance requirement",
      );
      return rejectWithValue(
        error.response?.data || "Failed to update compliance requirement",
      );
    }
  },
);

export const removeComplianceRequirement = createAsyncThunk(
  "corporate/removeComplianceRequirement",
  async ({ matterId, requirementId }, { rejectWithValue }) => {
    try {
      const response = await corporateService.removeComplianceRequirement(
        matterId,
        requirementId,
      );
      message.success("Compliance requirement removed successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Failed to remove compliance requirement",
      );
      return rejectWithValue(
        error.response?.data || "Failed to remove compliance requirement",
      );
    }
  },
);

// ============================================
// TRANSACTION CLOSING
// ============================================

export const recordClosing = createAsyncThunk(
  "corporate/recordClosing",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await corporateService.recordClosing(matterId, data);
      message.success("Transaction closing recorded successfully");
      return response;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to record closing",
      );
      return rejectWithValue(
        error.response?.data || "Failed to record closing",
      );
    }
  },
);

// ============================================
// STATISTICS
// ============================================

export const fetchCorporateStats = createAsyncThunk(
  "corporate/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await corporateService.getCorporateStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch statistics",
      );
    }
  },
);

export const fetchPendingApprovals = createAsyncThunk(
  "corporate/fetchPendingApprovals",
  async (params, { rejectWithValue }) => {
    try {
      const response = await corporateService.getPendingApprovals(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch pending approvals",
      );
    }
  },
);

// ============================================
// SLICE
// ============================================

const corporateSlice = createSlice({
  name: "corporate",
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
  },

  extraReducers: (builder) => {
    // Fetch corporate matters
    builder
      .addCase(fetchCorporateMatters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCorporateMatters.fulfilled, (state, action) => {
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
      .addCase(fetchCorporateMatters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Corporate details
    builder
      .addCase(fetchCorporateDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchCorporateDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedDetails = action.payload.data?.corporateDetail;
      })
      .addCase(fetchCorporateDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })
      .addCase(createCorporateDetails.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createCorporateDetails.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.corporateDetail;
      })
      .addCase(createCorporateDetails.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateCorporateDetails.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateCorporateDetails.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedDetails = action.payload.data?.corporateDetail;
      })
      .addCase(updateCorporateDetails.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // All other thunks update selectedDetails
    const detailUpdateThunks = [
      addParty,
      updateParty,
      removeParty,
      addShareholder,
      updateShareholder,
      removeShareholder,
      addDirector,
      updateDirector,
      removeDirector,
      addMilestone,
      updateMilestone,
      completeMilestone,
      removeMilestone,
      updateDueDiligence,
      addRegulatoryApproval,
      updateRegulatoryApproval,
      removeRegulatoryApproval,
      addKeyAgreement,
      updateKeyAgreement,
      removeKeyAgreement,
      addComplianceRequirement,
      updateComplianceRequirement,
      removeComplianceRequirement,
      recordClosing,
    ];

    detailUpdateThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.actionLoading = true;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.actionLoading = false;
          state.selectedDetails = action.payload.data?.corporateDetail;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.actionLoading = false;
          state.error = action.payload;
        });
    });

    // Statistics
    builder
      .addCase(fetchCorporateStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchCorporateStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCorporateStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.pendingApprovals = action.payload.pendingApprovals || [];
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
} = corporateSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectCorporateMatters = (state) => state.corporate.matters;
export const selectPagination = (state) => state.corporate.pagination;
export const selectFilters = (state) => state.corporate.filters;
export const selectSelectedDetails = (state) => state.corporate.selectedDetails;
export const selectCorporateStats = (state) => state.corporate.stats;
export const selectPendingApprovals = (state) =>
  state.corporate.pendingApprovals;
export const selectCorporateLoading = (state) => state.corporate.loading;
export const selectDetailsLoading = (state) => state.corporate.detailsLoading;
export const selectActionLoading = (state) => state.corporate.actionLoading;
export const selectCorporateError = (state) => state.corporate.error;

export default corporateSlice.reducer;
