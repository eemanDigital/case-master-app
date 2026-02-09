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
  Statistic,
  message,
  Dropdown,
  Menu,
  Modal,
  Progress,
  Tooltip,
  Typography,
  Divider,
  List,
  Avatar,
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
  CalendarOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  CheckOutlined,
  CloseOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  TeamOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
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

const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

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

  // Load data
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

  // Handler functions remain the same...
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

  const handleBulkAction = useCallback(
    async (action, data) => {
      try {
        const payload = { matterIds: selectedRowKeys, updates: data };
        await dispatch(bulkUpdateGeneralMatters(payload)).unwrap();
        message.success(`Bulk ${action} completed successfully`);
        setSelectedRowKeys([]);
        setBulkActionModal({ visible: false, action: null });
        dispatch(
          fetchGeneralMatters({
            page: pagination.page,
            limit: pagination.limit,
            ...filters,
          }),
        );
      } catch (error) {
        message.error(error || "Bulk action failed");
      }
    },
    [dispatch, selectedRowKeys, pagination, filters],
  );

  const handleCreateGeneral = useCallback(
    (matterId) => {
      navigate(`/dashboard/matters/general/${matterId}/create`);
    },
    [navigate],
  );

  // ✅ EMPTY STATE COMPONENT
  const EmptyState = ({ message }) => (
    <div
      style={{
        textAlign: "center",
        padding: 40,
        color: "#bfbfbf",
      }}>
      <BarChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
      <Text type="secondary">{message}</Text>
    </div>
  );

  // ✅ COMPREHENSIVE STATS MAPPING
  const statsCards = useMemo(() => {
    if (!stats) return [];

    const { overview, requirements, deliverables, documents, revenue } = stats;

    return [
      // Overview Cards
      {
        key: "total",
        title: "Total Matters",
        value: overview?.totalGeneralMatters || 0,
        icon: <FileTextOutlined />,
        color: "#1890ff",
        description: "Total general matters",
        trend: null,
      },
      {
        key: "active",
        title: "Active",
        value: overview?.activeGeneralMatters || 0,
        icon: <RiseOutlined />,
        color: "#52c41a",
        description: "Currently active matters",
        trend: "up",
      },
      {
        key: "pending",
        title: "Pending",
        value: overview?.pendingGeneralMatters || 0,
        icon: <WarningOutlined />,
        color: "#faad14",
        description: "Matters awaiting action",
        trend: "neutral",
      },
      {
        key: "completed",
        title: "Completed",
        value: overview?.completedGeneralMatters || 0,
        icon: <CheckCircleOutlined />,
        color: "#722ed1",
        description: "Successfully completed",
        trend: "up",
      },
      {
        key: "closed",
        title: "Closed",
        value: overview?.closedGeneralMatters || 0,
        icon: <CloseOutlined />,
        color: "#8c8c8c",
        description: "Archived/Closed matters",
        trend: null,
      },
      // Revenue Card
      {
        key: "revenue",
        title: "Total Revenue",
        value: revenue?.totalRevenue || 0,
        icon: <DollarOutlined />,
        color: "#13c2c2",
        description: `Average: ₦${(revenue?.avgRevenue || 0).toLocaleString()}`,
        formattedValue: `₦${(revenue?.totalRevenue || 0).toLocaleString()}`,
        trend: "up",
        prefix: "₦",
      },
      // Requirements Card
      {
        key: "requirements",
        title: "Requirements",
        value: requirements?.completed || 0,
        icon: <CheckOutlined />,
        color: "#52c41a",
        description: `${requirements?.pending || 0} pending`,
        subValue: `${requirements?.pending || 0} pending`,
        suffix: `/${(requirements?.completed || 0) + (requirements?.pending || 0)}`,
      },
      // Deliverables Card
      {
        key: "deliverables",
        title: "Deliverables",
        value: deliverables?.pending || 0,
        icon: <PaperClipOutlined />,
        color: "#fa8c16",
        description: `${deliverables?.overdue || 0} overdue`,
        subValue: `${deliverables?.overdue || 0} overdue`,
        suffix: ` pending`,
      },
      // Documents Card
      {
        key: "documents",
        title: "Documents",
        value: documents?.received || 0,
        icon: <FileTextOutlined />,
        color: "#eb2f96",
        description: `${documents?.missing || 0} missing`,
        subValue: `${documents?.missing || 0} missing`,
        suffix: ` received`,
      },
    ];
  }, [stats]);

  // ✅ SERVICE TYPE DISTRIBUTION
  const serviceTypeData = useMemo(() => {
    if (!stats?.byServiceType) return [];

    return stats.byServiceType.map((service) => ({
      ...service,
      name:
        NIGERIAN_GENERAL_SERVICE_TYPES.find((s) => s.value === service._id)
          ?.label || service._id,
      formattedAvgFee: `₦${(service.avgFee || 0).toLocaleString()}`,
      percentage: (service.count / stats.overview.totalGeneralMatters) * 100,
    }));
  }, [stats]);

  // ✅ JURISDICTION DISTRIBUTION
  const jurisdictionData = useMemo(() => {
    if (!stats?.jurisdictions) return [];

    return stats.jurisdictions.map((jur) => ({
      ...jur,
      name: jur._id || "Not Specified",
    }));
  }, [stats]);

  // ✅ REQUIREMENTS STATUS
  const requirementsData = useMemo(() => {
    if (!stats?.requirements?.byStatus) return [];

    const total = stats.requirements.completed + stats.requirements.pending;
    return stats.requirements.byStatus.map((req) => ({
      ...req,
      name: req._id === "met" ? "Met" : "Pending",
      color: req._id === "met" ? "#52c41a" : "#faad14",
      percentage: total > 0 ? (req.count / total) * 100 : 0,
    }));
  }, [stats]);

  // ✅ DELIVERABLES STATUS
  const deliverablesData = useMemo(() => {
    if (!stats?.deliverables?.byStatus) return [];

    return stats.deliverables.byStatus.map((del) => ({
      ...del,
      name: del._id === "pending" ? "Pending" : "Completed",
      color: del._id === "pending" ? "#faad14" : "#52c41a",
    }));
  }, [stats]);

  // ✅ RECENT MATTERS FOR QUICK ACCESS
  const recentMatters = useMemo(() => {
    if (!stats?.recentMatters) return [];

    return stats.recentMatters.slice(0, 5).map((matter) => ({
      ...matter,
      formattedDate: dayjs(matter.dateOpened).format("DD MMM YYYY"),
      statusColor:
        {
          active: "green",
          pending: "orange",
          completed: "blue",
          closed: "gray",
        }[matter.status] || "default",
    }));
  }, [stats]);

  // ✅ RENDER STATS CARDS
  const renderStatsCards = useMemo(
    () => (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((stat) => (
          <Col xs={24} sm={12} md={6} key={stat.key}>
            <Card
              hoverable
              onClick={() => {
                if (stat.key === "pending") {
                  handleFilterChange("status", "pending");
                } else if (stat.key === "requirements") {
                  // Navigate to requirements section
                }
                setActiveStatCard(stat.key);
              }}
              style={{
                borderLeft: `4px solid ${stat.color}`,
                cursor: "pointer",
                transition: "all 0.3s",
                backgroundColor:
                  activeStatCard === stat.key ? "#f6ffed" : "white",
              }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div
                  style={{
                    backgroundColor: `${stat.color}15`,
                    borderRadius: 8,
                    padding: 8,
                    marginRight: 12,
                  }}>
                  {React.cloneElement(stat.icon, {
                    style: { color: stat.color, fontSize: 20 },
                  })}
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stat.title}
                  </Text>
                  <div style={{ display: "flex", alignItems: "baseline" }}>
                    <Statistic
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      valueStyle={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: stat.color,
                      }}
                      loading={statsLoading}
                    />
                    {stat.formattedValue && (
                      <Text strong style={{ marginLeft: 8, fontSize: 16 }}>
                        {stat.formattedValue}
                      </Text>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stat.description}
                  </Text>
                  {stat.subValue && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: 11 }}>
                        {stat.subValue}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    ),
    [statsCards, activeStatCard, statsLoading, handleFilterChange],
  );

  // ✅ RENDER CHARTS AND DISTRIBUTIONS
  const renderChartsAndDistributions = useMemo(
    () => (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Service Type Distribution */}
        <Col xs={24} md={12}>
          <Card
            title="Service Type Distribution"
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => handleFilterChange("serviceType", null)}>
                View All
              </Button>
            }>
            {serviceTypeData.length > 0 ? (
              <>
                <List
                  dataSource={serviceTypeData}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Tag color="blue">{item.count}</Tag>,
                        <Text type="secondary">{item.formattedAvgFee}</Text>,
                      ]}>
                      <List.Item.Meta
                        avatar={
                          <Progress
                            type="circle"
                            percent={Math.round(item.percentage)}
                            width={40}
                            strokeColor="#1890ff"
                          />
                        }
                        title={
                          <Button
                            type="link"
                            onClick={() =>
                              handleFilterChange("serviceType", item._id)
                            }
                            style={{ padding: 0 }}>
                            {item.name}
                          </Button>
                        }
                        description={`${item.count} matters • ₦${item.avgFee.toLocaleString()} avg`}
                      />
                    </List.Item>
                  )}
                />
              </>
            ) : (
              <EmptyState message="No service type data available" />
            )}
          </Card>
        </Col>

        {/* Requirements & Deliverables */}
        <Col xs={24} md={12}>
          <Card title="Compliance Status">
            <Row gutter={16}>
              <Col span={12}>
                <Card
                  size="small"
                  title="Requirements"
                  style={{ height: "100%" }}>
                  {requirementsData.length > 0 ? (
                    <>
                      <Progress
                        percent={Math.round(
                          (stats.requirements.completed /
                            (stats.requirements.completed +
                              stats.requirements.pending)) *
                            100,
                        )}
                        status="active"
                        style={{ marginBottom: 16 }}
                      />
                      <Row gutter={8}>
                        {requirementsData.map((req) => (
                          <Col span={12} key={req._id}>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 24, color: req.color }}>
                                {req.count}
                              </div>
                              <Text type="secondary">{req.name}</Text>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </>
                  ) : (
                    <EmptyState message="No requirements data" />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  title="Deliverables"
                  style={{ height: "100%" }}>
                  {deliverablesData.length > 0 ? (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: "block" }}>
                          Pending: {stats.deliverables.pending}
                        </Text>
                        <Text type="danger" style={{ fontSize: 12 }}>
                          Overdue: {stats.deliverables.overdue}
                        </Text>
                      </div>
                      {deliverablesData.map((del) => (
                        <div
                          key={del._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}>
                          <Tag color={del.color}>{del.name}</Tag>
                          <Text strong>{del.count}</Text>
                        </div>
                      ))}
                    </>
                  ) : (
                    <EmptyState message="No deliverables data" />
                  )}
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Documents & Jurisdiction */}
        <Col xs={24} md={12}>
          <Card title="Documents Status">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Received"
                  value={stats?.documents?.received || 0}
                  valueStyle={{ color: "#52c41a" }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Missing"
                  value={stats?.documents?.missing || 0}
                  valueStyle={{ color: "#f5222d" }}
                  prefix={<WarningOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Originals Kept"
                  value={stats?.documents?.originalKept || 0}
                  valueStyle={{ color: "#1890ff" }}
                  prefix={<FileTextOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Jurisdiction Distribution */}
        <Col xs={24} md={12}>
          <Card
            title="Jurisdiction Distribution"
            extra={<EnvironmentOutlined style={{ color: "#52c41a" }} />}>
            {jurisdictionData.length > 0 ? (
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {jurisdictionData.map((jur) => (
                  <div
                    key={jur._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}>
                    <Text>{jur.name}</Text>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Progress
                        percent={Math.round(
                          (jur.count / stats.overview.totalGeneralMatters) *
                            100,
                        )}
                        size="small"
                        style={{ width: 100, marginRight: 12 }}
                      />
                      <Tag color="blue">{jur.count}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No jurisdiction data available" />
            )}
          </Card>
        </Col>
      </Row>
    ),
    [
      serviceTypeData,
      requirementsData,
      deliverablesData,
      jurisdictionData,
      stats,
      handleFilterChange,
    ],
  );

  // ✅ RENDER QUICK ACCESS - RECENT MATTERS
  const renderRecentMatters = useMemo(
    () => (
      <Card
        title="Recent Matters"
        extra={
          <Button
            type="link"
            onClick={() => navigate("/dashboard/matters/general")}>
            View All
          </Button>
        }
        style={{ marginBottom: 24 }}>
        <List
          dataSource={recentMatters}
          loading={statsLoading}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    navigate(`/dashboard/matters/general/${item._id}/details`)
                  }>
                  View
                </Button>,
              ]}>
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor: item.statusColor,
                    }}>
                    {item.matterNumber?.split("/")[0] || "GEN"}
                  </Avatar>
                }
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Text strong style={{ marginRight: 8 }}>
                      {item.matterNumber}
                    </Text>
                    <Tag color={item.statusColor}>
                      {item.status.toUpperCase()}
                    </Tag>
                  </div>
                }
                description={
                  <>
                    <div>{item.title}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Opened: {item.formattedDate}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    ),
    [recentMatters, statsLoading, navigate],
  );

  // Columns and table remain the same...
  const columns = useMemo(
    () => [
      {
        title: "Matter Number",
        dataIndex: "matterNumber",
        key: "matterNumber",
        width: 150,
        fixed: "left",
        render: (text) => <strong>{text}</strong>,
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
          return <Tag color="blue">{service?.label || type}</Tag>;
        },
      },
      {
        title: "Client",
        dataIndex: "client",
        key: "client",
        width: 200,
        render: (client) =>
          client ? `${client.firstName} ${client.lastName}` : "N/A",
      },
      {
        title: "Billing Type",
        dataIndex: ["generalDetail", "billing", "billingType"],
        key: "billingType",
        width: 130,
        render: (type) =>
          type ? <Tag color="green">{type?.toUpperCase()}</Tag> : "N/A",
      },
      {
        title: "Fee",
        dataIndex: ["generalDetail", "financialSummary"],
        key: "fee",
        width: 130,
        render: (financialSummary, record) => {
          // Try financialSummary first, then billing
          const baseFee = financialSummary?.baseFee;
          if (baseFee) return `₦${baseFee.toLocaleString()}`;

          // Fallback to billing data
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
        title: "Jurisdiction",
        dataIndex: ["generalDetail", "jurisdiction", "state"],
        key: "jurisdiction",
        width: 120,
        render: (state) => state || "N/A",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => {
          const colors = {
            active: "success",
            pending: "warning",
            completed: "blue",
            closed: "default",
          };
          return (
            <Tag color={colors[status] || "default"}>
              {status?.toUpperCase()}
            </Tag>
          );
        },
      },
      {
        title: "Expected Completion",
        dataIndex: ["generalDetail", "expectedCompletionDate"],
        key: "expectedCompletionDate",
        width: 150,
        render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
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
                    navigate(
                      `/dashboard/matters/general/${record?._id}/details`,
                    )
                  }>
                  View
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleCreateGeneral(record._id)}>
                  Create Details
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

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            General Matters Dashboard
          </Title>
          <Text type="secondary">Overview of all general legal matters</Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              dispatch(
                fetchGeneralMatters({
                  page: pagination.page,
                  limit: pagination.limit,
                  ...filters,
                }),
              );
              dispatch(fetchGeneralStats());
            }}
            loading={loading || statsLoading}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />}>Export Report</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              message.info(
                "Please create a matter first, then add general details",
              )
            }>
            New Matter
          </Button>
        </Space>
      </div>

      {/* Stats Overview */}
      {renderStatsCards}

      {/* Charts and Distributions */}
      {renderChartsAndDistributions}

      {/* Recent Matters */}
      {renderRecentMatters}

      {/* Main Table */}
      <Card
        title="All General Matters"
        extra={
          <Space>
            <Search
              placeholder="Search matters..."
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              style={{ width: 250 }}
            />
            <Button icon={<FilterOutlined />}>Advanced Filters</Button>
          </Space>
        }>
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
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </Card>

      {/* Bulk Action Modal */}
      <Modal
        title={`Bulk Update: ${bulkActionModal.action}`}
        open={bulkActionModal.visible}
        onCancel={() => setBulkActionModal({ visible: false, action: null })}
        onOk={() => {
          if (bulkActionModal.action === "status") {
            handleBulkAction("status", { status: "active" });
          }
        }}>
        <p>Update {selectedRowKeys.length} selected matter(s)</p>
      </Modal>
    </div>
  );
};

export default GeneralList;
