import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Alert,
  Divider,
  Typography,
  Tag,
  Space,
  Tabs,
  List,
  Badge,
  Row,
  Col,
  Grid,
  Collapse,
  Timeline,
  Avatar,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  FlagOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  PaperClipOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  MailOutlined,
  HistoryOutlined,
  FileDoneOutlined,
  SettingOutlined,
  FolderOpenOutlined,
  TagOutlined,
  LinkOutlined,
  ScheduleOutlined,
  ToolOutlined,
  DatabaseOutlined,
  NumberOutlined,
  FieldTimeOutlined,
  StopOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import TaskResponseForm from "../components/TaskResponseForm";
import moment from "moment";
import TaskResponse from "../components/TaskResponse";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
// import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import AddEventToCalender from "../components/AddEventToCalender";
import TaskFileUploader from "../components/TaskFileUploader";
import useFileManager from "../hooks/useFileManager";
import TaskAttachmentsCard from "../components/TaskAttachmentsCard ";

import TaskDetailItem, {
  CaseDetailItem,
} from "../components/tasks/TaskDetailItem";
import TaskReviewActions from "../components/tasks/TaskReviewActions";
import TaskStatusTracker from "../components/tasks/TaskStatusTracker";
import AssigneesSection from "../components/tasks/AssigneesSection";
import TaskDetailsHeader from "../components/tasks/TaskDetailsHeader";
import TaskMetricsCard from "../components/tasks/TaskMetricsCard";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

// Configuration helpers
const getPriorityConfig = (priority) => {
  const configs = {
    urgent: { color: "red", text: "URGENT", icon: <FlagOutlined /> },
    high: { color: "orange", text: "HIGH", icon: <FlagOutlined /> },
    medium: { color: "blue", text: "MEDIUM", icon: <FlagOutlined /> },
    low: { color: "green", text: "LOW", icon: <FlagOutlined /> },
  };
  return configs[priority?.toLowerCase()] || configs.medium;
};

const getStatusConfig = (status, isOverdue) => {
  if (isOverdue) {
    return {
      color: "red",
      icon: <ClockCircleOutlined />,
      text: "OVERDUE",
      badge: "error",
    };
  }

  const configs = {
    completed: {
      color: "green",
      icon: <CheckCircleOutlined />,
      text: "COMPLETED",
      badge: "success",
    },
    "in-progress": {
      color: "blue",
      icon: <SyncOutlined spin />,
      text: "IN PROGRESS",
      badge: "processing",
    },
    "under-review": {
      color: "orange",
      icon: <FileSearchOutlined />,
      text: "UNDER REVIEW",
      badge: "warning",
    },
    pending: {
      color: "default",
      icon: <ClockCircleOutlined />,
      text: "PENDING",
      badge: "default",
    },
    rejected: {
      color: "red",
      icon: <ExclamationCircleOutlined />,
      text: "NEEDS REVISION",
      badge: "error",
    },
    cancelled: {
      color: "default",
      icon: <StopOutlined />,
      text: "CANCELLED",
      badge: "default",
    },
    overdue: {
      color: "red",
      icon: <ClockCircleOutlined />,
      text: "OVERDUE",
      badge: "error",
    },
  };

  return configs[status?.toLowerCase()] || configs.pending;
};

const getCategoryConfig = (category) => {
  const configs = {
    "legal-research": {
      color: "purple",
      icon: <FileTextOutlined />,
      label: "Legal Research",
    },
    "document-drafting": {
      color: "blue",
      icon: <FileTextOutlined />,
      label: "Document Drafting",
    },
    "client-meeting": {
      color: "green",
      icon: <TeamOutlined />,
      label: "Client Meeting",
    },
    "court-filing": {
      color: "red",
      icon: <FolderOpenOutlined />,
      label: "Court Filing",
    },
    discovery: { color: "orange", icon: <EyeOutlined />, label: "Discovery" },
    correspondence: {
      color: "cyan",
      icon: <MailOutlined />,
      label: "Correspondence",
    },
    administrative: {
      color: "gray",
      icon: <SettingOutlined />,
      label: "Administrative",
    },
    other: { color: "default", icon: <ToolOutlined />, label: "Other" },
  };
  return configs[category] || configs.other;
};

