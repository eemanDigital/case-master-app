import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Popover,
  List,
  Button,
  Tooltip,
  Tag,
  Empty,
  Spin,
  Divider,
  Avatar,
} from "antd";
import {
  BellOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";

const LeaveNotification = () => {
  const {
    leaveApps,
    loading: loadingLeaveApp,
    error: errorLeaveApp,
    fetchData,
  } = useDataGetterHook();

  const [refreshKey, setRefreshKey] = useState(0);
  const [popoverVisible, setPopoverVisible] = useState(false);

  useEffect(() => {
    if (popoverVisible) {
      fetchData("leaves/applications", "leaveApps");
    }
  }, [refreshKey, popoverVisible]);

  // Safe filtering with proper error handling
  const pendingLeaves = useMemo(() => {
    if (!leaveApps) return [];

    // Handle different response structures
    let applications = [];
    if (Array.isArray(leaveApps.data)) {
      applications = leaveApps.data;
    } else if (Array.isArray(leaveApps.data?.data)) {
      applications = leaveApps.data.data;
    } else if (Array.isArray(leaveApps)) {
      applications = leaveApps;
    }

    return applications
      .filter((leave) => leave?.status === "pending")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by creation date
  }, [leaveApps]);

  // Get urgent leaves (starting within 3 days)
  const urgentLeaves = useMemo(() => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    return pendingLeaves.filter((leave) => {
      const startDate = new Date(leave.startDate);
      return startDate <= threeDaysFromNow;
    });
  }, [pendingLeaves]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: "blue",
      casual: "green",
      sick: "orange",
      maternity: "pink",
      paternity: "cyan",
      compassionate: "purple",
      unpaid: "gray",
    };
    return colors[type] || "default";
  };

  const isLeaveUrgent = (leave) => {
    const startDate = new Date(leave.startDate);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return startDate <= threeDaysFromNow;
  };

  const getDaysUntilLeave = (leave) => {
    const startDate = new Date(leave.startDate);
    const today = new Date();
    const diffTime = startDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const notificationContent = (
    <div className="w-96 max-h-96">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <BellOutlined className="text-blue-500" />
          <span className="font-semibold text-gray-800">
            Pending Leave Applications
          </span>
        </div>
        <div className="flex items-center gap-2">
          {urgentLeaves.length > 0 && (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>
              {urgentLeaves.length} Urgent
            </Tag>
          )}
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loadingLeaveApp.leaveApps}
            type="text"
          />
        </div>
      </div>

      {/* Urgent Leaves Section */}
      {urgentLeaves.length > 0 && (
        <div className="border-b">
          <div className="p-2 bg-red-50">
            <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
              <ExclamationCircleOutlined />
              <span>Urgent - Starting Soon</span>
            </div>
          </div>
          <List
            size="small"
            dataSource={urgentLeaves.slice(0, 3)}
            renderItem={(item) => (
              <LeaveNotificationItem
                item={item}
                isUrgent={true}
                daysUntil={getDaysUntilLeave(item)}
              />
            )}
          />
          {urgentLeaves.length > 3 && (
            <div className="text-center p-1 bg-red-50">
              <span className="text-xs text-red-600">
                +{urgentLeaves.length - 3} more urgent applications
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loadingLeaveApp.leaveApps ? (
        <div className="flex flex-col justify-center items-center p-6">
          <Spin size="default" />
          <span className="mt-2 text-gray-500 text-sm">
            Loading applications...
          </span>
        </div>
      ) : errorLeaveApp.leaveApps ? (
        <div className="text-center p-6">
          <ExclamationCircleOutlined className="text-red-500 text-2xl mb-2" />
          <div className="text-red-500 font-medium">
            Failed to load notifications
          </div>
          <div className="text-gray-500 text-sm mb-3">
            {errorLeaveApp.leaveApps.message || "Please try again"}
          </div>
          <Button
            size="small"
            type="primary"
            onClick={handleRefresh}
            icon={<ReloadOutlined />}>
            Try Again
          </Button>
        </div>
      ) : pendingLeaves.length > 0 ? (
        <>
          <List
            size="small"
            dataSource={pendingLeaves
              .filter((leave) => !isLeaveUrgent(leave))
              .slice(0, 10 - Math.min(urgentLeaves.length, 3))}
            renderItem={(item) => (
              <LeaveNotificationItem
                item={item}
                isUrgent={false}
                daysUntil={getDaysUntilLeave(item)}
              />
            )}
            className="max-h-64 overflow-y-auto"
          />

          {pendingLeaves.length > 10 && (
            <div className="text-center p-3 border-t bg-gray-50">
              <Link to="/leaves/applications?status=pending">
                <Button type="link" size="small">
                  View all {pendingLeaves.length} pending applications
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="text-gray-500">
              <div>No pending leave applications</div>
              <div className="text-xs mt-1">All caught up!</div>
            </div>
          }
          className="py-8"
        />
      )}

      {/* Footer */}
      <Divider className="my-2" />
      <div className="flex justify-between items-center px-3 pb-2">
        <span className="text-xs text-gray-500">
          {pendingLeaves.length} pending
        </span>
        <Link to="/leaves/applications/create">
          <Button type="link" size="small" className="text-xs">
            + New Application
          </Button>
        </Link>
      </div>
    </div>
  );

  // Individual notification item component
  const LeaveNotificationItem = ({ item, isUrgent, daysUntil }) => (
    <List.Item
      className={`hover:bg-gray-50 px-3 py-2 border-b border-gray-100 ${
        isUrgent ? "bg-orange-50 hover:bg-orange-100" : ""
      }`}
      actions={[
        <Link
          to={`/leaves/applications/${item._id || item.id}`}
          key="view"
          className="text-xs">
          <Button type="link" size="small" className="text-blue-600">
            Review
          </Button>
        </Link>,
      ]}>
      <List.Item.Meta
        avatar={
          <Avatar
            size="small"
            src={item.employee?.photo}
            icon={<UserOutlined />}
            className={isUrgent ? "border border-red-300" : ""}
          />
        }
        title={
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">
              {item.employee?.firstName} {item.employee?.lastName}
            </span>
            {isUrgent && (
              <Tag color="red" size="small">
                {daysUntil === 0 ? "Today" : `${daysUntil}d`}
              </Tag>
            )}
          </div>
        }
        description={
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1">
              <Tag
                color={getLeaveTypeColor(item.typeOfLeave)}
                className="text-xs capitalize m-0">
                {item.typeOfLeave}
              </Tag>
              <span className="text-gray-400">•</span>
              <span>{item.daysAppliedFor || item.daysAppliedFor} days</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <CalendarOutlined className="text-xs" />
              <span>
                {formatDate(item.startDate)} → {formatDate(item.endDate)}
              </span>
            </div>
            {item.reason && (
              <div className="truncate" title={item.reason}>
                "{item.reason?.substring(0, 60)}..."
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-400">
              <ClockCircleOutlined className="text-xs" />
              <span>Applied {formatDate(item.createdAt, "relative")}</span>
            </div>
          </div>
        }
      />
    </List.Item>
  );

  const badgeCount = pendingLeaves.length > 99 ? "99+" : pendingLeaves.length;

  // return
  <Popover
    content={notificationContent}
    title={null}
    trigger="click"
    placement="bottomRight"
    overlayClassName="leave-notification-popover"
    open={popoverVisible}
    onOpenChange={(visible) => {
      setPopoverVisible(visible);
      if (visible) {
        handleRefresh(); // Refresh data when popover opens
      }
    }}
    overlayStyle={{
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    }}>
    <Badge
      count={badgeCount}
      overflowCount={99}
      size="small"
      className="cursor-pointer"
      offset={[-2, 2]}
      style={{
        backgroundColor: urgentLeaves.length > 0 ? "#ff4d4f" : "#1890ff",
      }}>
      <Tooltip title={`${pendingLeaves.length} pending leave applications`}>
        <Button
          icon={<BellOutlined />}
          shape="circle"
          size="large"
          className={`shadow-md hover:shadow-lg transition-all duration-200 ${
            pendingLeaves.length > 0
              ? urgentLeaves.length > 0
                ? "text-red-500 border-red-200 bg-red-50 hover:bg-red-100"
                : "text-orange-500 border-orange-200 bg-orange-50 hover:bg-orange-100"
              : "text-gray-400 border-gray-200 bg-white hover:bg-gray-50"
          }`}
        />
      </Tooltip>
    </Badge>
  </Popover>;
};

export default LeaveNotification;
