import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  List,
  Tag,
  Space,
  Popconfirm,
  message,
  Empty,
  Alert,
  Typography,
} from "antd";
import {
  BellOutlined,
  PlusOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchReminders,
  createReminder,
  deleteReminder,
  selectReminders,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";
import { formatDate } from "../../utils/formatDate";

const { Text, TextArea } = Typography;

const ReminderManager = ({ taskId, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const reminders = useSelector(selectReminders);
  const actionLoading = useSelector(selectTaskActionLoading);

  const fetchReminderData = useCallback(() => {
    if (taskId) {
      dispatch(fetchReminders(taskId));
    }
  }, [dispatch, taskId]);

  React.useEffect(() => {
    fetchReminderData();
  }, [fetchReminderData]);

  const handleCreateReminder = useCallback(
    async (values) => {
      try {
        setLoading(true);
        await dispatch(
          createReminder({
            taskId,
            data: {
              message: values.message,
              scheduledFor: values.scheduledFor.toISOString(),
            },
          })
        ).unwrap();

        message.success("Reminder created successfully");
        form.resetFields();
        setOpen(false);
        fetchReminderData();
        onSuccess?.();
      } catch (error) {
        message.error(error?.message || "Failed to create reminder");
      } finally {
        setLoading(false);
      }
    },
    [dispatch, taskId, form, fetchReminderData, onSuccess]
  );

  const handleDeleteReminder = useCallback(
    async (reminderId) => {
      try {
        await dispatch(
          deleteReminder({ taskId, reminderId })
        ).unwrap();

        message.success("Reminder deleted successfully");
        fetchReminderData();
      } catch (error) {
        message.error(error?.message || "Failed to delete reminder");
      }
    },
    [dispatch, taskId, fetchReminderData]
  );

  const pendingReminders = reminders.filter((r) => !r.isSent);
  const sentReminders = reminders.filter((r) => r.isSent);

  return (
    <div>
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

      {reminders.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No reminders set"
        />
      ) : (
        <div className="space-y-3">
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
                        onConfirm={() => handleDeleteReminder(reminder._id)}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        />
                      </Popconfirm>,
                    ]}>
                    <List.Item.Meta
                      avatar={<ClockCircleOutlined className="text-yellow-600" />}
                      title={
                        <Space>
                          <Text>{reminder.message}</Text>
                        </Space>
                      }
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
                      avatar={<CheckCircleOutlined className="text-green-600" />}
                      title={<Text>{reminder.message}</Text>}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" className="text-xs">
                            Sent: {formatDate(reminder.sentAt)}
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
                current && current < dayjs().startOf("minute")
              }
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
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Reminder
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ReminderManager;
