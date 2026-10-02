const Todo = require("../models/todoModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Whitelist of updatable fields. Passing req.body straight to
// findByIdAndUpdate allowed a caller to reassign ownership (userId) or tamper
// with any other field on the document.
const UPDATABLE_FIELDS = ["description", "isCompleted", "priority", "dueDate"];

// Todos are personal: every read and write is scoped to the authenticated user.
exports.createTodo = catchAsync(async (req, res, next) => {
  // userId is taken from the session, never from the request body.
  const newTodo = await Todo.create({
    userId: req.user.id,
    description: req.body.description,
    isCompleted: Boolean(req.body.isCompleted),
    priority: ["high", "medium", "low"].includes(req.body.priority)
      ? req.body.priority
      : "low",
    ...(req.body.dueDate ? { dueDate: req.body.dueDate } : {}),
  });

  res.status(201).json({
    status: "success",
    data: {
      todo: newTodo,
    },
  });
});

exports.getTodos = catchAsync(async (req, res, next) => {
  // Previously `Todo.find()` with no filter, which returned every user's todos
  // across every firm.
  const filter = { userId: req.user.id };
  if (req.query.isCompleted === "true" || req.query.isCompleted === "false") {
    filter.isCompleted = req.query.isCompleted === "true";
  }

  const todos = await Todo.find(filter).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: todos.length,
    data: {
      todos,
    },
  });
});

exports.getTodo = catchAsync(async (req, res, next) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
  if (!todo) {
    return next(new AppError("No todo found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      todo,
    },
  });
});

exports.updateTodo = catchAsync(async (req, res, next) => {
  const update = {};
  for (const field of UPDATABLE_FIELDS) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    update,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!todo) {
    return next(new AppError("No todo found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      todo,
    },
  });
});

exports.deleteTodo = catchAsync(async (req, res, next) => {
  const todo = await Todo.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!todo) {
    return next(new AppError("No todo found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});