import React from "react";
import { Tag } from "antd";
import { getStatusColor } from "../../config/matterConfig";

const MatterStatusTag = ({ status, showLabel = true, size = "default" }) => {
  const getStatusConfig = () => {
    const statusMap = {
      active: { color: "success", text: "Active" },
      pending: { color: "warning", text: "Pending" },
      "on-hold": { color: "default", text: "On Hold" },
      completed: { color: "processing", text: "Completed" },
      closed: { color: "default", text: "Closed" },
      archived: { color: "purple", text: "Archived" },
      settled: { color: "success", text: "Settled" },
      withdrawn: { color: "error", text: "Withdrawn" },
      won: { color: "success", text: "Won" },
      lost: { color: "error", text: "Lost" },
    };

    return statusMap[status] || { color: "default", text: status };
  };

  const config = getStatusConfig();

  return (
    <Tag
      color={config.color}
      className={`inline-flex items-center ${size === "small" ? "text-xs px-2 py-0.5" : ""}`}>
      {showLabel ? config.text : null}
    </Tag>
  );
};

export default MatterStatusTag;
