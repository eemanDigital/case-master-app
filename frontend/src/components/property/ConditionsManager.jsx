import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Tooltip,
  Popconfirm,
  Badge,
  Row,
  Col,
  Alert,
  Statistic,
  Empty,
  Progress,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  addCondition,
  updateCondition,
  removeCondition,
} from "../../redux/features/property/propertySlice";
import {
  CONDITION_STATUS,
  DATE_FORMAT,
  isOverdue,
  getDaysUntil,
} from "../../utils/propertyConstants";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

const ConditionsManager = ({ matterId, conditions = [] }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCondition, setEditingCondition] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = conditions.length;
    const met = conditions.filter((c) => c.status === "met").length;
    const pending = conditions.filter((c) => c.status === "pending").length;
    const overdue = conditions.filter(
      (c) => c.status === "pending" && isOverdue(c.dueDate),
    ).length;
    const waived = conditions.filter((c) => c.status === "waived").length;
    const completionRate = total > 0 ? (met / total) * 100 : 0;

    return { total, met, pending, overdue, waived, completionRate };
  }, [conditions]);

  // Sort conditions by due date
  const sortedConditions = useMemo(() => {
    return [...conditions].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [conditions]);

  // Open modal for adding/editing
  const showModal = (condition = null) => {
    setEditingCondition(condition);
    if (condition) {
      form.setFieldsValue({
        ...condition,
        dueDate: condition.dueDate ? dayjs(condition.dueDate) : null,
      });
    } else {
      form.resetFields();
      form.setFieldValue("status", "pending");
    }
    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      };

      if (editingCondition) {
        await dispatch(
          updateCondition({
            matterId,
            conditionId: editingCondition._id || editingCondition.id,
            data: formattedValues,
          }),
        );
      } else {
        await dispatch(addCondition({ matterId, data: formattedValues }));
      }
      setModalVisible(false);
      form.resetFields();
      setEditingCondition(null);
      message.success(
        editingCondition
          ? "Condition updated successfully"
          : "Condition added successfully",
      );
    } catch (error) {
      message.error("Failed to save condition");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (conditionId) => {
    try {
      await dispatch(removeCondition({ matterId, conditionId }));
      message.success("Condition removed successfully");
    } catch (error) {
      message.error("Failed to remove condition");
    }
  };

  // Mark as met
  const handleMarkAsMet = async (condition) => {
    try {
      await dispatch(
        updateCondition({
          matterId,
          conditionId: condition._id || condition.id,
          data: {
            ...condition,
            status: "met",
          },
        }),
      );
      message.success("Condition marked as met");
    } catch (error) {
      message.error("Failed to update condition");
    }
  };

  // Get status icon and color
  const getStatusConfig = (status, dueDate) => {
    const isOverdueItem = status === "pending" && isOverdue(dueDate);

    if (isOverdueItem) {
      return {
        icon: <ExclamationCircleOutlined />,
        color: "error",
        text: "Overdue",
      };
    }

    switch (status) {
      case "met":
        return { icon: <CheckCircleOutlined />, color: "success", text: "Met" };
      case "pending":
        return {
          icon: <ClockCircleOutlined />,
          color: "processing",
          text: "Pending",
        };
      case "waived":
        return {
          icon: <CheckCircleOutlined />,
          color: "default",
          text: "Waived",
        };
      default:
        return { icon: null, color: "default", text: status };
    }
  };

  // Columns
  const columns = [
    {
      title: "Condition",
      dataIndex: "condition",
      key: "condition",
      ellipsis: true,
      render: (text) => <div className="font-medium">{text}</div>,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 150,
      render: (date, record) => {
        if (!date) return "-";

        const isOverdueItem = isOverdue(date) && record.status === "pending";
        const daysUntil = getDaysUntil(date);

        return (
          <div>
            <div className="flex items-center">
              <CalendarOutlined className="mr-2 text-gray-400" />
              <span>{dayjs(date).format(DATE_FORMAT)}</span>
            </div>
            {!isOverdueItem && daysUntil > 0 && daysUntil <= 30 && (
              <div className="text-xs text-orange-500">
                {daysUntil} days left
              </div>
            )}
            {isOverdueItem && (
              <div className="text-xs text-red-500">Overdue</div>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => {
        const config = getStatusConfig(status, record.dueDate);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => {
        const isPending = record.status === "pending";

        return (
          <Space>
            {isPending && (
              <Tooltip title="Mark as Met">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleMarkAsMet(record)}
                />
              </Tooltip>
            )}
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => showModal(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Remove this condition?"
              description="Are you sure you want to remove this condition?"
              onConfirm={() => handleDelete(record._id || record.id)}
              okText="Yes"
              cancelText="No">
              <Tooltip title="Delete">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {/* Statistics Row */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Conditions"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Met"
              value={stats.met}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <Progress
              percent={stats.completionRate}
              size="small"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Summary Card */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Conditions Summary</h3>
            <div className="text-gray-600">
              {stats.met} of {stats.total} conditions met (
              {stats.completionRate.toFixed(1)}%)
            </div>
          </div>

          {stats.overdue > 0 && (
            <div className="mt-4 md:mt-0">
              <Alert
                message={`${stats.overdue} overdue condition(s)`}
                type="error"
                showIcon
                className="max-w-md"
              />
            </div>
          )}
        </div>

        <Progress
          percent={stats.completionRate}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
          className="mt-4"
        />
      </Card>

      {/* Main Card */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <FileTextOutlined className="mr-2" />
              Conditions ({conditions.length})
              {stats.overdue > 0 && (
                <Badge count={stats.overdue} className="ml-2" />
              )}
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}>
              Add Condition
            </Button>
          </div>
        }>
        {conditions.length === 0 ? (
          <Empty
            description={
              <div className="text-center">
                <div className="mb-2">No conditions added yet</div>
                <div className="text-gray-500 text-sm mb-4">
                  Add conditions to track obligations and requirements for the
                  transaction
                </div>
                <Button type="primary" onClick={() => showModal()}>
                  Add First Condition
                </Button>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={sortedConditions}
            rowKey={(record) => record._id || record.id}
            pagination={conditions.length > 10 ? { pageSize: 10 } : false}
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingCondition ? "Edit Condition" : "Add New Condition"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        centered>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="condition"
            label="Condition"
            rules={[{ required: true, message: "Please enter the condition" }]}>
            <TextArea
              rows={3}
              placeholder="Enter the condition or requirement..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker
                  style={{ width: "100%" }}
                  format={DATE_FORMAT}
                  placeholder="Select due date"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}>
                <Select placeholder="Select status">
                  {CONDITION_STATUS.map((status) => (
                    <Option key={status.value} value={status.value}>
                      <Tag color={status.color}>{status.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCondition ? "Update Condition" : "Add Condition"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ConditionsManager;
