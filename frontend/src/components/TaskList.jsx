import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import TaskReminderForm from "./TaskReminderForm";
import { Table, Modal, Space, Tooltip, Button, Tag, Badge } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import CreateTaskForm from "../pages/CreateTaskForm";
import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
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
  const { isError, isSuccess, message } = useSelector((state) => state.delete);
  const { user } = useSelector((state) => state.auth);
  const loggedInUserId = user?.data?._id;

  const { isSuperOrAdmin, isStaff, isClient } = useAdminHook();
  const dispatch = useDispatch();

  // console.log("Tasks data:", tasks);

  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    fetchData("tasks", "tasks");
  }, [fetchData]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(message);
      dispatch(RESET());
      fetchData("tasks", "tasks");
    }
    if (isError) {
      toast.error(message);
      dispatch(RESET());
    }
  }, [isSuccess, isError, message, dispatch, fetchData]);

  const deleteTask = async (id) => {
    try {
      await dispatch(deleteData(`tasks/${id}`));
      await fetchData("tasks", "tasks");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "blue",
      "in-progress": "orange",
      completed: "green",
      overdue: "red",
      cancelled: "gray",
    };
    return colors[status] || "default";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "red",
      high: "orange",
      medium: "blue",
      low: "green",
    };
    return colors[priority] || "default";
  };

  const columns = [
    {
      title: "Task Title",
      dataIndex: "title",
      key: "title",
      width: 200,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Link
            className="text-blue-600 hover:text-blue-800 font-medium"
            to={`${record?._id || record?.id}/details`}>
            {text}
          </Link>
          {record?.reminder?.isActive && (
            <Badge dot color="orange" title="Has reminder" />
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "taskPriority",
      key: "taskPriority",
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} className="capitalize">
          {priority}
        </Tag>
      ),
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      width: 150,
      render: (assignedTo) =>
        assignedTo?.length > 0 ? (
          <div className="space-y-1">
            {assignedTo.slice(0, 2).map((staff) => (
              <div key={staff?._id} className="text-xs">
                {staff?.firstName} {staff?.lastName}
              </div>
            ))}
            {assignedTo.length > 2 && (
              <div className="text-xs text-gray-500">
                +{assignedTo.length - 2} more
              </div>
            )}
          </div>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Client",
      dataIndex: "assignedToClient",
      key: "assignedToClient",
      width: 120,
      render: (client) =>
        client ? (
          <div className="text-sm">
            {client?.firstName} {client?.lastName}
          </div>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (dueDate) => <div className="text-sm">{formatDate(dueDate)}</div>,
      sorter: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    },
    {
      title: "Progress",
      dataIndex: "completionPercentage",
      key: "completionPercentage",
      width: 100,
      render: (percentage) => (
        <div className="text-sm font-medium">{percentage || 0}%</div>
      ),
    },
    {
      title: "Actions",
      key: "action",
      width: 150,
      render: (text, record) => {
        const isTaskCreator = user?.data?._id === record?.assignedBy?._id;
        const canModify = isTaskCreator || isSuperOrAdmin;

        return (
          <Space size="small">
            <Tooltip title="View Details">
              <Link to={`${record?._id || record?.id}/details`}>
                <Button icon={<EyeOutlined />} size="small" type="text" />
              </Link>
            </Tooltip>

            {canModify && (
              <Tooltip title="Edit Task">
                <Link to={`${record?._id || record?.id}/update`}>
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    type="text"
                    className="text-purple-600"
                  />
                </Link>
              </Tooltip>
            )}

            {canModify && (
              <TaskReminderForm taskId={record?._id || record?.id} />
            )}

            {canModify && (
              <Tooltip title="Delete Task">
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  type="text"
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: "Delete Task",
                      content: "Are you sure you want to delete this task?",
                      okText: "Yes, Delete",
                      okType: "danger",
                      onOk: () => deleteTask(record?._id || record?.id),
                    });
                  }}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // Filter tasks based on user role
  const filteredTasks = useMemo(() => {
    if (!tasks?.data?.tasks) return [];

    const taskArray = Array.isArray(tasks.data?.tasks) ? tasks.data?.tasks : [];

    if (isSuperOrAdmin) {
      return taskArray;
    } else if (isClient) {
      return taskArray.filter(
        (task) => task?.assignedToClient?._id === loggedInUserId
      );
    } else if (isStaff) {
      return taskArray.filter(
        (task) =>
          task?.assignedTo?.some((user) => user._id === loggedInUserId) ||
          task?.assignedBy?._id === loggedInUserId
      );
    }

    return taskArray;
  }, [tasks?.data, isSuperOrAdmin, isClient, isStaff, loggedInUserId]);

  if (loadingTasks.tasks) return <LoadingSpinner />;

  if (taskError.tasks) {
    return (
      <PageErrorAlert
        errorCondition={taskError.tasks}
        errorMessage={taskError.tasks}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">{filteredTasks.length} task(s) found</p>
        </div>
        {(isStaff || isSuperOrAdmin) && <CreateTaskForm />}
      </div>

      <Table
        columns={columns}
        dataSource={filteredTasks}
        rowKey={(record) => record._id || record.id}
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        className="bg-white rounded-lg shadow"
      />
    </div>
  );
};

export default TaskList;
