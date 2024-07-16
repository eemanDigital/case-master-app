import PropTypes from "prop-types";
import moment from "moment";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdDone } from "react-icons/md";
import { useDataFetch } from "../hooks/useDataFetch";

const TaskResponse = ({ task }) => {
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
      {task.taskResponse &&
        task.taskResponse.map((res) => (
          <div
            key={res._id}
            className="bg-blue-400 rounded-md text-white px-3 mt-2">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this response?"
                  )
                ) {
                  handleDelete(task._id, res._id);
                }
              }}
              title="Delete Response"
              className="text-red-600 cursor-pointer hover:text-red-400">
              <RiDeleteBin6Line />
            </button>

            {res.completed && (
              <div className="bg-green-600 inline-block text-white px-2 rounded-md">
                Task Completed <MdDone className="text-xl" />
              </div>
            )}

            <div className="block">{res.comment}</div>

            <div className="inline-block text-xs bg-red-600 px-1 rounded-md">
              {moment(res?.timestamp).startOf().fromNow()}
            </div>

            {res.file && <h1 className="text-sm">Download File</h1>}
          </div>
        ))}
    </>
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
        file: PropTypes.string,
      })
    ),
  }).isRequired,
};

export default TaskResponse;
