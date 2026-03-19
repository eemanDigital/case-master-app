import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  Avatar,
  Tooltip,
  Dropdown,
  Row,
  Col,
  message,
  Empty,
  Alert,
  Spin,
  Badge,
  Progress,
  Statistic,
  Modal,
  Select,
  DatePicker,
  Segmented,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  SyncOutlined,
  StopOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  SortAscendingOutlined,
  AppstoreOutlined,
  BarsOutlined,
  RightOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  fetchRetainerMatters,
  deleteRetainerDetails,
  restoreRetainerDetails,
  fetchRetainerStats,
  fetchExpiringRetainers,
} from "../../redux/features/retainer/retainerSlice";

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { confirm } = Modal;

const RetainerList = React.memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const retainers = useSelector((state) => state.retainer.matters);
  const loading = useSelector((state) => state.retainer.loading);
  const pagination = useSelector((state) => state.retainer.pagination);
  const stats = useSelector((state) => state.retainer.stats);
  const statsLoading = useSelector((state) => state.retainer.statsLoading);
  const expiringRetainers = useSelector((state) => state.retainer.expiringRetainers);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [activeFilter, setActiveFilter] = useState("all");

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    dispatch(fetchRetainerMatters());
    dispatch(fetchRetainerStats());
    dispatch(fetchExpiringRetainers({ days: 60 }));
  }, [dispatch]);

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    dispatch(fetchRetainerMatters({ search: value }));
  }, [dispatch]);

  const handleTableChange = useCallback((paginationConfig, filters, sorter) => {
    dispatch(
      fetchRetainerMatters({
        page: paginationConfig.current,
        limit: paginationConfig.pageSize,
        sortBy: sorter.field,
        sortOrder: sorter.order,
        ...filters,
      }),
    );
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchRetainerMatters());
    dispatch(fetchRetainerStats());
    dispatch(fetchExpiringRetainers({ days: 60 }));
    message.success("Data refreshed");
  }, [dispatch]);

  const handleViewDetails = useCallback((matterId) => {
    navigate(`/dashboard/matters/retainers/${matterId}/details`);
  }, [navigate]);

  const handleEdit = useCallback((matterId) => {
    navigate(`/dashboard/matters/retainers/${matterId}/edit`);
  }, [navigate]);

  const handleDelete = useCallback(async (matterId) => {
    confirm({
      title: "Delete Retainer",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to delete this retainer?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await dispatch(deleteRetainerDetails(matterId)).unwrap();
          message.success("Retainer deleted successfully");
          dispatch(fetchRetainerMatters());
        } catch (error) {
          message.error(error.message || "Failed to delete retainer");
        }
      },
    });
  }, [dispatch]);

  const handleRestore = useCallback(async (matterId) => {
    try {
      await dispatch(restoreRetainerDetails(matterId)).unwrap();
      message.success("Retainer restored successfully");
      dispatch(fetchRetainerMatters());
    } catch (error) {
      message.error(error.message || "Failed to restore retainer");
    }
  }, [dispatch]);

  const handleCreateMatter = useCallback(() => {
    const returnPath = `/dashboard/matters/retainers/:matterId/create`;
    navigate(
      `/dashboard/matters/create?type=retainer&returnTo=${encodeURIComponent(returnPath)}`
    );
  }, [navigate]);

  const getStatusColor = useCallback((status) => {
    const colors = {
      active: "success",
      inactive: "default",
      expired: "error",
      pending: "processing",
      terminated: "default",
    };
    return colors[status] || "default";
  }, []);

  const getExpiryStatus = useCallback((endDate) => {
    if (!endDate) return { color: "default", text: "N/A", urgency: 0 };
    const daysRemaining = dayjs(endDate).diff(dayjs(), "day");
    if (daysRemaining < 0) return { color: "error", text: "Expired", urgency: 3 };
    if (daysRemaining <= 7) return { color: "warning", text: `${Math.abs(daysRemaining)}d overdue`, urgency: 3 };
    if (daysRemaining <= 30) return { color: "warning", text: `${daysRemaining}d left`, urgency: 2 };
    return { color: "success", text: `${daysRemaining}d`, urgency: 1 };
  }, []);

  const formatRetainerType = useCallback((type) => {
    if (!type) return "Standard";
    return type.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }, []);

  const filteredRetainers = useMemo(() => {
    if (activeFilter === "all") return retainers;
    return retainers.filter(r => r.status === activeFilter);
  }, [retainers, activeFilter]);

  const overview = useMemo(() => stats?.overview || {}, [stats?.overview]);
  const revenue = useMemo(() => stats?.revenue || {}, [stats?.revenue]);

  const statCards = useMemo(() => [
    {
      title: "Total",
      value: overview.totalRetainerMatters || 0,
      icon: <FileTextOutlined />,
      color: "#6366f1",
      bgGradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    },
    {
      title: "Active",
      value: overview.activeRetainerMatters || 0,
      icon: <CheckCircleOutlined />,
      color: "#10b981",
      bgGradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
    },
    {
      title: "Pending",
      value: overview.pendingRetainerMatters || 0,
      icon: <ClockCircleOutlined />,
      color: "#f59e0b",
      bgGradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    },
    {
      title: "Expiring",
      value: stats?.expiringSoon || 0,
      icon: <WarningOutlined />,
      color: "#ef4444",
      bgGradient: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
    },
  ], [overview, stats?.expiringSoon]);

  const columns = useMemo(() => [
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 250,
      fixed: !isMobile ? "left" : false,
      sorter: true,
      render: (client) => {
        const displayName = client?.companyName || `${client?.firstName || ""} ${client?.lastName || ""}`.trim() || "N/A";
        const initial = client?.companyName?.charAt(0) || client?.firstName?.charAt(0) || "C";
        return (
          <Space className="w-full">
            <Avatar style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }} icon={<UserOutlined />}>
              {initial}
            </Avatar>
            <div className="min-w-0 flex-1">
              <Text strong className="block truncate">{displayName}</Text>
              <Text type="secondary" className="text-xs truncate block">{client?.email || ""}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Matter",
      dataIndex: "matterNumber",
      key: "matterNumber",
      width: 120,
      sorter: true,
      render: (text) => (
        <Tag className="font-mono bg-indigo-50 text-indigo-700 border-indigo-200">
          {text || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: ["retainerDetail", "retainerType"],
      key: "retainerType",
      width: 150,
      filters: [
        { text: "General Legal", value: "general-legal" },
        { text: "Company Secretarial", value: "company-secretarial" },
        { text: "Retainer Deposit", value: "retainer-deposit" },
        { text: "Specialized", value: "specialized" },
      ],
      render: (type) => {
        const colors = {
          "general-legal": "blue",
          "company-secretarial": "purple",
          "retainer-deposit": "green",
          specialized: "orange",
        };
        return <Tag color={colors[type] || "default"}>{formatRetainerType(type)}</Tag>;
      },
    },
    {
      title: "Fee",
      dataIndex: ["retainerDetail", "billing", "retainerFee"],
      key: "retainerFee",
      width: 130,
      align: "right",
      sorter: true,
      render: (fee) => (
        <Text strong className="text-emerald-600">
          {fee !== undefined && fee !== null ? `₦${Number(fee).toLocaleString()}` : "N/A"}
        </Text>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      width: 150,
      render: (_, record) => {
        const start = record.retainerDetail?.agreementStartDate;
        const end = record.retainerDetail?.agreementEndDate;
        if (!start) return <Text type="secondary">N/A</Text>;
        return (
          <div className="w-full">
            <Text type="secondary" className="text-xs">
              {dayjs(start).format("DD MMM YYYY")}
            </Text>
            <br />
            <Text className="text-xs text-gray-400">to {end ? dayjs(end).format("DD MMM YYYY") : "Ongoing"}</Text>
          </div>
        );
      },
    },
    {
      title: "Days Left",
      key: "daysRemaining",
      width: 100,
      align: "center",
      sorter: (a, b) => {
        const aDate = a.retainerDetail?.agreementEndDate;
        const bDate = b.retainerDetail?.agreementEndDate;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return dayjs(aDate).diff(dayjs(), "day") - dayjs(bDate).diff(dayjs(), "day");
      },
      render: (_, record) => {
        const endDate = record.retainerDetail?.agreementEndDate;
        const expiry = getExpiryStatus(endDate);
        const progress = endDate ? Math.max(0, Math.min(100, (dayjs(endDate).diff(dayjs(), "day") / 365) * 100)) : 100;
        return (
          <Tooltip title={expiry.text}>
            <Progress
              percent={progress}
              size="small"
              strokeColor={expiry.color === "error" ? "#ef4444" : expiry.color === "warning" ? "#f59e0b" : "#10b981"}
              trailColor="#f3f4f6"
              showInfo={false}
              className="w-16"
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
        { text: "Expired", value: "expired" },
        { text: "Pending", value: "pending" },
      ],
      render: (status) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {status || "N/A"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      fixed: !isMobile ? "right" : false,
      render: (_, record) => {
        const items = [
          { key: "view", label: "View Details", icon: <EyeOutlined />, onClick: () => handleViewDetails(record._id) },
          { key: "edit", label: "Edit", icon: <EditOutlined />, onClick: () => handleEdit(record._id), disabled: !record.retainerDetail },
          { type: "divider" },
          { key: "renew", label: "Renew", icon: <SyncOutlined />, onClick: () => handleViewDetails(record._id), disabled: !record.retainerDetail },
          { key: "terminate", label: "Terminate", icon: <StopOutlined />, danger: true, onClick: () => handleViewDetails(record._id), disabled: !record.retainerDetail },
          { type: "divider" },
          { key: "delete", label: record.isDeleted ? "Restore" : "Delete", icon: record.isDeleted ? <ReloadOutlined /> : <StopOutlined />, danger: !record.isDeleted, onClick: () => record.isDeleted ? handleRestore(record._id) : handleDelete(record._id) },
        ];
        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        );
      },
    },
  ], [isMobile, formatRetainerType, getExpiryStatus, getStatusColor, handleViewDetails, handleEdit, handleDelete, handleRestore]);

  const rowSelection = useMemo(() => ({
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  }), [selectedRowKeys]);

  const renderRetainerCard = useCallback((record) => {
    const client = record.client;
    const displayName = client?.companyName || `${client?.firstName || ""} ${client?.lastName || ""}`.trim() || "N/A";
    const initial = client?.companyName?.charAt(0) || client?.firstName?.charAt(0) || "C";
    const endDate = record.retainerDetail?.agreementEndDate;
    const expiry = getExpiryStatus(endDate);
    const fee = record.retainerDetail?.billing?.retainerFee;
    const daysRemaining = endDate ? dayjs(endDate).diff(dayjs(), "day") : null;

    return (
      <Card
        key={record._id}
        className="mb-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md"
        onClick={() => handleViewDetails(record._id)}
        styles={{ body: { padding: isMobile ? 12 : 20 } }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar size={isMobile ? 40 : 48} style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }} icon={<UserOutlined />}>
              {initial}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Text strong className="text-base truncate">{displayName}</Text>
                <Tag className="font-mono text-xs">{record.matterNumber || "N/A"}</Tag>
              </div>
              <Text type="secondary" className="text-sm truncate block">{record.title || "No title"}</Text>
              <Space className="mt-2" size="small">
                <Tag color={record.retainerDetail?.retainerType === "general-legal" ? "blue" : record.retainerDetail?.retainerType === "company-secretarial" ? "purple" : "green"}>
                  {formatRetainerType(record.retainerDetail?.retainerType)}
                </Tag>
                <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
              </Space>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <Text strong className="text-emerald-600 text-lg block">
              {fee !== undefined && fee !== null ? `₦${Number(fee).toLocaleString()}` : "N/A"}
            </Text>
            <div className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium inline-block ${
              daysRemaining !== null && daysRemaining <= 7 ? "bg-red-100 text-red-700" :
              daysRemaining !== null && daysRemaining <= 30 ? "bg-amber-100 text-amber-700" :
              "bg-green-100 text-green-700"
            }`}>
              {expiry.text}
            </div>
          </div>
        </div>
        {endDate && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{dayjs(record.retainerDetail?.agreementStartDate).format("DD MMM YYYY")} → {dayjs(endDate).format("DD MMM YYYY")}</span>
              <RightOutlined className="text-indigo-400" />
            </div>
          </div>
        )}
      </Card>
    );
  }, [isMobile, getExpiryStatus, formatRetainerType, getStatusColor, handleViewDetails]);

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Title level={isMobile ? 3 : 2} className="!mb-1 flex items-center gap-2">
                <FileTextOutlined className="text-indigo-500" />
                Retainer Agreements
              </Title>
              <Text type="secondary">{pagination?.totalRecords || 0} total retainer(s)</Text>
            </div>
            <Space wrap className="justify-end">
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                {!isMobile && "Refresh"}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateMatter}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0"
                size="large">
                {isMobile ? "New" : "New Matter"}
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          {statCards.map((stat, index) => (
            <Col xs={12} sm={12} md={6} key={index}>
              <Card
                className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative"
                styles={{ body: { padding: "16px 20px" } }}
              >
                <div
                  className="absolute inset-0 opacity-5"
                  style={{ background: stat.bgGradient }}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <Text type="secondary" className="text-xs font-medium uppercase tracking-wider">
                      {stat.title}
                    </Text>
                    <div className="text-2xl sm:text-3xl font-bold mt-1" style={{ color: stat.color }}>
                      {statsLoading ? <Spin size="small" /> : stat.value}
                    </div>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ background: stat.bgGradient }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Filter & Search Bar */}
        <Card className="mb-6 border-0 shadow-md" styles={{ body: { padding: isMobile ? 12 : 20 } }}>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
              <Segmented
                options={[
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Pending", value: "pending" },
                  { label: "Expired", value: "expired" },
                ]}
                value={activeFilter}
                onChange={setActiveFilter}
                size={isMobile ? "small" : "middle"}
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Search
                placeholder="Search clients, matters..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                className="flex-1 lg:w-80"
                onSearch={handleSearch}
                loading={loading}
              />
              {!isMobile && (
                <Space>
                  <Tooltip title="Table View">
                    <Button
                      type={viewMode === "table" ? "primary" : "default"}
                      icon={<BarsOutlined />}
                      onClick={() => setViewMode("table")}
                    />
                  </Tooltip>
                  <Tooltip title="Card View">
                    <Button
                      type={viewMode === "card" ? "primary" : "default"}
                      icon={<AppstoreOutlined />}
                      onClick={() => setViewMode("card")}
                    />
                  </Tooltip>
                </Space>
              )}
            </div>
          </div>
        </Card>

        {/* Alerts */}
        {selectedRowKeys.length > 0 && (
          <Alert
            message={`${selectedRowKeys.length} retainer(s) selected`}
            type="info"
            showIcon
            className="mb-4"
            action={
              <Button size="small" type="primary">Bulk Operations</Button>
            }
            closable
            onClose={() => setSelectedRowKeys([])}
          />
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Retainers List */}
          <div className={isMobile ? "col-span-1" : "xl:col-span-3"}>
            {viewMode === "table" ? (
              <Card className="border-0 shadow-lg" styles={{ body: { padding: 0 } }}>
                <Table
                  columns={columns}
                  dataSource={filteredRetainers}
                  rowKey={(record) => record._id}
                  loading={loading}
                  rowSelection={isMobile ? undefined : rowSelection}
                  onChange={handleTableChange}
                  pagination={{
                    current: pagination?.currentPage || 1,
                    pageSize: pagination?.pageSize || 50,
                    total: pagination?.totalRecords || 0,
                    showSizeChanger: !isMobile,
                    showTotal: (total) => `Total ${total} retainer(s)`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    size: isMobile ? "small" : "default",
                  }}
                  scroll={{ x: 1200 }}
                  size={isMobile ? "small" : "middle"}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div className="text-center py-8">
                            <Text type="secondary" className="block mb-4">No retainer agreements found</Text>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={handleCreateMatter}
                              size="large"
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0">
                              Create First Retainer
                            </Button>
                          </div>
                        }
                      />
                    ),
                  }}
                />
              </Card>
            ) : (
              <div>
                {filteredRetainers.length === 0 ? (
                  <Card className="border-0 shadow-lg">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div className="text-center py-8">
                          <Text type="secondary" className="block mb-4">No retainer agreements found</Text>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreateMatter}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0">
                            Create First Retainer
                          </Button>
                        </div>
                      }
                    />
                  </Card>
                ) : (
                  filteredRetainers.map(renderRetainerCard)
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Expiring Retainers */}
          {!isMobile && (
            <div className="col-span-1">
              <Card
                title={
                  <Space>
                    <BellOutlined className="text-amber-500" />
                    <span>Expiring Soon</span>
                    {expiringRetainers?.length > 0 && (
                      <Badge count={expiringRetainers.length} style={{ backgroundColor: "#ef4444" }} />
                    )}
                  </Space>
                }
                className="border-0 shadow-lg sticky top-24"
                extra={
                  <Button
                    type="text"
                    size="small"
                    icon={<SyncOutlined />}
                    onClick={() => dispatch(fetchExpiringRetainers({ days: 60 }))}
                  />
                }
              >
                {expiringRetainers?.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No expiring retainers"
                  />
                ) : (
                  <div className="space-y-3">
                    {expiringRetainers?.slice(0, 5).map((item) => {
                      const endDate = item.retainerDetail?.agreementEndDate;
                      const daysRemaining = endDate ? dayjs(endDate).diff(dayjs(), "day") : null;
                      const client = item.client;
                      const displayName = client?.companyName || `${client?.firstName || ""} ${client?.lastName || ""}`.trim() || "N/A";

                      return (
                        <div
                          key={item._id}
                          className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(item._id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <Text strong className="block truncate">{displayName}</Text>
                              <Text type="secondary" className="text-xs block truncate">{item.matterNumber || "N/A"}</Text>
                            </div>
                            <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              daysRemaining !== null && daysRemaining <= 7 ? "bg-red-100 text-red-700" :
                              daysRemaining !== null && daysRemaining <= 30 ? "bg-amber-100 text-amber-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {daysRemaining !== null && daysRemaining < 0 ? "Expired" :
                               daysRemaining !== null && daysRemaining <= 7 ? `${Math.abs(daysRemaining)}d overdue` :
                               `${daysRemaining}d left`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {expiringRetainers?.length > 5 && (
                      <Button type="link" block onClick={() => navigate("/dashboard/matters/retainers")}>
                        View All {expiringRetainers.length} Expiring Retainers
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

RetainerList.displayName = "RetainerList";

export default RetainerList;
