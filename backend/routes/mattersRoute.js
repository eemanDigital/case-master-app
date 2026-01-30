const express = require("express");
const matterController = require("../controllers/matterController");
const { protect, restrictTo } = require("../controllers/authController");

const matterRouter = express.Router();

// ============================================
// MIDDLEWARE
// ============================================
matterRouter.use(protect);

// ============================================
// SPECIFIC ROUTES (MUST COME BEFORE PARAMETERIZED ROUTES)
// ============================================

// Bulk operations (SPECIFIC routes)
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

matterRouter.post(
  "/export",
  matterController.checkBulkOperationLimit,
  matterController.exportMatters,
);

matterRouter.post("/search", matterController.searchMatters);

// ============================================
// STATISTICS & DASHBOARD
// ============================================
matterRouter.get("/stats", matterController.getMatterStats);
matterRouter.get("/my-matters", matterController.getMyMatters);

// ============================================
// COLLECTION ROUTES
// ============================================
matterRouter.get("/", matterController.getAllMatters);
matterRouter.post(
  "/",
  restrictTo("admin", "lawyer", "hr"),
  matterController.validateMatterType,
  matterController.createMatter,
);

// ============================================
// SHORTCUT ROUTES
// ============================================
matterRouter.get("/type/:matterType", matterController.getMattersByType);
matterRouter.get("/status/:status", matterController.getMattersByStatus);
matterRouter.get("/pending", matterController.getPendingMatters);
matterRouter.get("/urgent", matterController.getUrgentMatters);
matterRouter.get("/recent-activity", matterController.getRecentActivity);
matterRouter.get(
  "/validate-matter-number/:matterNumber",
  restrictTo("admin", "lawyer", "hr"),
  matterController.validateMatterNumber,
);

// ============================================
// PARAMETERIZED ROUTES (MUST COME LAST)
// ============================================

// Single matter routes
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

// Nested routes for specific matter
matterRouter.patch(
  "/:id/restore",
  restrictTo("admin", "lawyer"),
  matterController.restoreMatter,
);
matterRouter.get("/:id/timeline", matterController.getMatterTimeline);
matterRouter.post("/:id/activity", matterController.addActivityLog);

module.exports = matterRouter;
