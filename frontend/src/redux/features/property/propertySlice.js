import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import propertyService from "./propertyService";
import { message } from "antd";

const initialState = {
  matters: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {
    transactionType: "",
    propertyType: "",
    state: "",
    status: "",
    search: "",
    minPrice: "",
    maxPrice: "",
    dateRange: [],
  },
  selectedMatter: null,
  selectedDetails: null,
  properties: [],
  paymentSchedule: [],
  conditions: [],
  stats: null,
  pendingConsents: [],
  expiringLeases: [],
  leaseStats: null,
  leasePagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
  leaseFilters: {
    urgency: "",
    daysThreshold: "",
  },
  loading: false,
  detailsLoading: false,
  statsLoading: false,
  actionLoading: false,
  error: null,
  searchMode: false,
};

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchPropertyMatters = createAsyncThunk(
  "property/fetchMatters",
  async (params, { rejectWithValue }) => {
    try {
      const response = await propertyService.getAllPropertyMatters(params);
      console.log("Fetched property matters:", response);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch property matters",
      );
    }
  },
);

export const searchPropertyMatters = createAsyncThunk(
  "property/searchMatters",
  async ({ criteria, params = {} }, { rejectWithValue }) => {
    try {
      const response = await propertyService.searchPropertyMatters(
        criteria,
        params,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Search failed");
    }
  },
);

export const fetchPropertyDetails = createAsyncThunk(
  "property/fetchDetails",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await propertyService.getPropertyDetails(matterId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch property details",
      );
    }
  },
);

export const createPropertyDetails = createAsyncThunk(
  "property/createDetails",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.createPropertyDetails(
        matterId,
        data,
      );
      message.success("Property details created successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to create property details",
      );
      return rejectWithValue(
        error.response?.data?.message || "Creation failed",
      );
    }
  },
);

export const updatePropertyDetails = createAsyncThunk(
  "property/updateDetails",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updatePropertyDetails(
        matterId,
        data,
      );
      message.success("Property details updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update property details",
      );
      return rejectWithValue(error.response?.data?.message || "Update failed");
    }
  },
);

export const addProperty = createAsyncThunk(
  "property/addProperty",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.addProperty(matterId, data);
      message.success("Property added successfully");
      return response.data;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add property");
      return rejectWithValue(
        error.response?.data?.message || "Failed to add property",
      );
    }
  },
);

export const updateProperty = createAsyncThunk(
  "property/updateProperty",
  async ({ matterId, propertyId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateProperty(
        matterId,
        propertyId,
        data,
      );
      message.success("Property updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update property",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update property",
      );
    }
  },
);

export const removeProperty = createAsyncThunk(
  "property/removeProperty",
  async ({ matterId, propertyId }, { rejectWithValue }) => {
    try {
      const response = await propertyService.removeProperty(
        matterId,
        propertyId,
      );
      message.success("Property removed successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove property",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove property",
      );
    }
  },
);

export const addPayment = createAsyncThunk(
  "property/addPayment",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.addPayment(matterId, data);
      message.success("Payment added successfully");
      return response.data;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add payment");
      return rejectWithValue(
        error.response?.data?.message || "Failed to add payment",
      );
    }
  },
);

export const updatePayment = createAsyncThunk(
  "property/updatePayment",
  async ({ matterId, installmentId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updatePayment(
        matterId,
        installmentId,
        data,
      );
      message.success("Payment updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update payment",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update payment",
      );
    }
  },
);

export const removePayment = createAsyncThunk(
  "property/removePayment",
  async ({ matterId, installmentId }, { rejectWithValue }) => {
    try {
      const response = await propertyService.removePayment(
        matterId,
        installmentId,
      );
      message.success("Payment removed successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove payment",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove payment",
      );
    }
  },
);

export const addCondition = createAsyncThunk(
  "property/addCondition",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.addCondition(matterId, data);
      message.success("Condition added successfully");
      return response.data;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add condition");
      return rejectWithValue(
        error.response?.data?.message || "Failed to add condition",
      );
    }
  },
);

