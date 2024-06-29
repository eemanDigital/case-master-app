import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Pagination, Modal, notification } from "antd";
import { FaCheckCircle, FaTimesCircle, FaTrash } from "react-icons/fa";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import useDelete from "../hooks/useDelete";
import useUpdate from "../hooks/useUpdate";

const TodoTask = ({ tasks }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Using tasks as the initial docData
  const { handleDeleteDocument, documents, setDocuments } = useDelete(
    tasks,
    "tasks"
  );
  const { handleUpdate } = useUpdate();

  useEffect(() => {
    // Ensure documents are set initially from tasks
    if (tasks) {
      setDocuments(tasks);
    }
  }, [tasks, setDocuments]);

  const handleDoubleClick = (record) => {
    const updatedTask = { ...record, isCompleted: !record.isCompleted };

    // Optimistically update the UI
    const updatedDocuments = documents.map((doc) =>
      doc._id === record._id ? updatedTask : doc
    );
    setDocuments(updatedDocuments);

    // Update the backend
    handleUpdate(`todos/${record._id}`, {
      isCompleted: updatedTask.isCompleted,
    });
  };

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
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => (
        <small className=" font-bold">
          {new Date(createdAt).toLocaleString()}
        </small>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate) =>
        dueDate ? (
          <small className=" font-bold">
            {new Date(dueDate).toLocaleString()}
          </small>
        ) : (
          "No due date"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex space-x-2">
          <button
            className="text-red-500 hover:text-red-700"
            onClick={() =>
              Modal.confirm({
                title: "Are you sure you want to delete this task?",
                icon: <ExclamationCircleOutlined />,
                content: "This action cannot be undone",
                okText: "Yes",
                okType: "danger",
                cancelText: "No",
                onOk() {
                  handleDeleteDocument(`todos/${record._id}`, record._id);
                },
              })
            }>
            <FaTrash />
          </button>
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
        dataSource={documents.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize
        )}
        columns={columns}
        pagination={false}
        rowKey="_id" // Assuming each task has a unique '_id' field
        onRow={(record) => ({
          onDoubleClick: () => handleDoubleClick(record),
          className: "hover:bg-blue-100",
        })}
      />
      <Pagination
        current={currentPage}
        onChange={handlePageChange}
        total={documents.length}
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
