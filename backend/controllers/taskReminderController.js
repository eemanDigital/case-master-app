const Task = require("../models/taskModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createTaskReminder = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { message } = req.body;

  if (!message) {
    return next(new AppError("Reminder message is required", 400));
  }

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Only task creator can set reminders
  if (
    !task.canModify(req.user._id) &&
    !["super-admin", "admin"].includes(req.user.role)
  ) {
    return next(
      new AppError(
        "You do not have permission to set reminders for this task",
        403
      )
    );
  }

  task.reminder = {
    message,
    sender: req.user._id,
    timestamp: new Date(),
    isActive: true,
  };

  await task.save();

  res.status(201).json({
    status: "success",
    message: "Reminder created successfully",
    data: { task },
  });
});

/**
 * Update task reminder
 */
exports.updateTaskReminder = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { message, isActive } = req.body;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  if (!task.reminder) {
    return next(new AppError("No reminder exists for this task", 404));
  }

  // Only reminder creator can update
  if (
    task.reminder.sender.toString() !== req.user._id.toString() &&
    !["super-admin", "admin"].includes(req.user.role)
  ) {
    return next(
      new AppError("You do not have permission to update this reminder", 403)
    );
  }

  if (message) task.reminder.message = message;
  if (typeof isActive === "boolean") task.reminder.isActive = isActive;
  task.reminder.timestamp = new Date();

  await task.save();

  res.status(200).json({
    status: "success",
    message: "Reminder updated successfully",
    data: { task },
  });
});

/**
 * Delete task reminder
 */
exports.deleteTaskReminder = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  if (!task.reminder) {
    return next(new AppError("No reminder exists for this task", 404));
  }

  // Only reminder creator can delete
  if (
    task.reminder.sender.toString() !== req.user._id.toString() &&
    !["super-admin", "admin"].includes(req.user.role)
  ) {
    return next(
      new AppError("You do not have permission to delete this reminder", 403)
    );
  }

  task.reminder = undefined;
  await task.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
