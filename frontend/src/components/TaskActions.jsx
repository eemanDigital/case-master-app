import React, { useState } from "react";
import PropTypes from "prop-types";
import { Dropdown, Button, Space, Modal, Menu } from "antd";
import {
  MoreOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  // SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { toast } from "react-toastify";
import TaskReviewModal from "./TaskReviewModal";

const TaskActions = ({ task, userId, onTaskUpdate, showDelete = true }) => {
  const navigate = useNavigate();
  const { dataFetcher } = useDataFetch();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const isAssignee = task.assignees?.some(
    (assignee) => assignee.user?._id === userId || assignee.user === userId
  );

  const isTaskGiver = task.createdBy?._id === userId;
  const isAdmin = false; // You can get this from your user context

  const handleSubmitForReview = async () => {
    Modal.confirm({
      title: "Submit for Review",
      content: "Are you ready to submit this task for review?",
      okText: "Submit",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await dataFetcher(
            `tasks/${task._id}/submit-review`,
            "PUT",
            {
              comment: "Submitted for review",
            }
          );

          if (response.error) throw new Error(response.error);

          toast.success("Task submitted for review!");

          if (onTaskUpdate) {
            onTaskUpdate();
          }
        } catch (error) {
          toast.error(error.message || "Failed to submit for review");
        }
      },
    });
  };

  const handleDeleteTask = () => {
    Modal.confirm({
      title: "Delete Task",
      content: "Are you sure you want to delete this task?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await dataFetcher(`tasks/${task._id}`, "DELETE");

          if (response.error) throw new Error(response.error);

          toast.success("Task deleted successfully!");

          if (onTaskUpdate) {
            onTaskUpdate();
          }
        } catch (error) {
          toast.error(error.message || "Failed to delete task");
        }
      },
    });
  };

  const getMenuItems = () => {
    const items = [
      {
        key: "view",
        icon: <EyeOutlined />,
        label: "View Details",
        onClick: () => navigate(`/dashboard/tasks/${task._id}/details`),
      },
    ];

    // Actions for assignee
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

    // Actions for task giver
    if (isTaskGiver) {
      if (task.status === "under-review") {
        items.push({
          key: "review",
          icon: <CheckCircleOutlined />,
          label: "Review Task",
          onClick: () => setReviewModalVisible(true),
        });
      }

      if (task.status !== "completed" && task.status !== "under-review") {
        items.push({
          key: "force-complete",
          icon: <CheckCircleOutlined />,
          label: "Mark as Complete",
          onClick: async () => {
            Modal.confirm({
              title: "Mark as Complete",
              content: "Mark this task as completed without review?",
              okText: "Mark Complete",
              onOk: async () => {
                try {
                  await dataFetcher(
                    `tasks/${task._id}/force-complete`,
                    "POST",
                    {
                      completionComment: "Task force completed",
                    }
                  );
                  toast.success("Task marked as completed!");
                  onTaskUpdate && onTaskUpdate();
                } catch (error) {
                  toast.error("Failed to mark as complete");
                }
              },
            });
          },
        });
      }

      items.push({
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit Task",
        onClick: () => navigate(`/dashboard/tasks/${task._id}/update`),
      });
    }

    // Admin/Task Giver delete action
    if ((isTaskGiver || isAdmin) && showDelete) {
      items.push({
        type: "divider",
      });
      items.push({
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete Task",
        danger: true,
        onClick: handleDeleteTask,
      });
    }

    return items;
  };

  return (
    <>
      <Space size="small">
        {isAssignee &&
          (task.status === "in-progress" || task.status === "rejected") && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={handleSubmitForReview}>
              Submit for Review
            </Button>
          )}

        {isTaskGiver && task.status === "under-review" && (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => setReviewModalVisible(true)}
            className="bg-green-600 hover:bg-green-700 border-green-600">
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

      {/* Review Modal */}
      {reviewModalVisible && (
        <TaskReviewModal
          task={task}
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          onReviewComplete={() => {
            if (onTaskUpdate) onTaskUpdate();
            setReviewModalVisible(false);
          }}
          currentUserId={userId}
        />
      )}
    </>
  );
};

TaskActions.propTypes = {
  task: PropTypes.object.isRequired,
  userId: PropTypes.string.isRequired,
  onTaskUpdate: PropTypes.func,
  showDelete: PropTypes.bool,
};

TaskActions.defaultProps = {
  showDelete: true,
};

export default TaskActions;
