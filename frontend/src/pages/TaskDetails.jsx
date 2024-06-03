import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Descriptions, Divider } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";

const TaskDetails = () => {
  const { id } = useParams();

  const { dataFetcher, data, loading, error } = useDataFetch();

  useEffect(() => {
    dataFetcher(`tasks/${id}`, "GET");
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const task = data?.data;
  console.log("TASK", task);
  return (
    <>
      <Descriptions title="Task Details" bordered>
        <Descriptions.Item label="Task Title">{task?.title}</Descriptions.Item>
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
      <Divider />

      <Descriptions title="Task Response" bordered>
        {task?.taskResponse.length > 0 ? (
          task.taskResponse.map((res) => (
            <>
              <Descriptions.Item key={res._id} label="Task Completed">
                {res.completed && <h1>Yes</h1>}
              </Descriptions.Item>
              <Descriptions.Item label="Comment">
                {res?.comment}
              </Descriptions.Item>
              <Descriptions.Item label="Time Submitted">
                {formatDate(res?.timestamp)}
              </Descriptions.Item>
              <Descriptions.Item label="Attached Document">
                {res?.doc || <h1>None Attached</h1>}
              </Descriptions.Item>
            </>
          ))
        ) : (
          <h3> No Response Yet</h3>
        )}

        {/* <Descriptions.Item label="Task Priority">
          {res?.taskPriority}
        </Descriptions.Item>
        <Descriptions.Item label="Due Date">
          {formatDate(task?.dueDate)}
        </Descriptions.Item> */}
      </Descriptions>
    </>
  );
};

export default TaskDetails;
