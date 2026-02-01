import { Tag } from "antd";
import { getStatusConfig } from "../../utils/formatters";

const StatusTag = ({ status, configArray, defaultColor = "default" }) => {
  if (!status) return <Tag>-</Tag>;

  const config = getStatusConfig(status, configArray);

  return (
    <Tag color={config.color || defaultColor}>{config.label || status}</Tag>
  );
};

export default StatusTag;
