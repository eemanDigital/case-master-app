import React, { memo, useMemo } from "react";
import {
  Card,
  Avatar,
  Button,
  Dropdown,
  Tooltip,
  Tag,
  Typography,
  Badge,
  Grid,
  Checkbox,
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
  FileTextOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../providers/ThemeProvider";
import {
  formatCurrency,
  getStatusColor,
  getPriorityColor,
} from "../../config/matterConfig";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const MatterCard = memo(
  ({
    matter,
    onView,
    onEdit,
    onDelete,
    onSelect,
    selected,
    className = "",
    compact = false,
  }) => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const screens = useBreakpoint();

    const getDaysDifference = (date) => {
      if (!date) return null;
      const today = new Date();
      const targetDate = new Date(date);
      const diffTime = targetDate - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      if (screens.xs) return format(date, "MM/dd/yy");
      if (screens.sm) return format(date, "MMM dd");
      return format(date, "MMM dd, yyyy");
    };

    const getStatusDisplay = (status) => {
      const statusMap = {
        active: "Active",
        pending: "Pending",
        "on-hold": "On Hold",
        completed: "Completed",
        closed: "Closed",
        archived: "Archived",
        settled: "Settled",
        withdrawn: "Withdrawn",
        won: "Won",
        lost: "Lost",
      };
      return statusMap[status] || status;
    };

    const getMatterTypeIcon = (type) => {
      const icons = {
        litigation: <FileTextOutlined />,
        advisory: <StarOutlined />,
        transactional: <DollarOutlined />,
        compliance: <FileTextOutlined />,
        regulatory: <StarOutlined />,
      };
      return icons[type] || <FileTextOutlined />;
    };

    const menuItems = useMemo(
      () => [
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
            onEdit?.(matter) ||
            navigate(`/dashboard/matters/${matter._id}/edit`),
        },
        { type: "divider" },
        {
          key: "delete",
          label: "Delete Matter",
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => onDelete?.(matter),
        },
      ],
      [matter, onView, onEdit, onDelete, navigate],
    );

    const handleCardClick = (e) => {
      if (
        !e.target.closest(".action-button") &&
        !e.target.closest(".avatar-group") &&
        !e.target.closest(".ant-checkbox-wrapper")
      ) {
        navigate(`/dashboard/matters/${matter._id}`);
      }
    };

    const handleCheckboxChange = (e) => {
      e.stopPropagation();
      onSelect?.(matter._id);
    };

    const daysDifference = matter.expectedClosureDate
      ? getDaysDifference(matter.expectedClosureDate)
      : null;
    const isOverdue = daysDifference !== null && daysDifference < 0;

    const cardStyle = useMemo(
      () => ({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: compact ? "120px" : "320px",
      }),
      [compact],
    );

    if (compact) {
      return (
        <Card
          className={`
            matter-card-compact transition-all duration-200 
            hover:shadow-md cursor-pointer relative
            ${selected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""}
            ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}
            ${className}
          `}
          bodyStyle={{
            padding: "12px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={handleCardClick}
          style={cardStyle}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Checkbox
                checked={selected}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1 flex-wrap">
                  <Tag
                    color={getStatusColor(matter.status)}
                    className="capitalize text-xs font-medium px-1.5 py-0 flex-shrink-0">
                    {getStatusDisplay(matter.status).charAt(0)}
                  </Tag>

                  {matter.priority === "high" && (
                    <Badge
                      status="error"
                      size="small"
                      className="flex-shrink-0"
                    />
                  )}

                  <Text
                    type="secondary"
                    className="text-xs ml-auto truncate flex-shrink-0">
                    {matter.matterNumber}
                  </Text>
                </div>

                <h4
                  className={`font-medium text-sm mb-1 line-clamp-2 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}>
                  {matter.title}
                </h4>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar
                size="small"
                src={matter.client?.photo}
                icon={<UserOutlined />}
                className={`${isDarkMode ? "bg-blue-900" : "bg-blue-100"} flex-shrink-0`}>
                {matter.client?.firstName?.[0]}
                {matter.client?.lastName?.[0]}
              </Avatar>

              <div className="min-w-0 flex-1">
                <Text
                  className={`text-xs block truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {matter.client?.firstName} {matter.client?.lastName}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dashboard/matters/${matter._id}`);
                }}
                className="action-button p-1"
              />

              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight">
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                  className="action-button p-1"
                />
              </Dropdown>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card
        className={`
          matter-card-full transition-all duration-300 
          hover:shadow-lg hover:-translate-y-1 cursor-pointer relative
          ${selected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""}
          ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}
          ${className}
        `}
        bodyStyle={{
          padding: "16px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={handleCardClick}
        style={cardStyle}>
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={selected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="flex justify-between items-start mb-4 pl-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Tag
                color={getStatusColor(matter.status)}
                className="capitalize text-xs font-medium flex-shrink-0">
                {getStatusDisplay(matter.status)}
              </Tag>

              {matter.priority === "high" && (
                <Tag
                  color={getPriorityColor(matter.priority)}
                  className="text-xs flex-shrink-0">
                  ⚡ Urgent
                </Tag>
              )}

              {matter.isConfidential && (
                <Tag color="warning" className="text-xs flex-shrink-0">
                  🔒 Confidential
                </Tag>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-200"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                  {getMatterTypeIcon(matter.matterType)}
                </div>
                <div className="min-w-0">
                  <Text
                    strong
                    className={`text-sm block truncate ${isDarkMode ? "text-gray-100" : ""}`}>
                    {matter.matterNumber}
                  </Text>
                  <Text
                    type="secondary"
                    className="text-xs capitalize truncate block">
                    {matter.matterType}
                  </Text>
                </div>
              </div>
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
              className="action-button flex-shrink-0"
            />
          </Dropdown>
        </div>

        <h3
          className={`font-semibold mb-3 line-clamp-2 text-base ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
          {matter.title}
        </h3>

        <p
          className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {matter.description || "No description provided"}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <Avatar
            size={screens.xs ? "small" : "default"}
            src={matter.client?.photo}
            icon={<UserOutlined />}
            className={`${isDarkMode ? "bg-blue-900" : "bg-blue-100"} flex-shrink-0`}>
            {matter.client?.firstName?.[0]}
            {matter.client?.lastName?.[0]}
          </Avatar>
          <div className="min-w-0 flex-1">
            <Text
              strong
              className={`text-sm block truncate ${isDarkMode ? "text-gray-100" : ""}`}>
              {matter.client?.firstName} {matter.client?.lastName}
            </Text>
            {matter.client?.companyName && (
              <Text type="secondary" className="text-xs truncate block">
                {matter.client.companyName}
              </Text>
            )}
          </div>
        </div>

        {matter.accountOfficer && matter.accountOfficer.length > 0 && (
          <div className="mb-4">
            <Text type="secondary" className="text-xs block mb-2">
              <TeamOutlined className="mr-1" />
              Assigned Officers
            </Text>
            <Avatar.Group
              maxCount={screens.xs ? 2 : 3}
              size={screens.xs ? "small" : "default"}
              className="avatar-group">
              {matter.accountOfficer
                .slice(0, screens.xs ? 2 : 3)
                .map((officer, index) => (
                  <Tooltip
                    key={officer._id || index}
                    title={`${officer.firstName} ${officer.lastName}${officer.position ? ` (${officer.position})` : ""}`}>
                    <Avatar
                      src={officer.photo}
                      className="flex-shrink-0"
                      style={{
                        zIndex: matter.accountOfficer.length - index,
                        border: isDarkMode
                          ? "2px solid #1f2937"
                          : "2px solid white",
                        backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                      }}>
                      {officer.firstName?.[0]}
                      {officer.lastName?.[0]}
                    </Avatar>
                  </Tooltip>
                ))}
              {matter.accountOfficer.length > (screens.xs ? 2 : 3) && (
                <Avatar
                  className="flex-shrink-0"
                  style={{
                    backgroundColor: isDarkMode ? "#4b5563" : "#9ca3af",
                    color: isDarkMode ? "#d1d5db" : "white",
                    border: isDarkMode
                      ? "2px solid #1f2937"
                      : "2px solid white",
                  }}>
                  +{matter.accountOfficer.length - (screens.xs ? 2 : 3)}
                </Avatar>
              )}
            </Avatar.Group>
          </div>
        )}

        <div className="mt-auto">
          <div
            className={`pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <Text
                  type="secondary"
                  className="text-xs flex items-center gap-1 mb-1">
                  <CalendarOutlined />
                  Opened
                </Text>
                <Text
                  className={`text-xs font-medium ${isDarkMode ? "text-gray-100" : ""}`}>
                  {formatDate(matter.dateOpened)}
                </Text>
              </div>

              {matter.expectedClosureDate && (
                <div className="flex flex-col">
                  <Text
                    type="secondary"
                    className="text-xs flex items-center gap-1 mb-1">
                    <ClockCircleOutlined />
                    {isOverdue ? "Overdue" : "Due In"}
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
                      ? `${Math.abs(daysDifference)}d ago`
                      : `${daysDifference}d`}
                  </Text>
                </div>
              )}

              {matter.estimatedValue && (
                <div className="flex flex-col">
                  <Text
                    type="secondary"
                    className="text-xs flex items-center gap-1 mb-1">
                    <DollarOutlined />
                    Value
                  </Text>
                  <Text
                    className={`text-xs font-medium truncate ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                    {formatCurrency(matter.estimatedValue, matter.currency)}
                  </Text>
                </div>
              )}

              <div className="flex flex-col">
                <Text type="secondary" className="text-xs mb-1">
                  Category
                </Text>
                <Text
                  className={`text-xs font-medium truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {matter.category || "N/A"}
                </Text>
              </div>
            </div>

            {screens.md && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-between gap-2">
                  <Text type="secondary" className="text-xs truncate">
                    Nature:{" "}
                    <span
                      className={
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }>
                      {matter.natureOfMatter || "N/A"}
                    </span>
                  </Text>
                  {matter.billingType && (
                    <Text type="secondary" className="text-xs truncate">
                      Billing:{" "}
                      <span
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }>
                        {matter.billingType}
                      </span>
                    </Text>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  },
);

MatterCard.displayName = "MatterCard";

export default MatterCard;
