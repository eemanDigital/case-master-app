import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Tooltip,
  Popconfirm,
  Typography,
  Empty,
  Spin,
  Alert,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  CopyOutlined,
  SendOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  MailOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api/v1";

const InvitationList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [form] = Form.useForm();

  const fetchInvitations = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
      };
      const response = await axios.get(`${baseURL}/invitations`, { params });
      setInvitations(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        current: response.data.pagination?.current || page,
        total: response.data.pagination?.totalRecords || 0,
      }));
    } catch (error) {
      message.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [filters]);

  const handleGenerateInvitation = async (values) => {
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${baseURL}/invitations/generate`,
        values,
      );
      message.success("Invitation generated successfully!");

      const inviteUrl = `${window.location.origin}/register?token=${response.data.data.inviteUrl.split("token=")[1]}`;

      Modal.success({
        title: "Invitation Created",
        content: (
          <div>
            <p className="mb-2">Send this link to the user:</p>
            <Input.TextArea
              value={inviteUrl}
              rows={3}
              readOnly
              className="mb-2"
            />
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                message.success("Copied to clipboard!");
              }}>
              Copy Link
            </Button>
          </div>
        ),
        onOk: () => {
          setModalVisible(false);
          form.resetFields();
          fetchInvitations();
        },
      });
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to generate invitation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvitation = async (id) => {
    try {
      await axios.patch(`${baseURL}/invitations/${id}/cancel`);
      message.success("Invitation cancelled");
      fetchInvitations(pagination.current);
    } catch (error) {
      message.error("Failed to cancel invitation");
    }
  };

  const handleDeleteInvitation = async (id) => {
    try {
      await axios.delete(`${baseURL}/invitations/${id}`);
      message.success("Invitation deleted");
      fetchInvitations(pagination.current);
    } catch (error) {
      message.error("Failed to delete invitation");
    }
  };

  const handleResendInvitation = async (id) => {
    try {
      const response = await axios.post(`${baseURL}/invitations/resend/${id}`);
      message.success("Invitation resent");

      const inviteUrl = `${window.location.origin}/register?token=${response.data.data.inviteUrl.split("token=")[1]}`;

      Modal.success({
        title: "Invitation Resent",
        content: (
          <div>
            <p className="mb-2">New invitation link:</p>
            <Input.TextArea
              value={inviteUrl}
              rows={3}
              readOnly
              className="mb-2"
            />
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                message.success("Copied to clipboard!");
              }}>
              Copy Link
            </Button>
          </div>
        ),
      });
    } catch (error) {
      message.error("Failed to resend invitation");
    }
  };

  const getStatusTag = (status) => {
    const config = {
      pending: {
        color: "blue",
        icon: <ClockCircleOutlined />,
        text: "Pending",
      },
      accepted: {
        color: "green",
        icon: <CheckCircleOutlined />,
        text: "Accepted",
      },
      expired: {
        color: "default",
        icon: <ClockCircleOutlined />,
        text: "Expired",
      },
      cancelled: {
        color: "red",
        icon: <CloseCircleOutlined />,
        text: "Cancelled",
      },
    };
    const { color, icon, text } = config[status] || config.pending;
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    );
  };

  const getPlanTag = (plan) => {
    const config = {
      FREE: { color: "default", text: "Free Trial" },
      STARTER: { color: "blue", text: "Starter" },
      PROFESSIONAL: { color: "purple", text: "Professional" },
      ENTERPRISE: { color: "gold", text: "Enterprise" },
    };
    const { color, text } = config[plan] || config.FREE;
    return <Tag color={color}>{text}</Tag>;
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email, record) => (
        <div>
          <Text strong>{email}</Text>
          {record.firstName && (
            <div>
              <Text type="secondary" className="text-xs">
                {record.firstName} {record.lastName}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag color="blue">{role?.toUpperCase()}</Tag>,
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: (plan) => getPlanTag(plan),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Expires",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (date) => (
        <Tooltip title={dayjs(date).format("MMM DD, YYYY HH:mm")}>
          <span>{dayjs(date).fromNow()}</span>
        </Tooltip>
      ),
    },
    {
      title: "Invited By",
      dataIndex: ["invitedBy", "firstName"],
      key: "invitedBy",
      render: (_, record) => (
        <Text type="secondary">
          {record.invitedBy?.firstName} {record.invitedBy?.lastName}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status === "pending" && (
            <>
              <Tooltip title="Resend">
                <Button
                  type="text"
                  icon={<SendOutlined />}
                  onClick={() => handleResendInvitation(record._id)}
                />
              </Tooltip>
              <Tooltip title="Cancel">
                <Popconfirm
                  title="Cancel this invitation?"
                  onConfirm={() => handleCancelInvitation(record._id)}>
                  <Button type="text" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this invitation permanently?"
              onConfirm={() => handleDeleteInvitation(record._id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="!mb-1">
            Invitations
          </Title>
          <Text type="secondary">
            Manage user invitations and subscription plans
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}>
          Generate Invitation
        </Button>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by email or name..."
            prefix={<MailOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-64"
            allowClear
          />
          <Select
            placeholder="Filter by status"
            value={filters.status || undefined}
            onChange={(value) =>
              setFilters({ ...filters, status: value || "" })
            }
            allowClear
            className="w-40">
            <Option value="pending">Pending</Option>
            <Option value="accepted">Accepted</Option>
            <Option value="expired">Expired</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchInvitations(pagination.current)}>
            Refresh
          </Button>
        </div>
      </Card>

      <Card>
        <Spin spinning={loading}>
          {invitations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No invitations yet">
              <Button type="primary" onClick={() => setModalVisible(true)}>
                Generate First Invitation
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={invitations}
              rowKey="_id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => fetchInvitations(page),
                showSizeChanger: false,
              }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="Generate Invitation"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}>
        <Alert
          message="Invitation Link"
          description="The generated link will include the subscription plan. When the user registers using this link, their account will be automatically assigned to the selected plan."
          type="info"
          showIcon
          className="mb-4"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateInvitation}
          initialValues={{ role: "staff", plan: "STARTER", expiresInDays: 7 }}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}>
            <Input prefix={<MailOutlined />} placeholder="user@example.com" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="firstName" label="First Name">
              <Input placeholder="John" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name">
              <Input placeholder="Doe" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Select>
                <Option value="staff">Staff</Option>
                <Option value="lawyer">Lawyer</Option>
                <Option value="secretary">Secretary</Option>
                <Option value="admin">Admin</Option>
                <Option value="client">Client</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="plan"
              label="Subscription Plan"
              rules={[{ required: true }]}>
              <Select>
                <Option value="FREE">Free Trial</Option>
                <Option value="STARTER">Starter (₦49/mo)</Option>
                <Option value="PROFESSIONAL">Professional (₦149/mo)</Option>
                <Option value="ENTERPRISE">Enterprise (Custom)</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="expiresInDays"
            label="Expires In (days)"
            rules={[{ required: true }]}>
            <Select>
              <Option value={3}>3 days</Option>
              <Option value={7}>7 days</Option>
              <Option value={14}>14 days</Option>
              <Option value={30}>30 days</Option>
            </Select>
          </Form.Item>

          <Form.Item name="message" label="Welcome Message (optional)">
            <Input.TextArea
              rows={3}
              placeholder="Optional message for the invitee..."
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<UserAddOutlined />}>
              Generate Invitation
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvitationList;
