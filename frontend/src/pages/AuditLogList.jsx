import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Descriptions,
  Spin,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
} from "antd";
import {
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  CalendarOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const AuditLogList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({
    action: null,
    resource: null,
    userId: null,
    status: null,
    dateRange: null,
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", pagination.pageSize);
      if (filters.action) params.append("action", filters.action);
      if (filters.resource) params.append("resource", filters.resource);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.status) params.append("status", filters.status);
      if (filters.dateRange?.[0]) params.append("startDate", filters.dateRange[0].toISOString());
      if (filters.dateRange?.[1]) params.append("endDate", filters.dateRange[1].toISOString());

      const response = await axios.get(`/api/v1/audit-logs?${params.toString()}`);
      setLogs(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.pagination?.totalRecords || 0,
      }));
    } catch (error) {
      message.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/v1/audit-logs/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats");
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const handleTableChange = (newPagination) => {
    fetchLogs(newPagination.current);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchLogs(1);
  };

  const resetFilters = () => {
    setFilters({
      action: null,
      resource: null,
      userId: null,
      status: null,
      dateRange: null,
    });
    fetchLogs(1);
  };

  const viewLogDetails = (record) => {
    setSelectedLog(record);
    setModalVisible(true);
  };

  const actionColors = {
    CREATE: "green",
    UPDATE: "blue",
    DELETE: "red",
    VIEW: "default",
    LOGIN: "purple",
    LOGOUT: "orange",
    EXPORT: "cyan",
    IMPORT: "teal",
    APPROVE: "green",
    REJECT: "red",
    PAYMENT: "gold",
    STATUS_CHANGE: "magenta",
  };

  const statusColors = {
    SUCCESS: "success",
    FAILED: "error",
    PENDING: "warning",
  };

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(date).format("MMM DD, YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(date).format("HH:mm:ss")}</Text>
        </Space>
      ),
    },
    {
      title: "User",
      dataIndex: "userId",
      key: "user",
      width: 180,
      render: (user) => user ? `${user.firstName} ${user.lastName}` : "System",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (action) => <Tag color={actionColors[action]}>{action}</Tag>,
    },
    {
      title: "Resource",
      dataIndex: "resource",
      key: "resource",
      width: 120,
      render: (resource) => <Tag>{resource}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 130,
      render: (ip) => ip || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewLogDetails(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: "all",
      label: "All Activity",
      children: (
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <Text type="secondary">Track all system activities and changes</Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={() => message.info("Export feature coming soon")}>
          Export Logs
        </Button>
      </div>

      {stats && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Actions" value={stats.totalActions} prefix={<AuditOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Today" value={stats.todayCount} prefix={<CalendarOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="This Week" value={stats.weekCount} prefix={<CalendarOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Failed Actions" value={stats.failedCount} valueStyle={{ color: "#ff4d4f" }} />
            </Card>
          </Col>
        </Row>
      )}

      <Card className="mb-6">
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Row gutter={16}>
            <Col span={6}>
              <Select
                placeholder="Filter by Action"
                allowClear
                style={{ width: "100%" }}
                value={filters.action}
                onChange={(value) => handleFilterChange("action", value)}
                options={[
                  { value: "CREATE", label: "Create" },
                  { value: "UPDATE", label: "Update" },
                  { value: "DELETE", label: "Delete" },
                  { value: "VIEW", label: "View" },
                  { value: "LOGIN", label: "Login" },
                  { value: "LOGOUT", label: "Logout" },
                  { value: "PAYMENT", label: "Payment" },
                ]}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by Resource"
                allowClear
                style={{ width: "100%" }}
                value={filters.resource}
                onChange={(value) => handleFilterChange("resource", value)}
                options={[
                  { value: "USER", label: "User" },
                  { value: "MATTER", label: "Matter" },
                  { value: "TASK", label: "Task" },
                  { value: "INVOICE", label: "Invoice" },
                  { value: "PAYMENT", label: "Payment" },
                  { value: "DOCUMENT", label: "Document" },
                ]}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: "100%" }}
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                options={[
                  { value: "SUCCESS", label: "Success" },
                  { value: "FAILED", label: "Failed" },
                ]}
              />
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: "100%" }}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange("dateRange", dates)}
              />
            </Col>
          </Row>
          <Space>
            <Button type="primary" icon={<FilterOutlined />} onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
              Reset
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="Audit Log Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[<Button key="close" onClick={() => setModalVisible(false)}>Close</Button>]}
        width={700}
      >
        {selectedLog && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Timestamp" span={2}>
              {dayjs(selectedLog.createdAt).format("MMMM DD, YYYY HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedLog.userId ? `${selectedLog.userId.firstName} ${selectedLog.userId.lastName}` : "System"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedLog.userId?.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              <Tag color={actionColors[selectedLog.action]}>{selectedLog.action}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Resource">
              <Tag>{selectedLog.resource}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Resource ID" span={2}>
              {selectedLog.resourceId}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedLog.description}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[selectedLog.status]}>{selectedLog.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="IP Address">
              {selectedLog.ipAddress || "-"}
            </Descriptions.Item>
            {selectedLog.errorMessage && (
              <Descriptions.Item label="Error" span={2}>
                <Text type="danger">{selectedLog.errorMessage}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogList;
