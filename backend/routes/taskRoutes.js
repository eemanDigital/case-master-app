const express = require("express");
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  downloadFile,

  // updateTaskResponse,
} = require("../controllers/taskController");
const { fileUpload } = require("../utils/taskDocHandler");

const {
  createTaskResponse,
  deleteTaskResponse,
  getTaskResponse,
  uploadTaskResponseFile,
} = require("../controllers/taskResponseController");

const taskRouter = express.Router();

taskRouter.get("/", getTasks);
taskRouter.get("/:taskId", getTask);
// taskRouter.get("/download/:taskId", downloadFile);
taskRouter.patch("/:id", fileUpload, updateTask);
taskRouter.patch("/:id", updateTask);
taskRouter.post("/", createTask);

// sub-doc route for task response
taskRouter.post(
  "/:taskId/response",
  uploadTaskResponseFile.single("file"),
  createTaskResponse
);
taskRouter.delete("/:taskId/response/:responseId", deleteTaskResponse);
taskRouter.get("/:taskId/response/:responseId", getTaskResponse);
// taskRouter.patch("/:taskId/response/:responseId", updateTaskResponse);

module.exports = taskRouter;
