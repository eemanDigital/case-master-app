import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import * as taskApi from "./taskService";

// ============================================================
// Entity Adapter
// ============================================================
const taskAdapter = createEntityAdapter({
  selectId: (task) => task._id,
  sortComparer: (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated),
});

const initialState = taskAdapter.getInitialState({
  selectedTaskId: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {
    status: "",
    priority: "",
    category: "",
    assignedTo: "",
    matterId: "",
    matterType: "",
    litigationDetailId: "",
    startDate: "",
    endDate: "",
  },
  myTasks: [],
  overdueTasks: [],
  pendingReviewTasks: [],
  taskHistory: [],
  taskAccess: null,
  reminders: [],
  dependencies: [],
  availableDependencies: [],
  loading: false,
  selectedTaskLoading: false,
  actionLoading: false,
  error: null,
});

// ============================================================
// Helper — unwrap apiService response uniformly
// Handles both { data } envelopes and raw objects
// ============================================================
const unwrap = (res) => res?.data ?? res;

// ============================================================
// Core Task Thunks
// ============================================================
export const fetchTasks = createAsyncThunk(
  "task/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      const res = await taskApi.getAllTasks(params);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch tasks",
      );
    }
  },
);

export const fetchTask = createAsyncThunk(
  "task/fetchTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.getTask(taskId);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch task",
      );
    }
  },
);

export const createTask = createAsyncThunk(
  "task/createTask",
  async (data, { rejectWithValue }) => {
    try {
      const res = await taskApi.createTask(data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to create task",
      );
    }
  },
);

export const updateTask = createAsyncThunk(
  "task/updateTask",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.updateTask(taskId, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to update task",
      );
    }
  },
);

export const deleteTask = createAsyncThunk(
  "task/deleteTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.deleteTask(taskId);
      return { taskId, ...unwrap(res) };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to delete task",
      );
    }
  },
);

// ============================================================
// Filtered Task List Thunks
// ============================================================
export const fetchMyTasks = createAsyncThunk(
  "task/fetchMyTasks",
  async (params, { rejectWithValue }) => {
    try {
      const res = await taskApi.getMyTasks(params);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch my tasks",
      );
    }
  },
);

export const fetchOverdueTasks = createAsyncThunk(
  "task/fetchOverdueTasks",
  async (params, { rejectWithValue }) => {
    try {
      const res = await taskApi.getOverdueTasks(params);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch overdue tasks",
      );
    }
  },
);

export const fetchPendingReviewTasks = createAsyncThunk(
  "task/fetchPendingReviewTasks",
  async (params, { rejectWithValue }) => {
    try {
      const res = await taskApi.getTasksPendingReview(params);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch pending review tasks",
      );
    }
  },
);

// ============================================================
// Assignee Thunks
// ============================================================
export const addTaskAssignee = createAsyncThunk(
  "task/addAssignee",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.addAssignee(taskId, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to add assignee",
      );
    }
  },
);

export const removeTaskAssignee = createAsyncThunk(
  "task/removeAssignee",
  async ({ taskId, userId }, { rejectWithValue }) => {
    try {
      const res = await taskApi.removeAssignee(taskId, userId);
      return { taskId, userId, ...unwrap(res) };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to remove assignee",
      );
    }
  },
);

// ============================================================
// Task Response Thunks
// ============================================================
export const submitTaskResponse = createAsyncThunk(
  "task/submitResponse",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.submitTaskResponse(taskId, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to submit response",
      );
    }
  },
);

export const deleteTaskResponse = createAsyncThunk(
  "task/deleteResponse",
  async ({ taskId, responseId }, { rejectWithValue }) => {
    try {
      const res = await taskApi.deleteTaskResponse(taskId, responseId);
      return { taskId, responseId, ...unwrap(res) };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to delete response",
      );
    }
  },
);

export const reviewTaskResponse = createAsyncThunk(
  "task/reviewResponse",
  async ({ taskId, responseIndex, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.reviewTaskResponse(taskId, responseIndex, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to review response",
      );
    }
  },
);

// ============================================================
// Review Workflow Thunks
// ============================================================
export const submitForReview = createAsyncThunk(
  "task/submitForReview",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.submitTaskForReview(taskId, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to submit for review",
      );
    }
  },
);

export const reviewTaskComplete = createAsyncThunk(
  "task/reviewComplete",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.reviewTask(taskId, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to review task",
      );
    }
  },
);

export const forceCompleteTask = createAsyncThunk(
  "task/forceComplete",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.forceCompleteTask(taskId, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to force complete task",
      );
    }
  },
);

// ============================================================
// Document Thunks
// ============================================================
export const fetchTaskDocuments = createAsyncThunk(
  "task/fetchDocuments",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.getTaskDocuments(taskId);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch documents",
      );
    }
  },
);

export const uploadTaskReferenceDocs = createAsyncThunk(
  "task/uploadReferenceDocs",
  async ({ taskId, formData }, { rejectWithValue }) => {
    try {
      const res = await taskApi.uploadReferenceDocuments(taskId, formData);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to upload reference documents",
      );
    }
  },
);

