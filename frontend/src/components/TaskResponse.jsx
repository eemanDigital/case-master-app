import moment from "moment";
import { MdDone } from "react-icons/md";

const TaskResponse = ({ task }) => {
  return (
    <>
      {/* TaskResponse */}
      {task.taskResponse &&
        task.taskResponse.map((res) => {
          return (
            <div
              key={res._id}
              className="bg-blue-400 rounded-md text-white px-3 mt-2">
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
