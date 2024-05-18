// const Task = require("../models/taskModel");
// const AppError = require("../utils/appError");
// const catchAsync = require("../utils/catchAsync");

// exports.createTask = catchAsync(async (req, res, next) => {
//   const {
//     title,
//     instruction,
//     caseToWorkOn,
//     assignedTo,
//     dateAssigned,
//     dueDate,
//     taskPriority,
//     document,
//   } = req.body;

//   const task = await Task.create({
//     title,
//     instruction,
//     caseToWorkOn,
//     assignedTo,
//     dateAssigned,
//     dueDate,
//     taskPriority,
//     document,
//   });

//   res.status(201).json({
//     data: task,
//   });
// });

// exports.getTasks = catchAsync(async (req, res, next) => {
//   const tasks = await Task.find()
//     .populate("assignedTo")
//     .populate("caseToWorkOn");

//   res.status(200).json({
//     results: tasks.length,
//     data: tasks,
//   });
// });

// exports.getTask = catchAsync(async (req, res, next) => {
//   const task = await Task.findById(req.params.taskId);

//   if (!task) {
//     return next(new AppError("The task does not exist", 404));
//   }
//   res.status(200).json({
//     data: task,
//   });
// });

const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createTask = catchAsync(async (req, res, next) => {
  // const {
  //   title,
  //   instruction,
  //   caseToWorkOn,
  //   assignedTo,
  //   dateAssigned,
  //   dueDate,
  //   taskPriority,
  //   document,
  //   message,
  // } = req.body;

  // const task = await Task.create({
  //   title,
  //   instruction,
  //   caseToWorkOn,
  //   assignedTo,
  //   dateAssigned,
  //   dueDate,
  //   taskPriority,
  //   document,
  //   message,
  // });

  // const { reminder } = req.body;

  const task = await Task.create(req.body);
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
  const task = await Task.findById(req.params.taskId).populate("documents");
  // .populate({
  //   path: "notice",
  //   select: "-recipient -relatedTask",
  // });
  // .populate("assignedTo")
  // .populate("caseToWorkOn");
  if (!task) {
    return next(new AppError("The task does not exist", 404));
  }
  res.status(200).json({
    data: task,
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  // 3) Update user task
  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedTask,
  });
});