export const updateCondition = createAsyncThunk(
  "property/updateCondition",
  async ({ matterId, conditionId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateCondition(
        matterId,
        conditionId,
        data,
      );
      message.success("Condition updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update condition",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update condition",
      );
    }
  },
);

export const removeCondition = createAsyncThunk(
  "property/removeCondition",
  async ({ matterId, conditionId }, { rejectWithValue }) => {
    try {
      const response = await propertyService.removeCondition(
        matterId,
        conditionId,
      );
      message.success("Condition removed successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove condition",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove condition",
      );
    }
  },
);

export const updateTitleSearch = createAsyncThunk(
  "property/updateTitleSearch",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateTitleSearch(matterId, data);
      message.success("Title search updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update title search",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update title search",
      );
    }
  },
);

export const updateGovernorsConsent = createAsyncThunk(
  "property/updateGovernorsConsent",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateGovernorsConsent(
        matterId,
        data,
      );
      message.success("Governor's consent updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update governor's consent",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update governor's consent",
      );
    }
  },
);

export const updateContractOfSale = createAsyncThunk(
  "property/updateContractOfSale",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateContractOfSale(
        matterId,
        data,
      );
      message.success("Contract of sale updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update contract of sale",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update contract of sale",
      );
    }
  },
);

export const updateLeaseAgreement = createAsyncThunk(
  "property/updateLeaseAgreement",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateLeaseAgreement(
        matterId,
        data,
      );
      message.success("Lease agreement updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update lease agreement",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update lease agreement",
      );
    }
  },
);

export const recordPhysicalInspection = createAsyncThunk(
  "property/recordPhysicalInspection",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.recordPhysicalInspection(
        matterId,
        data,
      );
      message.success("Physical inspection recorded successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to record physical inspection",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to record physical inspection",
      );
    }
  },
);

export const recordCompletion = createAsyncThunk(
  "property/recordCompletion",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.recordCompletion(matterId, data);
      message.success("Transaction completed successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to complete transaction",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete transaction",
      );
    }
  },
);

export const fetchPropertyStats = createAsyncThunk(
  "property/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await propertyService.getPropertyStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch statistics",
      );
    }
  },
);

export const fetchPendingConsents = createAsyncThunk(
  "property/fetchPendingConsents",
  async (params, { rejectWithValue }) => {
    try {
      const response = await propertyService.getPendingConsents(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pending consents",
      );
    }
  },
);

// ============================================
// LEASE TRACKING THUNKS
// ============================================

export const fetchExpiringLeases = createAsyncThunk(
  "property/fetchExpiringLeases",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await propertyService.getExpiringLeases(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch expiring leases",
      );
    }
  },
);

export const fetchLeaseStats = createAsyncThunk(
  "property/fetchLeaseStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await propertyService.getLeaseStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch lease statistics",
      );
    }
  },
);

export const updateLeaseAlertSettings = createAsyncThunk(
  "property/updateLeaseAlertSettings",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateLeaseAlertSettings(matterId, data);
      message.success("Alert settings updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update alert settings",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update alert settings",
      );
    }
  },
);

export const addLeaseMilestone = createAsyncThunk(
  "property/addLeaseMilestone",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.addLeaseMilestone(matterId, data);
      message.success("Milestone added successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to add milestone",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to add milestone",
      );
    }
  },
);

export const updateLeaseMilestone = createAsyncThunk(
  "property/updateLeaseMilestone",
  async ({ matterId, milestoneId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateLeaseMilestone(
        matterId,
        milestoneId,
        data,
      );
      message.success("Milestone updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update milestone",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update milestone",
      );
    }
  },
);

export const deleteLeaseMilestone = createAsyncThunk(
  "property/deleteLeaseMilestone",
  async ({ matterId, milestoneId }, { rejectWithValue }) => {
    try {
      const response = await propertyService.deleteLeaseMilestone(
        matterId,
        milestoneId,
      );
      message.success("Milestone removed successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to remove milestone",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove milestone",
      );
    }
  },
);

