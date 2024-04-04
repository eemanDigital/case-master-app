const express = require("express");
const {
  getTasks,
  createTask,
  getTask,
} = require("../controllers/taskController");

const taskRouter = express.Router();

taskRouter.get("/", getTasks);
taskRouter.get("/:taskId", getTask);
taskRouter.post("/", createTask);

module.exports = taskRouter;
