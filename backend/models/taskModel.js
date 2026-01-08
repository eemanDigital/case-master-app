const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  message: {
    type: String,
    maxLength: [150, "Message should not be more than 150 characters"],
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
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isSent: {
    type: Boolean,
    default: false,
  },
  sentAt: Date,
});

// Task Response Schema
const taskResponseSchema = new mongoose.Schema({
  // This is the user who submitted the response (must be one of the assignees)
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Responder is required"],
  },
  status: {
    type: String,
    enum: ["in-progress", "completed", "needs-review", "rejected", "on-hold"],
    default: "in-progress",
    required: true,
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function (value) {
        if (this.status === "completed" && value !== 100) {
          return false;
        }
        return true;
      },
      message: "Completion percentage must be 100 when status is 'completed'",
    },
  },
  comment: {
    type: String,
    trim: true,
    maxLength: [1000, "Comment should not exceed 1000 characters"],
  },
  documents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reviewedAt: Date,
  reviewComment: {
    type: String,
    trim: true,
    maxLength: [1000, "Review comment should not exceed 1000 characters"],
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0,
    min: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "A task must have a title"],
      maxLength: [200, "Title should not exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [2000, "Description should not exceed 2000 characters"],
    },
    caseToWorkOn: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Case",
        validate: {
          validator: function (cases) {
            return cases.length > 0 || this.customCaseReference;
          },
          message:
            "Either link to existing case or provide custom case reference",
        },
      },
    ],
    customCaseReference: {
      type: String,
      trim: true,
      maxLength: [100, "Case reference should not exceed 100 characters"],
    },

    // Single field: Who created/assigned the task
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task creator is required"],
    },

    // Consolidated assignment field - ONLY THIS ONE
    assignees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["primary", "collaborator", "reviewer", "viewer"],
          default: "primary",
        },
        // Who assigned this person to the task
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        // Track if this assignee is a client user
        isClient: {
          type: Boolean,
          default: false,
        },
      },
    ],

    dateCreated: {
      type: Date,
      default: Date.now,
    },
    startDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value >= this.dateCreated;
        },
        message: "Start date cannot be before creation date",
      },
    },
    dueDate: {
      type: Date,
      required: [true, "A task must have a due date"],
      validate: [
        {
          validator: function (value) {
            if (!this.dateCreated) return true;
            return value > this.dateCreated;
          },
          message: "Due date must be after creation date",
        },
        {
          validator: function (value) {
            if (!this.startDate) return true;
            return value >= this.startDate;
          },
          message: "Due date must be after start date",
        },
      ],
    },
    actualCompletionDate: Date,
    instruction: {
      type: String,
      trim: true,
      required: [true, "A task must have an instruction"],
      maxLength: [5000, "Instructions should not exceed 5000 characters"],
    },
    taskPriority: {
      type: String,
      enum: ["urgent", "high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in-progress",
        "under-review",
        "completed",
        "cancelled",
        "rejected",
        "overdue",
      ],
      default: "pending",
    },
    // In your task model
    category: {
      type: String,
      enum: [
        "legal-research",
        "document-drafting",
        "client-meeting",
        "court-filing",
        "discovery",
        "correspondence",
        "administrative",
        "other",
      ],
      default: "other",
    },
    estimatedEffort: {
      type: Number, // in hours
      min: 0,
    },
    referenceDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
    reminders: [reminderSchema],
    taskResponses: [taskResponseSchema],
    tags: [
      {
        type: String,
        trim: true,
        maxLength: [50, "Tag should not exceed 50 characters"],
      },
    ],
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    isTemplate: {
      type: Boolean,
      default: false,
    },
    templateName: {
      type: String,
      trim: true,
    },
    recurrence: {
      pattern: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly", "yearly"],
        default: "none",
      },
      endAfter: Date,
      occurrences: Number,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Review & completion tracking
    submittedForReviewAt: Date,
    lastSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewComment: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    forceCompletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    forceCompletedAt: Date,
    forceCompletionComment: String,

    // History/audit trail
    history: [
      {
        action: String,
        description: String,
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        changes: mongoose.Schema.Types.Mixed,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for overdue status
taskSchema.virtual("isOverdue").get(function () {
  return this.dueDate < new Date() && this.status !== "completed";
});

// Virtual for primary assignee
taskSchema.virtual("primaryAssignee").get(function () {
  const primary = this.assignees.find((a) => a.role === "primary");
  return primary ? primary.user : null;
});

// Virtual for all non-client assignees
taskSchema.virtual("teamAssignees").get(function () {
  return this.assignees.filter((a) => !a.isClient);
});

// Virtual for client assignees
taskSchema.virtual("clientAssignees").get(function () {
  return this.assignees.filter((a) => a.isClient);
});

// Virtual for task progress based on responses
taskSchema.virtual("overallProgress").get(function () {
  if (this.taskResponses.length === 0) return 0;

  const totalProgress = this.taskResponses.reduce((sum, response) => {
    return sum + response.completionPercentage;
  }, 0);

  return Math.round(totalProgress / this.taskResponses.length);
});

// Add these instance methods to your taskSchema methods:
taskSchema.methods.addHistoryEntry = async function (entry) {
  this.history.push({
    ...entry,
    timestamp: new Date(),
  });
  return this.save();
};

taskSchema.methods.canSubmitForReview = function (userId) {
  const userAssignment = this.assignees.find(
    (a) => a.user.toString() === userId.toString()
  );

  if (!userAssignment) return false;

  // Only allow submission if task is in progress or rejected
  return ["in-progress", "rejected"].includes(this.status);
};

taskSchema.methods.canReview = function (userId) {
  // User can review if they created the task
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }

  // Or if they assigned the task (check assignees where assignedBy matches)
  const userAssignment = this.assignees.find(
    (a) => a.assignedBy && a.assignedBy.toString() === userId.toString()
  );

  return !!userAssignment;
};

// Check if task is ready for review
taskSchema.methods.isReadyForReview = function () {
  return this.status === "in-progress" || this.status === "rejected";
};

// Check if task is under review
taskSchema.methods.isUnderReview = function () {
  return this.status === "under-review";
};

// Get the latest response
taskSchema.methods.getLatestResponse = function () {
  if (this.taskResponses.length === 0) return null;
  return this.taskResponses[this.taskResponses.length - 1];
};

// Indexes for better performance
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ "assignees.user": 1, status: 1 });
taskSchema.index({ caseToWorkOn: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ isDeleted: 1 });

