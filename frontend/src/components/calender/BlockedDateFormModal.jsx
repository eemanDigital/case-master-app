import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Tabs,
  Alert,
  Row,
  Col,
  Spin,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BLOCK_TYPES,
  BLOCK_SCOPES,
  BLOCK_CATEGORIES,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from "../../utils/calendarConstants";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const BlockedDateFormModal = ({
  visible,
  mode = "create",
  initialValues = null,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [blockType, setBlockType] = useState(BLOCK_TYPES.FULL_DAY);
  const [blockScope, setBlockScope] = useState(BLOCK_SCOPES.FIRM_WIDE);
  const [allowOverride, setAllowOverride] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const { data: userData, loading: usersLoading } = useUserSelectOptions({
    type: "all",
    autoFetch: visible,
  });

  const userOptions = userData?.data || userData || [];

  useEffect(() => {
    if (visible && initialValues) {
      const formData = {
        ...initialValues,
        dateRange: [
          dayjs(initialValues.startDate),
          dayjs(initialValues.endDate),
        ],
        startTime: initialValues.startTime
          ? dayjs(initialValues.startTime, "HH:mm")
          : null,
        endTime: initialValues.endTime
          ? dayjs(initialValues.endTime, "HH:mm")
          : null,
      };

      form.setFieldsValue(formData);
      setBlockType(initialValues.blockType || BLOCK_TYPES.FULL_DAY);
      setBlockScope(initialValues.blockScope || BLOCK_SCOPES.FIRM_WIDE);
      setAllowOverride(initialValues.allowOverride || false);
      setIsRecurring(initialValues.isRecurring || false);
    } else if (visible) {
      form.resetFields();
      setBlockType(BLOCK_TYPES.FULL_DAY);
      setBlockScope(BLOCK_SCOPES.FIRM_WIDE);
      setAllowOverride(false);
      setIsRecurring(false);
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      let startDate, endDate;

      if (blockType === BLOCK_TYPES.DATE_RANGE) {
        [startDate, endDate] = values.dateRange;
      } else if (blockType === BLOCK_TYPES.TIME_SLOT && values.singleDate) {
        startDate = values.singleDate;
        endDate = values.singleDate;
      } else if (values.dateRange && values.dateRange[0]) {
        startDate = values.dateRange[0];
        endDate = values.dateRange[1] || values.dateRange[0];
      } else {
        startDate = values.singleDate;
        endDate = values.singleDate;
      }

      if (!startDate) {
        form.setFields([
          {
            name: blockType === BLOCK_TYPES.DATE_RANGE ? 'dateRange' : 'singleDate',
            errors: ['Please select date(s)'],
          },
        ]);
        return;
      }

      const blockData = {
        ...values,
        startDate: dayjs(startDate).toISOString(),
        endDate: dayjs(endDate).toISOString(),
        startTime: values.startTime ? dayjs(values.startTime).format("HH:mm") : null,
        endTime: values.endTime ? dayjs(values.endTime).format("HH:mm") : null,
        blockType,
        blockScope,
        allowOverride,
        isRecurring,
      };

      delete blockData.dateRange;
      delete blockData.singleDate;

      onSubmit(blockData);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const basicInfoTab = (
    <>
      <Form.Item
        name="title"
        label="Block Title"
        rules={[
          { required: true, message: "Please enter block title" },
          { max: 200, message: "Title must be less than 200 characters" },
        ]}>
        <Input
          placeholder="e.g., Public Holiday, Court Vacation"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="reason"
        label="Reason"
        rules={[
          { required: true, message: "Please enter reason" },
          { max: 500, message: "Reason must be less than 500 characters" },
        ]}>
        <TextArea
          rows={3}
          placeholder="Explain why this date is blocked"
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item name="description" label="Additional Details">
        <TextArea
          rows={4}
          placeholder="Any additional information"
          showCount
          maxLength={2000}
        />
      </Form.Item>

      <Form.Item
        name="blockCategory"
        label="Category"
        rules={[{ required: true, message: "Please select a category" }]}>
        <Select placeholder="Select block category">
          {Object.entries(BLOCK_CATEGORIES).map(([key, value]) => (
            <Option key={value} value={value}>
              {key.replace(/_/g, " ")}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );

  const dateTimeTab = (
    <>
      <Alert
        message="Block Type"
        description="Choose how dates should be blocked"
        type="info"
        showIcon
        className="mb-4"
      />

      <Form.Item label="Block Type">
        <Select
          value={blockType}
          onChange={setBlockType}
          placeholder="Select block type">
          <Option value={BLOCK_TYPES.FULL_DAY}>Full Day</Option>
          <Option value={BLOCK_TYPES.TIME_SLOT}>Time Slot</Option>
          <Option value={BLOCK_TYPES.DATE_RANGE}>Date Range</Option>
        </Select>
      </Form.Item>

      {blockType === BLOCK_TYPES.DATE_RANGE ? (
        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: "Please select date range" }]}>
          <RangePicker style={{ width: "100%" }} format="MMMM DD, YYYY" />
        </Form.Item>
      ) : (
        <Form.Item
          name="singleDate"
          label="Date"
          rules={[{ required: true, message: "Please select date" }]}>
          <DatePicker style={{ width: "100%" }} format="MMMM DD, YYYY" />
        </Form.Item>
      )}

      {blockType === BLOCK_TYPES.TIME_SLOT && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[{ required: true, message: "Please select start time" }]}>
              <TimePicker
                style={{ width: "100%" }}
                format="HH:mm"
                minuteStep={15}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endTime"
              label="End Time"
              rules={[{ required: true, message: "Please select end time" }]}>
              <TimePicker
                style={{ width: "100%" }}
                format="HH:mm"
                minuteStep={15}
              />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Form.Item label="Recurring Block">
        <Switch checked={isRecurring} onChange={setIsRecurring} />
        <span className="ml-2 text-sm text-gray-500">
          Make this a recurring block
        </span>
      </Form.Item>

      {isRecurring && (
        <>
          <Alert
            message="Recurrence settings for repeating blocks"
            type="info"
            className="mb-4"
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["recurrencePattern", "frequency"]}
                label="Frequency">
                <Select placeholder="Select frequency">
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="yearly">Yearly</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name={["recurrencePattern", "endRecurrence"]}
                label="End Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    </>
  );

  const scopeTab = (
    <>
      <Alert
        message="Block Scope"
        description="Define who is affected by this block"
        type="info"
        showIcon
        className="mb-4"
      />

      <Form.Item label="Scope">
        <Select
          value={blockScope}
          onChange={setBlockScope}
          placeholder="Select block scope">
          <Option value={BLOCK_SCOPES.FIRM_WIDE}>
            Firm-wide (affects everyone)
          </Option>
          <Option value={BLOCK_SCOPES.SPECIFIC_USERS}>
            Specific Users Only
          </Option>
          <Option value={BLOCK_SCOPES.SPECIFIC_EVENT_TYPES}>
            Specific Event Types
          </Option>
        </Select>
      </Form.Item>

      {blockScope === BLOCK_SCOPES.SPECIFIC_USERS && (
        <Form.Item
          name="blockedUsers"
          label="Select Users"
          rules={[
            { required: true, message: "Please select at least one user" },
          ]}>
          <Select
            mode="multiple"
            placeholder="Select users to block"
            showSearch
            optionFilterProp="children"
            loading={usersLoading}
            disabled={usersLoading}
            className="w-full">
            {Array.isArray(userOptions) && userOptions.map((user) => (
              <Option 
                key={user._id || user.id || user.value} 
                value={user._id || user.id || user.value}>
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.label || user.name || "Unknown User"}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {blockScope === BLOCK_SCOPES.SPECIFIC_EVENT_TYPES && (
        <Form.Item
          name="blockedEventTypes"
          label="Select Event Types"
          rules={[
            {
              required: true,
              message: "Please select at least one event type",
            },
          ]}>
          <Select mode="multiple" placeholder="Select event types to block">
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}
    </>
  );

  const enforcementTab = (
    <>
      <Form.Item label="Enforcement Level">
        <Form.Item name="enforceStrict" valuePropName="checked" noStyle>
          <Switch />
        </Form.Item>
        <span className="ml-2 text-sm">
          <strong>Strict Block:</strong> Prevent scheduling completely
        </span>
        <div className="text-xs text-gray-500 mt-1">
          When off: Users will see a warning but can still proceed
        </div>
      </Form.Item>

      <Form.Item name="warningMessage" label="Warning Message">
        <TextArea
          rows={2}
          placeholder="Custom message to show when this block is encountered"
        />
      </Form.Item>

      <Form.Item label="Allow Override">
        <Switch checked={allowOverride} onChange={setAllowOverride} />
        <span className="ml-2 text-sm text-gray-500">
          Allow certain roles to override this block
        </span>
      </Form.Item>

      {allowOverride && (
        <Form.Item
          name="overrideRoles"
          label="Override Roles"
          rules={[
            { required: true, message: "Please select at least one role" },
          ]}>
          <Select mode="multiple" placeholder="Select roles that can override">
            <Option value="admin">Admin</Option>
            <Option value="partner">Partner</Option>
            <Option value="principal">Principal</Option>
            <Option value="super_admin">Super Admin</Option>
          </Select>
        </Form.Item>
      )}

      <Form.Item label="Status">
        <Form.Item
          name="isActive"
          valuePropName="checked"
          noStyle
          initialValue={true}>
          <Switch />
        </Form.Item>
        <span className="ml-2 text-sm text-gray-500">
          Block is active and enforced
        </span>
      </Form.Item>

      <Form.Item label="Notify Users">
        <Form.Item
          name="notifyAffectedUsers"
          valuePropName="checked"
          noStyle
          initialValue={true}>
          <Switch />
        </Form.Item>
        <span className="ml-2 text-sm text-gray-500">
          Send notification to affected users
        </span>
      </Form.Item>
    </>
  );

  const tabItems = [
    {
      key: "basic",
      label: "Basic Info",
      children: basicInfoTab,
    },
    {
      key: "datetime",
      label: "Date & Time",
      children: dateTimeTab,
    },
    {
      key: "scope",
      label: "Scope",
      children: scopeTab,
    },
    {
      key: "enforcement",
      label: "Enforcement",
      children: enforcementTab,
    },
  ];

  return (
    <Modal
      title={mode === "create" ? "Block New Date/Time" : "Edit Blocked Date"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText={mode === "create" ? "Create Block" : "Update Block"}
      cancelText="Cancel"
      destroyOnClose>
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        className="mt-4">
        <Tabs items={tabItems} />
      </Form>
    </Modal>
  );
};

export default BlockedDateFormModal;
