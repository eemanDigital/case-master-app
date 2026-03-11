import React, { useState, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Select,
  Input,
  Pagination,
  Spin,
  Alert,
  Tabs,
  Modal,
  Tooltip,
  message,
  Dropdown,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  SafetyCertificateOutlined,
  RollbackOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { useUserManagement } from "../hooks/useUserManagement";
import avatar from "../assets/avatar.png";

const { Option } = Select;
const { Search } = Input;

// ─── Sub-components extracted to prevent re-render churn ────────────────────

const StatusBadge = ({ isActive }) =>
  isActive ? (
    <Tag icon={<CheckCircleOutlined />} color="success">
      Active
    </Tag>
  ) : (
    <Tag icon={<CloseCircleOutlined />} color="default">
      Inactive
    </Tag>
  );

const ROLE_COLORS = {
  "super-admin": "volcano",
  admin: "orange",
  hr: "magenta",
  lawyer: "geekblue",
  secretary: "cyan",
  client: "blue",
  user: "default",
};

const getRoleColor = (role) => ROLE_COLORS[role] || "default";

// ─── Statistics panel ────────────────────────────────────────────────────────

const StatsRow = ({ stats, statusFilter, usersCount, totalRecords }) => {
  if (!stats) return null;

  const activeLabel = statusFilter === "active" ? "Active" : "Inactive";
  const activeValue = statusFilter === "active" ? stats.active : stats.inactive;

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="Total"
            value={stats.total}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title={activeLabel}
            value={activeValue}
            valueStyle={{
              color: statusFilter === "active" ? "#52c41a" : "#fa8c16",
            }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="Active Rate"
            value={`${stats.activePercentage || 0}%`}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="Page Count"
            value={usersCount}
            suffix={`/ ${totalRecords || 0}`}
          />
        </Card>
      </Col>
    </Row>
  );
};

const OverallStatsRow = ({
  overall,
  statusFilter,
  usersCount,
  totalRecords,
}) => {
  if (!overall) return null;

  const activeValue =
    statusFilter === "active" ? overall.totalActive : overall.totalInactive;

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="Total Users" value={overall.grandTotal} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title={
              statusFilter === "active" ? "Active Total" : "Inactive Total"
            }
            value={activeValue}
            valueStyle={{
              color: statusFilter === "active" ? "#52c41a" : "#fa8c16",
            }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="Overall Active Rate"
            value={`${overall.overallActivePercentage || 0}%`}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="Page Count"
            value={usersCount}
            suffix={`/ ${totalRecords || 0}`}
          />
        </Card>
      </Col>
    </Row>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const UserManagement = ({
  defaultUserType = "all",
  defaultStatus = "active",
}) => {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes("/staff")) return "staff";
    if (location.pathname.includes("/clients")) return "clients";
    return defaultUserType;
  });
  const [statusFilter, setStatusFilter] = useState(defaultStatus);

  const {
    users,
    deletedUsers,
    loading,
    error,
    pagination,
    statistics,
    setUserType,
    setStatus,
    setSearch,
    handlePageChange,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
    refresh,
    fetchDeletedUsers,
  } = useUserManagement({
    initialUserType: activeTab,
    initialStatus: statusFilter,
  });

  // Sync hook state when tab or status changes
  useEffect(() => {
    setUserType(activeTab);
  }, [activeTab, setUserType]);

  useEffect(() => {
    setStatus(statusFilter);
  }, [statusFilter, setStatus]);

  // Fetch archived users when that tab is activated
  const handleTabChange = useCallback(
    (key) => {
      console.log("🔄 Tab changed to:", key);
      setActiveTab(key);
      if (key === "archived") {
        console.log("📥 Calling fetchDeletedUsers...");
        fetchDeletedUsers();
      }
    },
    [fetchDeletedUsers],
  );

  const handleStatusChange = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  // Support both live-search (onChange) and explicit submit (onSearch)
  const handleSearchChange = useCallback(
    (e) => {
      setSearch(e.target.value);
    },
    [setSearch],
  );

  const handleSearchSubmit = useCallback(
    (value) => {
      setSearch(value);
    },
    [setSearch],
  );

  const getTitle = useMemo(() => {
    const typeMap = {
      staff: "Staff Members",
      clients: "Clients",
      all: "All Users",
    };
    return `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} ${typeMap[activeTab] || "Users"}`;
  }, [activeTab, statusFilter]);

  // ─── Action handlers ───────────────────────────────────────────────────────

  const handleUserDelete = useCallback(
    (record) => {
      Modal.confirm({
        title: "Archive User",
        content: `Are you sure you want to archive ${record.firstName}? This action can be reversed by an admin.`,
        okText: "Yes, Archive",
        okType: "danger",
        onOk: async () => {
          const result = await handleDelete(record._id);
          if (result.success) {
            message.success(`${record.firstName} has been archived`);
          } else {
            message.error(result.error || "Failed to archive user");
          }
        },
      });
    },
    [handleDelete],
  );

  const handleUserRestore = useCallback(
    (record) => {
      Modal.confirm({
        title: "Restore User",
        content: `Are you sure you want to restore ${record.firstName}?`,
        okText: "Yes, Restore",
        onOk: async () => {
          const result = await handleRestore(record._id);
          if (result.success) {
            message.success(`${record.firstName} has been restored`);
          } else {
            message.error(result.error || "Failed to restore user");
          }
        },
      });
    },
    [handleRestore],
  );

  const handleUserPermanentDelete = useCallback(
    (record) => {
      Modal.confirm({
        title: "Permanent Delete",
        icon: <ExclamationCircleOutlined />,
        content: `This will permanently delete ${record.firstName}. This action cannot be undone.`,
        okText: "Delete Permanently",
        okType: "danger",
        onOk: async () => {
          const result = await handlePermanentDelete(record._id);
          if (result.success) {
            message.success(`${record.firstName} has been permanently deleted`);
          } else {
            message.error(result.error || "Failed to permanently delete user");
          }
        },
      });
    },
    [handlePermanentDelete],
  );

  // ─── Table columns ─────────────────────────────────────────────────────────

  // getActionMenu must be defined inside the component but OUTSIDE columns memo
  // to avoid recreating columns on every render
  const getActionMenu = useCallback(
    (record) => ({
      items: [
        {
          key: "view",
          label: (
            <Link to={`/dashboard/staff/${record._id}/details`}>
              <EyeOutlined /> View Profile
            </Link>
          ),
        },
        {
          key: "edit",
          label: (
            <Link to={`/dashboard/staff/${record._id}/edit`}>
              <EditOutlined /> Edit
            </Link>
          ),
        },
        { type: "divider" },
        {
          key: "delete",
          label: (
            <span style={{ color: "#ff4d4f" }}>
              <DeleteOutlined /> Archive
            </span>
          ),
          onClick: () => handleUserDelete(record),
        },
      ],
    }),
    [handleUserDelete],
  );

  const columns = useMemo(
    () =>
      [
        {
          title: "Photo",
          dataIndex: "photo",
          key: "photo",
          width: 60,
          render: (photo) => (
            <img
              className="w-10 h-10 object-cover rounded-full border border-gray-200"
              src={photo || avatar}
              alt="User"
            />
          ),
        },
        {
          title: "Name",
          key: "name",
          width: 220,
          render: (_, record) => {
            const surname = record.lastName || record.secondName || "";
            return (
              <div className="flex flex-col">
                <Tooltip title="Click to view full profile">
                  <Link
                    className="text-sm font-bold capitalize text-gray-800 hover:text-blue-600 flex items-center gap-1"
                    to={`/dashboard/staff/${record._id}/details`}>
                    {`${record.firstName} ${surname}`}
                    {record.isVerified && (
                      <SafetyCertificateOutlined className="text-blue-500 text-xs" />
                    )}
                  </Link>
                </Tooltip>
                {record.email && (
                  <span className="text-xs text-gray-500">{record.email}</span>
                )}
              </div>
            );
          },
        },
        {
          title: "Phone",
          dataIndex: "phone",
          key: "phone",
          width: 130,
          render: (phone) => phone || <span className="text-gray-300">—</span>,
        },
        activeTab !== "clients" && {
          title: "Role",
          dataIndex: "role",
          key: "role",
          width: 120,
          render: (role) => (
            <Tag color={getRoleColor(role)} className="capitalize rounded-md">
              {role?.replace("-", " ")}
            </Tag>
          ),
        },
        activeTab === "staff" && {
          title: "Position",
          key: "position",
          width: 150,
          render: (_, record) => (
            <span className="text-sm">
              {record.position || record.role || "N/A"}
            </span>
          ),
        },
        activeTab === "staff" && {
          title: "Practice Area",
          key: "practiceArea",
          width: 140,
          render: (_, record) =>
            record.isLawyer ? (
              <Tag color="purple">{record.practiceArea || "Lawyer"}</Tag>
            ) : (
              <span className="text-gray-300 text-xs">N/A</span>
            ),
        },
        {
          title: "Joined",
          dataIndex: "createdAt",
          key: "createdAt",
          width: 110,
          render: (date) => (
            <span className="text-xs text-gray-500">
              {dayjs(date).format("MMM D, YYYY")}
            </span>
          ),
        },
        {
          title: "Status",
          dataIndex: "isActive",
          key: "isActive",
          width: 100,
          render: (isActive) => <StatusBadge isActive={isActive} />,
        },
        {
          title: "Action",
          key: "action",
          width: 60,
          fixed: "right",
          render: (_, record) => (
            <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          ),
        },
      ].filter(Boolean), // remove false entries from conditional columns
    [activeTab, getActionMenu],
  );

  const deletedColumns = useMemo(
    () => [
      {
        title: "Name",
        key: "name",
        width: 220,
        render: (_, record) => {
          const surname = record.lastName || record.secondName || "";
          return (
            <Link
              className="text-sm font-bold capitalize text-gray-800"
              to={`/dashboard/staff/${record._id}/details`}>
              {`${record.firstName} ${surname}`}
            </Link>
          );
        },
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        width: 200,
      },
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        width: 120,
        render: (role) => (
          <Tag color={getRoleColor(role)} className="capitalize rounded-md">
            {role?.replace("-", " ")}
          </Tag>
        ),
      },
      {
        title: "Deleted At",
        dataIndex: "deletedAt",
        key: "deletedAt",
        width: 130,
        render: (date) => (
          <span className="text-xs text-gray-500">
            {date ? dayjs(date).format("MMM D, YYYY") : "N/A"}
          </span>
        ),
      },
      {
        title: "Action",
        key: "action",
        width: 100,
        render: (_, record) => (
          <Space>
            <Tooltip title="Restore">
              <Button
                type="text"
                icon={<RollbackOutlined />}
                onClick={() => handleUserRestore(record)}
              />
            </Tooltip>
            <Tooltip title="Permanent Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleUserPermanentDelete(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [handleUserRestore, handleUserPermanentDelete],
  );

  // ─── Tab items ─────────────────────────────────────────────────────────────

  const tabItems = useMemo(
    () => [
      {
        key: "staff",
        label: (
          <span>
            <TeamOutlined /> Staff
          </span>
        ),
        children: (
          <StatsRow
            stats={statistics?.staff}
            statusFilter={statusFilter}
            usersCount={users.length}
            totalRecords={pagination?.totalRecords}
          />
        ),
      },
      {
        key: "clients",
        label: (
          <span>
            <UserOutlined /> Clients
          </span>
        ),
        children: (
          <StatsRow
            stats={statistics?.clients}
            statusFilter={statusFilter}
            usersCount={users.length}
            totalRecords={pagination?.totalRecords}
          />
        ),
      },
      {
        key: "all",
        label: (
          <span>
            <TeamOutlined />
            <UserOutlined /> All Users
          </span>
        ),
        children: (
          <OverallStatsRow
            overall={statistics?.overall}
            statusFilter={statusFilter}
            usersCount={users.length}
            totalRecords={pagination?.totalRecords}
          />
        ),
      },
      {
        key: "archived",
        label: (
          <span>
            <DeleteOutlined /> Archived
          </span>
        ),
        children: null,
      },
    ],
    [statistics, statusFilter, users.length, pagination?.totalRecords],
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <TeamOutlined className="text-blue-500" />
            User Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage all users — staff, clients, and their permissions
          </p>
        </div>

        {/* Filters toolbar */}
        <Card className="mb-6 shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  style={{ width: 130 }}>
                  <Option value="active">
                    <CheckCircleOutlined className="text-green-500 mr-2" />
                    Active
                  </Option>
                  <Option value="inactive">
                    <CloseCircleOutlined className="text-gray-500 mr-2" />
                    Inactive
                  </Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              {/* Wire both onChange (live search) and onSearch (enter/button) */}
              <Search
                placeholder="Search users..."
                allowClear
                enterButton={<SearchOutlined />}
                onChange={handleSearchChange}
                onSearch={handleSearchSubmit}
                loading={loading}
              />
            </Col>

            <Col xs={24} sm={24} md={8} className="flex justify-end gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}>
                Refresh
              </Button>
              <Link to="/dashboard/staff/add">
                <Button type="primary" icon={<UserOutlined />}>
                  Add User
                </Button>
              </Link>
            </Col>
          </Row>
        </Card>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          className="mb-6"
          type="card"
          items={tabItems}
        />

        {/* Error */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            className="mb-6"
          />
        )}

        {/* Active / Inactive users table */}
        {activeTab !== "archived" ? (
          <>
            {console.log("🔍 Main tab, users:", users)}
            <Card
              title={
                <div className="flex items-center">
                  {getTitle}
                  <span className="text-gray-500 text-sm font-normal ml-4">
                    ({pagination?.totalRecords || 0} total)
                  </span>
                </div>
              }
              className="shadow-sm"
              extra={
                <span className="text-gray-500 text-sm">
                  Page {pagination?.currentPage || 1} of{" "}
                  {pagination?.totalPages || 1}
                </span>
              }>
              {loading ? (
                <div className="text-center py-12">
                  <Spin size="large" tip={`Loading ${getTitle}...`} />
                </div>
              ) : (
                <>
                  <Table
                    dataSource={users}
                    columns={columns}
                    scroll={{ x: 1200 }}
                    pagination={false}
                    rowKey="_id"
                  />
                  {!users.length && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">
                        No {statusFilter} {activeTab} found
                      </p>
                    </div>
                  )}
                </>
              )}
            </Card>

            {pagination?.totalRecords > 0 && (
              <Row justify="center" className="mt-6">
                <Pagination
                  current={pagination?.currentPage || 1}
                  total={pagination?.totalRecords || 0}
                  pageSize={pagination?.limit || 10}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}–${range[1]} of ${total} items`
                  }
                  pageSizeOptions={["10", "20", "50", "100"]}
                  disabled={loading}
                />
              </Row>
            )}
          </>
        ) : (
          /* Archived users table */
          <Card title="Archived Users" className="shadow-sm">
            {console.log("🔍 Rendering archived tab, deletedUsers:", deletedUsers)}
            <Table
              dataSource={deletedUsers}
              columns={deletedColumns}
              scroll={{ x: 800 }}
              loading={loading}
              pagination={false}
              rowKey="_id"
              locale={{ emptyText: "No archived users" }}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

UserManagement.propTypes = {
  defaultUserType: PropTypes.oneOf(["all", "staff", "clients"]),
  defaultStatus: PropTypes.oneOf(["active", "inactive"]),
};

UserManagement.defaultProps = {
  defaultUserType: "all",
  defaultStatus: "active",
};

export default UserManagement;
