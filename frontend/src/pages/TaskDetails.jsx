import PropTypes from "prop-types";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Alert, Divider } from "antd";
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
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  // get if assigned to current user
  const isAssignedToCurrentUser = task?.assignedTo?.some(
    (staff) => staff._id === currentUser
  );
  const isAssignedToCurrentClientUser =
    task?.assignedToClient?._id === currentUser;

  // fetch data
  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id, dataFetcher]);

  // load spinner
  if (loading) return <LoadingSpinner />;

  const DetailItem = ({ label, value }) => (
    <div className="mb-4">
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );

  // prop type definition
  DetailItem.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.node,
    ]).isRequired,
  };

  // toast error message
  if (dataError) {
    <PageErrorAlert errorCondition={dataError} errorMessage={dataError} />;
  }

  // prepare event title for calendar
  const createEventTitle = `Official Task: ${task?.title}`;

  // prepare event description for calendar
  const createEventDescription = `Task Description: ${task?.instruction}`;

  return (
    <>
      <div className="container mx-auto  py-4">
        <GoBackButton />

        {/* task details */}

        <Card title="Task Details" className="mb-8 shadow-md bg-rose-300 ">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* task document upload */}

            <TaskDocUpload taskId={task?._id} />
            {/* add task to calendar component */}
            <AddEventToCalender
              title={createEventTitle}
              description={createEventDescription}
              startDate={task?.dateAssigned}
              endDate={task?.dueDate}
            />
          </div>

          <Divider />

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
                task?.assignedToClient ? task.assignedToClient?.fullName : "N/A"
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
                        const secondName = taskCase.secondParty?.name[0]?.name;
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
          <Divider />
          {/* task attachment */}
          <TaskAttachmentsCard
            documents={documents}
            task={task}
            baseURL={baseURL}
            handleDeleteDocument={handleDeleteDocument}
            handleGeneralDownload={handleGeneralDownload}
          />
        </Card>

        {/* task reminder details */}
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

        <div className="flex flex-col  justify-end bg-white pt-3">
          {/* task response form */}
          {!isAssignedBy &&
            (isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
              <TaskResponseForm taskId={task?._id} />
            )}

          {/* task response */}
          <TaskResponse
            task={task}
            isAssignedToCurrentUser={isAssignedToCurrentUser}
            isAssignedToCurrentClientUser={isAssignedToCurrentClientUser}
          />
        </div>
      </div>
    </>
  );
};

export default TaskDetails;
