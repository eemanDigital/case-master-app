const Task = require("../models/taskModel");
const File = require("../models/fileModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const s3Service = require("../services/s3Service");
const path = require("path");

// Create task with simplified assignment
exports.createTask = catchAsync(async (req, res, next) => {
  const { assignees = [], referenceDocuments, ...rest } = req.body;

  const taskData = {
    createdBy: req.user.id,
    ...rest,
  };

  // Create the task first
  const task = await Task.create(taskData);

  // Add the creator as the primary assignee
  await task.addAssignee(req.user.id, "primary", req.user.id, false);

  // Add other assignees if provided
  for (const assigneeData of assignees) {
    await task.addAssignee(
      assigneeData.user,
      assigneeData.role || "collaborator",
      req.user.id,
      assigneeData.isClient || false
    );
  }

  // Add reference documents if provided
  if (referenceDocuments && referenceDocuments.length > 0) {
    task.referenceDocuments = referenceDocuments;
    await task.save();
  }

  // Populate the created task
  const populatedTask = await Task.findById(task._id)
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate(
      "caseToWorkOn",
      "suitNo firstParty.name secondParty.name caseStatus"
    )
    .populate("referenceDocuments");

  res.status(201).json({
    status: "success",
    data: populatedTask,
  });
});

// Get all tasks with advanced filtering and population
exports.getTasks = catchAsync(async (req, res, next) => {
  const {
    status,
    priority,
    category,
    assignedTo,
    caseId,
    startDate,
    endDate,
    includeDeleted,
    onlyDeleted,
    sort = "-dateCreated",
    limit = 50,
    page = 1,
    isClient,
  } = req.query;

  // Build filter object
  const filter = {};

  // Handle deleted tasks
  if (onlyDeleted === "true") {
    filter.isDeleted = true;
  } else if (includeDeleted !== "true") {
    filter.isDeleted = { $ne: true };
  }

  // Add filters
  if (status) filter.status = status;
  if (priority) filter.taskPriority = priority;
  if (category) filter.category = category;

  // Filter by assignee - simplified to only use assignees array
  if (assignedTo) {
    filter["assignees.user"] = assignedTo;

    // If isClient filter is provided, check the isClient field in assignees
    if (isClient === "true") {
      filter["assignees.isClient"] = true;
    } else if (isClient === "false") {
      filter["assignees.isClient"] = false;
    }
  }

  if (caseId) filter.caseToWorkOn = caseId;

  // Date filters
  if (startDate || endDate) {
    filter.dueDate = {};
    if (startDate) filter.dueDate.$gte = new Date(startDate);
    if (endDate) filter.dueDate.$lte = new Date(endDate);
  }

  // Pagination
  const skip = (page - 1) * limit;
  const tasksQuery = Task.find(filter)
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate(
      "caseToWorkOn",
      "suitNo firstParty.name secondParty.name caseStatus"
    )
    .populate("referenceDocuments", "fileName fileUrl fileType fileSize")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const [tasks, total] = await Promise.all([
    tasksQuery,
    Task.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get single task with full population
exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId)
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate(
      "caseToWorkOn",
      "suitNo firstParty.name secondParty.name caseStatus client accountOfficer"
    )
    .populate("referenceDocuments")
    .populate({
      path: "taskResponses.documents",
      match: { isArchived: false },
    })
    .populate({
      path: "taskResponses.submittedBy",
      select: "firstName lastName email position",
    })
    .populate({
      path: "taskResponses.reviewedBy",
      select: "firstName lastName email position",
    })
    .populate("reminders.sender", "firstName lastName email");

  if (!task) {
    return next(new AppError("The task does not exist", 404));
  }

  res.status(200).json({
    status: "success",
    data: task,
  });
});

// Update task
exports.updateTask = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const updateData = { ...req.body };

  // Handle reference documents update
  if (updateData.referenceDocuments) {
    const existingTask = await Task.findById(taskId);
    if (existingTask) {
      updateData.referenceDocuments = [
        ...existingTask.referenceDocuments,
        ...updateData.referenceDocuments,
      ];
    }
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate(
      "caseToWorkOn",
      "suitNo firstParty.name secondParty.name caseStatus"
    )
    .populate("referenceDocuments");

  if (!updatedTask) {
    return next(new AppError("No task found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: updatedTask,
  });
});

// Soft delete task
exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    return next(new AppError("No task found with that ID", 404));
  }

  // Check if user is creator or has permission
  const isCreator = task.createdBy.toString() === req.user.id;
  const isAdmin = ["admin", "super-admin"].includes(req.user.role);

  if (!isCreator && !isAdmin) {
    return next(
      new AppError("You are not authorized to delete this task", 403)
    );
  }

  // Soft delete
  task.isDeleted = true;
  task.deletedAt = new Date();
  task.deletedBy = req.user.id;
  await task.save();

  res.status(200).json({
    status: "success",
    message: "Task deleted successfully",
    data: null,
  });
});

