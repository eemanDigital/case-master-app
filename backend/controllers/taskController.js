const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");

exports.createTask = catchAsync(async (req, res, next) => {
  const taskData = {
    ...req.body,
    assignedBy: req.user.id,
    updatedBy: req.user.id,
  };

  const task = await Task.create(taskData);

  res.status(201).json({
    status: "success",
    data: { task },
  });
});

exports.getTasks = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Task.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tasks = await features.query;

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: { tasks },
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { task },
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    { ...req.body, updatedBy: req.user.id },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { task },
  });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUserTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({
    "assignedTo.user": req.user.id,
  }).sort({ dueDate: 1 });

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: { tasks },
  });
});

exports.getCaseTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ case: req.params.caseId }).sort({
    priority: -1,
    dueDate: 1,
  });

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: { tasks },
  });
});

exports.getTaskStats = catchAsync(async (req, res, next) => {
  const stats = await Task.aggregate([
    {
      $facet: {
        statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        priorityCounts: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
        overdueCount: [
          {
            $match: {
              dueDate: { $lt: new Date() },
              status: { $in: ["pending", "in-progress", "under-review"] },
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: { stats: stats[0] },
  });
});
