import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Form,
  Input,
  Rate,
  Button,
  Card,
  Space,
  Tag,
  Typography,
  Divider,
  List,
  Avatar,
  Timeline,
  Badge,
  Row,
  Col,
  Checkbox,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  HistoryOutlined,
  DownloadOutlined,
  StarOutlined,
  SendOutlined,
} from "@ant-design/icons";

import {
  fetchTask,
  fetchTaskHistory,
  reviewTaskComplete,
  selectSelectedTask,
  selectTaskHistory,
  selectSelectedTaskLoading,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";

import { formatDate } from "../utils/formatDate";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const TaskReviewModal = ({ task, open, onClose, currentUserId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const selectedTask = useSelector(selectSelectedTask);
  const taskHistory = useSelector(selectTaskHistory);
  const loading = useSelector(selectSelectedTaskLoading);
  const actionLoading = useSelector(selectTaskActionLoading);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTask = selectedTask || task;

  useEffect(() => {
    if (open && task?._id) {
      dispatch(fetchTask(task._id));
      dispatch(fetchTaskHistory(task._id));
    }
  }, [dispatch, open, task?._id]);

  const handleReviewSubmit = useCallback(
    async (values) => {
      setIsSubmitting(true);
      try {
        await dispatch(
          reviewTaskComplete({
            taskId: currentTask._id,
            data: {
              approve: values.approve,
              reviewComment: values.reviewComment,
              rating: values.rating,
              sendNotification: values.sendNotification !== false,
            },
          }),
        ).unwrap();

        onClose();
      } catch (error) {
        // Error handled by slice
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, currentTask, onClose],
  );

  if (!currentTask) return null;

  const taskResponses = currentTask.taskResponses || [];
  const latestResponse = taskResponses[taskResponses.length - 1];

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined className="text-green-500" />
          <Title level={4} className="!mb-0">
            Review Task Submission
          </Title>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
      closable={!isSubmitting}>
      <Divider className="!my-4" />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Task Overview */}
          <Card size="small" className="mb-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <Title level={5} className="!mt-0">
                  {currentTask.title}
                </Title>
                <Text type="secondary">{currentTask.description}</Text>
              </div>
              <Tag color="orange" className="shrink-0">
                Under Review
              </Tag>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Text strong className="block text-xs text-gray-500">
                  Due Date
                </Text>
                <Text>{formatDate(currentTask.dueDate)}</Text>
              </div>
              <div>
                <Text strong className="block text-xs text-gray-500">
                  Assignee
                </Text>
                <Text>
                  {currentTask.assignees?.[0]?.user?.firstName
                    ? `${currentTask.assignees[0].user.firstName} ${currentTask.assignees[0].user.lastName}`
                    : "N/A"}
                </Text>
              </div>
              <div>
                <Text strong className="block text-xs text-gray-500">
                  Priority
                </Text>
                <Tag
                  color={
                    currentTask.taskPriority === "high"
                      ? "red"
                      : currentTask.taskPriority === "medium"
                        ? "orange"
                        : "green"
                  }>
                  {currentTask.taskPriority || "medium"}
                </Tag>
              </div>
              <div>
                <Text strong className="block text-xs text-gray-500">
                  Category
                </Text>
                <Text className="capitalize">
                  {currentTask.category?.replace(/-/g, " ") || "N/A"}
                </Text>
              </div>
            </div>

            {/* Matter Link */}
            {currentTask.matter && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Text strong className="block text-xs text-gray-500 mb-1">
                  Related Matter
                </Text>
                <Space>
                  <FileTextOutlined />
                  <Text>
                    {currentTask.matter.title ||
                      currentTask.matter.matterNumber}
                  </Text>
                  <Tag>{currentTask.matterType}</Tag>
                </Space>
              </div>
            )}
          </Card>

          {/* Task Responses */}
          {taskResponses.length > 0 && (
            <Card
              size="small"
              title={
                <Space>
                  <FileTextOutlined />
                  <Text strong>Submitted Responses</Text>
                  <Badge count={taskResponses.length} />
                </Space>
              }
              className="mb-4">
              <List
                dataSource={taskResponses}
                renderItem={(response, index) => (
                  <List.Item key={response._id || index}>
                    <Card className="w-full" size="small">
                      <div className="flex items-start gap-3">
                        <Avatar icon={<UserOutlined />} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <Text strong>
                              {response.submittedBy?.firstName
                                ? `${response.submittedBy.firstName} ${response.submittedBy.lastName}`
                                : "Anonymous"}
                            </Text>
                            <Text type="secondary" className="text-xs">
                              {formatDate(response.submittedAt)}
                            </Text>
                          </div>
                          <Paragraph className="mb-2">
                            {response.comment}
                          </Paragraph>

                          <div className="flex flex-wrap gap-4 mb-3">
                            <div>
                              <Text
                                strong
                                className="block text-xs text-gray-500">
                                Completion
                              </Text>
                              <Text>{response.completionPercentage}%</Text>
                            </div>
                            <div>
                              <Text
                                strong
                                className="block text-xs text-gray-500">
                                Time Spent
                              </Text>
                              <Text>{response.timeSpent || 0} minutes</Text>
                            </div>
                            <div>
                              <Text
                                strong
                                className="block text-xs text-gray-500">
                                Status
                              </Text>
                              <Tag
                                color={
                                  response.status === "completed"
                                    ? "green"
                                    : "blue"
                                }>
                                {response.status}
                              </Tag>
                            </div>
                          </div>

                          {/* Attached Documents */}
                          {response.documents?.length > 0 && (
                            <div className="mt-3">
                              <Text
                                strong
                                className="block text-xs text-gray-500 mb-2">
                                Attached Documents
                              </Text>
                              <Space wrap>
                                {response.documents.map((doc, docIndex) => (
                                  <Button
                                    key={doc._id || docIndex}
                                    icon={<DownloadOutlined />}
                                    size="small"
                                    type="dashed">
                                    {doc.fileName}
                                  </Button>
                                ))}
                              </Space>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Task History Timeline */}
          {taskHistory.length > 0 && (
            <Card
              size="small"
              title={
                <Space>
                  <HistoryOutlined />
                  <Text strong>Task History</Text>
                </Space>
              }
              className="mb-4">
              <Timeline>
                {taskHistory.map((event, index) => (
                  <Timeline.Item
                    key={index}
                    color={
                      event.action === "created"
                        ? "green"
                        : event.action === "response_submitted"
                          ? "orange"
                          : "blue"
                    }
                    dot={
                      event.action === "created" ? (
                        <CheckCircleOutlined />
                      ) : event.action === "response_submitted" ? (
                        <SendOutlined />
                      ) : (
                        <ClockCircleOutlined />
                      )
                    }>
                    <Text strong>{event.description}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      By {event.by?.firstName || "System"} •{" "}
                      {formatDate(event.timestamp)}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          )}

          {/* Review Form */}
          <Card
            size="small"
            title={
              <Space>
                <StarOutlined />
                <Text strong>Review & Approval</Text>
              </Space>
            }>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleReviewSubmit}
              disabled={isSubmitting}
              initialValues={{
                approve: true,
                rating: 5,
                sendNotification: true,
              }}>
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    label="Quality Rating (1-5 stars)"
                    name="rating"
                    rules={[
                      { required: true, message: "Please provide a rating" },
                    ]}>
                    <Rate allowHalf character={<StarOutlined />} />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Decision"
                    name="approve"
                    valuePropName="checked">
                    <Space direction="vertical">
                      <Space>
                        <CheckCircleOutlined className="text-green-500" />
                        <Text>Approve and mark as completed</Text>
                      </Space>
                      <Space>
                        <CloseCircleOutlined className="text-red-500" />
                        <Text>Reject and return for revision</Text>
                      </Space>
                    </Space>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Review Comments"
                    name="reviewComment"
                    rules={[
                      {
                        required: true,
                        message: "Please provide review comments",
                      },
                      {
                        min: 20,
                        message: "Comments must be at least 20 characters",
                      },
                      {
                        max: 1000,
                        message: "Comments must not exceed 1000 characters",
                      },
                    ]}>
                    <TextArea
                      rows={4}
                      placeholder="Provide detailed feedback, suggestions, or approval comments..."
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="sendNotification" valuePropName="checked">
                    <Checkbox checked defaultChecked>
                      <Space>
                        <SendOutlined />
                        <Text>Send notification email to assignee</Text>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="default"
                  icon={<CloseCircleOutlined />}
                  disabled={isSubmitting}
                  onClick={() => {
                    form.setFieldValue("approve", false);
                    form.submit();
                  }}>
                  Return for Revision
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  htmlType="submit"
                  loading={isSubmitting}
                  className="!bg-green-600 hover:!bg-green-700 !border-green-600">
                  {isSubmitting ? "Processing..." : "Approve & Complete"}
                </Button>
              </div>
            </Form>
          </Card>
        </>
      )}
    </Modal>
  );
};

export default TaskReviewModal;
