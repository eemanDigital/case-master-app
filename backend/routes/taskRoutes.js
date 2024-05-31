const express = require("express");
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  // updateTaskResponse,
} = require("../controllers/taskController");
const { fileUpload } = require("../utils/taskDocHandler");

const {
  createTaskResponse,
  deleteTaskResponse,
  getTaskResponse,
  taskResponseFileUpload,
} = require("../controllers/taskResponseController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect); //protect route from access unless user log in

router.get("/", getTasks);
router.get("/:taskId", getTask);
// router.get("/download/:taskId", downloadFile);
router.patch("/:id", fileUpload, updateTask);
router.patch("/:id", updateTask);
router.post("/", createTask);

// sub-doc route for task response
router.post("/:taskId/response", taskResponseFileUpload, createTaskResponse);
router.delete("/:taskId/response/:responseId", deleteTaskResponse);
router.get("/:taskId/response/:responseId", getTaskResponse);
// router.patch("/:taskId/response/:responseId", updateTaskResponse);

module.exports = router;
