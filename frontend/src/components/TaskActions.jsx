// TaskActions.jsx
import React, { useCallback, useState, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown, Button, Space, Modal, Tooltip } from "antd";
import {
  MoreOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  submitForReview,
  forceCompleteTask,
  deleteTask,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";
import { selectUser } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";

const TaskReviewModal = lazy(() => import("./TaskReviewModal"));

const TaskActions = ({ task, onTaskUpdate, showDelete = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectTaskActionLoading);
  const user = useSelector(selectUser);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const userId = user?._id || user?.data?._id;

  const isAssignee = task?.assignees?.some(
    (assignee) => (assignee.user?._id || assignee.user) === userId,
  );

  const isTaskGiver =
    task?.createdBy?._id === userId || task?.createdBy === userId;

  const handleSubmitForReview = useCallback(async () => {
    Modal.confirm({
      title: "Submit for Review",
      icon: <SendOutlined className="text-blue-500" />,
      content: (
        <div>
          <p>Are you ready to submit this task for review?</p>
          <p className="text-sm text-gray-500 mt-2">
            The task will be locked and sent to the reviewer for approval.
          </p>
        </div>
      ),
      okText: "Submit",
      cancelText: "Cancel",
      okButtonProps: { loading: actionInProgress },
      onOk: async () => {
        setActionInProgress(true);
        try {
          await dispatch(
            submitForReview({
              taskId: task._id,
              data: { comment: "Task submitted for review" },
            }),
          ).unwrap();
          toast.success("Task submitted for review successfully");
          onTaskUpdate?.();
        } catch (error) {
          toast.error(error || "Failed to submit for review");
        } finally {
          setActionInProgress(false);
        }
      },
    });
  }, [dispatch, task._id, onTaskUpdate, actionInProgress]);

  const handleDeleteTask = useCallback(() => {
    Modal.confirm({
      title: "Delete Task",
      icon: <DeleteOutlined className="text-red-500" />,
      content: (
        <div>
          <p>Are you sure you want to delete this task?</p>
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-red-500 mt-2">
            This action cannot be undone. All associated data will be
            permanently removed.
          </p>
        </div>
      ),
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      okButtonProps: { loading: actionInProgress },
      onOk: async () => {
        setActionInProgress(true);
        try {
          await dispatch(deleteTask(task._id)).unwrap();
          toast.success("Task deleted successfully");
          onTaskUpdate?.();
          navigate("/dashboard/tasks");
        } catch (error) {
          toast.error(error || "Failed to delete task");
        } finally {
          setActionInProgress(false);
        }
      },
    });
  }, [
    dispatch,
    task._id,
    task.title,
    onTaskUpdate,
    navigate,
    actionInProgress,
  ]);

  const handleForceComplete = useCallback(async () => {
    Modal.confirm({
      title: "Mark as Complete",
      icon: <CheckCircleOutlined className="text-green-500" />,
      content: (
        <div>
          <p>Mark this task as completed without review?</p>
          <p className="text-sm text-gray-500 mt-2">
            This will bypass the review process and mark the task as complete.
          </p>
        </div>
      ),
      okText: "Mark Complete",
      cancelText: "Cancel",
      okButtonProps: { loading: actionInProgress },
      onOk: async () => {
        setActionInProgress(true);
        try {
          await dispatch(
            forceCompleteTask({
              taskId: task._id,
              data: { completionComment: "Task force completed by manager" },
            }),
          ).unwrap();
          toast.success("Task marked as completed");
          onTaskUpdate?.();
        } catch (error) {
          toast.error(error || "Failed to mark task as complete");
        } finally {
          setActionInProgress(false);
        }
      },
    });
  }, [dispatch, task._id, onTaskUpdate, actionInProgress]);

  const getMenuItems = useCallback(() => {
    const items = [
      {
        key: "view",
        icon: <EyeOutlined />,
        label: "View Details",
        onClick: () => navigate(`/dashboard/tasks/${task._id}`),
      },
    ];

    if (isAssignee) {
      if (task.status === "in-progress" || task.status === "rejected") {
        items.push({
          key: "submit-review",
          icon: <SendOutlined />,
          label: "Submit for Review",
          onClick: handleSubmitForReview,
          disabled: actionInProgress,
        });
      }

      items.push({
        key: "response",
        icon: <FileTextOutlined />,
        label: "Submit Response",
        onClick: () => navigate(`/dashboard/tasks/${task._id}/response`),
      });
    }

    if (isTaskGiver) {
      if (task.status === "under-review") {
        items.push({
          key: "review",
          icon: <CheckCircleOutlined />,
          label: "Review Task",
          onClick: () => setReviewModalOpen(true),
        });
      }

      if (task.status !== "completed" && task.status !== "under-review") {
        items.push({
          key: "force-complete",
          icon: <CheckCircleOutlined />,
          label: "Mark as Complete",
          onClick: handleForceComplete,
          disabled: actionInProgress,
        });
      }

      items.push({
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit Task",
        onClick: () => navigate(`/dashboard/tasks/${task._id}/edit`),
      });
    }

    if ((isTaskGiver || user?.role === "admin") && showDelete) {
      items.push({ type: "divider" });
      items.push({
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete Task",
        danger: true,
        onClick: handleDeleteTask,
        disabled: actionInProgress,
      });
    }

    return items;
  }, [
    task,
    isAssignee,
    isTaskGiver,
    user?.role,
    showDelete,
    navigate,
    handleSubmitForReview,
    handleForceComplete,
    handleDeleteTask,
    actionInProgress,
  ]);

  return (
    <>
      <Space size="small" className="task-actions">
        {isAssignee &&
          (task.status === "in-progress" || task.status === "rejected") && (
            <Tooltip title="Submit for Review">
              <Button
                type="primary"
                size="small"
                icon={actionInProgress ? <LoadingOutlined /> : <SendOutlined />}
                onClick={handleSubmitForReview}
                loading={actionInProgress}
                className="bg-blue-500 hover:bg-blue-600 border-blue-500">
                {!window.innerWidth < 768 && "Submit"}
              </Button>
            </Tooltip>
          )}

        {isTaskGiver && task.status === "under-review" && (
          <Tooltip title="Review Task">
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => setReviewModalOpen(true)}
              className="!bg-green-600 hover:!bg-green-700 !border-green-600">
              {!window.innerWidth < 768 && "Review"}
            </Button>
          </Tooltip>
        )}

        <Dropdown
          menu={{ items: getMenuItems() }}
          trigger={["click"]}
          placement="bottomRight"
          disabled={actionInProgress}>
          <Button
            type="text"
            icon={actionInProgress ? <LoadingOutlined /> : <MoreOutlined />}
            size="small"
          />
        </Dropdown>
      </Space>

      {reviewModalOpen && (
        <Suspense fallback={null}>
          <TaskReviewModal
            task={task}
            open={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              onTaskUpdate?.();
            }}
            currentUserId={userId}
          />
        </Suspense>
      )}
    </>
  );
};

export default TaskActions;
