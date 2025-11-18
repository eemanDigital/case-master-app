const express = require("express");
const taskController = require("../controllers/taskController");
const taskResponseController = require("../controllers/taskResponseController");
// const taskDocumentController = require("../controllers/taskDocumentController");
const taskReminderController = require("../controllers/taskReminderController");
const { protect, restrictTo } = require("../controllers/authController");
const {
  multerFileUploader,
  uploadToCloudinary,
} = require("../utils/multerFileUploader");
const {
  downloadDocument,
  deleteDocument,
  createDocument,
} = require("../controllers/factory");
const Task = require("../models/taskModel");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ============================================================================
// TASK ROUTES (Maintaining your existing structure)
// ============================================================================

// Create task (staff only) - Your existing route
router.post(
  "/",
  restrictTo("super-admin", "admin", "staff", "hr"),
  taskController.createTask
);

// Get all tasks (filtered by role) - Your existing route
router.get("/", taskController.getTasks);

// Get single task - Your existing route
router.get("/:taskId", taskController.getTask);

// Update task - Your existing route
router.patch("/:id", taskController.updateTask);

// Delete task - Your existing route
router.delete(
  "/:id",
  restrictTo("admin", "super-admin"),
  taskController.deleteTask
);

// ============================================================================
// TASK DOCUMENT ROUTES (Maintaining your existing structure)
// ============================================================================

// Document upload - Your existing route structure
router.post(
  "/:id/documents",
  multerFileUploader("file"),
  uploadToCloudinary,
  createDocument(Task)
);

// Document download - Your existing route structure
router.get("/:parentId/documents/:documentId/download", downloadDocument(Task));

// Document delete - Your existing route structure
router.delete("/:parentId/documents/:documentId", deleteDocument(Task));

// ============================================================================
// TASK RESPONSE ROUTES (Maintaining your existing structure)
// ============================================================================

// Create response with file upload - Your existing route structure
router.post(
  "/:taskId/response",
  multerFileUploader("doc"),
  uploadToCloudinary,
  taskResponseController.createTaskResponse
);

// Get specific response - Your existing route structure
router.get(
  "/:taskId/response/:responseId",
  taskResponseController.getTaskResponse
);

// Delete response - Your existing route structure
router.delete(
  "/:taskId/response/:responseId",
  taskResponseController.deleteTaskResponse
);

// Download response document - Your existing route structure
router.get(
  "/:taskId/response/:responseId/download",
  taskResponseController.downloadFile
);

// ============================================================================
// NEW ROUTES (Additional functionality from refactored code)
// ============================================================================

// Task statistics
router.get("/stats/:userId?", taskController.getTaskStats);

// Cancel task
router.patch("/:id/cancel", taskController.cancelTask);

// ============================================================================
// TASK REMINDER ROUTES (New functionality)
// ============================================================================

// Create reminder
router.post("/:taskId/reminder", taskReminderController.createTaskReminder);

// Update reminder
router.put("/:taskId/reminder", taskReminderController.updateTaskReminder);

// Delete reminder
router.delete("/:taskId/reminder", taskReminderController.deleteTaskReminder);

module.exports = router;
