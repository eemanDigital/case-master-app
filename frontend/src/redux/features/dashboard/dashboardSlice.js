import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import dashboardService from "./dashboardService";

const initialState = {
  summary: null,
  recentMatters: [],
  recentTasks: [],
  upcomingEvents: [],
  statistics: null,
  loading: false,
  error: null,
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async (_, thunkAPI) => {
    try {
      const data = await dashboardService.getDashboardSummary();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch dashboard data"
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardData(state) {
      state.summary = null;
      state.recentMatters = [];
      state.recentTasks = [];
      state.upcomingEvents = [];
      state.statistics = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
        state.statistics = action.payload?.data?.statistics || null;
        state.recentMatters = action.payload?.data?.recentMatters || [];
        state.recentTasks = action.payload?.data?.recentTasks || [];
        state.upcomingEvents = action.payload?.data?.upcomingEvents || [];
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
