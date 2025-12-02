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
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

const TaskDetails = () => {
  const { dataFetcher, data, loading, error: dataError } = useDataFetch();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const task = data?.data;
  const currentUser = user?.data?._id;
  // const assignedById = task?.assignedBy?._id;
  // const isAssignedBy = currentUser === assignedById;
  // Calculate if current user is the task creator
  const isAssignedBy = task?.createdBy?._id === user?.data?._id;
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const screens = useBreakpoint();

  // Use the new useFileManager hook
  const fileManager = useFileManager("Task", id, {
    enableNotifications: true,
    autoFetch: true,
  });

  useRedirectLogoutUser("/users/login");

  const isAssignedToCurrentUser = useMemo(
    () =>
      task?.assignees?.some((assignee) => assignee.user?._id === currentUser) ||
      task?.assignedTo?.some((staff) => staff._id === currentUser),
    [task, currentUser]
  );

  const isAssignedToCurrentClientUser = useMemo(
    () => task?.assignedToClient?._id === currentUser,
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
      urgent: { color: "red", text: "URGENT" },
      high: { color: "orange", text: "HIGH" },
      medium: { color: "blue", text: "MEDIUM" },
      low: { color: "green", text: "LOW" },
    };
    return (
      configs[priority?.toLowerCase()] || { color: "blue", text: "MEDIUM" }
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
        icon: <ClockCircleOutlined />,
        text: "CANCELLED",
        badge: "default",
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

  const getRoleColor = (role) => {
    const colors = {
      primary: "gold",
      collaborator: "blue",
      reviewer: "purple",
      viewer: "green",
    };
    return colors[role] || "default";
  };

  // Calculate time metrics
  const timeMetrics = useMemo(() => {
    if (!task) return {};

    const dueDate = moment(task.dueDate);
    const today = moment();
    const daysRemaining = dueDate.diff(today, "days");
    const isOverdue = daysRemaining < 0;
    const daysUntilDue = Math.abs(daysRemaining);

    return { dueDate, today, daysRemaining, isOverdue, daysUntilDue };
  }, [task]);

  if (loading) return <LoadingSpinner />;
  if (dataError) {
    return (
      <PageErrorAlert errorCondition={dataError} errorMessage={dataError} />
    );
  }

  const createEventTitle = `Official Task: ${task?.title}`;
  const createEventDescription = `Task Description: ${task?.instruction}`;
  const statusConfig = getStatusConfig(task?.status, timeMetrics.isOverdue);
  const priorityConfig = getPriorityConfig(task?.taskPriority);

  // Mobile-friendly detail item
  const DetailItem = ({ icon, label, value, span = 1 }) => (
    <Col xs={24} sm={12} lg={span === 2 ? 12 : 8} xl={span === 2 ? 12 : 6}>
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg h-full">
        <span className="text-blue-500 mt-1">{icon}</span>
        <div className="flex-1 min-w-0">
          <Text strong className="text-xs text-gray-500 block mb-1">
            {label}
          </Text>
          <Text className="text-sm block">{value || "N/A"}</Text>
        </div>
      </div>
    </Col>
  );

  // Action buttons dropdown for mobile
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
      {(isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
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
        title={createEventTitle}
        description={createEventDescription}
        startDate={task?.dateAssigned}
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

              <Title
                level={screens.xs ? 3 : 2}
                className="m-0 mb-2 line-clamp-2 break-words">
                {task?.title}
              </Title>

              <Space wrap size={[8, 8]} className="mb-3">
                <Badge
                  status={statusConfig.badge}
                  text={
                    <Text strong className="text-sm">
                      {statusConfig.icon} {statusConfig.text}
                    </Text>
                  }
                />
                <Tag color={priorityConfig.color} className="text-xs">
                  {priorityConfig.text} PRIORITY
                </Tag>
                {timeMetrics.isOverdue && (
                  <Tag color="red" className="text-xs">
                    OVERDUE
                  </Tag>
                )}
              </Space>

              {task?.description && (
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
                  className="text-gray-600 mb-0">
                  {task.description}
                </Paragraph>
              )}
            </div>

            {/* Action Buttons - Desktop */}
            {!screens.xs && (
              <div className="flex-shrink-0">{actionButtons}</div>
            )}
          </div>

          {/* Action Buttons - Mobile (full width) */}
          {screens.xs && <div className="mt-4">{actionButtons}</div>}

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <Text strong className="text-sm">
                Overall Progress
              </Text>
              <Text strong className="text-sm">
                {task?.overallProgress || 0}%
              </Text>
            </div>
            <Progress
              percent={task?.overallProgress || 0}
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
                  : task?.taskPriority === "urgent"
                  ? "#ff4d4f"
                  : task?.taskPriority === "high"
                  ? "#fa8c16"
                  : "#1890ff"
              }
              size={screens.xs ? "small" : "default"}
            />
          </div>
        </Card>

        {/* Quick Stats - Mobile Only */}
        {screens.xs && (
          <Row gutter={[8, 8]} className="mb-4">
            <Col span={8}>
              <Card size="small" className="text-center">
                <Statistic
                  value={fileManager.statistics.totalFiles}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ fontSize: "16px" }}
                />
                <div className="text-xs text-gray-500">Files</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center">
                <Statistic
                  value={task?.taskResponses?.length || 0}
                  prefix={<HistoryOutlined />}
                  valueStyle={{ fontSize: "16px" }}
                />
                <div className="text-xs text-gray-500">Responses</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center">
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: timeMetrics.isOverdue ? "#ff4d4f" : "#52c41a",
                  }}>
                  {timeMetrics.daysUntilDue}
                </div>
                <div className="text-xs text-gray-500">
                  {timeMetrics.isOverdue ? "Days Overdue" : "Days Left"}
                </div>
              </Card>
            </Col>
          </Row>
        )}

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
                    {(isAssignedToCurrentUser ||
                      isAssignedToCurrentClientUser) &&
                      !isAssignedBy && (
                        <Card size="small" className="mb-4">
                          <TaskResponseForm
                            taskId={task?._id}
                            onResponseSubmitted={handleTaskResponse}
                          />
                        </Card>
                      )}

                    <TaskResponse
                      task={task}
                      isAssignedToCurrentUser={isAssignedToCurrentUser}
                      isAssignedToCurrentClientUser={
                        isAssignedToCurrentClientUser
                      }
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
                key: "responses",
                label: (
                  <span>
                    <HistoryOutlined className="mr-1" />
                    {screens.xs ? "Activity" : "Responses & Activity"}
                    {task?.taskResponses?.length > 0 && (
                      <Badge
                        count={task.taskResponses.length}
                        offset={[8, -8]}
                        size="small"
                        style={{ backgroundColor: "#52c41a" }}
                      />
                    )}
                  </span>
                ),
                children: (
                  <div className="py-4">
                    {!isAssignedBy &&
                      (isAssignedToCurrentUser ||
                        isAssignedToCurrentClientUser) && (
                        <Card size="small" className="mb-4">
                          <TaskResponseForm
                            taskId={task?._id}
                            onResponseSubmitted={handleTaskResponse}
                          />
                        </Card>
                      )}
                    <TaskResponse
                      task={task}
                      isAssignedToCurrentUser={isAssignedToCurrentUser}
                      isAssignedToCurrentClientUser={
                        isAssignedToCurrentClientUser
                      }
                      onResponseUpdate={handleTaskResponse}
                    />
                  </div>
                ),
              },
            ]}
          />

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
