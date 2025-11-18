const Task = require("../models/taskModel");
const taskService = require("../services/taskService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/**
 * Create new task
 */
exports.createTask = catchAsync(async (req, res, next) => {
  const { assignedTo, assignedToClient, dueDate, ...taskData } = req.body;

  // Validate assignment
  await taskService.validateAssignment(assignedTo, assignedToClient);

  // Validate due date
  const dueDateObj = new Date(dueDate);
  const now = new Date();

  if (dueDateObj <= now) {
    return next(new AppError("Due date must be in the future", 400));
  }

  // Create task
  const task = await Task.create({
    assignedBy: req.user._id,
    assignedTo,
    assignedToClient,
    dueDate: dueDateObj,
    ...taskData,
  });

  res.status(201).json({
    status: "success",
    message: "Task created successfully",
    data: { task },
  });
});

/**
 * Get all tasks with filters and pagination
 */
exports.getTasks = catchAsync(async (req, res, next) => {
  const {
    status,
    priority,
    assignedBy,
    assignedTo,
    assignedToClient,
    caseId,
    page = 1,
    limit = 10,
    sortBy = "-createdAt",
  } = req.query;

  // Build filter
  const filter = {};

  // Role-based filtering
  const userRole = req.user.role;

  if (userRole === "client") {
    // Clients see only their tasks
    filter.assignedToClient = req.user._id;
  } else if (!["super-admin", "admin", "hr"].includes(userRole)) {
    // Regular staff see tasks assigned to them or by them
    filter.$or = [{ assignedTo: req.user._id }, { assignedBy: req.user._id }];
  }
  // Admin/HR see all tasks

  // Apply additional filters
  if (status) filter.status = status;
  if (priority) filter.taskPriority = priority;
  if (assignedBy) filter.assignedBy = assignedBy;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (assignedToClient) filter.assignedToClient = assignedToClient;
  if (caseId) filter.caseToWorkOn = caseId;

  // Pagination
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sortBy).skip(skip).limit(parseInt(limit)),
    Task.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: tasks.length,
    totalResults: total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: { tasks },
  });
});

/**
 * Get single task
 */
exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Authorization check
  const userRole = req.user.role;
  const userId = req.user._id.toString();

  const isAssignedBy = task.assignedBy._id.toString() === userId;
  const isAssignedTo = task.isAssignedTo(userId);
  const isAdmin = ["super-admin", "admin", "hr"].includes(userRole);

  if (!isAssignedBy && !isAssignedTo && !isAdmin) {
    return next(
      new AppError("You do not have permission to view this task", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: { task },
  });
});

/**
 * Update task
 */
exports.updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Only task creator or admin can update
  if (
    !task.canModify(req.user._id) &&
    !["super-admin", "admin"].includes(req.user.role)
  ) {
    return next(
      new AppError("You do not have permission to update this task", 403)
    );
  }

  // Validate assignment if being updated
  if (req.body.assignedTo || req.body.assignedToClient) {
    await taskService.validateAssignment(
      req.body.assignedTo || task.assignedTo,
      req.body.assignedToClient || task.assignedToClient
    );
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "Task updated successfully",
    data: { task: updatedTask },
  });
});

/**
 * Delete task
 */
exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Only task creator or admin can delete
  if (
    !task.canModify(req.user._id) &&
    !["super-admin", "admin"].includes(req.user.role)
  ) {
    return next(
      new AppError("You do not have permission to delete this task", 403)
    );
  }

  await Task.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Cancel task
 */
exports.cancelTask = catchAsync(async (req, res, next) => {
  const { cancellationReason } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Only task creator or admin can cancel
  if (
    !task.canModify(req.user._id) &&
    !["super-admin", "admin"].includes(req.user.role)
  ) {
    return next(
      new AppError("You do not have permission to cancel this task", 403)
    );
  }

  if (task.status === "completed") {
    return next(new AppError("Cannot cancel a completed task", 400));
  }

  task.status = "cancelled";
  task.cancelledAt = new Date();
  task.cancellationReason = cancellationReason || "Cancelled by user";
  await task.save();

  res.status(200).json({
    status: "success",
    message: "Task cancelled successfully",
    data: { task },
  });
});

/**
 * Get task statistics
 */
exports.getTaskStats = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user._id;
  const userRole = req.user.role;

  const stats = await taskService.getUserTaskStats(userId, userRole);

  res.status(200).json({
    status: "success",
    data: { stats },
  });
});
