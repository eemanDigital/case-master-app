const express = require("express");
const retainerController = require("../controllers/retainerController");
const { protect, restrictTo } = require("../controllers/authController");

const retainerRouter = express.Router();

// Protect all routes
retainerRouter.use(protect);

// ============================================
// RETAINER MATTERS LISTING & SEARCH
// ============================================
retainerRouter.get("/", retainerController.getAllRetainerMatters);
retainerRouter.post("/search", retainerController.searchRetainerMatters);

// ============================================
// STATISTICS & ANALYTICS
// ============================================
retainerRouter.get("/stats", retainerController.getRetainerStats);
retainerRouter.get("/expiring", retainerController.getExpiringRetainers);
retainerRouter.get("/pending-requests", retainerController.getPendingRequests);

// ============================================
// RETAINER REPORT PDF
// ============================================
retainerRouter.get("/:matterId/report", retainerController.generateRetainerReportPdf);

// ============================================
// RETAINER DETAILS CRUD
// ============================================
retainerRouter
  .route("/:matterId/details")
  .get(retainerController.getRetainerDetails)
  .post(restrictTo("admin", "lawyer"), retainerController.createRetainerDetails)
  .patch(
    restrictTo("admin", "lawyer"),
    retainerController.updateRetainerDetails,
  )
  .delete(
    restrictTo("admin", "lawyer"),
    retainerController.deleteRetainerDetails,
  );

retainerRouter.patch(
  "/:matterId/details/restore",
  restrictTo("admin", "lawyer"),
  retainerController.restoreRetainerDetails,
);

// ============================================
// SERVICES MANAGEMENT (NIGERIAN UNITS MODEL)
// ============================================
retainerRouter.post(
  "/:matterId/services",
  restrictTo("admin", "lawyer"),
  retainerController.addService,
);

retainerRouter.patch(
  "/:matterId/services/:serviceId",
  restrictTo("admin", "lawyer"),
  retainerController.updateService,
);

retainerRouter.delete(
  "/:matterId/services/:serviceId",
  restrictTo("admin", "lawyer"),
  retainerController.removeService,
);

// Service usage (Nigerian units - replaces hours)
retainerRouter.patch(
  "/:matterId/services/:serviceId/usage",
  restrictTo("admin", "lawyer"),
  retainerController.updateServiceUsage,
);

// ============================================
// DISBURSEMENTS MANAGEMENT (OUT-OF-POCKETS)
// ============================================
retainerRouter.post(
  "/:matterId/disbursements",
  restrictTo("admin", "lawyer"),
  retainerController.addDisbursement,
);

retainerRouter.patch(
  "/:matterId/disbursements/:disbursementId",
  restrictTo("admin", "lawyer"),
  retainerController.updateDisbursement,
);

retainerRouter.delete(
  "/:matterId/disbursements/:disbursementId",
  restrictTo("admin", "lawyer"),
  retainerController.deleteDisbursement,
);

// ============================================
// COURT APPEARANCES MANAGEMENT
// ============================================
retainerRouter.post(
  "/:matterId/court-appearances",
  restrictTo("admin", "lawyer"),
  retainerController.addCourtAppearance,
);

// ============================================
// ACTIVITY LOG MANAGEMENT
// ============================================
retainerRouter.post(
  "/:matterId/activities",
  restrictTo("admin", "lawyer"),
  retainerController.logActivity,
);

// ============================================
// CLIENT REQUESTS MANAGEMENT
// ============================================
retainerRouter.post(
  "/:matterId/requests",
  restrictTo("admin", "lawyer"),
  retainerController.addRequest,
);

retainerRouter.patch(
  "/:matterId/requests/:requestId",
  restrictTo("admin", "lawyer"),
  retainerController.updateRequest,
);

retainerRouter.delete(
  "/:matterId/requests/:requestId",
  restrictTo("admin", "lawyer"),
  retainerController.deleteRequest,
);

// ============================================
// NBA STAMP MANAGEMENT
// ============================================
retainerRouter.patch(
  "/:matterId/nba-stamp",
  restrictTo("admin", "lawyer"),
  retainerController.updateNBAStamp,
);

// ============================================
// RETAINER LIFE CYCLE
// ============================================
retainerRouter.post(
  "/:matterId/renew",
  restrictTo("admin", "lawyer"),
  retainerController.renewRetainer,
);

retainerRouter.post(
  "/:matterId/terminate",
  restrictTo("admin", "lawyer"),
  retainerController.terminateRetainer,
);

// ============================================
// REPORTS & SUMMARIES
// ============================================
retainerRouter.get("/:matterId/summary", retainerController.getRetainerSummary);

// ============================================
// BULK OPERATIONS
// ============================================
retainerRouter.patch(
  "/bulk-update",
  restrictTo("admin", "lawyer"),
  retainerController.bulkUpdateRetainerMatters,
);

module.exports = retainerRouter;
