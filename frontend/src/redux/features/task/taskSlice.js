import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";

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
  loading: false,
  selectedTaskLoading: false,
  actionLoading: false,
  error: null,
});

export const fetchTasks = createAsyncThunk(
  "task/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/tasks${params ? `?${new URLSearchParams(params)}` : ""}`,
      );
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch tasks");
    }
  },
);

export const fetchTask = createAsyncThunk(
  "task/fetchTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch task");
    }
  },
);

export const createTask = createAsyncThunk(
  "task/createTask",
  async (data, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create task");
    }
  },
);

export const updateTask = createAsyncThunk(
  "task/updateTask",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update task");
    }
  },
);

export const deleteTask = createAsyncThunk(
  "task/deleteTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return { taskId, ...result };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete task");
    }
  },
);

export const fetchMyTasks = createAsyncThunk(
  "task/fetchMyTasks",
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/tasks/my-tasks${params ? `?${new URLSearchParams(params)}` : ""}`,
      );
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch my tasks");
    }
  },
);

export const fetchOverdueTasks = createAsyncThunk(
  "task/fetchOverdueTasks",
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/tasks/overdue${params ? `?${new URLSearchParams(params)}` : ""}`,
      );
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch overdue tasks");
    }
  },
);

export const fetchPendingReviewTasks = createAsyncThunk(
  "task/fetchPendingReviewTasks",
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/tasks/pending-review${params ? `?${new URLSearchParams(params)}` : ""}`,
      );
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch pending review tasks",
      );
    }
  },
);

export const addTaskAssignee = createAsyncThunk(
  "task/addAssignee",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add assignee");
    }
  },
);

export const removeTaskAssignee = createAsyncThunk(
  "task/removeAssignee",
  async ({ taskId, userId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assignees/${userId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return { taskId, userId, ...result };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to remove assignee");
    }
  },
);

export const submitTaskResponse = createAsyncThunk(
  "task/submitResponse",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to submit response");
    }
  },
);

export const deleteTaskResponse = createAsyncThunk(
  "task/deleteResponse",
  async ({ taskId, responseId }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/tasks/${taskId}/responses/${responseId}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (!response.ok) throw result;
      return { taskId, responseId, ...result };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete response");
    }
  },
);

export const reviewTaskResponse = createAsyncThunk(
  "task/reviewResponse",
  async ({ taskId, responseIndex, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/tasks/${taskId}/responses/${responseIndex}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to review response");
    }
  },
);

export const submitForReview = createAsyncThunk(
  "task/submitForReview",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/submit-review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to submit for review");
    }
  },
);

export const reviewTaskComplete = createAsyncThunk(
  "task/reviewComplete",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to review task");
    }
  },
);

export const forceCompleteTask = createAsyncThunk(
  "task/forceComplete",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/force-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to force complete task");
    }
  },
);

export const fetchTaskDocuments = createAsyncThunk(
  "task/fetchDocuments",
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/documents`);
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch documents");
    }
  },
);

export const uploadTaskReferenceDocs = createAsyncThunk(
  "task/uploadReferenceDocs",
  async ({ taskId, formData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/reference-documents`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload documents");
    }
  },
);

export const uploadTaskResponseDocs = createAsyncThunk(
  "task/uploadResponseDocs",
  async ({ taskId, formData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/response-documents`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload documents");
    }
  },
);

export const fetchTaskHistory = createAsyncThunk(
  "task/fetchHistory",
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/history`);
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch task history");
    }
  },
);

export const checkTaskAccess = createAsyncThunk(
  "task/checkAccess",
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/access`);
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to check access");
    }
  },
);

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
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        taskAdapter.setAll(state, action.payload.data || []);
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

      .addCase(createTask.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        taskAdapter.addOne(state, action.payload.data);
        state.pagination.total += 1;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(updateTask.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        taskAdapter.updateOne(state, {
          id: action.payload.data._id,
          changes: action.payload.data,
        });
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteTask.fulfilled, (state, action) => {
        taskAdapter.removeOne(state, action.payload.taskId);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })

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

      .addCase(fetchOverdueTasks.fulfilled, (state, action) => {
        state.overdueTasks = action.payload.data || [];
      })

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

      .addCase(addTaskAssignee.fulfilled, (state, action) => {
        taskAdapter.updateOne(state, {
          id: action.payload.data._id,
          changes: action.payload.data,
        });
      })

      .addCase(removeTaskAssignee.fulfilled, (state, action) => {
        taskAdapter.updateOne(state, {
          id: action.payload.data._id,
          changes: action.payload.data,
        });
      })

      .addCase(submitTaskResponse.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(submitTaskResponse.fulfilled, (state, action) => {
        state.actionLoading = false;
        taskAdapter.updateOne(state, {
          id: action.payload.data._id,
          changes: action.payload.data,
        });
      })
      .addCase(submitTaskResponse.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(submitForReview.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(submitForReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        taskAdapter.updateOne(state, {
          id: action.payload.data._id,
          changes: action.payload.data,
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
        taskAdapter.updateOne(state, {
          id: action.payload.data._id,
          changes: action.payload.data,
        });
        state.pendingReviewTasks = state.pendingReviewTasks.filter(
          (t) => t._id !== action.payload.data._id,
        );
      })
      .addCase(reviewTaskComplete.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(forceCompleteTask.fulfilled, (state, action) => {
        taskAdapter.updateOne(state, {
          id: action.payload.data._id,
          changes: action.payload.data,
        });
        state.overdueTasks = state.overdueTasks.filter(
          (t) => t._id !== action.payload.data._id,
        );
      })

      .addCase(fetchTaskHistory.fulfilled, (state, action) => {
        state.taskHistory = action.payload.data || [];
      })

      .addCase(checkTaskAccess.fulfilled, (state, action) => {
        state.taskAccess = action.payload.data;
      });
  },
});

export const {
  setTaskFilters,
  clearTaskFilters,
  setSelectedTask,
  clearSelectedTask,
  clearTaskError,
  updateTaskOptimistic,
} = taskSlice.actions;

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
export const selectTaskLoading = (state) => state.task.loading;
export const selectSelectedTaskLoading = (state) =>
  state.task.selectedTaskLoading;
export const selectTaskActionLoading = (state) => state.task.actionLoading;
export const selectTaskError = (state) => state.task.error;

export default taskSlice.reducer;
