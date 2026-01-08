import React from "react";
import { Steps, Badge, Tag, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Step } = Steps;

const TaskStatusTracker = ({ task, userId, onStatusChange }) => {
  const getCurrentStep = () => {
    switch (task?.status) {
      case "pending":
        return 0;
      case "in-progress":
        return 1;
      case "under-review":
        return 2;
      case "completed":
        return 3;
      case "rejected":
        return 1; // Goes back to in-progress
      default:
        return 0;
    }
  };

  const isAssignee = task?.assignees?.some(
    (assignee) => assignee.user?._id === userId
  );
  const isCreator = task?.createdBy?._id === userId;

  const steps = [
    {
      title: "Pending",
      icon: <ClockCircleOutlined />,
      status: task?.status === "pending" ? "process" : "wait",
      description:
        task?.status === "pending" ? (
          <Badge status="processing" text="Awaiting Start" />
        ) : (
          <Badge status="default" text="Not Started" />
        ),
    },
    {
      title: "In Progress",
      icon: <PlayCircleOutlined />,
      status: task?.status === "in-progress" ? "process" : "wait",
      description: (
        <div className="space-y-1">
          {task?.status === "in-progress" && (
            <Badge status="processing" text="Active" />
          )}
          {isAssignee &&
            (task?.status === "in-progress" || task?.status === "rejected") && (
              <Tooltip title="Submit for Review">
                <Tag color="blue" className="cursor-pointer">
                  Ready for Review
                </Tag>
              </Tooltip>
            )}
        </div>
      ),
    },
    {
      title: "Under Review",
      icon: <EyeOutlined />,
      status: task?.status === "under-review" ? "process" : "wait",
      description: (
        <div className="space-y-1">
          {task?.status === "under-review" && (
            <Badge status="processing" text="Awaiting Review" />
          )}
          {(isCreator || isAssignee) && task?.status === "under-review" && (
            <Tag color="orange" className="cursor-pointer">
              Needs Approval
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Completed",
      icon: <CheckCircleOutlined />,
      status: task?.status === "completed" ? "finish" : "wait",
      description:
        task?.status === "completed" ? (
          <Badge status="success" text="Completed" />
        ) : (
          <Badge status="default" text="Not Completed" />
        ),
    },
  ];

  return (
    <div className="task-status-tracker mb-6">
      <Steps current={getCurrentStep()} size="small">
        {steps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            icon={step.icon}
            status={step.status}
            description={step.description}
          />
        ))}
      </Steps>
    </div>
  );
};

export default TaskStatusTracker;
