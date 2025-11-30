const Task = require("../models/taskModel");
const File = require("../models/fileModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const s3Service = require("../services/s3Service");
const path = require("path");

// Create task with proper document handling
exports.createTask = catchAsync(async (req, res, next) => {
  const { assignedBy, referenceDocuments, ...rest } = req.body;

  const taskData = {
    assignedBy: req.user.id,
    ...rest,
  };

  // Add reference documents if provided
  if (referenceDocuments && referenceDocuments.length > 0) {
    taskData.referenceDocuments = referenceDocuments;
  }

  const task = await Task.create(taskData);

  // Populate the created task
  const populatedTask = await Task.findById(task._id)
    .populate("assignedBy", "firstName lastName email position")
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
    sort = "-dateAssigned",
    limit = 50,
    page = 1,
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
  if (assignedTo) {
    filter.$or = [
      { "assignees.user": assignedTo },
      { assignedTo: assignedTo },
      { assignedToClient: assignedTo },
    ];
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
    .populate("assignedBy", "firstName lastName email position")
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
    .populate("assignedBy", "firstName lastName email position")
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
      path: "taskResponses.respondedBy",
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
    // You might want to merge instead of replace
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
    .populate("assignedBy", "firstName lastName email position")
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

  console.log(documentIds);

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

  res.status(200).json({
    status: "success",
    message: "Documents added to task successfully",
    data: updatedTask,
  });
});

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

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Verify user is assigned to this task
  const isAssigned =
    task.assignees.some(
      (assignee) => assignee.user.toString() === req.user.id
    ) || task.assignedTo.includes(req.user.id);

  if (!isAssigned) {
    return next(new AppError("You are not assigned to this task", 403));
  }

  const responseData = {
    respondedBy: req.user.id,
    status: status || "in-progress",
    completionPercentage: completionPercentage || 0,
    comment,
    timeSpent: timeSpent || 0,
    documents: documentIds,
  };

  await task.addResponse(responseData);

  // Get updated task with populated response
  const updatedTask = await Task.findById(taskId)
    .populate({
      path: "taskResponses.documents",
      match: { isArchived: false },
    })
    .populate({
      path: "taskResponses.respondedBy",
      select: "firstName lastName email position",
    });

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
      path: "taskResponses.respondedBy",
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
  const { status, priority, fromDate, toDate } = req.query;

  const tasks = await Task.getUserTasks(req.user.id, {
    status,
    priority,
    fromDate,
    toDate,
  })
    .populate("assignedBy", "firstName lastName email position")
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
    .populate("assignedBy", "firstName lastName email position")
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
  const { userId, role = "primary" } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  await task.addAssignee(userId, role, req.user.id);

  const updatedTask = await Task.findById(taskId).populate(
    "assignees.user",
    "firstName lastName email position"
  );

  res.status(200).json({
    status: "success",
    message: "Assignee added successfully",
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
      fileUrl: uploadResult.fileUrl, // Permanent S3 URL
      presignedUrl: uploadResult.presignedUrl, // Temporary pre-signed URL for immediate access
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
        presignedUrl: file.presignedUrl, // Include pre-signed URL in response
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
      fileUrl: uploadResult.fileUrl, // Permanent S3 URL
      presignedUrl: uploadResult.presignedUrl, // Temporary pre-signed URL for immediate access
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
      // Create a new response if no responseId provided
      task.taskResponses.push({
        respondedBy: req.user.id,
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
    .populate("taskResponses.respondedBy", "firstName lastName email");

  res.status(201).json({
    status: "success",
    message: `Successfully uploaded ${uploadedFiles.length} response document(s)`,
    data: {
      files: uploadedFiles.map((file) => ({
        _id: file._id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileUrl: file.fileUrl,
        presignedUrl: file.presignedUrl, // Include pre-signed URL in response
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

  // Check if user is assigned to the task or is the uploader
  const isAssigned =
    task.assignees.some(
      (assignee) => assignee.user.toString() === req.user.id
    ) || task.assignedTo.includes(req.user.id);

  const isUploader = file.uploadedBy.toString() === req.user.id;

  if (!isAssigned && !isUploader) {
    return next(new AppError("Not authorized to access this file", 403));
  }

  try {
    // Generate a fresh pre-signed URL
    const newPresignedUrl = await s3Service.getPresignedUrl(file.s3Key, 3600); // 1 hour expiry

    // Update the file record with the new pre-signed URL (optional)
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
