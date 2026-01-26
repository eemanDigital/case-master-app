import React, { memo } from "react";
import {
  Card,
  Avatar,
  Space,
  Button,
  Dropdown,
  Tooltip,
  Tag,
  Typography,
} from "antd";
import {
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../providers/ThemeProvider";
import {
  MATTER_CONFIG,
  formatCurrency,
  getMatterTypeIcon,
} from "../../config/matterConfig";

const { Text } = Typography;

const MatterCard = memo(
  ({
    matter,
    onView,
    onEdit,
    onDelete,
    onSelect,
    selected,
    className = "",
  }) => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const getDaysDifference = (date) => {
      if (!date) return null;
      const today = new Date();
      const targetDate = new Date(date);
      const diffTime = targetDate - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getStatusColor = (status) => {
      const colors = {
        active: "green",
        pending: "orange",
        "on-hold": "yellow",
        completed: "blue",
        closed: "gray",
        archived: "purple",
        settled: "lime",
        withdrawn: "red",
        won: "success",
        lost: "error",
      };
      return colors[status] || "default";
    };

    const getPriorityText = (priority) => {
      const priorityMap = {
        urgent: "Urgent",
        high: "High",
        medium: "Medium",
        low: "Low",
      };
      return priorityMap[priority] || priority;
    };

    const menuItems = [
      {
        key: "view",
        label: "View Details",
        icon: <EyeOutlined />,
        onClick: () =>
          onView?.(matter) || navigate(`/dashboard/matters/${matter._id}`),
      },
      {
        key: "edit",
        label: "Edit Matter",
        icon: <EditOutlined />,
        onClick: () =>
          onEdit?.(matter) || navigate(`/dashboard/matters/${matter._id}/edit`),
      },
      {
        type: "divider",
      },
      {
        key: "delete",
        label: "Delete Matter",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDelete?.(matter),
      },
    ];

    const handleCardClick = (e) => {
      if (!e.target.closest(".action-button")) {
        onSelect?.(matter);
        navigate(`/dashboard/matters/${matter._id}`);
      }
    };

    const daysDifference = matter.expectedClosureDate
      ? getDaysDifference(matter.expectedClosureDate)
      : null;
    const isOverdue = daysDifference !== null && daysDifference < 0;

    return (
      <Card
        className={`
        h-full transition-all duration-300 
        hover:shadow-lg hover:-translate-y-1 cursor-pointer
        ${selected ? "ring-2 ring-primary-500" : ""}
        ${isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : "bg-white"}
        ${className}
      `}
        bodyStyle={{ padding: "16px" }}
        onClick={handleCardClick}>
        {/* Header with Matter Number and Actions */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Tag
                color={getStatusColor(matter.status)}
                className="capitalize text-xs font-medium">
                {matter.status}
              </Tag>

              {matter.priority === "urgent" && (
                <Tag color="red" className="text-xs">
                  ⚡ Urgent
                </Tag>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  isDarkMode
                    ? "bg-blue-900 text-blue-200"
                    : "bg-blue-100 text-blue-800"
                }`}>
                {matter.matterNumber}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-700"
                }`}>
                {matter.matterType}
              </span>
            </div>
          </div>

          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
              className="action-button"
            />
          </Dropdown>
        </div>

        {/* Matter Title */}
        <h3
          className={`font-semibold mb-2 line-clamp-2 ${
            isDarkMode ? "text-gray-100" : "text-gray-900"
          }`}>
          {matter.title}
        </h3>

        {/* Description */}
        <p
          className={`text-sm mb-4 line-clamp-2 ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}>
          {matter.description}
        </p>

        {/* Client Information */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar
            size="small"
            src={matter.client?.photo}
            icon={<UserOutlined />}
            className={isDarkMode ? "bg-blue-900" : "bg-blue-100"}>
            {matter.client?.firstName?.[0]}
            {matter.client?.lastName?.[0]}
          </Avatar>
          <div>
            <Text
              strong
              className={`text-sm block ${isDarkMode ? "text-gray-100" : ""}`}>
              {matter.client?.firstName} {matter.client?.lastName}
            </Text>
            <Text type="secondary" className="text-xs">
              Client
            </Text>
          </div>
        </div>

        {/* Account Officers */}
        <div className="mb-4">
          <Text type="secondary" className="text-xs block mb-1">
            <TeamOutlined className="mr-1" />
            Assigned Officers
          </Text>
          <Avatar.Group maxCount={3} size="small">
            {matter.accountOfficer?.slice(0, 3).map((officer, index) => (
              <Tooltip
                key={officer._id || index}
                title={`${officer.firstName} ${officer.lastName}`}>
                <Avatar
                  src={officer.photo}
                  style={{
                    zIndex: matter.accountOfficer?.length - index,
                    border: isDarkMode
                      ? "2px solid #1f2937"
                      : "2px solid white",
                  }}>
                  {officer.firstName?.[0]}
                  {officer.lastName?.[0]}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>

        {/* Footer - Dates and Financials */}
        <div
          className={`pt-3 border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}>
          <Space size="large" className="w-full justify-between">
            <div className="flex flex-col">
              <Text type="secondary" className="text-xs">
                <CalendarOutlined className="mr-1" />
                Opened
              </Text>
              <Text
                className={`text-xs font-medium ${isDarkMode ? "text-gray-100" : ""}`}>
                {format(new Date(matter.dateOpened), "MMM dd, yyyy")}
              </Text>
            </div>

            {matter.expectedClosureDate && (
              <div className="flex flex-col">
                <Text type="secondary" className="text-xs">
                  <ClockCircleOutlined className="mr-1" />
                  Due In
                </Text>
                <Text
                  className={`text-xs font-medium ${
                    isOverdue
                      ? "text-red-600"
                      : daysDifference <= 7
                        ? "text-orange-600"
                        : isDarkMode
                          ? "text-gray-300"
                          : "text-gray-700"
                  }`}>
                  {isOverdue
                    ? `Overdue ${Math.abs(daysDifference)}d`
                    : `${daysDifference}d`}
                </Text>
              </div>
            )}

            {matter.estimatedValue && (
              <div className="flex flex-col">
                <Text type="secondary" className="text-xs">
                  <DollarOutlined className="mr-1" />
                  Value
                </Text>
                <Text
                  className={`text-xs font-medium ${
                    isDarkMode ? "text-green-400" : "text-green-600"
                  }`}>
                  {formatCurrency(matter.estimatedValue, matter.currency)}
                </Text>
              </div>
            )}
          </Space>
        </div>
      </Card>
    );
  },
);

MatterCard.displayName = "MatterCard";

export default MatterCard;
