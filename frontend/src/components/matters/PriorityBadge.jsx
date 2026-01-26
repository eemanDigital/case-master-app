import React from "react";
import { Badge, Tooltip } from "antd";
import {
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  MinusOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { getPriorityColor } from "../../config/matterConfig";

const PriorityBadge = ({ priority, showText = true, tooltip = true }) => {
  const getPriorityConfig = () => {
    const priorityMap = {
      urgent: {
        color: "red",
        text: "Urgent",
        icon: <ExclamationCircleOutlined />,
        level: 4,
      },
      high: {
        color: "orange",
        text: "High",
        icon: <ArrowUpOutlined />,
        level: 3,
      },
      medium: {
        color: "blue",
        text: "Medium",
        icon: <MinusOutlined />,
        level: 2,
      },
      low: {
        color: "gray",
        text: "Low",
        icon: <ArrowDownOutlined />,
        level: 1,
      },
    };

    return (
      priorityMap[priority] || {
        color: "default",
        text: priority,
        icon: null,
        level: 0,
      }
    );
  };

  const config = getPriorityConfig();

  const content = (
    <div className="flex items-center gap-2">
      <Badge color={config.color} />
      {showText && <span>{config.text}</span>}
      {config.icon}
    </div>
  );

  if (tooltip) {
    return <Tooltip title={`Priority: ${config.text}`}>{content}</Tooltip>;
  }

  return content;
};

export default PriorityBadge;
