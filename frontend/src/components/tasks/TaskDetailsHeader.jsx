import React from "react";
import { Card, Typography, Tag, Badge, Button, Progress } from "antd";
import { FileSyncOutlined, ReloadOutlined } from "@ant-design/icons";
import GoBackButton from "../GoBackButton";

const { Title, Text, Paragraph } = Typography;

const TaskDetailsHeader = ({
  task,
  loading,
  screens,
  refreshTask,
  statusConfig,
  priorityConfig,
  categoryConfig,
  overallProgress,
  timeMetrics,
  actionButtons,
  isTemplate,
}) => {
  return (
    <Card className="mb-6 shadow-sm border-0">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <GoBackButton />
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshTask}
              loading={loading}
              size="small">
              {screens.xs ? "" : "Refresh"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Tag icon={categoryConfig.icon} color={categoryConfig.color}>
              {categoryConfig.label}
            </Tag>
            <Badge
              status={statusConfig.badge}
              text={
                <Text strong className="text-sm">
                  {statusConfig.icon} {statusConfig.text}
                </Text>
              }
            />
            <Tag color={priorityConfig.color} className="text-xs">
              {priorityConfig.icon} {priorityConfig.text} PRIORITY
            </Tag>
            {isTemplate && (
              <Tag color="purple" icon={<FileSyncOutlined />}>
                Template
              </Tag>
            )}
          </div>

          <Title
            level={screens.xs ? 3 : 2}
            className="m-0 mb-2 line-clamp-2 break-words">
            {task?.title}
          </Title>

          {task?.description && (
            <Paragraph
              ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
              className="text-gray-600 mb-4">
              {task.description}
            </Paragraph>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Text strong className="text-sm">
                Overall Progress
              </Text>
              <Text strong className="text-sm">
                {overallProgress}%
              </Text>
            </div>
            <Progress
              percent={overallProgress}
              status={
                task?.status === "completed"
                  ? "success"
                  : timeMetrics.isOverdue
                  ? "exception"
                  : "active"
              }
              strokeColor={
                task?.status === "completed"
                  ? "#52c41a"
                  : timeMetrics.isOverdue
                  ? "#ff4d4f"
                  : priorityConfig.color
              }
              size={screens.xs ? "small" : "default"}
            />
          </div>
        </div>

        {/* Action Buttons - Desktop */}
        {!screens.xs && <div className="flex-shrink-0">{actionButtons}</div>}
      </div>

      {/* Action Buttons - Mobile (full width) */}
      {screens.xs && <div className="mt-4">{actionButtons}</div>}
    </Card>
  );
};

export default TaskDetailsHeader;
