// routes/taskRoutes.js
const express = require("express");
const taskController = require("../controllers/taskController");
const authController = require("../controllers/authController");
const fileController = require("../controllers/fileController");
const { auditMiddleware } = require("../middleware/auditMiddleware");

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Auto-filter for clients - they can see tasks assigned to them OR linked to their matters
router.use(async (req, res, next) => {
  if (req.user.role === "client" && req.user.id) {
    // For clients, we'll handle the filtering in the controller via a special query param
    req.query.clientUserId = req.user.id;
  }
  next();
});

router.use(auditMiddleware);

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

// Restore soft-deleted task
router.route("/:taskId/restore").post(taskController.restoreTask);

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

// Delete reference document from task
router
  .route("/:taskId/reference-documents/:documentId")
  .delete(taskController.deleteTaskReferenceDocument);

// Upload response documents
router
  .route("/:taskId/response-documents")
  .post(fileController.uploadMultiple, taskController.uploadResponseDocuments);

// Task responses
router.route("/:taskId/responses").post(taskController.submitTaskResponse);

// Update task response (for assignee to edit their submission)
router
  .route("/:taskId/responses/:responseId")
  .put(taskController.updateTaskResponse)
  .delete(taskController.deleteTaskResponse);

// Delete single document from task response
router
  .route("/:taskId/responses/:responseId/documents/:documentId")
  .delete(taskController.deleteTaskResponseDocument);

// Review task response
router
  .route("/:taskId/responses/:responseIndex/review")
  .post(taskController.reviewTaskResponse);

// Task assignees
router.route("/:taskId/assignees").post(taskController.addAssignee);
router
  .route("/:taskId/assignees/:userId")
  .delete(taskController.removeAssignee);

// ============================================================
// Reminder Management
// ============================================================
router.route("/:taskId/reminders").get(taskController.getReminders);
router.route("/:taskId/reminders").post(taskController.createReminder);
router.route("/:taskId/reminders/:reminderId").delete(taskController.deleteReminder);

// ============================================================
// Task Dependencies
// ============================================================
router.route("/:taskId/dependencies").get(taskController.getDependencies);
router.route("/:taskId/dependencies").post(taskController.addDependency);
router.route("/:taskId/dependencies/:dependencyId").delete(taskController.removeDependency);
router.route("/:taskId/available-dependencies").get(taskController.getAvailableDependencies);

// ============================================================
// Enhanced Task Update
// ============================================================
router.route("/:taskId/enhanced-update").patch(taskController.updateTaskEnhanced);

module.exports = router;
