import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Divider, Modal, Card, Button, Alert, Spin } from "antd";
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
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";

const baseURL = import.meta.env.VITE_BASE_URL;

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
  const navigate = useNavigate();

  const isAssignedToCurrentUser = task?.assignedTo?.some(
    (staff) => staff._id === currentUser
  );
  const isAssignedToCurrentClientUser =
    task?.assignedToClient?._id === currentUser;

  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id]);

  if (loading) return <LoadingSpinner />;
  // if (dataError)
  //   return (
  //     <Alert message={`Error: ${dataError}`} type="error" className="mt-4" />
  //   );

  const DetailItem = ({ label, value }) => (
    <div className="mb-4">
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );

  return (
    <>
      {dataError ? (
        <PageErrorAlert errorCondition={dataError} errorMessage={dataError} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <Button onClick={() => navigate(-1)} className="mb-6">
            Go Back
          </Button>

          <Card title="Task Details" className="mb-8 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Task Title" value={task?.title} />
              <DetailItem
                label="Assigned By"
                value={
                  task?.assignedBy
                    ? `${task.assignedBy?.firstName} ${task.assignedBy?.lastName} (${task.assignedBy?.position})`
                    : "N/A"
                }
              />
              <DetailItem
                label="Assigned to Client"
                value={
                  task?.assignedToClient
                    ? task.assignedToClient?.fullName
                    : "N/A"
                }
              />
              <DetailItem
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
                label="Case to Work On"
                value={
                  task?.caseToWorkOn
                    ? task.caseToWorkOn
                        .map((taskCase) => {
                          const firstName = taskCase.firstParty?.name[0]?.name;
                          const secondName =
                            taskCase.secondParty?.name[0]?.name;
                          return `${firstName} vs ${secondName}`;
                        })
                        .join(", ")
                    : "N/A"
                }
              />
              <DetailItem label="Instruction" value={task?.instruction} />
              <DetailItem label="Task Priority" value={task?.taskPriority} />
              <DetailItem
                label="Time Assigned"
                value={formatDate(task?.dateAssigned)}
              />
              <DetailItem label="Due Date" value={formatDate(task?.dueDate)} />
            </div>
          </Card>

          <TaskDocUpload taskId={task?._id} />

          <Card title="Task Attachments" className="mb-8 shadow-md">
            <div className="flex flex-wrap gap-4">
              {documents.map((document) => (
                <div
                  key={document._id}
                  className="relative bg-blue-500 p-4 w-[140px] text-white rounded-md flex items-center">
                  <div className="absolute top-1 right-1">
                    <RiDeleteBin2Line
                      className="text-red-700 hover:text-red-500 cursor-pointer text-[13px]"
                      onClick={() =>
                        Modal.confirm({
                          title:
                            "Are you sure you want to delete this document?",
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
                    <p className="text-[12px] truncate">{document?.fileName}</p>
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

          {!isAssignedBy &&
            (isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
              <Card className="mb-8 shadow-md">
                <TaskResponseForm taskId={task?._id} />
              </Card>
            )}

          <Card title="Task Responses" className="shadow-md">
            <TaskResponse
              task={task}
              isAssignedToCurrentUser={isAssignedToCurrentUser}
              isAssignedToCurrentClientUser={isAssignedToCurrentClientUser}
            />
          </Card>
        </div>
      )}
    </>
  );
};

export default TaskDetails;
