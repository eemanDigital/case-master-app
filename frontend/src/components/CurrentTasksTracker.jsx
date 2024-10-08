import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import moment from "moment";
import { List, Tag, Pagination } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const CurrentTasksTracker = ({ tasks, userId }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Update the time left for each task every minute
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
    // Update the time left every minute
    const timer = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [tasks]);

  // Filter tasks assigned to the current user
  const userTasks = tasks?.filter((task) =>
    task?.assignedTo?.some((user) => user._id === userId)
  );

  // Return null if there are no tasks assigned to the user
  if (!userTasks || userTasks.length === 0) {
    return null;
  }

  // Handle page change
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  // Paginate the tasks
  const paginatedTasks = userTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-white rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow h-[180px] py-4  flex flex-col   items-center">
      <h3 className="text-[14px] font-medium text-gray-700">
        Current Official Tasks
      </h3>
      <List
        dataSource={paginatedTasks}
        renderItem={(task) => (
          <List.Item
            key={task._id}
            className="flex gap-10  items-center justify-between m-0 text-[12px] ">
            <div className="flex items-center space-x-1">
              <ClockCircleOutlined className="text-blue-500" />

              <span className="font-medium text-gray-700 truncate max-w-[130px]">
                <Link to={`tasks/${task?._id}/details`}>{task?.title}</Link>
              </span>
            </div>
            <Tag
              className="font-bold text-[10px] "
              color={
                task.taskResponse?.[0]?.completed
                  ? "green"
                  : timeLeft?.[task?._id] === "Overdue"
                  ? "red"
                  : "purple"
              }>
              {task?.taskResponse?.[0]?.completed
                ? "Task Completed"
                : task?.dueDate
                ? `${timeLeft?.[task?._id]} left` || "Calculating..."
                : "No deadline"}
            </Tag>
          </List.Item>
        )}
      />
      {userTasks.length > 5 && (
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={userTasks.length}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={["5", "10", "20"]}
        />
      )}
    </div>
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
