import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Tabs,
  Badge,
  Avatar,
  Progress,
  Empty,
  Button,
  Space,
  Tag,
  Dropdown,
  Pagination,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  SendOutlined,
  InboxOutlined,
  DashboardOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  SyncOutlined,
  PlusOutlined,
  FilterOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  fetchTasks,
  fetchMyTasks,
  fetchOverdueTasks,
  fetchPendingReviewTasks,
  submitForReview,
  deleteTask,
  selectTasks,
  selectMyTasks,
  selectOverdueTasks,
  selectPendingReviewTasks,
  selectTaskLoading,
  selectTaskPagination,
} from "../redux/features/task/taskSlice";
import { selectUser } from "../redux/features/auth/authSlice";
import TaskReviewModal from "./TaskReviewModal";
import TaskCreateModal from "./TaskCreateModal";
import TaskFilters from "./TaskFilters";

dayjs.extend(relativeTime);

const { TabPane } = Tabs;

const STATUS_CONFIG = {
  pending: {
    color: "default",
    text: "Pending",
    bg: "bg-gray-100",
    textColor: "text-gray-600",
  },
  "in-progress": {
    color: "processing",
    text: "In Progress",
    bg: "bg-blue-100",
    textColor: "text-blue-600",
  },
  "under-review": {
    color: "orange",
    text: "Under Review",
    bg: "bg-orange-100",
    textColor: "text-orange-600",
  },
  completed: {
    color: "success",
    text: "Completed",
    bg: "bg-emerald-100",
    textColor: "text-emerald-600",
  },
  rejected: {
    color: "error",
    text: "Needs Revision",
    bg: "bg-red-100",
    textColor: "text-red-600",
  },
  overdue: {
    color: "error",
    text: "Overdue",
    bg: "bg-red-100",
    textColor: "text-red-600",
  },
  cancelled: {
    color: "default",
    text: "Cancelled",
    bg: "bg-gray-100",
    textColor: "text-gray-600",
  },
};

const PRIORITY_CONFIG = {
  urgent: {
    color: "red",
    label: "Urgent",
    bg: "bg-red-50",
    border: "border-l-red-500",
  },
  high: {
    color: "orange",
    label: "High",
    bg: "bg-orange-50",
    border: "border-l-orange-500",
  },
  medium: {
    color: "blue",
    label: "Medium",
    bg: "bg-blue-50",
    border: "border-l-blue-500",
  },
  low: {
    color: "default",
    label: "Low",
    bg: "bg-gray-50",
    border: "border-l-gray-300",
  },
};

