const Todo = require("../models/todoModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createTodo = catchAsync(async (req, res, next) => {
  const { userId, ...rest } = req.body;
  const newTodo = await Todo.create({ userId: req.user.id, ...rest });
  res.status(201).json({
    status: "success",
    data: {
      todo: newTodo,
    },
  });
});

exports.getTodos = catchAsync(async (req, res, next) => {
  const todos = await Todo.find().sort("-createdAt");
  res.status(200).json({
    status: "success",
    results: todos.length,
    data: {
      todos,
    },
  });
});

exports.getTodo = catchAsync(async (req, res, next) => {
  const todo = await Todo.findById(req.params.id);
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
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
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
  const todo = await Todo.findByIdAndDelete(req.params.id);
  if (!todo) {
    return next(new AppError("No todo found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
