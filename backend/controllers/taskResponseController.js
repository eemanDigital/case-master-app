const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const responseData = {
    ...req.body,
    submittedBy: req.user.id,
  };

  // Handle file uploads
  if (req.files && req.files.length > 0) {
    responseData.documents = req.files.map((file) => ({
      fileName: file.originalname,
      fileUrl: file.cloudinaryUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));
  }

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Update task status based on response
  if (responseData.completed) {
    task.status = "under-review";
  }

  task.responses.push(responseData);
  task.updatedBy = req.user.id;
  await task.save();

  res.status(201).json({
    status: "success",
    data: { task },
  });
});

exports.getTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;

  const task = await Task.findOne(
    {
      _id: taskId,
      "responses._id": responseId,
    },
    {
      "responses.$": 1,
    }
  );

  if (!task || !task.responses.length) {
    return next(new AppError("Response not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { response: task.responses[0] },
  });
});

exports.updateTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;

  const task = await Task.findOne({ _id: taskId });

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const response = task.responses.id(responseId);
  if (!response) {
    return next(new AppError("Response not found", 404));
  }

  // Update response fields
  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      response[key] = req.body[key];
    }
  });

  task.updatedBy = req.user.id;
  await task.save();

  res.status(200).json({
    status: "success",
    data: { response },
  });
});

exports.deleteTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  task.responses.pull({ _id: responseId });
  task.updatedBy = req.user.id;
  await task.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.approveTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const response = task.responses.id(responseId);
  if (!response) {
    return next(new AppError("Response not found", 404));
  }

  // Mark task as completed
  task.status = "completed";
  task.completedAt = new Date();
  task.updatedBy = req.user.id;
  await task.save();

  res.status(200).json({
    status: "success",
    data: { task },
  });
});
