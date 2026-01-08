import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
  Alert,
  List,
  Avatar,
  Timeline,
  Badge,
  Row,
  Col,
  Checkbox,
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
  //   EyeOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
// import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { formatDate } from "../utils/formatDate";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const TaskReviewModal = ({
  task,
  visible,
  onClose,
  onReviewComplete,
  currentUserId,
}) => {
  const [form] = Form.useForm();
  const { dataFetcher, loading: apiLoading } = useDataFetch();
  const [taskResponses, setTaskResponses] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && task) {
      loadTaskData();
    }
  }, [visible, task]);

  const loadTaskData = async () => {
    try {
      // Load task responses
      const responsesRes = await dataFetcher(`tasks/${task._id}`, "GET");
      if (responsesRes.data?.taskResponses) {
        setTaskResponses(responsesRes.data.taskResponses);
      }

      // Load task history if endpoint exists
      try {
        const historyRes = await dataFetcher(
          `tasks/${task._id}/history`,
          "GET"
        );
        if (historyRes.data) {
          setTaskHistory(historyRes.data);
        }
      } catch (historyError) {
        console.log("History endpoint not available:", historyError);
      }
    } catch (error) {
      console.error("Error loading task data:", error);
    }
  };

  const handleReviewSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const response = await dataFetcher(`tasks/${task._id}/review`, "POST", {
        approve: values.approve,
        reviewComment: values.reviewComment,
        rating: values.rating,
        sendNotification: values.sendNotification || true,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(
        values.approve
          ? "Task approved and marked as completed!"
          : "Task returned for revision!"
      );

      if (onReviewComplete) {
        onReviewComplete(response.data);
      }

      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const response = await dataFetcher(
        `documents/${documentId}/download`,
        "GET"
      );
      if (response.downloadUrl) {
        window.open(response.downloadUrl, "_blank");
      }
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  if (!task) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CheckCircleOutlined className="text-green-500" />
          <Title level={4} className="mb-0">
            Review Task Submission
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
      closable={!isSubmitting}>
      <Divider className="my-4" />

      {/* Task Overview */}
      <Card size="small" className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <Title level={5}>{task.title}</Title>
            <Text type="secondary">{task.description}</Text>
          </div>
          <Tag color="orange">Under Review</Tag>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Text strong className="block text-xs text-gray-500">
              Due Date
            </Text>
            <Text>{formatDate(task.dueDate)}</Text>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Assignee
            </Text>
            <Text>
              {task.assignees?.[0]?.user?.name ||
                task.assignees?.[0]?.user?.firstName ||
                "N/A"}
            </Text>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Priority
            </Text>
            <Tag
              color={
                task.taskPriority === "high"
                  ? "red"
                  : task.taskPriority === "medium"
                  ? "orange"
                  : "green"
              }>
              {task.taskPriority}
            </Tag>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Category
            </Text>
            <Text>{task.category || "N/A"}</Text>
          </div>
        </div>
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
                          {response.submittedBy?.name ||
                            response.submittedBy?.firstName ||
                            "Anonymous"}
                        </Text>
                        <Text type="secondary" className="text-xs">
                          {formatDate(response.submittedAt)}
                        </Text>
                      </div>
                      <Paragraph className="mb-2">{response.comment}</Paragraph>

                      <div className="flex gap-4 mb-3">
                        <div>
                          <Text strong className="block text-xs text-gray-500">
                            Completion
                          </Text>
                          <Text>{response.completionPercentage}%</Text>
                        </div>
                        <div>
                          <Text strong className="block text-xs text-gray-500">
                            Time Spent
                          </Text>
                          <Text>{response.timeSpent} minutes</Text>
                        </div>
                        <div>
                          <Text strong className="block text-xs text-gray-500">
                            Status
                          </Text>
                          <Tag
                            color={
                              response.status === "completed" ? "green" : "blue"
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
                                type="dashed"
                                onClick={() =>
                                  downloadDocument(doc._id, doc.fileName)
                                }>
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
                    : event.action === "updated"
                    ? "blue"
                    : event.action === "response_submitted"
                    ? "orange"
                    : "gray"
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
                  By {event.by?.name || event.by?.firstName || "System"} •{" "}
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
            <Col span={24}>
              <Form.Item
                label="Quality Rating (1-5 stars)"
                name="rating"
                rules={[
                  { required: true, message: "Please provide a rating" },
                ]}>
                <Rate allowHalf character={<StarOutlined />} />
              </Form.Item>
            </Col>

            <Col span={24}>
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

            <Col span={24}>
              <Form.Item
                label="Review Comments"
                name="reviewComment"
                rules={[
                  { required: true, message: "Please provide review comments" },
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

            <Col span={24}>
              <Form.Item name="sendNotification" valuePropName="checked">
                <Space>
                  <SendOutlined />
                  <Text>Send notification email to assignee</Text>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          {/* Action Buttons */}
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
              className="bg-green-600 hover:bg-green-700 border-green-600">
              {isSubmitting ? "Processing..." : "Approve & Complete"}
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

TaskReviewModal.propTypes = {
  task: PropTypes.object.isRequired,
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReviewComplete: PropTypes.func,
  currentUserId: PropTypes.string.isRequired,
};

export default TaskReviewModal;
