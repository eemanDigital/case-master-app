import React, { useEffect, useCallback, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Typography,
  Space,
  Tag,
  InputNumber,
  Card,
  Row,
  Col,
  Steps,
  Button,
  Divider,
  Tabs,
  Alert,
} from "antd";
import {
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  SettingOutlined,
  BankOutlined,
  TagOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { taskPriorityOptions, taskCategoryOptions } from "../../data/options";
import useMattersSelectOptions from "../../hooks/useMattersSelectOptions";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

const { TextArea } = Input;
const { Text } = Typography;

const MATTER_TYPE_OPTIONS = [
  { value: "litigation", label: "Litigation", icon: "⚖️" },
  { value: "corporate", label: "Corporate", icon: "🏢" },
  { value: "property", label: "Property", icon: "🏠" },
  { value: "advisory", label: "Advisory", icon: "💼" },
  { value: "retainer", label: "Retainer", icon: "📋" },
  { value: "general", label: "General", icon: "📁" },
  { value: "other", label: "Other", icon: "📦" },
];

const TaskFormBase = ({
  form, // Make sure this is passed from parent
  initialValues,
  isEdit = false,
  onSubmit,
  loading = false,
  submitText,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  // FIX: Remove duplicate users selector - use the hook instead

  const { data: userOptions, loading: userLoading } = useUserSelectOptions({
    type: "all",
    autoFetch: true,
  });

  const {
    matters,
    loading: matterSearchLoading,
    fetchMatters,
    getLitigationDetails,
  } = useMattersSelectOptions({
    status: "active",
    limit: 50,
    autoFetch: false,
  });

  const [selectedMatterType, setSelectedMatterType] = useState(null);
  const [litigationLoading, setLitigationLoading] = useState(false);
  const [litigationOptions, setLitigationOptions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState("0");

  // Initialize form with values
  useEffect(() => {
    if (initialValues && form) {
      form.setFieldsValue({
        ...initialValues,
        // Convert dates to dayjs objects if they exist
        startDate: initialValues.startDate
          ? dayjs(initialValues.startDate)
          : null,
        dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : null,
      });
    }
  }, [initialValues, form]);

  useEffect(() => {
    if (initialValues?.matterType) {
      setSelectedMatterType(initialValues.matterType);
    }
  }, [initialValues]);

  const handleMatterSearch = useCallback(
    (searchText) => {
      if (searchText && searchText.length > 2) {
        fetchMatters(searchText);
      }
    },
    [fetchMatters],
  );

  const handleMatterChange = useCallback(
    async (matterId) => {
      if (!matterId) {
        setSelectedMatterType(null);
        form.setFieldsValue({
          matterType: undefined,
          litigationDetailId: undefined,
        });
        setLitigationOptions([]);
        return;
      }

      const selectedMatter = matters.find((m) => m._id === matterId);
      if (!selectedMatter) return;

      setSelectedMatterType(selectedMatter.matterType);
      form.setFieldsValue({ matterType: selectedMatter.matterType });

      if (selectedMatter.matterType === "litigation") {
        setLitigationLoading(true);
        try {
          const details = await getLitigationDetails(matterId);
          if (details) {
            setLitigationOptions([
              {
                _id: details._id,
                value: details._id,
                label: `${details.suitNo || "N/A"} - ${details.courtName || "Unknown Court"}`,
                subtitle: `Next Hearing: ${
                  details.nextHearingDate
                    ? dayjs(details.nextHearingDate).format("MMM D, YYYY")
                    : "Not set"
                }`,
              },
            ]);
          } else {
            setLitigationOptions([]);
          }
        } catch (error) {
          console.error("Error fetching litigation details:", error);
          setLitigationOptions([]);
        } finally {
          setLitigationLoading(false);
        }
      } else {
        form.setFieldsValue({ litigationDetailId: undefined });
        setLitigationOptions([]);
      }
    },
    [matters, form, getLitigationDetails],
  );

  const handleMatterTypeChange = useCallback(
    (value) => {
      setSelectedMatterType(value);
      if (value !== "litigation") {
        form.setFieldsValue({ litigationDetailId: undefined });
        setLitigationOptions([]);
      }
    },
    [form],
  );

  const handleStepChange = (step) => {
    setCurrentStep(step);
    setActiveTab(String(step));
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentStep(parseInt(key));
  };

  const matterTypeColors = {
    litigation: "red",
    corporate: "blue",
    property: "green",
    advisory: "purple",
    retainer: "orange",
    general: "default",
    other: "default",
  };

  const matterOptionRender = useCallback(
    (matter) => (
      <div className="py-1">
        <div className="font-medium flex items-center gap-2">
          <span>{matter.title || matter.label}</span>
          <Tag
            color={matterTypeColors[matter.matterType] || "default"}
            className="text-xs">
            {matter.matterType}
          </Tag>
        </div>
        <div className="text-xs text-gray-500">
          {matter.clientName || "No client"} • {matter.matterNumber || "No ref"}
        </div>
      </div>
    ),
    [],
  );

  const steps = [
    { title: "Basic Info", icon: <FileTextOutlined /> },
    { title: "Matter", icon: <BankOutlined /> },
    { title: "Schedule", icon: <CalendarOutlined /> },
    { title: "Advanced", icon: <SettingOutlined /> },
  ];

  const tabItems = [
    {
      key: "0",
      label: (
        <span>
          <FileTextOutlined /> Basic Info
        </span>
      ),
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={16}>
              <Form.Item
                name="title"
                label="Task Title"
                rules={[
                  { required: true, message: "Please enter task title" },
                  { max: 200, message: "Title cannot exceed 200 characters" },
                ]}>
                <Input
                  placeholder="Enter a clear, descriptive task title"
                  maxLength={200}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={8}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: "Please select category" }]}>
                <Select
                  placeholder="Select category"
                  options={taskCategoryOptions}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={3}
              placeholder="Brief description of the task (optional)"
              maxLength={2000}
              showCount
            />
          </Form.Item>

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
              rows={6}
              placeholder="Detailed instructions for completing this task..."
              maxLength={5000}
              showCount
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="taskPriority"
                label="Priority"
                rules={[{ required: true, message: "Select priority" }]}
                initialValue="medium">
                <Select size="large">
                  {taskPriorityOptions.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      <Tag color={opt.color}>{opt.label}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="estimatedEffort"
                label="Estimated Effort (hours)">
                <InputNumber
                  min={0}
                  max={500}
                  placeholder="e.g., 4"
                  className="w-full"
                  addonAfter="hrs"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "1",
      label: (
        <span>
          <BankOutlined /> Matter
        </span>
      ),
      children: (
        <div className="space-y-4 pt-4">
          <Card
            size="small"
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <Space direction="vertical" className="w-full" size="middle">
              <div>
                <Text strong className="block mb-2">
                  Search Matter
                </Text>
                <Form.Item name="matter" className="!mb-0">
                  <Select
                    showSearch
                    placeholder="Search by title, number, or client..."
                    loading={matterSearchLoading}
                    onSearch={handleMatterSearch}
                    onChange={handleMatterChange}
                    filterOption={false}
                    allowClear
                    size="large"
                    className="w-full"
                    notFoundContent={
                      matterSearchLoading ? "Searching..." : "No matters found"
                    }
                    optionLabelProp="label">
                    {matters.map((matter) => (
                      <Select.Option
                        key={matter._id}
                        value={matter._id}
                        label={matter.title || matter.matterNumber}>
                        {matterOptionRender(matter)}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div>
                <Text strong className="block mb-2">
                  Matter Type
                </Text>
                <Form.Item name="matterType" className="!mb-0">
                  <Select
                    placeholder="Select matter type"
                    allowClear
                    onChange={handleMatterTypeChange}
                    size="large"
                    className="w-full">
                    {MATTER_TYPE_OPTIONS.map((opt) => (
                      <Select.Option key={opt.value} value={opt.value}>
                        <Space>
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {selectedMatterType === "litigation" && (
                <div>
                  <Text strong className="block mb-2">
                    Litigation Details
                  </Text>
                  <Form.Item name="litigationDetailId" className="!mb-0">
                    <Select
                      placeholder="Select case details..."
                      loading={litigationLoading}
                      allowClear
                      size="large"
                      className="w-full"
                      notFoundContent="No litigation details found">
                      {litigationOptions.map((detail) => (
                        <Select.Option
                          key={detail._id}
                          value={detail._id}
                          label={detail.label}>
                          <div className="py-1">
                            <div className="font-medium flex items-center gap-2">
                              <BankOutlined className="text-purple-500" />
                              {detail.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {detail.subtitle}
                            </div>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
              )}

              <div>
                <Text strong className="block mb-2">
                  Custom Case Reference
                </Text>
                <Form.Item name="customCaseReference" className="!mb-0">
                  <Input
                    placeholder="Enter external case reference (optional)"
                    size="large"
                  />
                </Form.Item>
              </div>
            </Space>
          </Card>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <CalendarOutlined /> Schedule
        </span>
      ),
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 0]}>
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
                  size="large"
                  placeholder="Select start date (optional)"
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
                  size="large"
                  placeholder="Select due date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" className="bg-gray-50">
            <Form.Item
              name="assignee"
              label={
                <Space>
                  <UserOutlined />
                  <span>Assign Team Members</span>
                </Space>
              }
              rules={[
                {
                  required: !isEdit,
                  message: "Please select at least one assignee",
                },
              ]}>
              <Select
                mode="multiple"
                placeholder="Select team members to assign"
                options={userOptions}
                loading={userLoading}
                allowClear
                size="large"
                className="w-full"
                optionRender={(option) => (
                  <Space>
                    <Tag
                      color={option.data.role === "client" ? "green" : "blue"}
                      className="text-xs">
                      {option.data.role === "client" ? "Client" : "Staff"}
                    </Tag>
                    <span>{option.label}</span>
                  </Space>
                )}
              />
            </Form.Item>
          </Card>
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <span>
          <SettingOutlined /> Advanced
        </span>
      ),
      children: (
        <div className="space-y-4 pt-4">
          <Form.Item
            name="tags"
            label={
              <Space>
                <TagOutlined />
                <span>Tags</span>
              </Space>
            }>
            <Select
              mode="tags"
              placeholder="Add tags (press Enter)"
              className="w-full"
              tokenSeparators={[","]}
              size="large"
            />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="pending">
            <Select size="large" className="w-full">
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="in-progress">In Progress</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Form.Item>
        </div>
      ),
    },
  ];

  // If form is not provided, show error
  if (!form) {
    return (
      <Alert
        message="Error"
        description="Form instance is required. Please pass form prop from parent."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="task-form-base">
      <Steps
        current={currentStep}
        size="small"
        items={steps}
        className="mb-6"
        onChange={handleStepChange}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          taskPriority: "medium",
          category: "other",
          status: "pending",
          ...initialValues,
        }}
        onFinish={onSubmit}
        size="large">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="mb-4"
        />

        <Divider />

        <div className="flex justify-end gap-3">
          <Button
            key="submit"
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large">
            {submitText || (isEdit ? "Save Changes" : "Create Task")}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default TaskFormBase;
