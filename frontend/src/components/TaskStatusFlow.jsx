import React from "react";
import PropTypes from "prop-types";
import { Steps, Tag, Badge, Tooltip, Space } from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { toast } from "react-toastify";

const { Step } = Steps;

const TaskStatusFlow = ({ task, userId, onStatusChange }) => {
  const { dataFetcher, loading } = useDataFetch();

  const getCurrentStep = () => {
    switch (task.status) {
      case "pending":
        return 0;
      case "in-progress":
        return 1;
      case "under-review":
        return 2;
      case "completed":
        return 3;
      case "rejected":
        return 1; // Rejected goes back to in-progress step
      default:
        return 0;
    }
  };

  const handleSubmitForReview = async () => {
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

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit for review");
    }
  };

  const handleForceComplete = async () => {
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

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast.error(error.message || "Failed to mark as complete");
    }
  };

  const isAssignee = task.assignees?.some(
    (assignee) => assignee.user?._id === userId || assignee.user === userId
  );

  const isTaskGiver = task.createdBy?._id === userId;

  return (
    <div className="task-status-flow">
      <Steps current={getCurrentStep()} size="small">
        <Step
          title="Pending"
          icon={<ClockCircleOutlined />}
          description={
            isAssignee && task.status === "pending" ? (
              <Tooltip title="Mark as In Progress">
                <Tag
                  color="orange"
                  className="cursor-pointer hover:opacity-80"
                  onClick={async () => {
                    try {
                      await dataFetcher(`tasks/${task._id}`, "PATCH", {
                        status: "in-progress",
                      });
                      toast.success("Task started!");
                      onStatusChange && onStatusChange();
                    } catch (error) {
                      toast.error("Failed to start task");
                    }
                  }}>
                  Start Task
                </Tag>
              </Tooltip>
            ) : (
              <Badge
                status={task.status === "pending" ? "processing" : "default"}
                text="Pending Start"
              />
            )
          }
        />

        <Step
          title="In Progress"
          icon={<PlayCircleOutlined />}
          description={
            <Space direction="vertical" size="small">
              {isAssignee &&
                (task.status === "in-progress" ||
                  task.status === "rejected") && (
                  <Tooltip title="Submit for Review">
                    <Tag
                      color="blue"
                      className="cursor-pointer hover:opacity-80"
                      onClick={handleSubmitForReview}>
                      Submit for Review
                    </Tag>
                  </Tooltip>
                )}
              {isTaskGiver && task.status === "in-progress" && (
                <Tooltip title="Force Mark as Complete">
                  <Tag
                    color="green"
                    className="cursor-pointer hover:opacity-80"
                    onClick={handleForceComplete}>
                    Mark Complete
                  </Tag>
                </Tooltip>
              )}
            </Space>
          }
        />

        <Step
          title="Under Review"
          icon={<EyeOutlined />}
          description={
            isTaskGiver ? (
              <Space size="small">
                <Tooltip title="Task awaiting your review">
                  <Badge status="processing" text="Awaiting Review" />
                </Tooltip>
              </Space>
            ) : (
              <Badge status="processing" text="Awaiting Review" />
            )
          }
        />

        <Step
          title="Completed"
          icon={<CheckCircleOutlined />}
          description={
            task.status === "completed" ? (
              <div className="flex items-center gap-2">
                <Tag color="green">Completed</Tag>
                {task.completedAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(task.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <Badge status="default" text="Not Completed" />
            )
          }
        />
      </Steps>
    </div>
  );
};

TaskStatusFlow.propTypes = {
  task: PropTypes.object.isRequired,
  userId: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func,
};

export default TaskStatusFlow;