const StatCard = ({ icon: Icon, value, label, gradient, badge }) => (
  <Card
    className={`bg-gradient-to-br ${gradient} border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-white/80">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </div>
      <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
        <Icon className="text-xl" />
      </div>
    </div>
    {badge && (
      <div className="mt-2">
        <Badge
          count={badge}
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
        />
      </div>
    )}
  </Card>
);

const TaskDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const tasks = useSelector(selectTasks);
  const myTasks = useSelector(selectMyTasks);
  const overdueTasks = useSelector(selectOverdueTasks);
  const pendingReviewTasks = useSelector(selectPendingReviewTasks);
  const loading = useSelector(selectTaskLoading);
  const pagination = useSelector(selectTaskPagination);

  const [activeTab, setActiveTab] = useState("myTasks");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const userId = user?._id || user?.data?._id;

  useEffect(() => {
    loadTasks();
  }, [page, pageSize, activeTab]);

  const loadTasks = useCallback(() => {
    const params = { page, limit: pageSize };
    switch (activeTab) {
      case "myTasks":
        dispatch(fetchMyTasks(params));
        break;
      case "assignedByMe":
        dispatch(
          fetchTasks({ ...params, assignedTo: userId, isClient: "false" }),
        );
        break;
      case "overdue":
        dispatch(fetchOverdueTasks(params));
        break;
      case "pendingReview":
        dispatch(fetchPendingReviewTasks(params));
        break;
      default:
        dispatch(fetchTasks(params));
    }
  }, [dispatch, page, pageSize, activeTab, userId]);

  const getTaskStatus = useCallback((task) => {
    if (task.status === "completed") return STATUS_CONFIG.completed;
    if (
      task.dueDate &&
      dayjs(task.dueDate).isBefore(dayjs()) &&
      task.status !== "completed"
    )
      return STATUS_CONFIG.overdue;
    return STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  }, []);

  const canSubmitForReview = useCallback(
    (task) => {
      if (!task?.assignees) return false;
      const isAssigned = task.assignees.some(
        (a) => (a.user?._id || a.user) === userId,
      );
      return isAssigned && ["in-progress", "rejected"].includes(task.status);
    },
    [userId],
  );

  const canReviewTask = useCallback(
    (task) => {
      if (!task) return false;
      const isCreator = task.createdBy?._id === userId;
      const isAssignedBy = task.assignees?.some(
        (a) => (a.assignedBy?._id || a.assignedBy) === userId,
      );
      return (isCreator || isAssignedBy) && task.status === "under-review";
    },
    [userId],
  );

  const handleSubmitForReview = useCallback(
    (taskId) => {
      dispatch(
        submitForReview({
          taskId,
          data: { comment: "Submitted from dashboard" },
        }),
      )
        .unwrap()
        .then(() => loadTasks())
        .catch(() => {});
    },
    [dispatch, loadTasks],
  );

  const handleDeleteTask = useCallback(
    (taskId) => {
      dispatch(deleteTask(taskId))
        .unwrap()
        .then(() => loadTasks())
        .catch(() => {});
    },
    [dispatch, loadTasks],
  );

  const getActionMenu = useCallback(
    (task) => {
      const items = [
        {
          key: "view",
          icon: <EyeOutlined />,
          label: "View Details",
          onClick: () => navigate(`/dashboard/tasks/${task._id}`),
        },
      ];
      if (canSubmitForReview(task)) {
        items.push({
          key: "submit-review",
          icon: <SendOutlined />,
          label: "Submit for Review",
          onClick: () => handleSubmitForReview(task._id),
        });
      }
      if (canReviewTask(task)) {
        items.push({
          key: "review",
          icon: <FileTextOutlined />,
          label: "Review Task",
          onClick: () => {
            setSelectedTask(task);
            setReviewModalOpen(true);
          },
        });
      }
      if (task.createdBy?._id === userId) {
        items.push({
          key: "edit",
          icon: <EditOutlined />,
          label: "Edit Task",
          onClick: () => navigate(`/dashboard/tasks/${task._id}/edit`),
        });
        items.push({ type: "divider" });
        items.push({
          key: "delete",
          icon: <DeleteOutlined />,
          label: "Delete Task",
          danger: true,
          onClick: () => handleDeleteTask(task._id),
        });
      }
      return items;
    },
    [
      navigate,
      canSubmitForReview,
      canReviewTask,
      handleSubmitForReview,
      handleDeleteTask,
      userId,
    ],
  );

  const currentTasks = useMemo(() => {
    switch (activeTab) {
      case "myTasks":
        return myTasks;
      case "overdue":
        return overdueTasks;
      case "pendingReview":
        return pendingReviewTasks;
      default:
        return tasks;
    }
  }, [activeTab, myTasks, overdueTasks, pendingReviewTasks, tasks]);

  const stats = useMemo(() => {
    const allTasks = [...myTasks, ...overdueTasks];
    return {
      total: allTasks.length,
      completed: allTasks.filter((t) => t.status === "completed").length,
      pendingReview: pendingReviewTasks.length,
      overdue: overdueTasks.length,
      myTasksCount: myTasks.length,
    };
  }, [myTasks, overdueTasks, pendingReviewTasks]);

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const renderTaskCard = (task) => {
    const status = getTaskStatus(task);
    const priority =
      PRIORITY_CONFIG[task.taskPriority] || PRIORITY_CONFIG.medium;
    const dueDateDisplay = task.dueDate
      ? dayjs(task.dueDate).format("MMM D, YYYY")
      : "No due date";
    const isOverdue = status.text === "Overdue";

    return (
      <Card
        key={task._id}
        size="small"
        className={`mb-3 hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${priority.border} bg-white`}
        onClick={() => navigate(`/dashboard/tasks/${task._id}`)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.color === "default" ? "text-gray-600" : `text-${priority.color}-600`}`}>
                {priority.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.textColor}`}>
                {status.text}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
              {task.title}
            </h4>
            {task.matter && (
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <FileTextOutlined />
                <span className="truncate">
                  {task.matter?.title || task.matter?.matterNumber}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarOutlined />
                {dueDateDisplay}
              </span>
              {task.category && (
                <span className="capitalize">
                  {task.category.replace(/-/g, " ")}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Dropdown
              menu={{ items: getActionMenu(task) }}
              trigger={["click"]}
              placement="bottomRight"
              onClick={(e) => e.stopPropagation()}>
              <Button type="text" icon={<MoreOutlined />} size="small" />
            </Dropdown>
            {task.assignees && task.assignees.length > 0 && (
              <Avatar.Group
                maxCount={3}
                maxStyle={{
                  backgroundColor: "#6366f1",
                  color: "#fff",
                  fontSize: 10,
                }}>
                {task.assignees.map((a, i) => (
                  <Avatar
                    key={i}
                    src={a.user?.photo}
                    style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
                    {a.user?.firstName?.[0]}
                  </Avatar>
                ))}
              </Avatar.Group>
            )}
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {task.description}
          </p>
        )}
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div className="text-center">
          <p className="text-gray-600 font-medium mb-1">
            {activeTab === "myTasks" && "No Tasks Assigned to You"}
            {activeTab === "assignedByMe" && "No Tasks Assigned by You"}
            {activeTab === "overdue" && "No Overdue Tasks"}
            {activeTab === "pendingReview" && "No Tasks Pending Review"}
          </p>
          <p className="text-gray-400 text-xs">
            {activeTab === "myTasks" && "You don't have any assigned tasks"}
            {activeTab === "assignedByMe" && "Create a task to get started"}
            {activeTab === "overdue" && "All tasks are on track!"}
            {activeTab === "pendingReview" && "No tasks awaiting your review"}
          </p>
        </div>
      }>
      <Button type="primary" onClick={() => setCreateModalOpen(true)}>
        <PlusOutlined /> Create Task
      </Button>
    </Empty>
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <StatCard
            icon={InboxOutlined}
            value={stats.total}
            label="My Tasks"
            gradient="from-blue-500 to-blue-600"
            badge={stats.total}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={CheckCircleOutlined}
            value={stats.completed}
            label="Completed"
            gradient="from-emerald-500 to-emerald-600"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={FileTextOutlined}
            value={stats.pendingReview}
            label="Pending Review"
            gradient="from-orange-500 to-orange-600"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={WarningOutlined}
            value={stats.overdue}
            label="Overdue"
            gradient={
              stats.overdue > 0
                ? "from-red-500 to-red-600"
                : "from-gray-400 to-gray-500"
            }
          />
        </Col>
      </Row>

      <Card
        className="shadow-lg border-0 rounded-2xl overflow-hidden"
        styles={{ body: { padding: 0 } }}>
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <DashboardOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Task Dashboard
                </h3>
                <p className="text-xs text-gray-500">
                  Manage and track all your tasks in one place
                </p>
              </div>
            </div>
            <Space wrap>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? "primary" : "default"}>
                Filters
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
                className="!bg-gradient-to-r from-blue-500 to-indigo-600 !border-0">
                New Task
              </Button>
            </Space>
          </div>

          <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Completion Rate
              </span>
              <span
                className={`text-lg font-bold ${completionRate >= 75 ? "text-green-600" : completionRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                {completionRate}%
              </span>
            </div>
            <Progress
              percent={completionRate}
              showInfo={false}
              strokeColor={
                completionRate >= 75
                  ? "#10b981"
                  : completionRate >= 50
                    ? "#f59e0b"
                    : "#ef4444"
              }
              trailColor="#e5e7eb"
              size="small"
            />
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <TaskFilters onFilterChange={loadTasks} showAdvanced={true} />
          </div>
        )}

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPage(1);
          }}
          className="px-4 pt-3"
          size="small">
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <InboxOutlined />
                My Tasks
                {stats.myTasksCount > 0 && (
                  <Badge count={stats.myTasksCount} size="small" />
                )}
              </span>
            }
            key="myTasks"
          />
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <SendOutlined />
                Assigned by Me
              </span>
            }
            key="assignedByMe"
          />
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <ExclamationCircleOutlined />
                Overdue
                {stats.overdue > 0 && (
                  <Badge count={stats.overdue} size="small" color="red" />
                )}
              </span>
            }
            key="overdue"
          />
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <FileTextOutlined />
                Pending Review
                {stats.pendingReview > 0 && (
                  <Badge
                    count={stats.pendingReview}
                    size="small"
                    color="orange"
                  />
                )}
              </span>
            }
            key="pendingReview"
          />
        </Tabs>

        <div className="p-4 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentTasks.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="space-y-2">
                {currentTasks.map(renderTaskCard)}
              </div>
              {pagination.total > pageSize && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={pagination.total}
                    onChange={(p, ps) => {
                      setPage(p);
                      setPageSize(ps);
                    }}
                    showSizeChanger
                    showTotal={(total) => `${total} tasks`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {selectedTask && (
        <TaskReviewModal
          task={selectedTask}
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedTask(null);
            loadTasks();
          }}
          currentUserId={userId}
        />
      )}
      <TaskCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadTasks}
      />
    </div>
  );
};

export default TaskDashboard;