// Middleware to handle status updates
taskSchema.pre("save", function (next) {
  // Auto-update status based on due date
  if (
    this.dueDate < new Date() &&
    !["completed", "cancelled"].includes(this.status)
  ) {
    this.status = "overdue";
  }

  // Update actual completion date when task is completed
  if (
    this.isModified("status") &&
    this.status === "completed" &&
    !this.actualCompletionDate
  ) {
    this.actualCompletionDate = new Date();
  }

  next();
});

// Population middleware
taskSchema.pre(/^find/, function (next) {
  if (this.options._skipPopulate) {
    return next();
  }

  const populateOptions = [
    { path: "createdBy", select: "firstName lastName email position" },
    { path: "assignees.user", select: "firstName lastName email position" },
    {
      path: "caseToWorkOn",
      select: "suitNo firstParty.name secondParty.name caseStatus",
    },
    {
      path: "referenceDocuments",
      match: { isArchived: false },
    },
    {
      path: "taskResponses.submittedBy",
      select: "firstName lastName email position",
    },
    {
      path: "taskResponses.reviewedBy",
      select: "firstName lastName email position",
    },
    {
      path: "taskResponses.documents",
      match: { isArchived: false },
    },
    {
      path: "reminders.sender",
      select: "firstName lastName email",
    },
  ];

  this.populate(populateOptions);
  next();
});

