import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Modal,
  Form,
  Typography,
  DatePicker,
  TimePicker,
  Tooltip,
  Row,
  Col,
  Badge,
  Descriptions,
  message,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  addRequest,
  updateRequest,
  deleteRequest,
  fetchRetainerDetails,
} from "../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RequestsManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [form] = Form.useForm();

  const details = useSelector((state) => state.retainer.selectedDetails);
  const loading = useSelector((state) => state.retainer.actionLoading);

  const requests = details?.requests || [];

  // Status options
  const statusOptions = [
    { value: "pending", label: "Pending", color: "warning" },
    { value: "in-progress", label: "In Progress", color: "processing" },
    { value: "completed", label: "Completed", color: "success" },
    { value: "on-hold", label: "On Hold", color: "default" },
  ];

  // Priority options
  const priorityOptions = [
    { value: "low", label: "Low", color: "default" },
    { value: "normal", label: "Normal", color: "blue" },
    { value: "high", label: "High", color: "orange" },
    { value: "urgent", label: "Urgent", color: "red" },
  ];

  // Request type options
  const requestTypes = [
    "Legal Advice",
    "Document Review",
    "Contract Drafting",
    "Compliance Check",
    "Meeting Request",
    "Research Request",
    "Dispute Assistance",
    "Regulatory Query",
    "Other",
  ];

  // Handle request operations
  const handleAddRequest = async (values) => {
    try {
      await dispatch(
        addRequest({
          matterId,
          data: {
            ...values,
            requestDate: dayjs().toISOString(),
          },
        }),
      ).unwrap();
      message.success("Request added successfully");
      setShowModal(false);
      form.resetFields();
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to add request");
    }
  };

  const handleUpdateRequest = async (requestId, values) => {
    try {
      await dispatch(
        updateRequest({
          matterId,
          requestId,
          data: values,
        }),
      ).unwrap();
      message.success("Request updated successfully");
      setShowModal(false);
      setEditingRequest(null);
      form.resetFields();
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to update request");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await dispatch(deleteRequest({ matterId, requestId })).unwrap();
      message.success("Request deleted successfully");
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to delete request");
    }
  };

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
    urgent: requests.filter((r) => r.priority === "urgent").length,
  };

  // Table columns
  const columns = [
    {
      title: "Request Type",
      dataIndex: "requestType",
      key: "requestType",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text style={{ maxWidth: 200 }} ellipsis>
            {text}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Request Date",
      dataIndex: "requestDate",
      key: "requestDate",
      width: 120,
      render: (date) => dayjs(date).format("DD/MM/YY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const option = statusOptions.find((opt) => opt.value === status);
        return option ? (
          <Tag color={option.color}>{option.label}</Tag>
        ) : (
          <Tag>{status}</Tag>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => {
        const option = priorityOptions.find((opt) => opt.value === priority);
        return option ? (
          <Tag color={option.color}>{option.label}</Tag>
        ) : (
          <Tag>{priority}</Tag>
        );
      },
    },
    {
      title: "Response Time",
      dataIndex: "responseTimeHours",
      key: "responseTimeHours",
      width: 120,
      render: (hours) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{hours || "N/A"} hrs</Text>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedRequest(record);
              setShowDetailModal(true);
            }}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingRequest(record);
              form.setFieldsValue({
                ...record,
                requestDate: record.requestDate
                  ? dayjs(record.requestDate)
                  : null,
              });
              setShowModal(true);
            }}
          />
          <Popconfirm
            title="Delete this request?"
            onConfirm={() => handleDeleteRequest(record._id)}
            okText="Yes"
            cancelText="No">
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                {stats.total}
              </Title>
              <Text type="secondary">Total Requests</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <Badge
                count={stats.pending}
                style={{ backgroundColor: "#faad14" }}>
                <Title level={2} style={{ margin: 0, color: "#faad14" }}>
                  {stats.pending}
                </Title>
              </Badge>
              <Text type="secondary">Pending</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <Badge count={stats.urgent}>
                <Title level={2} style={{ margin: 0, color: "#cf1322" }}>
                  {stats.urgent}
                </Title>
              </Badge>
              <Text type="secondary">Urgent</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <div style={{ textAlign: "center" }}>
              <Title level={2} style={{ margin: 0, color: "#52c41a" }}>
                {stats.completed}
              </Title>
              <Text type="secondary">Completed</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}>
        <Title level={4} style={{ margin: 0 }}>
          Client Requests
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRequest(null);
            form.resetFields();
            setShowModal(true);
          }}>
          Add Request
        </Button>
      </div>

      {/* Requests Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} requests`,
          }}
          size="middle"
        />
      </Card>

      {/* Request Form Modal */}
      <Modal
        title={editingRequest ? "Edit Request" : "Add Request"}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingRequest(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={700}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const formattedValues = {
              ...values,
              requestDate: values.requestDate
                ? values.requestDate.toISOString()
                : new Date().toISOString(),
            };

            if (editingRequest) {
              handleUpdateRequest(editingRequest._id, formattedValues);
            } else {
              handleAddRequest(formattedValues);
            }
          }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="requestType"
                label="Request Type"
                rules={[
                  { required: true, message: "Please select request type" },
                ]}>
                <Select placeholder="Select request type" showSearch>
                  {requestTypes.map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: "Please select priority" }]}>
                <Select placeholder="Select priority">
                  {priorityOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      <Tag color={opt.color}>{opt.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}>
            <TextArea
              rows={4}
              placeholder="Describe the request in detail..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="requestDate"
                label="Request Date"
                rules={[{ required: true, message: "Please select date" }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="responseTimeHours"
                label="Expected Response Time (hours)">
                <InputNumber
                  min={1}
                  max={720}
                  style={{ width: "100%" }}
                  placeholder="24"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}>
            <Select placeholder="Select status">
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  <Tag color={opt.color}>{opt.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Request Detail Modal */}
      <Modal
        title="Request Details"
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        footer={null}
        width={600}>
        {selectedRequest && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Type">
              <Text strong>{selectedRequest.requestType}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedRequest.description}
            </Descriptions.Item>
            <Descriptions.Item label="Request Date">
              {dayjs(selectedRequest.requestDate).format("DD MMM YYYY, HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={
                  selectedRequest.status === "completed"
                    ? "success"
                    : selectedRequest.status === "in-progress"
                      ? "processing"
                      : selectedRequest.status === "pending"
                        ? "warning"
                        : "default"
                }>
                {selectedRequest.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag
                color={
                  selectedRequest.priority === "urgent"
                    ? "red"
                    : selectedRequest.priority === "high"
                      ? "orange"
                      : selectedRequest.priority === "normal"
                        ? "blue"
                        : "default"
                }>
                {selectedRequest.priority?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Response Time">
              {selectedRequest.responseTimeHours ? (
                <Text>{selectedRequest.responseTimeHours} hours</Text>
              ) : (
                <Text type="secondary">Not specified</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(selectedRequest.createdAt).format("DD MMM YYYY, HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {dayjs(selectedRequest.updatedAt).format("DD MMM YYYY, HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default RequestsManager;
