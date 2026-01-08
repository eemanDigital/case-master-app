import React, { useState } from "react";
import { Button, Space, Modal, Tooltip, Dropdown } from "antd";
import {
  SendOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import TaskReviewModal from "../TaskReviewModal";
import { useDataFetch } from "../../hooks/useDataFetch";

const TaskReviewActions = ({
  task,
  userId,
  onStatusChange,
  onReviewComplete,
  screens,
}) => {
  const navigate = useNavigate();
  const { dataFetcher } = useDataFetch();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const isCreator = task?.createdBy?._id === userId;
  const isAssignedBy = task?.assignees?.some(
    (assignee) => assignee.assignedBy?._id === userId
  );
  const isAssignee = task?.assignees?.some(
    (assignee) => assignee.user?._id === userId
  );

  // Check permissions
  const canReviewTask =
    (isCreator || isAssignedBy) && task?.status === "under-review";
  const canSubmitForReview =
    isAssignee &&
    (task?.status === "in-progress" || task?.status === "rejected");
  const canEditTask = isCreator || isAssignedBy;
  const canForceComplete =
    (isCreator || isAssignedBy) && task?.status !== "completed";

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
          onStatusChange && onStatusChange();
        } catch (error) {
          toast.error(error.message || "Failed to submit for review");
        }
      },
    });
  };

  const handleForceComplete = async () => {
    Modal.confirm({
      title: "Mark as Complete",
      content: "Mark this task as completed without review?",
      okText: "Mark Complete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await dataFetcher(
            `tasks/${task._id}/force-complete`,
            "POST",
            {
              completionComment: "Task force completed",
            }
          );

          if (response.error) throw new Error(response.error);

          toast.success("Task marked as completed!");
          onStatusChange && onStatusChange();
        } catch (error) {
          toast.error("Failed to mark as complete");
        }
      },
    });
  };

  const getActionMenu = () => {
    const items = [
      {
        key: "view",
        icon: <EyeOutlined />,
        label: "View Details",
        onClick: () => navigate(`/dashboard/tasks/${task._id}/details`),
      },
    ];

    if (canSubmitForReview) {
      items.push({
        key: "submit-review",
        icon: <SendOutlined />,
        label: "Submit for Review",
        onClick: handleSubmitForReview,
      });
    }

    if (canReviewTask) {
      items.push({
        key: "review",
        icon: <FileSearchOutlined />,
        label: "Review Task",
        onClick: () => setReviewModalVisible(true),
      });
    }

    items.push({
      key: "status",
      icon: <SyncOutlined />,
      label: "Update Status",
      children: [
        {
          key: "status-pending",
          label: "Mark as Pending",
          disabled: task?.status === "pending",
          onClick: () => onStatusChange(task._id, "pending"),
        },
        {
          key: "status-in-progress",
          label: "Mark as In Progress",
          disabled: task?.status === "in-progress",
          onClick: () => onStatusChange(task._id, "in-progress"),
        },
        {
          key: "status-completed",
          label: "Mark as Completed",
          disabled: task?.status === "completed",
          onClick: () => onStatusChange(task._id, "completed"),
        },
      ],
    });

    if (canEditTask) {
      items.push({
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit Task",
        onClick: () => navigate(`/dashboard/tasks/${task._id}/update`),
      });
    }

    if (canForceComplete) {
      items.push({
        key: "force-complete",
        icon: <CheckCircleOutlined />,
        label: "Force Complete",
        onClick: handleForceComplete,
      });
    }

    return items;
  };

  return (
    <>
      <Space
        direction={screens.xs ? "vertical" : "horizontal"}
        size="small"
        className="w-full">
        {/* Submit for Review Button */}
        {canSubmitForReview && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitForReview}
            size={screens.xs ? "small" : "middle"}
            className="bg-blue-600 hover:bg-blue-700">
            {screens.xs ? "Submit" : "Submit for Review"}
          </Button>
        )}

        {/* Review Task Button */}
        {canReviewTask && (
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={() => setReviewModalVisible(true)}
            size={screens.xs ? "small" : "middle"}
            className="bg-orange-600 hover:bg-orange-700 border-orange-600">
            {screens.xs ? "Review" : "Review Task"}
          </Button>
        )}

        {/* Force Complete Button */}
        {canForceComplete && (
          <Button
            type="default"
            icon={<CheckCircleOutlined />}
            onClick={handleForceComplete}
            size={screens.xs ? "small" : "middle"}
            className="border-green-500 text-green-600 hover:border-green-600 hover:text-green-700">
            {screens.xs ? "Complete" : "Force Complete"}
          </Button>
        )}

        {/* More Actions Dropdown */}
        <Dropdown
          menu={{ items: getActionMenu() }}
          trigger={["click"]}
          placement="bottomRight">
          <Button
            type="text"
            icon={<MoreOutlined />}
            size={screens.xs ? "small" : "middle"}
          />
        </Dropdown>
      </Space>

      {/* Review Modal */}
      {reviewModalVisible && (
        <TaskReviewModal
          task={task}
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          onReviewComplete={() => {
            onReviewComplete && onReviewComplete();
            setReviewModalVisible(false);
          }}
          currentUserId={userId}
        />
      )}
    </>
  );
};

export default TaskReviewActions;
