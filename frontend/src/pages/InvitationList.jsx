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
      const payload = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        expiresInDays: values.expiresInDays,
        message: values.message,
      };
      const response = await axios.post(
        `${baseURL}/invitations/generate`,
        payload,
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mobileColumns = [
    {
      title: "Details",
      key: "details",
      render: (_, record) => (
        <div className="space-y-2">
          <div>
            <Text strong className="text-sm">{record.email}</Text>
            {record.firstName && (
              <Text type="secondary" className="block text-xs">
                {record.firstName} {record.lastName}
              </Text>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Tag color="blue">{record.role?.toUpperCase()}</Tag>
            {getStatusTag(record.status)}
          </div>
          <Text type="secondary" className="text-xs block">
            Expires: {dayjs(record.expiresAt).fromNow()}
          </Text>
          <Text type="secondary" className="text-xs block">
            By: {record.invitedBy?.firstName} {record.invitedBy?.lastName}
          </Text>
          <div className="flex gap-2 pt-1">
            {record.status === "pending" && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={() => handleResendInvitation(record._id)}
                />
                <Popconfirm
                  title="Cancel this invitation?"
                  onConfirm={() => handleCancelInvitation(record._id)}>
                  <Button type="text" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </>
            )}
            <Popconfirm
              title="Delete this invitation permanently?"
              onConfirm={() => handleDeleteInvitation(record._id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-6">
        <div>
          <Title level={3} className="!mb-1">
            Invitations
          </Title>
          <Text type="secondary" className="text-sm md:text-base">
            Manage user invitations
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          className="w-full md:w-auto">
          Generate
        </Button>
      </div>

      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search..."
            prefix={<MailOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full sm:w-48 md:w-64"
            allowClear
          />
          <Select
            placeholder="Status"
            value={filters.status || undefined}
            onChange={(value) =>
              setFilters({ ...filters, status: value || "" })
            }
            allowClear
            className="w-full sm:w-32 md:w-40">
            <Option value="pending">Pending</Option>
            <Option value="accepted">Accepted</Option>
            <Option value="expired">Expired</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchInvitations(pagination.current)}
            className="w-full sm:w-auto">
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
            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <Table
                columns={isMobile ? mobileColumns : columns}
                dataSource={invitations}
                rowKey="_id"
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  onChange: (page) => fetchInvitations(page),
                  showSizeChanger: false,
                  size: isMobile ? "small" : "default",
                }}
                scroll={{ x: isMobile ? 400 : undefined }}
              />
            </div>
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
        width={isMobile ? "95vw" : 500}
        className="md:hidden">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateInvitation}
          initialValues={{ role: "staff", expiresInDays: 7 }}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}>
            <Input prefix={<MailOutlined />} placeholder="user@example.com" />
          </Form.Item>

          <div className="flex flex-col sm:flex-row gap-3">
            <Form.Item name="firstName" label="First Name" className="flex-1">
              <Input placeholder="John" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" className="flex-1">
              <Input placeholder="Doe" />
            </Form.Item>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Form.Item name="role" label="Role" rules={[{ required: true }]} className="flex-1">
              <Select>
                <Option value="staff">Staff</Option>
                <Option value="lawyer">Lawyer</Option>
                <Option value="secretary">Secretary</Option>
                <Option value="admin">Admin</Option>
                <Option value="client">Client</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="expiresInDays"
              label="Expires In"
              rules={[{ required: true }]}
              className="flex-1">
              <Select>
                <Option value={3}>3 days</Option>
                <Option value={7}>7 days</Option>
                <Option value={14}>14 days</Option>
                <Option value={30}>30 days</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="message" label="Welcome Message (optional)">
            <Input.TextArea
              rows={3}
              placeholder="Optional message for the invitee..."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<UserAddOutlined />}>
                Generate
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvitationList;
