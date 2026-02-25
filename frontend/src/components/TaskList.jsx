import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Collapse,
  Pagination,
  Flex,
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
  ReloadOutlined,
} from "@ant-design/icons";
import CreateTaskForm from "../pages/CreateTaskForm";
import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";
import PageErrorAlert from "./PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import TaskActions from "./TaskActions";
import TaskStatusFlow from "./TaskStatusFlow";
import {
  fetchTasks,
  deleteTask,
  setTaskFilters,
  clearTaskFilters,
  selectAllTasks,
  selectTaskLoading,
  selectTaskError,
  selectTaskPagination,
  selectTaskFilters,
} from "../redux/features/task/taskSlice";

const { Search } = Input;
const { Option } = Select;

const TaskList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const tasks = useSelector(selectAllTasks);
  const loading = useSelector(selectTaskLoading);
  const error = useSelector(selectTaskError);
  const pagination = useSelector(selectTaskPagination);
  const filters = useSelector(selectTaskFilters);
  
  const { user } = useSelector((state) => state.auth);
  const loggedInClientId = user?.data?._id;
  const { isSuperOrAdmin, isStaff, isClient } = useAdminHook();

  // State for filters and search
  const [searchText, setSearchText] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState("all");
  const [localPriorityFilter, setLocalPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState("card"); // Default to card for mobile-first
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useRedirectLogoutUser("/users/login");

  // Build filter params for API
  const filterParams = useMemo(() => {
    const params = {};
    if (localStatusFilter !== "all") params.status = localStatusFilter;
    if (localPriorityFilter !== "all") params.priority = localPriorityFilter;
    if (searchText) params.search = searchText;
    params.page = currentPage;
    params.limit = pageSize;
    return params;
  }, [localStatusFilter, localPriorityFilter, searchText, currentPage, pageSize]);

  // Handle responsive view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && viewMode === "table") {
        setViewMode("card");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  // Fetch tasks from Redux
  useEffect(() => {
    dispatch(fetchTasks(filterParams));
  }, [dispatch, filterParams]);

  // Refresh tasks
  const refreshTasks = useCallback(() => {
    dispatch(fetchTasks(filterParams));
  }, [dispatch, filterParams]);

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
    [user?.data?._id, isSuperOrAdmin],
  );

  // Handle delete with confirmation and error handling
  const handleDeleteTask = useCallback(
    async (id) => {
      if (!id) {
        toast.error("Invalid task ID");
        return;
      }

      try {
        await dispatch(deleteTask(id)).unwrap();
        toast.success("Task deleted successfully");
        refreshTasks();
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error(
          error?.message || error || "Failed to delete task. Please try again.",
        );
      }
    },
    [dispatch, refreshTasks],
  );

  // Filter tasks based on user role with error handling
  const filteredTasksByRole = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];

    try {
      let filteredTasks = [...tasks];

      if (isClient && loggedInClientId) {
        filteredTasks = filteredTasks.filter(
          (task) => task?.assignedToClient?._id === loggedInClientId,
        );
      } else if (!isSuperOrAdmin && loggedInClientId) {
        filteredTasks = filteredTasks.filter(
          (task) =>
            task?.assignee?.some((user) => user._id === loggedInClientId) ||
            task?.assignees?.some(
              (assignee) => assignee.user?._id === loggedInClientId,
            ),
        );
      }

      return filteredTasks;
    } catch (error) {
      console.error("Error filtering tasks:", error);
      return [];
    }
  }, [tasks, isSuperOrAdmin, isClient, loggedInClientId]);

  // Apply search and filters with debouncing (client-side for display)
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
          localStatusFilter === "all" || task.status === localStatusFilter;
        const matchesPriority =
          localPriorityFilter === "all" || task.taskPriority === localPriorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      });
    } catch (error) {
      console.error("Error filtering tasks:", error);
      return [];
    }
  }, [filteredTasksByRole, searchText, localStatusFilter, localPriorityFilter]);

  // Statistics with error handling
  const taskStats = useMemo(() => {
    try {
      const total = filteredTasksByRole.length;
      const completed = filteredTasksByRole.filter(
        (task) => task?.status === "completed",
      ).length;
      const inProgress = filteredTasksByRole.filter(
        (task) => task?.status === "in-progress",
      ).length;
      const overdue = filteredTasksByRole.filter(
        (task) => task?.isOverdue,
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
                  onStatusChange={refreshTasks}
                />
              ),
            },
            {
              title: "Actions",
              key: "task-actions",
              width: 200,
              render: (_, record) => (
                <TaskActions
                  task={record}
                  userId={user?.data?._id}
                  onTaskUpdate={refreshTasks}
                />
              ),
            },
          ]
        : []),
      {
        title: "More Actions",
        key: "more-actions",
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
                    onOk: () => handleDeleteTask(record?.id),
                  });
                },
              },
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
      refreshTasks,
      handleDeleteTask,
    ],
  );

  // Mobile-optimized TaskCard component with better spacing
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
                onOk: () => handleDeleteTask(task.id),
              });
            },
          },
        ]
      }

      return (
        <Card
          className="task-card h-full hover:shadow-lg transition-all duration-200 border border-gray-200"
          size="small"
          bodyStyle={{ padding: isMobile ? "16px" : "20px" }}>
          {/* Header: Status and Priority Tags */}
          <div className="flex justify-between items-start mb-4 gap-2">
            <Tag
              color={statusConfig.color}
              icon={statusConfig.icon}
              className="text-xs px-2 py-1">
              {statusConfig.text}
            </Tag>
            <Tag
              color={getPriorityColor(task.taskPriority)}
              className="capitalize text-xs px-2 py-1">
              {task.taskPriority || "N/A"}
            </Tag>
          </div>

          {/* Task Title */}
          <Link to={`${task.id}/details`} className="block mb-3">
            <h3 className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-2 text-base md:text-lg leading-tight">
              {task.title || "Untitled Task"}
            </h3>
          </Link>

          {/* Task Description */}
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Assignees and Due Date Info */}
          <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <UserOutlined className="flex-shrink-0 text-gray-400" />
              <span className="text-gray-700 truncate">
                {task.assignees?.length > 0 ? (
                  <>
                    <strong>{task.assignees.length}</strong> assignee
                    {task.assignees.length > 1 ? "s" : ""}
                  </>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <ClockCircleOutlined className="flex-shrink-0 text-gray-400" />
              <span
                className={
                  task.isOverdue
                    ? "text-red-600 font-semibold"
                    : "text-gray-700"
                }>
                {task.isOverdue && "⚠️ "}
                {formatDate(task.dueDate)}
                {task.isOverdue && " (Overdue)"}
              </span>
            </div>

            {task.referenceDocuments?.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <FileTextOutlined className="flex-shrink-0 text-gray-400" />
                <span className="text-gray-700">
                  {task.referenceDocuments.length} document
                  {task.referenceDocuments.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Task Status Flow - Collapsible for mobile */}
          <Collapse
            ghost
            size="small"
            className="mb-3 task-status-collapse"
            items={[
              {
                key: "status",
                label: (
                  <span className="text-sm font-medium text-gray-700">
                    Status Management
                  </span>
                ),
                children: (
                  <div className="py-2">
                    <TaskStatusFlow
                      task={task}
                      userId={user?.data?._id}
                      onStatusChange={refreshTasks}
                    />
                  </div>
                ),
              },
            ]}
          />

          {/* Task Actions - Collapsible for mobile */}
          <Collapse
            ghost
            size="small"
            className="mb-4 task-actions-collapse"
            items={[
              {
                key: "actions",
                label: (
                  <span className="text-sm font-medium text-gray-700">
                    Task Operations
                  </span>
                ),
                children: (
                  <div className="py-2">
                    <TaskActions
                      task={task}
                      userId={user?.data?._id}
                      onTaskUpdate={refreshTasks}
                    />
                  </div>
                ),
              },
            ]}
          />

          {/* Action Buttons Footer */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <Space size="middle" className="flex-wrap">
              <Link to={`${task.id}/details`}>
                <Button
                  type="primary"
                  size={isMobile ? "small" : "middle"}
                  icon={<EyeOutlined />}>
                  {isMobile ? "View" : "View Details"}
                </Button>
              </Link>

              {hasEditPermission && (
                <Link to={`${task.id}/update`}>
                  <Button
                    size={isMobile ? "small" : "middle"}
                    icon={<EditOutlined />}>
                    Edit
                  </Button>
                </Link>
              )}
            </Space>

            <Dropdown
              menu={{ items: cardMenuItems }}
              placement="bottomRight"
              trigger={["click"]}>
              <Button
                type="text"
                size={isMobile ? "small" : "middle"}
                icon={<MoreOutlined />}
              />
            </Dropdown>
          </div>
        </Card>
      );
    },
    [
      getStatusConfig,
      getPriorityColor,
      canEdit,
      isMobile,
      handleDeleteTask,
      user?.data?._id,
      refreshTasks,
    ],
  );
      }

      return (
        <Card
          className="task-card h-full hover:shadow-lg transition-all duration-200 border border-gray-200"
          size="small"
          bodyStyle={{ padding: isMobile ? "16px" : "20px" }}>
          {/* Header: Status and Priority Tags */}
          <div className="flex justify-between items-start mb-4 gap-2">
            <Tag
              color={statusConfig.color}
              icon={statusConfig.icon}
              className="text-xs px-2 py-1">
              {statusConfig.text}
            </Tag>
            <Tag
              color={getPriorityColor(task.taskPriority)}
              className="capitalize text-xs px-2 py-1">
              {task.taskPriority || "N/A"}
            </Tag>
          </div>

          {/* Task Title */}
          <Link to={`${task.id}/details`} className="block mb-3">
            <h3 className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-2 text-base md:text-lg leading-tight">
              {task.title || "Untitled Task"}
            </h3>
          </Link>

          {/* Task Description */}
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Assignees and Due Date Info */}
          <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <UserOutlined className="flex-shrink-0 text-gray-400" />
              <span className="text-gray-700 truncate">
                {task.assignees?.length > 0 ? (
                  <>
                    <strong>{task.assignees.length}</strong> assignee
                    {task.assignees.length > 1 ? "s" : ""}
                  </>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <ClockCircleOutlined className="flex-shrink-0 text-gray-400" />
              <span
                className={
                  task.isOverdue
                    ? "text-red-600 font-semibold"
                    : "text-gray-700"
                }>
                {task.isOverdue && "⚠️ "}
                {formatDate(task.dueDate)}
                {task.isOverdue && " (Overdue)"}
              </span>
            </div>

            {task.referenceDocuments?.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <FileTextOutlined className="flex-shrink-0 text-gray-400" />
                <span className="text-gray-700">
                  {task.referenceDocuments.length} document
                  {task.referenceDocuments.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Task Status Flow - Collapsible for mobile */}
          <Collapse
            ghost
            size="small"
            className="mb-3 task-status-collapse"
            items={[
              {
                key: "status",
                label: (
                  <span className="text-sm font-medium text-gray-700">
                    Status Management
                  </span>
                ),
                children: (
                  <div className="py-2">
                    <TaskStatusFlow
                      task={task}
                      userId={user?.data?._id}
                      onStatusChange={() => fetchData("tasks", "tasks")}
                    />
                  </div>
                ),
              },
            ]}
          />

          {/* Task Actions - Collapsible for mobile */}
          <Collapse
            ghost
            size="small"
            className="mb-4 task-actions-collapse"
            items={[
              {
                key: "actions",
                label: (
                  <span className="text-sm font-medium text-gray-700">
                    Task Operations
                  </span>
                ),
                children: (
                  <div className="py-2">
                    <TaskActions
                      task={task}
                      userId={user?.data?._id}
                      onTaskUpdate={() => fetchData("tasks", "tasks")}
                    />
                  </div>
                ),
              },
            ]}
          />

          {/* Action Buttons Footer */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <Space size="middle" className="flex-wrap">
              <Link to={`${task.id}/details`}>
                <Button
                  type="primary"
                  size={isMobile ? "small" : "middle"}
                  icon={<EyeOutlined />}>
                  {isMobile ? "View" : "View Details"}
                </Button>
              </Link>

              {hasEditPermission && (
                <Link to={`${task.id}/update`}>
                  <Button
                    size={isMobile ? "small" : "middle"}
                    icon={<EditOutlined />}>
                    Edit
                  </Button>
                </Link>
              )}
            </Space>

            <Dropdown
              menu={{ items: cardMenuItems }}
              placement="bottomRight"
              trigger={["click"]}>
              <Button
                type="text"
                size={isMobile ? "small" : "middle"}
                icon={<MoreOutlined />}
              />
            </Dropdown>
          </div>
        </Card>
      );
    },
    [
      getStatusConfig,
      getPriorityColor,
      canEdit,
      isMobile,
      deleteTask,
      user?.data?._id,
      fetchData,
    ],
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
            value={localStatusFilter}
            onChange={(value) => {
              setLocalStatusFilter(value);
              setCurrentPage(1);
            }}
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
            value={localPriorityFilter}
            onChange={(value) => {
              setLocalPriorityFilter(value);
              setCurrentPage(1);
            }}
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
            setLocalStatusFilter("all");
            setLocalPriorityFilter("all");
            setSearchText("");
            setCurrentPage(1);
          }}>
          Clear All
        </Button>
      </div>
    </Drawer>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 md:p-6">
        <PageErrorAlert
          errorCondition={error}
          errorMessage={error}
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
                <Flex align="center" gap={2}>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-0 truncate">
                    Tasks
                  </h1>
                  <Tooltip title="Refresh">
                    <Button 
                      type="text" 
                      icon={<ReloadOutlined spin={loading} />} 
                      onClick={refreshTasks}
                      loading={loading}
                    />
                  </Tooltip>
                </Flex>
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
                    {(localStatusFilter !== "all" || localPriorityFilter !== "all") && (
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
                    value={localStatusFilter}
                    onChange={(value) => {
                      setLocalStatusFilter(value);
                      setCurrentPage(1);
                    }}
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
                    value={localPriorityFilter}
                    onChange={(value) => {
                      setLocalPriorityFilter(value);
                      setCurrentPage(1);
                    }}
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
                    localStatusFilter !== "all" ||
                    localPriorityFilter !== "all") && (
                    <Button
                      onClick={() => {
                        setSearchText("");
                        setLocalStatusFilter("all");
                        setLocalPriorityFilter("all");
                        setCurrentPage(1);
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
      {error ? (
        <PageErrorAlert
          errorCondition={error}
          errorMessage={error}
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
                  pageSize: pageSize,
                  current: currentPage,
                  total: pagination.total,
                  showSizeChanger: !isMobile,
                  showQuickJumper: !isMobile,
                  simple: isMobile,
                  showTotal: (total, range) =>
                    !isMobile && `${range[0]}-${range[1]} of ${total} tasks`,
                  position: ["bottomCenter"],
                  onChange: (page, pageSize) => {
                    setCurrentPage(page);
                    setPageSize(pageSize);
                  },
                  onShowSizeChange: (current, size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  },
                }}
                size={isMobile ? "small" : "middle"}
                className="task-table"
                loading={loading}
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
                      localStatusFilter !== "all" ||
                      localPriorityFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "Get started by creating your first task"}
                    </p>
                  </div>
                }>
                {isStaff &&
                  !searchText &&
                  localStatusFilter === "all" &&
                  localPriorityFilter === "all" && (
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
