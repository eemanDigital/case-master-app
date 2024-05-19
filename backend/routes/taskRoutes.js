const express = require("express");
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  downloadFile,
  createTaskResponse,
  deleteTaskResponse,
} = require("../controllers/taskController");
const { fileUpload } = require("../utils/taskDocHandler");

const taskRouter = express.Router();

taskRouter.get("/", getTasks);
taskRouter.get("/:taskId", getTask);
// taskRouter.get("/download/:taskId", downloadFile);
taskRouter.put("/:id", fileUpload, updateTask);
taskRouter.put("/:id", updateTask);
taskRouter.post("/", createTask);
// sub-doc route for task response
taskRouter.post("/:taskId/response", createTaskResponse);
taskRouter.delete("/:taskId/:responseId/response", deleteTaskResponse);

module.exports = taskRouter;
