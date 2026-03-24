import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cacComplianceApi from './cacComplianceApi';

const initialState = {
  dashboard: {
    stats: {
      totalClients: 0,
      atRiskCount: 0,
      totalFirmLiability: 0,
    },
    atRiskCompanies: [],
    upcomingDeadlines: [],
  },
  companies: [],
  companiesPagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  currentCompany: null,
  currentCompanyChecks: [],
  isLoading: false,
  error: null,
};

export const fetchDashboard = createAsyncThunk(
  'cacCompliance/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
);

export const fetchCompanies = createAsyncThunk(
  'cacCompliance/fetchCompanies',
  async (params, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getCompanies(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch companies');
    }
  }
);

export const fetchCompany = createAsyncThunk(
  'cacCompliance/fetchCompany',
  async (id, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getCompany(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch company');
    }
  }
);

export const createCompany = createAsyncThunk(
  'cacCompliance/createCompany',
  async (data, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.createCompany(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'cacCompliance/updateCompany',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.updateCompany(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update company');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'cacCompliance/deleteCompany',
  async (id, { rejectWithValue }) => {
    try {
      await cacComplianceApi.deleteCompany(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete company');
    }
  }
);

export const runAudit = createAsyncThunk(
  'cacCompliance/runAudit',
  async (id, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.runAudit(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to run audit');
    }
  }
);

export const resolveCheck = createAsyncThunk(
  'cacCompliance/resolveCheck',
  async (id, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.resolveCheck(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resolve check');
    }
  }
);

const cacComplianceSlice = createSlice({
  name: 'cacCompliance',
  initialState,
  reducers: {
    clearCurrentCompany: (state) => {
      state.currentCompany = null;
      state.currentCompanyChecks = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies = action.payload.data;
        state.companiesPagination = action.payload.pagination;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCompany = action.payload.company;
        state.currentCompanyChecks = action.payload.complianceChecks;
      })
      .addCase(fetchCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.companies.unshift(action.payload.company);
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.currentCompany = action.payload.company;
        state.currentCompanyChecks = action.payload.complianceChecks;
        const index = state.companies.findIndex(c => c._id === action.payload.company._id);
        if (index !== -1) {
          state.companies[index] = action.payload.company;
        }
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.companies = state.companies.filter(c => c._id !== action.payload);
        if (state.currentCompany?._id === action.payload) {
          state.currentCompany = null;
          state.currentCompanyChecks = [];
        }
      })
      .addCase(runAudit.fulfilled, (state, action) => {
        state.currentCompany = action.payload.company;
        state.currentCompanyChecks = action.payload.complianceChecks;
      })
      .addCase(resolveCheck.fulfilled, (state, action) => {
        const index = state.currentCompanyChecks.findIndex(
          c => c._id === action.payload._id
        );
        if (index !== -1) {
          state.currentCompanyChecks[index] = action.payload;
        }
      });
  },
});

export const { clearCurrentCompany, clearError } = cacComplianceSlice.actions;
export default cacComplianceSlice.reducer;
