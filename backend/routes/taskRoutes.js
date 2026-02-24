// routes/taskRoutes.js
const express = require("express");
const taskController = require("../controllers/taskController");
const authController = require("../controllers/authController");
const fileController = require("../controllers/fileController");

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Task CRUD
router.route("/").get(taskController.getTasks).post(taskController.createTask);

router.route("/my-tasks").get(taskController.getMyTasks);

router.route("/overdue").get(taskController.getOverdueTasks);

// Get tasks pending review
router.route("/pending-review").get(taskController.getTasksPendingReview);

router
  .route("/:taskId")
  .get(taskController.getTask)
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

// Task documents
router.route("/:taskId/documents").get(taskController.getTaskDocuments);

// Submit task for review (for assignees)
router.route("/:taskId/submit-review").put(taskController.submitTaskForReview);

// Review task (for task giver)
router.route("/:taskId/review").post(taskController.reviewTask);

// Get task history/audit trail
router.route("/:taskId/history").get(taskController.getTaskHistory);

// Force mark task as complete (admin/task giver)
router.route("/:taskId/force-complete").post(taskController.forceCompleteTask);

// Upload reference documents
router
  .route("/:taskId/reference-documents")
  .post(fileController.uploadMultiple, taskController.uploadReferenceDocuments);

// Upload response documents
router
  .route("/:taskId/response-documents")
  .post(fileController.uploadMultiple, taskController.uploadResponseDocuments);

// Task responses
router.route("/:taskId/responses").post(taskController.submitTaskResponse);

// Delete task response
router
  .route("/:taskId/responses/:responseId")
  .delete(taskController.deleteTaskResponse);

// Review task response
router
  .route("/:taskId/responses/:responseIndex/review")
  .post(taskController.reviewTaskResponse);

// Task assignees
router.route("/:taskId/assignees").post(taskController.addAssignee);
router
  .route("/:taskId/assignees/:userId")
  .delete(taskController.removeAssignee);

module.exports = router;
