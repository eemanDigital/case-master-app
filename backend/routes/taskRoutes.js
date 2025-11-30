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

router
  .route("/:taskId")
  .get(taskController.getTask)
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

// Task documents
router.route("/:taskId/documents").get(taskController.getTaskDocuments);

// ✅ CORRECTED: Use ONLY the file upload route for reference-documents
router.route("/:taskId/reference-documents").post(
  fileController.uploadMultiple, // This handles the file upload
  taskController.uploadReferenceDocuments // This processes the uploaded files
);

// ✅ CORRECTED: Use ONLY the file upload route for response-documents
router
  .route("/:taskId/response-documents")
  .post(fileController.uploadMultiple, taskController.uploadResponseDocuments);

// Task responses
router.route("/:taskId/responses").post(taskController.submitTaskResponse);

router
  .route("/:taskId/responses/:responseIndex/review")
  .post(taskController.reviewTaskResponse);

// Task assignees
router.route("/:taskId/assignees").post(taskController.addAssignee);

// ❌ REMOVE THESE DUPLICATE ROUTES (they're already defined above)
// router.route("/:taskId/reference-documents")
//   .post(taskController.addReferenceDocuments);

// router.route("/:taskId/response-documents")
//   .post(fileController.uploadMultiple, taskController.uploadResponseDocuments);

module.exports = router;
