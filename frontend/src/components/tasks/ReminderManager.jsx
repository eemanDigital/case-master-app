import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Modal,
  Form,
  DatePicker,
  List,
  Tag,
  Space,
  Popconfirm,
  message,
  Empty,
  Alert,
  Typography,
  Input,
} from "antd";
import {
  BellOutlined,
  PlusOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchReminders,
  createReminder,
  deleteReminder,
  selectReminders,
  selectTaskActionLoading,
} from "../../redux/features/task/taskSlice";
import { formatDate } from "../../utils/formatDate";

const { Text } = Typography;
const TextArea = Input.TextArea;

const ReminderManager = ({ taskId, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Redux state — no local copy needed; Redux slice handles optimistic updates
  const reminders = useSelector(selectReminders);
  const actionLoading = useSelector(selectTaskActionLoading);

  // Only fetch on mount — Redux state kept in sync by thunk reducers
  React.useEffect(() => {
    if (taskId) {
      dispatch(fetchReminders(taskId));
    }
  }, [dispatch, taskId]);

  const handleCreateReminder = useCallback(
    async (values) => {
      setLocalLoading(true);
      try {
        await dispatch(
          createReminder({
            taskId,
            data: {
              message: values.message,
              scheduledFor: values.scheduledFor.toISOString(),
            },
          }),
        ).unwrap();

        message.success("Reminder created successfully");
        form.resetFields();
        setOpen(false);
        onSuccess?.();
        // No manual re-fetch: taskSlice.createReminder.fulfilled pushes to state.reminders
      } catch (error) {
        message.error(error?.message || "Failed to create reminder");
      } finally {
        setLocalLoading(false);
      }
    },
    [dispatch, taskId, form, onSuccess],
  );

  const handleDeleteReminder = useCallback(
    async (reminderId) => {
      try {
        await dispatch(deleteReminder({ taskId, reminderId })).unwrap();
        message.success("Reminder deleted successfully");
        // No manual re-fetch: taskSlice.deleteReminder.fulfilled filters state.reminders
      } catch (error) {
        message.error(error?.message || "Failed to delete reminder");
      }
    },
    [dispatch, taskId],
  );

  const pendingReminders = reminders.filter(
    (r) => !r.isSent && dayjs(r.scheduledFor).isAfter(dayjs()),
  );
  const sentReminders = reminders.filter(
    (r) => r.isSent || dayjs(r.scheduledFor).isBefore(dayjs()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Space>
          <BellOutlined />
          <Text strong>Reminders</Text>
          {pendingReminders.length > 0 && (
            <Tag color="blue">{pendingReminders.length} pending</Tag>
          )}
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setOpen(true)}>
          Add Reminder
        </Button>
      </div>

      {/* Reminder List */}
      {reminders.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No reminders set"
        />
      ) : (
        <div className="space-y-3">
          {/* Pending */}
          {pendingReminders.length > 0 && (
            <div>
              <Text type="secondary" className="text-xs uppercase">
                Pending
              </Text>
              <List
                size="small"
                dataSource={pendingReminders}
                renderItem={(reminder) => (
                  <List.Item
                    className="bg-yellow-50 rounded px-3 py-2"
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="Delete this reminder?"
                        onConfirm={() => handleDeleteReminder(reminder._id)}
                        okText="Yes"
                        cancelText="No">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        />
                      </Popconfirm>,
                    ]}>
                    <List.Item.Meta
                      avatar={
                        <ClockCircleOutlined className="text-yellow-600" />
                      }
                      title={<Text>{reminder.message}</Text>}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" className="text-xs">
                            Scheduled: {formatDate(reminder.scheduledFor)}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            By: {reminder.sender?.firstName}{" "}
                            {reminder.sender?.lastName}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* Sent / Past */}
          {sentReminders.length > 0 && (
            <div>
              <Text type="secondary" className="text-xs uppercase">
                Sent
              </Text>
              <List
                size="small"
                dataSource={sentReminders}
                renderItem={(reminder) => (
                  <List.Item className="bg-green-50 rounded px-3 py-2">
                    <List.Item.Meta
                      avatar={
                        <CheckCircleOutlined className="text-green-600" />
                      }
                      title={
                        <Text delete className="text-gray-400">
                          {reminder.message}
                        </Text>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" className="text-xs">
                            {reminder.isSent
                              ? `Sent: ${formatDate(reminder.sentAt)}`
                              : `Scheduled: ${formatDate(reminder.scheduledFor)}`}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            By: {reminder.sender?.firstName}{" "}
                            {reminder.sender?.lastName}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* Create Reminder Modal */}
      <Modal
        title="Add Reminder"
        open={open}
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        footer={null}
        destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateReminder}
          initialValues={{
            scheduledFor: dayjs().add(1, "hour").startOf("hour"),
          }}>
          <Form.Item
            name="message"
            label="Reminder Message"
            rules={[
              { required: true, message: "Please enter a reminder message" },
              { max: 150, message: "Message cannot exceed 150 characters" },
            ]}>
            <TextArea
              rows={2}
              placeholder="Enter reminder message..."
              maxLength={150}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="scheduledFor"
            label="Schedule Reminder For"
            rules={[
              { required: true, message: "Please select a date and time" },
            ]}>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              className="w-full"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
              placeholder="Select date and time"
            />
          </Form.Item>

          <Alert
            type="info"
            message="Reminder Timing"
            description="The reminder will be sent automatically at the scheduled time to all task assignees."
            className="mb-4"
          />

          <div className="flex justify-end gap-3">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={localLoading || actionLoading}>
              Create Reminder
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ReminderManager;
