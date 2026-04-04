import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Statistic,
  Tooltip,
  Empty,
  Spin,
  Progress,
} from "antd";
import {
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SyncOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  fetchExpiringLeases,
  fetchLeaseStats,
  setLeaseFilters,
  setLeasePage,
  selectExpiringLeases,
  selectLeaseStats,
  selectLeasePagination,
  selectLeaseFilters,
  selectPropertyLoading,
} from "../../redux/features/property/propertySlice";
import {
  getUrgencyColor,
  getUrgencyLabel,
  formatCurrency,
  DATE_FORMAT,
} from "../../utils/propertyConstants";
import dayjs from "dayjs";

const { Option } = Select;

const LeaseDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const expiringLeases = useSelector(selectExpiringLeases);
  const leaseStats = useSelector(selectLeaseStats);
  const pagination = useSelector(selectLeasePagination);
  const filters = useSelector(selectLeaseFilters);
  const loading = useSelector(selectPropertyLoading);

  const [urgencyFilter, setUrgencyFilter] = useState(filters.urgency || "");

  useEffect(() => {
    loadLeases();
    loadStats();
  }, [filters]);

  const loadLeases = () => {
    dispatch(
      fetchExpiringLeases({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      }),
    );
  };

  const loadStats = () => {
    dispatch(fetchLeaseStats());
  };

  const handleUrgencyChange = (value) => {
    setUrgencyFilter(value);
    dispatch(setLeaseFilters({ urgency: value }));
  };

  const handleTableChange = (newPagination) => {
    dispatch(setLeasePage(newPagination.current));
  };

  const handleViewDetails = (record) => {
    navigate(`/dashboard/matters/property/${record.matterId?._id || record.matterId}/details`);
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case "critical":
        return <ExclamationCircleOutlined />;
      case "warning":
        return <WarningOutlined />;
      case "notice":
        return <AlertOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  const columns = [
    {
      title: "Matter",
      key: "matter",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.matterId?.matterNumber || "N/A"}
          </div>
          <div className="text-sm text-gray-500">
            {record.matterId?.title || "No title"}
          </div>
        </div>
      ),
    },
    {
      title: "Property",
      key: "property",
      width: 200,
      render: (_, record) => {
        const prop = record.properties?.[0];
        return (
          <div>
            <div>{prop?.address || "No address"}</div>
            <div className="text-sm text-gray-500">
              {prop?.state || ""} {prop?.lga ? `, ${prop.lga}` : ""}
            </div>
          </div>
        );
      },
    },
    {
      title: "Tenant",
      key: "tenant",
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.tenant?.name || "Not specified"}</div>
          {record.tenant?.contact && (
            <div className="text-xs text-gray-500">{record.tenant.contact}</div>
          )}
        </div>
      ),
    },
    {
      title: "Expiry Date",
      key: "expiryDate",
      width: 120,
      render: (_, record) => (
        <div className="text-center">
          <div>{dayjs(record.leaseAgreement?.expiryDate).format(DATE_FORMAT)}</div>
        </div>
      ),
    },
    {
      title: "Time Remaining",
      key: "countdown",
      width: 150,
      render: (_, record) => {
        const countdown = record.leaseCountdown;
        if (!countdown) return "-";

        return (
          <div className="text-center">
            <div
              className="font-semibold"
              style={{
                color:
                  countdown.urgency === "critical"
                    ? "#ff4d4f"
                    : countdown.urgency === "warning"
                      ? "#fa8c16"
                      : "#1890ff",
              }}
            >
              {countdown.days < 0
                ? `Expired ${Math.abs(countdown.days)}d ago`
                : countdown.days === 0
                  ? "Today"
                  : `${countdown.days} days`}
            </div>
            <div className="text-xs text-gray-500">
              {countdown.weeks}w / {countdown.months}m
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "urgency",
      width: 120,
      render: (_, record) => {
        const urgency = record.leaseCountdown?.urgency || "safe";
        return (
          <Tag
            color={getUrgencyColor(urgency)}
            icon={getUrgencyIcon(urgency)}
          >
            {getUrgencyLabel(urgency)}
          </Tag>
        );
      },
    },
    {
      title: "Rent",
      key: "rent",
      width: 130,
      align: "right",
      render: (_, record) => {
        const rent = record.rentAmount;
        if (!rent?.amount) return "-";
        return (
          <div className="font-semibold">
            {formatCurrency(rent.amount, rent.currency)}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      ),
    },
  ];

  const statsData = leaseStats || {};

  return (
    <div className="lease-dashboard">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Lease Expiration Dashboard</h1>
            <p className="text-gray-500">
              Monitor and manage lease expirations across your portfolio
            </p>
          </div>
          <Button icon={<SyncOutlined spin />} onClick={() => { loadLeases(); loadStats(); }}>
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Active Leases"
                value={statsData.overview?.activeLeases || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Expiring in 7 Days"
                value={statsData.expirationAlerts?.expiringIn7Days || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Expiring in 30 Days"
                value={statsData.expirationAlerts?.expiringIn30Days || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Renewals In Progress"
                value={statsData.overview?.renewalInProgress || 0}
                prefix={<SyncOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Monthly Overview */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} md={8}>
            <Card title="30-60 Days" className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {statsData.expirationAlerts?.expiringIn60Days || 0}
              </div>
              <div className="text-gray-500">Leases expiring</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="60-90 Days" className="text-center">
              <div className="text-3xl font-bold text-purple-500">
                {statsData.expirationAlerts?.expiringIn90Days || 0}
              </div>
              <div className="text-gray-500">Leases expiring</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Total Monthly Rent Value">
              <Statistic
                value={statsData.financialSummary?.totalMonthlyRent || 0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#52c41a" }}
                formatter={(value) => formatCurrency(value, "NGN")}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Leases Table */}
      <Card
        title="Expiring Leases"
        extra={
          <Space>
            <Select
              placeholder="Filter by urgency"
              value={urgencyFilter || undefined}
              onChange={handleUrgencyChange}
              allowClear
              style={{ width: 200 }}
            >
              <Option value="critical">Critical (7 days)</Option>
              <Option value="warning">Warning (30 days)</Option>
              <Option value="notice">Notice (90 days)</Option>
              <Option value="all">All Expiring</Option>
            </Select>
          </Space>
        }
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : expiringLeases.length === 0 ? (
          <Empty description="No expiring leases found" />
        ) : (
          <Table
            columns={columns}
            dataSource={expiringLeases}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} leases`,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            onChange={handleTableChange}
          />
        )}
      </Card>

      {/* Action Required Section */}
      {statsData.expirationAlerts?.expiringIn7Days > 0 && (
        <Card
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
              <span>Action Required</span>
            </Space>
          }
          className="mt-6"
          style={{ borderColor: "#ff4d4f" }}
        >
          <div className="text-lg">
            You have{" "}
            <span className="font-bold text-red-500">
              {statsData.expirationAlerts.expiringIn7Days}
            </span>{" "}
            lease(s) expiring within the next 7 days. Please review these cases
            immediately to ensure timely renewal or notice.
          </div>
          <Button
            type="primary"
            danger
            className="mt-4"
            onClick={() => handleUrgencyChange("critical")}
          >
            View Critical Leases
          </Button>
        </Card>
      )}
    </div>
  );
};

export default LeaseDashboard;
