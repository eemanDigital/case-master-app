import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Collapse,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  BankOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { taskCategoryOptions, taskPriorityOptions } from "../../data/options";
import useMattersSelectOptions from "../../hooks/useMattersSelectOptions";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

const { TextArea } = Input;
const { Text } = Typography;

const MATTER_TYPE_OPTIONS = [
  { value: "litigation", label: "Litigation" },
  { value: "corporate", label: "Corporate" },
  { value: "property", label: "Property" },
  { value: "advisory", label: "Advisory" },
  { value: "retainer", label: "Retainer" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const TASK_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "under-review", label: "Under Review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
  { value: "overdue", label: "Overdue" },
];

const TaskFormBase = ({
  form,
  initialValues,
  isEdit = false,
  onSubmit,
  onValuesChange,
  footerContent,
  loading = false,
  submitText,
}) => {
  const {
    allUsers: userOptions,
    loading: userLoading,
    error: userError,
    refresh: refreshUsers,
  } = useUserSelectOptions({ fetchAll: true, autoFetch: true });

  const {
    matters,
    loading: matterLoading,
    error: matterError,
    fetchMatters,
    getLitigationDetails,
  } = useMattersSelectOptions({
    status: "active",
    limit: 50,
    autoFetch: false,
  });

  const [litigationLoading, setLitigationLoading] = useState(false);
  const [litigationOptions, setLitigationOptions] = useState([]);
  const matterId = Form.useWatch("matter", form);
  const matterType = Form.useWatch("matterType", form);

  useEffect(() => {
    if (initialValues && form) {
      form.setFieldsValue({
        ...initialValues,
        startDate: initialValues.startDate
          ? dayjs(initialValues.startDate)
          : null,
        dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : null,
      });
    }
  }, [initialValues, form]);

  useEffect(() => {
    let active = true;

    if (!matterId || matterType !== "litigation") {
      setLitigationOptions([]);
      setLitigationLoading(false);
      return undefined;
    }

    setLitigationLoading(true);
    getLitigationDetails(matterId)
      .then((details) => {
        if (!active) return;
        setLitigationOptions(
          details
            ? [
                {
                  value: details._id,
                  label: `${details.suitNo || "Case details"}${
                    details.courtName ? ` · ${details.courtName}` : ""
                  }`,
                  subtitle: details.nextHearingDate
                    ? `Next hearing: ${dayjs(details.nextHearingDate).format("MMM D, YYYY")}`
                    : "",
                },
              ]
            : [],
        );
      })
      .finally(() => {
        if (active) setLitigationLoading(false);
      });

    return () => {
      active = false;
    };
  }, [matterId, matterType, getLitigationDetails]);

  const handleMatterSearch = useCallback(
    (searchText) => {
      if (searchText.length >= 2) fetchMatters(searchText);
    },
    [fetchMatters],
  );

  const handleMatterChange = useCallback(
    (selectedMatterId) => {
      const selectedMatter = matters.find(
        (matter) => matter._id === selectedMatterId,
      );
      form.setFieldsValue({
        matterType: selectedMatter?.matterType,
        litigationDetailId: undefined,
      });
    },
    [form, matters],
  );

  const userSelectOptions = useMemo(
    () =>
      userOptions.map((option) => ({
        ...option,
        roleLabel: option.role === "client" ? "Client" : "Staff",
      })),
    [userOptions],
  );

  const matterSelectOptions = useMemo(
    () =>
      matters.map((matter) => ({
        value: matter._id,
        label: matter.label,
        matter,
      })),
    [matters],
  );

  if (!form) {
    return (
      <Alert
        message="Configuration Error"
        description="A form instance is required. Pass the form prop from the parent component."
        type="error"
        showIcon
      />
    );
  }

  return (
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
      onValuesChange={onValuesChange}
      size="middle"
      className="task-form-base">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Text strong className="flex items-center gap-2 text-base">
            <FileTextOutlined className="text-blue-600" />
            Task details
          </Text>
          <Text type="secondary" className="text-xs">
            Add the essentials now; link a matter or add tags if needed.
          </Text>
        </div>
        <Text type="secondary" className="text-xs">
          <span className="text-red-500">*</span> Required
        </Text>
      </div>

      <Row gutter={[12, 0]}>
        <Col xs={24} md={16}>
          <Form.Item
            name="title"
            label="Task title"
            rules={[
              { required: true, message: "Enter a task title" },
              { max: 200, message: "Title cannot exceed 200 characters" },
            ]}>
            <Input
              placeholder="e.g. Prepare the first draft of the agreement"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Choose a category" }]}>
            <Select
              placeholder="Choose a category"
              options={taskCategoryOptions}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="instruction"
        label="Instructions"
        rules={[
          { required: true, message: "Add instructions for this task" },
          { max: 5000, message: "Instructions cannot exceed 5000 characters" },
        ]}>
        <TextArea
          rows={3}
          placeholder="Describe the work to be done and any important context..."
          maxLength={5000}
          showCount
        />
      </Form.Item>

      <Form.Item name="description" label="Short description (optional)">
        <TextArea
          rows={2}
          placeholder="A brief summary to help the team scan the task"
          maxLength={2000}
          showCount
        />
      </Form.Item>

      <Divider className="my-3" />

      <Text strong className="mb-3 block">
        Schedule and assignment
      </Text>
      <Row gutter={[12, 0]}>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item
            name="taskPriority"
            label="Priority"
            rules={[{ required: true, message: "Choose a priority" }]}>
            <Select
              options={taskPriorityOptions.map(({ value, label, color }) => ({
                value,
                label: color ? <Tag color={color}>{label}</Tag> : label,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="estimatedEffort" label="Effort (hours)">
            <InputNumber
              min={0}
              max={500}
              placeholder="Optional"
              className="w-full"
              addonAfter="hrs"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="startDate" label="Start date">
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="MMM D, YYYY HH:mm"
              className="w-full"
              placeholder="Optional"
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item
            name="dueDate"
            label="Due date"
            dependencies={["startDate"]}
            rules={[
              { required: true, message: "Choose a due date" },
              {
                validator: (_, value) => {
                  if (!value || isEdit || value.isAfter(dayjs())) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Due date must be in the future"),
                  );
                },
              },
              {
                validator: (_, value) => {
                  const startDate = form.getFieldValue("startDate");
                  if (!value || !startDate || !value.isBefore(startDate)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Due date must be on or after the start date"),
                  );
                },
              },
            ]}>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="MMM D, YYYY HH:mm"
              className="w-full"
              placeholder="Select due date"
              suffixIcon={<ClockCircleOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      {userError && (
        <Alert
          message="Could not load team members"
          description={
            <span>
              {userError}{" "}
              <Button type="link" size="small" onClick={refreshUsers}>
                Retry
              </Button>
            </span>
          }
          type="error"
          showIcon
          className="mb-3"
        />
      )}
      <Form.Item
        name="assignee"
        label={
          <Space size={6}>
            <UserOutlined />
            <span>Assign team members</span>
          </Space>
        }
        rules={[
          {
            required: !isEdit,
            message: "Select at least one team member",
          },
        ]}>
        <Select
          mode="multiple"
          placeholder={
            userLoading ? "Loading team members..." : "Search and select people"
          }
          options={userSelectOptions}
          loading={userLoading}
          disabled={userLoading && !userSelectOptions.length}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          optionRender={({ data }) => (
            <Space>
              <Tag color={data.role === "client" ? "green" : "blue"}>
                {data.roleLabel}
              </Tag>
              <span>{data.label}</span>
            </Space>
          )}
          notFoundContent={
            userLoading
              ? "Loading team members..."
              : userError
                ? "Could not load team members"
                : "No team members found"
          }
        />
      </Form.Item>

      <Collapse
        ghost
        className="mt-1"
        items={[
          {
            key: "matter",
            label: (
              <Space>
                <BankOutlined />
                <span>Link a matter or case</span>
                <Text type="secondary" className="text-xs">
                  Optional
                </Text>
              </Space>
            ),
            children: (
              <>
                {matterError && (
                  <Alert
                    message="Could not load matters"
                    description={matterError}
                    type="error"
                    showIcon
                    className="mb-3"
                  />
                )}
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="matter" label="Matter">
                      <Select
                        showSearch
                        allowClear
                        filterOption={false}
                        onSearch={handleMatterSearch}
                        onChange={handleMatterChange}
                        loading={matterLoading}
                        placeholder="Search by matter name or reference"
                        options={matterSelectOptions}
                        optionRender={({ data }) => (
                          <div>
                            <div className="font-medium">{data.label}</div>
                            <Text type="secondary" className="text-xs">
                              {data.matter.matterNumber || "No reference"}
                              {data.matter.matterType
                                ? ` · ${data.matter.matterType}`
                                : ""}
                            </Text>
                          </div>
                        )}
                        notFoundContent={
                          matterLoading
                            ? "Searching matters..."
                            : "No matters found"
                        }
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="matterType" label="Matter type">
                      <Select
                        allowClear
                        placeholder="Select a type"
                        options={MATTER_TYPE_OPTIONS}
                      />
                    </Form.Item>
                  </Col>
                  {matterType === "litigation" && (
                    <Col span={24}>
                      <Form.Item
                        name="litigationDetailId"
                        label="Litigation details">
                        <Select
                          allowClear
                          loading={litigationLoading}
                          placeholder="Select case details"
                          options={litigationOptions}
                          optionRender={({ data }) => (
                            <div>
                              <div>{data.label}</div>
                              {data.subtitle && (
                                <Text type="secondary" className="text-xs">
                                  {data.subtitle}
                                </Text>
                              )}
                            </div>
                          )}
                          notFoundContent={
                            litigationLoading
                              ? "Loading case details..."
                              : "No case details found"
                          }
                        />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={24}>
                    <Form.Item
                      name="customCaseReference"
                      label="External case reference">
                      <Input
                        maxLength={100}
                        placeholder="Optional reference from another system"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "advanced",
            label: (
              <Space>
                <SettingOutlined />
                <span>Additional options</span>
                <Text type="secondary" className="text-xs">
                  Tags and status
                </Text>
              </Space>
            ),
            children: (
              <>
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="tags"
                      label={
                        <Space size={6}>
                          <TagOutlined />
                          <span>Tags</span>
                        </Space>
                      }>
                      <Select
                        mode="tags"
                        tokenSeparators={[","]}
                        placeholder="Add tags and press Enter"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="status" label="Status">
                      <Select options={TASK_STATUS_OPTIONS} />
                    </Form.Item>
                  </Col>
                </Row>
                <Text type="secondary" className="text-xs">
                  <BankOutlined className="mr-1" />
                  Task dependencies can be added after the task is created.
                </Text>
              </>
            ),
          },
        ]}
      />

      <Divider className="my-3" />
      {footerContent}
      <div className="flex justify-end">
        <Button type="primary" htmlType="submit" loading={loading} size="large">
          {submitText || (isEdit ? "Save changes" : "Create task")}
        </Button>
      </div>
    </Form>
  );
};

TaskFormBase.propTypes = {
  form: PropTypes.shape({
    setFieldsValue: PropTypes.func.isRequired,
    getFieldValue: PropTypes.func.isRequired,
  }).isRequired,
  initialValues: PropTypes.shape({
    startDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
      PropTypes.object,
    ]),
    dueDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
      PropTypes.object,
    ]),
  }),
  isEdit: PropTypes.bool,
  onSubmit: PropTypes.func,
  onValuesChange: PropTypes.func,
  footerContent: PropTypes.node,
  loading: PropTypes.bool,
  submitText: PropTypes.string,
};

export default TaskFormBase;
