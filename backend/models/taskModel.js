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

// Improved Task Response Schema
const taskResponseSchema = new mongoose.Schema({
  respondedBy: {
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
            // Either caseToWorkOn OR customCaseReference should be provided, not both
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
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task assigner is required"],
    },
    // Unified assignment approach
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
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    // Keep legacy fields for backward compatibility
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedToClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dateAssigned: {
      type: Date,
      default: Date.now,
    },
    startDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value >= this.dateAssigned;
        },
        message: "Start date cannot be before assignment date",
      },
    },
    dueDate: {
      type: Date,
      required: [true, "A task must have a due date"],
      validate: [
        {
          validator: function (value) {
            if (!this.dateAssigned) return true;
            return value > this.dateAssigned;
          },
          message: "Due date must be after assignment date",
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
        "overdue",
      ],
      default: "pending",
    },
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
    // Task-level documents (provided when assigning the task)
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

// Virtual for current primary assignee
taskSchema.virtual("primaryAssignee").get(function () {
  const primary = this.assignees.find((a) => a.role === "primary");
  return primary ? primary.user : null;
});

// Virtual for task progress based on responses
taskSchema.virtual("overallProgress").get(function () {
  if (this.taskResponses.length === 0) return 0;

  const totalProgress = this.taskResponses.reduce((sum, response) => {
    return sum + response.completionPercentage;
  }, 0);

  return Math.round(totalProgress / this.taskResponses.length);
});

// Indexes for better performance
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ assignees: 1, status: 1 });
taskSchema.index({ caseToWorkOn: 1 });
taskSchema.index({ assignedBy: 1 });
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

// Virtual for ALL task-related documents (both reference and response documents)
taskSchema.virtual("allDocuments", {
  ref: "File",
  foreignField: "entityId",
  localField: "_id",
  match: {
    entityType: { $in: ["task-reference", "task-response"] },
    isArchived: false,
  },
});

// Virtual for ONLY reference documents (provided when assigning task)
taskSchema.virtual("referenceDocs", {
  ref: "File",
  foreignField: "entityId",
  localField: "_id",
  match: {
    entityType: "task-reference",
    isArchived: false,
  },
});

// Virtual for ONLY response documents (submitted by assignees)
taskSchema.virtual("responseDocuments", {
  ref: "File",
  foreignField: "entityId",
  localField: "_id",
  match: {
    entityType: "task-response",
    isArchived: false,
  },
});

// Enhanced population middleware
taskSchema.pre(/^find/, function (next) {
  if (this.options._skipPopulate) {
    return next();
  }

  const populateOptions = [
    { path: "assignedBy", select: "firstName lastName email position" },
    { path: "assignees.user", select: "firstName lastName email position" },
    { path: "assignedTo", select: "firstName lastName email" },
    { path: "assignedToClient", select: "firstName lastName email" },
    {
      path: "caseToWorkOn",
      select: "suitNo firstParty.name secondParty.name caseStatus",
    },
    {
      path: "referenceDocuments",
      match: { isArchived: false },
    },
    {
      path: "taskResponses.respondedBy",
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

// Instance method to add reference documents
taskSchema.methods.addReferenceDocument = async function (fileId) {
  if (!this.referenceDocuments.includes(fileId)) {
    this.referenceDocuments.push(fileId);
  }
  return await this.save();
};

// Instance method to get all documents with context
taskSchema.methods.getAllDocumentsWithContext = async function () {
  await this.populate("referenceDocuments taskResponses.documents");

  const documents = {
    referenceDocuments: this.referenceDocuments || [],
    responseDocuments: [],
  };

  // Extract documents from all responses
  this.taskResponses.forEach((response) => {
    if (response.documents && response.documents.length > 0) {
      documents.responseDocuments.push({
        responseId: response._id,
        respondedBy: response.respondedBy,
        submittedAt: response.submittedAt,
        documents: response.documents,
      });
    }
  });

  return documents;
};

// Static method to get task with all documents
taskSchema.statics.getTaskWithAllDocuments = async function (taskId) {
  return await this.findById(taskId)
    .populate("referenceDocuments")
    .populate({
      path: "taskResponses",
      populate: [
        {
          path: "respondedBy",
          select: "firstName lastName email",
        },
        {
          path: "documents",
        },
      ],
    });
};

// Static methods
taskSchema.statics.getUserTasks = function (userId, options = {}) {
  const { status, priority, fromDate, toDate } = options;

  let query = {
    $or: [
      { "assignees.user": userId },
      { assignedTo: userId },
      { assignedToClient: userId },
    ],
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

taskSchema.statics.getOverdueTasks = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $in: ["pending", "in-progress", "under-review"] },
    isDeleted: false,
  });
};

// Instance methods
taskSchema.methods.addResponse = async function (responseData) {
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

taskSchema.methods.addAssignee = async function (userId, role, assignedById) {
  // Check if user is already assigned
  const existingAssignment = this.assignees.find(
    (a) => a.user.toString() === userId.toString()
  );

  if (existingAssignment) {
    existingAssignment.role = role;
  } else {
    this.assignees.push({
      user: userId,
      role,
      assignedBy: assignedById,
      assignedAt: new Date(),
    });
  }

  // Also add to legacy field for backward compatibility
  if (!this.assignedTo.includes(userId)) {
    this.assignedTo.push(userId);
  }

  return await this.save();
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
