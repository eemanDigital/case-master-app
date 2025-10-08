import { Card, Tag, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

/**
 * Reusable Active Filters Display Component
 */
const ActiveFilters = ({ filters, onFilterRemove, onClearAll }) => {
  if (Object.keys(filters).length === 0) return null;

  const getFilterLabel = (key, value) => {
    const labels = {
      search: `Search: ${value}`,
      role: `Role: ${value}`,
      isActive: `Status: ${value === "true" ? "Active" : "Inactive"}`,
      isLawyer: `Lawyer: ${value === "true" ? "Yes" : "No"}`,
      position: `Position: ${value}`,
      gender: `Gender: ${value}`,
      status: `Status: ${value}`,
      state: `State: ${value}`,
    };
    return labels[key] || `${key}: ${value}`;
  };

  return (
    <Card size="small" className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">Active filters:</span>
        {Object.keys(filters).map(
          (key) =>
            filters[key] && (
              <Tag
                key={key}
                closable
                onClose={() => onFilterRemove(key)}
                className="bg-blue-100 border-blue-300">
                {getFilterLabel(key, filters[key])}
              </Tag>
            )
        )}
        <Button
          type="link"
          size="small"
          onClick={onClearAll}
          icon={<ReloadOutlined />}
          className="p-0 h-auto">
          Clear all
        </Button>
      </div>
    </Card>
  );
};

export default ActiveFilters;
