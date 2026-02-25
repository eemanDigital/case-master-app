// TaskStatusFlow.jsx
import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import {
  Steps,
  Tag,
  Badge,
  Tooltip,
  Space,
  Button,
  message,
  Popconfirm,
} from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import {
  updateTask,
  submitForReview,
  forceCompleteTask,
} from "../redux/features/task/taskSlice";

const { Step } = Steps;

const TaskStatusFlow = ({ task, userId, onStatusChange, size = "small" }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const getCurrentStep = useCallback(() => {
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
        return 1;
      default:
        return 0;
    }
  }, [task.status]);

  const handleStatusChange = useCallback(
    async (newStatus, comment = "") => {
      setLoading(true);
      try {
        await dispatch(
          updateTask({
            taskId: task._id,
            data: { status: newStatus, statusComment: comment },
          }),
        ).unwrap();
        message.success(`Task status updated to ${newStatus}`);
        onStatusChange?.();
      } catch (error) {
        message.error(error || "Failed to update task status");
      } finally {
        setLoading(false);
      }
    },
    [dispatch, task._id, onStatusChange],
  );

  const handleSubmitForReview = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(
        submitForReview({
          taskId: task._id,
          data: { comment: "Submitted for review" },
        }),
      ).unwrap();
      message.success("Task submitted for review");
      onStatusChange?.();
    } catch (error) {
      message.error(error || "Failed to submit for review");
    } finally {
      setLoading(false);
    }
  }, [dispatch, task._id, onStatusChange]);

  const handleForceComplete = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(
        forceCompleteTask({
          taskId: task._id,
          data: { completionComment: "Task force completed" },
        }),
      ).unwrap();
      message.success("Task marked as completed");
      onStatusChange?.();
    } catch (error) {
      message.error(error || "Failed to mark as complete");
    } finally {
      setLoading(false);
    }
  }, [dispatch, task._id, onStatusChange]);

  const isAssignee = task.assignees?.some(
    (assignee) => (assignee.user?._id || assignee.user) === userId,
  );

  const isTaskGiver =
    task.createdBy?._id === userId || task.createdBy === userId;

  return (
    <div className="task-status-flow w-full">
      <Steps
        current={getCurrentStep()}
        size={size}
        className="mb-4"
        items={[
          {
            title: size === "small" ? null : "Pending",
            icon: <ClockCircleOutlined />,
            description:
              size === "small" ? null : (
                <div className="mt-2">
                  {isAssignee && task.status === "pending" && (
                    <Popconfirm
                      title="Start Task"
                      description="Are you ready to start working on this task?"
                      onConfirm={() =>
                        handleStatusChange("in-progress", "Task started")
                      }
                      okText="Yes"
                      cancelText="No">
                      <Button
                        type="link"
                        size="small"
                        icon={<PlayCircleOutlined />}
                        loading={loading}
                        className="p-0">
                        Start
                      </Button>
                    </Popconfirm>
                  )}
                  {task.status === "pending" && (
                    <Badge status="processing" text="Awaiting start" />
                  )}
                </div>
              ),
          },
          {
            title: size === "small" ? null : "In Progress",
            icon: <PlayCircleOutlined />,
            description:
              size === "small" ? null : (
                <div className="mt-2 space-y-2">
                  {isAssignee &&
                    (task.status === "in-progress" ||
                      task.status === "rejected") && (
                      <Popconfirm
                        title="Submit for Review"
                        description="Submit this task for review?"
                        onConfirm={handleSubmitForReview}
                        okText="Submit"
                        cancelText="Cancel">
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          loading={loading}
                          className="p-0 text-blue-500">
                          Submit Review
                        </Button>
                      </Popconfirm>
                    )}
                  {isTaskGiver && task.status === "in-progress" && (
                    <Popconfirm
                      title="Force Complete"
                      description="Mark as complete without review?"
                      onConfirm={handleForceComplete}
                      okText="Yes"
                      cancelText="No">
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        loading={loading}
                        className="p-0 text-green-500">
                        Force Complete
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              ),
          },
          {
            title: size === "small" ? null : "Under Review",
            icon: <EyeOutlined />,
            description:
              size === "small" ? null : (
                <div className="mt-2">
                  {task.status === "under-review" && (
                    <Badge status="processing" text="Awaiting review" />
                  )}
                </div>
              ),
          },
          {
            title: size === "small" ? null : "Completed",
            icon: <CheckCircleOutlined />,
            description:
              size === "small" ? null : (
                <div className="mt-2">
                  {task.status === "completed" ? (
                    <Space size="small">
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Completed
                      </Tag>
                      {task.completedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </Space>
                  ) : (
                    <Badge status="default" text="Not completed" />
                  )}
                </div>
              ),
          },
        ]}
      />

      {/* Mobile compact view */}
      {size === "small" && (
        <div className="flex items-center justify-between mt-2 text-xs">
          <Badge
            status={
              task.status === "pending"
                ? "processing"
                : task.status === "completed"
                  ? "success"
                  : task.status === "rejected"
                    ? "error"
                    : "default"
            }
            text={task.status?.replace("-", " ") || "Pending"}
          />
          {task.isOverdue && (
            <Tag color="red" icon={<CloseCircleOutlined />} className="text-xs">
              Overdue
            </Tag>
          )}
        </div>
      )}
    </div>
  );
};

TaskStatusFlow.propTypes = {
  task: PropTypes.object.isRequired,
  userId: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func,
  size: PropTypes.oneOf(["small", "default"]),
};

TaskStatusFlow.defaultProps = {
  size: "small",
};

export default TaskStatusFlow;
