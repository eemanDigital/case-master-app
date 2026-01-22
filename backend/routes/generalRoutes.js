const express = require("express");
const generalController = require("../controllers/generalController");
const { protect } = require("../controllers/authController");

const generalRouter = express.Router();

// Protect all routes
generalRouter.use(protect);

// ============================================
// GENERAL DETAILS CRUD
// ============================================

generalRouter.post(
  "/:matterId/details",
  generalController.createGeneralDetails,
);
generalRouter.get("/:matterId/details", generalController.getGeneralDetails);
generalRouter.patch(
  "/:matterId/details",
  generalController.updateGeneralDetails,
);
generalRouter.delete(
  "/:matterId/details",
  generalController.deleteGeneralDetails,
);
generalRouter.patch(
  "/:matterId/details/restore",
  generalController.restoreGeneralDetails,
);

// ============================================
// GENERAL MATTERS LISTING & STATISTICS
// ============================================

generalRouter.get("/", generalController.getAllGeneralMatters);
generalRouter.get("/stats", generalController.getGeneralStats);

// ============================================
// REQUIREMENTS MANAGEMENT
// ============================================

generalRouter.post("/:matterId/requirements", generalController.addRequirement);
generalRouter.patch(
  "/:matterId/requirements/:requirementId",
  generalController.updateRequirement,
);
generalRouter.delete(
  "/:matterId/requirements/:requirementId",
  generalController.deleteRequirement,
);

// ============================================
// PARTIES MANAGEMENT
// ============================================

generalRouter.post("/:matterId/parties", generalController.addParty);
generalRouter.patch(
  "/:matterId/parties/:partyId",
  generalController.updateParty,
);
generalRouter.delete(
  "/:matterId/parties/:partyId",
  generalController.deleteParty,
);

// ============================================
// DELIVERABLES MANAGEMENT
// ============================================

generalRouter.post("/:matterId/deliverables", generalController.addDeliverable);
generalRouter.patch(
  "/:matterId/deliverables/:deliverableId",
  generalController.updateDeliverable,
);
generalRouter.delete(
  "/:matterId/deliverables/:deliverableId",
  generalController.deleteDeliverable,
);

// ============================================
// DOCUMENTS MANAGEMENT
// ============================================

generalRouter.post("/:matterId/documents", generalController.addDocument);
generalRouter.patch(
  "/:matterId/documents/:documentId",
  generalController.updateDocumentStatus,
);
generalRouter.delete(
  "/:matterId/documents/:documentId",
  generalController.deleteDocument,
);

// ============================================
// SERVICE COMPLETION
// ============================================

generalRouter.post(
  "/:matterId/complete",
  generalController.completeGeneralService,
);

module.exports = generalRouter;
