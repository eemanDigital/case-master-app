import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Descriptions, Divider, Modal, Card, Button, Alert } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import TaskDocUpload from "./TaskDocUpload";
import { FaDownload, FaFile } from "react-icons/fa6";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import { RiDeleteBin2Line } from "react-icons/ri";
import useDeleteDocument from "../hooks/useDeleteDocument";
import TaskResponseForm from "../components/TaskResponseForm";
import moment from "moment";
import TaskResponse from "../components/TaskResponse";
import { useSelector } from "react-redux";

const baseURL = import.meta.env.VITE_BASE_URL;

const TaskDetails = () => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { handleDeleteDocument, documents } = useDeleteDocument(
    data?.data,
    "taskData"
  );
  const { id } = useParams();
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const task = data?.data;

  const currentUser = user?.data?.user?._id;
  const assignedById = task?.assignedBy?._id;
  const isAssignedBy = currentUser === assignedById; //current loggedIn Staff User

  const isAssignedToCurrentUser = task?.assignedTo?.some(
    (staff) => staff._id === currentUser
  );
  const isAssignedToCurrentClientUser = //current loggedIn Client User
    task?.assignedToClient?._id === currentUser;

  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const handleDeleteApp = async (taskId, responseId) => {
    await dataFetcher(`tasks/${taskId}/response/${responseId}`, "DELETE");
  };

  return (
    <div className="mt-10">
      <TaskDocUpload taskId={task?._id} />

      <Descriptions title="Task Details" bordered>
        <Descriptions.Item label="Task Title">{task?.title}</Descriptions.Item>
        <Descriptions.Item label="Assigned By">
          {task?.assignedBy ? task.assignedBy?.fullName : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label=" Assigned to Client">
          {task?.assignedToClient ? task.assignedToClient?.fullName : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Assigned To Staff">
          {task?.assignedTo
            ? task.assignedTo.map((staff) => (
                <p key={staff._id}>{staff.fullName}</p>
              ))
            : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Case to Work On">
          {task?.caseToWorkOn
            ? task.caseToWorkOn.map((taskCase) => {
                const { firstParty, secondParty } = taskCase;
                const firstName = firstParty?.name[0]?.name;
                const secondName = secondParty?.name[0]?.name;
                return (
                  <p key={taskCase._id}>
                    {firstName} vs {secondName}
                  </p>
                );
              })
            : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Instruction">
          {task?.instruction}
        </Descriptions.Item>
        <Descriptions.Item label="Task Priority">
          {task?.taskPriority}
        </Descriptions.Item>
        <Descriptions.Item label="Time Assigned">
          {formatDate(task?.dateAssigned)}
        </Descriptions.Item>
        <Descriptions.Item label="Due Date">
          {formatDate(task?.dueDate)}
        </Descriptions.Item>
      </Descriptions>

      <div className="mt-4">
        <h1 className="text-3xl text-gray-700">Task Attachment</h1>
        {documents.map((document) => (
          <div
            key={document._id}
            className="relative bg-blue-500 m-1 p-4 w-[140px] text-white rounded-md inline-flex items-center">
            <div className="absolute top-1 right-1">
              <RiDeleteBin2Line
                className="text-red-700 hover:text-red-500 cursor-pointer text-[13px]"
                onClick={() =>
                  Modal.confirm({
                    title: "Are you sure you want to delete this document?",
                    onOk: () =>
                      handleDeleteDocument(
                        `tasks/${task._id}/documents/${document._id}`,
                        document._id
                      ),
                  })
                }
              />
            </div>
            <div className="flex-grow">
              <p className="text-[12px]">{document?.fileName}</p>
            </div>
            <FaDownload
              className="text-white text-[12px] hover:text-gray-300 cursor-pointer ml-2"
              onClick={(event) =>
                handleGeneralDownload(
                  event,
                  `${baseURL}/tasks/${task._id}/documents/${document._id}/download`,
                  document.fileName
                )
              }
            />
          </div>
        ))}
      </div>

      <Divider />
      {/* TASK REMINDER */}
      {task?.reminder && (
        <Alert
          message={`Reminder: ${task.reminder.message}`}
          description={`Time: ${moment(task.reminder?.timestamp)
            .startOf()
            .fromNow()}`}
          type="warning"
          showIcon
          className="my-4"
          style={{ fontSize: "16px", fontWeight: "bold" }}
        />
      )}

      <Divider />

      {/* ensure only the person to whom task is assigned sees the button */}
      {(!isAssignedBy && isAssignedToCurrentUser) ||
        (!isAssignedBy && isAssignedToCurrentClientUser && (
          <TaskResponseForm taskId={task?._id} />
        ))}

      {/* TASK RESPONSE */}
      <TaskResponse
        task={task}
        isAssignedToCurrentUser={isAssignedToCurrentUser}
        isAssignedToCurrentClientUser={isAssignedToCurrentClientUser}
      />
    </div>
  );
};

export default TaskDetails;