const TaskDetails = () => {
  const { dataFetcher, data, loading, error: dataError } = useDataFetch();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const task = data?.data;
  const currentUser = user?.data?._id;
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const screens = useBreakpoint();

  const fileManager = useFileManager("Task", id, {
    enableNotifications: true,
    autoFetch: true,
  });

  useRedirectLogoutUser("/users/login");

  const isAssignedToCurrentUser = useMemo(
    () =>
      task?.assignees?.some(
        (assignee) =>
          assignee.user?._id === currentUser || assignee.user === currentUser
      ),
    [task, currentUser]
  );

  const isTaskCreator = task?.createdBy?._id === currentUser;

  const refreshTask = () => {
    setRefreshTrigger((prev) => prev + 1);
    fileManager.refreshFiles();
  };

  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id, dataFetcher, refreshTrigger]);

  const handleTaskResponse = () => {
    refreshTask();
  };

  // Calculate time metrics
  const timeMetrics = useMemo(() => {
    if (!task) return {};

    const dueDate = moment(task.dueDate);
    const startDate = moment(task.startDate || task.dateCreated);
    const today = moment();
    const daysRemaining = dueDate.diff(today, "days");
    const isOverdue = daysRemaining < 0;
    const daysUntilDue = Math.abs(daysRemaining);
    const durationDays = dueDate.diff(startDate, "days");
    const elapsedDays = today.diff(startDate, "days");
    const progressPercentage = Math.min(
      Math.max((elapsedDays / durationDays) * 100, 0),
      100
    );

    return {
      dueDate,
      startDate,
      today,
      daysRemaining,
      isOverdue,
      daysUntilDue,
      durationDays,
      elapsedDays,
      progressPercentage,
    };
  }, [task]);

  if (loading) return <LoadingSpinner />;
  if (dataError) {
    return (
      <PageErrorAlert errorCondition={dataError} errorMessage={dataError} />
    );
  }

  // Get configurations
  const statusConfig = getStatusConfig(task?.status, timeMetrics.isOverdue);
  const priorityConfig = getPriorityConfig(task?.taskPriority);
  const categoryConfig = getCategoryConfig(task?.category);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!task?.taskResponses || task.taskResponses.length === 0) return 0;

    const totalProgress = task.taskResponses.reduce((sum, response) => {
      return sum + (response.completionPercentage || 0);
    }, 0);

    return Math.round(totalProgress / task.taskResponses.length);
  };

  const overallProgress = calculateOverallProgress();

  // Calculate time spent
  const getTotalTimeSpent = () => {
    if (!task?.taskResponses || task.taskResponses.length === 0) return 0;

    return task.taskResponses.reduce((sum, response) => {
      return sum + (response.timeSpent || 0);
    }, 0);
  };

  const totalTimeSpent = getTotalTimeSpent();
  const totalTimeSpentHours = Math.round(totalTimeSpent / 60);
  const estimatedEffortHours = task?.estimatedEffort || 0;
  const timeUtilization =
    estimatedEffortHours > 0
      ? Math.round((totalTimeSpentHours / estimatedEffortHours) * 100)
      : 0;

  // Task Metrics
  const taskMetrics = [
    {
      icon: <FieldTimeOutlined />,
      label: "Time Spent",
      value: `${totalTimeSpentHours}h`,
      subValue: totalTimeSpent > 0 ? `${totalTimeSpent} min` : "Not tracked",
      color: "#1890ff",
    },
    {
      icon: <ScheduleOutlined />,
      label: "Estimated Effort",
      value: `${estimatedEffortHours}h`,
      subValue: "Planned",
      color: "#52c41a",
    },
    {
      icon: <DatabaseOutlined />,
      label: "Time Utilization",
      value: `${timeUtilization}%`,
      subValue: "of estimate",
      color:
        timeUtilization > 100
          ? "#ff4d4f"
          : timeUtilization > 80
          ? "#fa8c16"
          : "#52c41a",
    },
    {
      icon: <NumberOutlined />,
      label: "Responses",
      value: task?.taskResponses?.length || 0,
      subValue: "submitted",
      color: "#722ed1",
    },
  ];

  // Action buttons component
  const actionButtons = (
    <Space
      direction={screens.xs ? "vertical" : "horizontal"}
      size="small"
      className="w-full">
      {/* Task Review Actions */}
      <TaskReviewActions
        task={task}
        userId={currentUser}
        onStatusChange={refreshTask}
        onReviewComplete={refreshTask}
        screens={screens}
      />

      {/* Reference Documents Upload */}
      <TaskFileUploader
        taskId={task?._id}
        uploadType="reference"
        buttonText={screens.xs ? "Reference" : "Add Reference Docs"}
        buttonProps={{
          type: "default",
          icon: <PaperClipOutlined />,
          size: screens.xs ? "small" : "middle",
        }}
        onUploadSuccess={refreshTask}
      />

      {/* Add to Calendar */}
      <AddEventToCalender
        title={`Task: ${task?.title}`}
        description={`${task?.description || task?.instruction}\n\nPriority: ${
          task?.taskPriority
        }\nCategory: ${task?.category}`}
        startDate={task?.startDate || task?.dateCreated}
        endDate={task?.dueDate}
        buttonProps={{
          size: screens.xs ? "small" : "middle",
        }}
      />
    </Space>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        {/* Header Section */}
        <TaskDetailsHeader
          task={task}
          loading={loading}
          screens={screens}
          refreshTask={refreshTask}
          statusConfig={statusConfig}
          priorityConfig={priorityConfig}
          categoryConfig={categoryConfig}
          overallProgress={overallProgress}
          timeMetrics={timeMetrics}
          actionButtons={actionButtons}
          isTemplate={task?.isTemplate}
        />
        {/* Task Metrics */}
        <TaskMetricsCard taskMetrics={taskMetrics} screens={screens} />

        {/* Status Tracker */}
        <Card className="mb-6 shadow-sm border-0">
          <TaskStatusTracker
            task={task}
            userId={currentUser}
            onStatusChange={refreshTask}
          />
        </Card>

        {/* Main Content */}
        <Card className="shadow-sm border-0">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size={screens.xs ? "small" : "middle"}
            items={[
              {
                key: "overview",
                label: (
                  <span>
                    <InfoCircleOutlined className="mr-1" />
                    {screens.xs ? "Overview" : "Task Overview"}
                  </span>
                ),
                children: (
                  <div className="py-4">
                    {/* Show TaskResponseForm for assignees who are not the creator */}
                    {isAssignedToCurrentUser && !isTaskCreator && (
                      <Card size="small" className="mb-6">
                        <TaskResponseForm
                          taskId={task?._id}
                          onResponseSubmitted={handleTaskResponse}
                        />
                      </Card>
                    )}

                    {/* Task Details Grid */}
                    <Row gutter={[16, 16]} className="mb-6">
                      <TaskDetailItem
                        icon={<CalendarOutlined />}
                        label="Date Created"
                        value={formatDate(task?.dateCreated)}
                      />
                      <TaskDetailItem
                        icon={<ScheduleOutlined />}
                        label="Start Date"
                        value={
                          task?.startDate
                            ? formatDate(task?.startDate)
                            : "Not set"
                        }
                      />
                      <TaskDetailItem
                        icon={<ClockCircleOutlined />}
                        label="Due Date"
                        children={
                          <Space direction="vertical" size={0}>
                            <Text>{formatDate(task?.dueDate)}</Text>
                            {timeMetrics.isOverdue ? (
                              <Text type="danger" className="text-xs">
                                {timeMetrics.daysUntilDue} days overdue
                              </Text>
                            ) : (
                              <Text type="success" className="text-xs">
                                {timeMetrics.daysRemaining} days remaining
                              </Text>
                            )}
                          </Space>
                        }
                      />
                      <TaskDetailItem
                        icon={<CheckSquareOutlined />}
                        label="Actual Completion"
                        value={
                          task?.actualCompletionDate
                            ? formatDate(task?.actualCompletionDate)
                            : "Not completed"
                        }
                      />

                      <TaskDetailItem
                        icon={<UserOutlined />}
                        label="Created By"
                        span={2}
                        children={
                          task?.createdBy ? (
                            <Space>
                              <Avatar size="small" src={task.createdBy.photo}>
                                {task.createdBy.firstName?.[0]}
                                {task.createdBy.lastName?.[0]}
                              </Avatar>
                              <Text>
                                {task.createdBy.firstName}{" "}
                                {task.createdBy.lastName}
                              </Text>
                              <Text type="secondary">
                                (
                                {task.createdBy.position || task.createdBy.role}
                                )
                              </Text>
                            </Space>
                          ) : (
                            "N/A"
                          )
                        }
                      />

                      {/* Related Case */}
                      <CaseDetailItem task={task} screens={screens} />
                    </Row>

                    {/* Instructions Section */}
                    <Collapse ghost className="mb-6">
                      <Panel
                        header={
                          <Space>
                            <FileTextOutlined />
                            <Text strong>Instructions</Text>
                          </Space>
                        }
                        key="instructions">
                        <Card size="small">
                          <Paragraph className="whitespace-pre-wrap">
                            {task?.instruction || "No instructions provided"}
                          </Paragraph>
                        </Card>
                      </Panel>
                    </Collapse>

                    {/* Assignees Section */}
                    <AssigneesSection
                      task={task}
                      currentUser={currentUser}
                      screens={screens}
                    />

                    {/* Tags and Dependencies */}
                    {(task?.tags?.length > 0 ||
                      task?.dependencies?.length > 0) && (
                      <Collapse ghost className="mb-6">
                        <Panel
                          header={
                            <Space>
                              <TagOutlined />
                              <Text strong>Tags & Dependencies</Text>
                            </Space>
                          }
                          key="tags">
                          <Row gutter={[16, 16]}>
                            {task?.tags?.length > 0 && (
                              <Col xs={24} lg={12}>
                                <Card size="small" title="Tags">
                                  <Space wrap>
                                    {task.tags.map((tag, index) => (
                                      <Tag
                                        key={index}
                                        color="blue"
                                        icon={<TagOutlined />}>
                                        {tag}
                                      </Tag>
                                    ))}
                                  </Space>
                                </Card>
                              </Col>
                            )}
                            {task?.dependencies?.length > 0 && (
                              <Col xs={24} lg={12}>
                                <Card size="small" title="Dependencies">
                                  <List
                                    size="small"
                                    dataSource={task.dependencies}
                                    renderItem={(dep) => (
                                      <List.Item>
                                        <List.Item.Meta
                                          avatar={<LinkOutlined />}
                                          title={
                                            <Text strong>{dep.title}</Text>
                                          }
                                          description={`Status: ${dep.status}`}
                                        />
                                      </List.Item>
                                    )}
                                  />
                                </Card>
                              </Col>
                            )}
                          </Row>
                        </Panel>
                      </Collapse>
                    )}

                    {/* Task Responses */}
                    <TaskResponse
                      task={task}
                      isAssignedToCurrentUser={isAssignedToCurrentUser}
                      onResponseUpdate={handleTaskResponse}
                    />
                  </div>
                ),
              },
              {
                key: "documents",
                label: (
                  <span>
                    <FileDoneOutlined className="mr-1" />
                    Documents
                    <Badge
                      count={fileManager.statistics.totalFiles}
                      offset={[8, -8]}
                      size="small"
                      style={{ backgroundColor: "#1890ff" }}
                    />
                  </span>
                ),
                children: (
                  <div className="py-4">
                    <TaskAttachmentsCard
                      taskId={task?._id}
                      fileManager={fileManager}
                      showUploadSection={true}
                      onUploadClick={() => console.log("Open upload modal")}
                    />
                  </div>
                ),
              },
              {
                key: "timeline",
                label: (
                  <span>
                    <HistoryOutlined className="mr-1" />
                    Timeline
                  </span>
                ),
                children: (
                  <div className="py-4">
                    <Timeline mode="left">
                      <Timeline.Item
                        color="green"
                        label={formatDate(task?.dateCreated)}>
                        <Text strong>Task Created</Text>
                        <br />
                        <Text type="secondary">
                          by {task?.createdBy?.firstName}{" "}
                          {task?.createdBy?.lastName}
                        </Text>
                      </Timeline.Item>

                      {task?.startDate && (
                        <Timeline.Item
                          color="blue"
                          label={formatDate(task?.startDate)}>
                          <Text strong>Started</Text>
                          <br />
                          <Text type="secondary">Scheduled start date</Text>
                        </Timeline.Item>
                      )}

                      {task?.taskResponses?.map((response, index) => (
                        <Timeline.Item
                          key={index}
                          color="orange"
                          label={formatDate(response.submittedAt)}>
                          <Text strong>Response Submitted</Text>
                          <br />
                          <Text type="secondary">
                            by {response.submittedBy?.firstName}{" "}
                            {response.submittedBy?.lastName}
                          </Text>
                          <br />
                          <Text type="secondary">
                            Status: {response.status}
                          </Text>
                        </Timeline.Item>
                      ))}

                      {task?.status === "under-review" &&
                        task?.submittedForReviewAt && (
                          <Timeline.Item
                            color="orange"
                            label={formatDate(task.submittedForReviewAt)}>
                            <Text strong>Submitted for Review</Text>
                            <br />
                            <Text type="secondary">Awaiting approval</Text>
                          </Timeline.Item>
                        )}

                      {task?.reviewedAt && (
                        <Timeline.Item
                          color={task?.status === "completed" ? "green" : "red"}
                          label={formatDate(task.reviewedAt)}>
                          <Text strong>
                            {task?.status === "completed"
                              ? "Approved"
                              : "Returned for Revision"}
                          </Text>
                          <br />
                          <Text type="secondary">
                            by {task?.reviewedBy?.firstName || "Reviewer"}
                          </Text>
                          {task?.reviewComment && (
                            <>
                              <br />
                              <Text type="secondary">
                                Feedback: {task.reviewComment}
                              </Text>
                            </>
                          )}
                        </Timeline.Item>
                      )}

                      {task?.actualCompletionDate && (
                        <Timeline.Item
                          color="green"
                          label={formatDate(task?.actualCompletionDate)}>
                          <Text strong>Completed</Text>
                          <br />
                          <Text type="secondary">Task marked as completed</Text>
                        </Timeline.Item>
                      )}

                      {timeMetrics.isOverdue && (
                        <Timeline.Item
                          color="red"
                          label={formatDate(task?.dueDate)}>
                          <Text strong>Overdue</Text>
                          <br />
                          <Text type="secondary">Missed deadline</Text>
                        </Timeline.Item>
                      )}
                    </Timeline>
                  </div>
                ),
              },
            ]}
          />

          {/* Advanced Information (Collapsed) */}
          <Collapse ghost className="mt-6">
            <Panel
              header={
                <Space>
                  <ToolOutlined />
                  <Text strong>Advanced Information</Text>
                </Space>
              }
              key="advanced">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="Recurrence Settings">
                    {task?.recurrence?.pattern &&
                    task.recurrence.pattern !== "none" ? (
                      <Space direction="vertical">
                        <Text>Pattern: {task.recurrence.pattern}</Text>
                        {task.recurrence.endAfter && (
                          <Text>
                            Ends: {formatDate(task.recurrence.endAfter)}
                          </Text>
                        )}
                        {task.recurrence.occurrences && (
                          <Text>
                            Occurrences: {task.recurrence.occurrences}
                          </Text>
                        )}
                      </Space>
                    ) : (
                      <Text type="secondary">No recurrence set</Text>
                    )}
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="Template Information">
                    {task?.isTemplate ? (
                      <Space direction="vertical">
                        <Text>
                          Template Name:{" "}
                          {task.templateName || "Untitled Template"}
                        </Text>
                        <Tag color="purple">Saved as Template</Tag>
                      </Space>
                    ) : (
                      <Text type="secondary">Not saved as template</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </Panel>
          </Collapse>

          {/* Reminders Section */}
          {task?.reminders && task.reminders.length > 0 && (
            <div className="mt-6">
              <Divider orientation="left">
                <MailOutlined className="mr-2" />
                Reminders
              </Divider>
              <div className="space-y-3">
                {task.reminders.map((reminder, index) => (
                  <Alert
                    key={index}
                    message={`Reminder: ${reminder.message}`}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>
                          Scheduled for: {formatDate(reminder.scheduledFor)}
                        </Text>
                        <Text type="secondary">
                          Sent by: {reminder.sender?.firstName}{" "}
                          {reminder.sender?.lastName}
                        </Text>
                        {reminder.isSent && (
                          <Text type="secondary">
                            Sent on: {formatDate(reminder.sentAt)}
                          </Text>
                        )}
                      </Space>
                    }
                    type={reminder.isSent ? "success" : "warning"}
                    showIcon
                    size="small"
                  />
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TaskDetails;
