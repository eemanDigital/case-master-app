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
  Drawer,
  Empty,
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
  MenuOutlined,
} from "@ant-design/icons";
import CreateTaskForm from "../pages/CreateTaskForm";
import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";
import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "./PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import TaskActions from "./TaskActions";
import TaskStatusFlow from "./TaskStatusFlow";

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
  const [viewMode, setViewMode] = useState("card"); // Default to card for mobile-first
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useRedirectLogoutUser("/users/login");

  // Handle responsive view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-switch to card view on mobile for better UX
      if (mobile && viewMode === "table") {
        setViewMode("card");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  // Fetch tasks data with error handling
  useEffect(() => {
    const loadTasks = async () => {
      try {
        await fetchData("tasks", "tasks");
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        toast.error("Failed to load tasks. Please try again.");
      }
    };

    loadTasks();
  }, [fetchData]);

  // Display toast message with improved handling
  useEffect(() => {
    if (isSuccess && message) {
      toast.success(message, {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      dispatch(RESET());
      fetchData("tasks", "tasks").catch((error) => {
        console.error("Failed to refresh tasks:", error);
      });
    }

    if (isError && message) {
      toast.error(message, {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 5000,
      });
      dispatch(RESET());
    }
  }, [isSuccess, isError, message, dispatch, fetchData, isMobile]);

  // Permission check function with memoization
  const canEdit = useCallback(
    (record) => {
      if (!record || !user?.data?._id) return false;

      const currentUserId = user.data._id;
      const assignedById =
        typeof record.assignedBy === "object"
          ? record.assignedBy?._id
          : record.assignedBy;

      return currentUserId === assignedById || isSuperOrAdmin;
    },
    [user?.data?._id, isSuperOrAdmin]
  );

  // Handle delete with confirmation and error handling
  const deleteTask = useCallback(
    async (id) => {
      if (!id) {
        toast.error("Invalid task ID");
        return;
      }

      try {
        await dispatch(deleteData(`tasks/${id}`)).unwrap();
        toast.success("Task deleted successfully");
        await fetchData("tasks", "tasks");
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error(
          error?.message || "Failed to delete task. Please try again."
        );
      }
    },
    [dispatch, fetchData]
  );

  // Filter tasks based on user role with error handling
  const filteredTasksByRole = useMemo(() => {
    if (!tasks?.data || !Array.isArray(tasks.data)) return [];

    try {
      let filteredTasks = [...tasks.data];

      if (isClient && loggedInClientId) {
        filteredTasks = filteredTasks.filter(
          (task) => task?.assignedToClient?._id === loggedInClientId
        );
      } else if (!isSuperOrAdmin && loggedInClientId) {
        filteredTasks = filteredTasks.filter(
          (task) =>
            task?.assignee?.some((user) => user._id === loggedInClientId) ||
            task?.assignees?.some(
              (assignee) => assignee.user?._id === loggedInClientId
            )
        );
      }

      return filteredTasks;
    } catch (error) {
      console.error("Error filtering tasks:", error);
      return [];
    }
  }, [tasks?.data, isSuperOrAdmin, isClient, loggedInClientId]);

  // Apply search and filters with debouncing
  const filteredAndSearchedTasks = useMemo(() => {
    try {
      return filteredTasksByRole.filter((task) => {
        if (!task) return false;

        const searchLower = searchText.toLowerCase().trim();
        const matchesSearch =
          !searchLower ||
          task.title?.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.customCaseReference?.toLowerCase().includes(searchLower);

        const matchesStatus =
          statusFilter === "all" || task.status === statusFilter;
        const matchesPriority =
          priorityFilter === "all" || task.taskPriority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      });
    } catch (error) {
      console.error("Error filtering tasks:", error);
      return [];
    }
  }, [filteredTasksByRole, searchText, statusFilter, priorityFilter]);

  // Statistics with error handling
  const taskStats = useMemo(() => {
    try {
      const total = filteredTasksByRole.length;
      const completed = filteredTasksByRole.filter(
        (task) => task?.status === "completed"
      ).length;
      const inProgress = filteredTasksByRole.filter(
        (task) => task?.status === "in-progress"
      ).length;
      const overdue = filteredTasksByRole.filter(
        (task) => task?.isOverdue
      ).length;

      return { total, completed, inProgress, overdue };
    } catch (error) {
      console.error("Error calculating stats:", error);
      return { total: 0, completed: 0, inProgress: 0, overdue: 0 };
    }
  }, [filteredTasksByRole]);

  // Get status configuration
  const getStatusConfig = useCallback((status, isOverdue) => {
    if (isOverdue) {
      return {
        color: "red",
        icon: <ExclamationCircleOutlined />,
        text: "Overdue",
      };
    }

    const configs = {
      completed: {
        color: "green",
        icon: <CheckCircleOutlined />,
        text: "Completed",
      },
      "in-progress": {
        color: "blue",
        icon: <SyncOutlined spin />,
        text: "In Progress",
      },
      "under-review": {
        color: "orange",
        icon: <EyeOutlined />,
        text: "Under Review",
      },
      pending: {
        color: "default",
        icon: <ClockCircleOutlined />,
        text: "Pending",
      },
    };

    return (
      configs[status] || {
        color: "default",
        icon: <ClockCircleOutlined />,
        text: status || "Unknown",
      }
    );
  }, []);

  // Get priority color
  const getPriorityColor = useCallback((priority) => {
    const colors = {
      urgent: "red",
      high: "orange",
      medium: "blue",
      low: "green",
    };
    return colors[priority] || "default";
  }, []);

  // Mobile-optimized table columns
  const columns = useMemo(
    () => [
      {
        title: "Task",
        dataIndex: "title",
        key: "title",
        width: isMobile ? 150 : 250,
        fixed: isMobile ? "left" : false,
        render: (text, record) => (
          <div className="task-title-cell">
            <Link
              className="text-blue-600 hover:text-blue-800 font-semibold line-clamp-2 text-sm md:text-base"
              to={`${record?.id}/details`}>
              {text || "Untitled Task"}
            </Link>
            {record.description && !isMobile && (
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
        width: isMobile ? 100 : 130,
        render: (status, record) => {
          const config = getStatusConfig(status, record.isOverdue);
          return (
            <Tag
              color={config.color}
              icon={config.icon}
              className="flex items-center gap-1 text-xs">
              <span className={isMobile ? "hidden sm:inline" : ""}>
                {config.text}
              </span>
            </Tag>
          );
        },
      },
      ...(!isMobile
        ? [
            {
              title: "Priority",
              dataIndex: "taskPriority",
              key: "taskPriority",
              width: 100,
              render: (priority) => (
                <Tag
                  color={getPriorityColor(priority)}
                  className="capitalize text-xs">
                  {priority || "N/A"}
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
                  return (
                    <span className="text-gray-400 text-xs">Unassigned</span>
                  );
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
                      <div
                        key={index}
                        className="flex items-center gap-1 text-xs">
                        <UserOutlined
                          className={
                            user.isClient ? "text-green-500" : "text-blue-500"
                          }
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
                      record.isOverdue
                        ? "text-red-500 font-semibold"
                        : "text-gray-600"
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
              title: "Status Flow",
              key: "statusFlow",
              width: 200,
              render: (_, record) => (
                <TaskStatusFlow
                  task={record}
                  userId={user?.data?._id}
                  onStatusChange={() => fetchData("tasks", "tasks")}
                />
              ),
            },
          ]
        : []),
      {
        title: "Actions",
        key: "actions",
        width: isMobile ? 80 : 150,
        fixed: "right",
        render: (_, record) => {
          const hasEditPermission = canEdit(record);

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

          if (hasEditPermission) {
            menuItems.push(
              {
                key: "edit",
                label: (
                  <Link to={`${record?.id}/update`}>
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
                    centered: isMobile,
                    onOk: () => deleteTask(record?.id),
                  });
                },
              }
            );
          }

          return (
            <Space size="small">
              {!isMobile && (
                <Link to={`${record?.id}/details`}>
                  <Tooltip title="View Details">
                    <Button type="text" icon={<EyeOutlined />} size="small" />
                  </Tooltip>
                </Link>
              )}

              {!isMobile && hasEditPermission && (
                <Tooltip title="Edit Task">
                  <Link to={`${record.id}/update`}>
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
    ],
    [
      isMobile,
      getStatusConfig,
      getPriorityColor,
      canEdit,
      user?.data?._id,
      fetchData,
      deleteTask,
    ]
  );

  // Mobile-optimized TaskCard component
  const TaskCard = useCallback(
    ({ task }) => {
      if (!task) return null;

      const statusConfig = getStatusConfig(task.status, task.isOverdue);
      const hasEditPermission = canEdit(task);

      const cardMenuItems = [
        {
          key: "view",
          label: (
            <Link to={`${task.id}/details`}>
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
              <Link to={`${task.id}/update`}>
                <Space>
                  <EditOutlined />
                  Edit
                </Space>
              </Link>
            ),
          },
          {
            key: "reminder",
            label: <TaskReminderForm id={task.id} />,
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
                centered: isMobile,
                onOk: () => deleteTask(task.id),
              });
            },
          }
        );
      }

      return (
        <Card
          className="task-card h-full hover:shadow-lg transition-all duration-200 border border-gray-200"
          size="small"
          bodyStyle={{ padding: isMobile ? "12px" : "16px" }}>
          <div className="flex justify-between items-start mb-3 gap-2">
            <Tag
              color={statusConfig.color}
              icon={statusConfig.icon}
              className="text-xs">
              {statusConfig.text}
            </Tag>
            <Tag
              color={getPriorityColor(task.taskPriority)}
              className="capitalize text-xs">
              {task.taskPriority || "N/A"}
            </Tag>
          </div>

          <Link to={`${task.id}/details`} className="block mb-2">
            <h3 className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-2 mb-1 text-sm md:text-base">
              {task.title || "Untitled Task"}
            </h3>
          </Link>

          {task.description && (
            <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          <div className="space-y-2 text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <UserOutlined className="flex-shrink-0" />
              <span className="truncate">
                {task.assignees?.length > 0
                  ? `${task.assignees.length} assignee${
                      task.assignees.length > 1 ? "s" : ""
                    }`
                  : "Unassigned"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <ClockCircleOutlined className="flex-shrink-0" />
              <span
                className={
                  task.isOverdue
                    ? "text-red-500 font-semibold truncate"
                    : "truncate"
                }>
                Due: {formatDate(task.dueDate)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <Space size="small" className="flex-wrap">
              <Link to={`${task.id}/details`}>
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  className="p-0 h-auto">
                  {!isMobile && "View"}
                </Button>
              </Link>

              {hasEditPermission && (
                <Link to={`${task.id}/update`}>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    className="p-0 h-auto">
                    {!isMobile && "Edit"}
                  </Button>
                </Link>
              )}
            </Space>

            <Space size="small">
              {task.referenceDocuments?.length > 0 && (
                <Badge
                  count={task.referenceDocuments.length}
                  size="small"
                  showZero={false}>
                  <FileTextOutlined className="text-gray-400" />
                </Badge>
              )}

              <Dropdown
                menu={{ items: cardMenuItems }}
                placement="topRight"
                trigger={["click"]}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          </div>
        </Card>
      );
    },
    [getStatusConfig, getPriorityColor, canEdit, isMobile, deleteTask]
  );

  // Filter drawer for mobile
  const FilterDrawer = () => (
    <Drawer
      title="Filters"
      placement="right"
      onClose={() => setFilterDrawerVisible(false)}
      open={filterDrawerVisible}
      width={280}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full"
            suffixIcon={<FilterOutlined />}>
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="in-progress">In Progress</Option>
            <Option value="under-review">Under Review</Option>
            <Option value="completed">Completed</Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Priority</label>
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            className="w-full"
            suffixIcon={<FilterOutlined />}>
            <Option value="all">All Priority</Option>
            <Option value="urgent">Urgent</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">View Mode</label>
          <Select value={viewMode} onChange={setViewMode} className="w-full">
            <Option value="table">Table View</Option>
            <Option value="card">Card View</Option>
          </Select>
        </div>

        <Button
          type="primary"
          block
          onClick={() => setFilterDrawerVisible(false)}>
          Apply Filters
        </Button>

        <Button
          block
          onClick={() => {
            setStatusFilter("all");
            setPriorityFilter("all");
            setSearchText("");
          }}>
          Clear All
        </Button>
      </div>
    </Drawer>
  );

  // Loading state
  if (loadingTasks.tasks) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (taskError.error) {
    return (
      <div className="p-4 md:p-6">
        <PageErrorAlert
          errorCondition={taskError.error}
          errorMessage={taskError.error}
        />
      </div>
    );
  }

  return (
    <div className="task-list-container p-3 sm:p-4 md:p-6 max-w-screen-2xl mx-auto">
      {/* Header Section - Mobile Optimized */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2 truncate">
                Tasks
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                Manage and track all your tasks
              </p>
            </div>
            {isStaff && (
              <div className="flex-shrink-0">
                <CreateTaskForm />
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards - Mobile First */}
        <Row gutter={[8, 8]} className="mb-4 md:mb-6">
          <Col xs={12} sm={12} md={6}>
            <Card size="small" className="shadow-sm">
              <Statistic
                title={<span className="text-xs">Total</span>}
                value={taskStats.total}
                prefix={<FileTextOutlined className="text-sm" />}
                valueStyle={{
                  color: "#1890ff",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card size="small" className="shadow-sm">
              <Statistic
                title={<span className="text-xs">Completed</span>}
                value={taskStats.completed}
                prefix={<CheckCircleOutlined className="text-sm" />}
                valueStyle={{
                  color: "#52c41a",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card size="small" className="shadow-sm">
              <Statistic
                title={<span className="text-xs">In Progress</span>}
                value={taskStats.inProgress}
                prefix={<SyncOutlined className="text-sm" />}
                valueStyle={{
                  color: "#1890ff",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card size="small" className="shadow-sm">
              <Statistic
                title={<span className="text-xs">Overdue</span>}
                value={taskStats.overdue}
                prefix={<ExclamationCircleOutlined className="text-sm" />}
                valueStyle={{
                  color: "#ff4d4f",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Search and Filters - Mobile Optimized */}
        <Card className="mb-4 md:mb-6" size="small">
          <div className="space-y-3">
            {/* Search Bar */}
            <Search
              placeholder="Search tasks..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full"
              size={isMobile ? "middle" : "large"}
              prefix={<SearchOutlined />}
            />

            {/* Filters Row */}
            <div className="flex gap-2 items-center">
              {isMobile ? (
                // Mobile: Show filter button
                <>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setFilterDrawerVisible(true)}
                    className="flex-1">
                    Filters
                    {(statusFilter !== "all" || priorityFilter !== "all") && (
                      <Badge dot status="processing" className="ml-2" />
                    )}
                  </Button>
                  <Select
                    value={viewMode}
                    onChange={setViewMode}
                    className="w-24">
                    <Option value="table">
                      <span className="text-xs">Table</span>
                    </Option>
                    <Option value="card">
                      <span className="text-xs">Card</span>
                    </Option>
                  </Select>
                </>
              ) : (
                // Desktop: Show inline filters
                <>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Status"
                    className="min-w-[130px]"
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
                    className="min-w-[130px]"
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
                    className="min-w-[120px]">
                    <Option value="table">Table View</Option>
                    <Option value="card">Card View</Option>
                  </Select>

                  {(searchText ||
                    statusFilter !== "all" ||
                    priorityFilter !== "all") && (
                    <Button
                      onClick={() => {
                        setSearchText("");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                      }}
                      type="link"
                      className="ml-auto">
                      Clear All
                    </Button>
                  )}
                </>
              )}
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
            <Card className="overflow-hidden">
              <Table
                columns={columns}
                dataSource={filteredAndSearchedTasks}
                rowKey="_id"
                scroll={{ x: isMobile ? 600 : 1000 }}
                pagination={{
                  pageSize: isMobile ? 5 : 10,
                  showSizeChanger: !isMobile,
                  showQuickJumper: !isMobile,
                  simple: isMobile,
                  showTotal: (total, range) =>
                    !isMobile && `${range[0]}-${range[1]} of ${total} tasks`,
                  position: ["bottomCenter"],
                }}
                size={isMobile ? "small" : "middle"}
                className="task-table"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4">
              {filteredAndSearchedTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredAndSearchedTasks.length === 0 && (
            <Card className="text-center py-8 md:py-12">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-2">
                    <h3 className="text-base md:text-lg font-semibold text-gray-500">
                      No tasks found
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400">
                      {searchText ||
                      statusFilter !== "all" ||
                      priorityFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "Get started by creating your first task"}
                    </p>
                  </div>
                }>
                {isStaff &&
                  !searchText &&
                  statusFilter === "all" &&
                  priorityFilter === "all" && (
                    <CreateTaskForm
                      buttonProps={{
                        type: "primary",
                        size: isMobile ? "middle" : "large",
                      }}
                    />
                  )}
              </Empty>
            </Card>
          )}
        </>
      )}

      {/* Mobile Filter Drawer */}
      {isMobile && <FilterDrawer />}
    </div>
  );
};

export default TaskList;
