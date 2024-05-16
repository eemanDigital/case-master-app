import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";

const TaskList = () => {
  const { tasks, loadingError, errorTasks } = useDataGetterHook();

  //   console.log("TASK", tasks?.data);
  //   const taskList = tasks?.data.map((task) => {
  //     // console.log();
  //     return <div key={task._id}>

  //     </div>;
  //   });
  const taskList = tasks?.data?.map((t) => {
    console.log(tasks.data);
    return (
      <div key={t._id}>
        <div className="flex flex-col gap-3 mt-10">
          <h1 className="text-2xl font-bold">Task Title: {t.title}</h1>

          <h1 className="font-bold"> Assigned To:</h1>
          {Array.isArray(t.assignedTo) &&
            t.assignedTo.map((staff) => {
              return (
                <div key={staff._id}>
                  <h3 className="text-1xl  text-green-600">{staff.fullName}</h3>
                </div>
              );
            })}
          {Array.isArray(t.caseToWorkOn) &&
            t.caseToWorkOn.map((taskCase) => {
              const { firstParty, secondParty } = taskCase;
              const firstName = firstParty?.name[0]?.name;
              const secondName = secondParty?.name[0]?.name;
              console.log(firstName);
              return (
                <div key={t._id}>
                  <h3 className="text-1xl  text-red-600">
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
          <p className="text-green-600 ">Due Date: {formatDate(t.dueDate)}</p>
        </div>
      </div>
    );
  });
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Assigned Tasks</h1>
      {taskList}
    </div>
  );
};

export default TaskList;
