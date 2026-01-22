const express = require("express");
const advisoryController = require("../controllers/advisoryController");
const { protect } = require("../controllers/authController");

const advisoryRouter = express.Router();

// Protect all routes
advisoryRouter.use(protect);

// ============================================
// ADVISORY DETAILS CRUD
// ============================================

advisoryRouter.post(
  "/:matterId/details",
  advisoryController.createAdvisoryDetails,
);
advisoryRouter.get("/:matterId/details", advisoryController.getAdvisoryDetails);
advisoryRouter.patch(
  "/:matterId/details",
  advisoryController.updateAdvisoryDetails,
);
advisoryRouter.delete(
  "/:matterId/details",
  advisoryController.deleteAdvisoryDetails,
);
advisoryRouter.patch(
  "/:matterId/details/restore",
  advisoryController.restoreAdvisoryDetails,
);

// ============================================
// ADVISORY LISTING & STATISTICS
// ============================================

advisoryRouter.get("/", advisoryController.getAllAdvisoryMatters);
advisoryRouter.get("/stats", advisoryController.getAdvisoryStats);

// ============================================
// RESEARCH QUESTIONS MANAGEMENT
// ============================================

advisoryRouter.post(
  "/:matterId/research-questions",
  advisoryController.addResearchQuestion,
);
advisoryRouter.patch(
  "/:matterId/research-questions/:questionId",
  advisoryController.updateResearchQuestion,
);
advisoryRouter.delete(
  "/:matterId/research-questions/:questionId",
  advisoryController.deleteResearchQuestion,
);

// ============================================
// KEY FINDINGS MANAGEMENT
// ============================================

advisoryRouter.post(
  "/:matterId/key-findings",
  advisoryController.addKeyFinding,
);
advisoryRouter.patch(
  "/:matterId/key-findings/:findingId",
  advisoryController.updateKeyFinding,
);
advisoryRouter.delete(
  "/:matterId/key-findings/:findingId",
  advisoryController.deleteKeyFinding,
);

// ============================================
// OPINION MANAGEMENT
// ============================================

advisoryRouter.patch("/:matterId/opinion", advisoryController.updateOpinion);

// ============================================
// RECOMMENDATIONS MANAGEMENT
// ============================================

advisoryRouter.post(
  "/:matterId/recommendations",
  advisoryController.addRecommendation,
);
advisoryRouter.patch(
  "/:matterId/recommendations/:recommendationId",
  advisoryController.updateRecommendation,
);
advisoryRouter.delete(
  "/:matterId/recommendations/:recommendationId",
  advisoryController.deleteRecommendation,
);

// ============================================
// DELIVERABLES MANAGEMENT
// ============================================

advisoryRouter.post(
  "/:matterId/deliverables",
  advisoryController.addDeliverable,
);
advisoryRouter.patch(
  "/:matterId/deliverables/:deliverableId",
  advisoryController.updateDeliverable,
);
advisoryRouter.delete(
  "/:matterId/deliverables/:deliverableId",
  advisoryController.deleteDeliverable,
);

// ============================================
// SERVICE COMPLETION
// ============================================

advisoryRouter.post("/:matterId/complete", advisoryController.completeAdvisory);

module.exports = advisoryRouter;
