const express = require("express");
const litigationController = require("../controllers/litigationController");
const { protect } = require("../controllers/authController");

const litigationRouter = express.Router();

// Protect all routes
litigationRouter.use(protect);

// ============================================
// LITIGATION STATISTICS & REPORTS
// ============================================

litigationRouter.get("/stats", litigationController.getLitigationStats);
litigationRouter.get("/dashboard", litigationController.getLitigationDashboard); // ✅

litigationRouter.get(
  "/upcoming-hearings",
  litigationController.getUpcomingHearings,
);

// Download upcoming hearings as PDF
litigationRouter.get(
  "/upcoming-hearings/download",
  litigationController.downloadUpcomingHearingsPdf,
);

// ============================================
// LITIGATION SEARCH
// ============================================

litigationRouter.post("/search", litigationController.searchLitigationMatters); // ✅

// ============================================
// LITIGATION MATTERS LISTING
// ============================================

litigationRouter.get("/", litigationController.getAllLitigationMatters);

// ============================================
// LITIGATION REPORT PDF
// ============================================

litigationRouter.get("/:matterId/report", litigationController.generateLitigationReportPdf);

// ============================================
// LITIGATION DETAILS CRUD
// ============================================

litigationRouter.post(
  "/:matterId/details",
  litigationController.createLitigationDetails,
);
litigationRouter.get(
  "/:matterId/details",
  litigationController.getLitigationDetails,
);
litigationRouter.patch(
  "/:matterId/details",
  litigationController.updateLitigationDetails,
);
litigationRouter.delete(
  "/:matterId/details",
  litigationController.deleteLitigationDetails,
); // ✅
litigationRouter.patch(
  "/:matterId/details/restore",
  litigationController.restoreLitigationDetails,
); // ✅

// ============================================
// HEARINGS MANAGEMENT
// ============================================

litigationRouter.post("/:matterId/hearings", litigationController.addHearing);
litigationRouter.patch(
  "/:matterId/hearings/:hearingId",
  litigationController.updateHearing,
);
litigationRouter.get(
  "/:matterId/hearings",
  litigationController.getMatterHearings,
); // ✅
litigationRouter.delete(
  "/:matterId/hearings/:hearingId",
  litigationController.deleteHearing,
); // ✅

// ============================================
// COURT ORDERS MANAGEMENT
// ============================================

litigationRouter.post(
  "/:matterId/court-orders",
  litigationController.addCourtOrder,
);
litigationRouter.patch(
  "/:matterId/court-orders/:orderId",
  litigationController.updateCourtOrder,
); // ✅
litigationRouter.delete(
  "/:matterId/court-orders/:orderId",
  litigationController.deleteCourtOrder,
); // ✅

// ============================================
// PROCESSES FILED MANAGEMENT
// ============================================

litigationRouter.post(
  "/:matterId/processes",
  litigationController.addProcessFiled,
);
litigationRouter.patch(
  "/:matterId/processes/:party/:processIndex",
  litigationController.updateProcessFiled,
); // ✅
litigationRouter.delete(
  "/:matterId/processes/:party/:processIndex",
  litigationController.deleteProcessFiled,
); // ✅

// ============================================
// CASE OUTCOME MANAGEMENT
// ============================================

litigationRouter.patch(
  "/:matterId/judgment",
  litigationController.recordJudgment,
);
litigationRouter.patch(
  "/:matterId/settlement",
  litigationController.recordSettlement,
);
litigationRouter.patch("/:matterId/appeal", litigationController.fileAppeal);

// ============================================
// LITIGATION STEPS MANAGEMENT
// ============================================

litigationRouter.post(
  "/:matterId/steps",
  litigationController.addLitigationStep,
);
litigationRouter.get(
  "/:matterId/steps",
  litigationController.getLitigationSteps,
);
litigationRouter.patch(
  "/:matterId/steps/:stepId",
  litigationController.updateLitigationStep,
);
litigationRouter.delete(
  "/:matterId/steps/:stepId",
  litigationController.deleteLitigationStep,
);
litigationRouter.patch(
  "/:matterId/steps/:stepId/status",
  litigationController.updateLitigationStepStatus,
);
litigationRouter.patch(
  "/:matterId/steps/reorder",
  litigationController.reorderLitigationSteps,
);

module.exports = litigationRouter;
