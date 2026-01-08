import React from "react";
import { Col, Typography, Space, Avatar, Tag, Tooltip } from "antd";
import { FolderOpenOutlined, LinkOutlined } from "@ant-design/icons";

const { Text } = Typography;

const TaskDetailItem = ({ icon, label, value, span = 1, children }) => (
  <Col xs={24} sm={12} lg={span === 2 ? 12 : 8} xl={span === 2 ? 12 : 6}>
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg h-full">
      <span className="text-blue-500 mt-1">{icon}</span>
      <div className="flex-1 min-w-0">
        <Text strong className="text-xs text-gray-500 block mb-1">
          {label}
        </Text>
        {children ? (
          children
        ) : (
          <Text className="text-sm block">{value || "N/A"}</Text>
        )}
      </div>
    </div>
  </Col>
);

export const CaseDetailItem = ({ task, screens }) => {
  if (!task?.caseToWorkOn?.length > 0 && !task?.customCaseReference) {
    return (
      <TaskDetailItem
        icon={<LinkOutlined />}
        label="Related Case(s)"
        span={2}
        children="No case linked"
      />
    );
  }

  return (
    <TaskDetailItem
      icon={<LinkOutlined />}
      label="Related Case(s)"
      span={2}
      children={
        <Space direction="vertical" size={2}>
          {task.caseToWorkOn?.map((caseItem, index) => (
            <Tag key={index} color="blue" icon={<FolderOpenOutlined />}>
              {caseItem.suitNo || caseItem._id}
            </Tag>
          ))}
          {task.customCaseReference && (
            <Tag color="orange">{task.customCaseReference}</Tag>
          )}
        </Space>
      }
    />
  );
};

export default TaskDetailItem;
