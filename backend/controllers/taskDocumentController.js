const Task = require("../models/taskModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/**
 * Upload document to task (Alternative to factory pattern if needed)
 */
exports.uploadTaskDocument = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { fileName } = req.body;

  if (!req.file) {
    return next(new AppError("Please provide a document to upload", 400));
  }

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Check permission - using your existing authorization logic
  const isTaskCreator =
    task.assignedBy._id.toString() === req.user._id.toString();
  const isAdmin = ["super-admin", "admin", "hr"].includes(req.user.role);

  if (!isTaskCreator && !isAdmin) {
    return next(
      new AppError(
        "You do not have permission to upload documents to this task",
        403
      )
    );
  }

  const document = {
    fileName: fileName || req.file.originalname,
    file: req.file.cloudinaryUrl || req.file.path,
    uploadedBy: req.user._id,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  };

  task.documents.push(document);
  await task.save();

  res.status(201).json({
    status: "success",
    message: "Document uploaded successfully",
    data: {
      task,
      document: task.documents[task.documents.length - 1], // Return the latest document
    },
  });
});

/**
 * Delete document from task (Alternative to factory pattern if needed)
 */
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

  // Only uploader or task creator can delete
  const isUploader = document.uploadedBy.toString() === req.user._id.toString();
  const isTaskCreator =
    task.assignedBy._id.toString() === req.user._id.toString();
  const isAdmin = ["super-admin", "admin"].includes(req.user.role);

  if (!isUploader && !isTaskCreator && !isAdmin) {
    return next(
      new AppError("You do not have permission to delete this document", 403)
    );
  }

  task.documents.pull({ _id: documentId });
  await task.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Download task document (Alternative to factory pattern if needed)
 */
exports.downloadTaskDocument = catchAsync(async (req, res, next) => {
  const { taskId, documentId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const document = task.documents.id(documentId);

  if (!document) {
    return next(new AppError("Document not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      fileName: document.fileName,
      fileUrl: document.file,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
    },
  });
});
