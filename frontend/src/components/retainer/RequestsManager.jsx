import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Popconfirm,
  Modal,
  Form,
  Typography,
  DatePicker,
  InputNumber,
  Tooltip,
  Row,
  Col,
  Badge,
  Statistic,
  message,
  Tag,
  Descriptions,
  Timeline,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  addRequest,
  updateRequest,
  deleteRequest,
  fetchRetainerDetails,
} from "../../redux/features/retainer/retainerSlice";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * RequestsManager Component
 * Manages client requests within retainer agreements
 * Tracks status, priority, and response times
 */
const RequestsManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [form] = Form.useForm();

  // Redux state
  const details = useSelector((state) => state.retainer.selectedDetails);
  const loading = useSelector((state) => state.retainer.actionLoading);

  const requests = details?.requests || [];

  // Status configuration
  const statusConfig = [
    {
      value: "pending",
      label: "Pending",
      color: "warning",
      icon: <ClockCircleOutlined />,
    },
    {
      value: "in-progress",
      label: "In Progress",
      color: "processing",
      icon: <ExclamationCircleOutlined />,
    },
    {
      value: "completed",
      label: "Completed",
      color: "success",
      icon: <CheckCircleOutlined />,
    },
    {
      value: "on-hold",
      label: "On Hold",
      color: "default",
      icon: <WarningOutlined />,
    },
  ];

  // Priority configuration
  const priorityConfig = [
    { value: "low", label: "Low", color: "default" },
    { value: "normal", label: "Normal", color: "blue" },
    { value: "high", label: "High", color: "orange" },
    { value: "urgent", label: "Urgent", color: "red" },
  ];

  // Nigerian legal request types
  const requestTypes = [
    "Legal Advice",
    "Document Review",
    "Contract Drafting",
    "Compliance Check",
    "Meeting Request",
    "Research Request",
    "Dispute Assistance",
    "Regulatory Query",
    "CAC Filing",
    "Court Appearance",
    "Opinion Letter",
    "Due Diligence",
    "Other",
  ];

  // Calculate statistics
  const calculateStats = () => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const inProgress = requests.filter(
      (r) => r.status === "in-progress",
    ).length;
    const completed = requests.filter((r) => r.status === "completed").length;
    const urgent = requests.filter((r) => r.priority === "urgent").length;
    const overdue = requests.filter((r) => {
      if (r.status === "completed" || !r.responseDate) return false;
      return dayjs().isAfter(dayjs(r.responseDate));
    }).length;

    return { total, pending, inProgress, completed, urgent, overdue };
  };

  const stats = calculateStats();

  // Handlers
  const handleAddRequest = async (values) => {
    try {
      const formData = {
        ...values,
        requestDate:
          values.requestDate?.toISOString() || new Date().toISOString(),
        responseDate: values.responseDate?.toISOString(),
      };

      await dispatch(addRequest({ matterId, data: formData })).unwrap();
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
      const formData = {
        ...values,
        requestDate: values.requestDate?.toISOString(),
        responseDate: values.responseDate?.toISOString(),
      };

      await dispatch(
        updateRequest({ matterId, requestId, data: formData }),
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

  // Table columns
  const columns = [
    {
      title: "Request Type",
      dataIndex: "requestType",
      key: "requestType",
      width: 150,
      render: (text) => (
        <Text strong className="text-gray-800">
          {text}
        </Text>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text className="text-gray-600">{text || "N/A"}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Request Date",
      dataIndex: "requestDate",
      key: "requestDate",
      width: 120,
      render: (date) => (
        <Tooltip title={dayjs(date).format("DD MMM YYYY, HH:mm")}>
          <Text>{dayjs(date).format("DD/MM/YY")}</Text>
        </Tooltip>
      ),
      sorter: (a, b) =>
        dayjs(a.requestDate).unix() - dayjs(b.requestDate).unix(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      filters: statusConfig.map((s) => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const config = statusConfig.find((s) => s.value === status);
        return (
          <Tag color={config?.color} icon={config?.icon}>
            {config?.label || status}
          </Tag>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      filters: priorityConfig.map((p) => ({ text: p.label, value: p.value })),
      onFilter: (value, record) => record.priority === value,
      render: (priority) => {
        const config = priorityConfig.find((p) => p.value === priority);
        return <Tag color={config?.color}>{config?.label || priority}</Tag>;
      },
    },
    {
      title: "Response Time",
      dataIndex: "responseTimeHours",
      key: "responseTimeHours",
      width: 120,
      render: (hours, record) => {
        if (!hours && !record.responseDate)
          return <Text type="secondary">N/A</Text>;

        const now = dayjs();
        const requestDate = dayjs(record.requestDate);
        const responseDate = record.responseDate
          ? dayjs(record.responseDate)
          : null;
        const actualHours = responseDate
          ? responseDate.diff(requestDate, "hour")
          : now.diff(requestDate, "hour");

        const isOverdue = responseDate && actualHours > hours;
        const status =
          record.status === "completed"
            ? "success"
            : isOverdue
              ? "error"
              : "processing";

        return (
          <Space direction="vertical" size={0}>
            <Text type={isOverdue ? "danger" : "secondary"}>
              Target: {hours || "N/A"} hrs
            </Text>
            {record.status !== "completed" && (
              <Tag color={status} className="text-xs">
                {actualHours}h elapsed
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Units Consumed",
      dataIndex: "unitsConsumed",
      key: "unitsConsumed",
      width: 100,
      align: "center",
      render: (units) => (
        <Badge
          count={units || 0}
          showZero
          style={{ backgroundColor: units > 0 ? "#52c41a" : "#d9d9d9" }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="View details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedRequest(record);
                setShowDetailModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit request">
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
                  responseDate: record.responseDate
                    ? dayjs(record.responseDate)
                    : null,
                });
                setShowModal(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this request?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteRequest(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}>
            <Tooltip title="Delete request">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="requests-manager">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={4}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Requests"
              value={stats.total}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined className="text-orange-500" />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              prefix={<ExclamationCircleOutlined className="text-blue-500" />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Urgent"
              value={stats.urgent}
              prefix={<WarningOutlined className="text-red-500" />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Overdue"
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined className="text-red-500" />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {stats.urgent > 0 && (
        <div className="mb-4">
          <Badge
            status="error"
            text={
              <Text type="danger">
                {stats.urgent} urgent request(s) requiring immediate attention
              </Text>
            }
          />
        </div>
      )}
      {stats.overdue > 0 && (
        <div className="mb-4">
          <Badge
            status="error"
            text={
              <Text type="danger">{stats.overdue} request(s) are overdue</Text>
            }
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">
          <FileTextOutlined className="mr-2" />
          Client Requests
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRequest(null);
            form.resetFields();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700">
          Add Request
        </Button>
      </div>

      {/* Requests Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} request(s)`,
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record) => {
            if (record.priority === "urgent") return "bg-red-50";
            if (record.status === "completed") return "bg-green-50";
            return "";
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No requests yet">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowModal(true)}>
                  Add First Request
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Request Form Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {editingRequest ? "Edit Request" : "Add Request"}
          </Space>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingRequest(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={700}
        okText={editingRequest ? "Update Request" : "Add Request"}
        cancelText="Cancel">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (editingRequest) {
              handleUpdateRequest(editingRequest._id, values);
            } else {
              handleAddRequest(values);
            }
          }}
          initialValues={{
            status: "pending",
            priority: "normal",
            requestDate: dayjs(),
            unitsConsumed: 1,
          }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="requestType"
                label="Request Type"
                rules={[
                  { required: true, message: "Please select request type" },
                ]}>
                <Select
                  placeholder="Select request type"
                  showSearch
                  optionFilterProp="children">
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
                  {priorityConfig.map((priority) => (
                    <Option key={priority.value} value={priority.value}>
                      <Tag color={priority.color}>{priority.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Request Description"
            rules={[{ required: true, message: "Please enter description" }]}>
            <TextArea
              rows={4}
              placeholder="Describe the client's request in detail..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="requestDate"
                label="Request Date"
                rules={[{ required: true, message: "Please select date" }]}>
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  className="w-full"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="responseTimeHours"
                label="Expected Response (hours)">
                <InputNumber
                  min={1}
                  max={720}
                  className="w-full"
                  placeholder="24"
                  addonAfter="hrs"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unitsConsumed"
                label="Units to Consume"
                rules={[
                  { required: true, message: "Required" },
                  { type: "number", min: 0, message: "Cannot be negative" },
                ]}>
                <InputNumber min={0} className="w-full" placeholder="1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}>
                <Select placeholder="Select status">
                  {statusConfig.map((status) => (
                    <Option key={status.value} value={status.value}>
                      <Tag color={status.color} icon={status.icon}>
                        {status.label}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="responseDate" label="Response Date (Optional)">
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Additional Notes (Optional)">
            <TextArea rows={2} placeholder="Any additional information..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Request Detail Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Request Details
          </Space>
        }
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        footer={[
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setEditingRequest(selectedRequest);
              form.setFieldsValue({
                ...selectedRequest,
                requestDate: selectedRequest.requestDate
                  ? dayjs(selectedRequest.requestDate)
                  : null,
                responseDate: selectedRequest.responseDate
                  ? dayjs(selectedRequest.responseDate)
                  : null,
              });
              setShowDetailModal(false);
              setShowModal(true);
            }}>
            Edit Request
          </Button>,
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>,
        ]}
        width={600}>
        {selectedRequest && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Request Type">
                <Text strong>{selectedRequest.requestType}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedRequest.description}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {statusConfig.find(
                  (s) => s.value === selectedRequest.status,
                ) && (
                  <Tag
                    color={
                      statusConfig.find(
                        (s) => s.value === selectedRequest.status,
                      ).color
                    }
                    icon={
                      statusConfig.find(
                        (s) => s.value === selectedRequest.status,
                      ).icon
                    }>
                    {
                      statusConfig.find(
                        (s) => s.value === selectedRequest.status,
                      ).label
                    }
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {priorityConfig.find(
                  (p) => p.value === selectedRequest.priority,
                ) && (
                  <Tag
                    color={
                      priorityConfig.find(
                        (p) => p.value === selectedRequest.priority,
                      ).color
                    }>
                    {
                      priorityConfig.find(
                        (p) => p.value === selectedRequest.priority,
                      ).label
                    }
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Request Date">
                {dayjs(selectedRequest.requestDate).format(
                  "DD MMM YYYY, HH:mm",
                )}
              </Descriptions.Item>
              {selectedRequest.responseDate && (
                <Descriptions.Item label="Response Date">
                  {dayjs(selectedRequest.responseDate).format(
                    "DD MMM YYYY, HH:mm",
                  )}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Expected Response Time">
                {selectedRequest.responseTimeHours ? (
                  <Text>{selectedRequest.responseTimeHours} hours</Text>
                ) : (
                  <Text type="secondary">Not specified</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Units Consumed">
                <Badge
                  count={selectedRequest.unitsConsumed || 0}
                  showZero
                  style={{
                    backgroundColor:
                      selectedRequest.unitsConsumed > 0 ? "#52c41a" : "#d9d9d9",
                  }}
                />
              </Descriptions.Item>
              {selectedRequest.notes && (
                <Descriptions.Item label="Notes">
                  {selectedRequest.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedRequest.createdAt && (
              <div className="mt-4">
                <Text type="secondary" className="text-xs">
                  Created:{" "}
                  {dayjs(selectedRequest.createdAt).format(
                    "DD MMM YYYY, HH:mm",
                  )}
                </Text>
                {selectedRequest.updatedAt && (
                  <>
                    <br />
                    <Text type="secondary" className="text-xs">
                      Last Updated:{" "}
                      {dayjs(selectedRequest.updatedAt).format(
                        "DD MMM YYYY, HH:mm",
                      )}
                    </Text>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default RequestsManager;
