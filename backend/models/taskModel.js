const mongoose = require("mongoose");

// Sub-document schemas
const reminderSchema = new mongoose.Schema({
  message: {
    type: String,
    maxLength: [50, "Message should not exceed 50 characters"],
    required: [true, "Reminder message is required"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  scheduledFor: {
    type: Date,
    required: [true, "Reminder schedule time is required"],
  },
  status: {
    type: String,
    enum: ["pending", "sent", "cancelled"],
    default: "pending",
  },
});

const taskResponseSchema = new mongoose.Schema({
  completed: {
    type: Boolean,
    default: false,
  },
  documents: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  comments: {
    type: String,
    trim: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  timeSpent: {
    // For tracking time spent on task
    type: Number, // in minutes
    default: 0,
  },
});

const taskDocumentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, "File name is required"],
    trim: true,
  },
  fileUrl: {
    type: String,
    required: [true, "File URL is required"],
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  fileSize: Number,
  mimeType: String,
});

// Main task schema
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Task title is required"],
      maxLength: [100, "Title should not exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    instruction: {
      type: String,
      trim: true,
      required: [true, "Task instructions are required"],
    },

    // Relationships
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: [true, "Task must be associated with a case"],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["primary", "collaborator", "reviewer"],
          default: "primary",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Timeline
    dateAssigned: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: function (value) {
          return value > this.dateAssigned;
        },
        message: "Due date must be after assignment date",
      },
    },
    completedAt: Date,

    // Task metadata
    status: {
      type: String,
      enum: [
        "pending",
        "in-progress",
        "under-review",
        "completed",
        "overdue",
        "cancelled",
      ],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: [
        "research",
        "drafting",
        "filing",
        "hearing",
        "client-meeting",
        "discovery",
        "other",
      ],
      required: true,
    },
    estimatedHours: Number,

    // Task components
    reminders: [reminderSchema],
    documents: [taskDocumentSchema],
    responses: [taskResponseSchema],

    // Tracking
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
taskSchema.index({ case: 1, status: 1 });
taskSchema.index({ "assignedTo.user": 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1, dueDate: 1 });

// Virtual for overdue tasks
taskSchema.virtual("isOverdue").get(function () {
  return this.dueDate < new Date() && this.status !== "completed";
});

// Virtual for task progress
taskSchema.virtual("progress").get(function () {
  const statusProgress = {
    pending: 0,
    "in-progress": 50,
    "under-review": 75,
    completed: 100,
    overdue: 0,
    cancelled: 0,
  };
  return statusProgress[this.status] || 0;
});

// Pre-save middleware to update lastUpdated
taskSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

// Query middleware for population
// In your taskModel.js, update the population
taskSchema.pre(/^find/, function (next) {
  this.populate([
    { path: "assignedBy", select: "firstName lastName email" },
    { path: "assignedTo.user", select: "firstName lastName email role" },
    { path: "case", select: "caseNumber title status" },
    { path: "updatedBy", select: "firstName lastName" },
    { path: "documents.uploadedBy", select: "firstName lastName" },
    { path: "responses.submittedBy", select: "firstName lastName" },
  ]);
  next();
});

// Static method to find overdue tasks
taskSchema.statics.findOverdue = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $in: ["pending", "in-progress", "under-review"] },
  });
};

// Instance method to mark as complete
taskSchema.methods.markComplete = function (responseData) {
  this.status = "completed";
  this.completedAt = new Date();
  if (responseData) {
    this.responses.push(responseData);
  }
  return this.save();
};

// Instance method to add reminder
taskSchema.methods.addReminder = function (reminderData) {
  this.reminders.push(reminderData);
  return this.save();
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
