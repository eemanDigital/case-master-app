import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Pagination, Modal, Tag, Space } from "antd";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import useDelete from "../hooks/useDelete";
import useUpdate from "../hooks/useUpdate";
import { useSelector } from "react-redux";
import AddEventToCalender from "./AddEventToCalender";

const TodoTask = ({ tasks }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { user } = useSelector((state) => state.auth);

  const { handleDeleteDocument, documents, setDocuments } = useDelete(
    tasks,
    "tasks"
  );
  const { handleUpdate } = useUpdate();

  useEffect(() => {
    if (tasks) {
      setDocuments(tasks);
    }
  }, [tasks, setDocuments]);

  const handleDoubleClick = (record) => {
    const updatedTask = { ...record, isCompleted: !record.isCompleted };
    const updatedDocuments = documents.map((doc) =>
      doc._id === record._id ? updatedTask : doc
    );
    setDocuments(updatedDocuments);
    handleUpdate(`todos/${record._id}`, {
      isCompleted: updatedTask.isCompleted,
    });
  };

  const filteredDocuments = (currentUserId) =>
    documents.filter((doc) => doc.userId === currentUserId);

  const getTimeLeft = (dueDate) => {
    if (!dueDate) return "No due date";
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    if (diff < 0) return "Overdue";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m`;
  };

  // prepare event title for calendar
  const createEventTitle = (task) => {
    return `Personal Todo Task: ${task.description}`;
  };

  // prepare event description for calendar
  const createEventDescription = (task) => {
    return `Priority: ${task.priority}`;
  };

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <Tag
          color={
            priority === "high"
              ? "red"
              : priority === "medium"
              ? "orange"
              : "green"
          }
          className="uppercase font-semibold">
          {priority}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isCompleted",
      key: "isCompleted",
      render: (isCompleted) => (
        <Tag color={isCompleted ? "green" : "volcano"}>
          {isCompleted ? "Completed" : "Pending"}
        </Tag>
      ),
    },
    {
      title: "Due",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate) => (
        <span className="text-sm font-medium">{getTimeLeft(dueDate)}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <DeleteOutlined
            className="text-red-500 hover:text-red-700 cursor-pointer"
            onClick={(event) =>
              Modal.confirm({
                title: "Delete Task",
                icon: <ExclamationCircleOutlined />,
                content: "Are you sure you want to delete this task?",
                okText: "Yes",
                okType: "danger",
                cancelText: "No",
                onOk: () =>
                  handleDeleteDocument(
                    event,
                    `todos/${record._id}`,
                    record._id
                  ),
              })
            }
          />

          <AddEventToCalender
            title={createEventTitle(record)}
            description={createEventDescription(record)}
            startDate={record.dateAssigned}
            endDate={record.dueDate}
          />
        </Space>
      ),
    },
  ];

  const filteredData = filteredDocuments(user?.data?._id);
  const showPagination = filteredData.length > 3;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
      <h1 className=" font-bold text-center text-gray-700 my-4">
        Your Personal Todos
      </h1>
      <Table
        dataSource={
          showPagination
            ? filteredData.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize
              )
            : filteredData
        }
        columns={columns}
        pagination={false}
        rowKey="_id"
        onRow={(record) => ({
          onDoubleClick: () => handleDoubleClick(record),
          className: "hover:bg-gray-50 transition-colors duration-200",
        })}
        className="mt-8 shadow-sm rounded-lg overflow-hidden"
        scroll={{ x: true }}
      />
      {showPagination && (
        <div className="mt-4 flex justify-end">
          <Pagination
            current={currentPage}
            onChange={setCurrentPage}
            total={filteredData.length}
            pageSize={pageSize}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

TodoTask.propTypes = {
  tasks: PropTypes.array.isRequired,
};

export default TodoTask;
