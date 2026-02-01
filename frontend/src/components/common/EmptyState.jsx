import { Empty, Button } from "antd";
import { PlusOutlined, FileTextOutlined } from "@ant-design/icons";

const EmptyState = ({
  title = "No data available",
  description = "Get started by creating a new item",
  icon,
  action,
  actionText = "Create New",
  onAction,
}) => {
  const defaultIcon = icon || (
    <FileTextOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
  );

  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="mb-4 flex justify-center">{defaultIcon}</div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mb-6 text-sm text-gray-500">{description}</p>
        {action ||
          (onAction && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAction}
              size="large">
              {actionText}
            </Button>
          ))}
      </div>
    </div>
  );
};

export default EmptyState;
