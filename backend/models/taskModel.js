const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  message: {
    type: String,
    maxLength: [50, "Message should not be more than 50 characters"],
    require: [true, "Write message, please"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  sender: String,
});

// taskResponse sub-doc
const taskResponseSchema = new mongoose.Schema({
  completed: Boolean,
  doc: {
    type: String,
    required: false,
  },
  comment: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// sub-document for documents
const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, "Provide file name"],
    trim: true,
  },
  file: {
    type: String,
    required: [true, "Provide document to upload"],
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "A task must have a title"],
    },
    caseToWorkOn: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Case",
      },
    ],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [
          function () {
            return !this.assignedToClient;
          },
          "A task must be assigned to either a staff or a client",
        ],
      },
    ],
    assignedToClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [
        function () {
          return this.assignedTo.length === 0;
        },
        "A task must be assigned to either a staff or a client",
      ],
    },
    dateAssigned: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "A task must have a due date"],
      validate: {
        validator: function (value) {
          // Ensure dateAssigned is defined and available
          if (!this.dateAssigned) {
            return true; // Skip validation if dateAssigned is not set
          }
          return value > this.dateAssigned;
        },
        message: "Due date must be after date task is assigned",
      },
      default: Date.now,
    },

    instruction: {
      type: String,
      trim: true,
      required: [true, "A task must have an instruction"],
    },
    taskPriority: {
      type: String,
      trim: true,
      enum: ["urgent", "high", "medium", "low"],
      default: "high", // Example default value
    },

    // file: String,
    reminder: reminderSchema,
    documents: [documentSchema],

    taskResponse: [taskResponseSchema],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.pre(/^find/, function (next) {
  this.populate({ path: "assignedTo", select: "firstName lastName" })
    .populate({
      path: "caseToWorkOn",
      select: "firstParty.name.name secondParty.name.name  email",
    })
    .populate({
      path: "assignedBy",
      select: "firstName lastName email position role",
    })
    .populate({ path: "assignedToClient", select: "firstName secondName" });
  next();
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
