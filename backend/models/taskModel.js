const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  description: {
    type: String,
    trim: true,
    required: [true, "A task must have a description"],
  },
  caseToWorkOn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
  },
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A task must be assigned to a staff"],
    },
  ],
  dateAssigned: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, "A task must have a due date"],
    default: Date.now,
  },
  status: {
    type: String,
    trim: true,
    enum: {
      values: ["pending", "completed"],
      message: "Please, state the task's status",
    },
    required: true,
  },
  taskPriority: {
    type: String,
    trim: true,
    enum: ["low", "middle", "high"],
    default: "low", // Example default value
  },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
