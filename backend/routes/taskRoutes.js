const express = require("express");
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getUserTasks,
  getCaseTasks,
  getTaskStats,
} = require("../controllers/taskController");

const {
  createTaskResponse,
  getTaskResponse,
  updateTaskResponse,
  deleteTaskResponse,
  approveTaskResponse,
} = require("../controllers/taskResponseController");

const {
  uploadTaskDocument,
  getTaskDocument,
  deleteTaskDocument,
  downloadTaskDocument,
} = require("../controllers/taskDocumentController");

const { protect, restrictTo } = require("../controllers/authController");
const {
  multerFileUploader,
  uploadToCloudinary,
} = require("../utils/multerFileUploader");

const router = express.Router();

// Protect all routes
router.use(protect);

// Task routes
router.get("/stats", getTaskStats);
router.get("/my-tasks", getUserTasks);
router.get("/case/:caseId", getCaseTasks);
router
  .route("/")
  .get(getTasks)
  .post(restrictTo("admin", "super-admin"), createTask);

router
  .route("/:taskId")
  .get(getTask)
  .patch(updateTask)
  .delete(restrictTo("admin", "super-admin"), deleteTask);

// Task Document routes
router.route("/:taskId/documents").post(
  // restrictTo("admin", "attorney", "paralegal", "staff"),
  multerFileUploader("file"),
  uploadToCloudinary,
  uploadTaskDocument
);

router
  .route("/:taskId/documents/:documentId")
  .get(getTaskDocument)
  .delete(deleteTaskDocument);

router.get("/:taskId/documents/:documentId/download", downloadTaskDocument);

// Task Response routes
router.route("/:taskId/responses").post(
  multerFileUploader("documents", 5), // max 5 files
  uploadToCloudinary,
  createTaskResponse
);

router
  .route("/:taskId/responses/:responseId")
  .get(getTaskResponse)
  .patch(updateTaskResponse)
  .delete(deleteTaskResponse);

router.patch(
  "/:taskId/responses/:responseId/approve",
  // restrictTo("admin", "attorney"),
  approveTaskResponse
);

module.exports = router;
