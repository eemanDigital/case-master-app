import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Progress,
  Badge,
  Dropdown,
  Menu,
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
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  BarChartOutlined,
  DownloadOutlined,
  MoreOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  fetchCorporateMatters,
  searchCorporateMatters,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  selectCorporateMatters,
  selectPagination,
  selectFilters,
  selectCorporateLoading,
  selectCorporateError,
  selectCorporateStats,
  fetchCorporateStats,
} from "../../redux/features/corporate/corporateSlice";
import {
  TRANSACTION_TYPES,
  COMPANY_TYPES,
  DATE_FORMAT,
  formatCurrency,
  getTransactionTypeLabel,
  // getCompanyTypeLabel,
} from "../../utils/corporateConstants";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CorporateList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const matters = useSelector(selectCorporateMatters);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const loading = useSelector(selectCorporateLoading);
  const error = useSelector(selectCorporateError);
  const stats = useSelector(selectCorporateStats);

  // Local state
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch data on mount and filter change
  useEffect(() => {
    dispatch(
      fetchCorporateMatters({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      }),
    );
    loadStats();
  }, [dispatch, pagination.page, pagination.limit, filters]);

  const loadStats = async () => {
    setStatsLoading(true);
    await dispatch(fetchCorporateStats());
    setStatsLoading(false);
  };

  // Handle search
  const handleSearch = (value) => {
    if (value.trim()) {
      dispatch(
        searchCorporateMatters({
          criteria: { $text: { $search: value } },
          params: { page: 1, limit: pagination.limit },
        }),
      );
    } else {
      dispatch(
        fetchCorporateMatters({ ...filters, page: 1, limit: pagination.limit }),
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

  // Table columns
  const columns = [
    {
      title: "Matter No.",
      dataIndex: "matterNumber",
      key: "matterNumber",
      width: 120,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handleViewDetails(record)}
          className="p-0 font-mono">
          {text}
        </Button>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {record.client?.name || "No client"}
          </div>
        </div>
      ),
    },
    {
      title: "Transaction Type",
      dataIndex: "corporateDetail.transactionType",
      key: "transactionType",
      width: 180,
      render: (transactionType) => {
        if (!transactionType) return "-";
        const typeConfig = TRANSACTION_TYPES.find(
          (t) => t.value === transactionType,
        );
        return (
          <Tag color={typeConfig?.color || "default"} className="capitalize">
            {typeConfig?.icon} {getTransactionTypeLabel(transactionType)}
          </Tag>
        );
      },
    },
    {
      title: "Company",
      dataIndex: "corporateDetail.companyName",
      key: "companyName",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Deal Value",
      dataIndex: "corporateDetail.dealValue",
      key: "dealValue",
      width: 150,
      align: "right",
      render: (dealValue) => {
        if (!dealValue?.amount) return "-";
        return (
          <div className="font-semibold">
            {formatCurrency(dealValue.amount, dealValue.currency)}
          </div>
        );
      },
    },
    {
      title: "Closing Date",
      dataIndex: "corporateDetail.expectedClosingDate",
      key: "expectedClosingDate",
      width: 140,
      render: (date) => {
        if (!date) return "-";
        const daysUntil = Math.ceil(
          (new Date(date) - new Date()) / (1000 * 60 * 60 * 24),
        );
        const isOverdue = daysUntil < 0;

        return (
          <div>
            <div className="flex items-center gap-1">
              <CalendarOutlined className="text-gray-400" />
              <span>{dayjs(date).format(DATE_FORMAT)}</span>
            </div>
            {!isOverdue && daysUntil <= 30 && (
              <div className="text-xs text-orange-500">
                {daysUntil} days left
              </div>
            )}
            {isOverdue && <div className="text-xs text-red-500">Overdue</div>}
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
          active: { color: "green", text: "Active" },
          pending: { color: "blue", text: "Pending" },
          closed: { color: "gray", text: "Closed" },
          on_hold: { color: "orange", text: "On Hold" },
        }[status] || { color: "default", text: status };

        return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="edit" icon={<EditOutlined />}>
                  Edit Details
                </Menu.Item>
                <Menu.Item key="documents" icon={<FileTextOutlined />}>
                  Documents
                </Menu.Item>
                <Menu.Item key="timeline" icon={<CalendarOutlined />}>
                  Timeline
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="close" danger>
                  Close Matter
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Handle row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  // Handle pagination
  const handleTableChange = (newPagination) => {
    dispatch(setCurrentPage(newPagination.current));
    dispatch(setPageSize(newPagination.pageSize));
  };

  // View matter details
  const handleViewDetails = (matter) => {
    dispatch(setSelectedMatter(matter));
    navigate(`/dashboard/matters/corporate/${matter._id}`);
  };

  // Create new corporate matter
  const handleCreateNew = () => {
    navigate("/dashboard/matters/corporate/create");
  };

  // Export data
  const handleExport = () => {
    // Implement export logic
    Modal.info({
      title: "Export Corporate Matters",
      content: "Export feature will be implemented soon.",
    });
  };

  // Statistics card
  const renderStats = () => {
    if (statsLoading) {
      return <Spin />;
    }

    return (
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Matters"
              value={stats?.totalMatters || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Transactions"
              value={stats?.activeMatters || 0}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Deal Value"
              value={stats?.totalDealValue || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#722ed1" }}
              formatter={(value) => formatCurrency(value, "NGN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={stats?.pendingApprovals || 0}
              prefix={<Alert theme="filled" />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="corporate-list">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Corporate Matters</h1>
            <p className="text-gray-500">
              Manage all corporate transactions and matters
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
              New Corporate Matter
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
            placeholder="Search matters, companies, or clients..."
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
                  placeholder="Company Type"
                  style={{ width: "100%" }}
                  value={filters.companyType || undefined}
                  onChange={(value) => handleFilterChange("companyType", value)}
                  allowClear>
                  {COMPANY_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
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
                  <Option value="closed">Closed</Option>
                  <Option value="on_hold">On Hold</Option>
                </Select>
              </Col>

              <Col xs={24} md={12}>
                <Input
                  placeholder="Company Name"
                  value={filters.companyName || ""}
                  onChange={(e) =>
                    handleFilterChange("companyName", e.target.value)
                  }
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
              : "Failed to load corporate matters"
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
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} matters`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <span>
                    No corporate matters found.{" "}
                    <Button type="link" onClick={handleCreateNew}>
                      Create your first corporate matter
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
        Showing {matters.length} of {pagination.total} corporate matters
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

export default CorporateList;