// Add reference documents to task
exports.addReferenceDocuments = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const { documentIds } = req.body;

  if (!documentIds || !Array.isArray(documentIds)) {
    return next(new AppError("Document IDs array is required", 400));
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Verify documents exist and belong to this task
  const documents = await File.find({
    _id: { $in: documentIds },
    entityType: "Task",
    entityId: taskId,
  });

  if (documents.length !== documentIds.length) {
    return next(
      new AppError("Some documents not found or don't belong to this task", 400)
    );
  }

  // Add documents to task
  documentIds.forEach((docId) => {
    if (!task.referenceDocuments.includes(docId)) {
      task.referenceDocuments.push(docId);
    }
  });

  await task.save();

  // Populate and return updated task
  const updatedTask = await Task.findById(taskId).populate(
    "referenceDocuments"
  );

  res.status(204).json({
    status: "success",
    message: "Documents added to task successfully",
    data: updatedTask,
  });
});

// Submit task response with document upload
// Submit task response with document upload
exports.submitTaskResponse = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const {
    status,
    completionPercentage,
    comment,
    documentIds = [],
    timeSpent,
  } = req.body;

  // 1. Find task
  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // 2. Get authenticated user ID as string
  const userId = req.user.id.toString();

  // 3. ✅ Correct assignment verification
  const isAssigned = task.assignees.some((assignee) => {
    if (!assignee.user) return false;

    const assignedUserId =
      typeof assignee.user === "object" && assignee.user._id
        ? assignee.user._id.toString()
        : assignee.user.toString();

    return assignedUserId === userId;
  });

  // ✅ Optional debug (remove in production)
  console.log("AUTH USER:", userId);
  console.log(
    "TASK ASSIGNEES:",
    task.assignees.map((a) =>
      a.user
        ? typeof a.user === "object"
          ? a.user._id.toString()
          : a.user.toString()
        : null
    )
  );

  if (!isAssigned) {
    return next(new AppError("You are not assigned to this task", 403));
  }

  // 4. Build response payload
  const responseData = {
    submittedBy: req.user.id,
    status: status || "in-progress",
    completionPercentage: completionPercentage || 0,
    comment,
    timeSpent: timeSpent || 0,
    documents: documentIds,
  };

  // 5. Save response
  await task.addResponse(responseData);

  // 6. Return populated updated task
  const updatedTask = await Task.findById(taskId)
    .populate({
      path: "taskResponses.documents",
      match: { isArchived: false },
    })
    .populate({
      path: "taskResponses.submittedBy",
      select: "firstName lastName email position",
    });

  // 7. Send success response
  res.status(200).json({
    status: "success",
    message: "Task response submitted successfully",
    data: updatedTask,
  });
});

// Review task response
exports.reviewTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseIndex } = req.params;
  const { approved, reviewComment } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Check if user is authorized to review (should be creator or reviewer role)
  const isCreator = task.createdBy.toString() === req.user.id;
  const isReviewer = task.assignees.some(
    (assignee) =>
      assignee.user.toString() === req.user.id &&
      ["reviewer", "primary"].includes(assignee.role)
  );

  if (!isCreator && !isReviewer) {
    return next(
      new AppError("You are not authorized to review responses", 403)
    );
  }

  const reviewData = {
    reviewedBy: req.user.id,
    approved: approved === true,
    reviewComment,
  };

  await task.reviewResponse(parseInt(responseIndex), reviewData);

  // Get updated task
  const updatedTask = await Task.findById(taskId)
    .populate({
      path: "taskResponses.documents",
      match: { isArchived: false },
    })
    .populate({
      path: "taskResponses.submittedBy",
      select: "firstName lastName email position",
    })
    .populate({
      path: "taskResponses.reviewedBy",
      select: "firstName lastName email position",
    });

  res.status(200).json({
    status: "success",
    message: `Task response ${approved ? "approved" : "returned for review"}`,
    data: updatedTask,
  });
});

