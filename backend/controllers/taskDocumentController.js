const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Upload document to task
exports.uploadTaskDocument = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { fileName } = req.body;

  if (!req.file) {
    return next(new AppError("Please upload a file", 400));
  }

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Create document object
  const document = {
    fileName: fileName || req.file.originalname,
    fileUrl: req.file.cloudinaryUrl,
    uploadedBy: req.user.id,
    uploadedAt: new Date(),
    ...(req.file.size && { fileSize: req.file.size }),
    ...(req.file.mimetype && { mimeType: req.file.mimetype }),
  };

  // Add document to task
  task.documents.push(document);
  task.updatedBy = req.user.id;
  task.lastUpdated = new Date();

  await task.save();

  res.status(201).json({
    status: "success",
    data: {
      document,
      task,
    },
  });
});

// Get task document
exports.getTaskDocument = catchAsync(async (req, res, next) => {
  const { taskId, documentId } = req.params;

  const task = await Task.findOne(
    {
      _id: taskId,
      "documents._id": documentId,
    },
    {
      "documents.$": 1,
    }
  );

  if (!task || !task.documents.length) {
    return next(new AppError("Document not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      document: task.documents[0],
    },
  });
});

// Delete task document
exports.deleteTaskDocument = catchAsync(async (req, res, next) => {
  const { taskId, documentId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const document = task.documents.id(documentId);
  if (!document) {
    return next(new AppError("Document not found", 404));
  }

  // Check if user has permission to delete
  const canDelete =
    document.uploadedBy.toString() === req.user.id ||
    task.assignedBy.toString() === req.user.id ||
    ["super-admin", "admin"].includes(req.user.role);

  if (!canDelete) {
    return next(
      new AppError("You are not authorized to delete this document", 403)
    );
  }

  task.documents.pull({ _id: documentId });
  task.updatedBy = req.user.id;
  task.lastUpdated = new Date();

  await task.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Download task document
exports.downloadTaskDocument = catchAsync(async (req, res, next) => {
  const { taskId, documentId } = req.params;

  const task = await Task.findOne(
    {
      _id: taskId,
      "documents._id": documentId,
    },
    {
      "documents.$": 1,
    }
  );

  if (!task || !task.documents.length) {
    return next(new AppError("Document not found", 404));
  }

  const document = task.documents[0];

  res.status(200).json({
    status: "success",
    data: {
      fileUrl: document.fileUrl,
      fileName: document.fileName,
    },
  });
});
