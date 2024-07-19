import PropTypes from "prop-types";
import { useDataFetch } from "../hooks/useDataFetch";
import { FaFile } from "react-icons/fa6";
import { Button, Descriptions } from "antd";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import { formatDate } from "../utils/formatDate";
import { useAuthContext } from "../hooks/useAuthContext";

const baseURL = import.meta.env.VITE_BASE_URL;

const TaskResponse = ({
  task,
  isAssignedToCurrentClientUser,
  isAssignedToCurrentUser,
}) => {
  const { dataFetcher, loading, error } = useDataFetch();

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  async function handleDelete(taskId, responseId) {
    try {
      await dataFetcher(
        `tasks/${taskId}/response/${responseId}`,
        "delete",
        fileHeaders
      );
    } catch (err) {
      // handle error
    } finally {
      // cleanup or logging
    }
  }

  return (
    <>
      <Descriptions title="Task Response" bordered>
        {task?.taskResponse?.length > 0 ? (
          task.taskResponse.map((res) => (
            <div key={res._id}>
              <Descriptions.Item>
                {isAssignedToCurrentUser ||
                  (isAssignedToCurrentClientUser && (
                    <Button
                      onClick={() => handleDelete(task?._id, res?._id)}
                      type="default"
                      danger>
                      Delete Response
                    </Button>
                  ))}
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
                  {res?.doc ? (
                    <FaFile className="text-blue-500 hover:text-blue-600 text-2xl cursor-pointer" />
                  ) : (
                    <p>None Attached</p>
                  )}
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

// TaskResponse.propTypes = {
//   task: PropTypes.shape({
//     _id: PropTypes.string.isRequired,
//     taskResponse: PropTypes.arrayOf(
//       PropTypes.shape({
//         _id: PropTypes.string.isRequired,
//         completed: PropTypes.bool,
//         comment: PropTypes.string,
//         timestamp: PropTypes.string,
//         file: PropTypes.string,
//       })
//     ),
//   }).isRequired,
// };

export default TaskResponse;
