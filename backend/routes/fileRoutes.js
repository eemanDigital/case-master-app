const express = require("express");
const mongoose = require("mongoose");
const fileController = require("../controllers/fileController");
const authController = require("../controllers/authController");
const Firm = require("../models/firmModel");

const router = express.Router();

// Protect all routes (require authentication)
router.use(authController.protect);

// Get firm storage info (no upload, just info)
router.get("/firm-storage-info", async (req, res, next) => {
  try {
    const File = require("../models/fileModel");
    const Firm = require("../models/firmModel");
    
    let firm = await Firm.findById(req.firmId);
    
    if (!firm) {
      return res.status(404).json({
        status: "error",
        message: "Firm not found"
      });
    }

    // Apply correct plan limits if needed (in case they weren't synced)
    const planLimits = {
      FREE: { users: 1, storageGB: 5, casesPerMonth: 10 },
      BASIC: { users: 3, storageGB: 20, casesPerMonth: 50 },
      PRO: { users: 10, storageGB: 100, casesPerMonth: 999999 },
      ENTERPRISE: { users: 999999, storageGB: 999999, casesPerMonth: 999999 },
    };
    
    const plan = firm.subscription.plan;
    const limits = planLimits[plan] || planLimits.FREE;
    
    // Sync limits if they're wrong
    if (firm.limits.storageGB !== limits.storageGB) {
      firm.limits.storageGB = limits.storageGB;
      firm.limits.users = limits.users;
      await firm.save();
    }

    // Calculate actual firm-wide storage using direct aggregation
    let firmObjectId;
    try {
      firmObjectId = new mongoose.Types.ObjectId(req.firmId.toString());
    } catch (e) {
      return res.status(400).json({ status: "error", message: "Invalid firm ID" });
    }
    
    const usageResult = await File.aggregate([
      { $match: { firmId: firmObjectId, isDeleted: { $ne: true } } },
      { $group: { _id: null, totalFiles: { $sum: 1 }, totalSize: { $sum: "$fileSize" } } }
    ]);
    
    const actualStorageUsedGB = usageResult.length > 0 
      ? usageResult[0].totalSize / (1024 * 1024 * 1024) 
      : 0;
    const totalFiles = usageResult.length > 0 ? usageResult[0].totalFiles : 0;
    
    // Sync the storage usage to firm document
    if (Math.abs(actualStorageUsedGB - firm.usage.storageUsedGB) > 0.0001) {
      firm.usage.storageUsedGB = actualStorageUsedGB;
      await firm.save();
    }

    const storageLimitGB = firm.limits.storageGB;
    const storageUsedGB = actualStorageUsedGB;
    const isUnlimited = storageLimitGB >= 999999;
    
    res.status(200).json({
      status: "success",
      data: {
        plan: firm.subscription.plan,
        storageLimitGB: isUnlimited ? "Unlimited" : storageLimitGB,
        storageUsedGB: parseFloat(storageUsedGB.toFixed(4)),
        storageUsedMB: parseFloat((storageUsedGB * 1024).toFixed(2)),
        storageAvailableGB: isUnlimited ? "Unlimited" : parseFloat((storageLimitGB - storageUsedGB).toFixed(4)),
        usagePercentage: isUnlimited ? 0 : Math.round((storageUsedGB / storageLimitGB) * 100),
        isNearLimit: !isUnlimited && (storageUsedGB / storageLimitGB) > 0.8,
        isAtLimit: !isUnlimited && storageUsedGB >= storageLimitGB,
        totalFiles: totalFiles,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's files and storage usage
router.get("/my-files", fileController.getMyFiles);
router.get("/storage-usage", fileController.getStorageUsage);

// Sync firm storage usage and apply plan limits
router.post("/sync-storage", async (req, res, next) => {
  try {
    const File = require("../models/fileModel");
    const Firm = require("../models/firmModel");
    
    // Get actual storage from files using proper ObjectId handling
    let firmObjectId;
    try {
      firmObjectId = new mongoose.Types.ObjectId(req.firmId.toString());
    } catch (e) {
      return res.status(400).json({ status: "error", message: "Invalid firm ID" });
    }
    
    const usage = await File.aggregate([
      { $match: { firmId: firmObjectId, isDeleted: { $ne: true } } },
      { $group: { _id: null, totalFiles: { $sum: 1 }, totalSize: { $sum: "$fileSize" } } }
    ]);
    
    const usageGB = usage.length > 0 ? usage[0].totalSize / (1024 * 1024 * 1024) : 0;
    const totalFiles = usage.length > 0 ? usage[0].totalFiles : 0;
    
    // Get firm
    const firm = await Firm.findById(req.firmId);
    
    // Debug: Log firm info
    console.log("Firm plan:", firm.subscription.plan);
    console.log("Current limits:", firm.limits);
    
    // Define plan limits
    const planLimits = {
      FREE: { users: 1, storageGB: 5, casesPerMonth: 10 },
      BASIC: { users: 3, storageGB: 20, casesPerMonth: 50 },
      PRO: { users: 10, storageGB: 100, casesPerMonth: 999999 },
      ENTERPRISE: { users: 999999, storageGB: 999999, casesPerMonth: 999999 },
    };
    
    const plan = firm.subscription.plan;
    console.log("Selected plan:", plan);
    const limits = planLimits[plan] || planLimits.FREE;
    console.log("New limits to apply:", limits);
    
    // Force update using findByIdAndUpdate to ensure limits are applied
    await Firm.findByIdAndUpdate(req.firmId, {
      $set: {
        "limits.storageGB": limits.storageGB,
        "limits.users": limits.users,
        "limits.casesPerMonth": limits.casesPerMonth,
        "usage.storageUsedGB": usageGB,
      }
    });
    
    // Fetch updated firm to confirm
    const updatedFirm = await Firm.findById(req.firmId);
    
    res.status(200).json({
      status: "success",
      message: "Storage synced and plan limits applied",
      data: {
        plan: plan,
        storageLimitGB: updatedFirm.limits.storageGB,
        storageUsedGB: parseFloat(usageGB.toFixed(4)),
        storageUsedMB: parseFloat((usageGB * 1024).toFixed(2)),
        totalFiles: totalFiles,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Debug endpoint - check actual file sizes
router.get("/debug-files", async (req, res, next) => {
  try {
    const File = require("../models/fileModel");
    const mongoose = require("mongoose");
    
    let firmObjectId;
    try {
      firmObjectId = new mongoose.Types.ObjectId(req.firmId.toString());
    } catch (e) {
      return res.status(400).json({ status: "error", message: "Invalid firm ID" });
    }
    
    const files = await File.find({ firmId: firmObjectId, isDeleted: { $ne: true } })
      .select("fileName fileSize mimeType")
      .limit(10);
    
    const totalSize = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
    
    res.status(200).json({
      status: "success",
      data: {
        files: files,
        totalFiles: files.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(4),
        totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(6),
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get files for specific entity (Case, Task, etc.)
router.get("/entity/:entityType/:entityId", fileController.getEntityFiles);

// Upload routes - apply storage limit check AFTER multer processes files
router
  .route("/upload")
  .post(fileController.uploadSingle, authController.checkStorageLimit, fileController.uploadFile);

router
  .route("/upload-multiple")
  .post(fileController.uploadMultiple, authController.checkStorageLimit, fileController.uploadMultipleFiles);

// File operations
router
  .route("/:id")
  .get(fileController.getFileDownloadUrl)
  .delete(fileController.deleteFile);

// Preview URL endpoint (for Office Viewer)
router.get("/:id/preview", fileController.getFilePreviewUrl);

router.patch("/:id/archive", fileController.toggleArchive);

// Admin only routes
router
  .route("/:id/permanent-delete")
  .delete(
    authController.restrictTo("admin", "super-admin"),
    fileController.permanentlyDeleteFile
  );

// Task-specific upload routes - multer FIRST, then check storage
router.post(
  "/upload/task-reference",
  authController.protect,
  fileController.uploadMultiple,
  authController.checkStorageLimit,
  fileController.uploadTaskReferenceDocuments
);

router.post(
  "/upload/task-response",
  authController.protect,
  fileController.uploadMultiple,
  authController.checkStorageLimit,
  fileController.uploadTaskResponseDocuments
);

module.exports = router;
