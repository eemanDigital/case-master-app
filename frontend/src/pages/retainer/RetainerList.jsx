import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  DatePicker,
  message,
  Tooltip,
  Popconfirm,
  Badge,
  Dropdown,
  Statistic,
  Progress,
  Divider,
  Typography,
  Avatar,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  MailOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  HistoryOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// FIXED: Single import source
import {
  fetchRetainerMatters,
  searchRetainerMatters,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  bulkUpdateRetainerMatters,
  fetchRetainerStats,
  fetchExpiringRetainers,
  fetchPendingRequests,
  selectRetainerMatters,
  selectPagination,
  selectFilters,
  selectRetainerLoading,
  selectActionLoading,
  selectRetainerStats,
  selectExpiringRetainers,
  selectPendingRequests,
} from "../../redux/features/retainer/retainerSlice";

dayjs.extend(relativeTime);
const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const RetainerList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false);
  const [expiringFilterDays, setExpiringFilterDays] = useState("");

  const matters = useSelector(selectRetainerMatters);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const loading = useSelector(selectRetainerLoading);
  const actionLoading = useSelector(selectActionLoading);
  const stats = useSelector(selectRetainerStats);
  const expiringRetainers = useSelector(selectExpiringRetainers);
  const pendingRequests = useSelector(selectPendingRequests);

  // FIXED: Stats fetch once on mount only
  useEffect(() => {
    dispatch(fetchRetainerStats());
    dispatch(fetchExpiringRetainers({ days: 30 }));
    dispatch(fetchPendingRequests({ limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchRetainerMatters({
        page: pagination.currentPage,
        limit: pagination.pageSize,
        ...filters,
        expiringInDays: expiringFilterDays || undefined,
      }),
    );
  }, [
    dispatch,
    pagination.currentPage,
    pagination.pageSize,
    filters,
    expiringFilterDays,
  ]);

  const handleTableChange = useCallback(
    (newPagination, tableFilters, sorter) => {
      const params = {
        page: newPagination.current,
        limit: newPagination.pageSize,
        ...filters,
      };
      if (sorter.field) {
        params.sort =
          sorter.order === "descend" ? `-${sorter.field}` : sorter.field;
      }
      dispatch(setCurrentPage(newPagination.current));
      dispatch(setPageSize(newPagination.pageSize));
      dispatch(fetchRetainerMatters(params));
    },
    [dispatch, filters],
  );

  const handleSearch = useCallback(
    (value) => {
      if (value) {
        dispatch(
          searchRetainerMatters({
            criteria: {
              $or: [
                { matterNumber: { $regex: value, $options: "i" } },
                { title: { $regex: value, $options: "i" } },
                { "client.firstName": { $regex: value, $options: "i" } },
                { "client.lastName": { $regex: value, $options: "i" } },
                { "client.companyName": { $regex: value, $options: "i" } },
                {
                  "accountOfficer.firstName": { $regex: value, $options: "i" },
                },
                { "accountOfficer.lastName": { $regex: value, $options: "i" } },
              ],
            },
            options: { page: 1, limit: pagination.pageSize },
          }),
        );
        dispatch(setCurrentPage(1));
      } else {
        dispatch(fetchRetainerMatters({ page: 1, limit: pagination.pageSize }));
      }
    },
    [dispatch, pagination.pageSize],
  );

  const handleFilterChange = useCallback(
    (key, value) => {
      dispatch(setFilters({ [key]: value }));
      dispatch(setCurrentPage(1));
    },
    [dispatch],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    setSearchText("");
    setExpiringFilterDays("");
  }, [dispatch]);

  const calculateRetainerHealth = useCallback((retainer) => {
    if (!retainer?.retainerDetail)
      return { health: "unknown", utilization: 0, daysToExpiry: 0 };
    const { servicesIncluded = [], agreementEndDate } = retainer.retainerDetail;
    const totalAllocated = servicesIncluded.reduce(
      (sum, s) => sum + (s.serviceLimit || 0),
      0,
    );
    const totalUsed = servicesIncluded.reduce(
      (sum, s) => sum + (s.usageCount || 0),
      0,
    );
    const utilizationRate =
      totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;
    const daysToExpiry = dayjs(agreementEndDate).diff(dayjs(), "days");
    let health = "healthy";
    if (utilizationRate >= 90) health = "overutilized";
    else if (utilizationRate <= 20) health = "underutilized";
    else if (daysToExpiry <= 30) health = "expiring";
    return { health, utilization: utilizationRate, daysToExpiry };
  }, []);

  const formatCurrency = useCallback((amount, currency = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }, []);

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedRows.map((row) => row._id),
      onChange: (_, rows) => setSelectedRows(rows),
      getCheckboxProps: (record) => ({
        disabled: record.status === "terminated" || record.status === "expired",
      }),
    }),
    [selectedRows],
  );

  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedRows.length === 0) return;
    try {
      const matterIds = selectedRows.map((row) => row._id);
      const updates = {};
      switch (bulkAction) {
        case "change_status":
          updates.status = form.getFieldValue("bulkStatus");
          break;
        case "change_priority":
          updates.priority = form.getFieldValue("bulkPriority");
          break;
        case "assign_officer":
          updates.accountOfficer = form.getFieldValue("bulkOfficer");
          break;
        case "add_tags":
          updates.$push = { tags: { $each: form.getFieldValue("bulkTags") } };
          break;
        case "send_reminder":
          message.success(`Reminders sent to ${selectedRows.length} retainers`);
          setBulkActionModalVisible(false);
          return;
        default:
          return;
      }
      await dispatch(
        bulkUpdateRetainerMatters({ matterIds, updates }),
      ).unwrap();
      message.success(`${selectedRows.length} matter(s) updated successfully`);
      setBulkActionModalVisible(false);
      setSelectedRows([]);
      form.resetFields();
      dispatch(
        fetchRetainerMatters({
          page: pagination.currentPage,
          limit: pagination.pageSize,
          ...filters,
        }),
      );
    } catch (error) {
      message.error(error.message || "Failed to perform bulk action");
    }
  }, [bulkAction, selectedRows, form, dispatch, pagination, filters]);

  const handleTerminateRetainer = useCallback(
    async (matterId) => {
      try {
        message.success("Retainer terminated successfully");
        dispatch(
          fetchRetainerMatters({
            page: pagination.currentPage,
            limit: pagination.pageSize,
            ...filters,
          }),
        );
      } catch (error) {
        message.error(error.message || "Failed to terminate retainer");
      }
    },
    [dispatch, pagination, filters],
  );

  // Navigation handlers
  const handleCreateRetainer = (matterId) => {
    navigate(`/dashboard/matters/retainers/${matterId}/create`);
  };

  const handleViewDetails = (matterId) => {
    navigate(`/dashboard/matters/retainers/${matterId}/details`);
  };

  const columns = useMemo(
    () => [
      {
        title: "Matter Number",
        dataIndex: "matterNumber",
        key: "matterNumber",
        width: 120,
        fixed: "left",
        render: (text, record) => (
          <Link to={`/dashboard/matters/retainers/${record._id}/details`}>
            <Text strong style={{ color: "#1890ff" }}>
              {text}
            </Text>
          </Link>
        ),
        sorter: true,
      },
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        width: 200,
        ellipsis: true,
        render: (text, record) => (
          <div>
            <Text strong>{text}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {record.retainerDetail?.retainerType || "N/A"}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: "Client",
        dataIndex: "client",
        key: "client",
        width: 150,
        render: (client) =>
          client ? (
            <div>
              <Text>{`${client.firstName || ""} ${client.lastName || ""}`}</Text>
              {client.companyName && (
                <div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {client.companyName}
                  </Text>
                </div>
              )}
            </div>
          ) : (
            "N/A"
          ),
      },
      {
        title: "Account Officer",
        dataIndex: "accountOfficer",
        key: "accountOfficer",
        width: 120,
        render: (officer) =>
          officer ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Avatar size="small" src={officer.photo}>
                {officer.firstName?.[0]}
                {officer.lastName?.[0]}
              </Avatar>
              <Text>{`${officer.firstName} ${officer.lastName}`}</Text>
            </div>
          ) : (
            "Unassigned"
          ),
      },
      {
        title: "Retainer Value",
        dataIndex: "retainerDetail",
        key: "retainerValue",
        width: 130,
        render: (detail) => {
          if (!detail?.billing?.retainerFee) return "N/A";
          return (
            <div>
              <Text strong>{formatCurrency(detail.billing.retainerFee)}</Text>
              <div>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {detail.billing?.frequency || "annual"}
                </Text>
              </div>
            </div>
          );
        },
        sorter: true,
      },
      {
        title: "Service Utilization",
        dataIndex: "retainerDetail",
        key: "utilization",
        width: 150,
        render: (detail) => {
          if (!detail?.servicesIncluded) return "N/A";
          const totalAllocated = detail.servicesIncluded.reduce(
            (sum, s) => sum + (s.serviceLimit || 0),
            0,
          );
          const totalUsed = detail.servicesIncluded.reduce(
            (sum, s) => sum + (s.usageCount || 0),
            0,
          );
          const utilizationRate =
            totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;
          const health = calculateRetainerHealth({ retainerDetail: detail });
          return (
            <div>
              <Progress
                percent={Math.round(utilizationRate)}
                size="small"
                status={
                  health.health === "overutilized"
                    ? "exception"
                    : health.health === "healthy"
                      ? "success"
                      : "normal"
                }
                showInfo={false}
              />
              <div style={{ marginTop: "4px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {totalUsed}/{totalAllocated} units
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => {
          const statusConfig = {
            active: { color: "success", icon: <CheckCircleOutlined /> },
            pending: { color: "warning", icon: <ClockCircleOutlined /> },
            terminated: { color: "error", icon: <CloseCircleOutlined /> },
            expired: { color: "default", icon: <ExclamationCircleOutlined /> },
          };
          const config = statusConfig[status] || {
            color: "default",
            icon: null,
          };
          return (
            <Tag color={config.color} icon={config.icon}>
              {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </Tag>
          );
        },
      },
      {
        title: "Retainer Period",
        dataIndex: "retainerDetail",
        key: "period",
        width: 200,
        render: (detail) => {
          if (!detail?.agreementStartDate) return "N/A";
          const startDate = dayjs(detail.agreementStartDate);
          const endDate = dayjs(detail.agreementEndDate);
          const daysRemaining = endDate.diff(dayjs(), "days");
          return (
            <div>
              <div>
                <CalendarOutlined
                  style={{ marginRight: "4px", color: "#1890ff" }}
                />
                {startDate.format("DD MMM YYYY")} -{" "}
                {endDate.format("DD MMM YYYY")}
              </div>
              <div style={{ marginTop: "4px" }}>
                <Tag color={daysRemaining <= 30 ? "warning" : "blue"}>
                  {daysRemaining > 0 ? `${daysRemaining} days left` : "Expired"}
                </Tag>
              </div>
            </div>
          );
        },
      },
      {
        title: "Last Activity",
        dataIndex: "lastActivityDate",
        key: "lastActivity",
        width: 120,
        render: (date) => (
          <Tooltip
            title={date ? dayjs(date).format("DD MMM YYYY HH:mm") : "Never"}>
            {date ? dayjs(date).fromNow() : "Never"}
          </Tooltip>
        ),
        sorter: true,
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        width: 100,
        render: (priority) => {
          const colorMap = { high: "error", medium: "warning", low: "blue" };
          return (
            <Tag color={colorMap[priority] || "default"}>
              {priority || "Medium"}
            </Tag>
          );
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 100,
        fixed: "right",
        render: (_, record) => {
          const health = calculateRetainerHealth(record);
          const menuItems = [
            {
              key: "view",
              icon: <EyeOutlined />,
              label: (
                <Link to={`dashboard/matters/retainers/${record._id}/details`}>
                  View Details
                </Link>
              ),
            },
            {
              key: "edit",
              icon: <EditOutlined />,
              label: (
                <Link to={`/matters/retainers/${record._id}/edit`}>Edit</Link>
              ),
            },
            {
              key: "services",
              icon: <BarChartOutlined />,
              label: (
                <Link to={`/matters/retainers/${record._id}/services`}>
                  Manage Services
                </Link>
              ),
            },
            {
              key: "requests",
              icon: <TeamOutlined />,
              label: (
                <Link to={`/matters/retainers/${record._id}/requests`}>
                  Manage Requests
                </Link>
              ),
            },
            {
              key: "log_activity",
              icon: <HistoryOutlined />,
              label: (
                <Link to={`/matters/retainers/${record._id}/activities`}>
                  Log Activity
                </Link>
              ),
            },
            { type: "divider" },
            {
              key: "renew",
              icon: <SyncOutlined />,
              disabled: record.status === "active" && health.daysToExpiry > 90,
              label: (
                <Link to={`/dashboard/matters/retainers/${record._id}/create`}>
                  Renew Retainer
                </Link>
              ),
            },
            {
              key: "terminate",
              icon: <CloseCircleOutlined />,
              disabled:
                record.status === "terminated" || record.status === "expired",
              label: (
                <Popconfirm
                  title="Terminate this retainer?"
                  description="This action cannot be undone."
                  onConfirm={() => handleTerminateRetainer(record._id)}>
                  <span>Terminate</span>
                </Popconfirm>
              ),
            },
            { type: "divider" },
            {
              key: "send_reminder",
              icon: <MailOutlined />,
              label: "Send Renewal Reminder",
            },
          ];
          return (
            <Space size="small">
              <Link to={`/dashboard/matters/retainers/${record._id}/details`}>
                <Button type="link" size="small" icon={<EyeOutlined />} />
              </Link>
              <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                <Button size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          );
        },
      },
    ],
    [calculateRetainerHealth, formatCurrency, handleTerminateRetainer],
  );

  const renderStatsCard = useMemo(
    () => (
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="Total Retainers"
              value={stats?.overview?.totalRetainerMatters || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active"
              value={stats?.overview?.activeRetainerMatters || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Expiring Soon"
              value={stats?.expiringSoon || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Monthly Revenue"
              value={stats?.revenue?.totalMonthlyRevenue || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#722ed1" }}
              formatter={(value) => formatCurrency(value)}
            />
          </Col>
        </Row>
        <Divider style={{ margin: "16px 0" }} />
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ marginBottom: "8px" }}>
              <Text strong>Service Utilization Rate</Text>
            </div>
            <Progress
              percent={Math.round(
                stats?.serviceUtilization?.avgUtilization || 0,
              )}
              status="active"
            />
            <div style={{ marginTop: "8px" }}>
              <Text type="secondary">
                {stats?.serviceUtilization?.totalUsed || 0} /{" "}
                {stats?.serviceUtilization?.totalAllocated || 0} units used
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: "8px" }}>
              <Text strong>Pending Requests</Text>
            </div>
            <Badge count={pendingRequests?.length || 0} showZero>
              <Button
                type="link"
                onClick={() => navigate("/matters/retainers/pending-requests")}>
                View All Requests
              </Button>
            </Badge>
            {pendingRequests?.slice(0, 3).map((request, index) => (
              <div
                key={request._id || index}
                style={{ marginTop: "4px", fontSize: "12px" }}>
                <Text ellipsis>{request.description}</Text>
              </div>
            ))}
          </Col>
        </Row>
      </Card>
    ),
    [stats, pendingRequests, navigate, formatCurrency],
  );

  return (
    <div style={{ padding: 24 }}>
      {renderStatsCard}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search by matter number, title, client, or officer..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => handleSearch(searchText)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Retainer Type"
              style={{ width: 150 }}
              value={filters.retainerType || undefined}
              onChange={(value) => handleFilterChange("retainerType", value)}
              allowClear>
              <Option value="fixed">Fixed Fee</Option>
              <Option value="hourly">Hourly Based</Option>
              <Option value="value_based">Value Based</Option>
              <Option value="success_based">Success Based</Option>
              <Option value="blended">Blended</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Status"
              style={{ width: 120 }}
              value={filters.status || undefined}
              onChange={(value) => handleFilterChange("status", value)}
              allowClear>
              <Option value="active">Active</Option>
              <Option value="pending">Pending</Option>
              <Option value="terminated">Terminated</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Expiring in"
              style={{ width: 140 }}
              value={expiringFilterDays}
              onChange={setExpiringFilterDays}
              allowClear>
              <Option value="7">7 days</Option>
              <Option value="30">30 days</Option>
              <Option value="60">60 days</Option>
              <Option value="90">90 days</Option>
            </Select>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setAdvancedSearchVisible(true)}>
                Advanced
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleClearFilters}>
                Clear
              </Button>
              {selectedRows.length > 0 && (
                <Button
                  type="primary"
                  onClick={() => setBulkActionModalVisible(true)}>
                  Bulk Actions ({selectedRows.length})
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreateRetainer(matters)}>
                New Retainer
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
      <Card>
        <Table
          columns={columns}
          dataSource={matters}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalItems,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} retainers`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          rowSelection={rowSelection}
          scroll={{ x: 1500 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0, padding: "16px 0" }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Text strong>Client Contact:</Text>
                    <div>
                      <PhoneOutlined /> {record.client?.phone || "N/A"}
                    </div>
                    <div>
                      <MailOutlined /> {record.client?.email || "N/A"}
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text strong>Retainer Details:</Text>
                    <div>
                      Type: {record.retainerDetail?.retainerType || "N/A"}
                    </div>
                    <div>
                      Frequency:{" "}
                      {record.retainerDetail?.billing?.frequency || "N/A"}
                    </div>
                    <div>
                      Next Renewal:{" "}
                      {record.retainerDetail?.agreementEndDate
                        ? dayjs(record.retainerDetail.agreementEndDate).format(
                            "DD MMM YYYY",
                          )
                        : "N/A"}
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text strong>Service Overview:</Text>
                    {record.retainerDetail?.servicesIncluded
                      ?.slice(0, 2)
                      .map((service, index) => (
                        <div
                          key={service._id || index}
                          style={{ marginTop: "4px" }}>
                          {service.serviceType}: {service.usageCount || 0}/
                          {service.serviceLimit || 0} units
                        </div>
                      ))}
                    {record.retainerDetail?.servicesIncluded?.length > 2 && (
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        +{record.retainerDetail.servicesIncluded.length - 2}{" "}
                        more services
                      </Text>
                    )}
                  </Col>
                </Row>
              </div>
            ),
            rowExpandable: (record) => !!record.retainerDetail,
          }}
        />
      </Card>
      <Modal
        title="Advanced Search"
        open={advancedSearchVisible}
        onCancel={() => setAdvancedSearchVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setAdvancedSearchVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="search"
            type="primary"
            onClick={() => setAdvancedSearchVisible(false)}>
            Search
          </Button>,
        ]}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Client Name">
                <Input placeholder="Search by client name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Account Officer">
                <Select placeholder="Select account officer" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Date Range">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Retainer Value Range">
                <Input.Group compact>
                  <Input style={{ width: "45%" }} placeholder="Min" />
                  <Input
                    style={{
                      width: "10%",
                      borderLeft: 0,
                      pointerEvents: "none",
                      backgroundColor: "#fff",
                    }}
                    placeholder="~"
                    disabled
                  />
                  <Input
                    style={{ width: "45%", borderLeft: 0 }}
                    placeholder="Max"
                  />
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Tags">
            <Select mode="tags" placeholder="Add tags to filter by" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Bulk Actions"
        open={bulkActionModalVisible}
        onCancel={() => {
          setBulkActionModalVisible(false);
          setBulkAction("");
          form.resetFields();
        }}
        width={500}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setBulkActionModalVisible(false);
              setBulkAction("");
              form.resetFields();
            }}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={actionLoading}
            onClick={handleBulkAction}>
            Apply to {selectedRows.length} retainers
          </Button>,
        ]}>
        <Form form={form} layout="vertical">
          <Form.Item label="Select Action" required>
            <Select
              placeholder="Choose an action"
              onChange={setBulkAction}
              value={bulkAction}>
              <Option value="change_status">Change Status</Option>
              <Option value="change_priority">Change Priority</Option>
              <Option value="assign_officer">Assign Account Officer</Option>
              <Option value="add_tags">Add Tags</Option>
              <Option value="send_reminder">Send Renewal Reminder</Option>
            </Select>
          </Form.Item>
          {bulkAction === "change_status" && (
            <Form.Item
              name="bulkStatus"
              label="New Status"
              rules={[{ required: true, message: "Please select a status" }]}>
              <Select placeholder="Select status">
                <Option value="active">Active</Option>
                <Option value="pending">Pending</Option>
                <Option value="terminated">Terminated</Option>
                <Option value="expired">Expired</Option>
              </Select>
            </Form.Item>
          )}
          {bulkAction === "change_priority" && (
            <Form.Item
              name="bulkPriority"
              label="New Priority"
              rules={[{ required: true, message: "Please select a priority" }]}>
              <Select placeholder="Select priority">
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
            </Form.Item>
          )}
          {bulkAction === "assign_officer" && (
            <Form.Item
              name="bulkOfficer"
              label="Account Officer"
              rules={[{ required: true, message: "Please select an officer" }]}>
              <Select placeholder="Select account officer">
                <Option value="officer1">John Doe</Option>
                <Option value="officer2">Jane Smith</Option>
              </Select>
            </Form.Item>
          )}
          {bulkAction === "add_tags" && (
            <Form.Item
              name="bulkTags"
              label="Tags"
              rules={[
                { required: true, message: "Please add at least one tag" },
              ]}>
              <Select mode="tags" placeholder="Add tags (press Enter to add)" />
            </Form.Item>
          )}
          {bulkAction === "send_reminder" && (
            <Form.Item
              name="reminderMessage"
              label="Reminder Message"
              rules={[{ required: true, message: "Please enter a message" }]}>
              <TextArea
                rows={4}
                placeholder="Enter the reminder message to be sent..."
                maxLength={500}
                showCount
              />
            </Form.Item>
          )}
          {bulkAction && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                This action will be applied to {selectedRows.length} selected
                retainers.
              </Text>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default RetainerList;
