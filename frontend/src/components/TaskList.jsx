import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import TaskReminderForm from "./TaskReminderForm";
import { useAuthContext } from "../hooks/useAuthContext";
import { Table, Modal, Space, Button } from "antd";
import CreateTaskForm from "../pages/CreateTaskForm";
import { useDataFetch } from "../hooks/useDataFetch";

const TaskList = () => {
  const { tasks, loadingError, errorTasks } = useDataGetterHook();
  const { user } = useAuthContext();
  const { data, loading, error, dataFetcher } = useDataFetch();

  const isAdmin = user?.data?.user?.role === "admin";

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

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

  // filter task by user
  const filterTaskByUser = (userId) => {
    if (!tasks?.data) return [];
    return tasks?.data.filter(
      (task) =>
        task?.assignedTo && task?.assignedTo.some((user) => user._id === userId)
    );
  };

  return (
    <div>
      <Link to="upload" className="text-right">
        <Button>Attach Document to Task</Button>
      </Link>
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Assigned Tasks</h1>
      <Table
        columns={columns}
        dataSource={
          isAdmin ? tasks?.data : filterTaskByUser(user?.data?.user?.id)
        }
        rowKey="_id"
      />

      <CreateTaskForm />
    </div>
  );
};

export default TaskList;
