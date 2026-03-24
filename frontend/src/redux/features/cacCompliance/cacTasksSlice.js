import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cacComplianceApi from './cacComplianceApi';

const initialState = {
  tasks: [],
  currentTask: null,
  tasksPagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  },
  overdueTasks: [],
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  'cacTasks/fetchTasks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getTasks(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchOverdueTasks = createAsyncThunk(
  'cacTasks/fetchOverdueTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getOverdueTasks();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch overdue tasks');
    }
  }
);

export const fetchTasksByCompany = createAsyncThunk(
  'cacTasks/fetchTasksByCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getTasksByCompany(companyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch company tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'cacTasks/createTask',
  async (data, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.createTask(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'cacTasks/updateTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.updateTask(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'cacTasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await cacComplianceApi.deleteTask(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

const cacTasksSlice = createSlice({
  name: 'cacTasks',
  initialState,
  reducers: {
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.data;
        state.tasksPagination = action.payload.pagination;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchOverdueTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOverdueTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overdueTasks = action.payload;
      })
      .addCase(fetchOverdueTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTasksByCompany.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasksByCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksByCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        state.currentTask = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t._id !== action.payload);
      });
  },
});

export const { clearCurrentTask, clearError } = cacTasksSlice.actions;
export default cacTasksSlice.reducer;
