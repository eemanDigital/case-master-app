const express = require("express");
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
} = require("../controllers/taskController");

const taskRouter = express.Router();

taskRouter.get("/", getTasks);
taskRouter.get("/:taskId", getTask);
taskRouter.patch("/:id", updateTask);
taskRouter.post("/", createTask);

module.exports = taskRouter;