export const uploadTaskResponseDocs = createAsyncThunk(
  "task/uploadResponseDocs",
  async ({ taskId, formData }, { rejectWithValue }) => {
    try {
      const res = await taskApi.uploadResponseDocuments(taskId, formData);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to upload response documents",
      );
    }
  },
);

// ============================================================
// History & Access Thunks
// ============================================================
export const fetchTaskHistory = createAsyncThunk(
  "task/fetchHistory",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.getTaskHistory(taskId);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch task history",
      );
    }
  },
);

export const checkTaskAccess = createAsyncThunk(
  "task/checkAccess",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.checkTaskAccess(taskId);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to check task access",
      );
    }
  },
);

// ============================================================
// Reminder Thunks
// ============================================================
export const fetchReminders = createAsyncThunk(
  "task/fetchReminders",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.getReminders(taskId);
      const data = unwrap(res);
      return { taskId, reminders: data.data ?? data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch reminders",
      );
    }
  },
);

export const createReminder = createAsyncThunk(
  "task/createReminder",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.createReminder(taskId, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to create reminder",
      );
    }
  },
);

export const deleteReminder = createAsyncThunk(
  "task/deleteReminder",
  async ({ taskId, reminderId }, { rejectWithValue }) => {
    try {
      await taskApi.deleteReminder(taskId, reminderId);
      return { taskId, reminderId };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to delete reminder",
      );
    }
  },
);

// ============================================================
// Dependency Thunks
// ============================================================
export const fetchDependencies = createAsyncThunk(
  "task/fetchDependencies",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.getDependencies(taskId);
      const data = unwrap(res);
      return { taskId, dependencies: data.data ?? data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch dependencies",
      );
    }
  },
);

export const addDependency = createAsyncThunk(
  "task/addDependency",
  async ({ taskId, dependentTaskId }, { rejectWithValue }) => {
    try {
      const res = await taskApi.addDependency(taskId, dependentTaskId);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to add dependency",
      );
    }
  },
);

export const removeDependency = createAsyncThunk(
  "task/removeDependency",
  async ({ taskId, dependencyId }, { rejectWithValue }) => {
    try {
      await taskApi.removeDependency(taskId, dependencyId);
      return { taskId, dependencyId };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to remove dependency",
      );
    }
  },
);

export const fetchAvailableDependencies = createAsyncThunk(
  "task/fetchAvailableDependencies",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.getAvailableDependencies(taskId);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch available dependencies",
      );
    }
  },
);

// ============================================================
// Enhanced Update Thunk
// ============================================================
export const updateTaskEnhanced = createAsyncThunk(
  "task/updateTaskEnhanced",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.updateTaskEnhanced(taskId, data);
      return unwrap(res);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to update task",
      );
    }
  },
);

