const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createTask = catchAsync(async (req, res, next) => {
  const {
    description,
    caseToWorkOn,
    assignedTo,
    dateAssigned,
    dueDate,
    status,
    taskPriority,
  } = req.body;

  const task = await Task.create({
    description,
    caseToWorkOn,
    assignedTo,
    dateAssigned,
    dueDate,
    status,
    taskPriority,
  });

  res.status(201).json({
    data: task,
  });
});

exports.getTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find()
    .populate("assignedTo")
    .populate("caseToWorkOn");

  res.status(200).json({
    results: tasks.length,
    data: tasks,
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId)
    .populate({ path: "assignedTo", select: "firstName lastName" })
    .populate({
      path: "caseToWorkOn",
      select: "firstParty.name secondParty.name",
    });
  if (!task) {
    return next(new AppError("The task does not exist", 404));
  }
  res.status(200).json({
    data: task,
  });
});
