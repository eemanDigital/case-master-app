import React from "react";
import PropTypes from "prop-types";

const TodoTask = ({ desc, isCompleted, priority, createdAt, dueDate }) => {
  return (
    <div className="">
      <p>Description: {desc}</p>
      {/* <p>Completed: {isCompleted ? "Yes" : "No"}</p>
      <p>Priority: {priority}</p>
      <p>Created At: {new Date(createdAt).toLocaleString()}</p>
      <p>
        Due Date: {dueDate ? new Date(dueDate).toLocaleString() : "No due date"}
      </p> */}
    </div>
  );
};

TodoTask.propTypes = {
  desc: PropTypes.string.isRequired,
  isCompleted: PropTypes.bool.isRequired,
  priority: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  dueDate: PropTypes.string,
};

export default TodoTask;
