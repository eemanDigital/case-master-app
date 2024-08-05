const express = require("express");
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  // updateTaskResponse,
} = require("../controllers/taskController");
// const { fileUpload } = require("../utils/taskDocHandler");
const Task = require("../models/taskModel");
const {
  createTaskResponse,
  deleteTaskResponse,
  getTaskResponse,
  // taskResponseFileUpload,
  downloadFile,
} = require("../controllers/taskResponseController");
const { protect, restrictTo } = require("../controllers/authController");
const {
  downloadDocument,
  deleteDocument,
  createDocument,
} = require("../controllers/factory");
const {
  multerFileUploader,
  uploadToCloudinary,
} = require("../utils/multerFileUploader");

const router = express.Router();

router.use(protect); //protect route from access unless user log in

// document upload route

router.get("/:parentId/documents/:documentId/download", downloadDocument(Task));
router.delete("/:parentId/documents/:documentId", deleteDocument(Task));

router.post(
  "/:id/documents",
  multerFileUploader("file"),
  uploadToCloudinary,
  createDocument(Task)
);
///////////////////

router.get("/", getTasks);
router.get("/:taskId", getTask);

// router.get("/download/:taskId", downloadFile);
// router.patch("/:id", fileUpload, updateTask);
router.patch("/:id", updateTask);
router.delete("/:id", restrictTo("admin", "super-admin"), deleteTask);
router.post("/", createTask);

// sub-doc route for task response
router.get("/:taskId/response/:responseId/download", downloadFile);
router.post(
  "/:taskId/response",
  multerFileUploader("doc"),
  uploadToCloudinary,
  createTaskResponse
);
router.delete("/:taskId/response/:responseId", deleteTaskResponse);
router.get("/:taskId/response/:responseId", getTaskResponse);
// router.patch("/:taskId/response/:responseId", updateTaskResponse);

module.exports = router;
