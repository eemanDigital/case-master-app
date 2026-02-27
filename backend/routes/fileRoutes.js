const express = require("express");
const fileController = require("../controllers/fileController");
const authController = require("../controllers/authController");
const Firm = require("../models/firmModel");

const router = express.Router();

// Protect all routes (require authentication)
router.use(authController.protect);

// Get firm storage info (no upload, just info)
router.get("/firm-storage-info", async (req, res, next) => {
  try {
    const firm = await Firm.findById(req.firmId);
    
    if (!firm) {
      return res.status(404).json({
        status: "error",
        message: "Firm not found"
      });
    }

    const storageLimitGB = firm.limits.storageGB;
    const storageUsedGB = firm.usage.storageUsedGB;
    const isUnlimited = storageLimitGB >= 999999;
    
    res.status(200).json({
      status: "success",
      data: {
        plan: firm.subscription.plan,
        storageLimitGB: isUnlimited ? "Unlimited" : storageLimitGB,
        storageUsedGB: parseFloat(storageUsedGB.toFixed(2)),
        storageAvailableGB: isUnlimited ? "Unlimited" : parseFloat((storageLimitGB - storageUsedGB).toFixed(2)),
        usagePercentage: isUnlimited ? 0 : Math.round((storageUsedGB / storageLimitGB) * 100),
        isNearLimit: !isUnlimited && (storageUsedGB / storageLimitGB) > 0.8,
        isAtLimit: !isUnlimited && storageUsedGB >= storageLimitGB,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's files and storage usage
router.get("/my-files", fileController.getMyFiles);
router.get("/storage-usage", fileController.getStorageUsage);

// Get files for specific entity (Case, Task, etc.)
router.get("/entity/:entityType/:entityId", fileController.getEntityFiles);

// Upload routes - apply storage limit check only to these
router
  .route("/upload")
  .post(authController.checkStorageLimit, fileController.uploadSingle, fileController.uploadFile);

router
  .route("/upload-multiple")
  .post(authController.checkStorageLimit, fileController.uploadMultiple, fileController.uploadMultipleFiles);

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
  authController.checkStorageLimit,
  fileController.uploadMultiple,
  fileController.uploadTaskReferenceDocuments
);

router.post(
  "/upload/task-response",
  authController.protect,
  authController.checkStorageLimit,
  fileController.uploadMultiple,
  fileController.uploadTaskResponseDocuments
);

module.exports = router;
