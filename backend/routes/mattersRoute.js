const express = require("express");
const matterController = require("../controllers/matterController");
const { protect, restrictTo } = require("../controllers/authController");

const matterRouter = express.Router();

// ============================================
// MIDDLEWARE
// ============================================

// Protect all routes
matterRouter.use(protect);

// ============================================
// DASHBOARD & STATISTICS
// ============================================

matterRouter.get("/stats", matterController.getMatterStats);

// ============================================
// MY MATTERS
// ============================================

matterRouter.get("/my-matters", matterController.getMyMatters);

// ============================================
// STANDARD CRUD OPERATIONS
// ============================================

matterRouter.get("/", matterController.getAllMatters);

matterRouter.post(
  "/",
  restrictTo("admin", "lawyer", "hr"),
  matterController.validateMatterType,
  matterController.createMatter,
);

matterRouter.get(
  "/:id",
  matterController.checkMatterAccess,
  matterController.getMatter,
);

matterRouter.patch(
  "/:id",
  restrictTo("admin", "lawyer", "hr"),
  matterController.checkMatterAccess,
  matterController.validateMatterType,
  matterController.updateMatter,
);

matterRouter.delete(
  "/:id",
  restrictTo("admin", "lawyer"),
  matterController.checkMatterAccess,
  matterController.deleteMatter,
);

// ============================================
// ADVANCED SEARCH
// ============================================

matterRouter.post("/search", matterController.searchMatters);

// ============================================
// BULK OPERATIONS
// ============================================

matterRouter.patch(
  "/bulk-update",
  restrictTo("admin", "lawyer"),
  matterController.checkBulkOperationLimit,
  matterController.logBulkOperation,
  matterController.bulkUpdateMatters,
);

matterRouter.post(
  "/bulk-assign-officer",
  restrictTo("admin", "lawyer"),
  matterController.checkBulkOperationLimit,
  matterController.logBulkOperation,
  matterController.bulkAssignOfficer,
);

matterRouter.delete(
  "/bulk-delete",
  restrictTo("admin", "lawyer"),
  matterController.checkBulkOperationLimit,
  matterController.logBulkOperation,
  matterController.bulkDeleteMatters,
);

// ============================================
// EXPORT & REPORTING
// ============================================

matterRouter.post(
  "/export",
  matterController.checkBulkOperationLimit,
  matterController.exportMatters,
);

// ============================================
// RESTORATION
// ============================================

matterRouter.patch(
  "/:id/restore",
  restrictTo("admin", "lawyer"),
  matterController.restoreMatter,
);

// ============================================
// MATTER-TYPE SPECIFIC QUERIES
// ============================================

matterRouter.get("/type/:matterType", matterController.getMattersByType);
matterRouter.get("/status/:status", matterController.getMattersByStatus);
matterRouter.get("/pending", matterController.getPendingMatters);
matterRouter.get("/urgent", matterController.getUrgentMatters);

// ============================================
// ACTIVITY & TIMELINE
// ============================================

matterRouter.get("/recent-activity", matterController.getRecentActivity);
matterRouter.get("/:id/timeline", matterController.getMatterTimeline);
matterRouter.post("/:id/activity", matterController.addActivityLog);

// ============================================
// VALIDATION & UTILITIES
// ============================================

matterRouter.get(
  "/validate-matter-number/:matterNumber",
  restrictTo("admin", "lawyer", "hr"),
  matterController.validateMatterNumber,
);

module.exports = matterRouter;
