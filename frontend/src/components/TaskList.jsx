import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import TaskReminderForm from "./TaskReminderForm";
import { useAuthContext } from "../hooks/useAuthContext";
import { Table, Modal, Space, Button } from "antd";
import CreateTaskForm from "../pages/CreateTaskForm";
import { useDataFetch } from "../hooks/useDataFetch";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useAdminHook } from "../hooks/useAdminHook";

const TaskList = () => {
  const { tasks, loadingError, errorTasks } = useDataGetterHook();

  const { user } = useAuthContext();
  const loggedInClientId = user?.data?.user.id;
  const { data, loading, error, dataFetcher } = useDataFetch();

  const { isSuperOrAdmin, isStaff, isClient } = useAdminHook();

  // Handle delete
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const fileHeaders = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  };

  const handleDeleteApp = async (id) => {
    await dataFetcher(`tasks/${id}`, "delete", { headers: fileHeaders });
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
      title: "Assigned To Client",
      dataIndex: "assignedToClient",
      key: "assignedToClient",
      render: (client) => client?.fullName,
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

          {user?.data?.user?._id === record?.assignedBy?._id && (
            <RiDeleteBin6Line
              className="text-red-500 text-2xl cursor-pointer hover:text-red-700"
              onClick={() => {
                Modal.confirm({
                  title: "Are you sure you want to delete this application?",
                  onOk: () => handleDeleteApp(record?.id),
                });
              }}
            />
          )}
          {/* Check if the current user is the one who assigned the task for each record */}
          {user?.data?.user?._id === record?.assignedBy?._id && (
            <TaskReminderForm id={record._id} />
          )}
        </Space>
      ),
    },
  ];

  // filter task by user. User only see his own task for staff
  const filterTaskByUser = (userId) => {
    if (!tasks?.data) return [];
    return tasks?.data.filter(
      (task) =>
        task?.assignedTo && task?.assignedTo.some((user) => user._id === userId)
    );
  };

  // filter task by user client. client only see his own task/msg
  const filterTaskByClientUser = (userId) => {
    if (!tasks?.data) return [];
    return tasks?.data.filter((task) => task?.assignedToClient?._id === userId);
  };

  console.log(filterTaskByClientUser(loggedInClientId), "FLUC");

  return (
    <div className="mt-10">
      {isStaff && <CreateTaskForm />}
      {/* <Link to="upload" className="text-right">
        <Button>Attach Document to Task</Button>
      </Link>
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Assigned Tasks</h1> */}
      <Table
        columns={columns}
        dataSource={
          isSuperOrAdmin
            ? tasks?.data
            : isClient
            ? filterTaskByClientUser(loggedInClientId)
            : filterTaskByUser(tasks?.data, user?.data?.user?.id)
        }
        rowKey="_id"
      />
    </div>
  );
};

export default TaskList;
