const mongoose = require("mongoose");

// Reminder sub-schema
const reminderSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      maxLength: [200, "Message should not exceed 200 characters"],
      required: [true, "Reminder message is required"],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// Task response sub-schema
const taskResponseSchema = new mongoose.Schema(
  {
    completed: {
      type: Boolean,
      required: [true, "Completion status is required"],
      default: false,
    },
    doc: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Document must be a valid URL",
      },
    },
    comment: {
      type: String,
      trim: true,
      maxLength: [1000, "Comment cannot exceed 1000 characters"],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Submitter is required"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: true, timestamps: false }
);

// Document sub-schema
const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      maxLength: [255, "File name too long"],
    },
    file: {
      type: String,
      required: [true, "File URL is required"],
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: "File must be a valid URL",
      },
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: [true, "Uploader is required"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    fileSize: Number,
    mimeType: String,
  },
  { _id: true }
);

// Main task schema
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Task title is required"],
      maxLength: [200, "Title cannot exceed 200 characters"],
      minLength: [3, "Title must be at least 3 characters"],
      index: true,
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
      required: [true, "Task must have an assigner"],
      index: true,
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // assignedTo: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //     validate: {
    //       validator: function (value) {
    //         return value.length > 0 || this.assignedToClient;
    //       },
    //       message:
    //         "Task must be assigned to at least one staff member or a client",
    //     },
    //   },
    // ],

    assignedToClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: function (value) {
          return !value || this.assignedTo.length === 0;
        },
        message: "Task cannot be assigned to both staff and client",
      },
    },

    dateAssigned: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },

    // In your taskModel.js, update the dueDate validation:
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: function (value) {
          // Allow due date to be after either dateAssigned OR the current date
          // This allows extending deadlines even if the original assignment date is in the past
          return value > this.dateAssigned || value > new Date();
        },
        message: "Due date must be after assignment date or current date",
      },
      index: true,
    },

    instruction: {
      type: String,
      trim: true,
      required: [true, "Task instruction is required"],
      minLength: [10, "Instruction must be at least 10 characters"],
      maxLength: [5000, "Instruction cannot exceed 5000 characters"],
    },

    taskPriority: {
      type: String,
      trim: true,
      enum: {
        values: ["urgent", "high", "medium", "low"],
        message: "{VALUE} is not a valid priority",
      },
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "in-progress", "completed", "overdue", "cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
      index: true,
    },

    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    reminder: reminderSchema,
    documents: [documentSchema],
    taskResponse: [taskResponseSchema],

    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
taskSchema.index({ assignedBy: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedToClient: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual: Check if task is overdue
taskSchema.virtual("isOverdue").get(function () {
  return this.status !== "completed" && this.dueDate < new Date();
});

// Virtual: Days until due
taskSchema.virtual("daysUntilDue").get(function () {
  const diff = this.dueDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual: Is completed
taskSchema.virtual("isCompleted").get(function () {
  return (
    this.status === "completed" ||
    (this.taskResponse.length > 0 && this.taskResponse[0].completed)
  );
});

// Pre-save middleware: Update status based on conditions
taskSchema.pre("save", function (next) {
  // Update status to overdue if past due date
  if (this.dueDate < new Date() && this.status === "pending") {
    this.status = "overdue";
  }

  // Update status to completed if response indicates completion
  if (this.taskResponse.length > 0 && this.taskResponse[0].completed) {
    this.status = "completed";
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
    this.completionPercentage = 100;
  }

  next();
});

// Pre-find middleware: Populate related fields
taskSchema.pre(/^find/, function (next) {
  this.populate({
    path: "assignedTo",
    select: "firstName lastName email photo position",
  })
    .populate({
      path: "caseToWorkOn",
      select: "firstParty.name.name secondParty.name.name suitNo caseStatus",
    })
    .populate({
      path: "assignedBy",
      select: "firstName lastName email position role photo",
    })
    .populate({
      path: "assignedToClient",
      select: "firstName lastName email photo",
    })
    .populate({
      path: "taskResponse.submittedBy",
      select: "firstName lastName email",
    })
    .populate({
      path: "documents.uploadedBy",
      select: "firstName lastName",
    })
    .populate({
      path: "reminder.sender",
      select: "firstName lastName",
    });

  next();
});

// Method: Check if user can modify task
taskSchema.methods.canModify = function (userId) {
  return this.assignedBy.toString() === userId.toString();
};

// Method: Check if user is assigned to task
taskSchema.methods.isAssignedTo = function (userId) {
  return (
    this.assignedTo.some((user) => user._id.toString() === userId.toString()) ||
    (this.assignedToClient &&
      this.assignedToClient._id.toString() === userId.toString())
  );
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
