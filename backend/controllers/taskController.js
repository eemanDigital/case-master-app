const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createTask = catchAsync(async (req, res, next) => {
  const { assignedBy, ...rest } = req.body;

  const task = await Task.create({ assignedBy: req.user.id, ...rest });
  res.status(201).json({
    message: "success",
    data: task,
  });
});

exports.getTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find().sort({ dateAssigned: -1 });
  // .populate("assignedTo")
  // .populate("caseToWorkOn");

  res.status(200).json({
    results: tasks.length,
    data: tasks,
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId).populate("documents");

  if (!task) {
    return next(new AppError("The task does not exist", 404));
  }
  res.status(200).json({
    data: task,
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  // const filename = req.file ? req.file.filename : null;
  // 3) Update user task
  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    message: "success",
    data: updatedTask,
  });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  let task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return next(new AppError("No leave application found with that ID", 404));
  }

  res.status(204).json({
    message: "Task deleted",
    data: null,
  });
});
