const express = require("express");
const fileController = require("../controllers/fileController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes (require authentication)
router.use(authController.protect);

// Upload routes
router
  .route("/upload")
  .post(fileController.uploadSingle, fileController.uploadFile);

router
  .route("/upload-multiple")
  .post(fileController.uploadMultiple, fileController.uploadMultipleFiles);

// Get user's files and storage usage
router.get("/my-files", fileController.getMyFiles);
router.get("/storage-usage", fileController.getStorageUsage);

// Get files for specific entity (Case, Task, etc.)
router.get("/entity/:entityType/:entityId", fileController.getEntityFiles);

// File operations
router
  .route("/:id")
  .get(fileController.getFileDownloadUrl)
  .delete(fileController.deleteFile);

router.patch("/:id/archive", fileController.toggleArchive);

// Admin only routes
router
  .route("/:id/permanent-delete")
  .delete(
    authController.restrictTo("admin", "super-admin"),
    fileController.permanentlyDeleteFile
  );

// Task-specific upload routes
router.post(
  "/upload/task-reference",
  authController.protect,
  fileController.uploadMultiple,
  fileController.uploadTaskReferenceDocuments
);

router.post(
  "/upload/task-response",
  authController.protect,
  fileController.uploadMultiple,
  fileController.uploadTaskResponseDocuments
);

module.exports = router;
