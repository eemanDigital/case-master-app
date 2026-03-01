import PropTypes from "prop-types";
import { useState, useEffect, useMemo, useCallback } from "react";
import moment from "moment";
import {
  Card,
  Avatar,
  Progress,
  Button,
  Tabs,
  Row,
  Col,
  Tooltip,
  Dropdown,
  Modal,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  SendOutlined,
  InboxOutlined,
  DashboardOutlined,
  TeamOutlined,
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  SyncOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDataFetch } from "../hooks/useDataFetch";
import TaskReviewModal from "./TaskReviewModal";

const { TabPane } = Tabs;
const { confirm } = Modal;

const StatusBadge = ({ status, children }) => {
  const config = {
    success: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    error: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    warning: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    processing: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    default: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    },
  };
  const style = config[status] || config.default;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {children}
    </span>
  );
};

const StatCard = ({ icon: Icon, value, label, color, bgGradient, iconBg }) => (
  <div
    className={`bg-gradient-to-br ${bgGradient} p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-white/80">{label}</div>
        <div className="text-2xl font-bold text-white mt-1">{value}</div>
      </div>
      <div className={`p-3 rounded-xl ${iconBg} shadow-inner`}>
        <Icon className="text-xl text-white" />
      </div>
    </div>
  </div>
);

const TaskDashboardCard = ({ tasks, userId, onTaskUpdate }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [pageSize] = useState(5);
  const [activeTab, setActiveTab] = useState("assignedToMe");
  const [tabCurrentPage, setTabCurrentPage] = useState({
    assignedToMe: 1,
    assignedByMe: 1,
  });
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const navigate = useNavigate();
  const { dataFetcher } = useDataFetch();

  useEffect(() => {
    const updateTimeLeft = () => {
      const updated = {};
      tasks?.forEach((task) => {
        if (!task?.dueDate) return;
        const dueDate = moment(task.dueDate);
        const now = moment();
        const duration = moment.duration(dueDate.diff(now));
        if (duration.asMilliseconds() < 0) {
          updated[task._id] = { text: "Overdue", isUrgent: true };
        } else {
          const days = Math.floor(duration.asDays());
          const hours = duration.hours();
          const minutes = duration.minutes();
          if (days === 0 && hours < 24) {
            updated[task._id] = {
              text: `${hours}h ${minutes}m`,
              isUrgent: hours < 4,
            };
          } else {
            updated[task._id] = {
              text: `${days}d ${hours}h`,
              isUrgent: days < 2,
            };
          }
        }
      });
      setTimeLeft(updated);
    };
    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [tasks]);

  const tasksAssignedToMe = useMemo(
    () =>
      tasks?.filter((task) =>
        task?.assignees?.some((a) => (a.user?._id || a.user) === userId),
      ) || [],
    [tasks, userId],
  );

  const tasksAssignedByMe = useMemo(
    () =>
      tasks?.filter((task) =>
        task?.assignees?.some(
          (a) => (a.assignedBy?._id || a.assignedBy) === userId,
        ),
      ) || [],
    [tasks, userId],
  );

  const calculateStats = useCallback(
    (taskList) => {
      const total = taskList.length;
      const completed = taskList.filter(
        (t) => t.taskResponse?.[0]?.completed || t.status === "completed",
      ).length;
      const pendingReview = taskList.filter(
        (t) => t.status === "under-review",
      ).length;
      const overdue = taskList.filter((t) => {
        if (!t?.dueDate) return false;
        const dueDate = moment(t.dueDate);
        return (
          dueDate.isBefore(moment()) &&
          !(t.taskResponse?.[0]?.completed || t.status === "completed")
        );
      }).length;
      const urgent = taskList.filter(
        (t) =>
          timeLeft[t._id]?.isUrgent &&
          !(t.taskResponse?.[0]?.completed || t.status === "completed"),
      ).length;
      return { total, completed, pendingReview, overdue, urgent };
    },
    [timeLeft],
  );

  const myStats = useMemo(
    () => calculateStats(tasksAssignedToMe),
    [calculateStats, tasksAssignedToMe],
  );
  const assignedStats = useMemo(
    () => calculateStats(tasksAssignedByMe),
    [calculateStats, tasksAssignedByMe],
  );

  const myCompletionRate =
    myStats.total > 0
      ? Math.round((myStats.completed / myStats.total) * 100)
      : 0;
  const assignedCompletionRate =
    assignedStats.total > 0
      ? Math.round((assignedStats.completed / assignedStats.total) * 100)
      : 0;

  const currentTabData =
    activeTab === "assignedToMe" ? tasksAssignedToMe : tasksAssignedByMe;
  const currentStats = activeTab === "assignedToMe" ? myStats : assignedStats;
  const currentCompletionRate =
    activeTab === "assignedToMe" ? myCompletionRate : assignedCompletionRate;

  const paginatedTasks = useMemo(
    () =>
      currentTabData.slice(
        (tabCurrentPage[activeTab] - 1) * pageSize,
        tabCurrentPage[activeTab] * pageSize,
      ),
    [currentTabData, tabCurrentPage, activeTab, pageSize],
  );

  const getTaskStatus = useCallback(
    (task) => {
      if (task.taskResponse?.[0]?.completed || task.status === "completed") {
        return {
          color: "success",
          text: "Completed",
          icon: <CheckCircleFilled className="text-xs" />,
        };
      }
      if (task.status === "under-review") {
        return {
          color: "orange",
          text: "Under Review",
          icon: <FileSearchOutlined className="text-xs" />,
        };
      }
      const taskTimeLeft = timeLeft[task._id];
      if (taskTimeLeft?.text === "Overdue") {
        return {
          color: "error",
          text: "Overdue",
          icon: <ExclamationCircleOutlined className="text-xs" />,
        };
      }
      if (taskTimeLeft?.isUrgent) {
        return {
          color: "warning",
          text: taskTimeLeft?.text || "Due Soon",
          icon: <ClockCircleOutlined className="text-xs" />,
        };
      }
      if (task.status === "in-progress") {
        return {
          color: "processing",
          text: "In Progress",
          icon: <SyncOutlined spin className="text-xs" />,
        };
      }
      if (task.status === "rejected") {
        return {
          color: "error",
          text: "Needs Revision",
          icon: <ExclamationCircleOutlined className="text-xs" />,
        };
      }
      return {
        color: "default",
        text: "Pending",
        icon: <ClockCircleOutlined className="text-xs" />,
      };
    },
    [timeLeft],
  );

  const getAssigneesList = useCallback(
    (task) => {
      const assignees =
        task?.assignees?.filter((a) => (a.user?._id || a.user) !== userId) ||
        [];
      if (assignees.length === 0) return null;
      return assignees.slice(0, 3).map((assignee, index) => (
        <Tooltip
          key={index}
          title={
            assignee.user?.name || assignee.user?.firstName || "Unknown User"
          }>
          <Avatar
            size="small"
            className="border-2 border-white -ml-1"
            style={{ backgroundColor: "#6366f1" }}
            icon={<UserOutlined />}
          />
        </Tooltip>
      ));
    },
    [userId],
  );

  const handleSubmitForReview = async (taskId) => {
    try {
      const response = await dataFetcher(
        `tasks/${taskId}/submit-review`,
        "PUT",
        { comment: "Submitted for review from dashboard" },
      );
      if (response.error) throw new Error(response.error);
      toast.success("Task submitted for review!");
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      toast.error(error.message || "Failed to submit for review");
    }
  };

  const canReviewTask = useCallback(
    (task) => {
      if (!task) return false;
      const isCreator = task.createdBy?._id === userId;
      const isAssignedBy = task.assignees?.some(
        (a) => a.assignedBy?._id === userId,
      );
      return (isCreator || isAssignedBy) && task.status === "under-review";
    },
    [userId],
  );

  const canSubmitForReview = useCallback(
    (task) => {
      if (!task) return false;
      const isAssignee = task.assignees?.some(
        (a) => (a.user?._id || a.user) === userId,
      );
      return (
        isAssignee &&
        (task.status === "in-progress" || task.status === "rejected")
      );
    },
    [userId],
  );

  const getActionMenu = useCallback(
    (task) => {
      const items = [
        {
          key: "view",
          icon: <EyeOutlined />,
          label: "View Details",
          onClick: () => navigate(`/dashboard/tasks/${task._id}/details`),
        },
      ];
      if (canSubmitForReview(task)) {
        items.push({
          key: "submit-review",
          icon: <SendOutlined />,
          label: "Submit for Review",
          onClick: () =>
            confirm({
              title: "Submit for Review",
              content: "Ready to submit this task?",
              okText: "Submit",
              onOk: () => handleSubmitForReview(task._id),
            }),
        });
      }
      if (canReviewTask(task)) {
        items.push({
          key: "review",
          icon: <FileSearchOutlined />,
          label: "Review Task",
          onClick: () => {
            setSelectedTask(task);
            setReviewModalVisible(true);
          },
        });
      }
      items.push({
        key: "status",
        icon: <SyncOutlined />,
        label: "Update Status",
        children: [
          {
            key: "status-pending",
            label: "Mark as Pending",
            disabled: task.status === "pending",
          },
          {
            key: "status-in-progress",
            label: "Mark as In Progress",
            disabled: task.status === "in-progress",
          },
          {
            key: "status-completed",
            label: "Mark as Completed",
            disabled: task.status === "completed",
          },
        ],
      });
      if (activeTab === "assignedByMe") {
        items.push({
          key: "edit",
          icon: <EditOutlined />,
          label: "Edit Task",
          onClick: () => navigate(`/dashboard/tasks/${task._id}/update`),
        });
      }
      return items;
    },
    [navigate, canSubmitForReview, canReviewTask, activeTab],
  );

  return (
    <>
      <Card
        className="bg-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
        styles={{ body: { padding: 0 } }}>
        <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                <DashboardOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Task Overview</h3>
                <p className="text-xs text-white/70">
                  Track and manage your tasks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                <span className="text-xs text-white/80">Pending Review</span>
                <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                  {assignedStats.pendingReview}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100">
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={6}>
              <StatCard
                icon={InboxOutlined}
                value={myStats.total}
                label="My Tasks"
                color="white"
                bgGradient="from-blue-500 to-blue-600"
                iconBg="bg-blue-600/30"
              />
            </Col>
            <Col xs={12} sm={6}>
              <StatCard
                icon={CheckCircleOutlined}
                value={myStats.completed}
                label="Completed"
                color="white"
                bgGradient="from-emerald-500 to-emerald-600"
                iconBg="bg-emerald-600/30"
              />
            </Col>
            <Col xs={12} sm={6}>
              <StatCard
                icon={FileSearchOutlined}
                value={myStats.pendingReview}
                label="In Review"
                color="white"
                bgGradient="from-orange-500 to-orange-600"
                iconBg="bg-orange-600/30"
              />
            </Col>
            <Col xs={12} sm={6}></Col>
          </Row>
        </div>

        <div className="p-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                setTabCurrentPage((prev) => ({ ...prev, [key]: 1 }));
              }}
              size="small"
              className="task-tabs">
              <TabPane
                tab={
                  <span className="flex items-center gap-1.5 text-sm">
                    <InboxOutlined /> My Tasks{" "}
                    {myStats.total > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {myStats.total}
                      </span>
                    )}
                  </span>
                }
                key="assignedToMe"
              />
              <TabPane
                tab={
                  <span className="flex items-center gap-1.5 text-sm">
                    <SendOutlined /> Assigned by Me{" "}
                    {assignedStats.total > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                        {assignedStats.total}
                      </span>
                    )}
                  </span>
                }
                key="assignedByMe"
              />
            </Tabs>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">
                Completion:
              </span>
              <span
                className={`text-sm font-bold ${currentCompletionRate >= 75 ? "text-emerald-600" : currentCompletionRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                {currentCompletionRate}%
              </span>
            </div>
          </div>
          <Progress
            percent={currentCompletionRate}
            showInfo={false}
            strokeColor={
              currentCompletionRate >= 75
                ? "#10B981"
                : currentCompletionRate >= 50
                  ? "#F59E0B"
                  : "#EF4444"
            }
            trailColor="#E5E7EB"
            className="mb-4"
          />
        </div>

        <div className="p-4 pt-0 min-h-[300px]">
          {currentTabData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                {activeTab === "assignedToMe" ? (
                  <InboxOutlined className="text-2xl text-gray-400" />
                ) : (
                  <SendOutlined className="text-2xl text-gray-400" />
                )}
              </div>
              <p className="text-gray-600 font-medium mb-1">
                {activeTab === "assignedToMe"
                  ? "No Tasks Assigned to You"
                  : "No Tasks Assigned by You"}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {activeTab === "assignedToMe"
                  ? "You don't have any assigned tasks"
                  : "You haven't assigned any tasks"}
              </p>
              <Button
                type="primary"
                size="small"
                onClick={() =>
                  navigate(
                    activeTab === "assignedByMe"
                      ? "/dashboard/tasks/create"
                      : "/dashboard/tasks",
                  )
                }>
                {activeTab === "assignedByMe"
                  ? "Create Task"
                  : "View All Tasks"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTasks.map((task) => {
                const status = getTaskStatus(task);
                const isAssignedByMe = activeTab === "assignedByMe";
                const statusColors = {
                  success: {
                    bg: "bg-emerald-50",
                    border: "border-l-emerald-500",
                    icon: "bg-emerald-100 text-emerald-600",
                  },
                  error: {
                    bg: "bg-red-50",
                    border: "border-l-red-500",
                    icon: "bg-red-100 text-red-600",
                  },
                  warning: {
                    bg: "bg-amber-50",
                    border: "border-l-amber-500",
                    icon: "bg-amber-100 text-amber-600",
                  },
                  processing: {
                    bg: "bg-blue-50",
                    border: "border-l-blue-500",
                    icon: "bg-blue-100 text-blue-600",
                  },
                  orange: {
                    bg: "bg-orange-50",
                    border: "border-l-orange-500",
                    icon: "bg-orange-100 text-orange-600",
                  },
                  default: {
                    bg: "bg-gray-50",
                    border: "border-l-gray-300",
                    icon: "bg-gray-100 text-gray-600",
                  },
                };
                const style =
                  statusColors[status.color] || statusColors.default;

                return (
                  <div
                    key={task._id}
                    className={`p-4 rounded-xl border-l-4 ${style.bg} ${style.border} hover:shadow-md transition-all duration-200 group`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`p-2 rounded-lg ${style.icon} flex-shrink-0`}>
                          {status.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/dashboard/tasks/${task._id}/details`}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 block">
                            {task.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <CalendarOutlined className="w-3 h-3" />
                                {moment(task.dueDate).format("MMM D, YYYY")}
                              </span>
                            )}
                            {isAssignedByMe && task.assignees?.length > 1 && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <TeamOutlined className="w-3 h-3" />
                                <div className="flex items-center -space-x-1">
                                  {getAssigneesList(task)}
                                  {task.assignees?.length > 3 && (
                                    <Avatar
                                      size="small"
                                      className="border-2 border-white -ml-1 bg-gray-200 text-gray-600 text-xs">
                                      +{task.assignees.length - 3}
                                    </Avatar>
                                  )}
                                </div>
                              </span>
                            )}
                            {!isAssignedByMe && task.createdBy?.name && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <UserOutlined className="w-3 h-3" />
                                {task.createdBy.name}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={status.color}>
                          {status.text}
                        </StatusBadge>
                        <Dropdown
                          menu={{ items: getActionMenu(task) }}
                          trigger={["click"]}
                          placement="bottomRight">
                          <Button
                            type="text"
                            size="small"
                            icon={
                              <MoreOutlined className="text-gray-400 hover:text-gray-600" />
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {currentTabData.length > pageSize && (
          <div className="px-4 pb-4 flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                size="small"
                disabled={tabCurrentPage[activeTab] === 1}
                onClick={() =>
                  setTabCurrentPage((prev) => ({
                    ...prev,
                    [activeTab]: prev[activeTab] - 1,
                  }))
                }>
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                {tabCurrentPage[activeTab]} /{" "}
                {Math.ceil(currentTabData.length / pageSize)}
              </span>
              <Button
                size="small"
                disabled={
                  tabCurrentPage[activeTab] >=
                  Math.ceil(currentTabData.length / pageSize)
                }
                onClick={() =>
                  setTabCurrentPage((prev) => ({
                    ...prev,
                    [activeTab]: prev[activeTab] + 1,
                  }))
                }>
                Next
              </Button>
            </div>
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600">
              <span className="font-semibold text-emerald-600">
                {currentStats.completed}
              </span>{" "}
              completed
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">
              <span className="font-semibold text-orange-600">
                {currentStats.pendingReview}
              </span>{" "}
              in review
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">
              <span className="font-semibold text-red-600">
                {currentStats.overdue}
              </span>{" "}
              overdue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/tasks/add-task"
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm">
              + New Task
            </Link>
            <Link
              to="/dashboard/tasks"
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-all">
              View All
            </Link>
          </div>
        </div>
      </Card>

      {selectedTask && (
        <TaskReviewModal
          task={selectedTask}
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setSelectedTask(null);
          }}
          onReviewComplete={() => {
            if (onTaskUpdate) onTaskUpdate();
            setReviewModalVisible(false);
            setSelectedTask(null);
          }}
          currentUserId={userId}
        />
      )}
    </>
  );
};

TaskDashboardCard.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      dueDate: PropTypes.string,
      status: PropTypes.string,
      taskPriority: PropTypes.string,
      assignees: PropTypes.arrayOf(
        PropTypes.shape({
          user: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
              _id: PropTypes.string,
              name: PropTypes.string,
              firstName: PropTypes.string,
            }),
          ]),
          assignedBy: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string }),
          ]),
          role: PropTypes.string,
        }),
      ),
      createdBy: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
      }),
      taskResponse: PropTypes.arrayOf(
        PropTypes.shape({ completed: PropTypes.bool }),
      ),
    }),
  ).isRequired,
  userId: PropTypes.string.isRequired,
  onTaskUpdate: PropTypes.func,
};

export default TaskDashboardCard;
