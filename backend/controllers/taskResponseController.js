// SUB-DOCUMENT CONTROLLER
const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const path = require("path");

// create response
exports.createTaskResponse = catchAsync(async (req, res, next) => {
  // get parent id
  const id = req.params.taskId;
  const response = req.body;

  // Check if a file was uploaded
  if (req.file) {
    const filePath = req.file.cloudinaryUrl;
    response.doc = filePath;
  }

  // Find the parent task
  const parentTask = await Task.findById(id);

  if (!parentTask) {
    return next(new AppError("No parent task for this response", 404));
  } else {
    // Push taskResponse to parent data (if parent is found)
    parentTask.taskResponse.push(response);
    await parentTask.save(); // Save the parent task document

    res.status(201).json({
      message: "success",
      data: parentTask,
    });
  }
});

//remove response
exports.deleteTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params; //parentTask id

  const task = await Task.findById(taskId);

  if (!task) {
    next(new AppError("task/response does not response"));
  }

  task.taskResponse.pull({ _id: responseId });
  await task.save();

  res.status(204).json({ message: "success" });
});

// get task response
exports.getTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;
  const task = await Task.findById(taskId).populate({
    path: "taskResponse",
    match: { _id: responseId },
  });

  if (!task) {
    next(new AppError("task/response does not exist"));
  }
  //   select the last response
  const lastResponse = task.taskResponse.slice(-1)[0];
  //   const lastResponse = task.taskResponse;

  res.status(200).json(lastResponse);
});

// download file
exports.downloadFile = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;
  const task = await Task.findById(taskId);

  if (!task) {
    next(new AppError("task/response does not exist"));
  }

  const responseIndex = task.taskResponse.findIndex(
    (r) => r._id.toString() === responseId
  );
  if (responseIndex === -1) {
    next(new AppError("response not found"));
  }

  const fileUrl = task.taskResponse[responseIndex].doc;

  res.status(200).json({
    status: "success",
    data: {
      fileUrl,
    },
  });
});
