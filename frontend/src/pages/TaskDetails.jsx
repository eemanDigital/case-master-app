import { useEffect } from "react";
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
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  FlagOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  ClipboardDocumentIcon,
  UserGroupIcon,
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
import TaskAttachmentsCard from "../components/TaskAttachmentsCard ";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import AddEventToCalender from "../components/AddEventToCalender";

const { Title, Text } = Typography;

const TaskDetails = () => {
  const { dataFetcher, data, loading, error: dataError } = useDataFetch();
  const { handleDeleteDocument, documents } = useDeleteDocument(
    data?.data,
    "taskData"
  );
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const task = data?.data;
  const currentUser = user?.data?._id;
  const assignedById = task?.assignedBy?._id;
  const isAssignedBy = currentUser === assignedById;
  useRedirectLogoutUser("/users/login");

  const isAssignedToCurrentUser = task?.assignedTo?.some(
    (staff) => staff._id === currentUser
  );
  const isAssignedToCurrentClientUser =
    task?.assignedToClient?._id === currentUser;

  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id, dataFetcher]);

  if (loading) return <LoadingSpinner />;
  if (dataError)
    return (
      <PageErrorAlert errorCondition={dataError} errorMessage={dataError} />
    );

  const createEventTitle = `Official Task: ${task?.title}`;
  const createEventDescription = `Task Description: ${task?.instruction}`;

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  const getStatusColor = (task) => {
    if (task?.taskResponse?.[0]?.completed) return "success";
    if (moment(task?.dueDate).isBefore(moment())) return "error";
    if (moment(task?.dueDate).diff(moment(), "days") <= 2) return "warning";
    return "processing";
  };

  const getStatusText = (task) => {
    if (task?.taskResponse?.[0]?.completed) return "Completed";
    if (moment(task?.dueDate).isBefore(moment())) return "Overdue";
    if (moment(task?.dueDate).diff(moment(), "days") <= 2) return "Due Soon";
    return "In Progress";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto py-6 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <GoBackButton />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ClipboardDocumentIcon className="w-5 h-5 text-blue-600" />
                </div>
                <Title level={2} className="m-0 text-gray-900">
                  {task?.title}
                </Title>
              </div>
              <div className="flex items-center gap-3">
                <Tag
                  color={getStatusColor(task)}
                  className="text-sm font-semibold">
                  {getStatusText(task)}
                </Tag>
                <Tag
                  color={getPriorityColor(task?.taskPriority)}
                  className="text-sm font-semibold">
                  {task?.taskPriority} Priority
                </Tag>
              </div>
            </div>
          </div>
          <Space>
            {!isAssignedToCurrentUser && <TaskDocUpload taskId={task?._id} />}
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
            <Card className="border-0 rounded-2xl shadow-sm bg-gradient-to-br from-white to-blue-50/50">
              <div className="flex items-center gap-3 mb-6">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Task Details
                </Title>
              </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assigned By */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar
                    size="small"
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
                  </div>
                </div>

                {/* Assigned To Client */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    className="bg-purple-500"
                  />
                  <div>
                    <Text className="text-sm font-medium text-gray-600 block">
                      Client
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {task?.assignedToClient
                        ? task.assignedToClient?.fullName
                        : "Not Assigned"}
                    </Text>
                  </div>
                </div>

                {/* Assigned To Staff */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                  <Avatar
                    size="small"
                    icon={<TeamOutlined />}
                    className="bg-blue-500"
                  />
                  <div className="flex-1">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Assigned Staff
                    </Text>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task?.assignedTo?.length > 0 ? (
                        task.assignedTo.map((staff, index) => (
                          <Tag key={index} color="blue" className="text-xs">
                            {staff.firstName} {staff.lastName}
                          </Tag>
                        ))
                      ) : (
                        <Text className="text-gray-500 text-sm">
                          No staff assigned
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Case Information */}
              {task?.caseToWorkOn?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ScaleIcon className="w-4 h-4 text-gray-600" />
                    <Text className="font-semibold text-gray-900">
                      Related Cases
                    </Text>
                  </div>
                  <div className="space-y-2">
                    {task.caseToWorkOn.map((taskCase, index) => {
                      const firstName = taskCase.firstParty?.name[0]?.name;
                      const secondName = taskCase.secondParty?.name[0]?.name;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Badge count={index + 1} color="blue" />
                          <Text className="font-medium text-gray-900">
                            {firstName} vs {secondName}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Divider />

              {/* Timeline Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CalendarOutlined className="text-blue-600" />
                  <div>
                    <Text className="text-sm font-medium text-gray-600 block">
                      Date Assigned
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {formatDate(task?.dateAssigned)}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ClockCircleOutlined
                    className={
                      moment(task?.dueDate).isBefore(moment())
                        ? "text-red-600"
                        : moment(task?.dueDate).diff(moment(), "days") <= 2
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
                    {task?.dueDate && (
                      <Text className="text-xs text-gray-500 block">
                        {moment(task.dueDate).fromNow()}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Attachments Card */}
            <TaskAttachmentsCard
              documents={documents}
              task={task}
              baseURL={import.meta.env.VITE_BASE_URL}
              handleDeleteDocument={handleDeleteDocument}
              handleGeneralDownload={handleGeneralDownload}
            />

            {/* Reminder Alert */}
            {task?.reminder && (
              <Alert
                message={
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span>Reminder: {task.reminder.message}</span>
                  </div>
                }
                description={`Set ${moment(
                  task.reminder?.timestamp
                ).fromNow()}`}
                type="warning"
                showIcon={false}
                className="border-0 rounded-2xl bg-orange-50 border-orange-200"
              />
            )}
          </div>

          {/* Right Column - Task Response */}
          <div className="space-y-6">
            <Card className="border-0 rounded-2xl shadow-sm bg-gradient-to-br from-white to-green-50/50 h-fit">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Task Response
                </Title>
              </div>

              {/* Response Form */}
              {!isAssignedBy &&
                (isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
                  <div className="mb-6">
                    <TaskResponseForm taskId={task?._id} />
                  </div>
                )}

              {/* Response Display */}
              <TaskResponse
                task={task}
                isAssignedToCurrentUser={isAssignedToCurrentUser}
                isAssignedToCurrentClientUser={isAssignedToCurrentClientUser}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
