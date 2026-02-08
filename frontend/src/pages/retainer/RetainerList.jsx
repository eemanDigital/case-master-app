import React, { useEffect, useState } from "react";
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
  Badge,
  Row,
  Col,
  message,
  Empty,
  Alert,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SyncOutlined,
  StopOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  fetchRetainerMatters,
  deleteRetainerDetails,
  restoreRetainerDetails,
} from "../../redux/features/retainer/retainerSlice";
import RetainerStats from "../../components/retainer/RetainerStats";
import RetainerFilters from "../../components/retainer/RetainerFilters";
import ExpiringRetainersWidget from "../../components/retainer/ExpiringRetainersWidget";
import BulkOperationsModal from "../../components/retainer//BulkOperationsModal";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Search } = Input;

/**
 * RetainerList Component - FINAL FIX
 * Properly maps API data structure
 * Fixed: Data now displays correctly from actual API response
 */
const RetainerList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const retainers = useSelector((state) => state.retainer.matters);
  const loading = useSelector((state) => state.retainer.loading);
  const pagination = useSelector((state) => state.retainer.pagination);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    dispatch(fetchRetainerMatters());
  }, [dispatch]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    dispatch(fetchRetainerMatters({ search: value }));
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    dispatch(
      fetchRetainerMatters({
        page: paginationConfig.current,
        limit: paginationConfig.pageSize,
        sortBy: sorter.field,
        sortOrder: sorter.order,
        ...filters,
      }),
    );
  };

  const handleViewDetails = (matterId) => {
    navigate(`/dashboard/matters/retainers/${matterId}/details`);
  };

  const handleEdit = (matterId) => {
    navigate(`/dashboard/matters/retainers/${matterId}/edit`);
  };

  const handleDelete = async (matterId) => {
    try {
      await dispatch(deleteRetainerDetails(matterId)).unwrap();
      message.success("Retainer deleted successfully");
      dispatch(fetchRetainerMatters());
    } catch (error) {
      message.error(error.message || "Failed to delete retainer");
    }
  };

  const handleRestore = async (matterId) => {
    try {
      await dispatch(restoreRetainerDetails(matterId)).unwrap();
      message.success("Retainer restored successfully");
      dispatch(fetchRetainerMatters());
    } catch (error) {
      message.error(error.message || "Failed to restore retainer");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "success",
      inactive: "default",
      expired: "error",
      pending: "processing",
      terminated: "error",
    };
    return colors[status] || "default";
  };

  const getExpiryStatus = (endDate) => {
    if (!endDate) return { color: "default", text: "N/A", icon: "⚪" };
    const daysRemaining = dayjs(endDate).diff(dayjs(), "day");
    if (daysRemaining < 0)
      return { color: "error", text: "Expired", icon: "🔴" };
    if (daysRemaining <= 7)
      return { color: "error", text: "Critical", icon: "⚠️" };
    if (daysRemaining <= 30)
      return { color: "warning", text: "Soon", icon: "🟡" };
    return { color: "success", text: "Active", icon: "🟢" };
  };

  const formatRetainerType = (type) => {
    if (!type) return "N/A";
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Desktop columns - FIXED to match actual API structure
  const desktopColumns = [
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 220,
      fixed: !isMobile ? "left" : false,
      render: (client) => {
        const displayName =
          client?.companyName ||
          `${client?.firstName || ""} ${client?.lastName || ""}`.trim() ||
          "N/A";
        const initial =
          client?.companyName?.charAt(0) || client?.firstName?.charAt(0) || "C";

        return (
          <Space>
            <Avatar
              style={{ backgroundColor: "#1890ff" }}
              icon={<UserOutlined />}>
              {initial}
            </Avatar>
            <div>
              <Text strong className="block">
                {displayName}
              </Text>
              <Text
                type="secondary"
                className="text-xs block"
                style={{ maxWidth: 180 }}>
                {client?.email || ""}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Matter No.",
      dataIndex: "matterNumber",
      key: "matterNumber",
      width: 130,
      render: (text) => (
        <Text className="font-mono text-xs font-semibold">{text || "N/A"}</Text>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text strong>{text || "N/A"}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Retainer Type",
      dataIndex: ["retainerDetail", "retainerType"],
      key: "retainerType",
      width: 160,
      filters: [
        { text: "General Legal", value: "general-legal" },
        { text: "Company Secretarial", value: "company-secretarial" },
        { text: "Retainer Deposit", value: "retainer-deposit" },
        { text: "Specialized", value: "specialized" },
      ],
      render: (type) => {
        if (!type) return <Tag>No Details</Tag>;
        const typeColors = {
          "general-legal": "blue",
          "company-secretarial": "purple",
          "retainer-deposit": "green",
          specialized: "orange",
        };
        return (
          <Tag color={typeColors[type] || "default"}>
            {formatRetainerType(type)}
          </Tag>
        );
      },
    },
    {
      title: "Fee (₦)",
      dataIndex: ["retainerDetail", "billing", "retainerFee"],
      key: "retainerFee",
      width: 120,
      align: "right",
      sorter: true,
      render: (fee) => (
        <Text strong className="text-green-600">
          {fee !== undefined && fee !== null
            ? `₦${Number(fee).toLocaleString()}`
            : "N/A"}
        </Text>
      ),
    },
    {
      title: "Start Date",
      dataIndex: ["retainerDetail", "agreementStartDate"],
      key: "agreementStartDate",
      width: 110,
      sorter: true,
      render: (date) => (
        <Text>{date ? dayjs(date).format("DD/MM/YY") : "N/A"}</Text>
      ),
    },
    {
      title: "End Date",
      dataIndex: ["retainerDetail", "agreementEndDate"],
      key: "agreementEndDate",
      width: 110,
      sorter: true,
      render: (date) => {
        if (!date) return <Text type="secondary">N/A</Text>;
        const expiry = getExpiryStatus(date);
        return (
          <Tooltip title={expiry.text}>
            <Space>
              <span>{expiry.icon}</span>
              <Text>{dayjs(date).format("DD/MM/YY")}</Text>
            </Space>
          </Tooltip>
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
        const aDays = dayjs(aDate).diff(dayjs(), "day");
        const bDays = dayjs(bDate).diff(dayjs(), "day");
        return aDays - bDays;
      },
      render: (_, record) => {
        const endDate = record.retainerDetail?.agreementEndDate;
        if (!endDate) return <Text type="secondary">N/A</Text>;

        const daysRemaining = dayjs(endDate).diff(dayjs(), "day");
        return (
          <Badge
            count={daysRemaining < 0 ? "Expired" : daysRemaining}
            style={{
              backgroundColor:
                daysRemaining < 0
                  ? "#cf1322"
                  : daysRemaining <= 7
                    ? "#faad14"
                    : "#52c41a",
            }}
          />
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
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Account Officer",
      dataIndex: "accountOfficer",
      key: "accountOfficer",
      width: 140,
      render: (officers) => {
        if (!officers || officers.length === 0)
          return <Text type="secondary">Unassigned</Text>;

        const firstOfficer = officers[0];
        const displayName =
          `${firstOfficer.firstName || ""} ${firstOfficer.lastName || ""}`.trim();

        if (officers.length === 1) {
          return <Text>{displayName}</Text>;
        }

        return (
          <Tooltip
            title={officers
              .map((o) => `${o.firstName} ${o.lastName}`)
              .join(", ")}>
            <Text>
              {displayName} +{officers.length - 1}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: !isMobile ? "right" : false,
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: "View Details",
            icon: <EyeOutlined />,
            onClick: () => handleViewDetails(record._id),
          },
          {
            key: "edit",
            label: "Edit",
            icon: <EditOutlined />,
            onClick: () => handleEdit(record._id),
            disabled: !record.retainerDetail,
          },
          { type: "divider" },
          {
            key: "renew",
            label: "Renew",
            icon: <SyncOutlined />,
            onClick: () =>
              navigate(`/dashboard/matters/retainers/${record._id}/details`),
            disabled: !record.retainerDetail,
          },
          {
            key: "terminate",
            label: "Terminate",
            icon: <StopOutlined />,
            danger: true,
            onClick: () =>
              navigate(`/dashboard/matters/retainers/${record._id}/details`),
            disabled: !record.retainerDetail,
          },
          { type: "divider" },
          {
            key: "delete",
            label: record.isDeleted ? "Restore" : "Delete",
            icon: record.isDeleted ? <ReloadOutlined /> : <StopOutlined />,
            danger: !record.isDeleted,
            onClick: () =>
              record.isDeleted
                ? handleRestore(record._id)
                : handleDelete(record._id),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  // Mobile columns - FIXED to match actual API structure
  const mobileColumns = [
    {
      title: "Retainer Details",
      key: "mobile",
      render: (_, record) => {
        const client = record.client;
        const retainerDetail = record.retainerDetail;
        const endDate = retainerDetail?.agreementEndDate;
        const expiry = getExpiryStatus(endDate);
        const daysRemaining = endDate
          ? dayjs(endDate).diff(dayjs(), "day")
          : null;

        const displayName =
          client?.companyName ||
          `${client?.firstName || ""} ${client?.lastName || ""}`.trim() ||
          "N/A";
        const initial =
          client?.companyName?.charAt(0) || client?.firstName?.charAt(0) || "C";

        return (
          <div className="w-full">
            <Space direction="vertical" size={4} className="w-full">
              {/* Client Info */}
              <Space>
                <Avatar style={{ backgroundColor: "#1890ff" }} size="small">
                  {initial}
                </Avatar>
                <div>
                  <Text strong className="block text-sm">
                    {displayName}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {record.matterNumber || "N/A"}
                  </Text>
                </div>
              </Space>

              {/* Title */}
              <Text className="text-xs" ellipsis>
                {record.title || "N/A"}
              </Text>

              {/* Fee and Type */}
              <div className="flex justify-between items-center">
                {retainerDetail ? (
                  <>
                    <Tag color="blue" className="text-xs">
                      {formatRetainerType(retainerDetail.retainerType)}
                    </Tag>
                    <Text strong className="text-green-600 text-xs">
                      ₦
                      {Number(
                        retainerDetail.billing?.retainerFee || 0,
                      ).toLocaleString()}
                    </Text>
                  </>
                ) : (
                  <Tag>No Details</Tag>
                )}
              </div>

              {/* Dates and Status */}
              {retainerDetail && (
                <div className="flex justify-between items-center">
                  <Space size="small">
                    <Text type="secondary" className="text-xs">
                      {retainerDetail.agreementStartDate
                        ? dayjs(retainerDetail.agreementStartDate).format(
                            "DD/MM/YY",
                          )
                        : "N/A"}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      →
                    </Text>
                    <Text type="secondary" className="text-xs">
                      {endDate ? dayjs(endDate).format("DD/MM/YY") : "N/A"}
                    </Text>
                  </Space>
                  <Tag
                    color={getStatusColor(record.status)}
                    className="text-xs">
                    {record.status?.toUpperCase() || "N/A"}
                  </Tag>
                </div>
              )}

              {/* Days Remaining */}
              {daysRemaining !== null && retainerDetail && (
                <div className="flex justify-between items-center">
                  <Space size="small">
                    <span>{expiry.icon}</span>
                    <Text type="secondary" className="text-xs">
                      {expiry.text}
                    </Text>
                  </Space>
                  <Badge
                    count={daysRemaining < 0 ? "Expired" : `${daysRemaining}d`}
                    style={{
                      backgroundColor:
                        daysRemaining < 0
                          ? "#cf1322"
                          : daysRemaining <= 7
                            ? "#faad14"
                            : "#52c41a",
                      fontSize: "10px",
                    }}
                  />
                </div>
              )}

              {/* Account Officer */}
              {record.accountOfficer && record.accountOfficer.length > 0 && (
                <Text type="secondary" className="text-xs">
                  Officer: {record.accountOfficer[0].firstName}{" "}
                  {record.accountOfficer[0].lastName}
                  {record.accountOfficer.length > 1 &&
                    ` +${record.accountOfficer.length - 1}`}
                </Text>
              )}
            </Space>
          </div>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: "View",
            icon: <EyeOutlined />,
            onClick: () => handleViewDetails(record._id),
          },
          {
            key: "edit",
            label: "Edit",
            icon: <EditOutlined />,
            onClick: () => handleEdit(record._id),
            disabled: !record.retainerDetail,
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <div
      className="retainer-list"
      style={{ padding: isMobile ? "16px" : "24px" }}>
      {/* Page Header */}
      <div className="mb-6">
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={12}>
            <Title level={isMobile ? 3 : 2} className="!mb-0">
              <CalendarOutlined className="mr-2" />
              {isMobile ? "Retainers" : "Retainer Agreements"}
            </Title>
            <Text type="secondary" className="text-sm">
              {pagination?.totalRecords || 0} total retainer(s)
            </Text>
          </Col>
          <Col xs={24} md={12}>
            <Space
              wrap
              className={isMobile ? "w-full" : ""}
              style={{ justifyContent: isMobile ? "flex-start" : "flex-end" }}>
              {!isMobile && (
                <>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => dispatch(fetchRetainerMatters())}>
                    Refresh
                  </Button>
                  <Button icon={<FileExcelOutlined />}>Export</Button>
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  navigate("/dashboard/matters/retainers/create/new")
                }
                className="bg-blue-600 hover:bg-blue-700"
                style={isMobile ? { width: "100%" } : {}}>
                {isMobile ? "Create" : "Create Retainer"}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Statistics Dashboard - Desktop only */}
      {!isMobile && (
        <div className="mb-6">
          <RetainerStats />
        </div>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={isMobile ? 24 : 16}>
          {/* Search and Filters */}
          <Card className="mb-4 shadow-sm">
            <Space className="w-full" direction="vertical" size="middle">
              <Row gutter={[8, 8]}>
                <Col xs={24} sm={showFilters ? 24 : 18}>
                  <Search
                    placeholder={
                      isMobile
                        ? "Search..."
                        : "Search by client, matter number..."
                    }
                    allowClear
                    enterButton={<SearchOutlined />}
                    size={isMobile ? "middle" : "large"}
                    onSearch={handleSearch}
                    loading={loading}
                  />
                </Col>
                {!showFilters && (
                  <Col xs={24} sm={6}>
                    <Button
                      icon={<FilterOutlined />}
                      size={isMobile ? "middle" : "large"}
                      onClick={() => setShowFilters(!showFilters)}
                      style={isMobile ? { width: "100%" } : {}}>
                      Filters
                    </Button>
                  </Col>
                )}
              </Row>

              {selectedRowKeys.length > 0 && !isMobile && (
                <Alert
                  message={`${selectedRowKeys.length} retainer(s) selected`}
                  type="info"
                  action={
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setShowBulkModal(true)}>
                      Bulk Operations
                    </Button>
                  }
                  closable
                  onClose={() => setSelectedRowKeys([])}
                />
              )}
            </Space>
          </Card>

          {showFilters && (
            <div className="mb-4">
              <RetainerFilters
                onApply={(filters) => {
                  dispatch(fetchRetainerMatters(filters));
                  setShowFilters(false);
                }}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}

          {/* Retainers Table */}
          <Card className="shadow-lg">
            <Table
              columns={isMobile ? mobileColumns : desktopColumns}
              dataSource={retainers}
              rowKey={(record) => record._id}
              loading={loading}
              rowSelection={isMobile ? undefined : rowSelection}
              onChange={handleTableChange}
              pagination={{
                current: pagination?.currentPage || 1,
                pageSize: pagination?.pageSize || pagination?.limit || 50,
                total: pagination?.totalRecords || pagination?.totalItems || 0,
                showSizeChanger: !isMobile,
                showTotal: (total) =>
                  isMobile ? `${total}` : `Total ${total} retainer(s)`,
                pageSizeOptions: ["10", "20", "50", "100"],
                simple: isMobile,
                size: isMobile ? "small" : "default",
              }}
              scroll={isMobile ? { x: 300 } : { x: 1400 }}
              size={isMobile ? "small" : "middle"}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      isMobile ? "No retainers" : "No retainer agreements found"
                    }>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        navigate("/dashboard/matters/retainers/create/new")
                      }
                      size={isMobile ? "small" : "middle"}>
                      {isMobile ? "Create" : "Create First Retainer"}
                    </Button>
                  </Empty>
                ),
              }}
            />
          </Card>
        </Col>

        {/* Expiring Widget - Desktop only */}
        {!isMobile && (
          <Col xs={24} lg={8}>
            <ExpiringRetainersWidget />
          </Col>
        )}
      </Row>

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        visible={showBulkModal}
        onCancel={() => {
          setShowBulkModal(false);
          setSelectedRowKeys([]);
        }}
        selectedRetainers={selectedRowKeys}
        onSuccess={() => {
          dispatch(fetchRetainerMatters());
          setSelectedRowKeys([]);
        }}
      />
    </div>
  );
};

export default RetainerList;
