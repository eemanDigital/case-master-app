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
import {
  NIGERIAN_GENERAL_SERVICE_TYPES,
  DELIVERABLE_STATUSES,
  BILLING_TYPES,
  REQUIREMENT_STATUSES,
  NIGERIAN_STATES,
} from "../../utils/generalConstants";

const { Search } = Input;
const { Option } = Select;

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

  console.log(matters);

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

  const handleTableChange = useCallback(
    (pag, fil, sorter) => {
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

  const columns = useMemo(
    () => [
      {
        title: "Matter Number",
        dataIndex: ["matter", "matterNumber"],
        key: "matterNumber",
        width: 150,
        fixed: "left",
        render: (text) => <strong>{text}</strong>,
      },
      {
        title: "Service Type",
        dataIndex: "serviceType",
        key: "serviceType",
        width: 180,
        render: (type) => {
          const service = NIGERIAN_GENERAL_SERVICE_TYPES.find(
            (s) => s.value === type,
          );
          return <Tag color="blue">{service?.label || type}</Tag>;
        },
      },
      {
        title: "Client",
        dataIndex: ["matter", "client"],
        key: "client",
        width: 200,
        render: (client) =>
          client ? `${client.firstName} ${client.lastName}` : "N/A",
      },
      {
        title: "Billing Type",
        dataIndex: ["billing", "billingType"],
        key: "billingType",
        width: 130,
        render: (type) => <Tag color="green">{type?.toUpperCase()}</Tag>,
      },
      {
        title: "Fee",
        dataIndex: ["financialSummary", "baseFee"],
        key: "fee",
        width: 130,
        render: (fee, record) => (fee ? `₦${fee.toLocaleString()}` : "N/A"),
      },
      {
        title: "Jurisdiction",
        dataIndex: ["jurisdiction", "state"],
        key: "jurisdiction",
        width: 120,
        render: (state) => state || "N/A",
      },
      {
        title: "Status",
        dataIndex: ["matter", "status"],
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
        dataIndex: "expectedCompletionDate",
        key: "expectedCompletionDate",
        width: 150,
        render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 100,
        fixed: "right",
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() =>
                navigate(`/dashboard/general/${record.matterId}/details`)
              }>
              View
            </Button>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item
                    key="edit"
                    onClick={() =>
                      navigate(`/dashboard/general/${record.matterId}/details`)
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
                    onClick={() => handleDelete(record.matterId)}>
                    Delete
                  </Menu.Item>
                </Menu>
              }>
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      },
    ],
    [navigate, handleDelete],
  );

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: setSelectedRowKeys,
    }),
    [selectedRowKeys],
  );

  const renderStatsCards = useMemo(
    () => (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Matters"
              value={stats?.overview?.totalGeneralMatters || 0}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats?.overview?.activeGeneralMatters || 0}
              valueStyle={{ color: "#3f8600" }}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats?.overview?.pendingGeneralMatters || 0}
              valueStyle={{ color: "#faad14" }}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats?.overview?.completedGeneralMatters || 0}
              valueStyle={{ color: "#1890ff" }}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>
    ),
    [stats, statsLoading],
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
        <h1 style={{ margin: 0 }}>General Matters</h1>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              dispatch(
                fetchGeneralMatters({
                  page: pagination.page,
                  limit: pagination.limit,
                  ...filters,
                }),
              )
            }>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/general/create")}>
            New General Matter
          </Button>
        </Space>
      </div>

      {renderStatsCards}

      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Search
                placeholder="Search matters..."
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} md={16}>
              <Space wrap>
                <Select
                  placeholder="Service Type"
                  style={{ width: 200 }}
                  allowClear
                  onChange={(v) => handleFilterChange("serviceType", v)}
                  value={filters.serviceType}>
                  {NIGERIAN_GENERAL_SERVICE_TYPES.map((t) => (
                    <Option key={t.value} value={t.value}>
                      {t.label}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="Status"
                  style={{ width: 150 }}
                  allowClear
                  onChange={(v) => handleFilterChange("status", v)}
                  value={filters.status}>
                  <Option value="active">Active</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="closed">Closed</Option>
                </Select>
                <Select
                  placeholder="Jurisdiction"
                  style={{ width: 150 }}
                  allowClear
                  onChange={(v) => handleFilterChange("jurisdictionState", v)}
                  value={filters.jurisdictionState}>
                  <Option value="Lagos">Lagos</Option>
                  <Option value="Abuja">Abuja</Option>
                  <Option value="Rivers">Rivers</Option>
                </Select>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? "Hide" : "More"} Filters
                </Button>
                <Button onClick={handleClearFilters}>Clear All</Button>
              </Space>
            </Col>
          </Row>

          {selectedRowKeys.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                background: "#e6f7ff",
                borderRadius: 4,
              }}>
              <Space>
                <span>{selectedRowKeys.length} selected</span>
                <Button
                  size="small"
                  onClick={() =>
                    setBulkActionModal({ visible: true, action: "status" })
                  }>
                  Update Status
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    setBulkActionModal({ visible: true, action: "priority" })
                  }>
                  Update Priority
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => setSelectedRowKeys([])}>
                  Clear Selection
                </Button>
              </Space>
            </div>
          )}

          <Table
            columns={columns}
            dataSource={matters}
            rowKey={(record) => record._id || record.matterId}
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} matters`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1400 }}
          />
        </Space>
      </Card>

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
