import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Row,
  Col,
  message,
  Dropdown,
  Menu,
  Modal,
  Typography,
  Segmented,
  Badge,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  MoreOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckOutlined,
  CloseOutlined,
  RiseOutlined,
  PaperClipOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// Redux
import {
  fetchGeneralMatters,
  fetchGeneralStats,
  deleteGeneralDetails,
  bulkUpdateGeneralMatters,
  setFilters,
  clearFilters,
  setPagination,
} from "../../redux/features/general/generalSlice";
import { NIGERIAN_GENERAL_SERVICE_TYPES } from "../../utils/generalConstants";

// Components
import StatCard from "../../components/general/StatCard";
import DistributionChart from "../../components/general/DistributionChart";
import ComplianceCard from "../../components/general/ComplianceCard";
import RecentMattersCard from "../../components/general/RecentMattersCard";

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const GeneralList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { matters, pagination, filters, loading, stats, statsLoading } =
    useSelector((state) => state.general);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionModal, setBulkActionModal] = useState({
    visible: false,
    action: null,
  });
  const [activeStatCard, setActiveStatCard] = useState(null);
  const [viewMode, setViewMode] = useState("dashboard"); // 'dashboard' or 'table'

  // ============================================
  // DATA LOADING
  // ============================================
  useEffect(() => {
    dispatch(
      fetchGeneralMatters({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      }),
    );
    dispatch(fetchGeneralStats());
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleTableChange = useCallback(
    (pag) => {
      dispatch(setPagination({ page: pag.current, limit: pag.pageSize }));
    },
    [dispatch],
  );

  const handleSearch = useCallback(
    (value) => {
      dispatch(setFilters({ search: value }));
      dispatch(setPagination({ page: 1 }));
    },
    [dispatch],
  );

  const handleFilterChange = useCallback(
    (key, value) => {
      dispatch(setFilters({ [key]: value }));
      dispatch(setPagination({ page: 1 }));
    },
    [dispatch],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    dispatch(setPagination({ page: 1 }));
    setActiveStatCard(null);
  }, [dispatch]);

  const handleDelete = useCallback(
    async (matterId) => {
      Modal.confirm({
        title: "Delete General Matter",
        content: "Are you sure you want to delete this general matter?",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(deleteGeneralDetails(matterId)).unwrap();
            message.success("General matter deleted successfully");
            dispatch(
              fetchGeneralMatters({
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
              }),
            );
          } catch (error) {
            message.error(error || "Failed to delete");
          }
        },
      });
    },
    [dispatch, pagination, filters],
  );

  const handleCreateGeneral = useCallback(
    (matterId) => {
      navigate(`/dashboard/matters/general/${matterId}/create`);
    },
    [navigate],
  );

  const handleRefresh = useCallback(() => {
    dispatch(
      fetchGeneralMatters({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      }),
    );
    dispatch(fetchGeneralStats());
  }, [dispatch, pagination, filters]);

  // ============================================
  // COMPUTED DATA
  // ============================================
  const statsCards = useMemo(() => {
    if (!stats) return [];

    const { overview, requirements, deliverables, documents, revenue } = stats;

    return [
      {
        key: "total",
        title: "Total Matters",
        value: overview?.totalGeneralMatters || 0,
        icon: FileTextOutlined,
        color: "#1890ff",
        description: "All general matters",
      },
      {
        key: "active",
        title: "Active",
        value: overview?.activeGeneralMatters || 0,
        icon: RiseOutlined,
        color: "#52c41a",
        description: "Currently active",
        trend: "up",
        onClick: () => handleFilterChange("status", "active"),
      },
      {
        key: "pending",
        title: "Pending",
        value: overview?.pendingGeneralMatters || 0,
        icon: WarningOutlined,
        color: "#faad14",
        description: "Awaiting action",
        onClick: () => handleFilterChange("status", "pending"),
      },
      {
        key: "completed",
        title: "Completed",
        value: overview?.completedGeneralMatters || 0,
        icon: CheckCircleOutlined,
        color: "#722ed1",
        description: "Successfully completed",
        onClick: () => handleFilterChange("status", "completed"),
      },
      {
        key: "revenue",
        title: "Total Revenue",
        value: revenue?.totalRevenue || 0,
        icon: DollarOutlined,
        color: "#13c2c2",
        description: `Avg: ₦${(revenue?.avgRevenue || 0).toLocaleString()}`,
        formattedValue: `₦${(revenue?.totalRevenue || 0).toLocaleString()}`,
        trend: "up",
      },
      {
        key: "requirements",
        title: "Requirements Met",
        value: requirements?.completed || 0,
        icon: CheckOutlined,
        color: "#52c41a",
        description: `${requirements?.pending || 0} pending`,
        subValue:
          requirements?.pending > 0 ? `${requirements.pending} pending` : null,
      },
      {
        key: "deliverables",
        title: "Deliverables",
        value: deliverables?.pending || 0,
        icon: PaperClipOutlined,
        color: "#fa8c16",
        description: "Pending delivery",
        subValue:
          deliverables?.overdue > 0 ? `${deliverables.overdue} overdue` : null,
      },
      {
        key: "documents",
        title: "Documents",
        value: documents?.received || 0,
        icon: FileTextOutlined,
        color: "#eb2f96",
        description: "Received",
        subValue:
          documents?.missing > 0 ? `${documents.missing} missing` : null,
      },
    ];
  }, [stats, handleFilterChange]);

  const serviceTypeData = useMemo(() => {
    if (!stats?.byServiceType || !stats?.overview) return [];

    return stats.byServiceType.map((service) => ({
      ...service,
      name:
        NIGERIAN_GENERAL_SERVICE_TYPES.find((s) => s.value === service._id)
          ?.label || service._id,
      formattedAvgFee: `₦${(service.avgFee || 0).toLocaleString()}`,
      percentage: (service.count / stats.overview.totalGeneralMatters) * 100,
      description: `${service.count} matters • ₦${service.avgFee.toLocaleString()} avg`,
    }));
  }, [stats]);

  const requirementsData = useMemo(() => {
    if (!stats?.requirements?.byStatus) return [];

    return stats.requirements.byStatus.map((req) => ({
      ...req,
      name: req._id === "met" ? "Met" : "Pending",
      color: req._id === "met" ? "#52c41a" : "#faad14",
    }));
  }, [stats]);

  const deliverablesData = useMemo(() => {
    if (!stats?.deliverables?.byStatus) return [];

    return stats.deliverables.byStatus.map((del) => ({
      ...del,
      name: del._id === "pending" ? "Pending" : "Completed",
      color: del._id === "pending" ? "#faad14" : "#52c41a",
    }));
  }, [stats]);

  const recentMatters = useMemo(() => {
    if (!stats?.recentMatters) return [];

    return stats.recentMatters.slice(0, 5).map((matter) => ({
      ...matter,
      formattedDate: dayjs(matter.dateOpened).format("DD MMM YYYY"),
    }));
  }, [stats]);

  // ============================================
  // TABLE COLUMNS
  // ============================================
  const columns = useMemo(
    () => [
      {
        title: "Matter Number",
        dataIndex: "matterNumber",
        key: "matterNumber",
        width: 150,
        fixed: "left",
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: "Service Type",
        dataIndex: ["generalDetail", "serviceType"],
        key: "serviceType",
        width: 180,
        render: (type) => {
          if (!type) return <Tag color="default">Not Set</Tag>;
          const service = NIGERIAN_GENERAL_SERVICE_TYPES.find(
            (s) => s.value === type,
          );
          return (
            <Tag color="blue" style={{ borderRadius: "4px" }}>
              {service?.label || type}
            </Tag>
          );
        },
      },
      {
        title: "Client",
        dataIndex: "client",
        key: "client",
        width: 200,
        render: (client) =>
          client ? (
            <div>
              <Text strong>
                {client.firstName} {client.lastName}
              </Text>
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
        title: "Fee",
        dataIndex: ["generalDetail", "financialSummary"],
        key: "fee",
        width: 130,
        render: (financialSummary, record) => {
          const baseFee = financialSummary?.baseFee;
          if (baseFee)
            return (
              <Text strong style={{ color: "#52c41a" }}>
                ₦{baseFee.toLocaleString()}
              </Text>
            );

          const billing = record?.generalDetail?.billing;
          if (!billing) return "N/A";

          const fee =
            billing.fixedFee?.amount ||
            billing.lproScale?.calculatedAmount ||
            billing.percentage?.calculatedFee;
          return fee ? `₦${fee.toLocaleString()}` : "N/A";
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => {
          const statusConfig = {
            active: { color: "success", icon: "🟢" },
            pending: { color: "warning", icon: "🟡" },
            completed: { color: "processing", icon: "🔵" },
            closed: { color: "default", icon: "⚫" },
          };
          const config = statusConfig[status] || statusConfig.closed;
          return (
            <Tag color={config.color} style={{ borderRadius: "4px" }}>
              {config.icon} {status?.toUpperCase()}
            </Tag>
          );
        },
      },
      {
        title: "Expected Completion",
        dataIndex: ["generalDetail", "expectedCompletionDate"],
        key: "expectedCompletionDate",
        width: 150,
        render: (date) =>
          date ? (
            <Tooltip title={dayjs(date).format("DD MMMM YYYY")}>
              {dayjs(date).format("DD MMM YYYY")}
            </Tooltip>
          ) : (
            <Text type="secondary">Not set</Text>
          ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 100,
        fixed: "right",
        render: (_, record) => {
          const hasGeneralDetail = !!record.generalDetail;

          return (
            <Space size="small">
              {hasGeneralDetail ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    navigate(`/dashboard/matters/general/${record._id}/details`)
                  }>
                  View
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleCreateGeneral(record._id)}>
                  Create
                </Button>
              )}

              {hasGeneralDetail && (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item
                        key="edit"
                        onClick={() =>
                          navigate(
                            `/dashboard/matters/general/${record._id}/edit`,
                          )
                        }>
                        Edit
                      </Menu.Item>
                      <Menu.Item key="complete" icon={<CheckCircleOutlined />}>
                        Mark Complete
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        key="delete"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record._id)}>
                        Delete
                      </Menu.Item>
                    </Menu>
                  }>
                  <Button type="text" size="small" icon={<MoreOutlined />} />
                </Dropdown>
              )}
            </Space>
          );
        },
      },
    ],
    [navigate, handleDelete, handleCreateGeneral],
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(to bottom, #f0f2f5 0%, #ffffff 100%)",
        minHeight: "100vh",
      }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}>
        <div>
          <Title level={2} style={{ margin: 0, marginBottom: "8px" }}>
            General Matters
          </Title>
          <Text type="secondary">
            Manage and track all general legal services
          </Text>
        </div>

        <Space wrap>
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              {
                label: "Dashboard",
                value: "dashboard",
                icon: <AppstoreOutlined />,
              },
              {
                label: "Table",
                value: "table",
                icon: <UnorderedListOutlined />,
              },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading || statsLoading}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              message.info("Create a matter first, then add general details")
            }>
            New Matter
          </Button>
        </Space>
      </div>

      {/* Dashboard View */}
      {viewMode === "dashboard" && (
        <>
          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            {statsCards.map((stat) => (
              <Col xs={24} sm={12} md={8} lg={6} key={stat.key}>
                <StatCard
                  {...stat}
                  loading={statsLoading}
                  isActive={activeStatCard === stat.key}
                  onClick={() => {
                    if (stat.onClick) {
                      stat.onClick();
                      setActiveStatCard(stat.key);
                    }
                  }}
                />
              </Col>
            ))}
          </Row>

          {/* Charts and Analytics */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            {/* Service Distribution */}
            <Col xs={24} lg={12}>
              <DistributionChart
                title="Service Type Distribution"
                data={serviceTypeData}
                loading={statsLoading}
                onItemClick={(item) =>
                  handleFilterChange("serviceType", item._id)
                }
                onViewAll={() => setViewMode("table")}
                emptyMessage="No service type data available"
              />
            </Col>

            {/* Compliance */}
            <Col xs={24} lg={12}>
              <ComplianceCard
                requirementsData={requirementsData}
                deliverablesData={deliverablesData}
                stats={stats}
              />
            </Col>
          </Row>

          {/* Recent Matters */}
          <RecentMattersCard
            recentMatters={recentMatters}
            loading={statsLoading}
            onViewMatter={(matter) =>
              navigate(`/dashboard/matters/general/${matter._id}/details`)
            }
            onViewAll={() => setViewMode("table")}
          />
        </>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card
          title={
            <Space>
              <BarChartOutlined />
              <Text strong>All General Matters</Text>
              <Badge
                count={pagination.total}
                style={{ backgroundColor: "#52c41a" }}
              />
            </Space>
          }
          extra={
            <Space>
              <Search
                placeholder="Search matters..."
                onSearch={handleSearch}
                allowClear
                style={{ width: 250 }}
              />
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}>
                Filters
              </Button>
              {Object.values(filters).some((v) => v) && (
                <Button onClick={handleClearFilters}>Clear Filters</Button>
              )}
            </Space>
          }
          bodyStyle={{ padding: 0 }}>
          {showFilters && (
            <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Service Type"
                    style={{ width: "100%" }}
                    allowClear
                    onChange={(v) => handleFilterChange("serviceType", v)}
                    value={filters.serviceType}>
                    {NIGERIAN_GENERAL_SERVICE_TYPES.map((t) => (
                      <Option key={t.value} value={t.value}>
                        {t.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Status"
                    style={{ width: "100%" }}
                    allowClear
                    onChange={(v) => handleFilterChange("status", v)}
                    value={filters.status}>
                    <Option value="active">Active</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="closed">Closed</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Jurisdiction"
                    style={{ width: "100%" }}
                    allowClear
                    onChange={(v) => handleFilterChange("jurisdictionState", v)}
                    value={filters.jurisdictionState}>
                    <Option value="Lagos">Lagos</Option>
                    <Option value="Abuja">Abuja</Option>
                    <Option value="Rivers">Rivers</Option>
                  </Select>
                </Col>
              </Row>
            </div>
          )}

          <Table
            columns={columns}
            dataSource={matters}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} matters`,
              position: ["bottomCenter"],
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
          />
        </Card>
      )}

      {/* Bulk Action Modal */}
      <Modal
        title={`Bulk Update: ${bulkActionModal.action}`}
        open={bulkActionModal.visible}
        onCancel={() => setBulkActionModal({ visible: false, action: null })}
        onOk={() => {
          if (bulkActionModal.action === "status") {
            // handleBulkAction("status", { status: "active" });
          }
        }}>
        <p>Update {selectedRowKeys.length} selected matter(s)</p>
      </Modal>
    </div>
  );
};

export default GeneralList;
