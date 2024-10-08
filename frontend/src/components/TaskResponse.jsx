import PropTypes from "prop-types";
import { FaFile, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { Button, Card, Popconfirm, Tooltip } from "antd";
import { handleTaskResponseDownload } from "../utils/generalFileDownloadHandler";
import { formatDate } from "../utils/formatDate";
import { useDispatch, useSelector } from "react-redux";
import { deleteData } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";

const TaskResponse = ({
  task,
  isAssignedToCurrentClientUser,
  isAssignedToCurrentUser,
  onRefresh, // New prop for refreshing data
}) => {
  const baseURL = import.meta.env.VITE_BASE_URL;
  const { isError, isSuccess, message } = useSelector((state) => state.delete);

  const dispatch = useDispatch();

  // remove/delete response
  // remove/delete response
  const removeResponse = async (taskId, responseId) => {
    try {
      await dispatch(deleteData(`tasks/${taskId}/response/${responseId}`));

      if (isSuccess) {
        toast.success("Response deleted successfully");

        // Trigger refresh after successful deletion
        if (onRefresh) {
          onRefresh();
        } else {
          // Fallback to page refresh if onRefresh is not provided
          window.location.reload();
        }
      }

      if (isError) {
        toast.error(message || "Failed to delete response");
      }
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error("Failed to delete response");
    }
  };

  return (
    <Card
      title="Task Response"
      className="shadow-md space-y-4 p-4 sm:p-0 md:p-8 lg:p-1 w-full mt-3">
      {task?.taskResponse?.length > 0 ? (
        task.taskResponse.map((res) => (
          <div key={res._id} className=" ">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div className="flex items-center mb-2 md:mb-0">
                <span className="font-semibold mr-2">Task Completed:</span>
                {res.completed ? (
                  <FaCheck className="text-green-500" />
                ) : (
                  <FaTimes className="text-red-500" />
                )}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(res?.timestamp)}
              </div>
            </div>
            <p className="mb-4">
              <span className="font-semibold">Comment:</span> {res?.comment}
            </p>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div
                onClick={(event) =>
                  handleTaskResponseDownload(
                    event,
                    res?.doc ||
                      `${baseURL}/tasks/${task._id}/response/${res._id}/download`,
                    "response"
                  )
                }
                className="cursor-pointer flex items-center mb-2 md:mb-0">
                <span className="mr-2">Document:</span>
                {res?.doc ? (
                  <FaFile className="text-blue-500 hover:text-blue-600 text-xl" />
                ) : (
                  <span className="text-gray-500">None Attached</span>
                )}
              </div>

              {(isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
                <Popconfirm
                  title="Are you sure you want to delete this response?"
                  onConfirm={() => removeResponse(task?._id, res?._id)}
                  okText="Yes"
                  cancelText="No">
                  <Tooltip title="Delete Response">
                    <Button
                      type="default"
                      danger
                      icon={<FaTrash />}
                      className="flex items-center"></Button>
                  </Tooltip>
                </Popconfirm>
              )}
            </div>
          </div>
        ))
      ) : (
        <Card className="text-center w-full">
          <h3 className="text-lg sm:text-xl md:text-2xl text-gray-500">
            No Response Yet
          </h3>
        </Card>
      )}
    </Card>
  );
};

TaskResponse.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    taskResponse: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        completed: PropTypes.bool,
        comment: PropTypes.string,
        timestamp: PropTypes.string,
        doc: PropTypes.string,
      })
    ),
  }).isRequired,
  isAssignedToCurrentClientUser: PropTypes.bool,
  isAssignedToCurrentUser: PropTypes.bool,
  onRefresh: PropTypes.func, // New prop type for the refresh function
};

export default TaskResponse;
