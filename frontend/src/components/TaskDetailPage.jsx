import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Tag,
  Avatar,
  Button,
  Space,
  Divider,
  Typography,
  Spin,
  Timeline,
  Descriptions,
  Tabs,
  List,
  Progress,
  message,
  Dropdown,
  Menu,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FileTextOutlined,
  TagOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  BankOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  fetchTask,
  fetchTaskHistory,
  submitForReview,
  deleteTask,
  selectSelectedTask,
  selectTaskHistory,
  selectSelectedTaskLoading,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";
import { selectUser } from "../redux/features/auth/authSlice";

import TaskResponseForm from "./TaskResponseForm";
import TaskReviewModal from "./TaskReviewModal";
import TaskReminders from "./TaskReminders";

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

const STATUS_CONFIG = {
  pending: { color: "default", text: "Pending", icon: <ClockCircleOutlined /> },
  "in-progress": {
    color: "processing",
    text: "In Progress",
    icon: <ClockCircleOutlined />,
  },
  "under-review": {
    color: "orange",
    text: "Under Review",
    icon: <FileTextOutlined />,
  },
  completed: {
    color: "success",
    text: "Completed",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    color: "error",
    text: "Needs Revision",
    icon: <ExclamationCircleOutlined />,
  },
  cancelled: { color: "default", text: "Cancelled", icon: <DeleteOutlined /> },
};

