import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Descriptions,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Drawer,
  Form,
} from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import apiService from "../services/api";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const statusConfig = {
  open: { color: "blue", label: "Open", icon: <ClockCircleOutlined /> },
  "in-progress": {
    color: "orange",
    label: "In Progress",
    icon: <ExclamationCircleOutlined />,
  },
  resolved: {
    color: "green",
    label: "Resolved",
    icon: <CheckCircleOutlined />,
  },
  closed: { color: "default", label: "Closed", icon: <CloseCircleOutlined /> },
};

const priorityConfig = {
  low: { color: "default", label: "Low" },
  medium: { color: "blue", label: "Medium" },
  high: { color: "orange", label: "High" },
  urgent: { color: "red", label: "Urgent" },
};

const categoryConfig = {
  bug: { color: "red", label: "Bug Report" },
  feature: { color: "purple", label: "Feature Request" },
  support: { color: "blue", label: "General Support" },
  billing: { color: "green", label: "Billing" },
  other: { color: "default", label: "Other" },
};

const ContactList = () => {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [selectedContact, setSelectedContact] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchContacts = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiService.get("/contacts");
      setContacts(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.count || 0,
      }));
    } catch (error) {
      message.error("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleView = async (record) => {
    try {
      const response = await apiService.get(`/contacts/${record._id}`);
      setSelectedContact(response.data);
      form.setFieldsValue({
        status: response.data.status,
        priority: response.data.priority,
        adminReply: response.data.adminReply,
      });
      setDetailVisible(true);
    } catch (error) {
      message.error("Failed to fetch contact details");
    }
  };

  const handleUpdate = async (values) => {
    setReplyLoading(true);
    try {
      await apiService.put(`/contacts/${selectedContact._id}`, values);
      message.success("Contact updated successfully");
      setDetailVisible(false);
      fetchContacts();
    } catch (error) {
      message.error("Failed to update contact");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Delete this contact?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiService.delete(`/contacts/${record._id}`);
          message.success("Contact deleted successfully");
          fetchContacts();
        } catch (error) {
          message.error("Failed to delete contact");
        }
      },
    });
  };

  const columns = [
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const config = statusConfig[status] || statusConfig.open;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => {
        const config = priorityConfig[priority] || priorityConfig.medium;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 130,
      render: (category) => {
        const config = categoryConfig[category] || categoryConfig.other;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => dayjs(date).format("MMM D, YYYY h:mm A"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}>
            View
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const unreadCount = contacts.filter((c) => !c.readByAdmin).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="mb-1">
            Support Tickets
          </Title>
          <Text type="secondary">
            Manage and respond to user support requests
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => fetchContacts()}>
          Refresh
        </Button>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Open Tickets"
              value={contacts.filter((c) => c.status === "open").length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={contacts.filter((c) => c.status === "in-progress").length}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Resolved"
              value={contacts.filter((c) => c.status === "resolved").length}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Unread"
              value={unreadCount}
              valueStyle={{ color: unreadCount > 0 ? "#f5222d" : "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={contacts}
          loading={loading}
          rowKey="_id"
          pagination={{
            ...pagination,
            onChange: (page) => {
              setPagination((prev) => ({ ...prev, current: page }));
              fetchContacts(page);
            },
          }}
        />
      </Card>

      <Drawer
        title="Support Ticket Details"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button onClick={() => setDetailVisible(false)} className="mr-2">
              Cancel
            </Button>
            <Button
              type="primary"
              loading={replyLoading}
              onClick={() => form.submit()}>
              Save Changes
            </Button>
          </div>
        }>
        {selectedContact && (
          <>
            <Descriptions bordered column={1} className="mb-4">
              <Descriptions.Item label="Status">
                <Tag color={statusConfig[selectedContact.status]?.color}>
                  {statusConfig[selectedContact.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={priorityConfig[selectedContact.priority]?.color}>
                  {priorityConfig[selectedContact.priority]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color={categoryConfig[selectedContact.category]?.color}>
                  {categoryConfig[selectedContact.category]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Name">
                {selectedContact.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedContact.email}
              </Descriptions.Item>
              <Descriptions.Item label="Subject">
                {selectedContact.subject}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {dayjs(selectedContact.createdAt).format("MMMM D, YYYY h:mm A")}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Message</Title>
            <Card className="mb-4 bg-gray-50">{selectedContact.message}</Card>

            <Form form={form} layout="vertical" onFinish={handleUpdate}>
              <Form.Item label="Update Status" name="status">
                <Select>
                  <Option value="open">Open</Option>
                  <Option value="in-progress">In Progress</Option>
                  <Option value="resolved">Resolved</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Update Priority" name="priority">
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Admin Reply" name="adminReply">
                <TextArea
                  rows={4}
                  placeholder="Enter your response to the user..."
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default ContactList;
