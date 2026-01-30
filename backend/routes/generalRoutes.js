const express = require("express");
const generalController = require("../controllers/generalController");
const { protect, restrictTo } = require("../controllers/authController");

const generalRouter = express.Router();

// Protect all routes
generalRouter.use(protect);

// General matters listing & search
generalRouter.get("/", generalController.getAllGeneralMatters);
generalRouter.post("/search", generalController.searchGeneralMatters);

// Statistics
generalRouter.get("/stats", generalController.getGeneralStats);

// General details CRUD
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

// Requirements management
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

// Parties management
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

// Deliverables management
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

// Documents management
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

// Service completion
generalRouter.post(
  "/:matterId/complete",
  restrictTo("admin", "lawyer"),
  generalController.completeGeneralService,
);

// Bulk operations
generalRouter.patch(
  "/bulk-update",
  restrictTo("admin", "lawyer"),
  generalController.bulkUpdateGeneralMatters,
);

module.exports = generalRouter;
