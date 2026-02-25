// TaskList.jsx
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { formatDate } from "../utils/formatDate";
import { useAdminHook } from "../hooks/useAdminHook";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
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
  Avatar,
  Typography,
  Divider,
  Progress,
  Alert,
  Spin,
  Result,
  message,
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
  PlusOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  FlagOutlined,
  TeamOutlined,
  BellOutlined,
  StarOutlined,
  StarFilled,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ClearOutlined,
} from "@ant-design/icons";

// Import Redux slice directly
import {
  fetchTasks,
  deleteTask,
  selectTasks,
  selectTaskLoading,
  selectTaskActionLoading,
  selectTaskError,
  selectTaskPagination,
} from "../redux/features/task/taskSlice";

// Lazy load components
const TaskReminderForm = lazy(() => import("./TaskReminderForm"));
const TaskActions = lazy(() => import("./TaskActions"));
const TaskStatusFlow = lazy(() => import("./TaskStatusFlow"));
const CreateTaskForm = lazy(() => import("../pages/CreateTaskForm"));

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Color constants
const COLORS = {
  urgent: "#f5222d",
  high: "#fa8c16",
  medium: "#1890ff",
  low: "#52c41a",
  overdue: "#cf1322",
  pending: "#faad14",
  inProgress: "#1890ff",
  underReview: "#722ed1",
  completed: "#52c41a",
  rejected: "#f5222d",
};