// ============================================================
// Slice
// ============================================================
const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setTaskFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearTaskFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedTask: (state, action) => {
      state.selectedTaskId = action.payload;
    },
    clearSelectedTask: (state) => {
      state.selectedTaskId = null;
    },
    clearTaskError: (state) => {
      state.error = null;
    },
    updateTaskOptimistic: taskAdapter.updateOne,
  },
  extraReducers: (builder) => {
    builder
      // ── fetchTasks ──────────────────────────────────────────
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        taskAdapter.setAll(state, action.payload || []);
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 20,
          total: action.payload.results || 0,
          pages: 1,
        };
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── fetchTask ───────────────────────────────────────────
      .addCase(fetchTask.pending, (state) => {
        state.selectedTaskLoading = true;
        state.error = null;
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.selectedTaskLoading = false;
        taskAdapter.upsertOne(state, action.payload.data);
        state.selectedTaskId = action.payload.data._id;
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.selectedTaskLoading = false;
        state.error = action.payload;
      })

      // ── createTask ──────────────────────────────────────────
      .addCase(createTask.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        const taskData = action.payload.data || action.payload;
        taskAdapter.addOne(state, taskData);
        state.pagination.total += 1;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── updateTask ──────────────────────────────────────────
      .addCase(updateTask.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        const taskData = action.payload.data || action.payload;
        taskAdapter.updateOne(state, {
          id: taskData._id,
          changes: taskData,
        });
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── deleteTask ──────────────────────────────────────────
      .addCase(deleteTask.fulfilled, (state, action) => {
        taskAdapter.removeOne(state, action.payload.taskId);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })

      // ── fetchMyTasks ────────────────────────────────────────
      .addCase(fetchMyTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.myTasks = action.payload.data || [];
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── fetchOverdueTasks ───────────────────────────────────
      .addCase(fetchOverdueTasks.fulfilled, (state, action) => {
        state.overdueTasks = action.payload.data || [];
      })

      // ── fetchPendingReviewTasks ─────────────────────────────
      .addCase(fetchPendingReviewTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingReviewTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingReviewTasks = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchPendingReviewTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── assignees ───────────────────────────────────────────
      .addCase(addTaskAssignee.fulfilled, (state, action) => {
        const taskData = action.payload.data || action.payload;
        taskAdapter.updateOne(state, {
          id: taskData._id,
          changes: taskData,
        });
      })
      .addCase(removeTaskAssignee.fulfilled, (state, action) => {
        const taskData = action.payload.data || action.payload;
        taskAdapter.updateOne(state, {
          id: taskData._id,
          changes: taskData,
        });
      })

      // ── task responses ──────────────────────────────────────
      .addCase(submitTaskResponse.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(submitTaskResponse.fulfilled, (state, action) => {
        state.actionLoading = false;
        const taskData = action.payload.data || action.payload;
        taskAdapter.updateOne(state, {
          id: taskData._id,
          changes: taskData,
        });
      })
      .addCase(submitTaskResponse.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ── review workflow ─────────────────────────────────────
      .addCase(submitForReview.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(submitForReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        const taskData = action.payload.data || action.payload;
        taskAdapter.updateOne(state, {
          id: taskData._id,
          changes: taskData,
        });
      })
      .addCase(submitForReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(reviewTaskComplete.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(reviewTaskComplete.fulfilled, (state, action) => {
        state.actionLoading = false;
        const taskData = action.payload.data || action.payload;
        taskAdapter.updateOne(state, {
          id: taskData._id,
          changes: taskData,
        });
        state.pendingReviewTasks = state.pendingReviewTasks.filter(
          (t) => t._id !== taskData._id,
        );
      })
      .addCase(reviewTaskComplete.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(forceCompleteTask.fulfilled, (state, action) => {
        const taskData = action.payload.data || action.payload;
        taskAdapter.updateOne(state, {
          id: taskData._id,
          changes: taskData,
        });
        state.overdueTasks = state.overdueTasks.filter(
          (t) => t._id !== taskData._id,
        );
      })

      // ── history & access ────────────────────────────────────
      .addCase(fetchTaskHistory.fulfilled, (state, action) => {
        state.taskHistory = action.payload || [];
      })
      .addCase(checkTaskAccess.fulfilled, (state, action) => {
        state.taskAccess = action.payload;
      })

      // ── reminders ───────────────────────────────────────────
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.reminders = action.payload.reminders || [];
      })
      .addCase(createReminder.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createReminder.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.data) {
          state.reminders = [...state.reminders, action.payload.data];
        }
      })
      .addCase(createReminder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.reminders = state.reminders.filter(
          (r) => r._id !== action.payload.reminderId,
        );
      })

      // ── dependencies ────────────────────────────────────────
      .addCase(fetchDependencies.fulfilled, (state, action) => {
        state.dependencies = action.payload.dependencies || [];
      })
      .addCase(addDependency.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addDependency.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.data) {
          state.dependencies = action.payload.data;
        }
      })
      .addCase(addDependency.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(removeDependency.fulfilled, (state, action) => {
        state.dependencies = state.dependencies.filter(
          (d) => d._id !== action.payload.dependencyId,
        );
      })
      .addCase(fetchAvailableDependencies.fulfilled, (state, action) => {
        state.availableDependencies = action.payload.data || [];
      })

      // ── enhanced update ─────────────────────────────────────
      .addCase(updateTaskEnhanced.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTaskEnhanced.fulfilled, (state, action) => {
        state.actionLoading = false;
        const taskData = action.payload.data || action.payload;
        taskAdapter.updateOne(state, {
          id: taskData._id,
          changes: taskData,
        });
      })
      .addCase(updateTaskEnhanced.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

// ============================================================
// Actions
// ============================================================
export const {
  setTaskFilters,
  clearTaskFilters,
  setSelectedTask,
  clearSelectedTask,
  clearTaskError,
  updateTaskOptimistic,
} = taskSlice.actions;

// ============================================================
// Selectors
// ============================================================
export const {
  selectAll: selectAllTasks,
  selectById: selectTaskById,
  selectIds: selectTaskIds,
  selectEntities: selectTaskEntities,
  selectTotal: selectTotalTasks,
} = taskAdapter.getSelectors((state) => state.task);

export const selectTasks = (state) => selectAllTasks(state);
export const selectSelectedTaskId = (state) => state.task.selectedTaskId;
export const selectSelectedTask = (state) => {
  const id = state.task.selectedTaskId;
  return id ? selectTaskById(state, id) : null;
};
export const selectTaskPagination = (state) => state.task.pagination;
export const selectTaskFilters = (state) => state.task.filters;
export const selectMyTasks = (state) => state.task.myTasks;
export const selectOverdueTasks = (state) => state.task.overdueTasks;
export const selectPendingReviewTasks = (state) =>
  state.task.pendingReviewTasks;
export const selectTaskHistory = (state) => state.task.taskHistory;
export const selectTaskAccess = (state) => state.task.taskAccess;
export const selectReminders = (state) => state.task.reminders;
export const selectDependencies = (state) => state.task.dependencies;
export const selectAvailableDependencies = (state) =>
  state.task.availableDependencies;
export const selectTaskLoading = (state) => state.task.loading;
export const selectSelectedTaskLoading = (state) =>
  state.task.selectedTaskLoading;
export const selectTaskActionLoading = (state) => state.task.actionLoading;
export const selectTaskError = (state) => state.task.error;

export default taskSlice.reducer;
