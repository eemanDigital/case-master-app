import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import TaskReminderForm from "./TaskReminderForm";
// import Button from "./Button";
import { Table, Modal, Space, Button } from "antd";
import CreateTaskForm from "../pages/CreateTaskForm";
import { useDataFetch } from "../hooks/useDataFetch";

const TaskList = () => {
  const { tasks, loadingError, errorTasks } = useDataGetterHook();

  const { data, loading, error, dataFetcher } = useDataFetch();

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  // delete leave app
  const handleDeleteApp = async (id) => {
    await dataFetcher(`tasks/${id}`, "delete", fileHeaders);
  };

  const columns = [
    {
      title: "Task Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo) =>
        assignedTo
          ? assignedTo.map((staff) => <p key={staff._id}>{staff.fullName}</p>)
          : "N/A",
    },
    // {
    //   title: "Case to Work On",
    //   dataIndex: "caseToWorkOn",
    //   key: "caseToWorkOn",
    //   render: (caseToWorkOn) =>
    //     caseToWorkOn
    //       ? caseToWorkOn.map((taskCase) => {
    //           const { firstParty, secondParty } = taskCase;
    //           const firstName = firstParty?.name[0]?.name;
    //           const secondName = secondParty?.name[0]?.name;
    //           return (
    //             <p key={taskCase._id}>
    //               {firstName} vs {secondName}
    //             </p>
    //           );
    //         })
    //       : "N/A",
    // },
    // {
    //   title: "Instruction",
    //   dataIndex: "instruction",
    //   key: "instruction",
    // },
    {
      title: "Task Priority",
      dataIndex: "taskPriority",
      key: "taskPriority",
    },
    {
      title: "Date Assigned",
      dataIndex: "dateAssigned",
      key: "dateAssigned",
      render: (dateAssigned) => formatDate(dateAssigned),
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Button type="link">
            <Link to={`${record?.id}/details`}>Get Details</Link>
          </Button>
          <Button
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this application?",
                onOk: () => handleDeleteApp(record?.id),
              });
            }}
            type="primary"
            danger>
            Delete
          </Button>

          <TaskReminderForm id={record._id} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Link to="upload" className="text-right">
        <Button>Attach Document to Task</Button>{" "}
      </Link>
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Assigned Tasks</h1>
      <Table columns={columns} dataSource={tasks?.data} rowKey="_id" />

      <CreateTaskForm />
    </div>
  );
};

export default TaskList;
