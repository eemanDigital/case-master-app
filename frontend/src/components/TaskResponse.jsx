import moment from "moment";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdDone } from "react-icons/md";
import { useDataFetch } from "../hooks/useDataFetch";

const TaskResponse = ({ task }) => {
  const { dataFetcher } = useDataFetch();
  console.log("TASK", task);

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  // handle delete for task response
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
      {/* TaskResponse */}
      {task.taskResponse &&
        task.taskResponse.map((res) => {
          // console.log(task._id, res._id);
          return (
            <div
              key={res._id}
              className="bg-blue-400 rounded-md text-white px-3 mt-2">
              {/* handle delete */}
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
                <RiDeleteBin6Line />{" "}
              </button>

              <small>
                {res.completed && (
                  <small className="bg-green-600 inline-block text-white px-2 rounded-md">
                    Task Completed{" "}
                    <span className="inline-block tex font-bold">
                      {" "}
                      <MdDone className=" text-1xl " />
                    </span>
                  </small>
                )}
              </small>
              <small className="block">{res.comment}</small>
              <small className="inline-block text-[10px] bg-red-600 px-1 rounded-md">
                {moment(res?.timestamp).startOf().fromNow()}
              </small>
              <small>{res.file && <h1>Download File</h1>}</small>
            </div>
          );
        })}
    </>
  );
};

export default TaskResponse;