// Get user's tasks
exports.getMyTasks = catchAsync(async (req, res, next) => {
  const { status, priority, fromDate, toDate, role } = req.query;

  const tasks = await Task.getUserTasks(req.user.id, {
    status,
    priority,
    fromDate,
    toDate,
  })
    .populate("createdBy", "firstName lastName email position")
    .populate(
      "caseToWorkOn",
      "suitNo firstParty.name secondParty.name caseStatus"
    )
    .populate("referenceDocuments", "fileName fileUrl fileType");

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
  });
});

// Get overdue tasks
exports.getOverdueTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.getOverdueTasks()
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate("caseToWorkOn", "suitNo firstParty.name secondParty.name");

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
  });
});

// Add assignee to task
exports.addAssignee = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const { userId, role = "primary", isClient = false } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Check if user has permission to add assignees (creator or admin)
  const isCreator = task.createdBy.toString() === req.user.id;
  const isAdmin = ["admin", "super-admin"].includes(req.user.role);

  if (!isCreator && !isAdmin) {
    return next(new AppError("You are not authorized to add assignees", 403));
  }

  await task.addAssignee(userId, role, req.user.id, isClient);

  const updatedTask = await Task.findById(taskId)
    .populate("assignees.user", "firstName lastName email position")
    .populate("createdBy", "firstName lastName email position");

  res.status(200).json({
    status: "success",
    message: "Assignee added successfully",
    data: updatedTask,
  });
});

// Remove assignee from task
exports.removeAssignee = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const { userId } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Check if user has permission to remove assignees (creator or admin)
  const isCreator = task.createdBy.toString() === req.user.id;
  const isAdmin = ["admin", "super-admin"].includes(req.user.role);

  if (!isCreator && !isAdmin) {
    return next(
      new AppError("You are not authorized to remove assignees", 403)
    );
  }

  await task.removeAssignee(userId);

  const updatedTask = await Task.findById(taskId)
    .populate("assignees.user", "firstName lastName email position")
    .populate("createdBy", "firstName lastName email position");

  res.status(200).json({
    status: "success",
    message: "Assignee removed successfully",
    data: updatedTask,
  });
});

// Get task documents (both reference and response documents)
exports.getTaskDocuments = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Get all documents related to this task
  const [referenceDocuments, responseDocuments] = await Promise.all([
    // Reference documents
    File.find({
      entityType: "Task",
      entityId: taskId,
      "metadata.uploadType": "task-reference",
      isDeleted: { $ne: true },
      isArchived: { $ne: true },
    }).populate("uploadedBy", "firstName lastName email"),

    // Response documents
    File.find({
      entityType: "Task",
      entityId: taskId,
      "metadata.uploadType": "task-response",
      isDeleted: { $ne: true },
      isArchived: { $ne: true },
    }).populate("uploadedBy", "firstName lastName email"),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
      },
      referenceDocuments,
      responseDocuments,
      totalDocuments: referenceDocuments.length + responseDocuments.length,
    },
  });
});

