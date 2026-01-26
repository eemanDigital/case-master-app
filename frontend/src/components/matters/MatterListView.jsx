import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Avatar,
  Badge,
  Typography,
  Modal,
  message,
  Tooltip,
  Dropdown,
  Pagination,
  Spin,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import MatterCard from "../../components/matters/MatterCard";
import {
  MATTER_CONFIG,
  getStatusColor,
  formatCurrency,
} from "../../config/matterConfig";
import {
  getMatters,
  deleteMatter,
  resetMatterState,
} from "../../redux/features/matter/matterSlice";
import { useTheme } from "../../providers/ThemeProvider";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const MatterListView = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();

  const {
    matters,
    isLoading,
    isError,
    message: matterMessage,
  } = useSelector((state) => state.matter);

  console.log("Matters from state:", matters);

  // State
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [selectedMatters, setSelectedMatters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Fetch matters on mount
  useEffect(() => {
    dispatch(getMatters());
    return () => {
      dispatch(resetMatterState());
    };
  }, [dispatch]);

  // Handle error messages
  useEffect(() => {
    if (isError) {
      message.error(matterMessage);
    }
  }, [isError, matterMessage]);

  // Filter matters
  const filteredMatters = matters?.filter((matter) => {
    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const searchable = [
        matter.title,
        matter.description,
        matter.matterNumber,
        matter.client?.firstName,
        matter.client?.lastName,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(searchLower)) return false;
    }

    // Status filter
    if (statusFilter && matter.status !== statusFilter) return false;

    // Type filter
    if (typeFilter && matter.matterType !== typeFilter) return false;

    // Priority filter
    if (priorityFilter && matter.priority !== priorityFilter) return false;

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const matterDate = new Date(matter.dateOpened);
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[1]);

      if (matterDate < startDate || matterDate > endDate) return false;
    }

    return true;
  });

  // Paginate matters
  const paginatedMatters = filteredMatters?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalMatters = filteredMatters?.length || 0;

  // Handle delete matter
  const handleDeleteMatter = (matterId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this matter?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await dispatch(deleteMatter(matterId)).unwrap();
          message.success("Matter deleted successfully");
        } catch (error) {
          message.error("Failed to delete matter");
        }
      },
    });
  };

  // Table columns for list view
  const columns = [
    {
      title: "Matter Number",
      dataIndex: "matterNumber",
      key: "matterNumber",
      width: 150,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/matters/${record._id}`)}
          className="p-0 font-mono font-semibold">
          {text}
        </Button>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500 truncate">
            {record.description}
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
          <div className="flex items-center gap-2">
            <Avatar size="small" src={client.photo} icon={<UserOutlined />} />
            <span>
              {client.firstName} {client.lastName}
            </span>
          </div>
        ) : (
          "-"
        ),
    },
    {
      title: "Type",
      dataIndex: "matterType",
      key: "matterType",
      width: 120,
      render: (type) => (
        <Tag
          color={
            MATTER_CONFIG.MATTER_TYPES.find((t) => t.value === type)?.color ||
            "default"
          }>
          {type}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Badge
          color={
            MATTER_CONFIG.PRIORITY_OPTIONS.find((p) => p.value === priority)
              ?.color
          }
          text={priority}
        />
      ),
    },
    {
      title: "Date Opened",
      dataIndex: "dateOpened",
      key: "dateOpened",
      width: 120,
      render: (date) => (
        <div className="flex items-center gap-1">
          <CalendarOutlined className="text-gray-400" />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      title: "Value",
      dataIndex: "estimatedValue",
      key: "estimatedValue",
      width: 120,
      render: (value, record) =>
        value ? formatCurrency(value, record.currency) : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/dashboard/matters/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/dashboard/matters/${record._id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteMatter(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Bulk actions menu
  const bulkActionsMenu = {
    items: [
      {
        key: "change-status",
        label: "Change Status",
        onClick: () =>
          console.log("Change status for selected", selectedMatters),
      },
      {
        key: "assign-officer",
        label: "Assign Account Officer",
        onClick: () =>
          console.log("Assign officer to selected", selectedMatters),
      },
      {
        key: "export",
        label: "Export Selected",
        icon: <DownloadOutlined />,
        onClick: () => console.log("Export selected", selectedMatters),
      },
      {
        type: "divider",
      },
      {
        key: "delete",
        label: "Delete Selected",
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: `Delete ${selectedMatters.length} matters?`,
            content: "This action cannot be undone.",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
              // Implement bulk delete
              message.info("Bulk delete functionality to be implemented");
            },
          });
        },
      },
    ],
  };

  return (
    <div className={`p-4 ${isDarkMode ? "dark" : ""}`}>
      <Card
        className={`mb-6 ${isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Title
              level={2}
              className={`mb-2 ${isDarkMode ? "dark:text-gray-100" : ""}`}>
              Matters
            </Title>
            <Text
              type="secondary"
              className={isDarkMode ? "dark:text-gray-400" : ""}>
              Manage all legal matters in your practice
            </Text>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/dashboard/matters/create")}>
              New Matter
            </Button>
          </Space>
        </div>

        {/* Stats Overview */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Title level={3} className="mb-0">
                {matters?.length || 0}
              </Title>
              <Text type="secondary">Total Matters</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Title level={3} className="mb-0 text-green-600">
                {matters?.filter((m) => m.status === "active").length || 0}
              </Title>
              <Text type="secondary">Active</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Title level={3} className="mb-0 text-orange-600">
                {matters?.filter((m) => m.priority === "urgent").length || 0}
              </Title>
              <Text type="secondary">Urgent</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Title level={3} className="mb-0 text-blue-600">
                {matters?.filter((m) => m.status === "pending").length || 0}
              </Title>
              <Text type="secondary">Pending</Text>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card
          className={`mb-6 ${isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""}`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <Input
              placeholder="Search matters..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-grow"
              allowClear
            />

            <Space wrap>
              {/* Status Filter */}
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 120 }}>
                {MATTER_CONFIG.STATUS_OPTIONS.map((status) => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>

              {/* Type Filter */}
              <Select
                placeholder="Type"
                value={typeFilter}
                onChange={setTypeFilter}
                allowClear
                style={{ width: 120 }}>
                {MATTER_CONFIG.MATTER_TYPES.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>

              {/* Priority Filter */}
              <Select
                placeholder="Priority"
                value={priorityFilter}
                onChange={setPriorityFilter}
                allowClear
                style={{ width: 120 }}>
                {MATTER_CONFIG.PRIORITY_OPTIONS.map((priority) => (
                  <Option key={priority.value} value={priority.value}>
                    {priority.label}
                  </Option>
                ))}
              </Select>

              {/* Date Range */}
              <RangePicker
                onChange={setDateRange}
                value={dateRange}
                style={{ width: 240 }}
              />

              {/* Action Buttons */}
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  // Apply filters
                }}>
                Filter
              </Button>

              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText("");
                  setStatusFilter(null);
                  setTypeFilter(null);
                  setPriorityFilter(null);
                  setDateRange(null);
                }}>
                Clear
              </Button>

              {/* View Toggle */}
              <Button.Group>
                <Button
                  type={viewMode === "grid" ? "primary" : "default"}
                  onClick={() => setViewMode("grid")}>
                  Grid
                </Button>
                <Button
                  type={viewMode === "list" ? "primary" : "default"}
                  onClick={() => setViewMode("list")}>
                  List
                </Button>
              </Button.Group>
            </Space>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedMatters.length > 0 && (
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <Text>
                {selectedMatters.length} matter
                {selectedMatters.length > 1 ? "s" : ""} selected
              </Text>
              <Dropdown menu={bulkActionsMenu} trigger={["click"]}>
                <Button>Bulk Actions</Button>
              </Dropdown>
            </div>
          </Card>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <Row gutter={[16, 16]}>
                {paginatedMatters?.map((matter) => (
                  <Col key={matter._id} xs={24} sm={12} md={8} lg={6}>
                    <MatterCard
                      matter={matter}
                      onDelete={() => handleDeleteMatter(matter._id)}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <Table
                columns={columns}
                dataSource={paginatedMatters}
                rowKey="_id"
                pagination={false}
                scroll={{ x: 1000 }}
                className={`${isDarkMode ? "dark-table" : ""}`}
              />
            )}

            {/* Pagination */}
            {totalMatters > 0 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalMatters}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} matters`
                  }
                  pageSizeOptions={[12, 24, 48, 96]}
                />
              </div>
            )}

            {/* Empty State */}
            {(!paginatedMatters || paginatedMatters.length === 0) && (
              <div className="text-center py-12">
                <Title level={4} type="secondary">
                  No matters found
                </Title>
                <Text type="secondary" className="mb-4 block">
                  {searchText ||
                  statusFilter ||
                  typeFilter ||
                  priorityFilter ||
                  dateRange
                    ? "Try adjusting your filters"
                    : "Get started by creating your first matter"}
                </Text>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/dashboard/matters/create")}>
                  Create New Matter
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default MatterListView;
