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
  Divider,
  message,
} from "antd";
import {
  EditOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TagOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  updateTaskEnhanced,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";

import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useMattersSelectOptions from "../hooks/useMattersSelectOptions";

const { TextArea } = Input;

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

const MATTER_TYPE_OPTIONS = [
  { value: "litigation", label: "Litigation" },
  { value: "corporate", label: "Corporate" },
  { value: "property", label: "Property" },
  { value: "advisory", label: "Advisory" },
  { value: "retainer", label: "Retainer" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const TaskEditModal = ({ open, onClose, task, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const loading = useSelector(selectTaskActionLoading);

  const { data: userOptions, loading: usersLoading } = useUserSelectOptions({
    type: "all",
    autoFetch: open,
  });

  const {
    matters,
    loading: matterSearchLoading,
    fetchMatters,
  } = useMattersSelectOptions({
    status: "active",
    limit: 50,
    autoFetch: false,
  });

  const [selectedMatterType, setSelectedMatterType] = useState(null);

  useEffect(() => {
    if (open && task) {
      fetchMatters("");
      
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        instruction: task.instruction,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
        startDate: task.startDate ? dayjs(task.startDate) : null,
        priority: task.taskPriority,
        category: task.category,
        matter: task.matter?._id || task.matter,
        matterType: task.matterType,
        customCaseReference: task.customCaseReference,
        estimatedEffort: task.estimatedEffort,
        tags: task.tags || [],
      });
      setSelectedMatterType(task.matterType);
    }
  }, [open, task, form, fetchMatters]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedMatterType(null);
    }
  }, [open, form]);

  const handleMatterChange = useCallback(
    async (matterId) => {
      if (!matterId) {
        setSelectedMatterType(null);
        form.setFieldsValue({
          matterType: undefined,
          litigationDetailId: undefined,
        });
        return;
      }

      const selectedMatter = matters.find((m) => m._id === matterId);
      if (!selectedMatter) return;

      setSelectedMatterType(selectedMatter.matterType);
      form.setFieldsValue({ matterType: selectedMatter.matterType });
    },
    [matters, form]
  );

  const handleMatterTypeChange = useCallback((value) => {
    setSelectedMatterType(value);
  }, []);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        const updateData = {
          title: values.title,
          description: values.description,
          instruction: values.instruction,
          dueDate: values.dueDate?.toISOString(),
          startDate: values.startDate?.toISOString() || null,
          taskPriority: values.priority,
          category: values.category,
          matter: values.matter || null,
          matterType: values.matterType,
          customCaseReference: values.customCaseReference,
          estimatedEffort: values.estimatedEffort,
          tags: values.tags || [],
        };

        await dispatch(
          updateTaskEnhanced({ taskId: task._id, data: updateData })
        ).unwrap();

        message.success("Task updated successfully");
        onClose();
        onSuccess?.();
      } catch (error) {
        message.error(error?.message || "Failed to update task");
      }
    },
    [dispatch, task, onClose, onSuccess]
  );

  return (
    <Modal
      title={
        <Space>
          <EditOutlined className="text-blue-500" />
          <span>Edit Task</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
      className="task-edit-modal">
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
                placeholder="Enter task title"
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
                placeholder="Describe the task..."
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

          <Col xs={24} sm={8}>
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
                  <Select.Option key={opt.value} value={opt.value}>
                    <Tag color={opt.color}>{opt.label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
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
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="estimatedEffort" label="Estimated Effort (hours)">
              <Input type="number" min={0} placeholder="e.g., 2" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="matter" label="Link to Matter">
              <Select
                showSearch
                placeholder="Search matter..."
                loading={matterSearchLoading}
                onSearch={fetchMatters}
                onChange={handleMatterChange}
                filterOption={false}
                allowClear
                className="w-full">
                {matters.map((matter) => (
                  <Select.Option key={matter._id} value={matter._id}>
                    <div>
                      <div>{matter.label}</div>
                      <div className="text-xs text-gray-400">
                        {matter.matterType} - {matter.subtitle}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="matterType" label="Matter Type">
              <Select
                placeholder="Select matter type"
                allowClear
                onChange={handleMatterTypeChange}>
                {MATTER_TYPE_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="customCaseReference" label="Custom Case Reference">
              <Input placeholder="Enter external case reference (optional)" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="tags" label="Tags">
              <Select
                mode="tags"
                placeholder="Add tags (press Enter)"
                className="w-full"
                tokenSeparators={[","]}
              />
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
            icon={<EditOutlined />}>
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default TaskEditModal;
