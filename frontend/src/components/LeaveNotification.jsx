// components/AdvancedLeaveNotification.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Popover,
  List,
  Button,
  Tooltip,
  Empty,
  Tag,
  Space,
  Divider,
  Spin,
  Tabs,
  Avatar,
  Segmented,
} from "antd";
import {
  BellOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import { useSelector } from "react-redux";

const LeaveNotification = () => {
  const {
    leaveApps,
    loading: loadingLeaveApp,
    error: errorLeaveApp,
    fetchData,
  } = useDataGetterHook();

  const { isAdminOrHr } = useAdminHook();
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [filterType, setFilterType] = useState("all");

  // Initial fetch
  useEffect(() => {
    fetchData("leaves/applications", "leaveApps");
  }, []);

  // Auto-refresh every 60 seconds when popover is open
  useEffect(() => {
    if (open) {
      const interval = setInterval(() => {
        fetchData("leaves/applications", "leaveApps");
      }, 60000); // 60 seconds

      return () => clearInterval(interval);
    }
  }, [open]);

  // Safely extract array from API response
  const allLeaves = useMemo(() => {
    let dataArray = [];

    if (Array.isArray(leaveApps?.data)) {
      dataArray = leaveApps.data;
    } else if (Array.isArray(leaveApps?.data?.leaveApplications)) {
      dataArray = leaveApps.data.leaveApplications;
    }

    return dataArray;
  }, [leaveApps]);

  // Filter leaves by status
  const leavesByStatus = useMemo(() => {
    const pending = allLeaves.filter((leave) => leave?.status === "pending");
    const approved = allLeaves.filter((leave) => leave?.status === "approved");
    const rejected = allLeaves.filter((leave) => leave?.status === "rejected");
    const recent = [...pending, ...approved, ...rejected]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return { pending, approved, rejected, recent };
  }, [allLeaves]);

  // Filter by leave type
  const filteredLeaves = useMemo(() => {
    const currentLeaves = leavesByStatus[activeTab] || [];

    if (filterType === "all") {
      return currentLeaves;
    }

    return currentLeaves.filter((leave) => leave?.typeOfLeave === filterType);
  }, [leavesByStatus, activeTab, filterType]);

  // Get unique leave types for filter
  const leaveTypes = useMemo(() => {
    const types = new Set(
      allLeaves.map((leave) => leave?.typeOfLeave).filter(Boolean)
    );
    return Array.from(types);
  }, [allLeaves]);

  // Helper functions
  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options = { month: "short", day: "numeric" };
    return `${startDate.toLocaleDateString(
      "en-US",
      options
    )} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: "blue",
      casual: "cyan",
      sick: "red",
      maternity: "magenta",
      paternity: "purple",
      compassionate: "orange",
      unpaid: "default",
    };
    return colors[type] || "default";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockCircleOutlined className="text-yellow-500" />,
      approved: <CheckCircleOutlined className="text-green-500" />,
      rejected: <CloseCircleOutlined className="text-red-500" />,
    };
    return icons[status] || null;
  };

  // Render leave item
  const renderLeaveItem = (item) => (
    <List.Item
      key={item._id || item.id}
      className="hover:bg-gray-50 px-3 py-3 rounded-lg transition-all cursor-pointer"
      actions={[
        <Link
          to={`/dashboard/staff/leave-application/${
            item?.id || item?._id
          }/details`}
          onClick={() => setOpen(false)}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            className="bg-blue-500">
            View
          </Button>
        </Link>,
      ]}>
      <List.Item.Meta
        avatar={
          <Avatar
            size={44}
            src={item?.employee?.photo}
            icon={<UserOutlined />}
            className="border-2 border-gray-200"
          />
        }
        title={
          <div className="flex items-center justify-between mb-1">
            <Link
              className="font-medium text-gray-900 hover:text-blue-600 capitalize"
              to={`/dashboard/staff/leave-application/${
                item?.id || item?._id
              }/details`}
              onClick={() => setOpen(false)}>
              {item?.employee?.firstName} {item?.employee?.lastName}
            </Link>
            <div className="flex items-center gap-2">
              {getStatusIcon(item?.status)}
              <span className="text-xs text-gray-400">
                {getTimeAgo(item?.createdAt)}
              </span>
            </div>
          </div>
        }
        description={
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag
                color={getLeaveTypeColor(item?.typeOfLeave)}
                className="capitalize m-0">
                {item?.typeOfLeave}
              </Tag>
              <span className="text-xs text-gray-500 font-medium">
                {item?.daysAppliedFor} day{item?.daysAppliedFor > 1 ? "s" : ""}
              </span>
              {item?.status !== "pending" && item?.daysApproved && (
                <span className="text-xs text-green-600 font-medium">
                  (Approved: {item.daysApproved})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <CalendarOutlined />
              <span>{formatDateRange(item?.startDate, item?.endDate)}</span>
            </div>
            {item?.reason && (
              <p className="text-xs text-gray-500 m-0 line-clamp-2">
                {item.reason}
              </p>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  // Tab items configuration
  const tabItems = [
    {
      key: "pending",
      label: (
        <Space>
          <ClockCircleOutlined />
          Pending
          <Badge
            count={leavesByStatus.pending.length}
            showZero
            style={{ backgroundColor: "#faad14" }}
          />
        </Space>
      ),
    },
    {
      key: "approved",
      label: (
        <Space>
          <CheckCircleOutlined />
          Approved
          <Badge
            count={leavesByStatus.approved.length}
            showZero
            style={{ backgroundColor: "#52c41a" }}
          />
        </Space>
      ),
    },
    {
      key: "rejected",
      label: (
        <Space>
          <CloseCircleOutlined />
          Rejected
          <Badge
            count={leavesByStatus.rejected.length}
            showZero
            style={{ backgroundColor: "#ff4d4f" }}
          />
        </Space>
      ),
    },
    {
      key: "recent",
      label: (
        <Space>
          <BellOutlined />
          Recent
        </Space>
      ),
    },
  ];

  // Notification content
  const content = (
    <div style={{ width: 420, maxHeight: 550 }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold m-0 text-gray-800">
          Leave Applications
        </h3>
        <Space>
          <Tooltip title="Filter by type">
            <Button
              type="text"
              size="small"
              icon={<FilterOutlined />}
              onClick={() => {
                // Toggle filter visibility or show filter modal
              }}
            />
          </Tooltip>
          <Button
            type="text"
            size="small"
            onClick={() => fetchData("leaves/applications", "leaveApps")}
            loading={loadingLeaveApp.leaveApps}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Leave Type Filter */}
      {leaveTypes.length > 0 && (
        <div className="mb-3">
          <Segmented
            options={[
              { label: "All", value: "all" },
              ...leaveTypes.map((type) => ({
                label: type.charAt(0).toUpperCase() + type.slice(1),
                value: type,
              })),
            ]}
            value={filterType}
            onChange={setFilterType}
            size="small"
            block
          />
        </div>
      )}

      <Divider className="my-3" />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="small"
        className="leave-notification-tabs"
      />

      {/* Content Area */}
      <div className="mt-3">
        {loadingLeaveApp.leaveApps ? (
          <div className="text-center py-12">
            <Spin size="large" />
            <p className="text-gray-500 mt-3">Loading applications...</p>
          </div>
        ) : errorLeaveApp.leaveApps ? (
          <div className="text-center py-12">
            <Empty
              description={
                <div>
                  <p className="text-red-500 font-medium">Failed to load</p>
                  <p className="text-gray-500 text-sm">
                    {errorLeaveApp.leaveApps}
                  </p>
                </div>
              }
            />
          </div>
        ) : filteredLeaves.length > 0 ? (
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            <List
              itemLayout="vertical"
              dataSource={filteredLeaves}
              renderItem={renderLeaveItem}
              className="leave-notification-list"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p className="text-gray-700 font-medium">No applications</p>
                  <p className="text-gray-500 text-sm">
                    {filterType !== "all"
                      ? `No ${filterType} leave applications`
                      : `No ${activeTab} leave applications`}
                  </p>
                </div>
              }
            />
          </div>
        )}

        {/* View All Button */}
        {filteredLeaves.length > 0 && (
          <div className="text-center mt-3 pt-3 border-t">
            <Link
              to="/dashboard/staff/leave-application"
              onClick={() => setOpen(false)}>
              <Button type="link" block className="text-blue-600 font-medium">
                View All Applications →
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  // Only show for admin/HR users
  if (!isAdminOrHr) {
    return null;
  }

  const pendingCount = leavesByStatus.pending.length;
  const hasUrgent = leavesByStatus.pending.some((leave) => {
    const daysUntilStart = Math.floor(
      (new Date(leave.startDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilStart <= 3; // Urgent if starting within 3 days
  });

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      overlayClassName="leave-notification-popover"
      arrow={{ pointAtCenter: true }}>
      <Badge
        count={pendingCount}
        overflowCount={99}
        offset={[-8, 8]}
        className="cursor-pointer"
        status={hasUrgent ? "error" : "default"}>
        <Tooltip
          title={
            pendingCount > 0
              ? `${pendingCount} pending leave application${
                  pendingCount > 1 ? "s" : ""
                }`
              : "Leave Applications"
          }
          placement="bottom">
          <Button
            icon={
              <BellOutlined
                className={
                  pendingCount > 0
                    ? hasUrgent
                      ? "text-red-600 animate-shake"
                      : "text-blue-600 animate-ring"
                    : "text-gray-600"
                }
                style={{ fontSize: 20 }}
              />
            }
            shape="circle"
            size="large"
            className={`
              border-0 shadow-md hover:shadow-lg transition-all
              ${
                pendingCount > 0
                  ? hasUrgent
                    ? "bg-red-50 hover:bg-red-100"
                    : "bg-blue-50 hover:bg-blue-100"
                  : "bg-white hover:bg-gray-50"
              }
            `}
          />
        </Tooltip>
      </Badge>
    </Popover>
  );
};

export default LeaveNotification;
