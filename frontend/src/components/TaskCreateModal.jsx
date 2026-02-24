import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Avatar,
  Divider,
  message,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  TagOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  createTask,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";

import useUserSelectOptions from "../hooks/useUserSelectOptions";

const { TextArea } = Input;
const { Option } = Select;

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent", color: "red" },
  { value: "high", label: "High", color: "orange" },
  { value: "medium", label: "Medium", color: "blue" },
  { value: "low", label: "Low", color: "default" },
];

const CATEGORY_OPTIONS = [
  { value: "legal-research", label: "Legal Research" },
  { value: "document-drafting", label: "Document Drafting" },
  { value: "client-meeting", label: "Client Meeting" },
  { value: "court-filing", label: "Court Filing" },
  { value: "discovery", label: "Discovery" },
  { value: "correspondence", label: "Correspondence" },
  { value: "administrative", label: "Administrative" },
  { value: "other", label: "Other" },
];

const TaskCreateModal = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const loading = useSelector(selectTaskActionLoading);

  const { data: userOptions, loading: usersLoading } = useUserSelectOptions({
    type: "all",
    autoFetch: open,
  });

  const [selectedAssignees, setSelectedAssignees] = useState([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedAssignees([]);
    }
  }, [open, form]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        const taskData = {
          title: values.title,
          description: values.description,
          instruction: values.instruction,
          dueDate: values.dueDate?.toISOString(),
          startDate: values.startDate?.toISOString(),
          taskPriority: values.priority,
          category: values.category,
          matter: values.matter,
          matterType: values.matterType,
          litigationDetailId: values.litigationDetailId,
          customCaseReference: values.customCaseReference,
          assignees: selectedAssignees.map((userId) => ({
            user: userId,
            role: "collaborator",
          })),
          tags: values.tags || [],
          estimatedEffort: values.estimatedEffort,
        };

        await dispatch(createTask(taskData)).unwrap();
        message.success("Task created successfully");
        onClose();
        onSuccess?.();
      } catch (error) {
        message.error(error?.message || "Failed to create task");
      }
    },
    [dispatch, selectedAssignees, onClose, onSuccess],
  );

  const handleAssigneeChange = useCallback((userIds) => {
    setSelectedAssignees(userIds);
  }, []);

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined className="text-blue-500" />
          <span>Create New Task</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={null}
      destroyOnClose
      className="task-create-modal">
      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: "medium",
          category: "other",
        }}>
        <Row gutter={[16, 0]}>
          <Col xs={24}>
            <Form.Item
              name="title"
              label="Task Title"
              rules={[
                { required: true, message: "Please enter task title" },
                { max: 200, message: "Title cannot exceed 200 characters" },
              ]}>
              <Input
                placeholder="Enter a clear, concise title"
                maxLength={200}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="description"
              label="Description"
              rules={[
                {
                  max: 2000,
                  message: "Description cannot exceed 2000 characters",
                },
              ]}>
              <TextArea
                rows={3}
                placeholder="Describe the task in detail..."
                maxLength={2000}
                showCount
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="instruction"
              label="Instructions"
              rules={[
                { required: true, message: "Please provide instructions" },
                {
                  max: 5000,
                  message: "Instructions cannot exceed 5000 characters",
                },
              ]}>
              <TextArea
                rows={4}
                placeholder="Detailed instructions for completing this task..."
                maxLength={5000}
                showCount
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="dueDate"
              label={
                <Space>
                  <ClockCircleOutlined />
                  <span>Due Date</span>
                </Space>
              }
              rules={[{ required: true, message: "Please select due date" }]}>
              <DatePicker
                showTime={{ format: "HH:mm" }}
                format="YYYY-MM-DD HH:mm"
                className="w-full"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="startDate"
              label={
                <Space>
                  <CalendarOutlined />
                  <span>Start Date</span>
                </Space>
              }>
              <DatePicker
                showTime={{ format: "HH:mm" }}
                format="YYYY-MM-DD HH:mm"
                className="w-full"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="priority"
              label={
                <Space>
                  <TagOutlined />
                  <span>Priority</span>
                </Space>
              }>
              <Select placeholder="Select priority">
                {PRIORITY_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    <Tag color={opt.color}>{opt.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="category"
              label={
                <Space>
                  <FileTextOutlined />
                  <span>Category</span>
                </Space>
              }>
              <Select placeholder="Select category">
                {CATEGORY_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="assignees"
              label={
                <Space>
                  <UserOutlined />
                  <span>Assign Team Members</span>
                </Space>
              }>
              <Select
                mode="multiple"
                placeholder="Select team members to assign"
                loading={usersLoading}
                onChange={handleAssigneeChange}
                optionLabelProp="label"
                className="w-full">
                {userOptions?.map((user) => (
                  <Option
                    key={user._id}
                    value={user._id}
                    label={`${user.firstName} ${user.lastName}`}>
                    <Space>
                      <Avatar src={user.photo} size="small">
                        {user.firstName?.[0]}
                      </Avatar>
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                      {user.position && <Tag>{user.position}</Tag>}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="estimatedEffort" label="Estimated Effort (hours)">
              <Input type="number" min={0} placeholder="e.g., 2" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <div className="flex justify-end gap-3">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<PlusOutlined />}>
            Create Task
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default TaskCreateModal;
