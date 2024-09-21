import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Alert, Divider, Typography, Tag, Space, Button } from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  FlagOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
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

  const DetailItem = ({ icon, label, value }) => (
    <div className="mb-4 flex items-center">
      <span className="mr-2">{icon}</span>
      <Text strong className="mr-2">
        {label}:
      </Text>
      <Text>{value}</Text>
    </div>
  );

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

  return (
    <div className="container mx-auto py-8 px-4">
      <GoBackButton />

      <Card className="mb-8 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <Title level={2} className="m-0">
            {task?.title}
          </Title>
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

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailItem
            icon={<UserOutlined />}
            label="Assigned By"
            value={
              task?.assignedBy
                ? `${task.assignedBy?.firstName} ${task.assignedBy?.lastName} (${task.assignedBy?.position})`
                : "N/A"
            }
          />
          <DetailItem
            icon={<UserOutlined />}
            label="Assigned to Client"
            value={
              task?.assignedToClient ? task.assignedToClient?.fullName : "N/A"
            }
          />
          <DetailItem
            icon={<UserOutlined />}
            label="Assigned To Staff"
            value={
              task?.assignedTo
                ? task.assignedTo
                    .map((staff) => `${staff.firstName} ${staff.lastName}`)
                    .join(", ")
                : "N/A"
            }
          />
          <DetailItem
            icon={<FileTextOutlined />}
            label="Case to Work On"
            value={
              task?.caseToWorkOn
                ? task.caseToWorkOn
                    .map((taskCase) => {
                      const firstName = taskCase.firstParty?.name[0]?.name;
                      const secondName = taskCase.secondParty?.name[0]?.name;
                      return `${firstName} vs ${secondName}`;
                    })
                    .join(", ")
                : "N/A"
            }
          />
          <DetailItem
            icon={<FlagOutlined />}
            label="Task Priority"
            value={
              <Tag color={getPriorityColor(task?.taskPriority)}>
                {task?.taskPriority}
              </Tag>
            }
          />
          <DetailItem
            icon={<CalendarOutlined />}
            label="Time Assigned"
            value={formatDate(task?.dateAssigned)}
          />
          <DetailItem
            icon={<CalendarOutlined />}
            label="Due Date"
            value={formatDate(task?.dueDate)}
          />
        </div>

        <Divider />

        <div className="mb-6">
          <Text strong>Instruction:</Text>
          <p className="mt-2">{task?.instruction}</p>
        </div>

        <TaskAttachmentsCard
          documents={documents}
          task={task}
          baseURL={import.meta.env.VITE_BASE_URL}
          handleDeleteDocument={handleDeleteDocument}
          handleGeneralDownload={handleGeneralDownload}
        />
      </Card>

      {task?.reminder && (
        <Alert
          message={`Reminder: ${task.reminder.message}`}
          description={`Time: ${moment(task.reminder?.timestamp)
            .startOf()
            .fromNow()}`}
          type="warning"
          showIcon
          className="mb-8"
        />
      )}

      <Card className="mb-8 shadow-lg">
        <div className="flex flex-col justify-end bg-white pt-3">
          {!isAssignedBy &&
            (isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
              <TaskResponseForm taskId={task?._id} />
            )}
          <TaskResponse
            task={task}
            isAssignedToCurrentUser={isAssignedToCurrentUser}
            isAssignedToCurrentClientUser={isAssignedToCurrentClientUser}
          />
        </div>
      </Card>
    </div>
  );
};

export default TaskDetails;
