const express = require("express");
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  downloadFile,
} = require("../controllers/taskController");
const { fileUpload } = require("../utils/taskDocHandler");

const taskRouter = express.Router();

taskRouter.get("/", getTasks);
taskRouter.get("/:taskId", getTask);
// taskRouter.get("/download/:taskId", downloadFile);
taskRouter.put("/:id", fileUpload, updateTask);
taskRouter.put("/:id", updateTask);
taskRouter.post("/", createTask);

module.exports = taskRouter;
