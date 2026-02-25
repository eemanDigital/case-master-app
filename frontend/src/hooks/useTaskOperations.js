// hooks/useTaskOperations.js
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTasks,
  deleteTask,
  submitForReview,
  forceCompleteTask,
  selectTasks,
  selectTaskLoading,
  selectTaskActionLoading,
  selectTaskError,
  selectTaskPagination,
} from "../redux/features/task/taskSlice";
import { toast } from "react-toastify";

export const useTaskOperations = () => {
  const dispatch = useDispatch();

  const tasks = useSelector(selectTasks);
  const loading = useSelector(selectTaskLoading);
  const actionLoading = useSelector(selectTaskActionLoading);
  const error = useSelector(selectTaskError);
  const pagination = useSelector(selectTaskPagination);

  const loadTasks = useCallback(
    async (params = {}) => {
      try {
        await dispatch(fetchTasks(params)).unwrap();
      } catch (error) {
        toast.error(error || "Failed to load tasks");
      }
    },
    [dispatch],
  );

  const handleDeleteTask = useCallback(
    async (taskId) => {
      try {
        await dispatch(deleteTask(taskId)).unwrap();
        toast.success("Task deleted successfully");
        return true;
      } catch (error) {
        toast.error(error || "Failed to delete task");
        return false;
      }
    },
    [dispatch],
  );

  const handleSubmitForReview = useCallback(
    async (taskId, comment = "Submitted for review") => {
      try {
        await dispatch(submitForReview({ taskId, data: { comment } })).unwrap();
        toast.success("Task submitted for review");
        return true;
      } catch (error) {
        toast.error(error || "Failed to submit for review");
        return false;
      }
    },
    [dispatch],
  );

  const handleForceComplete = useCallback(
    async (taskId, comment = "Task force completed") => {
      try {
        await dispatch(
          forceCompleteTask({ taskId, data: { completionComment: comment } }),
        ).unwrap();
        toast.success("Task marked as complete");
        return true;
      } catch (error) {
        toast.error(error || "Failed to mark task as complete");
        return false;
      }
    },
    [dispatch],
  );

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    actionLoading,
    error,
    pagination,
    loadTasks,
    deleteTask: handleDeleteTask,
    submitForReview: handleSubmitForReview,
    forceComplete: handleForceComplete,
  };
};
