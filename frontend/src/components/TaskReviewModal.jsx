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
  Alert,
  Radio,
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
  fetchTaskHistory,
  reviewTaskComplete,
  selectTaskHistory,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";

import { formatDate } from "../utils/formatDate";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const TaskReviewModal = ({
  task,
  open,
  onClose,
  onReviewComplete,
  currentUserId,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // ✅ FIX 1: Don't use selectedTask or selectedTaskLoading at all.
  //    The modal already receives `task` as a prop with full data.
  //    fetchTask was causing loading:true to get stuck because either
  //    the thunk failed silently or selectSelectedTaskLoading tracked
  //    the wrong flag. Use the prop directly.
  const taskHistory = useSelector(selectTaskHistory);
  const actionLoading = useSelector(selectTaskActionLoading);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ FIX 2: Only fetch task history (not the full task again).
  //    Track history loading locally so we don't block the whole modal.
  useEffect(() => {
    if (!open || !task?._id) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        await dispatch(fetchTaskHistory(task._id)).unwrap();
      } catch (err) {
        console.warn("Failed to load task history:", err);
        // Non-fatal — modal still shows without history
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [dispatch, open, task?._id]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleReviewSubmit = useCallback(
    async (values) => {
      if (!task?._id) return;
      setIsSubmitting(true);
      try {
        await dispatch(
          reviewTaskComplete({
            taskId: task._id,
            data: {
              approve: values.approve,
              reviewComment: values.reviewComment,
              rating: values.rating,
              sendNotification: values.sendNotification !== false,
            },
          }),
        ).unwrap();

        form.resetFields();
        onReviewComplete && onReviewComplete();
        onClose();
      } catch (error) {
        // Error toast handled by slice
        console.error("Review submission failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, task, onClose, onReviewComplete, form],
  );

  // ✅ FIX 3: isAssignedBy — task data shows assignedBy is a plain string ID,
  //    not a populated object. Handle both cases.
  const userIdStr = String(currentUserId || "");
  const isCreator = task?.createdBy?._id
    ? String(task.createdBy._id) === userIdStr
    : String(task?.createdBy) === userIdStr;

  const isAssignedBy = task?.assignees?.some((assignee) => {
    // assignedBy can be a plain string ID or a populated object
    const assignedById = assignee.assignedBy?._id
      ? String(assignee.assignedBy._id)
      : String(assignee.assignedBy);
    return assignedById === userIdStr;
  });

  const canReview = isCreator || isAssignedBy;

  if (!task) return null;

  const taskResponses = task.taskResponses || [];

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

      {/* ✅ No more full-modal spinner — modal always shows content */}

      {/* Permission warning */}
      {!canReview && (
        <Alert
          type="warning"
          showIcon
          message="You don't have permission to review this task"
          description="Only the task creator or the person who assigned it can approve or reject."
          className="mb-4"
        />
      )}

      {/* Task Overview */}
      <Card size="small" className="mb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <Title level={5} className="!mt-0">
              {task.title}
            </Title>
            <Text type="secondary">{task.description}</Text>
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
            <Text>{formatDate(task.dueDate)}</Text>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Assignee
            </Text>
            <Text>
              {task.assignees?.[0]?.user?.firstName
                ? `${task.assignees[0].user.firstName} ${task.assignees[0].user.lastName}`
                : "N/A"}
            </Text>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Priority
            </Text>
            <Tag
              color={
                task.taskPriority === "high" || task.taskPriority === "urgent"
                  ? "red"
                  : task.taskPriority === "medium"
                    ? "orange"
                    : "green"
              }>
              {task.taskPriority || "medium"}
            </Tag>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Category
            </Text>
            <Text className="capitalize">
              {task.category?.replace(/-/g, " ") || "N/A"}
            </Text>
          </div>
        </div>

        {task.matter && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Text strong className="block text-xs text-gray-500 mb-1">
              Related Matter
            </Text>
            <Space>
              <FileTextOutlined />
              <Text>{task.matter.title || task.matter.matterNumber}</Text>
              <Tag>{task.matterType}</Tag>
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
                      <Paragraph className="mb-2">{response.comment}</Paragraph>

                      <div className="flex flex-wrap gap-4 mb-3">
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
                          <Text>{response.timeSpent || 0} minutes</Text>
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
                                  window.open(doc.fileUrl, "_blank")
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
      <Card
        size="small"
        title={
          <Space>
            <HistoryOutlined />
            <Text strong>Task History</Text>
          </Space>
        }
        className="mb-4">
        {historyLoading ? (
          <div className="flex justify-center py-4">
            <Spin size="small" tip="Loading history..." />
          </div>
        ) : taskHistory.length > 0 ? (
          <Timeline>
            {taskHistory.map((event, index) => (
              <Timeline.Item
                key={index}
                color={
                  event.action === "created"
                    ? "green"
                    : event.action === "response_submitted" ||
                        event.action === "submitted_for_review"
                      ? "orange"
                      : "blue"
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
        ) : // ✅ FIX 4: Show history from task.history if Redux taskHistory is empty
        task.history?.length > 0 ? (
          <Timeline>
            {task.history.map((event, index) => (
              <Timeline.Item
                key={index}
                color={
                  event.action === "created"
                    ? "green"
                    : event.action === "submitted_for_review"
                      ? "orange"
                      : "blue"
                }>
                <Text strong>{event.description}</Text>
                <br />
                <Text type="secondary" className="text-xs">
                  {formatDate(event.timestamp)}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Text type="secondary">No history available</Text>
        )}
      </Card>

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
          disabled={isSubmitting || !canReview}
          initialValues={{ approve: true, rating: 5, sendNotification: true }}>
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
                initialValue={true}>
                <Radio.Group>
                  <Radio.Button value={true}>
                    <CheckCircleOutlined className="text-green-500 mr-1" />
                    Approve & Complete
                  </Radio.Button>
                  <Radio.Button value={false}>
                    <CloseCircleOutlined className="text-red-500 mr-1" />
                    Return for Revision
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={24}>
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

            <Col xs={24}>
              <Form.Item name="sendNotification" valuePropName="checked">
                <Checkbox defaultChecked>
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
              disabled={isSubmitting || !canReview}
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
              disabled={!canReview}
              className="!bg-green-600 hover:!bg-green-700 !border-green-600">
              {isSubmitting ? "Processing..." : "Approve & Complete"}
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

export default TaskReviewModal;
