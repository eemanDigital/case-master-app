const Task = require("../models/taskModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/**
 * Create task response (Maintaining your existing logic structure)
 */
exports.createTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { completed, comment } = req.body;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Only assigned users can respond
  const isAssigned =
    task.assignedTo.some(
      (user) => user._id.toString() === req.user._id.toString()
    ) ||
    (task.assignedToClient &&
      task.assignedToClient._id.toString() === req.user._id.toString());

  if (!isAssigned) {
    return next(new AppError("You are not assigned to this task", 403));
  }

  // Prepare response object using your existing structure
  const response = {
    completed: completed || false,
    comment: comment || "",
    submittedBy: req.user._id,
    timestamp: new Date(),
  };

  // Add document if uploaded (using your existing cloudinary logic)
  if (req.file && req.file.cloudinaryUrl) {
    response.doc = req.file.cloudinaryUrl;
  }

  // Add response to task
  task.taskResponse.push(response);

  // Update task status if completed
  if (completed) {
    task.status = "completed";
    task.completedAt = new Date();
    task.completionPercentage = 100;
  } else {
    task.status = "in-progress";
    // Optional: Calculate completion percentage based on responses
    const completedResponses = task.taskResponse.filter(
      (r) => r.completed
    ).length;
    const totalResponses = task.taskResponse.length;
    task.completionPercentage =
      totalResponses > 0
        ? Math.round((completedResponses / totalResponses) * 100)
        : 0;
  }

  await task.save();

  // Populate the response for the return data
  await task.populate("taskResponse.submittedBy", "firstName lastName email");

  res.status(201).json({
    status: "success",
    message: "Task response submitted successfully",
    data: {
      task,
      response: task.taskResponse[task.taskResponse.length - 1], // Return the latest response
    },
  });
});

/**
 * Get task response (Maintaining your existing logic structure)
 */
exports.getTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const response = task.taskResponse.id(responseId);

  if (!response) {
    return next(new AppError("Response not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { response },
  });
});

/**
 * Delete task response (Maintaining your existing logic structure)
 */
exports.deleteTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const response = task.taskResponse.id(responseId);

  if (!response) {
    return next(new AppError("Response not found", 404));
  }

  // Only response submitter or task creator can delete
  const isSubmitter =
    response.submittedBy.toString() === req.user._id.toString();
  const isTaskCreator =
    task.assignedBy._id.toString() === req.user._id.toString();
  const isAdmin = ["super-admin", "admin"].includes(req.user.role);

  if (!isSubmitter && !isTaskCreator && !isAdmin) {
    return next(
      new AppError("You do not have permission to delete this response", 403)
    );
  }

  // Remove response
  task.taskResponse.pull({ _id: responseId });

  // Update status if was completed
  if (response.completed && task.status === "completed") {
    // Check if there are any other completed responses
    const hasOtherCompleted = task.taskResponse.some(
      (r) => r.completed && r._id.toString() !== responseId
    );
    if (!hasOtherCompleted) {
      task.status = "in-progress";
      task.completedAt = null;
      task.completionPercentage = 0;
    }
  }

  await task.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Download response document (Maintaining your existing logic structure)
 */
exports.downloadFile = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const response = task.taskResponse.id(responseId);

  if (!response || !response.doc) {
    return next(new AppError("Document not found", 404));
  }

  // Your existing download logic here
  res.status(200).json({
    status: "success",
    data: {
      fileUrl: response.doc,
      // Include any additional metadata your frontend expects
      fileName: `task-response-${taskId}-${responseId}.${getFileExtension(
        response.doc
      )}`,
      mimeType: getMimeType(response.doc),
    },
  });
});

// Helper functions for file handling (maintain your existing helpers)
const getFileExtension = (url) => {
  return url.split(".").pop().split("?")[0];
};

const getMimeType = (url) => {
  const ext = getFileExtension(url).toLowerCase();
  const mimeTypes = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    txt: "text/plain",
  };
  return mimeTypes[ext] || "application/octet-stream";
};
