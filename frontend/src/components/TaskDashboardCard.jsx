import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import moment from "moment";
import {
  List,
  Tag,
  Pagination,
  Card,
  Badge,
  Avatar,
  Progress,
  Empty,
  Button,
  Tabs,
  Row,
  Col,
  Tooltip,
  Dropdown,
  Modal,
  Space,
  Menu,
} from "antd";
import {
  ClockCircleOutlined,
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
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  SyncOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const { TabPane } = Tabs;
const { confirm } = Modal;

const TaskDashboardCard = ({ tasks, userId, onTaskUpdate }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [pageSize, setPageSize] = useState(5);
  const [activeTab, setActiveTab] = useState("assignedToMe");
  const [tabCurrentPage, setTabCurrentPage] = useState({
    assignedToMe: 1,
    assignedByMe: 1,
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Update the time left for each task every minute
  useEffect(() => {
    const updateTimeLeft = () => {
      const updatedTimeLeft = tasks?.reduce((acc, task) => {
        if (!task?.dueDate) return acc;

        const dueDate = moment(task.dueDate);
        const now = moment();
        const duration = moment.duration(dueDate.diff(now));

        if (duration.asMilliseconds() < 0) {
          acc[task._id] = { text: "Overdue", isUrgent: true };
        } else {
          const days = Math.floor(duration.asDays());
          const hours = duration.hours();
          const minutes = duration.minutes();

          if (days === 0 && hours < 24) {
            acc[task._id] = {
              text: `${hours}h ${minutes}m`,
              isUrgent: hours < 4,
            };
          } else {
            acc[task._id] = {
              text: `${days}d ${hours}h`,
              isUrgent: days < 2,
            };
          }
        }

        return acc;
      }, {});
      setTimeLeft(updatedTimeLeft);
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [tasks]);

  // Filter tasks assigned to the current user
  const tasksAssignedToMe =
    tasks?.filter((task) =>
      task?.assignees?.some((assignee) => {
        const assigneeId = assignee.user?._id || assignee.user;
        return assigneeId === userId;
      })
    ) || [];

  // Filter tasks assigned by the current user
  const tasksAssignedByMe =
    tasks?.filter((task) =>
      task?.assignees?.some((assignee) => {
        const assignedById = assignee.assignedBy?._id || assignee.assignedBy;
        return assignedById === userId;
      })
    ) || [];

  // Calculate task statistics
  const calculateStats = (taskList) => ({
    total: taskList.length,
    completed: taskList.filter(
      (task) => task.taskResponse?.[0]?.completed || task.status === "completed"
    ).length,
    overdue: taskList.filter((task) => {
      if (!task?.dueDate) return false;
      const dueDate = moment(task.dueDate);
      return (
        dueDate.isBefore(moment()) &&
        !(task.taskResponse?.[0]?.completed || task.status === "completed")
      );
    }).length,
    urgent: taskList.filter((task) => {
      return (
        timeLeft[task._id]?.isUrgent &&
        !(task.taskResponse?.[0]?.completed || task.status === "completed")
      );
    }).length,
  });

  const myStats = calculateStats(tasksAssignedToMe);
  const assignedStats = calculateStats(tasksAssignedByMe);

  // Calculate completion rates
  const myCompletionRate =
    myStats.total > 0
      ? Math.round((myStats.completed / myStats.total) * 100)
      : 0;

  const assignedCompletionRate =
    assignedStats.total > 0
      ? Math.round((assignedStats.completed / assignedStats.total) * 100)
      : 0;

  // Get current tab's data
  const currentTabData =
    activeTab === "assignedToMe" ? tasksAssignedToMe : tasksAssignedByMe;
  const currentStats = activeTab === "assignedToMe" ? myStats : assignedStats;
  const currentCompletionRate =
    activeTab === "assignedToMe" ? myCompletionRate : assignedCompletionRate;

  // Paginate the tasks for current tab
  const paginatedTasks = currentTabData.slice(
    (tabCurrentPage[activeTab] - 1) * pageSize,
    tabCurrentPage[activeTab] * pageSize
  );

  // Handle page change
  const handlePageChange = (page, newPageSize) => {
    setTabCurrentPage((prev) => ({ ...prev, [activeTab]: page }));
    if (newPageSize) {
      setPageSize(newPageSize);
    }
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const getTaskStatus = (task) => {
    if (task.taskResponse?.[0]?.completed || task.status === "completed") {
      return {
        color: "success",
        text: "Completed",
        icon: <CheckCircleOutlined className="text-xs" />,
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

    return {
      color: "default",
      text: "Pending",
      icon: <ClockCircleOutlined className="text-xs" />,
    };
  };

  // Get assignees list for tasks assigned by me
  const getAssigneesList = (task) => {
    const assignees =
      task?.assignees?.filter((a) => {
        const assigneeId = a.user?._id || a.user;
        return assigneeId !== userId;
      }) || [];

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
          style={{ backgroundColor: "#1890ff" }}
          icon={<UserOutlined />}
        />
      </Tooltip>
    ));
  };

  // Handle task status update
  const handleStatusUpdate = (taskId, newStatus) => {
    if (onTaskUpdate) {
      onTaskUpdate("status", { taskId, newStatus });
    }
    toast.success(`Task status updated to ${newStatus}`);
  };

  // Action menu for each task
  const getActionMenu = (task) => {
    const status = getTaskStatus(task);
    const isAssignedByMe = activeTab === "assignedByMe";
    const canEdit = isAssignedByMe; // Only allow editing tasks assigned by the user

    const items = [
      {
        key: "view",
        icon: <EyeOutlined />,
        label: "View Details",
        onClick: () => navigate(`/dashboard/tasks/${task._id}/details`),
      },
      {
        key: "status",
        icon: <SyncOutlined />,
        label: "Update Status",
        children: [
          {
            key: "status-pending",
            label: "Mark as Pending",
            disabled: status.text === "Pending",
            onClick: () => handleStatusUpdate(task._id, "pending"),
          },
          {
            key: "status-in-progress",
            label: "Mark as In Progress",
            disabled: status.text === "In Progress",
            onClick: () => handleStatusUpdate(task._id, "in-progress"),
          },
          {
            key: "status-completed",
            label: "Mark as Completed",
            disabled: status.text === "Completed",
            onClick: () => handleStatusUpdate(task._id, "completed"),
          },
        ],
      },
    ];

    if (canEdit) {
      items.push({
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit Task",
        onClick: () => navigate(`/dashboard/tasks/${task._id}/update`),
      });
    }

    return items;
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DashboardOutlined className="text-lg text-indigo-600" />
            <span className="font-semibold text-gray-900">Task Dashboard</span>
          </div>
          <Badge
            count={myStats.total + assignedStats.total}
            showZero
            color="indigo"
            className="ml-2"
          />
        </div>
      }
      className="bg-gradient-to-br from-white to-indigo-50/50 border border-gray-200 rounded-2xl shadow-lg h-[500px] flex flex-col overflow-hidden"
      styles={{
        body: {
          padding: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}>
      {/* Statistics Overview */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-medium">
                    My Tasks
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {myStats.total}
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <InboxOutlined className="text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-green-600 font-medium">
                    {myStats.completed} done
                  </span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="text-red-600">
                    {myStats.overdue} overdue
                  </span>
                </div>
                <Progress
                  percent={myCompletionRate}
                  size="small"
                  strokeColor={myCompletionRate >= 75 ? "#10B981" : "#3B82F6"}
                  showInfo={false}
                  style={{ width: 60 }}
                />
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-medium">
                    Assigned
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {assignedStats.total}
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <SendOutlined className="text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-green-600 font-medium">
                    {assignedStats.completed} done
                  </span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="text-red-600">
                    {assignedStats.overdue} overdue
                  </span>
                </div>
                <Progress
                  percent={assignedCompletionRate}
                  size="small"
                  strokeColor={
                    assignedCompletionRate >= 75 ? "#10B981" : "#3B82F6"
                  }
                  showInfo={false}
                  style={{ width: 60 }}
                />
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          size="small"
          tabBarStyle={{ marginBottom: 12 }}>
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <InboxOutlined className="text-sm" />
                <span>Assigned to Me</span>
                {myStats.urgent > 0 && (
                  <Badge count={myStats.urgent} size="small" color="red" />
                )}
              </span>
            }
            key="assignedToMe"
          />
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <SendOutlined className="text-sm" />
                <span>Assigned by Me</span>
                {assignedStats.urgent > 0 && (
                  <Badge
                    count={assignedStats.urgent}
                    size="small"
                    color="red"
                  />
                )}
              </span>
            }
            key="assignedByMe"
          />
        </Tabs>
      </div>

      {currentTabData.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <Empty
            image={
              <div className="text-gray-300">
                {activeTab === "assignedToMe" ? (
                  <InboxOutlined style={{ fontSize: "48px" }} />
                ) : (
                  <SendOutlined style={{ fontSize: "48px" }} />
                )}
              </div>
            }
            description={
              <div className="text-center">
                <div className="text-gray-600 font-medium mb-2">
                  {activeTab === "assignedToMe"
                    ? "No Tasks Assigned to You"
                    : "No Tasks Assigned by You"}
                </div>
                <div className="text-gray-500 text-sm">
                  {activeTab === "assignedToMe"
                    ? "You don't have any assigned tasks at the moment"
                    : "You haven't assigned any tasks to others"}
                </div>
              </div>
            }
          />
          <Button
            type="primary"
            size="small"
            className="mt-4"
            onClick={() => {
              if (activeTab === "assignedByMe") {
                navigate("/dashboard/tasks/create");
              }
            }}>
            {activeTab === "assignedToMe"
              ? "View All Tasks"
              : "Create New Task"}
          </Button>
        </div>
      ) : (
        <>
          {/* Progress Overview */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Completion Rate
              </span>
              <span
                className={`text-sm font-bold ${
                  currentCompletionRate >= 75
                    ? "text-green-600"
                    : currentCompletionRate >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}>
                {currentCompletionRate}%
              </span>
            </div>
            <Progress
              percent={currentCompletionRate}
              size="small"
              strokeColor={
                currentCompletionRate >= 75
                  ? "#10B981"
                  : currentCompletionRate >= 50
                  ? "#F59E0B"
                  : "#EF4444"
              }
              showInfo={false}
            />
          </div>

          {/* Tasks List with fixed height for scrolling */}
          <div className="flex-1 min-h-0 px-4">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <List
                dataSource={paginatedTasks}
                renderItem={(task) => {
                  const status = getTaskStatus(task);
                  const isAssignedByMe = activeTab === "assignedByMe";

                  return (
                    <List.Item
                      key={task._id}
                      className="p-3 border border-gray-200 rounded-lg mb-2 last:mb-0 hover:shadow-md hover:border-blue-200 transition-all duration-200 bg-white group">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <Avatar
                              size="small"
                              className={`${
                                status.color === "success"
                                  ? "bg-green-100 text-green-600 border border-green-200"
                                  : status.color === "error"
                                  ? "bg-red-100 text-red-600 border border-red-200"
                                  : status.color === "warning"
                                  ? "bg-orange-100 text-orange-600 border border-orange-200"
                                  : status.color === "processing"
                                  ? "bg-blue-100 text-blue-600 border border-blue-200"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
                              } flex items-center justify-center`}
                              icon={status.icon}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <Link
                                to={`/dashboard/tasks/${task._id}/details`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 block">
                                {task.title}
                              </Link>
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
                            <div className="flex items-center gap-2 mt-1">
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <CalendarOutlined className="w-3 h-3" />
                                  <span>
                                    {moment(task.dueDate).format("MMM D, YYYY")}
                                  </span>
                                </div>
                              )}
                              {isAssignedByMe && task.assignees?.length > 1 && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <TeamOutlined className="w-3 h-3" />
                                  <div className="flex items-center -space-x-1">
                                    {getAssigneesList(task)}
                                    {task.assignees?.length > 3 && (
                                      <Avatar
                                        size="small"
                                        className="border-2 border-white -ml-1 bg-gray-100 text-gray-600 text-xs">
                                        +{task.assignees.length - 3}
                                      </Avatar>
                                    )}
                                  </div>
                                </div>
                              )}
                              {!isAssignedByMe && task.createdBy?.name && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <UserOutlined className="w-3 h-3" />
                                  <span>By {task.createdBy.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Tag
                            color={status.color}
                            className="m-0 text-xs font-medium flex items-center gap-1 whitespace-nowrap px-2 py-1">
                            {status.icon}
                            <span className="ml-1">{status.text}</span>
                          </Tag>

                          {/* Quick Action Buttons */}
                          <Space size={0} className="hidden md:flex">
                            <Tooltip title="View Details">
                              <Button
                                type="text"
                                size="small"
                                icon={
                                  <EyeOutlined className="text-gray-500 hover:text-blue-500" />
                                }
                                onClick={() =>
                                  navigate(
                                    `/dashboard/tasks/${task._id}/details`
                                  )
                                }
                              />
                            </Tooltip>
                            {isAssignedByMe && (
                              <>
                                <Tooltip title="Edit Task">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={
                                      <EditOutlined className="text-gray-500 hover:text-green-500" />
                                    }
                                    onClick={() =>
                                      navigate(
                                        `/dashboard/tasks/${task._id}/update`
                                      )
                                    }
                                  />
                                </Tooltip>
                              </>
                            )}
                          </Space>
                        </div>
                      </div>

                      {/* Task Description Preview */}
                      {task.description && (
                        <div className="mt-2 text-xs text-gray-500 line-clamp-1 pl-9">
                          {task.description}
                        </div>
                      )}
                    </List.Item>
                  );
                }}
              />
            </div>
          </div>

          {/* Pagination */}
          {currentTabData.length > 5 && (
            <div className="border-t border-gray-200 p-3">
              <Pagination
                current={tabCurrentPage[activeTab]}
                pageSize={pageSize}
                total={currentTabData.length}
                onChange={handlePageChange}
                showSizeChanger={false}
                size="small"
                simple
                showTotal={(total) => `${total} tasks`}
              />
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 bg-gray-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-600">
                  {currentStats.total} task{currentStats.total !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-600">
                      {currentStats.completed} completed
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-600">
                      {currentStats.overdue} overdue
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  onClick={() => navigate("/dashboard/tasks/add-task")}
                  type="primary">
                  New Task
                </Button>
                <Link
                  to="/dashboard/tasks"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs">
                  <EyeOutlined className="text-xs" />
                  Manage All
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

// Define prop types
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
            PropTypes.shape({
              _id: PropTypes.string,
              name: PropTypes.string,
            }),
          ]),
          role: PropTypes.string,
        })
      ),
      createdBy: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
      }),
      taskResponse: PropTypes.arrayOf(
        PropTypes.shape({
          completed: PropTypes.bool,
        })
      ),
    })
  ).isRequired,
  userId: PropTypes.string.isRequired,
  onTaskUpdate: PropTypes.func,
};

export default TaskDashboardCard;
