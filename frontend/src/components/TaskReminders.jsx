import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Card,
  Row,
  Col,
  List,
  Tag,
  Avatar,
  Typography,
  Divider,
  message,
  Popconfirm,
  Empty,
  Tooltip,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  BellOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  fetchReminders,
  createReminder,
  deleteReminder,
  selectReminders,
  selectTaskActionLoading,
} from "../../redux/features/task/taskSlice";

dayjs.extend(relativeTime);

const { Text } = Typography;
const TextArea = Input.TextArea;

const TaskReminders = ({ taskId, taskTitle, open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Driven entirely by Redux — no local state copies of reminders
  const reminders = useSelector(selectReminders);
  const actionLoading = useSelector(selectTaskActionLoading);

  // Fetch reminders when modal opens
  useEffect(() => {
    if (open && taskId) {
      dispatch(fetchReminders(taskId));
    }
  }, [open, taskId, dispatch]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleAddReminder = useCallback(
    async (values) => {
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

        message.success("Reminder added successfully");
        form.resetFields();
        onSuccess?.();
        // taskSlice.createReminder.fulfilled already pushes to Redux state
      } catch (error) {
        message.error(error?.message || "Failed to add reminder");
      }
    },
    [dispatch, taskId, form, onSuccess],
  );

  const handleDeleteReminder = useCallback(
    async (reminderId) => {
      try {
        await dispatch(deleteReminder({ taskId, reminderId })).unwrap();
        message.success("Reminder deleted");
        // taskSlice.deleteReminder.fulfilled already filters Redux state
      } catch (error) {
        message.error("Failed to delete reminder");
      }
    },
    [dispatch, taskId],
  );

  const upcomingReminders = reminders
    .filter((r) => !r.isSent && dayjs(r.scheduledFor).isAfter(dayjs()))
    .slice()
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

  const pastReminders = reminders
    .filter((r) => r.isSent || dayjs(r.scheduledFor).isBefore(dayjs()))
    .slice()
    .sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));

  return (
    <Modal
      title={
        <Space>
          <BellOutlined className="text-blue-500" />
          <span>Task Reminders{taskTitle ? ` — ${taskTitle}` : ""}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={700}
      footer={null}
      destroyOnClose
      className="task-reminders-modal">
      <Divider />

      {/* Add Reminder Form */}
      <Card
        size="small"
        className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <Form form={form} layout="vertical" onFinish={handleAddReminder}>
          <Row gutter={[12, 12]}>
            <Col xs={24}>
              <Form.Item
                name="message"
                label="Reminder Message"
                rules={[
                  { required: true, message: "Please enter reminder message" },
                  {
                    max: 150,
                    message: "Message cannot exceed 150 characters",
                  },
                ]}>
                <TextArea
                  rows={2}
                  placeholder="What should this reminder be about?"
                  maxLength={150}
                  showCount
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="scheduledFor"
                label="Remind At"
                rules={[
                  { required: true, message: "Please select date and time" },
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
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label=" " className="!mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={actionLoading}
                  icon={<PlusOutlined />}
                  className="w-full">
                  Add Reminder
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Reminders List */}
      <div className="max-h-[400px] overflow-y-auto">
        {reminders.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center">
                <p className="text-gray-500">No reminders set for this task</p>
                <p className="text-gray-400 text-xs">
                  Add a reminder to get notified
                </p>
              </div>
            }
          />
        ) : (
          <>
            {/* Upcoming Reminders */}
            {upcomingReminders.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockCircleOutlined className="text-blue-500" />
                  <Text strong className="text-sm text-gray-600">
                    Upcoming Reminders
                  </Text>
                  <Tag color="blue">{upcomingReminders.length}</Tag>
                </div>
                <List
                  size="small"
                  dataSource={upcomingReminders}
                  renderItem={(reminder) => (
                    <List.Item
                      className="bg-white border border-l-4 border-l-blue-400 rounded-lg mb-2 px-3 py-2 shadow-sm"
                      actions={[
                        <Popconfirm
                          key="delete"
                          title="Delete this reminder?"
                          onConfirm={() => handleDeleteReminder(reminder._id)}
                          okText="Yes"
                          cancelText="No">
                          <Tooltip title="Delete">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Tooltip>
                        </Popconfirm>,
                      ]}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size="small"
                            icon={<BellOutlined />}
                            style={{
                              backgroundColor: "#e0f2fe",
                              color: "#0284c7",
                            }}
                          />
                        }
                        title={
                          <Text className="text-sm">{reminder.message}</Text>
                        }
                        description={
                          <div className="flex items-center gap-2 text-xs">
                            <ClockCircleOutlined />
                            <span>
                              {dayjs(reminder.scheduledFor).format(
                                "MMM D, YYYY HH:mm",
                              )}
                            </span>
                            <Text type="secondary">
                              ({dayjs(reminder.scheduledFor).fromNow()})
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Past / Sent Reminders */}
            {pastReminders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleOutlined className="text-green-500" />
                  <Text strong className="text-sm text-gray-500">
                    Past Reminders
                  </Text>
                  <Tag>{pastReminders.length}</Tag>
                </div>
                <List
                  size="small"
                  dataSource={pastReminders}
                  renderItem={(reminder) => (
                    <List.Item className="bg-gray-50 border border-gray-100 rounded-lg mb-2 px-3 py-2 opacity-70">
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size="small"
                            icon={<CheckCircleOutlined />}
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#16a34a",
                            }}
                          />
                        }
                        title={
                          <Text delete className="text-sm text-gray-500">
                            {reminder.message}
                          </Text>
                        }
                        description={
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>
                              {dayjs(reminder.scheduledFor).format(
                                "MMM D, YYYY HH:mm",
                              )}
                            </span>
                            {reminder.isSent && (
                              <Tag color="green" className="!text-xs">
                                Sent
                              </Tag>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default TaskReminders;
