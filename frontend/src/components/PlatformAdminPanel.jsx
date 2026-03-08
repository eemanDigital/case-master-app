import React, { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Card,
  Button,
  Form,
  Input,
  Select,
  Modal,
  Drawer,
  Tag,
  Badge,
  Spin,
  message,
  Alert,
  Popconfirm,
  Typography,
  Space,
  Empty,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api/v1";

const PlatformAdminPanel = () => {
  const [platformSecret, setPlatformSecret] = useState("");
  const [platformEmail, setPlatformEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [pendingFirms, setPendingFirms] = useState([]);
  const [allFirms, setAllFirms] = useState([]);
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ search: "", plan: "", status: "" });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(null);

  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeForm] = Form.useForm();

  const [createFirmModalVisible, setCreateFirmModalVisible] = useState(false);
  const [createFirmForm] = Form.useForm();
  const [tempPassword, setTempPassword] = useState("");

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectFirmId, setRejectFirmId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendFirmId, setSuspendFirmId] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");

  const [inviteUrlModalVisible, setInviteUrlModalVisible] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  const [allFirmsForSelect, setAllFirmsForSelect] = useState([]);

  // Create API instance without default headers - they'll be set per-request
  const api = axios.create({ baseURL });

  // Add platform headers to each request and remove JWT token
  api.interceptors.request.use((config) => {
    config.headers["x-platform-secret"] = platformSecret;
    config.headers["x-platform-admin-email"] = platformEmail;
    delete config.headers.Authorization;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 404) {
        setIsAuthenticated(false);
        setPlatformSecret("");
        setPlatformEmail("");
        message.error("Session expired. Please login again.");
      }
      return Promise.reject(error);
    }
  );

  const handleLogin = async () => {
    if (!platformSecret || !platformEmail) {
      message.error("Please enter both platform secret and admin email");
      return;
    }
    setLoading(true);
    try {
      await api.get("/platform/firms/stats");
      setIsAuthenticated(true);
      message.success("Login successful");
    } catch (error) {
      message.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingFirms = async () => {
    setPendingLoading(true);
    try {
      const response = await api.get("/platform/firms/pending");
      setPendingFirms(response.data.data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to fetch pending firms");
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchAllFirms = async (page = 1) => {
    setFirmsLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        ...(filters.search && { search: filters.search }),
        ...(filters.plan && { plan: filters.plan }),
        ...(filters.status && { status: filters.status }),
      };
      const response = await api.get("/platform/firms", { params });
      setAllFirms(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        current: response.data.pagination?.current || page,
        total: response.data.pagination?.totalRecords || 0,
      }));
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to fetch firms");
    } finally {
      setFirmsLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await api.get("/platform/firms/stats");
      setStats(response.data.data);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to fetch stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAllFirmsForSelect = async () => {
    try {
      const response = await api.get("/platform/firms?limit=1000");
      setAllFirmsForSelect(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch firms for select");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingFirms();
      fetchAllFirms();
      fetchStats();
      fetchAllFirmsForSelect();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllFirms();
    }
  }, [filters, isAuthenticated]);

  const handleApprove = async (firmId) => {
    try {
      await api.patch(`/platform/firms/${firmId}/approve`);
      message.success("Firm approved successfully");
      fetchPendingFirms();
      fetchAllFirms();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to approve firm");
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      message.error("Please provide a rejection reason");
      return;
    }
    try {
      await api.patch(`/platform/firms/${rejectFirmId}/reject`, { reason: rejectReason });
      message.success("Firm rejected");
      setRejectModalVisible(false);
      setRejectReason("");
      fetchPendingFirms();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to reject firm");
    }
  };

  const handleSuspend = async () => {
    try {
      await api.patch(`/platform/firms/${suspendFirmId}/suspend`, { reason: suspendReason || "Suspended by admin" });
      message.success("Firm suspended");
      setSuspendModalVisible(false);
      setSuspendReason("");
      fetchAllFirms();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to suspend firm");
    }
  };

  const handleReactivate = async (firmId) => {
    try {
      await api.patch(`/platform/firms/${firmId}/reactivate`);
      message.success("Firm reactivated");
      fetchAllFirms();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to reactivate firm");
    }
  };

  const handleConfirmPayment = async (firmId) => {
    try {
      await api.patch(`/platform/firms/${firmId}/confirm-payment`);
      message.success("Payment confirmed");
      fetchAllFirms();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to confirm payment");
    }
  };

  const handleSendUpgrade = async (values) => {
    try {
      const response = await api.post(`/platform/firms/${values.firmId}/upgrade-invite`, {
        targetPlan: values.targetPlan,
        messageToFirm: values.messageToFirm,
        internalNotes: values.internalNotes,
        expiresInDays: values.expiresInDays,
      });
      message.success("Upgrade invitation sent");
      setUpgradeModalVisible(false);
      upgradeForm.resetFields();
      setInviteUrl(response.data.data.upgradeUrl);
      setInviteUrlModalVisible(true);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to send upgrade invitation");
    }
  };

  const handleCreateFirm = async (values) => {
    try {
      const response = await api.post("/platform/firms", values);
      message.success("Firm created successfully");
      setTempPassword(response.data.data.tempPassword);
      setCreateFirmModalVisible(true);
      createFirmForm.resetFields();
      fetchAllFirms();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to create firm");
    }
  };

  const getPlanTag = (plan) => {
    const colors = {
      FREE: "default",
      BASIC: "blue",
      PRO: "purple",
      ENTERPRISE: "gold",
    };
    return <Tag color={colors[plan] || "default"}>{plan}</Tag>;
  };

  const getStatusTag = (status) => {
    const colors = {
      PENDING_APPROVAL: "orange",
      ACTIVE: "green",
      TRIAL: "cyan",
      SUSPENDED: "red",
      REJECTED: "default",
      EXPIRED: "default",
    };
    return <Tag color={colors[status] || "default"}>{status}</Tag>;
  };

  const pendingColumns = [
    {
      title: "Firm Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Contact Email",
      dataIndex: ["contact", "email"],
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: ["contact", "phone"],
      key: "phone",
    },
    {
      title: "Registered",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("MMM DD, YYYY HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record._id)}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}>
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setRejectFirmId(record._id);
              setRejectModalVisible(true);
            }}>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const allFirmsColumns = [
    {
      title: "Firm Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Plan",
      dataIndex: ["subscription", "plan"],
      key: "plan",
      render: (plan) => getPlanTag(plan),
    },
    {
      title: "Status",
      dataIndex: ["subscription", "status"],
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Users",
      key: "users",
      render: (_, record) => (
        <span>
          {record.usage?.currentUserCount || 0} / {record.limits?.users || 0}
        </span>
      ),
    },
    {
      title: "Registered",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedFirm(record);
              setDrawerVisible(true);
            }}>
            View
          </Button>
          {["ACTIVE", "TRIAL"].includes(record.subscription?.status) && (
            <Button
              icon={<ArrowUpOutlined />}
              onClick={() => {
                upgradeForm.setFieldsValue({ firmId: record._id });
                setUpgradeModalVisible(true);
              }}>
              Upgrade
            </Button>
          )}
          {["ACTIVE", "TRIAL"].includes(record.subscription?.status) && (
            <Popconfirm
              title="Suspend this firm?"
              onConfirm={() => {
                setSuspendFirmId(record._id);
                setSuspendModalVisible(true);
              }}>
              <Button danger icon={<StopOutlined />}>
                Suspend
              </Button>
            </Popconfirm>
          )}
          {record.subscription?.status === "SUSPENDED" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleReactivate(record._id)}>
              Reactivate
            </Button>
          )}
          {record.subscription?.status === "TRIAL" && (
            <Popconfirm
              title="Confirm payment and convert to full plan?"
              onConfirm={() => handleConfirmPayment(record._id)}>
              <Button type="primary">Confirm Payment</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Card title="Platform Admin Login" style={{ width: 400 }}>
          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item label="Platform Secret" required>
              <Input.Password
                value={platformSecret}
                onChange={(e) => setPlatformSecret(e.target.value)}
                placeholder="Enter platform secret"
              />
            </Form.Item>
            <Form.Item label="Admin Email" required>
              <Input
                type="email"
                value={platformEmail}
                onChange={(e) => setPlatformEmail(e.target.value)}
                placeholder="Enter admin email"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  const pendingTabCount = pendingFirms.length;

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Platform Admin Panel</Title>

      <Tabs
        defaultActiveKey="pending"
        items={[
          {
            key: "pending",
            label: (
              <span>
                Pending Approvals <Badge count={pendingTabCount} /></span>
            ),
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Button icon={<ReloadOutlined />} onClick={fetchPendingFirms}>
                    Refresh
                  </Button>
                </div>
                <Spin spinning={pendingLoading}>
                  {pendingFirms.length === 0 ? (
                    <Empty description="No firms awaiting approval" />
                  ) : (
                    <Table
                      columns={pendingColumns}
                      dataSource={pendingFirms}
                      rowKey="_id"
                    />
                  )}
                </Spin>
              </Card>
            ),
          },
          {
            key: "allfirms",
            label: "All Firms",
            children: (
              <Card>
                <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
                  <Input
                    placeholder="Search firms..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    style={{ width: 200 }}
                    allowClear
                  />
                  <Select
                    placeholder="Filter by plan"
                    value={filters.plan || undefined}
                    onChange={(v) => setFilters({ ...filters, plan: v || "" })}
                    style={{ width: 150 }}
                    allowClear>
                    <Option value="FREE">FREE</Option>
                    <Option value="BASIC">BASIC</Option>
                    <Option value="PRO">PRO</Option>
                    <Option value="ENTERPRISE">ENTERPRISE</Option>
                  </Select>
                  <Select
                    placeholder="Filter by status"
                    value={filters.status || undefined}
                    onChange={(v) => setFilters({ ...filters, status: v || "" })}
                    style={{ width: 180 }}
                    allowClear>
                    <Option value="PENDING_APPROVAL">PENDING_APPROVAL</Option>
                    <Option value="ACTIVE">ACTIVE</Option>
                    <Option value="TRIAL">TRIAL</Option>
                    <Option value="SUSPENDED">SUSPENDED</Option>
                    <Option value="REJECTED">REJECTED</Option>
                  </Select>
                  <Button icon={<ReloadOutlined />} onClick={() => fetchAllFirms()}>
                    Refresh
                  </Button>
                </div>
                <Spin spinning={firmsLoading}>
                  <Table
                    columns={allFirmsColumns}
                    dataSource={allFirms}
                    rowKey="_id"
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      onChange: (page) => fetchAllFirms(page),
                    }}
                  />
                </Spin>
              </Card>
            ),
          },
          {
            key: "create",
            label: "Create Firm",
            children: (
              <Card>
                <Form
                  form={createFirmForm}
                  layout="vertical"
                  onFinish={handleCreateFirm}
                  style={{ maxWidth: 600 }}>
                  <Form.Item name="firmName" label="Firm Name" rules={[{ required: true }]}>
                    <Input placeholder="Enter firm name" />
                  </Form.Item>
                  <Form.Item name="email" label="Contact Email" rules={[{ required: true, type: "email" }]}>
                    <Input placeholder="Enter contact email" />
                  </Form.Item>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                      <Input placeholder="First name" />
                    </Form.Item>
                    <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                      <Input placeholder="Last name" />
                    </Form.Item>
                  </div>
                  <Form.Item name="plan" label="Plan" initialValue="FREE">
                    <Select>
                      <Option value="FREE">FREE</Option>
                      <Option value="BASIC">BASIC</Option>
                      <Option value="PRO">PRO</Option>
                      <Option value="ENTERPRISE">ENTERPRISE</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="phone" label="Phone">
                    <Input placeholder="Phone number" />
                  </Form.Item>
                  <Form.Item name="address" label="Address">
                    <Input.TextArea rows={2} placeholder="Address" />
                  </Form.Item>
                  <Form.Item name="gender" label="Gender">
                    <Select placeholder="Select gender">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    Create Firm
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: "upgrade",
            label: "Upgrade Invitations",
            children: (
              <Card>
                <Form
                  form={upgradeForm}
                  layout="vertical"
                  onFinish={handleSendUpgrade}
                  style={{ maxWidth: 600, marginBottom: 32 }}>
                  <Title level={5}>Send Upgrade Invitation</Title>
                  <Form.Item name="firmId" label="Select Firm" rules={[{ required: true }]}>
                    <Select placeholder="Select a firm" showSearch>
                      {allFirmsForSelect.map((firm) => (
                        <Option key={firm._id} value={firm._id}>
                          {firm.name} ({firm.subscription?.plan})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="targetPlan" label="Target Plan" rules={[{ required: true }]}>
                    <Select placeholder="Select target plan">
                      <Option value="BASIC">BASIC</Option>
                      <Option value="PRO">PRO</Option>
                      <Option value="ENTERPRISE">ENTERPRISE</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="messageToFirm" label="Message to Firm">
                    <TextArea rows={3} placeholder="Optional message to include in the email" />
                  </Form.Item>
                  <Form.Item name="internalNotes" label="Internal Notes">
                    <TextArea rows={2} placeholder="Notes only visible to you" />
                  </Form.Item>
                  <Form.Item name="expiresInDays" label="Expires In" initialValue={14}>
                    <Select>
                      <Option value={7}>7 days</Option>
                      <Option value={14}>14 days</Option>
                      <Option value={30}>30 days</Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    Send Upgrade Invitation
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: "stats",
            label: "Platform Stats",
            children: (
              <Card>
                <Spin spinning={statsLoading}>
                  {stats && (
                    <>
                      <Row gutter={[16, 16]}>
                        <Col span={6}>
                          <Card>
                            <Statistic title="Total Firms" value={stats.totalFirms} />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="Active Firms"
                              value={stats.statusBreakdown?.ACTIVE || 0}
                              valueStyle={{ color: "#52c41a" }}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="Pending Approval"
                              value={stats.statusBreakdown?.PENDING_APPROVAL || 0}
                              valueStyle={{ color: "#faad14" }}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="On Trial"
                              value={stats.statusBreakdown?.TRIAL || 0}
                              valueStyle={{ color: "#1890ff" }}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="Suspended"
                              value={stats.statusBreakdown?.SUSPENDED || 0}
                              valueStyle={{ color: "#ff4d4f" }}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic title="Total Users" value={stats.totalUsers} />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="New Firms This Month"
                              value={stats.newFirmsThisMonth}
                              valueStyle={{ color: "#52c41a" }}
                            />
                          </Card>
                        </Col>
                      </Row>
                      <Card style={{ marginTop: 16 }}>
                        <Title level={5}>Plan Breakdown</Title>
                        <Table
                          dataSource={[
                            { plan: "FREE", count: stats.planBreakdown?.FREE || 0 },
                            { plan: "BASIC", count: stats.planBreakdown?.BASIC || 0 },
                            { plan: "PRO", count: stats.planBreakdown?.PRO || 0 },
                            { plan: "ENTERPRISE", count: stats.planBreakdown?.ENTERPRISE || 0 },
                          ]}
                          rowKey="plan"
                          pagination={false}
                          columns={[
                            { title: "Plan", dataIndex: "plan", key: "plan" },
                            { title: "Firm Count", dataIndex: "count", key: "count" },
                          ]}
                        />
                      </Card>
                    </>
                  )}
                </Spin>
              </Card>
            ),
          },
        ]}
      />

      <Drawer
        title="Firm Details"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}>
        {selectedFirm && (
          <div>
            <p><strong>Firm Name:</strong> {selectedFirm.name}</p>
            <p><strong>Subdomain:</strong> {selectedFirm.subdomain || "N/A"}</p>
            <p><strong>Plan:</strong> {getPlanTag(selectedFirm.subscription?.plan)}</p>
            <p><strong>Status:</strong> {getStatusTag(selectedFirm.subscription?.status)}</p>
            <p><strong>Contact Email:</strong> {selectedFirm.contact?.email}</p>
            <p><strong>Phone:</strong> {selectedFirm.contact?.phone || "N/A"}</p>
            <p><strong>Address:</strong> {selectedFirm.contact?.address?.street || "N/A"}</p>
            <p><strong>Registered:</strong> {dayjs(selectedFirm.createdAt).format("MMM DD, YYYY HH:mm")}</p>
            <Title level={5}>Limits</Title>
            <p>Users: {selectedFirm.limits?.users}</p>
            <p>Storage (GB): {selectedFirm.limits?.storageGB}</p>
            <p>Cases per Month: {selectedFirm.limits?.casesPerMonth}</p>
            <Title level={5}>Usage</Title>
            <p>Current Users: {selectedFirm.usage?.currentUserCount || 0}</p>
            <p>Storage Used (GB): {selectedFirm.usage?.storageUsedGB || 0}</p>
            <p>Cases This Month: {selectedFirm.usage?.casesThisMonth || 0}</p>
            {selectedFirm.superAdmin && (
              <>
                <Title level={5}>Super Admin</Title>
                <p>Name: {selectedFirm.superAdmin.firstName} {selectedFirm.superAdmin.lastName}</p>
                <p>Email: {selectedFirm.superAdmin.email}</p>
              </>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="Reject Firm"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleReject}>
        <TextArea
          rows={4}
          placeholder="Enter rejection reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <Modal
        title="Suspend Firm"
        open={suspendModalVisible}
        onCancel={() => setSuspendModalVisible(false)}
        onOk={handleSuspend}>
        <TextArea
          rows={4}
          placeholder="Enter reason (optional)"
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
        />
      </Modal>

      <Modal
        title="Send Upgrade Invitation"
        open={upgradeModalVisible}
        onCancel={() => setUpgradeModalVisible(false)}
        footer={null}>
        <Form form={upgradeForm} layout="vertical" onFinish={handleSendUpgrade}>
          <Form.Item name="firmId" label="Firm" rules={[{ required: true }]}>
            <Select placeholder="Select a firm" showSearch>
              {allFirmsForSelect.map((firm) => (
                <Option key={firm._id} value={firm._id}>
                  {firm.name} ({firm.subscription?.plan})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="targetPlan" label="Target Plan" rules={[{ required: true }]}>
            <Select placeholder="Select target plan">
              <Option value="BASIC">BASIC</Option>
              <Option value="PRO">PRO</Option>
              <Option value="ENTERPRISE">ENTERPRISE</Option>
            </Select>
          </Form.Item>
          <Form.Item name="messageToFirm" label="Message to Firm">
            <TextArea rows={3} placeholder="Optional message" />
          </Form.Item>
          <Form.Item name="internalNotes" label="Internal Notes">
            <TextArea rows={2} placeholder="Notes only visible to you" />
          </Form.Item>
          <Form.Item name="expiresInDays" label="Expires In" initialValue={14}>
            <Select>
              <Option value={7}>7 days</Option>
              <Option value={14}>14 days</Option>
              <Option value={30}>30 days</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Send Invitation
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Invitation URL"
        open={inviteUrlModalVisible}
        onCancel={() => setInviteUrlModalVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => {
            navigator.clipboard.writeText(inviteUrl);
            message.success("Copied to clipboard");
          }}>
            Copy
          </Button>,
          <Button key="close" onClick={() => setInviteUrlModalVisible(false)}>
            Close
          </Button>,
        ]}>
        <Input.TextArea value={inviteUrl} rows={4} readOnly />
      </Modal>

      <Modal
        title="Firm Created"
        open={createFirmModalVisible}
        onCancel={() => setCreateFirmModalVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => {
            navigator.clipboard.writeText(tempPassword);
            message.success("Copied to clipboard");
          }}>
            Copy Password
          </Button>,
          <Button key="close" type="primary" onClick={() => setCreateFirmModalVisible(false)}>
            Close
          </Button>,
        ]}>
        <Alert
          message="Save this password now. It will not be shown again."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <p><strong>Temporary Password:</strong></p>
        <Input.Password value={tempPassword} readOnly />
      </Modal>
    </div>
  );
};

export default PlatformAdminPanel;
