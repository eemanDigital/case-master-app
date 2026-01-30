const express = require("express");
const matterController = require("../controllers/matterController");
const {
  protect,
  hasPrivilege,
  canManageCases,
  canViewReports,
  checkPermission,
} = require("../controllers/authController");

const matterRouter = express.Router();

// ============================================
// MIDDLEWARE
// ============================================
matterRouter.use(protect);

// ============================================
// SPECIFIC ROUTES (MUST COME FIRST)
// ============================================

// Bulk operations (SPECIFIC routes)
matterRouter.patch(
  "/bulk-update",
  canManageCases,
  matterController.checkBulkOperationLimit,
  matterController.logBulkOperation,
  matterController.bulkUpdateMatters,
);

matterRouter.post(
  "/bulk-assign-officer",
  canManageCases,
  matterController.checkBulkOperationLimit,
  matterController.logBulkOperation,
  matterController.bulkAssignOfficer,
);

matterRouter.delete(
  "/bulk-delete",
  canManageCases,
  matterController.checkBulkOperationLimit,
  matterController.logBulkOperation,
  matterController.bulkDeleteMatters,
);

matterRouter.post(
  "/export",
  canViewReports,
  matterController.checkBulkOperationLimit,
  matterController.exportMatters,
);

matterRouter.post(
  "/search",
  hasPrivilege("admin", "lawyer", "hr", "staff"),
  matterController.searchMatters,
);

// ============================================
// STATIC ROUTES (no parameters)
// ============================================

matterRouter.get("/stats", matterController.getMatterStats);

matterRouter.get("/my-matters", matterController.getMyMatters);

matterRouter.get(
  "/",
  hasPrivilege("admin", "lawyer", "hr", "staff"),
  matterController.getAllMatters,
);

matterRouter.post(
  "/",
  canManageCases,
  matterController.validateMatterType,
  matterController.createMatter,
);

// ============================================
// SHORTCUT/SPECIAL ROUTES
// ============================================

matterRouter.get(
  "/recent-activity",
  hasPrivilege("admin", "lawyer", "hr", "staff"),
  matterController.getRecentActivity,
);

matterRouter.get(
  "/pending",
  hasPrivilege("admin", "lawyer", "hr", "staff"),
  matterController.getPendingMatters,
);

matterRouter.get(
  "/urgent",
  hasPrivilege("admin", "lawyer", "hr", "staff"),
  matterController.getUrgentMatters,
);

// ============================================
// TYPE-SPECIFIC ROUTES (BEFORE :id)
// ============================================

matterRouter.get(
  "/type/:matterType",
  hasPrivilege("admin", "lawyer", "hr", "staff"),
  matterController.getMattersByType,
);

matterRouter.get(
  "/status/:status",
  hasPrivilege("admin", "lawyer", "hr", "staff"),
  matterController.getMattersByStatus,
);

matterRouter.get(
  "/validate-matter-number/:matterNumber",
  hasPrivilege("admin", "lawyer", "hr"),
  matterController.validateMatterNumber,
);

// ============================================
// GRANULAR PERMISSION ROUTES
// ============================================

matterRouter.get(
  "/confidential",
  checkPermission((user) => {
    const hasAccessRole = ["admin", "lawyer", "hr"].includes(user.userType);
    const hasConfidentialAccess =
      user.adminDetails?.canViewConfidential === true ||
      user.lawyerDetails?.canViewConfidential === true ||
      user.hrDetails?.canViewConfidential === true;

    return hasAccessRole && hasConfidentialAccess;
  }),
  (req, res, next) => {
    req.query.isConfidential = true;
    return matterController.getAllMatters(req, res, next);
  },
);

matterRouter.get(
  "/financial-overview",
  checkPermission((user) => {
    const hasFinancialAccess =
      user.userType === "admin" ||
      user.userType === "lawyer" ||
      user.additionalRoles?.includes("finance") ||
      user.additionalRoles?.includes("accounting");

    return hasFinancialAccess;
  }),
  (req, res, next) => {
    req.query.select =
      "title,matterNumber,estimatedValue,billingType,invoiceStatus";
    return matterController.getAllMatters(req, res, next);
  },
);

// ============================================
// PARAMETERIZED ROUTES (:id ROUTES - MUST COME LAST)
// ============================================

// Single matter routes
matterRouter.get(
  "/:id",
  matterController.checkMatterAccess,
  matterController.getMatter,
);

matterRouter.patch(
  "/:id",
  canManageCases,
  matterController.checkMatterAccess,
  matterController.validateMatterType,
  matterController.updateMatter,
);

matterRouter.delete(
  "/:id",
  canManageCases,
  matterController.checkMatterAccess,
  matterController.deleteMatter,
);

// Nested routes for specific matter
matterRouter.patch(
  "/:id/restore",
  canManageCases,
  matterController.restoreMatter,
);

matterRouter.get(
  "/:id/timeline",
  matterController.checkMatterAccess,
  matterController.getMatterTimeline,
);

matterRouter.post(
  "/:id/activity",
  hasPrivilege("admin", "lawyer", "hr", "staff"),
  matterController.checkMatterAccess,
  matterController.addActivityLog,
);

matterRouter.patch(
  "/:id/billing",
  checkPermission((user) => {
    if (user.userType === "admin") return true;
    if (user.userType === "lawyer" && user.lawyerDetails?.canManageBilling)
      return true;
    if (user.additionalRoles?.includes("finance")) return true;

    return false;
  }),
  matterController.checkMatterAccess,
  (req, res) => {
    // Handle billing update
    res.json({ message: "Billing updated" });
  },
);

module.exports = matterRouter;