// Upload reference documents for task with pre-signed URLs
exports.uploadReferenceDocuments = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;

  if (!req.files || req.files.length === 0) {
    return next(new AppError("Please upload at least one file", 400));
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const { description } = req.body;
  const uploadedFiles = [];

  // Process each file
  for (const file of req.files) {
    // Upload to S3 with pre-signed URL generation
    const uploadResult = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        category: "task-document",
        entityType: "Task",
        entityId: taskId,
        uploadedBy: req.user.id,
        metadata: {
          uploadType: "task-reference",
          taskId: taskId,
          taskTitle: task.title,
          uploadedBy: req.user.id.toString(),
        },
      }
    );

    // Create file record with both URLs
    const fileRecord = await File.create({
      fileName: file.originalname,
      originalName: file.originalname,
      s3Key: uploadResult.s3Key,
      s3Bucket: uploadResult.bucket,
      s3Region: uploadResult.region,
      fileUrl: uploadResult.fileUrl,
      presignedUrl: uploadResult.presignedUrl,
      uploadedBy: req.user.id,
      fileSize: file.size,
      fileType: path.extname(file.originalname).substring(1),
      mimeType: file.mimetype,
      description,
      category: "task-document",
      entityType: "Task",
      entityId: taskId,
      metadata: {
        uploadType: "task-reference",
        taskId: taskId,
        taskTitle: task.title,
        uploadedBy: req.user.id.toString(),
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    console.log("✅ Task reference document uploaded:", {
      fileId: fileRecord._id,
      fileName: fileRecord.fileName,
      taskId: taskId,
      hasPresignedUrl: !!uploadResult.presignedUrl,
    });

    // Add to task's reference documents
    if (!task.referenceDocuments.includes(fileRecord._id)) {
      task.referenceDocuments.push(fileRecord._id);
    }

    uploadedFiles.push(fileRecord);
  }

  await task.save();

  // Populate and return updated task
  const updatedTask = await Task.findById(taskId).populate({
    path: "referenceDocuments",
    select:
      "fileName fileSize fileUrl presignedUrl description uploadedBy createdAt",
  });

  res.status(201).json({
    status: "success",
    message: `Successfully uploaded ${uploadedFiles.length} reference document(s)`,
    data: {
      files: uploadedFiles.map((file) => ({
        _id: file._id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileUrl: file.fileUrl,
        presignedUrl: file.presignedUrl,
        description: file.description,
        uploadedBy: file.uploadedBy,
        createdAt: file.createdAt,
      })),
      task: updatedTask,
    },
  });
});

// Upload response documents for task with pre-signed URLs
exports.uploadResponseDocuments = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const { responseId, description } = req.body;

  if (!req.files || req.files.length === 0) {
    return next(new AppError("Please upload at least one file", 400));
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Verify user is assigned to this task
  if (!task.isUserAssigned(req.user.id)) {
    return next(new AppError("You are not assigned to this task", 403));
  }

  // If responseId is provided, add to specific response
  let targetResponse;
  if (responseId) {
    targetResponse = task.taskResponses.id(responseId);
    if (!targetResponse) {
      return next(new AppError("Task response not found", 404));
    }
  }

  const uploadedFiles = [];

  for (const file of req.files) {
    // Upload to S3 with pre-signed URL generation
    const uploadResult = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        category: "task-document",
        entityType: "Task",
        entityId: taskId,
        uploadedBy: req.user.id,
        metadata: {
          uploadType: "task-response",
          taskId: taskId,
          responseId: responseId,
          taskTitle: task.title,
          uploadedBy: req.user.id.toString(),
        },
      }
    );

    // Create file record with both URLs
    const fileRecord = await File.create({
      fileName: file.originalname,
      originalName: file.originalname,
      s3Key: uploadResult.s3Key,
      s3Bucket: uploadResult.bucket,
      s3Region: uploadResult.region,
      fileUrl: uploadResult.fileUrl,
      presignedUrl: uploadResult.presignedUrl,
      uploadedBy: req.user.id,
      fileSize: file.size,
      fileType: path.extname(file.originalname).substring(1),
      mimeType: file.mimetype,
      description,
      category: "task-document",
      entityType: "Task",
      entityId: taskId,
      metadata: {
        uploadType: "task-response",
        taskId: taskId,
        responseId: responseId,
        taskTitle: task.title,
        uploadedBy: req.user.id.toString(),
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    console.log("✅ Task response document uploaded:", {
      fileId: fileRecord._id,
      fileName: fileRecord.fileName,
      taskId: taskId,
      responseId: responseId,
      hasPresignedUrl: !!uploadResult.presignedUrl,
    });

    // Add to task response or create new response
    if (targetResponse) {
      targetResponse.documents.push(fileRecord._id);
    } else {
      // Create a new response
      task.taskResponses.push({
        submittedBy: req.user.id,
        status: "in-progress",
        documents: [fileRecord._id],
        comment: description || "Files uploaded",
        submittedAt: new Date(),
      });
    }

    uploadedFiles.push(fileRecord);
  }

  await task.save();

  // Populate and return updated task with document URLs
  const updatedTask = await Task.findById(taskId)
    .populate("referenceDocuments")
    .populate({
      path: "taskResponses.documents",
      select:
        "fileName fileSize fileUrl presignedUrl description uploadedBy createdAt",
    })
    .populate("taskResponses.submittedBy", "firstName lastName email");

  res.status(201).json({
    status: "success",
    message: `Successfully uploaded ${uploadedFiles.length} response document(s)`,
    data: {
      files: uploadedFiles.map((file) => ({
        _id: file._id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileUrl: file.fileUrl,
        presignedUrl: file.presignedUrl,
        description: file.description,
        uploadedBy: file.uploadedBy,
        createdAt: file.createdAt,
      })),
      task: updatedTask,
    },
  });
});

