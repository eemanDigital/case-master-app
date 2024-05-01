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
  comment: {
    type: String,
    trim: true,
  },
  taskPriority: {
    type: String,
    trim: true,
    enum: ["low", "middle", "high"],
    default: "low", // Example default value
  },

  document: [String],
  reminder: {
    date: {
      type: Date,
      default: Date.now,
    },
    text: {
      type: String,
      trim: true,
      required: [true, "Provide a reminder message "],
    },
  },
});

taskSchema.pre(/^find/, function (next) {
  this.populate({ path: "assignedTo", select: "firstName lastName" }).populate({
    path: "caseToWorkOn",
    select: "firstParty.description.name secondParty.description.name ",
  });
  next();
});
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
