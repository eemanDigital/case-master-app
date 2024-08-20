import { useState, useEffect } from "react";
import moment from "moment";
import { List, Tag, Pagination } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const CurrentTasksTracker = ({ tasks, userId }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const paginatedTasks = userTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // console.log(tasks, "TASKS");

  return (
    <div className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow h-[180px]  flex flex-col justify-center items-center">
      <h3 className="text-[14px] font-medium text-gray-700">
        Current Official Tasks
      </h3>
      <List
        dataSource={paginatedTasks}
        renderItem={(task) => (
          <List.Item
            key={task._id}
            className="flex items-center justify-between px-4 text-[12px] ">
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
              {/* {task.taskResponse?.[0]?.completed
                ? "Task Completed"
                : task.dueDate
                ? `${timeLeft[task?._id]} left` || "Calculating..."
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
      )} */}

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

export default CurrentTasksTracker;
