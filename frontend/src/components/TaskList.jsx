import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import TaskReminderForm from "./TaskReminderForm";
import { Table, Modal, Space, Tooltip, Button, Tag, Badge, Avatar } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
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

  useRedirectLogoutUser("/users/login");

  console.log("Tasks data:", tasks);

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
      "under-review": "purple",
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

  const getCategoryColor = (category) => {
    const colors = {
      research: "blue",
      drafting: "purple",
      filing: "cyan",
      hearing: "orange",
      "client-meeting": "green",
      discovery: "gold",
      other: "default",
    };
    return colors[category] || "default";
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
          {record?.reminders?.some((r) => r.status === "pending") && (
            <Badge dot color="orange" title="Has active reminder" />
          )}
        </div>
      ),
    },
    {
      title: "Case",
      dataIndex: "case",
      key: "case",
      width: 120,
      render: (caseObj) => (
        <div className="text-xs">{caseObj?.caseNumber || "N/A"}</div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status?.replace("-", " ")}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} className="capitalize">
          {priority}
        </Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category) => (
        <Tag color={getCategoryColor(category)} className="capitalize">
          {category?.replace("-", " ")}
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
            {assignedTo.slice(0, 2).map((assignment) => (
              <div
                key={assignment?.user?._id}
                className="flex items-center gap-1">
                <Avatar
                  size="small"
                  src={assignment?.user?.photo}
                  className="w-4 h-4">
                  {assignment?.user?.firstName?.[0]}
                </Avatar>
                <span className="text-xs">
                  {assignment?.user?.firstName} {assignment?.user?.lastName}
                  {assignment.role !== "primary" && (
                    <Tag color="blue" className="ml-1 text-xs">
                      {assignment.role}
                    </Tag>
                  )}
                </span>
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
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (dueDate) => <div className="text-sm">{formatDate(dueDate)}</div>,
      sorter: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      width: 100,
      render: (progress) => (
        <div className="flex items-center gap-2">
          <div className="w-12 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium w-8">{progress}%</span>
        </div>
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
        (task) =>
          task?.assignedTo?.some(
            (assignment) => assignment.user._id === loggedInUserId
          ) || task?.assignedBy?._id === loggedInUserId
      );
    } else if (isStaff) {
      return taskArray.filter(
        (task) =>
          task?.assignedTo?.some(
            (assignment) => assignment.user._id === loggedInUserId
          ) || task?.assignedBy?._id === loggedInUserId
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
        scroll={{ x: 1200 }}
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
