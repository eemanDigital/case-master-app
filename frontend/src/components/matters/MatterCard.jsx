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
  Progress,
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
  RiseOutlined,
  FallOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../providers/ThemeProvider";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Text, Title } = Typography;

const getStatusConfig = (status) => {
  const configs = {
    active: { color: "#10b981", bg: "#d1fae5", label: "Active", dot: "success" },
    pending: { color: "#f59e0b", bg: "#fef3c7", label: "Pending", dot: "warning" },
    "on-hold": { color: "#6366f1", bg: "#e0e7ff", label: "On Hold", dot: "processing" },
    completed: { color: "#3b82f6", bg: "#dbeafe", label: "Completed", dot: "success" },
    closed: { color: "#64748b", bg: "#f1f5f9", label: "Closed", dot: "default" },
    archived: { color: "#94a3b8", bg: "#f8fafc", label: "Archived", dot: "default" },
    settled: { color: "#8b5cf6", bg: "#ede9fe", label: "Settled", dot: "success" },
    withdrawn: { color: "#ec4899", bg: "#fce7f3", label: "Withdrawn", dot: "default" },
    won: { color: "#22c55e", bg: "#dcfce7", label: "Won", dot: "success" },
    lost: { color: "#ef4444", bg: "#fee2e2", label: "Lost", dot: "error" },
  };
  return configs[status] || { color: "#64748b", bg: "#f1f5f9", label: status, dot: "default" };
};

const getPriorityConfig = (priority) => {
  const configs = {
    high: { color: "#ef4444", label: "High", icon: "🔴" },
    medium: { color: "#f59e0b", label: "Medium", icon: "🟡" },
    low: { color: "#22c55e", label: "Low", icon: "🟢" },
  };
  return configs[priority] || { color: "#64748b", label: priority, icon: "⚪" };
};

