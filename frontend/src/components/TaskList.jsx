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

  console.log("TASK", tasks);
  const { user } = useAuthContext();
  const { data, loading, error, dataFetcher } = useDataFetch();

  const { isSuperOrAdmin } = useAdminHook();

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
      <CreateTaskForm />

      {/* <Link to="upload" className="text-right">
        <Button>Attach Document to Task</Button>
      </Link>
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Assigned Tasks</h1> */}
      <Table
        columns={columns}
        dataSource={
          isSuperOrAdmin ? tasks?.data : filterTaskByUser(user?.data?.user?.id)
        }
        rowKey="_id"
      />
    </div>
  );
};

export default TaskList;
