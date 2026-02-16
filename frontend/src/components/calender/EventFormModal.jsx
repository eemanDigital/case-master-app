import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  InputNumber,
  Button,
  Space,
  Divider,
  Tag,
  Alert,
  Row,
  Col,
  Tabs,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  VISIBILITY_LEVELS,
  LOCATION_TYPES,
  REMINDER_TIMES,
  REMINDER_TYPES,
  RECURRENCE_FREQUENCIES,
  DAYS_OF_WEEK,
} from "../../utils/calendarConstants";

const { TextArea } = Input;
const { Option } = Select;

const EventFormModal = ({
  visible,
  mode = "create", // 'create' or 'edit'
  initialValues = null,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [locationType, setLocationType] = useState(LOCATION_TYPES.OFFICE);
  const [eventType, setEventType] = useState(EVENT_TYPES.TASK);

  useEffect(() => {
    if (visible && initialValues) {
      // Populate form with initial values for edit mode
      const formData = {
        ...initialValues,
        startDate: initialValues.startDateTime
          ? dayjs(initialValues.startDateTime)
          : null,
        startTime: initialValues.startDateTime
          ? dayjs(initialValues.startDateTime)
          : null,
        endDate: initialValues.endDateTime
          ? dayjs(initialValues.endDateTime)
          : null,
        endTime: initialValues.endDateTime
          ? dayjs(initialValues.endDateTime)
          : null,
        locationType: initialValues.location?.type,
      };

      form.setFieldsValue(formData);
      setIsAllDay(initialValues.isAllDay || false);
      setIsRecurring(initialValues.isRecurring || false);
      setLocationType(initialValues.location?.type || LOCATION_TYPES.OFFICE);
      setEventType(initialValues.eventType || EVENT_TYPES.TASK);
    } else if (visible) {
      form.resetFields();
      setIsAllDay(false);
      setIsRecurring(false);
      setLocationType(LOCATION_TYPES.OFFICE);
      setEventType(EVENT_TYPES.TASK);
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Combine date and time
      const startDateTime = isAllDay
        ? dayjs(values.startDate).startOf("day").toISOString()
        : dayjs(values.startDate)
            .hour(values.startTime.hour())
            .minute(values.startTime.minute())
            .toISOString();

      const endDateTime = isAllDay
        ? dayjs(values.endDate).endOf("day").toISOString()
        : dayjs(values.endDate)
            .hour(values.endTime.hour())
            .minute(values.endTime.minute())
            .toISOString();

      // Build location object
      const location = {
        type: values.locationType,
        courtName: values.courtName,
        courtRoom: values.courtRoom,
        address: values.address,
        virtualMeetingLink: values.virtualMeetingLink,
        notes: values.locationNotes,
      };

      // Build event data
      const eventData = {
        ...values,
        startDateTime,
        endDateTime,
        location,
        isAllDay,
        isRecurring,
      };

      // Remove temporary form fields
      delete eventData.startDate;
      delete eventData.startTime;
      delete eventData.endDate;
      delete eventData.endTime;
      delete eventData.locationType;
      delete eventData.courtName;
      delete eventData.courtRoom;
      delete eventData.address;
      delete eventData.virtualMeetingLink;
      delete eventData.locationNotes;

      onSubmit(eventData);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const basicInfoItems = (
    <>
      <Form.Item
        name="eventType"
        label="Event Type"
        rules={[{ required: true, message: "Please select event type" }]}>
        <Select
          placeholder="Select event type"
          onChange={setEventType}
          showSearch
          optionFilterProp="children">
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <Option key={value} value={value}>
              {label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="title"
        label="Title"
        rules={[
          { required: true, message: "Please enter event title" },
          { max: 500, message: "Title must be less than 500 characters" },
        ]}>
        <Input placeholder="Enter event title" size="large" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          {
            max: 5000,
            message: "Description must be less than 5000 characters",
          },
        ]}>
        <TextArea
          rows={4}
          placeholder="Enter event description"
          showCount
          maxLength={5000}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="priority"
            label="Priority"
            initialValue={PRIORITY_LEVELS.MEDIUM}>
            <Select placeholder="Select priority">
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="visibility"
            label="Visibility"
            initialValue={VISIBILITY_LEVELS.TEAM}>
            <Select placeholder="Select visibility">
              <Option value={VISIBILITY_LEVELS.PRIVATE}>Private</Option>
              <Option value={VISIBILITY_LEVELS.TEAM}>Team</Option>
              <Option value={VISIBILITY_LEVELS.FIRM}>Firm-wide</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Options">
        <Space direction="vertical">
          <div className="flex items-center gap-2">
            <Switch checked={isAllDay} onChange={setIsAllDay} />
            <span>All Day Event</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isRecurring} onChange={setIsRecurring} />
            <span>Recurring Event</span>
          </div>
        </Space>
      </Form.Item>
    </>
  );

  const dateTimeItems = (
    <>
      <Alert
        message="Event Date & Time"
        description="Set when this event will take place"
        type="info"
        showIcon
        className="mb-4"
      />

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select start date" }]}>
            <DatePicker
              style={{ width: "100%" }}
              format="MMMM DD, YYYY"
              placeholder="Select start date"
            />
          </Form.Item>
        </Col>

        {!isAllDay && (
          <Col xs={24} md={12}>
            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[{ required: true, message: "Please select start time" }]}>
              <TimePicker
                style={{ width: "100%" }}
                format="hh:mm A"
                use12Hours
                placeholder="Select start time"
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: "Please select end date" }]}>
            <DatePicker
              style={{ width: "100%" }}
              format="MMMM DD, YYYY"
              placeholder="Select end date"
            />
          </Form.Item>
        </Col>

        {!isAllDay && (
          <Col xs={24} md={12}>
            <Form.Item
              name="endTime"
              label="End Time"
              rules={[{ required: true, message: "Please select end time" }]}>
              <TimePicker
                style={{ width: "100%" }}
                format="hh:mm A"
                use12Hours
                placeholder="Select end time"
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {isRecurring && (
        <>
          <Divider>Recurrence Pattern</Divider>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name={["recurrencePattern", "frequency"]}
                label="Frequency">
                <Select placeholder="Select frequency">
                  {RECURRENCE_FREQUENCIES.map((freq) => (
                    <Option key={freq.value} value={freq.value}>
                      {freq.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name={["recurrencePattern", "interval"]}
                label="Interval"
                initialValue={1}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={["recurrencePattern", "daysOfWeek"]}
            label="Days of Week">
            <Select mode="multiple" placeholder="Select days">
              {DAYS_OF_WEEK.map((day) => (
                <Option key={day.value} value={day.value}>
                  {day.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name={["recurrencePattern", "endDate"]} label="End Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </>
      )}
    </>
  );

  const locationItems = (
    <>
      <Form.Item name="locationType" label="Location Type">
        <Select placeholder="Select location type" onChange={setLocationType}>
          <Option value={LOCATION_TYPES.OFFICE}>Office</Option>
          <Option value={LOCATION_TYPES.COURT}>Court</Option>
          <Option value={LOCATION_TYPES.CLIENT_OFFICE}>Client Office</Option>
          <Option value={LOCATION_TYPES.ONLINE}>Online Meeting</Option>
          <Option value={LOCATION_TYPES.OTHER}>Other</Option>
        </Select>
      </Form.Item>

      {locationType === LOCATION_TYPES.COURT && (
        <>
          <Form.Item name="courtName" label="Court Name">
            <Input placeholder="Enter court name" />
          </Form.Item>
          <Form.Item name="courtRoom" label="Court Room">
            <Input placeholder="Enter court room number" />
          </Form.Item>
        </>
      )}

      {locationType === LOCATION_TYPES.ONLINE && (
        <Form.Item name="virtualMeetingLink" label="Meeting Link">
          <Input placeholder="Enter virtual meeting link (Zoom, Teams, etc.)" />
        </Form.Item>
      )}

      {locationType !== LOCATION_TYPES.ONLINE && (
        <Form.Item name="address" label="Address">
          <TextArea rows={3} placeholder="Enter full address" />
        </Form.Item>
      )}

      <Form.Item name="locationNotes" label="Location Notes">
        <TextArea rows={2} placeholder="Any additional location details" />
      </Form.Item>
    </>
  );

  const remindersItems = (
    <>
      <Form.List name="reminders">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space
                key={key}
                align="baseline"
                className="w-full"
                style={{ display: "flex", marginBottom: 8 }}>
                <Form.Item
                  {...restField}
                  name={[name, "reminderTime"]}
                  rules={[{ required: true, message: "Select time" }]}
                  className="flex-1">
                  <Select placeholder="Reminder time">
                    {REMINDER_TIMES.map((time) => (
                      <Option key={time.value} value={time.value}>
                        {time.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, "reminderType"]}
                  initialValue="in_app"
                  className="flex-1">
                  <Select placeholder="Type">
                    {REMINDER_TYPES.map((type) => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}

            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}>
                Add Reminder
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );

  const tabItems = [
    {
      key: "basic",
      label: "Basic Info",
      children: basicInfoItems,
    },
    {
      key: "datetime",
      label: "Date & Time",
      children: dateTimeItems,
    },
    {
      key: "location",
      label: "Location",
      children: locationItems,
    },
    {
      key: "reminders",
      label: "Reminders",
      children: remindersItems,
    },
  ];

  return (
    <Modal
      title={mode === "create" ? "Create New Event" : "Edit Event"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText={mode === "create" ? "Create Event" : "Update Event"}
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

export default EventFormModal;