const getMatterTypeConfig = (type) => {
  const configs = {
    litigation: { icon: "⚖️", color: "#6366f1", label: "Litigation" },
    advisory: { icon: "💡", color: "#8b5cf6", label: "Advisory" },
    transactional: { icon: "📝", color: "#10b981", label: "Transactional" },
    compliance: { icon: "✅", color: "#f59e0b", label: "Compliance" },
    regulatory: { icon: "📋", color: "#3b82f6", label: "Regulatory" },
  };
  return configs[type] || { icon: "📁", color: "#64748b", label: type };
};

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

    const statusConfig = useMemo(() => getStatusConfig(matter.status), [matter.status]);
    const priorityConfig = useMemo(() => getPriorityConfig(matter.priority), [matter.priority]);
    const typeConfig = useMemo(() => getMatterTypeConfig(matter.matterType), [matter.matterType]);

    const daysDifference = useMemo(() => {
      if (!matter.expectedClosureDate) return null;
      const diff = dayjs(matter.expectedClosureDate).diff(dayjs(), "day");
      return diff;
    }, [matter.expectedClosureDate]);

    const isOverdue = daysDifference !== null && daysDifference < 0;
    const isDueSoon = daysDifference !== null && daysDifference >= 0 && daysDifference <= 7;

    const menuItems = useMemo(
      () => [
        {
          key: "view",
          label: "View Details",
          icon: <EyeOutlined />,
          onClick: () => onView?.(matter) || navigate(`/dashboard/matters/${matter._id}`),
        },
        {
          key: "edit",
          label: "Edit Matter",
          icon: <EditOutlined />,
          onClick: () => onEdit?.(matter) || navigate(`/dashboard/matters/${matter._id}/edit`),
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

    // Premium Card Styles
    const cardStyles = {
      borderRadius: "16px",
      border: selected 
        ? `2px solid ${typeConfig.color}` 
        : `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
      background: isDarkMode 
        ? "linear-gradient(145deg, #1f2937 0%, #111827 100%)"
        : "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)",
      boxShadow: selected
        ? `0 8px 30px ${typeConfig.color}30`
        : isDarkMode
          ? "0 4px 20px rgba(0, 0, 0, 0.3)"
          : "0 4px 20px rgba(0, 0, 0, 0.08)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    };

    if (compact) {
      return (
        <Card
          className={`
            matter-card-compact cursor-pointer group
            hover:shadow-lg hover:-translate-y-1
            ${selected ? "ring-2 ring-offset-2" : ""}
            ${isDarkMode ? "dark-card" : "bg-white"}
            ${className}
          `}
          bodyStyle={{ padding: "14px" }}
          onClick={handleCardClick}
          style={cardStyles}>
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusConfig.color }}
                />
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {matter.matterNumber}
                </Text>
                {matter.priority === "high" && (
                  <Badge status="error" />
                )}
              </div>
              
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 line-clamp-1">
                {matter.title}
              </h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    size="small"
                    src={matter.client?.photo}
                    icon={<UserOutlined />}
                    className="bg-gradient-to-br from-blue-400 to-blue-600">
                    {matter.client?.firstName?.[0]}
                  </Avatar>
                  <Text className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {matter.client?.firstName} {matter.client?.lastName}
                  </Text>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/matters/${matter._id}`);
                    }}
                    className="action-button opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      onClick={(e) => e.stopPropagation()}
                      className="action-button"
                    />
                  </Dropdown>
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card
        className={`
          matter-card-full cursor-pointer group
          hover:shadow-xl hover:-translate-y-2
          ${selected ? "ring-2 ring-offset-2" : ""}
          ${isDarkMode ? "dark-card" : "bg-white"}
          ${className}
        `}
        bodyStyle={{ padding: "20px", height: "100%" }}
        onClick={handleCardClick}
        style={cardStyles}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
            />
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ 
                background: `linear-gradient(135deg, ${typeConfig.color}20 0%, ${typeConfig.color}40 100%)`,
                color: typeConfig.color
              }}
            >
              {typeConfig.icon}
            </div>
            <div>
              <Text className="text-xs font-mono text-gray-500 dark:text-gray-400 block">
                {matter.matterNumber}
              </Text>
              <Text className="text-xs text-gray-400 capitalize">
                {typeConfig.label}
              </Text>
            </div>
          </div>
          
          <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
              className="action-button opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Dropdown>
        </div>

        {/* Title & Description */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
            {matter.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {matter.description || "No description provided"}
          </p>
        </div>

        {/* Status & Priority Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Tag 
            color={statusConfig.bg}
            style={{ 
              color: statusConfig.color, 
              border: 'none',
              fontWeight: 600,
              fontSize: '11px',
              padding: '2px 10px',
              borderRadius: '20px'
            }}
          >
            <Badge status={statusConfig.dot} />
            {statusConfig.label}
          </Tag>
          
          <Tag
            style={{ 
              background: `${priorityConfig.color}15`,
              color: priorityConfig.color,
              border: 'none',
              fontWeight: 600,
              fontSize: '11px',
              padding: '2px 10px',
              borderRadius: '20px'
            }}
          >
            {priorityConfig.icon} {priorityConfig.label}
          </Tag>

          {matter.isConfidential && (
            <Tag color="warning" className="text-xs">
              🔒 Confidential
            </Tag>
          )}
        </div>

        {/* Client Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 mb-4">
          <Avatar
            size={40}
            src={matter.client?.photo}
            icon={<UserOutlined />}
            className="bg-gradient-to-br from-indigo-400 to-indigo-600 ring-2 ring-white dark:ring-gray-700">
            {matter.client?.firstName?.[0]}
          </Avatar>
          <div className="flex-1 min-w-0">
            <Text strong className="text-sm block truncate dark:text-white">
              {matter.client?.firstName} {matter.client?.lastName}
            </Text>
            {matter.client?.companyName && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                {matter.client.companyName}
              </Text>
            )}
          </div>
        </div>

        {/* Team Members */}
        {matter.accountOfficer && matter.accountOfficer.length > 0 && (
          <div className="mb-4">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
              <TeamOutlined className="mr-1" />
              Team ({matter.accountOfficer.length})
            </Text>
            <Avatar.Group
              maxCount={4}
              size={32}
              className="avatar-group"
            >
              {matter.accountOfficer.map((officer, idx) => (
                <Tooltip
                  key={officer._id || idx}
                  title={`${officer.firstName} ${officer.lastName}`}
                >
                  <Avatar
                    src={officer.photo}
                    style={{
                      border: isDarkMode ? "2px solid #1f2937" : "2px solid white",
                    }}
                    className="ring-2 ring-offset-1 ring-blue-500"
                  >
                    {officer.firstName?.[0]}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          </div>
        )}

        {/* Timeline & Stats */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            {/* Date Opened */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <CalendarOutlined className="text-blue-500 text-sm" />
              </div>
              <div>
                <Text className="text-xs text-gray-500 dark:text-gray-400 block">Opened</Text>
                <Text strong className="text-xs dark:text-white">
                  {dayjs(matter.dateOpened).format("MMM DD, YYYY")}
                </Text>
              </div>
            </div>

            {/* Due Date */}
            {matter.expectedClosureDate && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ 
                    background: isOverdue 
                      ? '#fee2e2' 
                      : isDueSoon 
                        ? '#fef3c7' 
                        : isDarkMode ? '#1f2937' : '#f1f5f9'
                  }}
                >
                  <ClockCircleOutlined 
                    className="text-sm"
                    style={{ 
                      color: isOverdue 
                        ? '#ef4444' 
                        : isDueSoon 
                          ? '#f59e0b' 
                          : isDarkMode ? '#9ca3af' : '#64748b'
                    }}
                  />
                </div>
                <div>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 block">
                    {isOverdue ? "Overdue" : "Due"}
                  </Text>
                  <Text 
                    strong 
                    className="text-xs"
                    style={{ 
                      color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : undefined
                    }}
                  >
                    {isOverdue 
                      ? `${Math.abs(daysDifference)}d ago` 
                      : dayjs(matter.expectedClosureDate).format("MMM DD")
                    }
                  </Text>
                </div>
              </div>
            )}

            {/* Estimated Value */}
            {matter.estimatedValue && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarOutlined className="text-green-500 text-sm" />
                </div>
                <div>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 block">Value</Text>
                  <Text strong className="text-xs text-green-600 dark:text-green-400">
                    ₦{matter.estimatedValue.toLocaleString()}
                  </Text>
                </div>
              </div>
            )}

            {/* Category */}
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: isDarkMode ? '#1f2937' : '#f1f5f9' }}
              >
                <FileTextOutlined className="text-gray-500 text-sm" />
              </div>
              <div>
                <Text className="text-xs text-gray-500 dark:text-gray-400 block">Category</Text>
                <Text strong className="text-xs dark:text-white truncate">
                  {matter.category || "N/A"}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Button 
            type="link" 
            className="w-full h-10 text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center gap-2 p-0 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/matters/${matter._id}`);
            }}
          >
            View Full Details
            <RightOutlined className="text-xs" />
          </Button>
        </div>
      </Card>
    );
  },
);

MatterCard.displayName = "MatterCard";

export default MatterCard;