const TaskList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state directly
  const tasks = useSelector(selectTasks);
  const loading = useSelector(selectTaskLoading);
  const actionLoading = useSelector(selectTaskActionLoading);
  const error = useSelector(selectTaskError);
  const pagination = useSelector(selectTaskPagination);
  const { user } = useSelector((state) => state.auth);

  // Hooks
  useRedirectLogoutUser("/users/login");
  const { isSuperOrAdmin, isStaff, isClient } = useAdminHook();

  // Local state
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("taskViewMode") || "card";
  });
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem("favoriteTasks") || "[]");
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load tasks on mount and when filters change
  useEffect(() => {
    const params = {
      page,
      limit: pageSize,
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      search: searchText || undefined,
    };
    dispatch(fetchTasks(params));
  }, [
    dispatch,
    page,
    pageSize,
    statusFilter,
    priorityFilter,
    categoryFilter,
    searchText,
  ]);

  // Responsive handling
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

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("taskViewMode", viewMode);
  }, [viewMode]);

  // Save favorites
  useEffect(() => {
    localStorage.setItem("favoriteTasks", JSON.stringify(favorites));
  }, [favorites]);

  // Handle delete
  const handleDelete = useCallback(
    async (taskId, taskTitle) => {
      Modal.confirm({
        title: "Delete Task",
        icon: <ExclamationCircleOutlined className="text-red-500" />,
        content: (
          <div>
            <p>Are you sure you want to delete this task?</p>
            <Text strong>{taskTitle}</Text>
            <p className="text-xs text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </div>
        ),
        okText: "Delete",
        okType: "danger",
        cancelText: "Cancel",
        centered: isMobile,
        onOk: async () => {
          try {
            await dispatch(deleteTask(taskId)).unwrap();
            message.success("Task deleted successfully");
          } catch (error) {
            message.error(error || "Failed to delete task");
          }
        },
      });
    },
    [dispatch, isMobile],
  );

  // Toggle favorite
  const toggleFavorite = useCallback((taskId) => {
    setFavorites((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  }, []);

  // Filter tasks by user role
  const filteredTasksByRole = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];

    const loggedInUserId = user?.data?._id || user?._id;

    if (isClient) {
      return tasks.filter((task) => {
        const isAssignedToClient = task.assignees?.some(
          (a) => a.user?._id === loggedInUserId || a.user === loggedInUserId,
        );
        const isCreatedByClient = task.createdBy?._id === loggedInUserId;
        return isAssignedToClient || isCreatedByClient;
      });
    }

    if (!isSuperOrAdmin) {
      return tasks.filter((task) => {
        const isAssigned = task.assignees?.some(
          (a) => a.user?._id === loggedInUserId || a.user === loggedInUserId,
        );
        const isCreatedBy = task.createdBy?._id === loggedInUserId;
        return isAssigned || isCreatedBy;
      });
    }

    return tasks;
  }, [tasks, isSuperOrAdmin, isClient, user]);

  // Apply search and filters
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = filteredTasksByRole.filter((task) => {
      if (!task) return false;

      const searchLower = searchText.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.customCaseReference?.toLowerCase().includes(searchLower) ||
        task.matter?.title?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "dueDate") {
        comparison = new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (sortBy === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        comparison =
          (priorityOrder[a.taskPriority] || 99) -
          (priorityOrder[b.taskPriority] || 99);
      } else if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [filteredTasksByRole, searchText, sortBy, sortOrder]);

  // Task statistics
  const taskStats = useMemo(() => {
    const total = filteredTasksByRole.length;
    const completed = filteredTasksByRole.filter(
      (t) => t.status === "completed",
    ).length;
    const inProgress = filteredTasksByRole.filter(
      (t) => t.status === "in-progress",
    ).length;
    const overdue = filteredTasksByRole.filter((t) => t.isOverdue).length;
    const pending = filteredTasksByRole.filter(
      (t) => t.status === "pending",
    ).length;
    const underReview = filteredTasksByRole.filter(
      (t) => t.status === "under-review",
    ).length;
    const urgent = filteredTasksByRole.filter(
      (t) => t.taskPriority === "urgent",
    ).length;

    return {
      total,
      completed,
      inProgress,
      overdue,
      pending,
      underReview,
      urgent,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [filteredTasksByRole]);

  // Status configuration
  const getStatusConfig = useCallback((status, isOverdue) => {
    if (isOverdue) {
      return {
        color: COLORS.overdue,
        icon: <ExclamationCircleOutlined />,
        text: "Overdue",
        badge: "error",
      };
    }

    const configs = {
      completed: {
        color: COLORS.completed,
        icon: <CheckCircleOutlined />,
        text: "Completed",
        badge: "success",
      },
      "in-progress": {
        color: COLORS.inProgress,
        icon: <SyncOutlined spin />,
        text: "In Progress",
        badge: "processing",
      },
      "under-review": {
        color: COLORS.underReview,
        icon: <EyeOutlined />,
        text: "Under Review",
        badge: "warning",
      },
      pending: {
        color: COLORS.pending,
        icon: <ClockCircleOutlined />,
        text: "Pending",
        badge: "default",
      },
      rejected: {
        color: COLORS.rejected,
        icon: <ExclamationCircleOutlined />,
        text: "Rejected",
        badge: "error",
      },
    };

    return configs[status] || configs.pending;
  }, []);

  // Priority configuration
  const getPriorityConfig = useCallback((priority) => {
    const configs = {
      urgent: { color: COLORS.urgent, label: "Urgent", icon: <FlagOutlined /> },
      high: { color: COLORS.high, label: "High", icon: <FlagOutlined /> },
      medium: { color: COLORS.medium, label: "Medium", icon: <FlagOutlined /> },
      low: { color: COLORS.low, label: "Low", icon: <FlagOutlined /> },
    };
    return (
      configs[priority] || {
        color: "#d9d9d9",
        label: priority || "N/A",
        icon: <FlagOutlined />,
      }
    );
  }, []);

  // Permission check
  const canEdit = useCallback(
    (task) => {
      if (!task || !user?.data?._id) return false;
      const currentUserId = user.data._id;
      const createdBy =
        typeof task.createdBy === "object"
          ? task.createdBy?._id
          : task.createdBy;
      return currentUserId === createdBy || isSuperOrAdmin;
    },
    [user?.data?._id, isSuperOrAdmin],
  );

  // Table columns
  const columns = useMemo(
    () => [
      {
        title: (
          <Space>
            <StarOutlined />
            <span>Task</span>
          </Space>
        ),
        dataIndex: "title",
        key: "title",
        width: isMobile ? 180 : 300,
        fixed: isMobile ? "left" : false,
        render: (text, record) => (
          <div className="flex items-start gap-2">
            <Button
              type="text"
              icon={
                favorites.includes(record._id) ? (
                  <StarFilled className="text-yellow-400" />
                ) : (
                  <StarOutlined className="text-gray-300" />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(record._id);
              }}
              size="small"
              className="p-0 hover:bg-transparent"
            />
            <div>
              <Link
                to={`/dashboard/tasks/${record._id}`}
                className="text-blue-600 hover:text-blue-800 font-medium line-clamp-2 text-sm md:text-base">
                {text || "Untitled Task"}
              </Link>
              {record.description && !isMobile && (
                <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {record.description}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: isMobile ? 90 : 120,
        render: (status, record) => {
          const config = getStatusConfig(status, record.isOverdue);
          return (
            <Tooltip title={config.text}>
              <Tag
                color={config.color}
                icon={config.icon}
                className="flex items-center gap-1 text-xs px-2 py-1">
                <span className={isMobile ? "hidden sm:inline" : ""}>
                  {config.text}
                </span>
              </Tag>
            </Tooltip>
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
              render: (priority) => {
                const config = getPriorityConfig(priority);
                return (
                  <Tag
                    color={config.color}
                    className="capitalize text-xs px-2 py-1"
                    icon={config.icon}>
                    {config.label}
                  </Tag>
                );
              },
            },
            {
              title: "Category",
              dataIndex: "category",
              key: "category",
              width: 120,
              render: (category) => (
                <Tag className="capitalize text-xs">{category || "N/A"}</Tag>
              ),
            },
            {
              title: "Assigned To",
              dataIndex: "assignees",
              key: "assignees",
              width: 150,
              render: (assignees) => {
                if (!assignees?.length) {
                  return (
                    <span className="text-gray-400 text-xs">Unassigned</span>
                  );
                }

                return (
                  <Avatar.Group
                    maxCount={3}
                    size="small"
                    maxPopoverTrigger="hover"
                    maxStyle={{
                      backgroundColor: "#1890ff",
                      cursor: "pointer",
                    }}>
                    {assignees.map((assignee, index) => {
                      const userData = assignee.user;
                      const userName =
                        userData?.firstName || userData?.email || "User";
                      const initial = userName.charAt(0).toUpperCase();
                      return (
                        <Tooltip
                          key={index}
                          title={`${userName} ${assignee.role === "primary" ? "(Primary)" : ""}`}>
                          <Avatar
                            style={{
                              backgroundColor: assignee.isClient
                                ? "#52c41a"
                                : "#1890ff",
                            }}>
                            {initial}
                          </Avatar>
                        </Tooltip>
                      );
                    })}
                  </Avatar.Group>
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
              title: "Progress",
              key: "progress",
              width: 120,
              render: (_, record) => {
                const steps = {
                  pending: 0,
                  "in-progress": 33,
                  "under-review": 66,
                  completed: 100,
                };
                const progress = steps[record.status] || 0;
                return (
                  <Tooltip title={`${progress}% Complete`}>
                    <Progress
                      percent={progress}
                      size="small"
                      showInfo={false}
                      strokeColor={
                        record.status === "completed" ? "#52c41a" : "#1890ff"
                      }
                    />
                  </Tooltip>
                );
              },
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
          const isFavorite = favorites.includes(record._id);

          const menuItems = [
            {
              key: "view",
              icon: <EyeOutlined />,
              label: "View Details",
              onClick: () => navigate(`/dashboard/tasks/${record._id}/details`),
            },
            {
              key: "favorite",
              icon: isFavorite ? (
                <StarFilled className="text-yellow-400" />
              ) : (
                <StarOutlined />
              ),
              label: isFavorite ? "Remove from Favorites" : "Add to Favorites",
              onClick: () => toggleFavorite(record._id),
            },
          ];

          if (hasEditPermission) {
            menuItems.push(
              { type: "divider" },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit Task",
                onClick: () => navigate(`/dashboard/tasks/${record._id}/edit`),
              },
              {
                key: "reminder",
                icon: <BellOutlined />,
                label: (
                  <Suspense fallback="Set Reminder">
                    <TaskReminderForm id={record._id} />
                  </Suspense>
                ),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete Task",
                danger: true,
                onClick: () => handleDelete(record._id, record.title),
              },
            );
          }

          return (
            <Space size="small">
              {!isMobile && (
                <>
                  <Tooltip title="View Details">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      size="small"
                      onClick={() =>
                        navigate(`/dashboard/tasks/${record._id}/details`)
                      }
                    />
                  </Tooltip>
                  {hasEditPermission && (
                    <Tooltip title="Edit Task">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        className="text-blue-500"
                        onClick={() =>
                          navigate(`/dashboard/tasks/${record._id}/edit`)
                        }
                      />
                    </Tooltip>
                  )}
                </>
              )}
              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight">
                <Button type="text" icon={<MoreOutlined />} size="small" />
              </Dropdown>
            </Space>
          );
        },
      },
    ],
    [
      isMobile,
      favorites,
      toggleFavorite,
      getStatusConfig,
      getPriorityConfig,
      user,
      canEdit,
      navigate,
      handleDelete,
    ],
  );

  // Task Card Component
  const TaskCard = useCallback(
    ({ task }) => {
      if (!task) return null;

      const statusConfig = getStatusConfig(task.status, task.isOverdue);
      const priorityConfig = getPriorityConfig(task.taskPriority);
      const hasEditPermission = canEdit(task);
      const isFavorite = favorites.includes(task._id);

      return (
        <Card
          className="task-card group hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-200 overflow-hidden"
          styles={{ body: { padding: 0 } }}
          actions={[
            <Tooltip title="View Details">
              <EyeOutlined
                onClick={() => navigate(`/dashboard/tasks/${task._id}`)}
                className="hover:text-blue-500"
              />
            </Tooltip>,
            <Tooltip
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
              {isFavorite ? (
                <StarFilled
                  onClick={() => toggleFavorite(task._id)}
                  className="text-yellow-400 hover:text-yellow-500"
                />
              ) : (
                <StarOutlined
                  onClick={() => toggleFavorite(task._id)}
                  className="hover:text-yellow-400"
                />
              )}
            </Tooltip>,
            hasEditPermission && (
              <Tooltip title="Edit">
                <EditOutlined
                  onClick={() => navigate(`/dashboard/tasks/${task._id}/edit`)}
                  className="hover:text-blue-500"
                />
              </Tooltip>
            ),
            hasEditPermission && (
              <Tooltip title="Delete">
                <DeleteOutlined
                  onClick={() => handleDelete(task._id, task.title)}
                  className="hover:text-red-500"
                />
              </Tooltip>
            ),
          ].filter(Boolean)}>
          <div className="p-4">
            {/* Header with status and priority */}
            <div className="flex justify-between items-start mb-3">
              <Badge.Ribbon
                text={statusConfig.text}
                color={statusConfig.color}
                className="text-xs">
                <div className="pt-6" />
              </Badge.Ribbon>
              <Tag
                color={priorityConfig.color}
                icon={priorityConfig.icon}
                className="capitalize text-xs px-2 py-1 ml-2">
                {priorityConfig.label}
              </Tag>
            </div>

            {/* Title */}
            <Link
              to={`/dashboard/tasks/${task._id}`}
              className="block mb-3 group-hover:text-blue-600 transition-colors">
              <Title level={5} className="!mb-1 line-clamp-2">
                {task.title || "Untitled Task"}
              </Title>
            </Link>

            {/* Description */}
            {task.description && (
              <Text
                type="secondary"
                className="text-sm block mb-4 line-clamp-2">
                {task.description}
              </Text>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarOutlined className="text-gray-400" />
                <span
                  className={
                    task.isOverdue
                      ? "text-red-500 font-medium"
                      : "text-gray-600"
                  }>
                  {formatDate(task.dueDate)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <TeamOutlined className="text-gray-400" />
                <span className="text-gray-600">
                  {task.assignees?.length || 0} assignee
                  {task.assignees?.length !== 1 ? "s" : ""}
                </span>
              </div>

              {task.category && (
                <div className="flex items-center gap-2 text-sm">
                  <FileTextOutlined className="text-gray-400" />
                  <Tag className="text-xs capitalize">{task.category}</Tag>
                </div>
              )}

              {task.referenceDocuments?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <FileTextOutlined className="text-gray-400" />
                  <span className="text-gray-600">
                    {task.referenceDocuments.length} file
                    {task.referenceDocuments.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>
                  {task.status === "completed"
                    ? "100"
                    : task.status === "in-progress"
                      ? "33"
                      : task.status === "under-review"
                        ? "66"
                        : "0"}
                  %
                </span>
              </div>
              <Progress
                percent={
                  task.status === "completed"
                    ? 100
                    : task.status === "in-progress"
                      ? 33
                      : task.status === "under-review"
                        ? 66
                        : 0
                }
                size="small"
                showInfo={false}
                strokeColor={
                  task.status === "completed" ? "#52c41a" : "#1890ff"
                }
              />
            </div>

            {/* Assignee Avatars */}
            {task.assignees?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Avatar.Group
                    maxCount={5}
                    size="small"
                    maxPopoverTrigger="hover">
                    {task.assignees.map((assignee, index) => {
                      const userData = assignee.user;
                      const userName =
                        userData?.firstName || userData?.email || "User";
                      const initial = userName.charAt(0).toUpperCase();
                      return (
                        <Tooltip
                          key={index}
                          title={`${userName} ${assignee.role === "primary" ? "(Primary)" : ""}`}>
                          <Avatar
                            style={{
                              backgroundColor: assignee.isClient
                                ? "#52c41a"
                                : "#1890ff",
                            }}>
                            {initial}
                          </Avatar>
                        </Tooltip>
                      );
                    })}
                  </Avatar.Group>
                </div>
              </div>
            )}

            {/* Status Flow */}
            <Collapse
              ghost
              size="small"
              className="bg-gray-50 rounded-lg"
              items={[
                {
                  key: "status",
                  label: <Text type="secondary">Status Management</Text>,
                  children: (
                    <Suspense fallback={<Spin size="small" />}>
                      <TaskStatusFlow
                        task={task}
                        userId={user?.data?._id}
                        onStatusChange={() => {
                          dispatch(fetchTasks({ page, limit: pageSize }));
                        }}
                      />
                    </Suspense>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      );
    },
    [
      favorites,
      getStatusConfig,
      getPriorityConfig,
      canEdit,
      navigate,
      handleDelete,
      toggleFavorite,
      user,
      dispatch,
      page,
      pageSize,
    ],
  );

  // Filter Drawer Component
  const FilterDrawer = () => (
    <Drawer
      title={
        <Space>
          <FilterOutlined />
          <span>Filters</span>
        </Space>
      }
      placement="right"
      onClose={() => setFilterDrawerVisible(false)}
      open={filterDrawerVisible}
      width={320}
      footer={
        <div className="flex gap-2">
          <Button
            type="primary"
            block
            onClick={() => setFilterDrawerVisible(false)}
            icon={<SearchOutlined />}>
            Apply Filters
          </Button>
          <Button
            block
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setCategoryFilter("all");
              setSearchText("");
              setSortBy("dueDate");
              setSortOrder("asc");
            }}
            icon={<ClearOutlined />}>
            Clear
          </Button>
        </div>
      }>
      <div className="space-y-6">
        <div>
          <Text strong className="block mb-2">
            Search
          </Text>
          <Search
            placeholder="Search tasks..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <Text strong className="block mb-2">
            Status
          </Text>
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
            <Option value="rejected">Rejected</Option>
          </Select>
        </div>

        <div>
          <Text strong className="block mb-2">
            Priority
          </Text>
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
          <Text strong className="block mb-2">
            Category
          </Text>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-full"
            suffixIcon={<FilterOutlined />}>
            <Option value="all">All Categories</Option>
            <Option value="other">Other</Option>
            <Option value="general">General</Option>
            <Option value="litigation">Litigation</Option>
            <Option value="corporate">Corporate</Option>
          </Select>
        </div>

        <Divider />
        <div>
          <Text strong className="block mb-2">
            Sort By
          </Text>
          <Space direction="vertical" className="w-full">
            <Select value={sortBy} onChange={setSortBy} className="w-full">
              <Option value="dueDate">Due Date</Option>
              <Option value="createdAt">Created Date</Option>
              <Option value="priority">Priority</Option>
              <Option value="title">Title</Option>
            </Select>
            <Select
              value={sortOrder}
              onChange={setSortOrder}
              className="w-full">
              <Option value="asc">
                <Space>
                  <SortAscendingOutlined /> Ascending
                </Space>
              </Option>
              <Option value="desc">
                <Space>
                  <SortDescendingOutlined /> Descending
                </Space>
              </Option>
            </Select>
          </Space>
        </div>
      </div>
    </Drawer>
  );

  // Loading State
  if (loading && !tasks.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading tasks...">
          <div className="p-12" />
        </Spin>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Result
          status="error"
          title="Failed to Load Tasks"
          subTitle={error}
          extra={[
            <Button
              type="primary"
              key="retry"
              onClick={() => dispatch(fetchTasks({ page, limit: pageSize }))}>
              Try Again
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="task-list-container p-3 sm:p-4 md:p-6 max-w-[1920px] mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <Title level={2} className="!mb-1">
              Tasks
            </Title>
            <Text type="secondary">
              Manage and track all your tasks efficiently
            </Text>
          </div>
          {isStaff && (
            <Suspense fallback={<Button loading>Loading...</Button>}>
              <CreateTaskForm>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  className="shadow-lg hover:shadow-xl transition-shadow">
                  Create Task
                </Button>
              </CreateTaskForm>
            </Suspense>
          )}
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              className="stat-card hover:shadow-md transition-shadow"
              size="small">
              <Statistic
                title={<Text type="secondary">Total Tasks</Text>}
                value={taskStats.total}
                prefix={<FileTextOutlined className="text-blue-500" />}
                valueStyle={{
                  color: "#1890ff",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              className="stat-card hover:shadow-md transition-shadow"
              size="small">
              <Statistic
                title={<Text type="secondary">Completed</Text>}
                value={taskStats.completed}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                valueStyle={{
                  color: "#52c41a",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              className="stat-card hover:shadow-md transition-shadow"
              size="small">
              <Statistic
                title={<Text type="secondary">In Progress</Text>}
                value={taskStats.inProgress}
                prefix={<SyncOutlined className="text-blue-500" spin />}
                valueStyle={{
                  color: "#1890ff",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              className="stat-card hover:shadow-md transition-shadow"
              size="small">
              <Statistic
                title={<Text type="secondary">Overdue</Text>}
                value={taskStats.overdue}
                prefix={<ExclamationCircleOutlined className="text-red-500" />}
                valueStyle={{
                  color: "#f5222d",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              className="stat-card hover:shadow-md transition-shadow"
              size="small">
              <Statistic
                title={<Text type="secondary">Urgent</Text>}
                value={taskStats.urgent}
                prefix={<FlagOutlined className="text-orange-500" />}
                valueStyle={{
                  color: "#fa8c16",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              className="stat-card hover:shadow-md transition-shadow"
              size="small">
              <Statistic
                title={<Text type="secondary">Completion</Text>}
                value={taskStats.completionRate}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                suffix="%"
                valueStyle={{
                  color: "#52c41a",
                  fontSize: isMobile ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Search and Filters Bar */}
        <Card className="filter-card" size="small">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Search
                placeholder="Search by title, description, or reference..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size={isMobile ? "middle" : "large"}
                prefix={<SearchOutlined className="text-gray-400" />}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              {isMobile ? (
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerVisible(true)}
                  className="flex-1"
                  size="large">
                  Filters
                  {(statusFilter !== "all" ||
                    priorityFilter !== "all" ||
                    categoryFilter !== "all") && <Badge dot offset={[5, 0]} />}
                </Button>
              ) : (
                <>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Status"
                    className="min-w-[140px]"
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
                    className="min-w-[140px]"
                    suffixIcon={<FilterOutlined />}>
                    <Option value="all">All Priority</Option>
                    <Option value="urgent">Urgent</Option>
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </Select>

                  <Select
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    placeholder="Category"
                    className="min-w-[140px]"
                    suffixIcon={<FilterOutlined />}>
                    <Option value="all">All Categories</Option>
                    <Option value="other">Other</Option>
                    <Option value="general">General</Option>
                    <Option value="litigation">Litigation</Option>
                    <Option value="corporate">Corporate</Option>
                  </Select>
                </>
              )}

              <Button.Group>
                <Tooltip title="Card View">
                  <Button
                    type={viewMode === "card" ? "primary" : "default"}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode("card")}
                    size={isMobile ? "middle" : "large"}
                  />
                </Tooltip>
                <Tooltip title="Table View">
                  <Button
                    type={viewMode === "table" ? "primary" : "default"}
                    icon={<UnorderedListOutlined />}
                    onClick={() => setViewMode("table")}
                    size={isMobile ? "middle" : "large"}
                    disabled={isMobile}
                  />
                </Tooltip>
              </Button.Group>
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks Display */}
      {filteredAndSortedTasks.length > 0 ? (
        viewMode === "table" && !isMobile ? (
          <Card className="overflow-hidden shadow-sm">
            <Table
              columns={columns}
              dataSource={filteredAndSortedTasks}
              rowKey="_id"
              scroll={{ x: 1300 }}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} tasks`,
                onChange: (newPage, newPageSize) => {
                  setPage(newPage);
                  setPageSize(newPageSize);
                },
              }}
              size="middle"
              className="task-table"
              rowClassName={(record) =>
                `task-row ${record.isOverdue ? "overdue-row" : ""} ${favorites.includes(record._id) ? "favorite-row" : ""}`
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredAndSortedTasks.map((task) => (
              <Suspense key={task._id} fallback={<Card loading />}>
                <TaskCard task={task} />
              </Suspense>
            ))}
          </div>
        )
      ) : (
        <Card className="text-center py-12">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <Title level={4} type="secondary">
                  No tasks found
                </Title>
                <Text type="secondary">
                  {searchText ||
                  statusFilter !== "all" ||
                  priorityFilter !== "all" ||
                  categoryFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first task"}
                </Text>
              </Space>
            }>
            {isStaff &&
              searchText === "" &&
              statusFilter === "all" &&
              priorityFilter === "all" &&
              categoryFilter === "all" && (
                <Suspense fallback={<Button loading>Loading...</Button>}>
                  <CreateTaskForm>
                    <Button type="primary" size="large" icon={<PlusOutlined />}>
                      Create Your First Task
                    </Button>
                  </CreateTaskForm>
                </Suspense>
              )}
          </Empty>
        </Card>
      )}

      {/* Mobile Filter Drawer */}
      {isMobile && <FilterDrawer />}

      {/* CSS Styles */}
      <style jsx>{`
        .task-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .task-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
        }

        .stat-card {
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .task-row {
          transition: background-color 0.3s ease;
        }

        .task-row:hover {
          background-color: #f5f5f5;
        }

        .overdue-row {
          background-color: #fff1f0;
        }

        .overdue-row:hover {
          background-color: #ffccc7;
        }

        .favorite-row {
          background-color: #fffbe6;
        }

        .filter-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border: 1px solid #f0f0f0;
        }
      `}</style>
    </div>
  );
};

export default TaskList;
