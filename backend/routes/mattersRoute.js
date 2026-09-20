const express = require("express");
const matterController = require("../controllers/matterController");
const {
  protect,
  restrictTo,
  canManageCases,
  canViewReports,
  checkPermission,
  checkMatterLimit,
} = require("../controllers/authController");
const { auditMiddleware } = require("../middleware/auditMiddleware");

const matterRouter = express.Router();

const STAFF_ROLES = [
  "lawyer",
  "paralegal",
  "secretary",
  "accountant",
  "hr",
  "receptionist",
  "it",
  "other",
];

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

// canManageCases = restrictToAdmin (isAdmin: admin or super-admin)
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
  restrictTo("super-admin", "admin", "lawyer", "hr", ...STAFF_ROLES),
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
  restrictTo("super-admin", "admin", "lawyer", "hr", ...STAFF_ROLES),
  matterController.getAllMattersWithOfficers,
);

matterRouter.get(
  "/",
  restrictTo("super-admin", "admin", ...STAFF_ROLES, "client"),
  matterController.getAllMatters,
);

matterRouter.post(
  "/",
  canManageCases,
  checkMatterLimit,
  matterController.validateMatterType,
  matterController.createMatter,
);

// ============================================
// QUICK FILTERS
// ============================================

matterRouter.get(
  "/recent-activity",
  restrictTo("super-admin", "admin", "lawyer", "hr", ...STAFF_ROLES),
  matterController.getRecentActivity,
);

matterRouter.get(
  "/pending",
  restrictTo("super-admin", "admin", "lawyer", "hr", ...STAFF_ROLES),
  matterController.getPendingMatters,
);

matterRouter.get(
  "/urgent",
  restrictTo("super-admin", "admin", "lawyer", "hr", ...STAFF_ROLES),
  matterController.getUrgentMatters,
);

matterRouter.get(
  "/type/:matterType",
  restrictTo("super-admin", "admin", "lawyer", "hr", ...STAFF_ROLES),
  matterController.getMattersByType,
);

matterRouter.get(
  "/status/:status",
  restrictTo("super-admin", "admin", "lawyer", "hr", ...STAFF_ROLES),
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
    return (
      (user.isAdmin() || user.role === "lawyer" || user.role === "hr") &&
      (user.lawyerDetails?.canViewConfidential ||
        user.staffDetails?.canViewConfidential)
    );
  }),
  (req, res, next) => {
    req.query.isConfidential = true;
    return matterController.getAllMatters(req, res, next);
  },
);

matterRouter.get(
  "/financial-overview",
  checkPermission((user) => {
    return (
      user.isAdmin() || user.role === "lawyer" || user.role === "accountant"
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
  restrictTo("super-admin", "admin", "lawyer", "hr", ...STAFF_ROLES),
  matterController.checkMatterAccess,
  matterController.addActivityLog,
);

matterRouter.patch(
  "/:id/billing",
  checkPermission((user) => {
    return (
      user.isAdmin() ||
      user.role === "accountant" ||
      (user.role === "lawyer" && user.lawyerDetails?.canManageBilling)
    );
  }),
  matterController.checkMatterAccess,
  (req, res) => {
    res.json({ message: "Billing updated" });
  },
);

// ============================================
// DOCUMENT MANAGEMENT
// ============================================

// Import file controller functions
const fileController = require("../controllers/fileController");
const authController = require("../controllers/authController");

// Upload documents to matter
matterRouter.post(
  "/:id/documents",
  authController.protect,
  fileController.uploadMultiple,
  matterController.uploadMatterDocuments
);

// Get matter documents
matterRouter.get(
  "/:id/documents",
  authController.protect,
  matterController.getMatterDocuments
);

// Delete matter document
matterRouter.delete(
  "/:id/documents/:documentId",
  authController.protect,
  matterController.deleteMatterDocument
);

module.exports = matterRouter;
