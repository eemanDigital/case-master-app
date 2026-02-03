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
  Progress,
  message,
  Tooltip,
  Popconfirm,
  Timeline,
  Badge,
  Row,
  Col,
  Statistic,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  addMilestone,
  updateMilestone,
  removeMilestone,
  completeMilestone,
} from "../../redux/features/corporate/corporateSlice";
import {
  MILESTONE_STATUS,
  DATE_FORMAT,
  getMilestoneStatusColor,
  isOverdue,
  getDaysUntil,
} from "../../utils/corporateConstants";

const { TextArea } = Input;
const { Option } = Select;

const MilestonesManager = ({ matterId, milestones = [] }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [completingMilestone, setCompletingMilestone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'timeline'

  // Calculate statistics
  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === "completed").length;
    const inProgress = milestones.filter(
      (m) => m.status === "in-progress",
    ).length;
    const pending = milestones.filter((m) => m.status === "pending").length;
    const overdue = milestones.filter((m) => m.status === "overdue").length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, inProgress, pending, overdue, completionRate };
  }, [milestones]);

  // Sort milestones by due date
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [milestones]);

  // Open modal for adding/editing
  const showModal = (milestone = null) => {
    setEditingMilestone(milestone);
    if (milestone) {
      form.setFieldsValue({
        ...milestone,
        dueDate: milestone.dueDate ? dayjs(milestone.dueDate) : null,
      });
    } else {
      form.resetFields();
      form.setFieldValue("status", "pending");
    }
    setModalVisible(true);
  };

  // Open completion modal
  const showCompletionModal = (milestone) => {
    setCompletingMilestone(milestone);
    setCompletionModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      };

      if (editingMilestone) {
        await dispatch(
          updateMilestone({
            matterId,
            milestoneId: editingMilestone._id || editingMilestone.id,
            data: formattedValues,
          }),
        );
      } else {
        await dispatch(addMilestone({ matterId, data: formattedValues }));
      }
      setModalVisible(false);
      form.resetFields();
      setEditingMilestone(null);
      message.success(
        editingMilestone
          ? "Milestone updated successfully"
          : "Milestone added successfully",
      );
    } catch (error) {
      message.error("Failed to save milestone");
    } finally {
      setLoading(false);
    }
  };

  // Handle milestone completion
  const handleComplete = async (values) => {
    setLoading(true);
    try {
      await dispatch(
        completeMilestone({
          matterId,
          milestoneId: completingMilestone._id || completingMilestone.id,
          data: {
            completedDate: values.completedDate.toISOString(),
            notes: values.notes,
            status: "completed",
          },
        }),
      );
      setCompletionModalVisible(false);
      setCompletingMilestone(null);
      message.success("Milestone marked as completed");
    } catch (error) {
      message.error("Failed to complete milestone");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (milestoneId) => {
    try {
      await dispatch(removeMilestone({ matterId, milestoneId }));
      message.success("Milestone removed successfully");
    } catch (error) {
      message.error("Failed to remove milestone");
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "in-progress":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      case "overdue":
        return <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <ClockCircleOutlined style={{ color: "#d9d9d9" }} />;
    }
  };

  // Columns for table view
  const columns = [
    {
      title: "Milestone",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div className="flex items-center">
          {getStatusIcon(record.status)}
          <div className="ml-3">
            <div className="font-medium">{text}</div>
            {record.notes && (
              <div className="text-xs text-gray-500 truncate max-w-xs">
                {record.notes}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date, record) => {
        if (!date) return "-";

        const isOverdueItem = isOverdue(date) && record.status !== "completed";
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
      render: (status) => {
        const statusConfig = MILESTONE_STATUS.find((s) => s.value === status);
        return (
          <Tag color={statusConfig?.color || "default"}>
            {statusConfig?.label || status}
          </Tag>
        );
      },
    },
    {
      title: "Completion Date",
      dataIndex: "completedDate",
      key: "completedDate",
      render: (date) =>
        date ? (
          <div className="flex items-center">
            <CheckCircleOutlined className="mr-2 text-green-500" />
            <span>{dayjs(date).format(DATE_FORMAT)}</span>
          </div>
        ) : (
          <span className="text-gray-400">Not completed</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          {record.status !== "completed" && (
            <Tooltip title="Mark Complete">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => showCompletionModal(record)}
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
            title="Remove this milestone?"
            description="Are you sure you want to remove this milestone?"
            onConfirm={() => handleDelete(record._id || record.id)}
            okText="Yes"
            cancelText="No">
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Statistics Row */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Milestones"
              value={stats.total}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={stats.completionRate}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <Progress
              percent={stats.completionRate}
              size="small"
              showInfo={false}
            />
          </Card>
        </Col>
      </Row>

      {/* View Toggle & Add Button */}
      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <Space>
            <Button
              type={viewMode === "table" ? "primary" : "default"}
              onClick={() => setViewMode("table")}>
              Table View
            </Button>
            <Button
              type={viewMode === "timeline" ? "primary" : "default"}
              onClick={() => setViewMode("timeline")}>
              Timeline View
            </Button>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}>
            Add Milestone
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      {milestones.length === 0 ? (
        <Card>
          <Empty
            description={
              <div className="text-center">
                <div className="mb-2">No milestones added yet</div>
                <div className="text-gray-500 text-sm mb-4">
                  Add milestones to track key dates and progress in the
                  transaction
                </div>
                <Button type="primary" onClick={() => showModal()}>
                  Add First Milestone
                </Button>
              </div>
            }
          />
        </Card>
      ) : viewMode === "table" ? (
        /* Table View */
        <Card title={`Milestones (${milestones.length})`}>
          <Table
            columns={columns}
            dataSource={sortedMilestones}
            rowKey={(record) => record._id || record.id}
            pagination={milestones.length > 10 ? { pageSize: 10 } : false}
          />
        </Card>
      ) : (
        /* Timeline View */
        <Card title="Milestones Timeline">
          <Timeline mode="left">
            {sortedMilestones.map((milestone, index) => {
              const isOverdueItem =
                isOverdue(milestone.dueDate) &&
                milestone.status !== "completed";
              const statusColor = getMilestoneStatusColor(milestone.status);

              return (
                <Timeline.Item
                  key={index}
                  color={statusColor}
                  dot={getStatusIcon(milestone.status)}
                  label={
                    milestone.dueDate && (
                      <div>
                        <div>
                          {dayjs(milestone.dueDate).format("DD MMM YYYY")}
                        </div>
                        {isOverdueItem && (
                          <Badge status="error" text="Overdue" />
                        )}
                      </div>
                    )
                  }>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{milestone.title}</div>
                      {milestone.notes && (
                        <div className="text-gray-600 text-sm mt-1">
                          {milestone.notes}
                        </div>
                      )}
                      <div className="mt-2">
                        <Tag color={statusColor}>
                          {MILESTONE_STATUS.find(
                            (s) => s.value === milestone.status,
                          )?.label || milestone.status}
                        </Tag>
                        {milestone.completedDate && (
                          <span className="ml-2 text-sm text-gray-500">
                            Completed:{" "}
                            {dayjs(milestone.completedDate).format(
                              "DD MMM YYYY",
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <Space>
                      {milestone.status !== "completed" && (
                        <Button
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => showCompletionModal(milestone)}>
                          Complete
                        </Button>
                      )}
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => showModal(milestone)}
                      />
                    </Space>
                  </div>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={editingMilestone ? "Edit Milestone" : "Add New Milestone"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        centered>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Milestone Title"
            rules={[
              { required: true, message: "Please enter milestone title" },
            ]}>
            <Input placeholder="Enter milestone title" />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true, message: "Please select due date" }]}>
            <DatePicker
              style={{ width: "100%" }}
              format={DATE_FORMAT}
              placeholder="Select due date"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}>
            <Select placeholder="Select status">
              {MILESTONE_STATUS.map((status) => (
                <Option key={status.value} value={status.value}>
                  <Tag color={status.color}>{status.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea
              rows={3}
              placeholder="Add any notes or details about this milestone..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingMilestone ? "Update Milestone" : "Add Milestone"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Completion Modal */}
      <Modal
        title="Mark Milestone as Complete"
        open={completionModalVisible}
        onCancel={() => setCompletionModalVisible(false)}
        footer={null}
        width={500}
        centered>
        {completingMilestone && (
          <Form
            layout="vertical"
            onFinish={handleComplete}
            initialValues={{
              completedDate: dayjs(),
            }}>
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <div className="font-medium">{completingMilestone.title}</div>
              <div className="text-sm text-gray-600">
                Due:{" "}
                {completingMilestone.dueDate
                  ? dayjs(completingMilestone.dueDate).format(DATE_FORMAT)
                  : "No due date"}
              </div>
            </div>

            <Form.Item
              name="completedDate"
              label="Completion Date"
              rules={[
                { required: true, message: "Please select completion date" },
              ]}>
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                placeholder="Select completion date"
              />
            </Form.Item>

            <Form.Item name="notes" label="Completion Notes">
              <TextArea
                rows={3}
                placeholder="Add notes about the completion..."
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <div className="flex justify-end gap-2">
                <Button onClick={() => setCompletionModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Mark as Complete
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};

// Add dayjs import at the top if not already imported
import dayjs from "dayjs";

export default MilestonesManager;
