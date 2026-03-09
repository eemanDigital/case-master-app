const express = require("express");
const matterController = require("../controllers/matterController");
const {
  protect,
  restrictTo,
  canManageCases,
  canViewReports,
  checkPermission,
} = require("../controllers/authController");
const { auditMiddleware } = require("../middleware/auditMiddleware");

const matterRouter = express.Router();

// ============================================
// MIDDLEWARE
// ============================================
matterRouter.use(protect);

// Auto-filter for clients - they can only see their own matters
matterRouter.use((req, res, next) => {
  if (req.user.role === "client" && req.user.id) {
    req.query.client = req.user.id;
  }
  next();
});

// Apply audit middleware
matterRouter.use(auditMiddleware);

// ============================================
// BULK & REPORTING ROUTES (Specific routes first)
// ============================================

// canManageCases uses the updated granular adminDetails check
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
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff"),
  matterController.searchMatters,
);

// ============================================
// STATIC & GLOBAL LISTING
// ============================================

matterRouter.get("/stats", matterController.getMatterStats);
matterRouter.get("/my-matters", matterController.getMyMatters);
matterRouter.get("/my-matters-summary", matterController.getMyMattersSummary);
matterRouter.get(
  "/with-officers",
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff"),
  matterController.getAllMattersWithOfficers,
);

matterRouter.get(
  "/",
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff", "client"),
  matterController.getAllMatters,
);

matterRouter.post(
  "/",
  canManageCases,
  matterController.validateMatterType,
  matterController.createMatter,
);

// ============================================
// QUICK FILTERS
// ============================================

matterRouter.get(
  "/recent-activity",
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff"),
  matterController.getRecentActivity,
);

matterRouter.get(
  "/pending",
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff"),
  matterController.getPendingMatters,
);

matterRouter.get(
  "/urgent",
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff"),
  matterController.getUrgentMatters,
);

matterRouter.get(
  "/type/:matterType",
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff"),
  matterController.getMattersByType,
);

matterRouter.get(
  "/status/:status",
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff"),
  matterController.getMattersByStatus,
);

matterRouter.get(
  "/validate-matter-number/:matterNumber",
  restrictTo("super-admin", "admin", "lawyer", "hr"),
  matterController.validateMatterNumber,
);

// ============================================
// GRANULAR PERMISSION ROUTES (Refactored)
// ============================================

matterRouter.get(
  "/confidential",
  checkPermission((user) => {
    // Check if the user has a relevant role AND the confidential toggle in their specific details
    const roles = [user.role, ...(user.additionalRoles || [])];
    const hasRole = roles.some((r) =>
      ["super-admin", "admin", "lawyer", "hr"].includes(r),
    );

    const canView =
      user.adminDetails?.canViewConfidential ||
      user.lawyerDetails?.canViewConfidential ||
      user.hrDetails?.canViewConfidential;

    return hasRole && canView;
  }),
  (req, res, next) => {
    req.query.isConfidential = true;
    return matterController.getAllMatters(req, res, next);
  },
);

matterRouter.get(
  "/financial-overview",
  checkPermission((user) => {
    // Check for specific finance roles or high-level types
    const roles = [user.role, ...(user.additionalRoles || [])];
    if (user.isLawyer) roles.push("lawyer");

    return roles.some((r) =>
      ["admin", "lawyer", "super-admin", "finance", "accounting"].includes(r),
    );
  }),
  (req, res, next) => {
    req.query.select =
      "title,matterNumber,estimatedValue,billingType,invoiceStatus";
    return matterController.getAllMatters(req, res, next);
  },
);

// ============================================
// PARAMETERIZED ROUTES (:id) - MUST BE LAST
// ============================================

matterRouter.get(
  "/:id",

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
  restrictTo("super-admin", "admin", "lawyer", "hr", "staff"),
  matterController.checkMatterAccess,
  matterController.addActivityLog,
);

matterRouter.patch(
  "/:id/billing",
  checkPermission((user) => {
    const roles = [user.role, ...(user.additionalRoles || [])];
    if (roles.includes("super-admin", "admin") || roles.includes("finance"))
      return true;
    if (user.isLawyer && user.lawyerDetails?.canManageBilling) return true;
    return false;
  }),
  matterController.checkMatterAccess,
  (req, res) => {
    res.json({ message: "Billing updated" });
  },
);

module.exports = matterRouter;
