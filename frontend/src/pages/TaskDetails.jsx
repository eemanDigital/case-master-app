// components/TaskDetails.js
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Alert,
  Divider,
  Typography,
  Tag,
  Space,
  Button,
  Progress,
  Tabs,
  List,
  Badge,
  Tooltip,
  Row,
  Col,
  Grid,
  Dropdown,
  Statistic,
  Descriptions,
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
  DownloadOutlined,
  ReloadOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  MailOutlined,
  HistoryOutlined,
  FileDoneOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  FolderOpenOutlined,
  TagOutlined,
  LinkOutlined,
  ScheduleOutlined,
  FileSyncOutlined,
  ToolOutlined,
  DatabaseOutlined,
  NumberOutlined,
  FieldTimeOutlined,
  StopOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import TaskResponseForm from "../components/TaskResponseForm";
import moment from "moment";
import TaskResponse from "../components/TaskResponse";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import AddEventToCalender from "../components/AddEventToCalender";
import TaskFileUploader from "../components/TaskFileUploader";
import useFileManager from "../hooks/useFileManager";
import TaskAttachmentsCard from "../components/TaskAttachmentsCard ";

const { Title, Text, Paragraph } = Typography;

const { useBreakpoint } = Grid;
const { Panel } = Collapse;

const TaskDetails = () => {
  const { dataFetcher, data, loading, error: dataError } = useDataFetch();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const task = data?.data;
  const currentUser = user?.data?._id;
  const isAssignedBy = task?.createdBy?._id === currentUser;
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const screens = useBreakpoint();

  console.log("Task Data:", task);

  // Use the new useFileManager hook
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

  // Manual refresh function
  const refreshTask = () => {
    setRefreshTrigger((prev) => prev + 1);
    fileManager.refreshFiles();
  };

  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id, dataFetcher, refreshTrigger]);

  const handleUploadSuccess = () => {
    refreshTask();
  };

  const handleTaskResponse = () => {
    refreshTask();
  };

  // Status and priority configurations
  const getPriorityConfig = (priority) => {
    const configs = {
      urgent: { color: "red", text: "URGENT", icon: <FlagOutlined /> },
      high: { color: "orange", text: "HIGH", icon: <FlagOutlined /> },
      medium: { color: "blue", text: "MEDIUM", icon: <FlagOutlined /> },
      low: { color: "green", text: "LOW", icon: <FlagOutlined /> },
    };
    return (
      configs[priority?.toLowerCase()] || {
        color: "blue",
        text: "MEDIUM",
        icon: <FlagOutlined />,
      }
    );
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
        icon: <EyeOutlined />,
        text: "UNDER REVIEW",
        badge: "warning",
      },
      pending: {
        color: "default",
        icon: <ClockCircleOutlined />,
        text: "PENDING",
        badge: "default",
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

    return (
      configs[status?.toLowerCase()] || {
        color: "default",
        icon: <ClockCircleOutlined />,
        text: status,
        badge: "default",
      }
    );
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

  const getRoleConfig = (role) => {
    const configs = {
      primary: { color: "gold", label: "Primary", icon: <UserOutlined /> },
      collaborator: {
        color: "blue",
        label: "Collaborator",
        icon: <TeamOutlined />,
      },
      reviewer: { color: "purple", label: "Reviewer", icon: <EyeOutlined /> },
      viewer: { color: "green", label: "Viewer", icon: <UserOutlined /> },
    };
    return configs[role] || configs.collaborator;
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

  // Get all configurations
  const statusConfig = getStatusConfig(task?.status, timeMetrics.isOverdue);
  const priorityConfig = getPriorityConfig(task?.taskPriority);
  const categoryConfig = getCategoryConfig(task?.category);

  // Calculate overall progress from responses
  const calculateOverallProgress = () => {
    if (!task?.taskResponses || task.taskResponses.length === 0) return 0;

    const totalProgress = task.taskResponses.reduce((sum, response) => {
      return sum + (response.completionPercentage || 0);
    }, 0);

    return Math.round(totalProgress / task.taskResponses.length);
  };

  const overallProgress = calculateOverallProgress();

  // Get total time spent from responses
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

  // Mobile-friendly detail item
  const DetailItem = ({ icon, label, value, span = 1, children }) => (
    <Col xs={24} sm={12} lg={span === 2 ? 12 : 8} xl={span === 2 ? 12 : 6}>
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg h-full">
        <span className="text-blue-500 mt-1">{icon}</span>
        <div className="flex-1 min-w-0">
          <Text strong className="text-xs text-gray-500 block mb-1">
            {label}
          </Text>
          {children ? (
            children
          ) : (
            <Text className="text-sm block">{value || "N/A"}</Text>
          )}
        </div>
      </div>
    </Col>
  );

  // Action buttons
  const actionButtons = (
    <Space
      direction={screens.xs ? "vertical" : "horizontal"}
      size="small"
      className="w-full">
      {/* Reference Documents Upload */}
      <TaskFileUploader
        taskId={task?._id}
        uploadType="reference"
        buttonText={screens.xs ? "Reference" : "Add Reference Docs"}
        buttonProps={{
          type: "primary",
          icon: <PaperClipOutlined />,
          size: screens.xs ? "small" : "middle",
        }}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Response Documents Upload - Only for assignees */}
      {isAssignedToCurrentUser && (
        <TaskFileUploader
          taskId={task?._id}
          uploadType="response"
          buttonText={screens.xs ? "Response" : "Add Response Docs"}
          buttonProps={{
            type: "dashed",
            icon: <FileTextOutlined />,
            size: screens.xs ? "small" : "middle",
          }}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

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

  // Assignees by role
  const assigneesByRole = {
    primary: task?.assignees?.filter((a) => a.role === "primary") || [],
    collaborator:
      task?.assignees?.filter((a) => a.role === "collaborator") || [],
    reviewer: task?.assignees?.filter((a) => a.role === "reviewer") || [],
    viewer: task?.assignees?.filter((a) => a.role === "viewer") || [],
  };

  // Client assignees
  const clientAssignees = task?.assignees?.filter((a) => a.isClient) || [];
  const teamAssignees = task?.assignees?.filter((a) => !a.isClient) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        {/* Header Section */}
        <Card className="mb-6 shadow-sm border-0">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <GoBackButton />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refreshTask}
                  loading={loading}
                  size="small">
                  {screens.xs ? "" : "Refresh"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Tag icon={categoryConfig.icon} color={categoryConfig.color}>
                  {categoryConfig.label}
                </Tag>
                <Badge
                  status={statusConfig.badge}
                  text={
                    <Text strong className="text-sm">
                      {statusConfig.icon} {statusConfig.text}
                    </Text>
                  }
                />
                <Tag color={priorityConfig.color} className="text-xs">
                  {priorityConfig.icon} {priorityConfig.text} PRIORITY
                </Tag>
                {task?.isTemplate && (
                  <Tag color="purple" icon={<FileSyncOutlined />}>
                    Template
                  </Tag>
                )}
              </div>

              <Title
                level={screens.xs ? 3 : 2}
                className="m-0 mb-2 line-clamp-2 break-words">
                {task?.title}
              </Title>

              {task?.description && (
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
                  className="text-gray-600 mb-4">
                  {task.description}
                </Paragraph>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <Text strong className="text-sm">
                    Overall Progress
                  </Text>
                  <Text strong className="text-sm">
                    {overallProgress}%
                  </Text>
                </div>
                <Progress
                  percent={overallProgress}
                  status={
                    task?.status === "completed"
                      ? "success"
                      : timeMetrics.isOverdue
                      ? "exception"
                      : "active"
                  }
                  strokeColor={
                    task?.status === "completed"
                      ? "#52c41a"
                      : timeMetrics.isOverdue
                      ? "#ff4d4f"
                      : priorityConfig.color
                  }
                  size={screens.xs ? "small" : "default"}
                />
              </div>

              {/* Quick Stats */}
              <Row gutter={[8, 8]} className="mb-4">
                {taskMetrics.map((metric, index) => (
                  <Col xs={12} sm={6} key={index}>
                    <Card size="small" className="text-center h-full">
                      <div
                        className="text-xl font-semibold mb-1"
                        style={{ color: metric.color }}>
                        {metric.value}
                      </div>
                      <div className="text-xs text-gray-500">
                        {metric.label}
                      </div>
                      {metric.subValue && (
                        <div className="text-xs text-gray-400 mt-1">
                          {metric.subValue}
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Action Buttons - Desktop */}
            {!screens.xs && (
              <div className="flex-shrink-0">{actionButtons}</div>
            )}
          </div>

          {/* Action Buttons - Mobile (full width) */}
          {screens.xs && <div className="mt-4">{actionButtons}</div>}
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
                    {/* Show TaskResponseForm only to assignees who are NOT the task creator */}
                    {isAssignedToCurrentUser && !isAssignedBy && (
                      <Card size="small" className="mb-6">
                        <TaskResponseForm
                          taskId={task?._id}
                          onResponseSubmitted={handleTaskResponse}
                        />
                      </Card>
                    )}

                    {/* Task Details Grid */}
                    <Row gutter={[16, 16]} className="mb-6">
                      <DetailItem
                        icon={<CalendarOutlined />}
                        label="Date Created"
                        value={formatDate(task?.dateCreated)}
                      />
                      <DetailItem
                        icon={<ScheduleOutlined />}
                        label="Start Date"
                        value={
                          task?.startDate
                            ? formatDate(task?.startDate)
                            : "Not set"
                        }
                      />
                      <DetailItem
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
                      <DetailItem
                        icon={<CheckSquareOutlined />}
                        label="Actual Completion"
                        value={
                          task?.actualCompletionDate
                            ? formatDate(task?.actualCompletionDate)
                            : "Not completed"
                        }
                      />

                      <DetailItem
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
                      <DetailItem
                        icon={<LinkOutlined />}
                        label="Related Case(s)"
                        span={2}
                        children={
                          task?.caseToWorkOn?.length > 0 ? (
                            <Space direction="vertical" size={2}>
                              {task.caseToWorkOn.map((caseItem, index) => (
                                <Tag
                                  key={index}
                                  color="blue"
                                  icon={<FolderOpenOutlined />}>
                                  {caseItem.suitNo || caseItem._id}
                                </Tag>
                              ))}
                            </Space>
                          ) : task?.customCaseReference ? (
                            <Tag color="orange">{task.customCaseReference}</Tag>
                          ) : (
                            "No case linked"
                          )
                        }
                      />
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
                    <Collapse
                      ghost
                      className="mb-6"
                      defaultActiveKey={["assignees"]}>
                      <Panel
                        header={
                          <Space>
                            <TeamOutlined />
                            <Text strong>Assignees & Roles</Text>
                            <Badge
                              count={
                                teamAssignees.length + clientAssignees.length
                              }
                              style={{ backgroundColor: "#1890ff" }}
                            />
                          </Space>
                        }
                        key="assignees">
                        <Row gutter={[16, 16]}>
                          {/* Team Assignees */}
                          <Col xs={24} lg={12}>
                            <Card size="small" title="Team Members">
                              <List
                                size="small"
                                dataSource={teamAssignees}
                                renderItem={(assignee) => {
                                  const user = assignee.user;
                                  const roleConfig = getRoleConfig(
                                    assignee.role
                                  );
                                  return (
                                    <List.Item>
                                      <List.Item.Meta
                                        avatar={
                                          <Avatar
                                            size="small"
                                            src={user?.photo}>
                                            {user?.firstName?.[0]}
                                            {user?.lastName?.[0]}
                                          </Avatar>
                                        }
                                        title={
                                          <Space>
                                            <Text>
                                              {user?.firstName} {user?.lastName}
                                            </Text>
                                            <Tag
                                              size="small"
                                              color={roleConfig.color}
                                              icon={roleConfig.icon}>
                                              {roleConfig.label}
                                            </Tag>
                                          </Space>
                                        }
                                        description={
                                          <Space direction="vertical" size={0}>
                                            <Text type="secondary">
                                              {user?.position || user?.role}
                                            </Text>
                                            <Text
                                              type="secondary"
                                              className="text-xs">
                                              Assigned by:{" "}
                                              {assignee.assignedBy?.firstName ||
                                                "Unknown"}
                                            </Text>
                                          </Space>
                                        }
                                      />
                                    </List.Item>
                                  );
                                }}
                              />
                            </Card>
                          </Col>

                          {/* Client Assignees */}
                          {clientAssignees.length > 0 && (
                            <Col xs={24} lg={12}>
                              <Card size="small" title="Client Contacts">
                                <List
                                  size="small"
                                  dataSource={clientAssignees}
                                  renderItem={(assignee) => {
                                    const user = assignee.user;
                                    return (
                                      <List.Item>
                                        <List.Item.Meta
                                          avatar={
                                            <Avatar
                                              size="small"
                                              src={user?.photo}>
                                              {user?.firstName?.[0]}
                                              {user?.lastName?.[0]}
                                            </Avatar>
                                          }
                                          title={
                                            <Text>
                                              {user?.firstName} {user?.lastName}
                                            </Text>
                                          }
                                          description={
                                            <Space
                                              direction="vertical"
                                              size={0}>
                                              <Tag size="small" color="green">
                                                Client
                                              </Tag>
                                              <Text type="secondary">
                                                {user?.email}
                                              </Text>
                                            </Space>
                                          }
                                        />
                                      </List.Item>
                                    );
                                  }}
                                />
                              </Card>
                            </Col>
                          )}
                        </Row>
                      </Panel>
                    </Collapse>

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