// Generate fresh pre-signed URL for a file (if needed)
exports.refreshFileDownloadUrl = catchAsync(async (req, res, next) => {
  const { fileId } = req.params;

  const file = await File.findById(fileId);
  if (!file) {
    return next(new AppError("File not found", 404));
  }

  // Verify the user has access to this file
  const task = await Task.findOne({
    $or: [
      { referenceDocuments: fileId },
      { "taskResponses.documents": fileId },
    ],
  });

  if (!task) {
    return next(new AppError("File not associated with any task", 404));
  }

  // Check if user is assigned to the task
  const isAssigned = task.isUserAssigned(req.user.id);
  const isUploader = file.uploadedBy.toString() === req.user.id;
  const isCreator = task.createdBy.toString() === req.user.id;

  if (!isAssigned && !isUploader && !isCreator) {
    return next(new AppError("Not authorized to access this file", 403));
  }

  try {
    // Generate a fresh pre-signed URL
    const newPresignedUrl = await s3Service.getPresignedUrl(file.s3Key, 3600);

    // Update the file record with the new pre-signed URL
    file.presignedUrl = newPresignedUrl;
    await file.save();

    res.status(200).json({
      status: "success",
      data: {
        downloadUrl: newPresignedUrl,
        fileName: file.fileName,
        expiresIn: 3600,
        message: "Download URL refreshed successfully",
      },
    });
  } catch (error) {
    console.error("Error refreshing download URL:", error);
    return next(new AppError("Failed to generate download URL", 500));
  }
});

// Delete task response

exports.deleteTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Find the response index
  const responseIndex = task.taskResponses.findIndex(
    (response) => response._id.toString() === responseId
  );

  if (responseIndex === -1) {
    return next(new AppError("Response not found", 404));
  }

  const response = task.taskResponses[responseIndex];

  // Check authorization
  const userId = req.user.id.toString();
  let isSubmitter = false;

  if (response.submittedBy) {
    if (typeof response.submittedBy === "object" && response.submittedBy._id) {
      isSubmitter = response.submittedBy._id.toString() === userId;
    } else {
      isSubmitter = response.submittedBy.toString() === userId;
    }
  }

  const isAdmin =
    req.user.role && ["admin", "super-admin"].includes(req.user.role);

  if (!isSubmitter && !isAdmin) {
    return next(
      new AppError("You are not authorized to delete this response", 403)
    );
  }

  // ACTUALLY REMOVE THE RESPONSE FROM THE ARRAY
  task.taskResponses.splice(responseIndex, 1);

  // Or if you want to keep it for audit, use pull():
  // task.taskResponses.pull(responseId);

  await task.save();

  // Get updated task
  const updatedTask = await Task.findById(taskId)
    .populate({
      path: "taskResponses.submittedBy",
      select: "firstName lastName email position",
    })
    .populate({
      path: "taskResponses.reviewedBy",
      select: "firstName lastName email position",
    })
    .populate("createdBy", "firstName lastName email position");

  res.status(204).json({
    status: "success",
    message: "Task response deleted successfully",
    data: updatedTask,
  });
});

// Check task access and permissions
exports.checkTaskAccess = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const isAssigned = task.isUserAssigned(req.user.id);
  const isCreator = task.createdBy.toString() === req.user.id;
  const canSubmitResponse = isAssigned && task.canSubmitResponse(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      canAccess: isAssigned || isCreator,
      isAssigned,
      isCreator,
      canSubmitResponse,
      isAdmin: ["admin", "super-admin"].includes(req.user.role),
      task: {
        _id: task._id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
      },
    },
  });
});

// Get tasks for specific assignee
exports.getTasksByAssignee = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { status, priority, fromDate, toDate } = req.query;

  let query = {
    "assignees.user": userId,
    isDeleted: false,
  };

  if (status) query.status = status;
  if (priority) query.taskPriority = priority;
  if (fromDate || toDate) {
    query.dueDate = {};
    if (fromDate) query.dueDate.$gte = new Date(fromDate);
    if (toDate) query.dueDate.$lte = new Date(toDate);
  }

  const tasks = await Task.find(query)
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate(
      "caseToWorkOn",
      "suitNo firstParty.name secondParty.name caseStatus"
    )
    .sort({ dueDate: 1, taskPriority: -1 });

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
  });
});

