import React, { useState, useCallback, useEffect } from "react";
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
import apiService from "../services/api";
import { selectUser } from "../redux/features/auth/authSlice";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { TextArea } = Input;

const TaskReminders = ({ taskId, taskTitle, open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [form] = Form.useForm();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      fetchReminders();
    }
  }, [open, taskId]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(`/tasks/${taskId}`);
      if (response.data?.reminders) {
        setReminders(response.data.reminders);
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (values) => {
    setSubmitting(true);
    try {
      const reminderData = {
        message: values.message,
        scheduledFor: values.scheduledFor.toISOString(),
      };

      await apiService.post(`/tasks/${taskId}/reminders`, reminderData);
      message.success("Reminder added successfully");
      form.resetFields();
      fetchReminders();
      onSuccess?.();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      await apiService.delete(`/tasks/${taskId}/reminders/${reminderId}`);
      message.success("Reminder deleted");
      setReminders(reminders.filter((r) => r._id !== reminderId));
    } catch (error) {
      message.error("Failed to delete reminder");
    }
  };

  const handleMarkAsSent = async (reminderId) => {
    try {
      await apiService.patch(`/tasks/${taskId}/reminders/${reminderId}`, {
        isSent: true,
        sentAt: new Date(),
      });
      fetchReminders();
    } catch (error) {
      message.error("Failed to update reminder");
    }
  };

  const upcomingReminders = reminders
    .filter((r) => !r.isSent && dayjs(r.scheduledFor).isAfter(dayjs()))
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

  const pastReminders = reminders
    .filter((r) => r.isSent || dayjs(r.scheduledFor).isBefore(dayjs()))
    .sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));

  return (
    <Modal
      title={
        <Space>
          <BellOutlined className="text-blue-500" />
          <span>Task Reminders</span>
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
                  { max: 150, message: "Message cannot exceed 150 characters" },
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
                  loading={submitting}
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
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : reminders.length === 0 ? (
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
                          <div className="flex items-center gap-2">
                            <Text className="text-sm">{reminder.message}</Text>
                          </div>
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

            {/* Past/Sent Reminders */}
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
                          <div className="flex items-center gap-2">
                            <Text className="text-sm text-gray-500 strikethrough">
                              {reminder.message}
                            </Text>
                          </div>
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
