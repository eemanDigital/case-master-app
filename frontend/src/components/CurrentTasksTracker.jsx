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
  Typography,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const { Text } = Typography;

const CurrentTasksTracker = ({ tasks, userId }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Update the time left for each task every minute
  useEffect(() => {
    const updateTimeLeft = () => {
      const updatedTimeLeft = tasks?.reduce((acc, task) => {
        const dueDate = moment(task?.dueDate);
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
  const userTasks =
    tasks?.filter((task) =>
      task?.assignedTo?.some((user) => user._id === userId)
    ) || [];

  // Calculate task statistics
  const taskStats = {
    total: userTasks.length,
    completed: userTasks.filter((task) => task.taskResponse?.[0]?.completed)
      .length,
    overdue: userTasks.filter((task) => {
      const dueDate = moment(task?.dueDate);
      return dueDate.isBefore(moment()) && !task.taskResponse?.[0]?.completed;
    }).length,
    urgent: userTasks.filter(
      (task) =>
        timeLeft[task._id]?.isUrgent && !task.taskResponse?.[0]?.completed
    ).length,
  };

  const completionRate =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

  // Handle page change
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Paginate the tasks
  const paginatedTasks = userTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getTaskStatus = (task) => {
    if (task.taskResponse?.[0]?.completed) {
      return { color: "success", icon: <CheckBadgeIcon className="w-4 h-4" /> };
    }
    if (timeLeft[task._id]?.text === "Overdue") {
      return {
        color: "error",
        icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      };
    }
    if (timeLeft[task._id]?.isUrgent) {
      return { color: "warning", icon: <ClockIcon className="w-4 h-4" /> };
    }
    return { color: "processing", icon: <ClockIcon className="w-4 h-4" /> };
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">Assigned Tasks</span>
            {taskStats.total > 0 && (
              <Badge
                count={taskStats.total}
                showZero
                color="indigo"
                className="ml-2"
              />
            )}
          </div>
          {taskStats.total > 0 && taskStats.urgent > 0 && (
            <Tag color="red" className="text-xs">
              {taskStats.urgent} Urgent
            </Tag>
          )}
        </div>
      }
      className="bg-gradient-to-br from-white to-indigo-50/50 border border-gray-200 rounded-2xl shadow-sm h-full flex flex-col"
      styles={{
        body: {
          padding: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        },
      }}>
      {taskStats.total === 0 ? (
        // Empty State for Assigned Tasks
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <Empty
            image={
              <div className="text-indigo-200">
                <ClipboardDocumentCheckIcon className="w-16 h-16" />
              </div>
            }
            description={
              <div className="text-center">
                <div className="text-gray-600 font-medium mb-2">
                  No Assigned Tasks
                </div>
                <div className="text-gray-500 text-sm">
                  You don't have any tasks assigned from your superiors
                </div>
              </div>
            }
          />
          <div className="mt-4 text-center">
            <Text className="text-gray-400 text-sm">
              Your superior will assign tasks to you here
            </Text>
          </div>
        </div>
      ) : (
        // Assigned Tasks Content
        <>
          {/* Progress Overview */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Work Progress
              </span>
              <span className="text-sm font-bold text-gray-900">
                {completionRate}%
              </span>
            </div>
            <Progress
              percent={completionRate}
              size="small"
              strokeColor={
                completionRate >= 75
                  ? "#10B981"
                  : completionRate >= 50
                  ? "#F59E0B"
                  : "#EF4444"
              }
              showInfo={false}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{taskStats.completed} completed</span>
              <span>{taskStats.overdue} overdue</span>
            </div>
          </div>

          {/* Assigned Tasks List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <List
              dataSource={paginatedTasks}
              renderItem={(task) => {
                const status = getTaskStatus(task);
                return (
                  <List.Item
                    key={task._id}
                    className="p-3 border border-gray-200 rounded-lg mb-2 last:mb-0 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar
                          size="small"
                          className={`${
                            status.color === "success"
                              ? "bg-green-500"
                              : status.color === "error"
                              ? "bg-red-500"
                              : status.color === "warning"
                              ? "bg-orange-500"
                              : "bg-indigo-500"
                          }`}
                          icon={status.icon}
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`tasks/${task?._id}/details`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 block">
                            {task?.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {task?.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CalendarOutlined className="w-3 h-3" />
                                <span>
                                  {moment(task.dueDate).format("MMM D, YYYY")}
                                </span>
                              </div>
                            )}
                            {task?.assignedBy && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <UserOutlined className="w-3 h-3" />
                                <span>
                                  By {task.assignedBy.name || "Manager"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Tag
                        color={status.color}
                        className="m-0 text-xs font-medium flex items-center gap-1 whitespace-nowrap">
                        {status.color === "success" ? (
                          <>
                            <CheckCircleOutlined />
                            Completed
                          </>
                        ) : (
                          <>
                            <ClockCircleOutlined />
                            {timeLeft[task._id]?.text}
                          </>
                        )}
                      </Tag>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>

          {/* Pagination */}
          {userTasks.length > 5 && (
            <div className="border-t border-gray-200 p-4">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={userTasks.length}
                onChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={["5", "10", "15"]}
                size="small"
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} assignments`
                }
              />
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {taskStats.total} assignment{taskStats.total !== 1 ? "s" : ""}{" "}
                from superiors
              </span>
              <Link
                to="/tasks"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                <EyeIcon className="w-3 h-3" />
                View All
              </Link>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

// Define prop types
CurrentTasksTracker.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      dueDate: PropTypes.string,
      assignedTo: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
        })
      ),
      assignedBy: PropTypes.shape({
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
};

export default CurrentTasksTracker;