export const initiateRenewal = createAsyncThunk(
  "property/initiateRenewal",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.initiateRenewal(matterId, data);
      message.success("Renewal process initiated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to initiate renewal",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to initiate renewal",
      );
    }
  },
);

export const updateRenewalTracking = createAsyncThunk(
  "property/updateRenewalTracking",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateRenewalTracking(matterId, data);
      message.success("Renewal tracking updated successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update renewal tracking",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update renewal tracking",
      );
    }
  },
);

export const addNegotiation = createAsyncThunk(
  "property/addNegotiation",
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      const response = await propertyService.addNegotiation(matterId, data);
      message.success("Negotiation added successfully");
      return response.data;
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to add negotiation",
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to add negotiation",
      );
    }
  },
);

// ============================================
// SLICE
// ============================================

const propertySlice = createSlice({
  name: "property",
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
    setLeaseFilters: (state, action) => {
      state.leaseFilters = { ...state.leaseFilters, ...action.payload };
      state.leasePagination.page = 1;
    },
    clearLeaseFilters: (state) => {
      state.leaseFilters = initialState.leaseFilters;
      state.leasePagination.page = 1;
    },
    setLeasePage: (state, action) => {
      state.leasePagination.page = action.payload;
    },
  },

  extraReducers: (builder) => {
    // Fetch property matters
    builder
      .addCase(fetchPropertyMatters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyMatters.fulfilled, (state, action) => {
        state.loading = false;

        const payloadData = action.payload;
        state.matters = Array.isArray(payloadData)
          ? payloadData
          : payloadData?.matters || [];

        state.pagination = {
          page: action.payload.pagination?.currentPage || 1,
          limit: action.payload.pagination?.limit || 20,
          total: action.payload.pagination?.totalRecords || 0,
          pages: action.payload.pagination?.totalPages || 1,
        };

        state.searchMode = false;
      })
      .addCase(fetchPropertyMatters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        message.error(action.payload || "Failed to fetch property matters");
      });

    // Search property matters
    builder
      .addCase(searchPropertyMatters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPropertyMatters.fulfilled, (state, action) => {
        state.loading = false;
        state.matters = Array.isArray(action.payload.data)
          ? action.payload.data
          : [];

        state.pagination = {
          page:
            action.payload.pagination?.currentPage ||
            action.payload.pagination?.current ||
            1,
          limit: action.payload.pagination?.limit || 20,
          total:
            action.payload.pagination?.totalRecords ||
            action.payload.pagination?.total ||
            0,
          pages: action.payload.pagination?.totalPages || 1,
        };
        state.searchMode = true;
      })
      .addCase(searchPropertyMatters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        message.error(action.payload || "Search failed");
      });

    // Property details
    builder
      .addCase(fetchPropertyDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
        state.properties = propertyDetail?.properties || [];
        state.paymentSchedule = propertyDetail?.paymentSchedule || [];
        state.conditions = propertyDetail?.conditions || [];
      })
      .addCase(fetchPropertyDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
        message.error(action.payload || "Failed to fetch property details");
      })
      .addCase(createPropertyDetails.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createPropertyDetails.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(createPropertyDetails.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updatePropertyDetails.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updatePropertyDetails.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(updatePropertyDetails.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // All other thunks update selectedDetails
    const detailUpdateThunks = [
      addProperty,
      updateProperty,
      removeProperty,
      addPayment,
      updatePayment,
      removePayment,
      addCondition,
      updateCondition,
      removeCondition,
      updateTitleSearch,
      updateGovernorsConsent,
      updateContractOfSale,
      updateLeaseAgreement,
      recordPhysicalInspection,
      recordCompletion,
    ];

    detailUpdateThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.actionLoading = true;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.actionLoading = false;
          const propertyDetail =
            action.payload.propertyDetail ||
            action.payload.data?.propertyDetail ||
            action.payload.data;
          state.selectedDetails = propertyDetail;

          if (propertyDetail?.properties) {
            state.properties = propertyDetail.properties;
          }
          if (propertyDetail?.paymentSchedule) {
            state.paymentSchedule = propertyDetail.paymentSchedule;
          }
          if (propertyDetail?.conditions) {
            state.conditions = propertyDetail.conditions;
          }
        })
        .addCase(thunk.rejected, (state, action) => {
          state.actionLoading = false;
          state.error = action.payload;
        });
    });

    // Statistics
    builder
      .addCase(fetchPropertyStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchPropertyStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        // API might return { status, success, data: {...stats} } or just {...stats}
        state.stats = action.payload.data || action.payload;
      })
      .addCase(fetchPropertyStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
        message.error(action.payload || "Failed to fetch statistics");
      })
      .addCase(fetchPendingConsents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingConsents.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingConsents = Array.isArray(action.payload.data)
          ? action.payload.data
          : action.payload.matters || [];
      })
      .addCase(fetchPendingConsents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        message.error(action.payload || "Failed to fetch pending consents");
      });

    // Lease tracking reducers
    builder
      .addCase(fetchExpiringLeases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpiringLeases.fulfilled, (state, action) => {
        state.loading = false;
        state.expiringLeases = action.payload.data?.leases || action.payload.leases || [];
        state.leasePagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || 50,
          total: action.payload.total || 0,
        };
      })
      .addCase(fetchExpiringLeases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        message.error(action.payload || "Failed to fetch expiring leases");
      })
      .addCase(fetchLeaseStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchLeaseStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.leaseStats = action.payload.data || action.payload;
      })
      .addCase(fetchLeaseStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
        message.error(action.payload || "Failed to fetch lease statistics");
      })
      .addCase(updateLeaseAlertSettings.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateLeaseAlertSettings.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(updateLeaseAlertSettings.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(addLeaseMilestone.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addLeaseMilestone.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(addLeaseMilestone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateLeaseMilestone.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateLeaseMilestone.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(updateLeaseMilestone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteLeaseMilestone.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteLeaseMilestone.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(deleteLeaseMilestone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(initiateRenewal.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(initiateRenewal.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(initiateRenewal.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateRenewalTracking.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateRenewalTracking.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(updateRenewalTracking.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(addNegotiation.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addNegotiation.fulfilled, (state, action) => {
        state.actionLoading = false;
        const propertyDetail =
          action.payload.propertyDetail ||
          action.payload.data?.propertyDetail ||
          action.payload.data;
        state.selectedDetails = propertyDetail;
      })
      .addCase(addNegotiation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  clearSelectedMatter,
  setSearchMode,
  clearError,
  setLeaseFilters,
  clearLeaseFilters,
  setLeasePage,
} = propertySlice.actions;

export const selectPropertyMatters = (state) => state.property.matters;
export const selectPagination = (state) =>
  state.property?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  };
export const selectFilters = (state) =>
  state.property?.filters || initialState.filters;
export const selectSelectedDetails = (state) =>
  state.property?.selectedDetails || null;
export const selectProperties = (state) => state.property?.properties || [];
export const selectPaymentSchedule = (state) =>
  state.property?.paymentSchedule || [];
export const selectConditions = (state) => state.property?.conditions || [];
export const selectPropertyStats = (state) => state.property?.stats || null;
export const selectPendingConsents = (state) =>
  state.property?.pendingConsents || [];
export const selectPropertyLoading = (state) =>
  state.property?.loading || false;
export const selectDetailsLoading = (state) =>
  state.property?.detailsLoading || false;
export const selectActionLoading = (state) =>
  state.property?.actionLoading || false;
export const selectPropertyError = (state) => state.property?.error || null;
export const selectExpiringLeases = (state) =>
  state.property?.expiringLeases || [];
export const selectLeaseStats = (state) => state.property?.leaseStats || null;
export const selectLeasePagination = (state) =>
  state.property?.leasePagination || {
    page: 1,
    limit: 50,
    total: 0,
  };
export const selectLeaseFilters = (state) =>
  state.property?.leaseFilters || initialState.leaseFilters;

export default propertySlice.reducer;
