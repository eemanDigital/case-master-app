import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Tag,
  Space,
  Tabs,
  Row,
  Col,
  Collapse,
  Timeline,
  Avatar,
  Progress,
  Button,
  Dropdown,
  FloatButton,
  Badge,
  Statistic,
  Flex,
  Divider,
  Grid,
} from "antd";
import {
  CalendarOutlined,
  FlagOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  PaperClipOutlined,
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
  FieldTimeOutlined,
  StopOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  MoreOutlined,
  EditOutlined,
  ShareAltOutlined,
  BellOutlined,
  // CalendarGoalOutlined,
  ThunderboltOutlined,
  // TrophyOutlined,
  RiseOutlined,
  EyeOutlined,
  // DollarOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import TaskResponseForm from "../components/TaskResponseForm";
import moment from "moment";
import TaskResponse from "../components/TaskResponse";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import AddEventToCalender from "../components/AddEventToCalender";
import TaskFileUploader from "../components/TaskFileUploader";
import useFileManager from "../hooks/useFileManager";
import TaskAttachmentsCard from "../components/TaskAttachmentsCard ";

import TaskReviewActions from "../components/tasks/TaskReviewActions";
import TaskStatusTracker from "../components/tasks/TaskStatusTracker";
import AssigneesSection from "../components/tasks/AssigneesSection";

import TaskEditModal from "../components/tasks/TaskEditModal";
import ReminderManager from "../components/tasks/ReminderManager";
import DependencyManager from "../components/tasks/DependencyManager";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
// const { Panel } = Collapse;

const getPriorityConfig = (priority) => {
  const configs = {
    urgent: {
      color: "#ef4444",
      bg: "#fef2f2",
      text: "URGENT",
      icon: <FlagOutlined />,
      severity: "critical",
    },
    high: {
      color: "#f97316",
      bg: "#fff7ed",
      text: "HIGH",
      icon: <FlagOutlined />,
      severity: "high",
    },
    medium: {
      color: "#3b82f6",
      bg: "#eff6ff",
      text: "MEDIUM",
      icon: <FlagOutlined />,
      severity: "medium",
    },
    low: {
      color: "#22c55e",
      bg: "#f0fdf4",
      text: "LOW",
      icon: <FlagOutlined />,
      severity: "low",
    },
  };
  return configs[priority?.toLowerCase()] || configs.medium;
};

const getStatusConfig = (status, isOverdue) => {
  if (isOverdue) {
    return {
      color: "#ef4444",
      bg: "#fef2f2",
      icon: <ClockCircleOutlined />,
      text: "OVERDUE",
      gradient: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    };
  }

  const configs = {
    completed: {
      color: "#22c55e",
      bg: "#f0fdf4",
      icon: <CheckCircleOutlined />,
      text: "COMPLETED",
      gradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    },
    "in-progress": {
      color: "#3b82f6",
      bg: "#eff6ff",
      icon: <SyncOutlined spin />,
      text: "IN PROGRESS",
      gradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    },
    "under-review": {
      color: "#f59e0b",
      bg: "#fffbeb",
      icon: <FileSearchOutlined />,
      text: "UNDER REVIEW",
      gradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    },
    pending: {
      color: "#6b7280",
      bg: "#f9fafb",
      icon: <ClockCircleOutlined />,
      text: "PENDING",
      gradient: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
    },
    rejected: {
      color: "#ef4444",
      bg: "#fef2f2",
      icon: <ExclamationCircleOutlined />,
      text: "NEEDS REVISION",
      gradient: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    },
    cancelled: {
      color: "#9ca3af",
      bg: "#f9fafb",
      icon: <StopOutlined />,
      text: "CANCELLED",
      gradient: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
    },
    overdue: {
      color: "#ef4444",
      bg: "#fef2f2",
      icon: <ClockCircleOutlined />,
      text: "OVERDUE",
      gradient: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    },
  };

  return configs[status?.toLowerCase()] || configs.pending;
};

const getCategoryConfig = (category) => {
  const configs = {
    "legal-research": {
      color: "#8b5cf6",
      icon: <FileTextOutlined />,
      label: "Legal Research",
    },
    "document-drafting": {
      color: "#3b82f6",
      icon: <FileTextOutlined />,
      label: "Document Drafting",
    },
    "client-meeting": {
      color: "#10b981",
      icon: <TeamOutlined />,
      label: "Client Meeting",
    },
    "court-filing": {
      color: "#ef4444",
      icon: <FolderOpenOutlined />,
      label: "Court Filing",
    },
    discovery: { color: "#f59e0b", icon: <EyeOutlined />, label: "Discovery" },
    correspondence: {
      color: "#06b6d4",
      icon: <MailOutlined />,
      label: "Correspondence",
    },
    administrative: {
      color: "#6b7280",
      icon: <SettingOutlined />,
      label: "Administrative",
    },
    other: { color: "#9ca3af", icon: <ToolOutlined />, label: "Other" },
  };
  return configs[category] || configs.other;
};

const TaskDetails = () => {
  const { dataFetcher, data, loading, error: dataError } = useDataFetch();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const task = data?.data;
  const currentUser = user?._id || user?.data?._id;
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
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
          assignee.user?._id === currentUser || assignee.user === currentUser,
      ),
    [task, currentUser],
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
      100,
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
  if (dataError)
    return (
      <PageErrorAlert errorCondition={dataError} errorMessage={dataError} />
    );

  const statusConfig = getStatusConfig(task?.status, timeMetrics.isOverdue);
  const priorityConfig = getPriorityConfig(task?.taskPriority);
  const categoryConfig = getCategoryConfig(task?.category);

  const calculateOverallProgress = () => {
    if (!task?.taskResponses || task.taskResponses.length === 0) return 0;
    const totalProgress = task.taskResponses.reduce(
      (sum, response) => sum + (response.completionPercentage || 0),
      0,
    );
    return Math.round(totalProgress / task.taskResponses.length);
  };

  const overallProgress = calculateOverallProgress();

  const getTotalTimeSpent = () => {
    if (!task?.taskResponses || task.taskResponses.length === 0) return 0;
    return task.taskResponses.reduce(
      (sum, response) => sum + (response.timeSpent || 0),
      0,
    );
  };

  const totalTimeSpent = getTotalTimeSpent();
  const totalTimeSpentHours = Math.round(totalTimeSpent / 60);
  const estimatedEffortHours = task?.estimatedEffort || 0;
  const timeUtilization =
    estimatedEffortHours > 0
      ? Math.round((totalTimeSpentHours / estimatedEffortHours) * 100)
      : 0;

  const taskMetrics = [
    {
      icon: <FieldTimeOutlined />,
      label: "Time Spent",
      value: `${totalTimeSpentHours}h`,
      subValue: totalTimeSpent > 0 ? `${totalTimeSpent} min` : "Not tracked",
      color: "#3b82f6",
    },
    {
      icon: <ScheduleOutlined />,
      label: "Estimated",
      value: `${estimatedEffortHours}h`,
      subValue: "Planned",
      color: "#10b981",
    },
    {
      icon: <RiseOutlined />,
      label: "Utilization",
      value: `${timeUtilization}%`,
      subValue: "of estimate",
      color:
        timeUtilization > 100
          ? "#ef4444"
          : timeUtilization > 80
            ? "#f59e0b"
            : "#10b981",
    },
    {
      icon: <ThunderboltOutlined />,
      label: "Responses",
      value: task?.taskResponses?.length || 0,
      subValue: "submitted",
      color: "#8b5cf6",
    },
  ];

  const actionButtons = (
    <Space
      direction={screens.xs ? "vertical" : "horizontal"}
      size="small"
      className="w-full">
      <TaskReviewActions
        task={task}
        userId={currentUser}
        onStatusChange={refreshTask}
        onReviewComplete={refreshTask}
        screens={screens}
      />
      <TaskFileUploader
        taskId={task?._id}
        uploadType="reference"
        buttonText={screens.xs ? "Ref" : "Reference Docs"}
        buttonProps={{
          type: "default",
          icon: <PaperClipOutlined />,
          size: screens.xs ? "small" : "middle",
        }}
        onUploadSuccess={refreshTask}
      />
      <AddEventToCalender
        title={`Task: ${task?.title}`}
        description={`${task?.description || task?.instruction}\n\nPriority: ${task?.taskPriority}\nCategory: ${task?.category}`}
        startDate={task?.startDate || task?.dateCreated}
        endDate={task?.dueDate}
        buttonProps={{ size: screens.xs ? "small" : "middle" }}
      />
    </Space>
  );

  const QuickActionMenu = (
    <Card size="small" className="shadow-xl border-0" style={{ minWidth: 180 }}>
      <Space direction="vertical" className="w-full" size={0}>
        <Button
          type="text"
          icon={<EditOutlined />}
          block
          className="justify-start"
          onClick={() => setEditModalOpen(true)}>
          Edit Task
        </Button>
        <Button
          type="text"
          icon={<ShareAltOutlined />}
          block
          className="justify-start">
          Share
        </Button>
        <Button
          type="text"
          icon={<BellOutlined />}
          block
          className="justify-start">
          Set Reminder
        </Button>
        <Button
          type="text"
          // icon={<CalendarGoalOutlined />}
          block
          className="justify-start">
          Add to Calendar
        </Button>
      </Space>
    </Card>
  );

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
      }}>
      <div className="container mx-auto py-6 px-4 max-w-[1600px]">
        {/* Premium Header Card */}
        <Card
          className="mb-6 shadow-xl border-0 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: 16,
          }}
          bodyStyle={{ padding: screens.xs ? 16 : 24 }}>
          {/* Status Bar */}
          <Flex
            justify="space-between"
            align="center"
            wrap="gap"
            className="mb-4">
            <Space wrap>
              {task?.matter && (
                <Tag
                  icon={<FileTextOutlined />}
                  style={{
                    background: "#f0fdf4",
                    color: "#16a34a",
                    border: "none",
                    borderRadius: 8,
                    padding: "4px 12px",
                    fontWeight: 600,
                  }}>
                  {task.matter?.title || task.matter?.matterNumber || "Matter"}
                </Tag>
              )}
              <Tag
                icon={statusConfig.icon}
                style={{
                  background: statusConfig.bg,
                  color: statusConfig.color,
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontWeight: 600,
                }}>
                {statusConfig.text}
              </Tag>
              <Tag
                icon={priorityConfig.icon}
                style={{
                  background: priorityConfig.bg,
                  color: priorityConfig.color,
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontWeight: 600,
                }}>
                {priorityConfig.text}
              </Tag>
              <Tag
                icon={categoryConfig.icon}
                style={{
                  background: `${categoryConfig.color}15`,
                  color: categoryConfig.color,
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontWeight: 600,
                }}>
                {categoryConfig.label}
              </Tag>
            </Space>
            <Dropdown
              overlay={QuickActionMenu}
              trigger={["click"]}
              placement="bottomRight">
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="rounded-lg"
              />
            </Dropdown>
          </Flex>

          {/* Title & Description */}
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={16}>
              <Title
                level={screens.xs ? 3 : 2}
                className="!mb-2"
                style={{ color: "#1e293b", fontWeight: 700 }}>
                {task?.title}
              </Title>
              <Paragraph ellipsis={{ rows: 2 }} className="!mb-0 text-gray-500">
                {task?.description || task?.instruction}
              </Paragraph>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                size="small"
                className="h-full"
                style={{
                  background:
                    "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  border: "none",
                  borderRadius: 12,
                }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={<span className="text-gray-500">Progress</span>}
                      value={overallProgress}
                      suffix="%"
                      valueStyle={{ color: "#0ea5e9", fontWeight: 700 }}
                    />
                    <Progress
                      percent={overallProgress}
                      showInfo={false}
                      strokeColor="#0ea5e9"
                      size="small"
                      className="!mt-2"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<span className="text-gray-500">Time Left</span>}
                      value={
                        timeMetrics.isOverdue
                          ? timeMetrics.daysUntilDue
                          : timeMetrics.daysRemaining
                      }
                      suffix={
                        timeMetrics.isOverdue ? "days overdue" : "days left"
                      }
                      valueStyle={{
                        color: timeMetrics.isOverdue ? "#ef4444" : "#10b981",
                        fontWeight: 700,
                      }}
                    />
                    <Text type="secondary" className="text-xs">
                      Due: {formatDate(task?.dueDate)}
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Creator & Assignees */}
          <Divider className="!my-4" />

          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Avatar
                  src={task?.createdBy?.photo}
                  size={36}
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  }}>
                  {task?.createdBy?.firstName?.[0]}
                  {task?.createdBy?.lastName?.[0]}
                </Avatar>
                <div>
                  <Text type="secondary" className="text-xs block">
                    Created By
                  </Text>
                  <Text strong className="text-sm">
                    {task?.createdBy?.firstName} {task?.createdBy?.lastName}
                  </Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <div className="flex -space-x-2">
                  {task?.assignees?.slice(0, 3).map((assignee, i) => (
                    <Avatar
                      key={i}
                      src={assignee.user?.photo}
                      size={36}
                      style={{
                        border: "2px solid white",
                        background:
                          assignee.role === "primary"
                            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      }}>
                      {assignee.user?.firstName?.[0]}
                    </Avatar>
                  ))}
                  {task?.assignees?.length > 3 && (
                    <Avatar
                      size={36}
                      style={{
                        background: "#64748b",
                        border: "2px solid white",
                      }}>
                      +{task.assignees.length - 3}
                    </Avatar>
                  )}
                </div>
                <div>
                  <Text type="secondary" className="text-xs block">
                    Team
                  </Text>
                  <Text strong className="text-sm">
                    {task?.assignees?.length || 0} Assigned
                  </Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Flex justify="flex-end" gap={8} wrap>
                {actionButtons}
              </Flex>
            </Col>
          </Row>
        </Card>

        {/* Metrics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          {taskMetrics.map((metric, idx) => (
            <Col xs={12} sm={6} key={idx}>
              <Card
                className="shadow-lg border-0 hover:shadow-xl transition-all duration-300"
                style={{
                  borderRadius: 12,
                  background: "white",
                  transform: "translateY(0)",
                }}
                hoverable>
                <Flex align="center" gap={12}>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${metric.color}15`,
                      color: metric.color,
                    }}>
                    {metric.icon}
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs">
                      {metric.label}
                    </Text>
                    <Title
                      level={4}
                      className="!mb-0"
                      style={{ color: metric.color }}>
                      {metric.value}
                    </Title>
                    <Text type="secondary" className="text-xs">
                      {metric.subValue}
                    </Text>
                  </div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Status Tracker */}
        <Card className="mb-6 shadow-lg border-0" style={{ borderRadius: 12 }}>
          <TaskStatusTracker
            task={task}
            userId={currentUser}
            onStatusChange={refreshTask}
          />
        </Card>

        {/* Main Content Tabs */}
        <Card
          className="shadow-lg border-0"
          style={{
            borderRadius: 12,
            background: "white",
          }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size={screens.xs ? "small" : "middle"}
            items={[
              {
                key: "overview",
                label: (
                  <span>
                    <InfoCircleOutlined /> {screens.xs ? "" : "Overview"}
                  </span>
                ),
                children: (
                  <div className="py-4">
                    {isAssignedToCurrentUser && !isTaskCreator && (
                      <Card
                        size="small"
                        className="mb-6 border-0"
                        style={{
                          background:
                            "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                          borderRadius: 12,
                        }}>
                        <TaskResponseForm
                          taskId={task?._id}
                          onResponseSubmitted={handleTaskResponse}
                        />
                      </Card>
                    )}

                    <Row gutter={[16, 16]} className="mb-6">
                      <Col xs={24} sm={12} lg={6}>
                        <Card
                          size="small"
                          className="h-full"
                          style={{ borderRadius: 10 }}>
                          <Flex vertical gap={8}>
                            <Space>
                              <CalendarOutlined className="text-blue-500" />
                              <Text type="secondary">Created</Text>
                            </Space>
                            <Text strong>{formatDate(task?.dateCreated)}</Text>
                          </Flex>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Card
                          size="small"
                          className="h-full"
                          style={{ borderRadius: 10 }}>
                          <Flex vertical gap={8}>
                            <Space>
                              <ScheduleOutlined className="text-green-500" />
                              <Text type="secondary">Start Date</Text>
                            </Space>
                            <Text strong>
                              {task?.startDate
                                ? formatDate(task?.startDate)
                                : "Not set"}
                            </Text>
                          </Flex>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Card
                          size="small"
                          className="h-full"
                          style={{
                            borderRadius: 10,
                            background: timeMetrics.isOverdue
                              ? "#fef2f2"
                              : "#f0fdf4",
                          }}>
                          <Flex vertical gap={8}>
                            <Space>
                              <ClockCircleOutlined
                                className={
                                  timeMetrics.isOverdue
                                    ? "text-red-500"
                                    : "text-orange-500"
                                }
                              />
                              <Text type="secondary">Due Date</Text>
                            </Space>
                            <Text strong>{formatDate(task?.dueDate)}</Text>
                            <Tag
                              color={timeMetrics.isOverdue ? "red" : "green"}
                              className="self-start">
                              {timeMetrics.isOverdue
                                ? `${timeMetrics.daysUntilDue} days overdue`
                                : `${timeMetrics.daysRemaining} days left`}
                            </Tag>
                          </Flex>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Card
                          size="small"
                          className="h-full"
                          style={{ borderRadius: 10 }}>
                          <Flex vertical gap={8}>
                            <Space>
                              <CheckSquareOutlined className="text-purple-500" />
                              <Text type="secondary">Completion</Text>
                            </Space>
                            <Text strong>
                              {task?.actualCompletionDate
                                ? formatDate(task?.actualCompletionDate)
                                : "Not completed"}
                            </Text>
                          </Flex>
                        </Card>
                      </Col>
                    </Row>

                    <Collapse
                      ghost
                      className="mb-6"
                      items={[
                        {
                          key: "instructions",
                          label: (
                            <Space>
                              <FileTextOutlined />
                              <Text strong>Instructions</Text>
                            </Space>
                          ),
                          children: (
                            <Card size="small" style={{ borderRadius: 10 }}>
                              <Paragraph className="whitespace-pre-wrap !mb-0">
                                {task?.instruction ||
                                  "No instructions provided"}
                              </Paragraph>
                            </Card>
                          ),
                        },
                      ]}
                    />

                    <AssigneesSection
                      task={task}
                      currentUser={currentUser}
                      screens={screens}
                    />

                    {task?.matter && (
                      <Collapse
                        ghost
                        className="mb-6"
                        items={[
                          {
                            key: "matter",
                            label: (
                              <Space>
                                <FileTextOutlined />
                                <Text strong>Related Matter</Text>
                              </Space>
                            ),
                            children: (
                              <Card size="small" style={{ borderRadius: 10 }}>
                                <Space direction="vertical" className="w-full">
                                  <Text strong>
                                    {task.matter.title || task.matter.matterNumber || "Matter"}
                                  </Text>
                                  <Text type="secondary">
                                    {task.matter.matterType}
                                  </Text>
                                  {task.matter.client && (
                                    <Text type="secondary">
                                      Client: {task.matter.client.firstName} {task.matter.client.lastName}
                                    </Text>
                                  )}
                                </Space>
                              </Card>
                            ),
                          },
                        ]}
                      />
                    )}

                    {task?.tags?.length > 0 && (
                      <Collapse
                        ghost
                        className="mb-6"
                        items={[
                          {
                            key: "tags",
                            label: (
                              <Space>
                                <TagOutlined />
                                <Text strong>Tags</Text>
                                <Tag>{task.tags.length}</Tag>
                              </Space>
                            ),
                            children: (
                              <Space wrap>
                                {task.tags.map((tag, index) => (
                                  <Tag
                                    key={index}
                                    color="blue"
                                    icon={<TagOutlined />}
                                    className="rounded-lg">
                                    {tag}
                                  </Tag>
                                ))}
                              </Space>
                            ),
                          },
                        ]}
                      />
                    )}

                    <Collapse
                      ghost
                      className="mb-6"
                      items={[
                        {
                          key: "dependencies",
                          label: (
                            <Space>
                              <LinkOutlined />
                              <Text strong>Dependencies</Text>
                            </Space>
                          ),
                          children: (
                            <DependencyManager
                              taskId={task?._id}
                              onSuccess={refreshTask}
                            />
                          ),
                        },
                      ]}
                    />

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
                  <Badge
                    count={fileManager.statistics.totalFiles}
                    offset={[8, -8]}
                    size="small">
                    <span>
                      <FileDoneOutlined /> {screens.xs ? "" : "Documents"}
                    </span>
                  </Badge>
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
                    <HistoryOutlined /> {screens.xs ? "" : "Timeline"}
                  </span>
                ),
                children: (
                  <div className="py-4">
                    <Timeline
                      mode="left"
                      items={[
                        {
                          color: "green",
                          label: formatDate(task?.dateCreated),
                          children: (
                            <>
                              <Text strong>Task Created</Text>
                              <br />
                              <Text type="secondary">
                                by {task?.createdBy?.firstName}{" "}
                                {task?.createdBy?.lastName}
                              </Text>
                            </>
                          ),
                        },
                        ...(task?.startDate
                          ? [
                              {
                                color: "blue",
                                label: formatDate(task?.startDate),
                                children: (
                                  <>
                                    <Text strong>Started</Text>
                                    <br />
                                    <Text type="secondary">
                                      Scheduled start date
                                    </Text>
                                  </>
                                ),
                              },
                            ]
                          : []),
                        ...(task?.taskResponses?.map((response, index) => ({
                          color: "orange",
                          label: formatDate(response.submittedAt),
                          children: (
                            <>
                              <Text strong>Response Submitted</Text>
                              <br />
                              <Text type="secondary">
                                by {response.submittedBy?.firstName}{" "}
                                {response.submittedBy?.lastName}
                              </Text>
                              <br />
                              <Tag>{response.status}</Tag>
                            </>
                          ),
                        })) || []),
                        ...(task?.status === "under-review" &&
                        task?.submittedForReviewAt
                          ? [
                              {
                                color: "orange",
                                label: formatDate(task.submittedForReviewAt),
                                children: (
                                  <>
                                    <Text strong>Submitted for Review</Text>
                                    <br />
                                    <Text type="secondary">
                                      Awaiting approval
                                    </Text>
                                  </>
                                ),
                              },
                            ]
                          : []),
                        ...(task?.reviewedAt
                          ? [
                              {
                                color:
                                  task?.status === "completed"
                                    ? "green"
                                    : "red",
                                label: formatDate(task.reviewedAt),
                                children: (
                                  <>
                                    <Text strong>
                                      {task?.status === "completed"
                                        ? "Approved"
                                        : "Returned for Revision"}
                                    </Text>
                                    <br />
                                    <Text type="secondary">
                                      by{" "}
                                      {task?.reviewedBy?.firstName ||
                                        "Reviewer"}
                                    </Text>
                                    {task?.reviewComment && (
                                      <>
                                        <br />
                                        <Text type="secondary">
                                          Feedback: {task.reviewComment}
                                        </Text>
                                      </>
                                    )}
                                  </>
                                ),
                              },
                            ]
                          : []),
                        ...(task?.actualCompletionDate
                          ? [
                              {
                                color: "green",
                                label: formatDate(task?.actualCompletionDate),
                                children: (
                                  <>
                                    <Text strong>Completed</Text>
                                    <br />
                                    <Text type="secondary">
                                      Task marked as completed
                                    </Text>
                                  </>
                                ),
                              },
                            ]
                          : []),
                        ...(timeMetrics.isOverdue
                          ? [
                              {
                                color: "red",
                                label: formatDate(task?.dueDate),
                                children: (
                                  <>
                                    <Text strong>Overdue</Text>
                                    <br />
                                    <Text type="secondary">
                                      Missed deadline
                                    </Text>
                                  </>
                                ),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                ),
              },
            ]}
          />

          <Collapse
            ghost
            className="mt-6"
            items={[
              {
                key: "advanced",
                label: (
                  <Space>
                    <ToolOutlined />
                    <Text strong>Advanced Information</Text>
                  </Space>
                ),
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card
                        size="small"
                        title="Recurrence Settings"
                        style={{ borderRadius: 10 }}>
                        {task?.recurrence?.pattern &&
                        task.recurrence.pattern !== "none" ? (
                          <Space direction="vertical">
                            <Text>
                              Pattern: <Tag>{task.recurrence.pattern}</Tag>
                            </Text>
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
                      <Card
                        size="small"
                        title="Template Information"
                        style={{ borderRadius: 10 }}>
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
                ),
              },
              {
                key: "reminders",
                label: (
                  <Space>
                    <MailOutlined />
                    <Text strong>Reminders</Text>
                  </Space>
                ),
                children: (
                  <ReminderManager taskId={task?._id} onSuccess={refreshTask} />
                ),
              },
            ]}
          />
        </Card>

        {/* Floating Edit Button */}
        <FloatButton
          type="primary"
          icon={<EditOutlined />}
          style={{ right: 24, bottom: 24 }}
          tooltip="Edit Task"
          onClick={() => setEditModalOpen(true)}
        />

        {/* Edit Task Modal */}
        <TaskEditModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          task={task}
          onSuccess={refreshTask}
        />
      </div>
    </div>
  );
};

export default TaskDetails;
