import React, { useState } from "react";
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
  InputNumber,
  Select,
  Tooltip,
  Popconfirm,
  message,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import {
  addLeaseMilestone,
  updateLeaseMilestone,
  deleteLeaseMilestone,
} from "../../redux/features/property/propertySlice";
import {
  MILESTONE_STATUS,
  DATE_FORMAT,
} from "../../utils/propertyConstants";
import dayjs from "dayjs";

const { Option } = Select;

const LeaseMilestonesManager = ({ matterId, milestones = [] }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [loading, setLoading] = useState(false);

  const sortedMilestones = [...milestones].sort((a, b) => {
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return new Date(a.targetDate) - new Date(b.targetDate);
  });

  const showModal = (milestone = null) => {
    setEditingMilestone(milestone);
    if (milestone) {
      form.setFieldsValue({
        ...milestone,
        targetDate: milestone.targetDate ? dayjs(milestone.targetDate) : null,
        completedDate: milestone.completedDate
          ? dayjs(milestone.completedDate)
          : null,
      });
    } else {
      form.resetFields();
      form.setFieldValue("status", "pending");
      form.setFieldValue("reminderDays", 7);
    }
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        targetDate: values.targetDate ? values.targetDate.toISOString() : null,
        completedDate:
          values.completedDate && values.status === "completed"
            ? new Date().toISOString()
            : values.completedDate
              ? values.completedDate.toISOString()
              : null,
      };

      if (editingMilestone) {
        await dispatch(
          updateLeaseMilestone({
            matterId,
            milestoneId: editingMilestone._id,
            data: formattedValues,
          }),
        ).unwrap();
      } else {
        await dispatch(addLeaseMilestone({ matterId, data: formattedValues })).unwrap();
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
      message.error(error?.message || "Failed to save milestone");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (milestoneId) => {
    try {
      await dispatch(deleteLeaseMilestone({ matterId, milestoneId })).unwrap();
      message.success("Milestone removed successfully");
    } catch (error) {
      message.error(error?.message || "Failed to remove milestone");
    }
  };

  const handleMarkComplete = async (milestone) => {
    try {
      await dispatch(
        updateLeaseMilestone({
          matterId,
          milestoneId: milestone._id,
          data: {
            ...milestone,
            status: "completed",
            completedDate: new Date().toISOString(),
          },
        }),
      ).unwrap();
      message.success("Milestone marked as completed");
    } catch (error) {
      message.error(error?.message || "Failed to update milestone");
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "completed":
        return { icon: <CheckCircleOutlined />, color: "success" };
      case "overdue":
        return { icon: <ClockCircleOutlined />, color: "error" };
      case "skipped":
        return { icon: <FlagOutlined />, color: "default" };
      default:
        return { icon: <ClockCircleOutlined />, color: "processing" };
    }
  };

  const columns = [
    {
      title: "Milestone",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.description && (
            <div className="text-sm text-gray-500">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: "Target Date",
      dataIndex: "targetDate",
      key: "targetDate",
      width: 150,
      render: (date) =>
        date ? dayjs(date).format(DATE_FORMAT) : <span className="text-gray-400">Not set</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: "Completed Date",
      dataIndex: "completedDate",
      key: "completedDate",
      width: 150,
      render: (date) =>
        date ? (
          <span className="text-green-600">{dayjs(date).format(DATE_FORMAT)}</span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "Reminder",
      dataIndex: "reminderDays",
      key: "reminderDays",
      width: 100,
      render: (days) => `${days || 7} days before`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          {record.status === "pending" && (
            <Tooltip title="Mark as Completed">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => handleMarkComplete(record)}
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
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
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
      <Card
        title={
          <Space>
            <FlagOutlined />
            <span>Lease Milestones ({milestones.length})</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Add Milestone
          </Button>
        }
      >
        {milestones.length === 0 ? (
          <Empty
            description={
              <div className="text-center">
                <div className="mb-2">No milestones added yet</div>
                <div className="text-gray-500 text-sm mb-4">
                  Add important lease milestones to track key dates and tasks
                </div>
                <Button type="primary" onClick={() => showModal()}>
                  Add First Milestone
                </Button>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={sortedMilestones}
            rowKey="_id"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        title={editingMilestone ? "Edit Milestone" : "Add Milestone"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Milestone Title"
            rules={[{ required: true, message: "Please enter milestone title" }]}
          >
            <Input placeholder="e.g., Rent Review, Notice to Renew" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={2}
              placeholder="Additional details about this milestone..."
            />
          </Form.Item>

          <Form.Item name="targetDate" label="Target Date">
            <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              {MILESTONE_STATUS.map((status) => (
                <Option key={status.value} value={status.value}>
                  <Tag color={status.color}>{status.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reminderDays"
            label="Reminder (days before)"
            extra="How many days before the target date to send a reminder"
          >
            <InputNumber min={1} max={365} style={{ width: "100%" }} />
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
    </>
  );
};

export default LeaseMilestonesManager;