// Submit task for review (Assignee action)
exports.submitTaskForReview = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const { comment, documentIds = [] } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Check if user is assigned to this task
  const isAssigned = task.isUserAssigned(req.user.id);
  if (!isAssigned) {
    return next(new AppError("You are not assigned to this task", 403));
  }

  // Check current status - only allow submission from "in-progress"
  if (task.status !== "in-progress" && task.status !== "rejected") {
    return next(
      new AppError(
        `Task cannot be submitted for review from ${task.status} status`,
        400
      )
    );
  }

  // Update task status
  task.status = "under-review";
  task.submittedForReviewAt = new Date();
  task.lastSubmittedBy = req.user.id;

  // Create a task response entry for this submission
  const responseData = {
    submittedBy: req.user.id,
    status: "under-review",
    comment: comment || "Task submitted for review",
    documents: documentIds,
    submittedAt: new Date(),
  };

  await task.addResponse(responseData);

  // Create history entry
  await task.addHistoryEntry({
    action: "submitted_for_review",
    description: "Task submitted for review and approval",
    by: req.user.id,
    changes: { status: "under-review" },
  });

  await task.save();

  // Populate and return updated task
  const updatedTask = await Task.findById(taskId)
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate({
      path: "taskResponses.submittedBy",
      select: "firstName lastName email position",
    })
    .populate("lastSubmittedBy", "firstName lastName email position");

  res.status(200).json({
    status: "success",
    message: "Task submitted for review successfully",
    data: updatedTask,
  });
});

// Review task and mark as completed (Task Giver action)
exports.reviewTask = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const { approve, reviewComment, rating, sendNotification = true } = req.body;

  if (approve === undefined) {
    return next(new AppError("Approve status is required", 400));
  }

  const task = await Task.findById(taskId)
    .populate("createdBy", "firstName lastName email")
    .populate("assignees.user", "firstName lastName email");

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Check if user is the task creator/assigner
  const isCreator = task.createdBy._id.toString() === req.user.id;
  const isAssignedBy = task.assignees.some(
    (assignee) =>
      assignee.assignedBy && assignee.assignedBy.toString() === req.user.id
  );

  if (!isCreator && !isAssignedBy) {
    return next(
      new AppError("Only task creator/assigner can review tasks", 403)
    );
  }

  // Check if task is in review status
  if (task.status !== "under-review") {
    return next(new AppError("Task is not currently under review", 400));
  }

  // Update task based on review decision
  const previousStatus = task.status;

  if (approve) {
    // Approve and mark as completed
    task.status = "completed";
    task.completedAt = new Date();
    task.completionPercentage = 100;
    task.reviewedBy = req.user.id;
    task.reviewedAt = new Date();
    task.reviewComment = reviewComment;
    task.rating = rating;

    // Mark the latest response as approved
    if (task.taskResponses.length > 0) {
      const latestResponse = task.taskResponses[task.taskResponses.length - 1];
      latestResponse.approved = true;
      latestResponse.reviewedBy = req.user.id;
      latestResponse.reviewedAt = new Date();
      latestResponse.reviewComment = reviewComment;
    }
  } else {
    // Reject and return for revision
    task.status = "rejected";
    task.reviewedBy = req.user.id;
    task.reviewedAt = new Date();
    task.reviewComment = reviewComment;

    // Mark the latest response as rejected
    if (task.taskResponses.length > 0) {
      const latestResponse = task.taskResponses[task.taskResponses.length - 1];
      latestResponse.approved = false;
      latestResponse.reviewedBy = req.user.id;
      latestResponse.reviewedAt = new Date();
      latestResponse.reviewComment = reviewComment;
    }
  }

  // Create history entry
  await task.addHistoryEntry({
    action: approve ? "approved" : "rejected",
    description: approve
      ? "Task approved and marked as completed"
      : "Task returned for revision",
    by: req.user.id,
    changes: {
      status: task.status,
      rating,
      reviewComment,
      previousStatus,
    },
  });

  await task.save();

  // Send email notification if requested
  if (sendNotification) {
    try {
      // Get assignee's email
      const assignee = task.assignees[0]?.user;
      if (assignee?.email) {
        const emailData = {
          subject: approve
            ? `Task Approved: ${task.title}`
            : `Task Requires Revision: ${task.title}`,
          send_to: assignee.email,
          reply_to: "noreply@atlukman.com",
          template: approve ? "taskApproved" : "taskRevision",
          url: "/dashboard/tasks",
          context: {
            recipient: `${assignee.firstName} ${assignee.lastName}`,
            taskTitle: task.title,
            reviewer: `${req.user.firstName} ${req.user.lastName}`,
            reviewComment: reviewComment,
            rating: rating,
            completionDate: task.completedAt
              ? formatDate(task.completedAt)
              : null,
          },
        };

        // You need to import your email service
        // await dispatch(sendAutomatedCustomEmail(emailData));
      }
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }
  }

  // Populate and return updated task
  const updatedTask = await Task.findById(taskId)
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate("reviewedBy", "firstName lastName email position")
    .populate({
      path: "taskResponses.submittedBy",
      select: "firstName lastName email position",
    })
    .populate({
      path: "taskResponses.reviewedBy",
      select: "firstName lastName email position",
    });

  res.status(200).json({
    status: "success",
    message: approve
      ? "Task approved and marked as completed"
      : "Task returned for revision",
    data: updatedTask,
  });
});

