import { useState, useEffect } from "react";
import moment from "moment";
import { List, Tag } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const TaskTimeTracker = ({ tasks, userId }) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    // Function to update the time left for each task
    const updateTimeLeft = () => {
      const updatedTimeLeft = tasks?.reduce((acc, task) => {
        const dueDate = moment(task?.dueDate);
        const now = moment();
        const duration = moment.duration(dueDate.diff(now));

        if (duration.asMilliseconds() < 0) {
          acc[task._id] = "Overdue";
        } else {
          const days = Math.floor(duration.asDays());
          const hours = duration.hours();
          const minutes = duration.minutes();
          acc[task._id] = `${days}d ${hours}h ${minutes}m`;
        }

        return acc;
      }, {});
      setTimeLeft(updatedTimeLeft);
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [tasks]);

  // Filter tasks assigned to the current user
  const userTasks = tasks?.filter((task) =>
    task?.assignedTo?.some((user) => user._id === userId)
  );

  if (!userTasks || userTasks.length === 0) {
    return null;
  }

  return (
    <div className="w-[30%] bg-white shadow-md rounded-md font-medium text-center text-gray-800 p-2">
      <h1>Task Timers</h1>
      <List
        dataSource={userTasks}
        renderItem={(task) => (
          <List.Item
            key={task._id}
            className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <ClockCircleOutlined className="text-blue-500" />
              <span className="font-medium text-gray-700 truncate max-w-[150px]">
                <Link to={`tasks/${task?._id}/details`}>{task.title}</Link>
              </span>
            </div>
            <Tag
              className="font-bold"
              color={timeLeft[task._id] === "Overdue" ? "red" : "green"}>
              {task.dueDate
                ? timeLeft[task._id] || "Calculating..."
                : "No deadline"}
            </Tag>
          </List.Item>
        )}
      />
    </div>
  );
};

export default TaskTimeTracker;
