import { useAuthContext } from "../hooks/useAuthContext";
// import { Link, useParams } from "react-router-dom";
import TaskDocView from "./TaskDocView";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import { useEffect } from "react";
// import { FaDownload, FaFileAlt } from "react-icons/fa";
// import { download } from "../utils/download";
// import Button from "./Button";

const UserTask = () => {
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id; // Ensure correct property access
  //   const { id } = useParams();
  const { data, loading, error, dataFetcher } = useDataFetch();

  // console.log("TASKDATA", data?.data.task.length);

  const userTask = data?.data?.task?.map((t) => {
    return (
      <div key={t._id}>
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">Task Title: {t.title}</h1>
          {/* map through case to work on */}
          {Array.isArray(t.caseToWorkOn) &&
            t.caseToWorkOn.map((taskCase) => {
              const { firstParty, secondParty } = taskCase;
              const firstName = firstParty?.name[0]?.name;
              const secondName = secondParty?.name[0]?.name;
              console.log(firstName);
              return (
                <div key={t._id}>
                  <h3 className="text-2xl font-semibold text-red-600">
                    Case to work On: {firstName} vs {secondName}
                  </h3>
                </div>
              );
            })}
          <p>
            <strong>Assigned Date: </strong> {formatDate(t.dateAssigned)}
          </p>
          <p>
            {" "}
            <strong>Instruction:</strong> {t.instruction}
          </p>
          <p>
            <strong>Task Priority: </strong>
            {t.taskPriority}
          </p>
          <p className="text-green-600 font-bold">
            Due Date: {formatDate(t.dueDate)}
          </p>
        </div>
        <TaskDocView taskId={t._id} />
      </div>
    );
  });

  useEffect(() => {
    if (userId) {
      // Use userId for conditional check
      dataFetcher(`users/${userId}`, "GET"); // Fetch user data using userId
    }
  }, [userId]); // Add userId to the dependency array

  // //   console.log("Param ID:", id);

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-3xl text-center font-bold">Task Details</h1>

      <div>{userTask}</div>
    </section>
  );
};

export default UserTask;