const PRIORITY_CONFIG = {
  urgent: { color: "red", label: "Urgent" },
  high: { color: "orange", label: "High" },
  medium: { color: "blue", label: "Medium" },
  low: { color: "default", label: "Low" },
};

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const task = useSelector(selectSelectedTask);
  const taskHistory = useSelector(selectTaskHistory);
  const loading = useSelector(selectSelectedTaskLoading);
  const actionLoading = useSelector(selectTaskActionLoading);
  const user = useSelector(selectUser);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const userId = user?._id || user?.data?._id;

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTask(taskId));
      dispatch(fetchTaskHistory(taskId));
    }
  }, [dispatch, taskId]);

  const handleTaskUpdate = useCallback(() => {
    dispatch(fetchTask(taskId));
    dispatch(fetchTaskHistory(taskId));
  }, [dispatch, taskId]);

  const handleDelete = useCallback(() => {
    dispatch(deleteTask(taskId))
      .unwrap()
      .then(() => {
        message.success("Task deleted successfully");
        navigate("/dashboard/tasks");
      })
      .catch(() => {});
  }, [dispatch, taskId, navigate]);

  const handleSubmitForReview = useCallback(() => {
    dispatch(
      submitForReview({ taskId, data: { comment: "Submitted for review" } }),
    )
      .unwrap()
      .then(() => {
        message.success("Task submitted for review");
        handleTaskUpdate();
      })
      .catch(() => {});
  }, [dispatch, taskId, handleTaskUpdate]);

  if (loading || !task) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const priority = PRIORITY_CONFIG[task.taskPriority] || PRIORITY_CONFIG.medium;
  const isAssignee = task.assignees?.some(
    (a) => (a.user?._id || a.user) === userId,
  );
  const isCreator = task.createdBy?._id === userId;
  const canReview = isCreator && task.status === "under-review";

  const getActionMenu = () => {
    const items = [
      {
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit Task",
        onClick: () => navigate(`/dashboard/tasks/${taskId}/edit`),
      },
      {
        key: "reminders",
        icon: <BellOutlined />,
        label: "Manage Reminders",
        onClick: () => setRemindersModalOpen(true),
      },
    ];

    if (isCreator) {
      items.push({ type: "divider" });
      items.push({
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete Task",
        danger: true,
        onClick: handleDelete,
      });
    }

    return { items };
  };

  const taskResponses = task.taskResponses || [];
  const latestResponse = taskResponses[taskResponses.length - 1];

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <Card className="mb-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/dashboard/tasks")}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Tag color={priority.color} className="!text-sm">
                  {priority.label} Priority
                </Tag>
                <Tag color={status.color} className="!text-sm">
                  {status.icon} {status.text}
                </Tag>
                {task.category && (
                  <Tag className="capitalize">
                    {task.category.replace(/-/g, " ")}
                  </Tag>
                )}
              </div>
              <Title level={3} className="!mb-2 !mt-0">
                {task.title}
              </Title>
              {task.description && (
                <Paragraph className="text-gray-500 !mb-0">
                  {task.description}
                </Paragraph>
              )}
            </div>
          </div>

          <Space wrap>
            {isAssignee &&
              ["in-progress", "rejected"].includes(task.status) && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSubmitForReview}
                  loading={actionLoading}>
                  Submit for Review
                </Button>
              )}
            {canReview && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => setReviewModalOpen(true)}
                className="!bg-green-600 !border-green-600">
                Review Task
              </Button>
            )}
            <TaskResponseForm
              taskId={taskId}
              taskDetails={task}
              onResponseSubmitted={handleTaskUpdate}
            />
            <Dropdown menu={getActionMenu()} trigger={["click"]}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        </div>
      </Card>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Left Column - Details */}
        <Col xs={24} lg={16}>
          <Card className="shadow-sm mb-4">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "details",
                  label: (
                    <span>
                      <FileTextOutlined /> Details
                    </span>
                  ),
                  children: (
                    <div className="py-2">
                      <Descriptions
                        column={{ xs: 1, sm: 2 }}
                        bordered
                        size="small">
                        <Descriptions.Item label="Due Date">
                          <Space>
                            <CalendarOutlined />
                            {task.dueDate
                              ? dayjs(task.dueDate).format("MMM D, YYYY HH:mm")
                              : "Not set"}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Start Date">
                          <Space>
                            <CalendarOutlined />
                            {task.startDate
                              ? dayjs(task.startDate).format(
                                  "MMM D, YYYY HH:mm",
                                )
                              : "Not set"}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Created By">
                          <Space>
                            <Avatar size="small" src={task.createdBy?.photo}>
                              {task.createdBy?.firstName?.[0]}
                            </Avatar>
                            {task.createdBy?.firstName}{" "}
                            {task.createdBy?.lastName}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Created">
                          {dayjs(task.createdAt).format("MMM D, YYYY HH:mm")}
                        </Descriptions.Item>
                        {task.estimatedEffort && (
                          <Descriptions.Item label="Estimated Effort">
                            {task.estimatedEffort} hours
                          </Descriptions.Item>
                        )}
                        {task.actualCompletionDate && (
                          <Descriptions.Item label="Completed At">
                            {dayjs(task.actualCompletionDate).format(
                              "MMM D, YYYY HH:mm",
                            )}
                          </Descriptions.Item>
                        )}
                      </Descriptions>

                      {task.instruction && (
                        <div className="mt-4">
                          <Text strong className="block mb-2">
                            Instructions
                          </Text>
                          <Card size="small" className="bg-gray-50">
                            <Paragraph className="!mb-0 whitespace-pre-wrap">
                              {task.instruction}
                            </Paragraph>
                          </Card>
                        </div>
                      )}

                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-4">
                          <Text strong className="block mb-2">
                            <TagOutlined /> Tags
                          </Text>
                          <Space wrap>
                            {task.tags.map((tag, i) => (
                              <Tag key={i} color="blue">
                                {tag}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "responses",
                  label: (
                    <span>
                      <TeamOutlined /> Responses ({taskResponses.length})
                    </span>
                  ),
                  children: (
                    <div className="py-2">
                      {taskResponses.length === 0 ? (
                        <Empty description="No responses yet" />
                      ) : (
                        <List
                          dataSource={taskResponses}
                          renderItem={(response, index) => (
                            <Card size="small" className="mb-3">
                              <div className="flex items-start gap-3">
                                <Avatar src={response.submittedBy?.photo}>
                                  {response.submittedBy?.firstName?.[0]}
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <Text strong>
                                      {response.submittedBy?.firstName}{" "}
                                      {response.submittedBy?.lastName}
                                    </Text>
                                    <Text type="secondary" className="text-xs">
                                      {dayjs(response.submittedAt).fromNow()}
                                    </Text>
                                  </div>
                                  <Paragraph className="!mb-2">
                                    {response.comment}
                                  </Paragraph>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>
                                      Progress:{" "}
                                      <Text strong>
                                        {response.completionPercentage}%
                                      </Text>
                                    </span>
                                    <span>
                                      Time Spent:{" "}
                                      <Text strong>
                                        {response.timeSpent || 0} min
                                      </Text>
                                    </span>
                                    <Tag
                                      color={
                                        response.status === "completed"
                                          ? "green"
                                          : "blue"
                                      }>
                                      {response.status}
                                    </Tag>
                                  </div>
                                  {response.reviewComment && (
                                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                                      <Text strong>Review Feedback:</Text>{" "}
                                      {response.reviewComment}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          )}
                        />
                      )}
                    </div>
                  ),
                },
                {
                  key: "history",
                  label: (
                    <span>
                      <HistoryOutlined /> History
                    </span>
                  ),
                  children: (
                    <div className="py-2">
                      {taskHistory.length === 0 ? (
                        <Empty description="No history yet" />
                      ) : (
                        <Timeline
                          items={taskHistory.map((event) => ({
                            color:
                              event.action === "created"
                                ? "green"
                                : event.action.includes("review")
                                  ? "blue"
                                  : "gray",
                            children: (
                              <div>
                                <Text strong>{event.description}</Text>
                                <div className="text-xs text-gray-500">
                                  {event.by?.firstName} {event.by?.lastName} •{" "}
                                  {dayjs(event.timestamp).format(
                                    "MMM D, YYYY HH:mm",
                                  )}
                                </div>
                              </div>
                            ),
                          }))}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right Column - Sidebar */}
        <Col xs={24} lg={8}>
          {/* Matter Link */}
          {task.matter && (
            <Card className="shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-3">
                <FileTextOutlined className="text-blue-500" />
                <Text strong>Linked Matter</Text>
              </div>
              <div
                className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() =>
                  navigate(`/dashboard/matters/${task.matter._id}`)
                }>
                <div className="font-medium text-blue-900">
                  {task.matter.title || task.matter.matterNumber}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Tag>{task.matterType}</Tag>
                  {task.matter.status && (
                    <Tag color="blue">{task.matter.status}</Tag>
                  )}
                </div>
                {task.litigationDetailId && (
                  <div className="mt-2 text-sm text-blue-700 flex items-center gap-1">
                    <BankOutlined />
                    {task.litigationDetailId.courtName} -{" "}
                    {task.litigationDetailId.suitNo}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Assignees */}
          <Card className="shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TeamOutlined className="text-purple-500" />
                <Text strong>Assignees</Text>
              </div>
            </div>
            {task.assignees && task.assignees.length > 0 ? (
              <List
                size="small"
                dataSource={task.assignees}
                renderItem={(assignee) => (
                  <List.Item className="!py-2">
                    <List.Item.Meta
                      avatar={
                        <Avatar src={assignee.user?.photo} size="small">
                          {assignee.user?.firstName?.[0]}
                        </Avatar>
                      }
                      title={`${assignee.user?.firstName} ${assignee.user?.lastName}`}
                      description={
                        <Tag
                          color={
                            assignee.role === "primary"
                              ? "blue"
                              : assignee.role === "reviewer"
                                ? "purple"
                                : assignee.role === "collaborator"
                                  ? "green"
                                  : "default"
                          }
                          className="!text-xs">
                          {assignee.role}
                        </Tag>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">No assignees</Text>
            )}
          </Card>

          {/* Progress */}
          <Card className="shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleOutlined className="text-green-500" />
              <Text strong>Progress</Text>
            </div>
            <Progress
              percent={
                task.completionPercentage ||
                latestResponse?.completionPercentage ||
                0
              }
              status={
                task.status === "completed"
                  ? "success"
                  : task.status === "overdue"
                    ? "exception"
                    : "active"
              }
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
            />
            <div className="mt-3 text-center">
              <Text type="secondary" className="text-sm">
                {latestResponse?.completionPercentage || 0}% Complete
              </Text>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MoreOutlined className="text-gray-500" />
              <Text strong>Quick Actions</Text>
            </div>
            <Space direction="vertical" className="w-full">
              <Button
                block
                icon={<BellOutlined />}
                onClick={() => setRemindersModalOpen(true)}>
                Manage Reminders
              </Button>
              <Button
                block
                icon={<EditOutlined />}
                onClick={() => navigate(`/dashboard/tasks/${taskId}/edit`)}>
                Edit Task
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <TaskReviewModal
        task={task}
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          handleTaskUpdate();
        }}
        currentUserId={userId}
      />

      <TaskReminders
        taskId={taskId}
        taskTitle={task.title}
        open={remindersModalOpen}
        onClose={() => setRemindersModalOpen(false)}
        onSuccess={handleTaskUpdate}
      />
    </div>
  );
};

export default TaskDetailPage;
