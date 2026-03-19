import { describe, it, expect } from "vitest";
import taskReducer, {
  setTaskFilters,
  clearTaskFilters,
  setSelectedTask,
  clearSelectedTask,
  clearTaskError,
  updateTaskOptimistic,
} from "../../redux/features/task/taskSlice";

describe("taskSlice reducers", () => {
  const initialState = {
    ids: [],
    entities: {},
    selectedTaskId: null,
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
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
  };

  describe("setTaskFilters", () => {
    it("should update filters", () => {
      const result = taskReducer(initialState, setTaskFilters({ status: "pending", priority: "high" }));

      expect(result.filters.status).toBe("pending");
      expect(result.filters.priority).toBe("high");
    });

    it("should merge with existing filters", () => {
      const state = {
        ...initialState,
        filters: { status: "completed", priority: "low", category: "litigation", assignedTo: "", matterId: "", matterType: "", litigationDetailId: "", startDate: "", endDate: "" },
      };
      const result = taskReducer(state, setTaskFilters({ status: "active" }));

      expect(result.filters.status).toBe("active");
      expect(result.filters.priority).toBe("low");
      expect(result.filters.category).toBe("litigation");
    });
  });

  describe("clearTaskFilters", () => {
    it("should reset all filters to initial state", () => {
      const state = {
        ...initialState,
        filters: { status: "active", priority: "high", category: "corporate", assignedTo: "user1", matterId: "", matterType: "", litigationDetailId: "", startDate: "", endDate: "" },
      };

      const result = taskReducer(state, clearTaskFilters());
      expect(result.filters).toEqual(initialState.filters);
    });
  });

  describe("setSelectedTask", () => {
    it("should set selected task ID", () => {
      const result = taskReducer(initialState, setSelectedTask("task-123"));
      expect(result.selectedTaskId).toBe("task-123");
    });
  });

  describe("clearSelectedTask", () => {
    it("should clear selected task", () => {
      const state = { ...initialState, selectedTaskId: "task-123" };
      const result = taskReducer(state, clearSelectedTask());
      expect(result.selectedTaskId).toBeNull();
    });
  });

  describe("clearTaskError", () => {
    it("should clear error", () => {
      const state = { ...initialState, error: "Failed to load tasks" };
      const result = taskReducer(state, clearTaskError());
      expect(result.error).toBeNull();
    });
  });

  describe("updateTaskOptimistic", () => {
    it("should update task entity optimistically", () => {
      const state = {
        ...initialState,
        ids: ["task-1"],
        entities: { "task-1": { _id: "task-1", title: "Original Title", status: "pending" } },
      };

      const result = taskReducer(
        state,
        updateTaskOptimistic({ id: "task-1", changes: { title: "Updated Title", status: "completed" } })
      );

      expect(result.entities["task-1"].title).toBe("Updated Title");
      expect(result.entities["task-1"].status).toBe("completed");
    });
  });

  describe("extra reducers - pending states", () => {
    it("should set loading true on fetchTasks.pending", () => {
      const action = { type: "task/fetchTasks/pending" };
      const result = taskReducer(initialState, action);
      expect(result.loading).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should set selectedTaskLoading true on fetchTask.pending", () => {
      const action = { type: "task/fetchTask/pending" };
      const result = taskReducer(initialState, action);
      expect(result.selectedTaskLoading).toBe(true);
    });

    it("should set actionLoading true on createTask.pending", () => {
      const action = { type: "task/createTask/pending" };
      const result = taskReducer(initialState, action);
      expect(result.actionLoading).toBe(true);
    });
  });

  describe("extra reducers - fulfilled states", () => {
    it("should add task on createTask.fulfilled", () => {
      const task = { _id: "task-new", title: "New Task", status: "pending" };
      const action = {
        type: "task/createTask/fulfilled",
        payload: { data: task },
      };
      const result = taskReducer(initialState, action);

      expect(result.actionLoading).toBe(false);
      expect(result.ids).toContain("task-new");
      expect(result.entities["task-new"]).toEqual(task);
      expect(result.pagination.total).toBe(1);
    });

    it("should remove task on deleteTask.fulfilled", () => {
      const state = {
        ...initialState,
        ids: ["task-1", "task-2"],
        entities: {
          "task-1": { _id: "task-1", title: "Task 1" },
          "task-2": { _id: "task-2", title: "Task 2" },
        },
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
      };

      const action = {
        type: "task/deleteTask/fulfilled",
        payload: { taskId: "task-1" },
      };
      const result = taskReducer(state, action);

      expect(result.ids).not.toContain("task-1");
      expect(result.ids).toContain("task-2");
      expect(result.pagination.total).toBe(1);
    });

    it("should set myTasks on fetchMyTasks.fulfilled", () => {
      const tasks = [{ _id: "task-1", title: "My Task" }];
      const action = {
        type: "task/fetchMyTasks/fulfilled",
        payload: { data: tasks },
      };
      const result = taskReducer(initialState, action);
      expect(result.myTasks).toEqual(tasks);
    });

    it("should set overdueTasks on fetchOverdueTasks.fulfilled", () => {
      const tasks = [{ _id: "task-1", overdue: true }];
      const action = {
        type: "task/fetchOverdueTasks/fulfilled",
        payload: { data: tasks },
      };
      const result = taskReducer(initialState, action);
      expect(result.overdueTasks).toEqual(tasks);
    });

    it("should set taskHistory on fetchHistory.fulfilled", () => {
      const history = [{ _id: "h1", action: "created" }];
      const action = {
        type: "task/fetchHistory/fulfilled",
        payload: history,
      };
      const result = taskReducer(initialState, action);
      expect(result.taskHistory).toEqual(history);
    });

    it("should set taskAccess on checkAccess.fulfilled", () => {
      const access = { canEdit: true, canDelete: false };
      const action = {
        type: "task/checkAccess/fulfilled",
        payload: access,
      };
      const result = taskReducer(initialState, action);
      expect(result.taskAccess).toEqual(access);
    });

    it("should add reminder on createReminder.fulfilled", () => {
      const state = { ...initialState, reminders: [] };
      const reminder = { _id: "rem-1", message: "Deadline approaching" };
      const action = {
        type: "task/createReminder/fulfilled",
        payload: { data: reminder },
      };
      const result = taskReducer(state, action);
      expect(result.reminders).toHaveLength(1);
      expect(result.reminders[0]).toEqual(reminder);
    });

    it("should remove reminder on deleteReminder.fulfilled", () => {
      const state = {
        ...initialState,
        reminders: [{ _id: "rem-1" }, { _id: "rem-2" }],
      };
      const action = {
        type: "task/deleteReminder/fulfilled",
        payload: { reminderId: "rem-1" },
      };
      const result = taskReducer(state, action);
      expect(result.reminders).toHaveLength(1);
      expect(result.reminders[0]._id).toBe("rem-2");
    });

    it("should set dependencies on fetchDependencies.fulfilled", () => {
      const deps = [{ _id: "dep-1", type: "blocks" }];
      const action = {
        type: "task/fetchDependencies/fulfilled",
        payload: { dependencies: deps },
      };
      const result = taskReducer(initialState, action);
      expect(result.dependencies).toEqual(deps);
    });

    it("should set availableDependencies on fetchAvailableDependencies.fulfilled", () => {
      const deps = [{ _id: "task-5", title: "Available Task" }];
      const action = {
        type: "task/fetchAvailableDependencies/fulfilled",
        payload: { data: deps },
      };
      const result = taskReducer(initialState, action);
      expect(result.availableDependencies).toEqual(deps);
    });
  });

  describe("extra reducers - rejected states", () => {
    it("should set error on fetchTasks.rejected", () => {
      const action = { type: "task/fetchTasks/rejected", payload: "Failed to fetch" };
      const result = taskReducer(initialState, action);
      expect(result.loading).toBe(false);
      expect(result.error).toBe("Failed to fetch");
    });

    it("should set error on createTask.rejected", () => {
      const action = { type: "task/createTask/rejected", payload: "Validation failed" };
      const result = taskReducer(initialState, action);
      expect(result.actionLoading).toBe(false);
      expect(result.error).toBe("Validation failed");
    });
  });
});
