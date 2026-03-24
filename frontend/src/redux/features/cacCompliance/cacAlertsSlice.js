import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cacComplianceApi from './cacComplianceApi';

const initialState = {
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchAlerts = createAsyncThunk(
  'cacAlerts/fetchAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getAlerts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alerts');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'cacAlerts/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getUnreadAlertCount();
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const markAlertRead = createAsyncThunk(
  'cacAlerts/markAlertRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.markAlertRead(id);
      return { id, alert: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark alert as read');
    }
  }
);

export const markAllAlertsRead = createAsyncThunk(
  'cacAlerts/markAllAlertsRead',
  async (_, { rejectWithValue }) => {
    try {
      await cacComplianceApi.markAllAlertsRead();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all alerts as read');
    }
  }
);

const cacAlertsSlice = createSlice({
  name: 'cacAlerts',
  initialState,
  reducers: {
    clearAlerts: (state) => {
      state.alerts = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
        state.unreadCount = action.payload.filter(a => !a.isRead).length;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAlertRead.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(a => a._id === action.payload.id);
        if (index !== -1) {
          state.alerts[index].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAlertsRead.fulfilled, (state) => {
        state.alerts = state.alerts.map(a => ({ ...a, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export const { clearAlerts, clearError } = cacAlertsSlice.actions;
export default cacAlertsSlice.reducer;
