import { useState } from "react";
import PropTypes from "prop-types";
import { Table, Pagination } from "antd";
import { FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
const TodoTask = ({ tasks }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <span
          className={`px-2 py-1 rounded ${
            priority === "high"
              ? "bg-red-500 text-white"
              : priority === "medium"
              ? "bg-yellow-500 text-white"
              : "bg-green-500 text-white"
          }`}>
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isCompleted",
      key: "isCompleted",
      render: (isCompleted) =>
        isCompleted ? (
          <FaCheckCircle className="text-green-500" />
        ) : (
          <FaTimesCircle className="text-red-500" />
        ),
    },
    // Newly added columns
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => new Date(createdAt).toLocaleDateString(),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate) =>
        dueDate ? new Date(dueDate).toLocaleDateString() : "No due date",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex space-x-2">
          {/* <button className="text-blue-500 hover:text-blue-700">Edit</button> */}
          <button className="text-red-500 hover:text-red-700">Delete</button>
        </div>
      ),
    },
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <Table
        dataSource={tasks.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize
        )}
        columns={columns}
        pagination={false}
        rowKey="id" // Assuming each task has a unique 'id' field
      />
      <Pagination
        current={currentPage}
        onChange={handlePageChange}
        total={tasks.length}
        pageSize={pageSize}
        showSizeChanger={false}
      />
    </div>
  );
};

TodoTask.propTypes = {
  tasks: PropTypes.array.isRequired,
};

export default TodoTask;