// Instance method to add assignee
taskSchema.methods.addAssignee = async function (
  userId,
  role,
  assignedById,
  isClient = false
) {
  // Check if user is already assigned
  const existingAssignment = this.assignees.find(
    (a) => a.user.toString() === userId.toString()
  );

  if (existingAssignment) {
    existingAssignment.role = role;
    existingAssignment.isClient = isClient;
  } else {
    this.assignees.push({
      user: userId,
      role,
      assignedBy: assignedById,
      assignedAt: new Date(),
      isClient,
    });
  }

  return await this.save();
};

// Instance method to remove assignee
taskSchema.methods.removeAssignee = async function (userId) {
  const initialLength = this.assignees.length;
  this.assignees = this.assignees.filter(
    (a) => a.user.toString() !== userId.toString()
  );

  if (this.assignees.length < initialLength) {
    return await this.save();
  }

  return this;
};

// Instance method to check if user is assigned
taskSchema.methods.isUserAssigned = function (userId) {
  const userIdStr = userId.toString();

  return this.assignees.some((assignee) => {
    if (!assignee.user) return false;

    // Handle both ObjectId and populated user object
    const assigneeUserId =
      typeof assignee.user === "object" && assignee.user._id
        ? assignee.user._id.toString()
        : assignee.user.toString();

    return assigneeUserId === userIdStr;
  });
};

// Instance method to check if user can submit response
taskSchema.methods.canSubmitResponse = function (userId) {
  return this.isUserAssigned(userId);
};

// Instance method to submit response
// In taskModel.js - Fix the addResponse method

// Instance method to submit response
taskSchema.methods.addResponse = async function (responseData) {
  // Verify the user is assigned to the task - FIXED VERSION
  const userId = responseData.submittedBy.toString();

  const isAssigned = this.assignees.some((assignee) => {
    if (!assignee.user) return false;

    // Handle both ObjectId and populated user object
    const assigneeUserId =
      typeof assignee.user === "object" && assignee.user._id
        ? assignee.user._id.toString()
        : assignee.user.toString();

    return assigneeUserId === userId;
  });

  if (!isAssigned) {
    throw new Error("User is not assigned to this task");
  }

  const response = {
    ...responseData,
    submittedAt: new Date(),
  };

  this.taskResponses.push(response);

  // Update task status based on response
  if (response.status === "completed") {
    this.status = "under-review";
  } else if (response.status === "in-progress" && this.status === "pending") {
    this.status = "in-progress";
  }

  return await this.save();
};

// Instance method to review response
taskSchema.methods.reviewResponse = async function (responseIndex, reviewData) {
  if (responseIndex >= this.taskResponses.length) {
    throw new Error("Response not found");
  }

  const response = this.taskResponses[responseIndex];
  response.reviewedBy = reviewData.reviewedBy;
  response.reviewedAt = new Date();
  response.reviewComment = reviewData.reviewComment;

  if (reviewData.approved) {
    response.status = "completed";
    response.completionPercentage = 100;

    // Check if all responses are completed to mark task as completed
    const allCompleted = this.taskResponses.every(
      (r) => r.status === "completed" && r.completionPercentage === 100
    );

    if (allCompleted) {
      this.status = "completed";
      this.actualCompletionDate = new Date();
    }
  } else {
    response.status = "needs-review";
  }

  return await this.save();
};

// Static method to get user's tasks
taskSchema.statics.getUserTasks = function (userId, options = {}) {
  const { status, priority, fromDate, toDate } = options;

  let query = {
    "assignees.user": userId,
    isDeleted: false,
  };

  if (status) query.status = status;
  if (priority) query.taskPriority = priority;
  if (fromDate || toDate) {
    query.dueDate = {};
    if (fromDate) query.dueDate.$gte = fromDate;
    if (toDate) query.dueDate.$lte = toDate;
  }

  return this.find(query).sort({ dueDate: 1, taskPriority: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $in: ["pending", "in-progress", "under-review"] },
    isDeleted: false,
  });
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
