import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown, Button, Space, Modal } from "antd";
import {
  MoreOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import {
  submitForReview,
  forceCompleteTask,
  deleteTask,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";
import { selectUser } from "../redux/features/auth/authSlice";
import TaskReviewModal from "./TaskReviewModal";

const TaskActions = ({ task, onTaskUpdate, showDelete = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectTaskActionLoading);
  const user = useSelector(selectUser);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const userId = user?._id || user?.data?._id;

  const isAssignee = task?.assignees?.some(
    (assignee) => (assignee.user?._id || assignee.user) === userId,
  );

  const isTaskGiver = task?.createdBy?._id === userId;

  const handleSubmitForReview = useCallback(async () => {
    Modal.confirm({
      title: "Submit for Review",
      content: "Are you ready to submit this task for review?",
      okText: "Submit",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await dispatch(
            submitForReview({
              taskId: task._id,
              data: { comment: "Submitted for review" },
            }),
          ).unwrap();
          onTaskUpdate?.();
        } catch (error) {
          // Error handled by slice
        }
      },
    });
  }, [dispatch, task._id, onTaskUpdate]);

  const handleDeleteTask = useCallback(() => {
    Modal.confirm({
      title: "Delete Task",
      content:
        "Are you sure you want to delete this task? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await dispatch(deleteTask(task._id)).unwrap();
          onTaskUpdate?.();
          navigate("/dashboard/tasks");
        } catch (error) {
          // Error handled by slice
        }
      },
    });
  }, [dispatch, task._id, onTaskUpdate, navigate]);

  const handleForceComplete = useCallback(async () => {
    Modal.confirm({
      title: "Mark as Complete",
      content: "Mark this task as completed without review?",
      okText: "Mark Complete",
      onOk: async () => {
        try {
          await dispatch(
            forceCompleteTask({
              taskId: task._id,
              data: { completionComment: "Task force completed" },
            }),
          ).unwrap();
          onTaskUpdate?.();
        } catch (error) {
          // Error handled by slice
        }
      },
    });
  }, [dispatch, task._id, onTaskUpdate]);

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
  ]);

  return (
    <>
      <Space size="small">
        {isAssignee &&
          (task.status === "in-progress" || task.status === "rejected") && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={handleSubmitForReview}
              loading={loading}>
              Submit for Review
            </Button>
          )}

        {isTaskGiver && task.status === "under-review" && (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => setReviewModalOpen(true)}
            className="!bg-green-600 hover:!bg-green-700 !border-green-600">
            Review Task
          </Button>
        )}

        <Dropdown
          menu={{ items: getMenuItems() }}
          trigger={["click"]}
          placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      </Space>

      <TaskReviewModal
        task={task}
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          onTaskUpdate?.();
        }}
        currentUserId={userId}
      />
    </>
  );
};

export default TaskActions;
