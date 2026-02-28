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
  Input,
  Select,
  DatePicker,
  Tooltip,
  Statistic,
  Dropdown,
  Modal,
  Empty,
  Spin,
  Alert,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  HomeOutlined,
  DollarOutlined,
  DownloadOutlined,
  MoreOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import {
  fetchPropertyMatters,
  searchPropertyMatters,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  fetchPropertyStats,
  clearError,
  selectPropertyMatters,
  selectPagination,
  selectFilters,
  selectPropertyLoading,
  selectPropertyError,
  selectPropertyStats,
} from "../../redux/features/property/propertySlice";
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  NIGERIAN_STATES,
  formatCurrency,
  getTransactionTypeLabel,
  getPropertyTypeLabel,
} from "../../utils/propertyConstants";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PropertyList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const matters = useSelector(selectPropertyMatters);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const loading = useSelector(selectPropertyLoading);
  const error = useSelector(selectPropertyError);
  const stats = useSelector(selectPropertyStats);

  // Local state
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch data on mount and filter change
  useEffect(() => {
    dispatch(
      fetchPropertyMatters({
        ...filters,
        page: pagination.currentPage || pagination.current || 1,
        limit: pagination.limit || 20,
      }),
    );
    loadStats();
  }, [
    dispatch,
    pagination.currentPage,
    pagination.current,
    pagination.limit,
    filters,
  ]);

  const loadStats = async () => {
    setStatsLoading(true);
    await dispatch(fetchPropertyStats());
    setStatsLoading(false);
  };

  // Handle search
  const handleSearch = (value) => {
    if (value.trim()) {
      dispatch(
        searchPropertyMatters({
          criteria: { $text: { $search: value } },
          params: { page: 1, limit: pagination.limit },
        }),
      );
    } else {
      dispatch(
        fetchPropertyMatters({ ...filters, page: 1, limit: pagination.limit }),
      );
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchText("");
  };

  // Table columns - CORRECTED with proper null handling
  const columns = [
    {
      title: "Matter Number",
      dataIndex: "matterNumber",
      key: "matterNumber",
      width: 150,
      fixed: "left",
      render: (text) => (
        <span className="font-medium text-blue-600">{text || "-"}</span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: true,
      render: (text) => text || "-",
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 180,
      render: (client) => {
        if (!client) return "-";
        return (
          <div>
            <div className="font-medium">
              {client.firstName} {client.lastName}
            </div>
            <div className="text-xs text-gray-500">{client.email}</div>
          </div>
        );
      },
    },
    {
      title: "Transaction",
      key: "transactionType",
      width: 150,
      render: (_, record) => {
        if (!record.propertyDetail) {
          return <Tag color="default">Not Started</Tag>;
        }
        const transactionType = record.propertyDetail?.transactionType;
        if (!transactionType) return <Tag color="default">Not Set</Tag>;
        return (
          <Tag color="blue" className="capitalize">
            {getTransactionTypeLabel(transactionType)}
          </Tag>
        );
      },
    },
    {
      title: "Property Type",
      key: "propertyType",
      width: 140,
      render: (_, record) => {
        if (!record.propertyDetail) return "-";
        const properties = record.propertyDetail?.properties;
        if (!properties || properties.length === 0) return "-";
        const type = properties[0]?.propertyType;
        return (
          <Tag color="green">{getPropertyTypeLabel(type) || "Property"}</Tag>
        );
      },
    },
    {
      title: "Location",
      key: "location",
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        if (!record.propertyDetail) return "-";
        const properties = record.propertyDetail?.properties;
        if (!properties || properties.length === 0) return "-";
        const prop = properties[0];

        if (prop.address) return prop.address;
        if (prop.state) return prop.state;
        if (prop.city) return prop.city;
        return "-";
      },
    },
    {
      title: "Price/Value",
      key: "purchasePrice",
      width: 150,
      align: "right",
      render: (_, record) => {
        if (!record.propertyDetail) return "-";
        const purchasePrice = record.propertyDetail?.purchasePrice;
        if (!purchasePrice?.amount) return "-";
        return (
          <div className="font-semibold">
            {formatCurrency(purchasePrice.amount, purchasePrice.currency)}
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
          active: { color: "green", label: "Active" },
          pending: { color: "orange", label: "Pending" },
          completed: { color: "blue", label: "Completed" },
          on_hold: { color: "red", label: "On Hold" },
        };
        const config = statusConfig[status] || {
          color: "default",
          label: status,
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Date Opened",
      dataIndex: "dateOpened",
      key: "dateOpened",
      width: 130,
      render: (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  label: "Edit",
                  icon: <EditOutlined />,
                  onClick: () =>
                    navigate(`/dashboard/matters/property/${record._id}/edit`),
                },
                {
                  key: "view",
                  label: "View Details",
                  icon: <EyeOutlined />,
                  onClick: () => handleViewDetails(record),
                },
              ],
            }}
            trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Handle pagination
  const handleTableChange = (newPagination) => {
    dispatch(setCurrentPage(newPagination.current));
    if (newPagination.pageSize !== pagination.limit) {
      dispatch(setPageSize(newPagination.pageSize));
    }
  };

  // View matter details
  const handleViewDetails = (matter) => {
    dispatch(setSelectedMatter(matter));
    navigate(`/dashboard/matters/property/${matter._id}/details`);
  };

  // Create new property matter
  const handleCreateNew = () => {
    navigate(`/dashboard/matters/create`);
  };

  // Export data
  const handleExport = () => {
    Modal.info({
      title: "Export Property Matters",
      content: "Export feature will be implemented soon.",
    });
  };

  // Statistics card
  const renderStats = () => {
    if (statsLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Spin />
        </div>
      );
    }

    return (
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Property Matters"
              value={stats?.overview?.totalPropertyMatters || 0}
              prefix={<HomeOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Transactions"
              value={stats?.overview?.activePropertyMatters || 0}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Governor's Consents"
              value={stats?.pendingConsents || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed Matters"
              value={stats?.overview?.completedPropertyMatters || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="property-list">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Property Matters</h1>
            <p className="text-gray-500">
              Manage all property transactions and real estate matters
            </p>
          </div>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}>
              New Property Matter
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        {renderStats()}
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Search
            placeholder="Search matters, properties, addresses, or clients..."
            enterButton={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            className="flex-1"
          />

          <Space>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>

            <Button onClick={handleClearFilters}>Clear All</Button>
          </Space>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t">
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Select
                  placeholder="Transaction Type"
                  style={{ width: "100%" }}
                  value={filters.transactionType || undefined}
                  onChange={(value) =>
                    handleFilterChange("transactionType", value)
                  }
                  allowClear>
                  {TRANSACTION_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <Select
                  placeholder="Property Type"
                  style={{ width: "100%" }}
                  value={filters.propertyType || undefined}
                  onChange={(value) =>
                    handleFilterChange("propertyType", value)
                  }
                  allowClear>
                  {PROPERTY_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <Select
                  placeholder="State/Location"
                  style={{ width: "100%" }}
                  value={filters.state || undefined}
                  onChange={(value) => handleFilterChange("state", value)}
                  allowClear>
                  {NIGERIAN_STATES.map((state) => (
                    <Option key={state.value} value={state.value}>
                      {state.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <Select
                  placeholder="Status"
                  style={{ width: "100%" }}
                  value={filters.status || undefined}
                  onChange={(value) => handleFilterChange("status", value)}
                  allowClear>
                  <Option value="active">Active</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="on_hold">On Hold</Option>
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <Input
                  placeholder="Min Price"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  prefix={<DollarOutlined />}
                  allowClear
                />
              </Col>

              <Col xs={24} md={8}>
                <Input
                  placeholder="Max Price"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  prefix={<DollarOutlined />}
                  allowClear
                />
              </Col>

              <Col xs={24} md={12}>
                <RangePicker
                  style={{ width: "100%" }}
                  placeholder={["Start Date", "End Date"]}
                  onChange={(dates) => {
                    handleFilterChange("dateRange", dates);
                  }}
                />
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Error"
          description={
            typeof error === "string"
              ? error
              : "Failed to load property matters"
          }
          type="error"
          showIcon
          className="mb-6"
          closable
          onClose={() => dispatch(clearError())}
        />
      )}

      {/* Data Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={matters}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.currentPage || pagination.current || 1,
            pageSize: pagination.limit || 20,
            total: pagination.totalRecords || pagination.count || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} matters`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <span>
                    No property matters found.{" "}
                    <Button type="link" onClick={handleCreateNew}>
                      Create your first property matter
                    </Button>
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Quick Stats Footer */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        Showing {matters.length} of{" "}
        {pagination.totalRecords || pagination.count || 0} property matters
        {filters.transactionType && (
          <span>
            {" "}
            • Filtered by: {getTransactionTypeLabel(filters.transactionType)}
          </span>
        )}
      </div>
    </div>
  );
};

export default PropertyList;
