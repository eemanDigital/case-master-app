import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Descriptions } from "antd";
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
        <Descriptions.Item label="Due Date">
          {formatDate(task?.dueDate)}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
};

export default TaskDetails;
