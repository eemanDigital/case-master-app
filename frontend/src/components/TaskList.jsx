import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import TaskReminderForm from "./TaskReminderForm";
import { Table, Modal, Space, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import CreateTaskForm from "../pages/CreateTaskForm";
import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";
import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "./PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const TaskList = () => {
  const {
    tasks,
    loading: loadingTasks,
    error: taskError,
    fetchData,
  } = useDataGetterHook();
  const { isError, isSuccess, message } = useSelector((state) => state.delete); // fetch tasks data
  const { user } = useSelector((state) => state.auth); // get logged in user
  const loggedInClientId = user?.data?._id; // get logged in user id

  const { isSuperOrAdmin, isStaff, isClient } = useAdminHook(); // check user role
  const dispatch = useDispatch();

  useRedirectLogoutUser("users/login"); // redirect to login if user is not logged in

  // fetch tasks data
  useEffect(() => {
    fetchData("tasks", "tasks");
  }, [fetchData]);
  // display toast message
  useEffect(() => {
    if (isSuccess) {
      toast.success(message);
      dispatch(RESET());
      fetchData();
    }
    if (isError) {
      toast.error(message);
      dispatch(RESET());
    }
  }, [isSuccess, isError, message, dispatch, fetchData]);

  // handle delete
  const deleteTask = async (id) => {
    try {
      await dispatch(deleteData(`tasks/${id}`));
      await fetchData("tasks", "tasks");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  // Display loading message if data is being fetched
  if (loadingTasks.tasks) return <LoadingSpinner />;

  // Display error message if there is an error fetching data
  if (taskError.error)
    return (
      <PageErrorAlert
        errorCondition={taskError.error}
        errorMessage={taskError.error}
      />
    );

  const columns = [
    {
      title: "Task Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Link className="pl-5" to={`${record?.id}/details`}>
          {text}
        </Link>
      ),
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo) =>
        assignedTo
          ? assignedTo.map((staff) => (
              <p key={staff?._id}>
                {staff?.firstName} {staff?.lastName}
              </p>
            ))
          : "N/A",
    },
    {
      title: "Client",
      dataIndex: "assignedToClient",
      key: "assignedToClient",
      render: (client) => client?.firstName,
    },
    // {
    //   title: "Task Priority",
    //   dataIndex: "taskPriority",
    //   key: "taskPriority",
    // },
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
          {/* <Button type="link">
            <Link to={`${record?.id}/details`}>Get Details</Link>
          </Button> */}
          {/* reminder component */}
          {user?.data?._id === record?.assignedBy?._id && (
            <TaskReminderForm id={record.id} />
          )}
          {/* only the person assigning assignment see the btn */}
          {user?.data?._id === record?.assignedBy?._id && (
            <DeleteOutlined
              size={20}
              className="bg-red-200 text-red-500  p-2 rounded-md cursor-pointer hover:text-red-700"
              onClick={() => {
                Modal.confirm({
                  title: "Are you sure you want to delete this task?",
                  onOk: () => deleteTask(record?.id),
                });
              }}
            />
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

  return (
    <>
      {taskError.tasks ? (
        <PageErrorAlert
          errorCondition={taskError.tasks}
          errorMessage={taskError.tasks}
        />
      ) : (
        <div className=" mt-10 overflow-x-auto font-medium font-poppins">
          {isStaff && <CreateTaskForm />}
          <Table
            columns={columns}
            dataSource={
              isSuperOrAdmin
                ? tasks?.data
                : isClient
                ? filterTaskByClientUser(loggedInClientId)
                : filterTaskByUser(loggedInClientId)
            }
            rowKey="_id"
            scroll={{ x: 700 }}
          />

          {/* <TaskTimeTracker tasks={tasks?.data} userId={loggedInClientId} /> */}
        </div>
      )}{" "}
    </>
  );
};

export default TaskList;
