import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Alert,
  Divider,
  Typography,
  Tag,
  Space,
  Button,
  Badge,
  Avatar,
  Progress,
  Row,
  Col,
  Modal,
  Timeline,
  List,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  FlagOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import {
  ClipboardDocumentIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import TaskDocUpload from "./TaskDocUpload";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import useDeleteDocument from "../hooks/useDeleteDocument";
import TaskResponseForm from "../components/TaskResponseForm";
import moment from "moment";
import TaskResponse from "../components/TaskResponse";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import AddEventToCalender from "../components/AddEventToCalender";
import TaskReminderForm from "../components/TaskReminderForm";
import TaskQuickActions from "../components/TaskQuickActions";
import TaskAttachmentsCard from "../components/TaskAttachmentsCard ";

const { Title, Text } = Typography;

const TaskDetails = () => {
  const {
    dataFetcher,
    data,
    loading,
    error: dataError,
    refetch,
  } = useDataFetch();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const task = data?.data?.task;

  const { handleDeleteDocument, documents } = useDeleteDocument(
    task?.documents ? { documents: task?.documents } : null,
    id
  );

  const currentUser = user?.data?._id;
  const assignedById = task?.assignedBy?._id;
  const isAssignedBy = currentUser === assignedById;

  useRedirectLogoutUser("/users/login");

  const isAssignedToCurrentUser = task?.assignedTo?.some(
    (assignment) => assignment?.user?._id === currentUser
  );

  const canModifyTask = useMemo(() => {
    return isAssignedBy || ["super-admin", "admin"].includes(user?.data?.role);
  }, [isAssignedBy, user?.data?.role]);

  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id, dataFetcher]);

  // Enhanced status and priority handling
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "blue";
      case "low":
        return "green";
      default:
        return "default";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return <ExclamationCircleOutlined />;
      case "high":
        return <FlagOutlined />;
      case "medium":
        return <PlayCircleOutlined />;
      case "low":
        return <FlagOutlined />;
      default:
        return <FlagOutlined />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      research: "blue",
      drafting: "purple",
      filing: "cyan",
      hearing: "orange",
      "client-meeting": "green",
      discovery: "gold",
      other: "default",
    };
    return colors[category] || "default";
  };

  const getStatusConfig = (task) => {
    if (task?.status === "completed") {
      return {
        color: "success",
        text: "Completed",
        icon: <CheckCircleOutlined />,
      };
    }
    if (task?.status === "cancelled") {
      return {
        color: "default",
        text: "Cancelled",
        icon: <ExclamationCircleOutlined />,
      };
    }
    if (task?.status === "overdue") {
      return {
        color: "error",
        text: "Overdue",
        icon: <ExclamationCircleOutlined />,
      };
    }
    if (task?.status === "in-progress") {
      return {
        color: "processing",
        text: "In Progress",
        icon: <PlayCircleOutlined />,
      };
    }
    if (task?.status === "under-review") {
      return {
        color: "purple",
        text: "Under Review",
        icon: <EyeOutlined />,
      };
    }
    if (moment(task?.dueDate).diff(moment(), "days") <= 2) {
      return {
        color: "warning",
        text: "Due Soon",
        icon: <ClockCircleOutlined />,
      };
    }
    return { color: "default", text: "Pending", icon: <ClockCircleOutlined /> };
  };

  const statusConfig = useMemo(() => getStatusConfig(task), [task]);
  const isOverdue = useMemo(
    () =>
      task?.status !== "completed" && moment(task?.dueDate).isBefore(moment()),
    [task]
  );

  const daysUntilDue = useMemo(() => {
    if (!task?.dueDate) return null;
    return moment(task.dueDate).diff(moment(), "days");
  }, [task?.dueDate]);

  const handleDocumentPreview = (doc) => {
    setPreviewDocument(doc);
  };

  const handleDocumentDelete = async (documentId) => {
    const success = await handleDeleteDocument(documentId);
    if (success) {
      refetch();
    }
  };

  const handleTaskUpdate = () => {
    refetch();
  };

  // Calculate total time spent from responses
  const totalTimeSpent = useMemo(() => {
    if (!task?.responses) return 0;
    return task.responses.reduce(
      (total, response) => total + (response.timeSpent || 0),
      0
    );
  }, [task?.responses]);

  if (loading) return <LoadingSpinner />;
  if (dataError) {
    return (
      <PageErrorAlert errorCondition={dataError} errorMessage={dataError} />
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert
          message="Task Not Found"
          description="The requested task could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const createEventTitle = `Task: ${task?.title}`;
  const createEventDescription = `Task Description: ${
    task?.description || task?.instruction
  }\n\nPriority: ${task?.priority}\nCategory: ${
    task?.category
  }\nDue Date: ${formatDate(task?.dueDate)}`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-start gap-4 flex-1">
            <GoBackButton />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ClipboardDocumentIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <Title level={2} className="m-0 text-gray-900 mb-1">
                    {task?.title}
                  </Title>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Tag
                      color={statusConfig.color}
                      icon={statusConfig.icon}
                      className="text-sm font-semibold">
                      {statusConfig.text}
                    </Tag>
                    <Tag
                      color={getPriorityColor(task?.priority)}
                      icon={getPriorityIcon(task?.priority)}
                      className="text-sm font-semibold capitalize">
                      {task?.priority} Priority
                    </Tag>
                    <Tag
                      color={getCategoryColor(task?.category)}
                      className="text-sm font-semibold capitalize">
                      {task?.category?.replace("-", " ")}
                    </Tag>
                    <div className="flex items-center gap-2">
                      <Progress
                        percent={task.progress}
                        size="small"
                        style={{ width: 80 }}
                        showInfo={false}
                      />
                      <Text className="text-sm text-gray-600">
                        {task.progress}%
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress and Due Date Info */}
              <div className="flex items-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined
                    className={`text-sm ${
                      isOverdue ? "text-red-500" : "text-gray-500"
                    }`}
                  />
                  <Text
                    className={`text-sm ${
                      isOverdue ? "text-red-600 font-medium" : "text-gray-600"
                    }`}>
                    Due: {formatDate(task?.dueDate)}
                    {daysUntilDue !== null && (
                      <span className="ml-1">
                        (
                        {daysUntilDue > 0
                          ? `${daysUntilDue} days left`
                          : daysUntilDue === 0
                          ? "Due today"
                          : "Overdue"}
                        )
                      </span>
                    )}
                  </Text>
                </div>

                {totalTimeSpent > 0 && (
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined className="text-gray-500" />
                    <Text className="text-sm text-gray-600">
                      {Math.floor(totalTimeSpent / 60)}h {totalTimeSpent % 60}m
                      spent
                    </Text>
                  </div>
                )}

                {task?.tags?.length > 0 && (
                  <div className="flex items-center gap-2">
                    {task.tags.slice(0, 3).map((tag, index) => (
                      <Tag key={index} color="blue" className="text-xs">
                        {tag}
                      </Tag>
                    ))}
                    {task.tags.length > 3 && (
                      <Text className="text-xs text-gray-500">
                        +{task.tags.length - 3} more
                      </Text>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Space>
            {canModifyTask && (
              <TaskDocUpload taskId={task?._id} onUploadSuccess={refetch} />
            )}
            {canModifyTask && (
              <TaskReminderForm taskId={task?._id} onReminderSet={refetch} />
            )}
            <AddEventToCalender
              title={createEventTitle}
              description={createEventDescription}
              startDate={task?.dateAssigned}
              endDate={task?.dueDate}
            />
          </Space>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information Card */}
            <Card
              className="border-0 rounded-2xl shadow-sm bg-gradient-to-br from-white to-blue-50/50"
              bodyStyle={{ padding: "24px" }}>
              <div className="flex items-center gap-3 mb-6">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Task Details
                </Title>
              </div>

              {/* Description Section */}
              {task?.description && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileTextOutlined className="text-gray-600" />
                    <Text className="font-semibold text-gray-900">
                      Description
                    </Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-gray-800 leading-relaxed">
                      {task.description}
                    </Text>
                  </div>
                </div>
              )}

              {/* Instruction Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardDocumentIcon className="w-4 h-4 text-gray-600" />
                  <Text className="font-semibold text-gray-900">
                    Instructions
                  </Text>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Text className="text-gray-800 leading-relaxed text-justify whitespace-pre-line">
                    {task?.instruction || "No instructions provided"}
                  </Text>
                </div>
              </div>

              <Divider />

              {/* Assignment Details */}
              <Row gutter={[16, 16]}>
                {/* Assigned By */}
                <Col xs={24} sm={12}>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg h-full">
                    <Avatar
                      size="small"
                      src={task?.assignedBy?.photo}
                      icon={<UserOutlined />}
                      className="bg-green-500"
                    />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Assigned By
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {task?.assignedBy
                          ? `${task.assignedBy?.firstName} ${task.assignedBy?.lastName}`
                          : "N/A"}
                      </Text>
                      {task?.assignedBy?.position && (
                        <Text className="text-xs text-gray-500 block">
                          {task.assignedBy.position}
                        </Text>
                      )}
                      {task?.assignedBy?.email && (
                        <Text className="text-xs text-gray-500 block">
                          {task.assignedBy.email}
                        </Text>
                      )}
                    </div>
                  </div>
                </Col>

                {/* Case Information */}
                <Col xs={24} sm={12}>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg h-full">
                    <ScaleIcon className="w-4 h-4 text-purple-600" />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Related Case
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {task?.case?.caseNumber || "N/A"}
                      </Text>
                      {task?.case?.title && (
                        <Text className="text-xs text-gray-500 block">
                          {task.case.title}
                        </Text>
                      )}
                    </div>
                  </div>
                </Col>

                {/* Assigned To Staff */}
                <Col xs={24}>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar
                      size="small"
                      icon={<TeamOutlined />}
                      className="bg-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <Text className="text-sm font-medium text-gray-600 block mb-2">
                        Assigned Staff ({task?.assignedTo?.length || 0})
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {task?.assignedTo?.length > 0 ? (
                          task.assignedTo.map((assignment, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
                              <Avatar
                                size="small"
                                src={assignment?.user?.photo}
                                className="w-6 h-6">
                                {assignment?.user?.firstName?.[0]}
                                {assignment?.user?.lastName?.[0]}
                              </Avatar>
                              <Text className="text-sm">
                                {assignment?.user?.firstName}{" "}
                                {assignment?.user?.lastName}
                              </Text>
                              {assignment?.user?.position && (
                                <Text className="text-xs text-gray-500">
                                  ({assignment?.user?.position})
                                </Text>
                              )}
                              {assignment?.role !== "primary" && (
                                <Tag color="blue" className="text-xs">
                                  {assignment?.role}
                                </Tag>
                              )}
                            </div>
                          ))
                        ) : (
                          <Text className="text-gray-500 text-sm">
                            No staff assigned
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              <Divider />

              {/* Timeline Information */}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CalendarOutlined className="text-blue-600" />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Date Assigned
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {formatDate(task?.dateAssigned)}
                      </Text>
                      <Text className="text-xs text-gray-500 block">
                        {moment(task?.dateAssigned).fromNow()}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <ClockCircleOutlined
                      className={
                        isOverdue
                          ? "text-red-600"
                          : daysUntilDue <= 2
                          ? "text-orange-600"
                          : "text-green-600"
                      }
                    />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Due Date
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {formatDate(task?.dueDate)}
                      </Text>
                      <Text
                        className={`text-xs ${
                          isOverdue ? "text-red-500" : "text-gray-500"
                        } block`}>
                        {isOverdue ? "Overdue" : `${daysUntilDue} days left`}
                      </Text>
                    </div>
                  </div>
                </Col>
                {task?.estimatedHours && (
                  <Col xs={24} sm={8}>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <ClockCircleOutlined className="text-purple-600" />
                      <div>
                        <Text className="text-sm font-medium text-gray-600 block">
                          Estimated Hours
                        </Text>
                        <Text className="font-semibold text-gray-900">
                          {task.estimatedHours} hours
                        </Text>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Completion Date */}
              {task?.completedAt && (
                <>
                  <Divider />
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircleOutlined className="text-green-600" />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Completed On
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {formatDate(task.completedAt)}
                      </Text>
                      <Text className="text-xs text-gray-500 block">
                        {moment(task.completedAt).fromNow()}
                      </Text>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Activity Timeline */}
            {task?.responses?.length > 0 && (
              <Card
                className="border-0 rounded-2xl shadow-sm"
                bodyStyle={{ padding: "24px" }}>
                <div className="flex items-center gap-3 mb-6">
                  <HistoryOutlined className="text-blue-600" />
                  <Title level={3} className="m-0 text-gray-900">
                    Activity Timeline
                  </Title>
                </div>
                <Timeline>
                  {task.responses.map((response, index) => (
                    <Timeline.Item
                      key={index}
                      dot={<CheckCircleOutlined className="text-green-500" />}
                      color="green">
                      <div className="flex justify-between items-start">
                        <div>
                          <Text strong>
                            {response.submittedBy?.firstName}{" "}
                            {response.submittedBy?.lastName}
                          </Text>
                          <Text className="block text-gray-600">
                            {response.comments}
                          </Text>
                          {response.timeSpent > 0 && (
                            <Text className="text-sm text-gray-500">
                              Time spent: {response.timeSpent} minutes
                            </Text>
                          )}
                          {response.completed && (
                            <Tag color="green" className="mt-1">
                              Marked as completed
                            </Tag>
                          )}
                        </div>
                        <Text className="text-sm text-gray-500">
                          {moment(response.submittedAt).fromNow()}
                        </Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}

            {/* Attachments Card */}
            <TaskAttachmentsCard
              documents={documents}
              task={task}
              baseURL={import.meta.env.VITE_BASE_URL}
              handleDeleteDocument={handleDocumentDelete}
              handleGeneralDownload={handleGeneralDownload}
              onPreviewDocument={handleDocumentPreview}
            />

            {/* Active Reminders */}
            {task?.reminders?.some((r) => r.status === "pending") && (
              <Card
                className="border-0 rounded-2xl shadow-sm border-orange-200 bg-orange-50"
                bodyStyle={{ padding: "24px" }}>
                <div className="flex items-center gap-3 mb-4">
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                  <Title level={3} className="m-0 text-gray-900">
                    Active Reminders
                  </Title>
                </div>
                <List
                  dataSource={task.reminders.filter(
                    (r) => r.status === "pending"
                  )}
                  renderItem={(reminder) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                        }
                        title={reminder.message}
                        description={
                          <div>
                            <Text type="secondary">
                              Scheduled for: {formatDate(reminder.scheduledFor)}
                            </Text>
                            <br />
                            <Text type="secondary">
                              Created: {moment(reminder.timestamp).fromNow()}
                            </Text>
                          </div>
                        }
                      />
                      {canModifyTask && (
                        <Button
                          size="small"
                          onClick={async () => {
                            try {
                              await dataFetcher(
                                `tasks/${task._id}/reminders/${reminder._id}`,
                                "DELETE"
                              );
                              message.success("Reminder cancelled");
                              refetch();
                            } catch (error) {
                              message.error("Failed to cancel reminder");
                            }
                          }}>
                          Cancel
                        </Button>
                      )}
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>

          {/* Right Column - Task Response and Quick Actions */}
          <div className="space-y-6">
            <Card
              className="border-0 rounded-2xl shadow-sm bg-gradient-to-br from-white to-green-50/50 h-fit"
              bodyStyle={{ padding: "24px" }}>
              <div className="flex items-center gap-3 mb-6">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Task Response
                </Title>
              </div>

              {/* Response Form */}
              {!isAssignedBy && isAssignedToCurrentUser && (
                <div className="mb-6">
                  <TaskResponseForm
                    taskId={task?._id}
                    onResponseSubmit={refetch}
                    task={task}
                  />
                </div>
              )}

              {/* Response Display */}
              <TaskResponse
                task={task}
                isAssignedToCurrentUser={isAssignedToCurrentUser}
                onResponseUpdate={refetch}
              />
            </Card>

            {/* Quick Actions */}
            <TaskQuickActions
              task={task}
              onUpdate={handleTaskUpdate}
              canModifyTask={canModifyTask}
            />
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      <Modal
        title={previewDocument?.fileName}
        open={!!previewDocument}
        onCancel={() => setPreviewDocument(null)}
        width="90%"
        style={{ maxWidth: 1200 }}
        footer={[
          <Button
            key="download"
            onClick={() => {
              if (previewDocument) {
                handleGeneralDownload(
                  previewDocument.file,
                  previewDocument.fileName
                );
              }
            }}>
            Download
          </Button>,
          <Button key="close" onClick={() => setPreviewDocument(null)}>
            Close
          </Button>,
        ]}>
        {previewDocument && (
          <div className="w-full h-96">
            {previewDocument.file?.match(/\.(pdf)$/i) ? (
              <iframe
                src={previewDocument.file}
                className="w-full h-full border-0"
                title={previewDocument.fileName}
              />
            ) : previewDocument.file?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={previewDocument.file}
                alt={previewDocument.fileName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Text>Preview not available for this file type</Text>
                <Button
                  type="link"
                  onClick={() =>
                    handleGeneralDownload(
                      previewDocument.file,
                      previewDocument.fileName
                    )
                  }>
                  Download instead
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskDetails;
