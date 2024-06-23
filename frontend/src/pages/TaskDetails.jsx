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
import { useAuthContext } from "../hooks/useAuthContext";

const baseURL = import.meta.env.VITE_BASE_URL;

const TaskDetails = () => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { handleDeleteDocument, documents } = useDeleteDocument(
    data?.data,
    "taskData"
  );
  const { id } = useParams();
  const { user } = useAuthContext();
  const task = data?.data._id;

  const currentUser = user?.data?.user?._id; //current user id
  const assignedById = task?.assignedBy && task?.assignedBy?._id; // task assignor id

  const isAssignedBy = currentUser === assignedById; //check if both are the same

  console.log("isAs", currentUser, assignedById);
  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // deleteResponse
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  // not working as expected yet
  const handleDeleteApp = async (taskId, responseId) => {
    await dataFetcher(
      `tasks/${taskId}/response/${responseId}`,
      "delete",
      fileHeaders
    );
  };

  return (
    <>
      <TaskDocUpload taskId={task?._id} />

      <Descriptions title="Task Details" bordered>
        <Descriptions.Item label="Task Title">{task?.title}</Descriptions.Item>
        <Descriptions.Item label="Assigned By">
          {task?.assignedBy ? task.assignedBy?.fullName : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Assigned To">
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
        {documents.map((document) => {
          return (
            <div
              key={document._id}
              className="relative bg-blue-500 m-1 p-4 w-[140px] text-white rounded-md inline-flex items-center">
              <div className="absolute top-1 right-1">
                <RiDeleteBin2Line
                  className="text-red-700 hover:text-red-500 cursor-pointer text-[13px]"
                  onClick={(event) =>
                    Modal.confirm({
                      title: "Are you sure you want to delete this document?",
                      onOk: () =>
                        handleDeleteDocument(
                          event,
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
          );
        })}
      </div>

      <Divider />
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

      {/* the person sending task should not see this form */}
      {!isAssignedBy && <TaskResponseForm taskId={task?._id && task?._id} />}

      <Descriptions title="Task Response" bordered>
        {task?.taskResponse?.length > 0 ? (
          task.taskResponse.map((res) => (
            <div key={res._id}>
              <Descriptions.Item>
                <Button
                  onClick={() => handleDeleteApp(task?._id, res?._id)}
                  type="default"
                  danger>
                  Delete Response
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="Task Completed">
                {res.completed && <h1>Yes</h1>}
              </Descriptions.Item>
              <Descriptions.Item label="Comment">
                {res?.comment}
              </Descriptions.Item>
              <Descriptions.Item label="Time Submitted">
                {formatDate(res?.timestamp)}
              </Descriptions.Item>
              <Descriptions.Item label="Attached Document">
                <p
                  onClick={(event) =>
                    handleGeneralDownload(
                      event,
                      `${baseURL}/tasks/${task._id}/response/${res._id}/download`,
                      "response"
                    )
                  }>
                  Document:
                  {(res?.doc && (
                    <FaFile className="text-blue-500 hover:text-blue-600 text-2xl cursor-pointer " />
                  )) || <p>None Attached</p>}
                </p>
              </Descriptions.Item>
            </div>
          ))
        ) : (
          <h3>No Response Yet</h3>
        )}
      </Descriptions>
    </>
  );
};

export default TaskDetails;
