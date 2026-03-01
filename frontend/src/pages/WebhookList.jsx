import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Typography,
  Popconfirm,
  Spin,
  Badge,
  Descriptions,
  Tabs,
  Divider,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { TextArea } = Input;

const availableEvents = [
  { value: "matter.created", label: "Matter Created" },
  { value: "matter.updated", label: "Matter Updated" },
  { value: "matter.deleted", label: "Matter Deleted" },
  { value: "matter.status_changed", label: "Matter Status Changed" },
  { value: "task.created", label: "Task Created" },
  { value: "task.updated", label: "Task Updated" },
  { value: "task.completed", label: "Task Completed" },
  { value: "invoice.created", label: "Invoice Created" },
  { value: "invoice.paid", label: "Invoice Paid" },
  { value: "invoice.overdue", label: "Invoice Overdue" },
  { value: "payment.created", label: "Payment Created" },
  { value: "user.created", label: "User Created" },
  { value: "user.updated", label: "User Updated" },
  { value: "calendar.event.created", label: "Calendar Event Created" },
  { value: "calendar.event.updated", label: "Calendar Event Updated" },
];

const WebhookList = () => {
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState([]);
  const [webhook, setWebhook] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [deliveriesModalVisible, setDeliveriesModalVisible] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [secretModalVisible, setSecretModalVisible] = useState(false);
  const [regeneratedSecret, setRegeneratedSecret] = useState("");

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/webhooks");
      setWebhooks(response.data.data || []);
    } catch (error) {
      message.error("Failed to fetch webhooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = () => {
    setWebhook(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setWebhook(record);
    form.setFieldsValue({
      name: record.name,
      url: record.url,
      events: record.events,
      isActive: record.isActive,
    });
    setModalVisible(true);
  };

  const handleView = async (record) => {
    try {
      const response = await axios.get(`/api/v1/webhooks/${record._id}`);
      setWebhook(response.data.data);
      setDetailsModalVisible(true);
    } catch (error) {
      message.error("Failed to fetch webhook details");
    }
  };

  const handleViewDeliveries = async (record) => {
    setWebhook(record);
    setDeliveriesLoading(true);
    setDeliveriesModalVisible(true);
    try {
      const response = await axios.get(`/api/v1/webhooks/${record._id}/deliveries`);
      setDeliveries(response.data.data || []);
    } catch (error) {
      message.error("Failed to fetch deliveries");
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/v1/webhooks/${id}`);
      message.success("Webhook deleted successfully");
      fetchWebhooks();
    } catch (error) {
      message.error("Failed to delete webhook");
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (webhook) {
        await axios.patch(`/api/v1/webhooks/${webhook._id}`, values);
        message.success("Webhook updated successfully");
      } else {
        await axios.post("/api/v1/webhooks", values);
        message.success("Webhook created successfully");
      }
      setModalVisible(false);
      fetchWebhooks();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save webhook");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async (record) => {
    try {
      const response = await axios.post(`/api/v1/webhooks/${record._id}/test`);
      if (response.data.success) {
        message.success("Test webhook delivered successfully");
      } else {
        message.warning("Test webhook failed to deliver");
      }
    } catch (error) {
      message.error("Failed to send test webhook");
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await axios.patch(`/api/v1/webhooks/${record._id}`, {
        isActive: !record.isActive,
      });
      message.success(`Webhook ${record.isActive ? "disabled" : "enabled"}`);
      fetchWebhooks();
    } catch (error) {
      message.error("Failed to update webhook");
    }
  };

  const handleRegenerateSecret = async () => {
    try {
      const response = await axios.get(`/api/v1/webhooks/${webhook._id}/regenerate-secret`);
      setRegeneratedSecret(response.data.data.secret);
      setSecretModalVisible(true);
      fetchWebhooks();
    } catch (error) {
      message.error("Failed to regenerate secret");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.url}</Text>
        </Space>
      ),
    },
    {
      title: "Events",
      dataIndex: "events",
      key: "events",
      render: (events) => (
        <Space wrap>
          {events.slice(0, 3).map((event) => (
            <Tag key={event}>{event}</Tag>
          ))}
          {events.length > 3 && <Tag>+{events.length - 3} more</Tag>}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Last Triggered",
      dataIndex: "lastTriggeredAt",
      key: "lastTriggeredAt",
      width: 150,
      render: (date) => date ? dayjs(date).format("MMM DD, HH:mm") : "Never",
    },
    {
      title: "Trigger Count",
      dataIndex: "triggerCount",
      key: "triggerCount",
      width: 120,
      render: (count, record) => (
        <Badge count={count} showZero color="blue" />
      ),
    },
    {
      title: "Last Status",
      dataIndex: "lastStatus",
      key: "lastStatus",
      width: 100,
      render: (status) => {
        const statusConfig = {
          SUCCESS: { color: "success", icon: <CheckCircleOutlined /> },
          FAILED: { color: "error", icon: <CloseCircleOutlined /> },
          PENDING: { color: "processing", icon: <ClockCircleOutlined /> },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return <Badge status={config.color} text={status || "Never"} />;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTest(record)}
          >
            Test
          </Button>
          <Button
            type="link"
            onClick={() => handleViewDeliveries(record)}
          >
            Logs
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete this webhook?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const deliveryColumns = [
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => dayjs(date).format("MMM DD, YYYY HH:mm:ss"),
    },
    {
      title: "Event",
      dataIndex: "event",
      key: "event",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors = { SUCCESS: "success", FAILED: "error", PENDING: "processing" };
        return <Badge status={colors[status]} text={status} />;
      },
    },
    {
      title: "Response Code",
      dataIndex: "responseStatus",
      key: "responseStatus",
      render: (code) => code || "-",
    },
    {
      title: "Error",
      dataIndex: "errorMessage",
      key: "errorMessage",
      ellipsis: true,
      render: (error) => error || "-",
    },
    {
      title: "Attempts",
      dataIndex: "attempts",
      key: "attempts",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <Text type="secondary">Manage integrations with external services</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Webhook
        </Button>
      </div>

      <Alert
        message="Webhook Integration"
        description="Webhooks allow external services to receive real-time notifications when events occur in your workspace. Configure endpoints to integrate with your CRM, accounting software, or custom workflows."
        type="info"
        showIcon
        className="mb-6"
      />

      <Card>
        <Table
          columns={columns}
          dataSource={webhooks}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={webhook ? "Edit Webhook" : "Create Webhook"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g., Slack Notifications" />
          </Form.Item>

          <Form.Item
            name="url"
            label="Endpoint URL"
            rules={[
              { required: true, message: "Please enter URL" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
          >
            <Input placeholder="https://your-service.com/webhook" />
          </Form.Item>

          <Form.Item
            name="events"
            label="Events"
            rules={[{ required: true, message: "Select at least one event" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select events to trigger webhook"
              options={availableEvents}
            />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Space>
              <Switch defaultChecked />
              <Text>Enable webhook immediately</Text>
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {webhook ? "Update" : "Create"} Webhook
              </Button>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Webhook Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="test" icon={<PlayCircleOutlined />} onClick={() => handleTest(webhook)}>
            Send Test
          </Button>,
          <Button key="secret" icon={<ReloadOutlined />} onClick={handleRegenerateSecret}>
            Regenerate Secret
          </Button>,
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {webhook && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Name" span={2}>
              {webhook.name}
            </Descriptions.Item>
            <Descriptions.Item label="URL" span={2}>
              {webhook.url}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge status={webhook.isActive ? "success" : "default"} text={webhook.isActive ? "Active" : "Inactive"} />
            </Descriptions.Item>
            <Descriptions.Item label="Trigger Count">
              {webhook.triggerCount}
            </Descriptions.Item>
            <Descriptions.Item label="Last Triggered" span={2}>
              {webhook.lastTriggeredAt ? dayjs(webhook.lastTriggeredAt).format("MMMM DD, YYYY HH:mm:ss") : "Never"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Status" span={2}>
              {webhook.lastStatus || "N/A"}
            </Descriptions.Item>
            {webhook.lastError && (
              <Descriptions.Item label="Last Error" span={2}>
                <Text type="danger">{webhook.lastError}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Events" span={2}>
              <Space wrap>
                {webhook.events.map((event) => (
                  <Tag key={event}>{event}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={`Webhook Deliveries - ${webhook?.name}`}
        open={deliveriesModalVisible}
        onCancel={() => setDeliveriesModalVisible(false)}
        footer={<Button onClick={() => setDeliveriesModalVisible(false)}>Close</Button>}
        width={900}
      >
        <Spin spinning={deliveriesLoading}>
          <Table
            columns={deliveryColumns}
            dataSource={deliveries}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Modal>

      <Modal
        title="Webhook Secret Regenerated"
        open={secretModalVisible}
        onCancel={() => setSecretModalVisible(false)}
        footer={<Button type="primary" onClick={() => setSecretModalVisible(false)}>I have saved my secret</Button>}
      >
        <Alert
          message="Important"
          description="Copy and save this secret securely. You won't be able to see it again!"
          type="warning"
          showIcon
          className="mb-4"
        />
        <TextArea
          value={regeneratedSecret}
          rows={3}
          readOnly
          style={{ fontFamily: "monospace" }}
        />
      </Modal>
    </div>
  );
};

export default WebhookList;
