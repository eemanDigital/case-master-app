const express = require("express");
const generalController = require("../controllers/generalController");
const { protect, restrictTo } = require("../controllers/authController");

const generalRouter = express.Router();

// Protect all routes
generalRouter.use(protect);

// ============================================
// GENERAL MATTERS LISTING & SEARCH
// ============================================
generalRouter.get("/", generalController.getAllGeneralMatters);
generalRouter.post("/search", generalController.searchGeneralMatters);

// ============================================
// STATISTICS
// ============================================
generalRouter.get("/stats", generalController.getGeneralStats);

// ============================================
// GENERAL DETAILS CRUD
// ============================================
generalRouter
  .route("/:matterId/details")
  .get(generalController.getGeneralDetails)
  .post(restrictTo("admin", "lawyer"), generalController.createGeneralDetails)
  .patch(restrictTo("admin", "lawyer"), generalController.updateGeneralDetails)
  .delete(
    restrictTo("admin", "lawyer"),
    generalController.deleteGeneralDetails,
  );

generalRouter.patch(
  "/:matterId/details/restore",
  restrictTo("admin", "lawyer"),
  generalController.restoreGeneralDetails,
);

// ============================================
// REQUIREMENTS MANAGEMENT
// ============================================
generalRouter.post(
  "/:matterId/requirements",
  restrictTo("admin", "lawyer"),
  generalController.addRequirement,
);

generalRouter.patch(
  "/:matterId/requirements/:requirementId",
  restrictTo("admin", "lawyer"),
  generalController.updateRequirement,
);

generalRouter.delete(
  "/:matterId/requirements/:requirementId",
  restrictTo("admin", "lawyer"),
  generalController.deleteRequirement,
);

// ============================================
// PARTIES MANAGEMENT
// ============================================
generalRouter.post(
  "/:matterId/parties",
  restrictTo("admin", "lawyer"),
  generalController.addParty,
);

generalRouter.patch(
  "/:matterId/parties/:partyId",
  restrictTo("admin", "lawyer"),
  generalController.updateParty,
);

generalRouter.delete(
  "/:matterId/parties/:partyId",
  restrictTo("admin", "lawyer"),
  generalController.deleteParty,
);

// ============================================
// DELIVERABLES MANAGEMENT
// ============================================
generalRouter.post(
  "/:matterId/deliverables",
  restrictTo("admin", "lawyer"),
  generalController.addDeliverable,
);

generalRouter.patch(
  "/:matterId/deliverables/:deliverableId",
  restrictTo("admin", "lawyer"),
  generalController.updateDeliverable,
);

generalRouter.delete(
  "/:matterId/deliverables/:deliverableId",
  restrictTo("admin", "lawyer"),
  generalController.deleteDeliverable,
);

// ============================================
// DOCUMENTS MANAGEMENT (DOCUMENTS RECEIVED)
// ============================================
generalRouter.post(
  "/:matterId/documents",
  restrictTo("admin", "lawyer"),
  generalController.addDocument,
);

generalRouter.patch(
  "/:matterId/documents/:documentId",
  restrictTo("admin", "lawyer"),
  generalController.updateDocumentStatus,
);

generalRouter.delete(
  "/:matterId/documents/:documentId",
  restrictTo("admin", "lawyer"),
  generalController.deleteDocument,
);

// ============================================
// PROJECT STAGES MANAGEMENT (NIGERIAN BILLING)
// ============================================
generalRouter.post(
  "/:matterId/stages",
  restrictTo("admin", "lawyer"),
  generalController.addProjectStage,
);

generalRouter.patch(
  "/:matterId/stages/:stageId",
  restrictTo("admin", "lawyer"),
  generalController.updateProjectStage,
);

generalRouter.patch(
  "/:matterId/stages/:stageId/complete",
  restrictTo("admin", "lawyer"),
  generalController.completeProjectStage,
);

// ============================================
// DISBURSEMENTS MANAGEMENT
// ============================================
generalRouter.post(
  "/:matterId/disbursements",
  restrictTo("admin", "lawyer"),
  generalController.addDisbursement,
);

generalRouter.patch(
  "/:matterId/disbursements/:disbursementId",
  restrictTo("admin", "lawyer"),
  generalController.updateDisbursement,
);

generalRouter.delete(
  "/:matterId/disbursements/:disbursementId",
  restrictTo("admin", "lawyer"),
  generalController.deleteDisbursement,
);

// ============================================
// NBA STAMP MANAGEMENT
// ============================================
generalRouter.patch(
  "/:matterId/nba-stamp",
  restrictTo("admin", "lawyer"),
  generalController.updateNBAStamp,
);

// ============================================
// SERVICE COMPLETION
// ============================================
generalRouter.post(
  "/:matterId/complete",
  restrictTo("admin", "lawyer"),
  generalController.completeGeneralService,
);

// ============================================
// BULK OPERATIONS
// ============================================
generalRouter.patch(
  "/bulk-update",
  restrictTo("admin", "lawyer"),
  generalController.bulkUpdateGeneralMatters,
);

module.exports = generalRouter;
