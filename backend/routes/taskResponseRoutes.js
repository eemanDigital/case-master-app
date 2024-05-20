const express = require("express");
const {
  getTasksResponse,
  createTaskResponse,
  getTaskResponse,
  updateTaskResponse,
  downloadFile,
} = require("../controllers/taskResponseController");
const { fileUpload } = require("../utils/taskDocHandler");

const taskRouter = express.Router();

taskResponseRouter.get("/", getTasks);
taskResponseRouter.get("/:taskId", getTask);
// tResponseaskRouter.get("/download/:taskId", downloadFile);
taskResponseRouter.put("/:id", fileUpload, updateTask);
taskResponseRouter.put("/:id", updateTask);
taskResponseRouter.post("/", createTask);

module.exports = taskRouter;
