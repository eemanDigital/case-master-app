import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import TaskReminderForm from "./TaskReminderForm";
import {
  Table,
  Modal,
  Space,
  Tooltip,
  Button,
  Card,
  Tag,
  Dropdown,
  Input,
  Select,
  Badge,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import CreateTaskForm from "../pages/CreateTaskForm";
import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";
import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "./PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Search } = Input;
const { Option } = Select;

const TaskList = () => {
  const {
    tasks,
    loading: loadingTasks,
    error: taskError,
    fetchData,
  } = useDataGetterHook();

  const { isError, isSuccess, message } = useSelector((state) => state.delete);
  const { user } = useSelector((state) => state.auth);
  const loggedInClientId = user?.data?._id;
  const { isSuperOrAdmin, isStaff, isClient } = useAdminHook();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State for filters and search
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");

  useRedirectLogoutUser("/users/login");

  // Fetch tasks data
  useEffect(() => {
    fetchData("tasks", "tasks");
  }, [fetchData]);

  // Display toast message
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

  // ✅ FIXED: Better permission check function
  const canEdit = useCallback(
    (record) => {
      const currentUserId = user?.data?._id;

      // Handle both object and string assignedBy
      const assignedById =
        typeof record?.assignedBy === "object"
          ? record?.assignedBy?._id
          : record?.assignedBy;

      const hasPermission = currentUserId === assignedById || isSuperOrAdmin;

      console.log("🔐 Edit Permission Check:", {
        taskId: record?.id,
        currentUserId,
        assignedById,
        isSuperOrAdmin,
        hasPermission,
      });

      return hasPermission;
    },
    [user?.data?._id, isSuperOrAdmin]
  );

  // Handle delete with confirmation
  const deleteTask = useCallback(
    async (id) => {
      try {
        await dispatch(deleteData(`tasks/${id}`));
        await fetchData("tasks", "tasks");
      } catch (error) {
        toast.error("Failed to delete task");
      }
    },
    [dispatch, fetchData]
  );

  // Filter tasks based on user role
  const filteredTasksByRole = useMemo(() => {
    if (!tasks?.data) return [];

    let filteredTasks = tasks.data;

    if (isClient) {
      filteredTasks = filteredTasks.filter(
        (task) => task?.assignedToClient?._id === loggedInClientId
      );
    } else if (!isSuperOrAdmin) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task?.assignee?.some((user) => user._id === loggedInClientId) ||
          task?.assignees?.some(
            (assignee) => assignee.user?._id === loggedInClientId
          )
      );
    }

    return filteredTasks;
  }, [tasks?.data, isSuperOrAdmin, isClient, loggedInClientId]);

  // Apply search and filters
  const filteredAndSearchedTasks = useMemo(() => {
    return filteredTasksByRole.filter((task) => {
      const matchesSearch =
        searchText === "" ||
        task.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        task.customCaseReference
          ?.toLowerCase()
          .includes(searchText.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.taskPriority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [filteredTasksByRole, searchText, statusFilter, priorityFilter]);

  // Statistics
  const taskStats = useMemo(() => {
    const total = filteredTasksByRole.length;
    const completed = filteredTasksByRole.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgress = filteredTasksByRole.filter(
      (task) => task.status === "in-progress"
    ).length;
    const overdue = filteredTasksByRole.filter((task) => task.isOverdue).length;

    return { total, completed, inProgress, overdue };
  }, [filteredTasksByRole]);

  // Get status color and icon
  const getStatusConfig = (status, isOverdue) => {
    if (isOverdue) {
      return {
        color: "red",
        icon: <ExclamationCircleOutlined />,
        text: "Overdue",
      };
    }

    switch (status) {
      case "completed":
        return {
          color: "green",
          icon: <CheckCircleOutlined />,
          text: "Completed",
        };
      case "in-progress":
        return {
          color: "blue",
          icon: <SyncOutlined spin />,
          text: "In Progress",
        };
      case "under-review":
        return { color: "orange", icon: <EyeOutlined />, text: "Under Review" };
      case "pending":
        return {
          color: "default",
          icon: <ClockCircleOutlined />,
          text: "Pending",
        };
      default:
        return {
          color: "default",
          icon: <ClockCircleOutlined />,
          text: status,
        };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "blue";
      case "low":
        return "green";
      default:
        return "default";
    }
  };

  // ✅ FIXED: Table columns with proper permission check
  const columns = [
    {
      title: "Task",
      dataIndex: "title",
      key: "title",
      width: 200,
      render: (text, record) => (
        <div className="task-title-cell">
          <Link
            className="text-blue-600 hover:text-blue-800 font-semibold line-clamp-2"
            to={`${record?.id}/details`}>
            {text}
          </Link>
          {record.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => {
        const config = getStatusConfig(status, record.isOverdue);
        return (
          <Tag
            color={config.color}
            icon={config.icon}
            className="flex items-center gap-1 whitespace-nowrap">
            {config.text}
          </Tag>
        );
      },
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
      dataIndex: "assignees",
      key: "assignees",
      width: 150,
      render: (assignees) => {
        if (!assignees || assignees.length === 0) {
          return <span className="text-gray-400">Unassigned</span>;
        }

        const displayUsers = assignees.map((assignee) => {
          if (assignee.user && typeof assignee.user === "object") {
            return {
              ...assignee.user,
              role: assignee.role,
              isClient: assignee.isClient,
            };
          }
          return {
            _id: assignee.user,
            firstName: "User",
            lastName: assignee.user?.toString().slice(-4) || "",
            role: assignee.role,
            isClient: assignee.isClient,
          };
        });

        return (
          <div className="space-y-1">
            {displayUsers.slice(0, 2).map((user, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <UserOutlined
                  className={user.isClient ? "text-green-500" : "text-blue-500"}
                />
                <span className="line-clamp-1">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            ))}
            {assignees.length > 2 && (
              <Badge
                count={`+${assignees.length - 2}`}
                size="small"
                style={{ backgroundColor: "#d9d9d9", color: "#666" }}
              />
            )}
          </div>
        );
      },
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (dueDate, record) => (
        <div className="text-xs">
          <div
            className={
              record.isOverdue ? "text-red-500 font-semibold" : "text-gray-600"
            }>
            {formatDate(dueDate)}
          </div>
          {record.isOverdue && (
            <div className="text-red-400 text-xs">Overdue</div>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (text, record) => {
        const hasEditPermission = canEdit(record);

        // ✅ Build menu items properly
        const menuItems = [
          {
            key: "view",
            label: (
              <Link to={`${record?.id}/details`}>
                <Space>
                  <EyeOutlined />
                  View Details
                </Space>
              </Link>
            ),
          },
        ];

        // ✅ Add edit/delete items conditionally
        if (hasEditPermission) {
          menuItems.push(
            {
              key: "edit",
              label: (
                <Link to={`#${record.id}/update`}>
                  <Space>
                    <EditOutlined />
                    Edit Task
                  </Space>
                </Link>
              ),
            },
            {
              key: "reminder",
              label: <TaskReminderForm id={record?.id} />,
            },
            {
              key: "divider",
              type: "divider",
            },
            {
              key: "delete",
              danger: true,
              label: (
                <Space>
                  <DeleteOutlined />
                  Delete
                </Space>
              ),
              onClick: () => {
                Modal.confirm({
                  title: "Delete Task",
                  content:
                    "Are you sure you want to delete this task? This action cannot be undone.",
                  okText: "Delete",
                  okType: "danger",
                  cancelText: "Cancel",
                  onOk: () => deleteTask(record?.id),
                });
              },
            }
          );
        }

        return (
          <Space size="small">
            <Link to={`${record?.id}/details`}>
              <Tooltip title="View Details">
                <Button type="text" icon={<EyeOutlined />} size="small" />
              </Tooltip>
            </Link>

            {hasEditPermission && (
              <Tooltip title="Edit Task">
                <Link to={`#${record.id}/update`}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    size="small"
                    className="text-blue-500 hover:text-blue-700"
                  />
                </Link>
              </Tooltip>
            )}

            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // ✅ FIXED: Card view component
  const TaskCard = ({ task }) => {
    const statusConfig = getStatusConfig(task.status, task.isOverdue);
    const hasEditPermission = canEdit(task);

    const cardMenuItems = [
      {
        key: "view",
        label: (
          <Link to={`${task?.id}/details`}>
            <Space>
              <EyeOutlined />
              View Details
            </Space>
          </Link>
        ),
      },
    ];

    if (hasEditPermission) {
      cardMenuItems.push(
        {
          key: "edit",
          label: (
            <Link to={`#${task.id}/update`}>
              <Space>
                <EditOutlined />
                Edit
              </Space>
            </Link>
          ),
        },
        {
          key: "reminder",
          label: <TaskReminderForm id={task?.id} />,
        },
        {
          key: "divider",
          type: "divider",
        },
        {
          key: "delete",
          danger: true,
          label: (
            <Space>
              <DeleteOutlined />
              Delete
            </Space>
          ),
          onClick: () => {
            Modal.confirm({
              title: "Delete Task",
              content: "Are you sure you want to delete this task?",
              okText: "Delete",
              okType: "danger",
              onOk: () => deleteTask(task?.id),
            });
          },
        }
      );
    }

    return (
      <Card
        className="task-card h-full hover:shadow-lg transition-all duration-200"
        size="small">
        <div className="flex justify-between items-start mb-3">
          <Tag color={statusConfig.color} icon={statusConfig.icon}>
            {statusConfig.text}
          </Tag>
          <Tag
            color={getPriorityColor(task?.taskPriority)}
            className="capitalize">
            {task?.taskPriority}
          </Tag>
        </div>

        <Link to={`${task?.id}/details`} className="block mb-2">
          <h3 className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-2 mb-1">
            {task?.title}
          </h3>
        </Link>

        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {task?.description}
          </p>
        )}

        <div className="space-y-2 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <UserOutlined />
            <span>
              {task.assignees?.length > 0
                ? `${task.assignees.length} assignee${
                    task.assignees.length > 1 ? "s" : ""
                  }`
                : "Unassigned"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <ClockCircleOutlined />
            <span
              className={task.isOverdue ? "text-red-500 font-semibold" : ""}>
              Due: {formatDate(task.dueDate)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <Space size="small">
            <Link to={`${task?.id}/details`}>
              <Button type="link" size="small" icon={<EyeOutlined />}>
                View
              </Button>
            </Link>

            {hasEditPermission && (
              <Link to={`#${task.id}/update`}>
                <Button type="link" size="small" icon={<EditOutlined />}>
                  Edit
                </Button>
              </Link>
            )}

            <Dropdown
              menu={{ items: cardMenuItems }}
              placement="topRight"
              trigger={["click"]}>
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>

          {task.referenceDocuments?.length > 0 && (
            <Badge
              count={task.referenceDocuments.length}
              size="small"
              showZero={false}>
              <FileTextOutlined className="text-gray-400" />
            </Badge>
          )}
        </div>
      </Card>
    );
  };

  // Display loading
  if (loadingTasks.tasks) return <LoadingSpinner />;

  // Display error
  if (taskError.error) {
    return (
      <PageErrorAlert
        errorCondition={taskError.error}
        errorMessage={taskError.error}
      />
    );
  }

  return (
    <div className="task-list-container p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Tasks
            </h1>
            <p className="text-gray-600">
              Manage and track all your tasks in one place
            </p>
          </div>
          {isStaff && <CreateTaskForm />}
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Tasks"
                value={taskStats.total}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Completed"
                value={taskStats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="In Progress"
                value={taskStats.inProgress}
                prefix={<SyncOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Overdue"
                value={taskStats.overdue}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card className="mb-6" size="small">
          <div className="flex flex-col lg:flex-row gap-4">
            <Search
              placeholder="Search tasks..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1"
              prefix={<SearchOutlined />}
            />

            <div className="flex flex-wrap gap-2">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Status"
                className="min-w-[120px]"
                suffixIcon={<FilterOutlined />}>
                <Option value="all">All Status</Option>
                <Option value="pending">Pending</Option>
                <Option value="in-progress">In Progress</Option>
                <Option value="under-review">Under Review</Option>
                <Option value="completed">Completed</Option>
              </Select>

              <Select
                value={priorityFilter}
                onChange={setPriorityFilter}
                placeholder="Priority"
                className="min-w-[120px]"
                suffixIcon={<FilterOutlined />}>
                <Option value="all">All Priority</Option>
                <Option value="urgent">Urgent</Option>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>

              <Select
                value={viewMode}
                onChange={setViewMode}
                className="min-w-[100px]">
                <Option value="table">Table View</Option>
                <Option value="card">Card View</Option>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks Display */}
      {taskError.tasks ? (
        <PageErrorAlert
          errorCondition={taskError.tasks}
          errorMessage={taskError.tasks}
        />
      ) : (
        <>
          {viewMode === "table" ? (
            <Card>
              <Table
                columns={columns}
                dataSource={filteredAndSearchedTasks}
                rowKey="_id"
                scroll={{ x: 800 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} tasks`,
                }}
                size="middle"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSearchedTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          )}

          {filteredAndSearchedTasks.length === 0 && (
            <Card className="text-center py-12">
              <FileTextOutlined className="text-4xl text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-400 mb-4">
                {searchText ||
                statusFilter !== "all" ||
                priorityFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first task"}
              </p>
              {isStaff && <CreateTaskForm buttonProps={{ type: "primary" }} />}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;
