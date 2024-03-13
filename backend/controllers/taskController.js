const Task = require("../models/taskModel");

exports.createTask = async (req, res, next) => {
  const task = await Task.create(req.body);

  res.status(201).json({
    data: task,
  });
};

exports.getTasks = async (req, res, next) => {
  const tasks = await Task.findOne({}).populate("assignedTo");

  res.status(200).json({
    results: tasks.length,
    data: tasks,
  });
};