// Force mark task as complete (Admin/Task Giver action)
exports.forceCompleteTask = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;
  const { completionComment, completionPercentage = 100 } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Check permissions
  const isCreator = task.createdBy.toString() === req.user.id;
  const isAdmin = ["admin", "super-admin"].includes(req.user.role);

  if (!isCreator && !isAdmin) {
    return next(
      new AppError("Only task creator or admin can force complete tasks", 403)
    );
  }

  // Update task
  const previousStatus = task.status;
  task.status = "completed";
  task.completedAt = new Date();
  task.completionPercentage = completionPercentage;
  task.forceCompletedBy = req.user.id;
  task.forceCompletedAt = new Date();
  task.forceCompletionComment = completionComment;

  // Create history entry
  await task.addHistoryEntry({
    action: "force_completed",
    description: "Task force marked as completed",
    by: req.user.id,
    changes: {
      status: "completed",
      previousStatus,
      completionPercentage,
      forceCompletedBy: req.user.id,
    },
  });

  await task.save();

  // Populate and return updated task
  const updatedTask = await Task.findById(taskId)
    .populate("createdBy", "firstName lastName email position")
    .populate("assignees.user", "firstName lastName email position")
    .populate("forceCompletedBy", "firstName lastName email position");

  res.status(200).json({
    status: "success",
    message: "Task force marked as completed",
    data: updatedTask,
  });
});

// Get tasks pending review (for task givers)
exports.getTasksPendingReview = catchAsync(async (req, res, next) => {
  const {
    createdByMe = "false",
    assignedToMe = "false",
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {
    status: "under-review",
    isDeleted: { $ne: true },
  };

  // If user wants tasks created by them
  if (createdByMe === "true") {
    filter.createdBy = req.user.id;
  }

  // If user wants tasks assigned to them (they are reviewers)
  if (assignedToMe === "true") {
    filter["assignees.user"] = req.user.id;
    filter["assignees.role"] = { $in: ["primary", "reviewer"] };
  }

  // Pagination
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate("createdBy", "firstName lastName email position")
      .populate("assignees.user", "firstName lastName email position")
      .populate("lastSubmittedBy", "firstName lastName email position")
      .populate(
        "caseToWorkOn",
        "suitNo firstParty.name secondParty.name caseStatus"
      )
      .sort({ submittedForReviewAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Task.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get task history/audit trail
exports.getTaskHistory = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Check if user has access to this task
  const isAssigned = task.isUserAssigned(req.user.id);
  const isCreator = task.createdBy.toString() === req.user.id;

  if (!isAssigned && !isCreator) {
    return next(new AppError("You do not have access to this task", 403));
  }

  // Assuming you have a TaskHistory model or history array in Task model
  // This implementation assumes Task has a history array
  const history = task.history || [];

  // If you have a separate TaskHistory model:
  // const history = await TaskHistory.find({ task: taskId })
  //   .populate('by', 'firstName lastName email')
  //   .sort('-timestamp');

  res.status(200).json({
    status: "success",
    results: history.length,
    data: history,
  });
});
