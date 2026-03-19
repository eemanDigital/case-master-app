const express = require("express");
const advisoryController = require("../controllers/advisoryController");
const { protect, restrictTo } = require("../controllers/authController");

const advisoryRouter = express.Router();

// Protect all routes
advisoryRouter.use(protect);

// Advisory matters listing & search
advisoryRouter.get("/", advisoryController.getAllAdvisoryMatters);
advisoryRouter.post("/search", advisoryController.searchAdvisoryMatters);

// Statistics
advisoryRouter.get("/stats", advisoryController.getAdvisoryStats);

// ============================================
// ADVISORY REPORT PDF
// ============================================

/**
 * @route   GET /api/advisory-matters/:matterId/report
 * @desc    Generate advisory matter report PDF
 * @access  Private
 * @example GET /api/advisory-matters/123abc/report
 */
advisoryRouter.get("/:matterId/report", advisoryController.generateAdvisoryReportPdf);

// Advisory details CRUD
advisoryRouter
  .route("/:matterId/details")
  .get(advisoryController.getAdvisoryDetails)
  .post(restrictTo("admin", "lawyer"), advisoryController.createAdvisoryDetails)
  .patch(
    restrictTo("admin", "lawyer"),
    advisoryController.updateAdvisoryDetails,
  )
  .delete(
    restrictTo("admin", "lawyer"),
    advisoryController.deleteAdvisoryDetails,
  );

advisoryRouter.patch(
  "/:matterId/details/restore",
  restrictTo("admin", "lawyer"),
  advisoryController.restoreAdvisoryDetails,
);

// Research questions
advisoryRouter.post(
  "/:matterId/research-questions",
  restrictTo("admin", "lawyer"),
  advisoryController.addResearchQuestion,
);

advisoryRouter.patch(
  "/:matterId/research-questions/:questionId",
  restrictTo("admin", "lawyer"),
  advisoryController.updateResearchQuestion,
);

advisoryRouter.delete(
  "/:matterId/research-questions/:questionId",
  restrictTo("admin", "lawyer"),
  advisoryController.deleteResearchQuestion,
);

// Key findings
advisoryRouter.post(
  "/:matterId/key-findings",
  restrictTo("admin", "lawyer"),
  advisoryController.addKeyFinding,
);

advisoryRouter.patch(
  "/:matterId/key-findings/:findingId",
  restrictTo("admin", "lawyer"),
  advisoryController.updateKeyFinding,
);

advisoryRouter.delete(
  "/:matterId/key-findings/:findingId",
  restrictTo("admin", "lawyer"),
  advisoryController.deleteKeyFinding,
);

// Opinion
advisoryRouter.patch(
  "/:matterId/opinion",
  restrictTo("admin", "lawyer"),
  advisoryController.updateOpinion,
);

// Recommendations
advisoryRouter.post(
  "/:matterId/recommendations",
  restrictTo("admin", "lawyer"),
  advisoryController.addRecommendation,
);

advisoryRouter.patch(
  "/:matterId/recommendations/:recommendationId",
  restrictTo("admin", "lawyer"),
  advisoryController.updateRecommendation,
);

advisoryRouter.delete(
  "/:matterId/recommendations/:recommendationId",
  restrictTo("admin", "lawyer"),
  advisoryController.deleteRecommendation,
);

// Deliverables
advisoryRouter.post(
  "/:matterId/deliverables",
  restrictTo("admin", "lawyer"),
  advisoryController.addDeliverable,
);

advisoryRouter.patch(
  "/:matterId/deliverables/:deliverableId",
  restrictTo("admin", "lawyer"),
  advisoryController.updateDeliverable,
);

advisoryRouter.delete(
  "/:matterId/deliverables/:deliverableId",
  restrictTo("admin", "lawyer"),
  advisoryController.deleteDeliverable,
);

// Service completion
advisoryRouter.post(
  "/:matterId/complete",
  restrictTo("admin", "lawyer"),
  advisoryController.completeAdvisory,
);

// Bulk operations
advisoryRouter.patch(
  "/bulk-update",
  restrictTo("admin", "lawyer"),
  advisoryController.bulkUpdateAdvisoryMatters,
);

module.exports = advisoryRouter;
