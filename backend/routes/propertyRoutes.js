const express = require("express");
const propertyController = require("../controllers/propertyController");
const { protect, restrictTo } = require("../controllers/authController");

const propertyRouter = express.Router();

// Protect all routes
propertyRouter.use(protect);

// Property matters listing & search
propertyRouter.get("/", propertyController.getAllPropertyMatters);
propertyRouter.post("/search", propertyController.searchPropertyMatters);

// Statistics
propertyRouter.get("/stats", propertyController.getPropertyStats);
propertyRouter.get("/pending-consents", propertyController.getPendingConsents);

// Property report PDF - must be before /:matterId routes
propertyRouter.get(
  "/:matterId/report",
  propertyController.generatePropertyReportPdf,
);

// Property details CRUD
propertyRouter
  .route("/:matterId/details")
  .get(propertyController.getPropertyDetails)
  .post(restrictTo("admin", "lawyer"), propertyController.createPropertyDetails)
  .patch(
    restrictTo("admin", "lawyer"),
    propertyController.updatePropertyDetails,
  )
  .delete(
    restrictTo("admin", "lawyer"),
    propertyController.deletePropertyDetails,
  );

propertyRouter.patch(
  "/:matterId/details/restore",
  restrictTo("admin", "lawyer"),
  propertyController.restorePropertyDetails,
);

// Properties management
propertyRouter.post(
  "/:matterId/properties",
  restrictTo("admin", "lawyer"),
  propertyController.addProperty,
);

propertyRouter.patch(
  "/:matterId/properties/:propertyId",
  restrictTo("admin", "lawyer"),
  propertyController.updateProperty,
);

propertyRouter.delete(
  "/:matterId/properties/:propertyId",
  restrictTo("admin", "lawyer"),
  propertyController.removeProperty,
);

// Payment schedule
propertyRouter.post(
  "/:matterId/payments",
  restrictTo("admin", "lawyer"),
  propertyController.addPayment,
);

propertyRouter.patch(
  "/:matterId/payments/:installmentId",
  restrictTo("admin", "lawyer"),
  propertyController.updatePayment,
);

propertyRouter.delete(
  "/:matterId/payments/:installmentId",
  restrictTo("admin", "lawyer"),
  propertyController.deletePayment,
);

// Legal processes
propertyRouter.patch(
  "/:matterId/title-search",
  restrictTo("admin", "lawyer"),
  propertyController.updateTitleSearch,
);

propertyRouter.patch(
  "/:matterId/governors-consent",
  restrictTo("admin", "lawyer"),
  propertyController.updateGovernorsConsent,
);

propertyRouter.patch(
  "/:matterId/contract-of-sale",
  restrictTo("admin", "lawyer"),
  propertyController.updateContractOfSale,
);

propertyRouter.patch(
  "/:matterId/lease-agreement",
  restrictTo("admin", "lawyer"),
  propertyController.updateLeaseAgreement,
);

propertyRouter.patch(
  "/:matterId/physical-inspection",
  restrictTo("admin", "lawyer"),
  propertyController.recordPhysicalInspection,
);

// Conditions management
propertyRouter.post(
  "/:matterId/conditions",
  restrictTo("admin", "lawyer"),
  propertyController.addCondition,
);

propertyRouter.patch(
  "/:matterId/conditions/:conditionId",
  restrictTo("admin", "lawyer"),
  propertyController.updateCondition,
);

propertyRouter.delete(
  "/:matterId/conditions/:conditionId",
  restrictTo("admin", "lawyer"),
  propertyController.deleteCondition,
);

// Transaction completion
propertyRouter.patch(
  "/:matterId/completion",
  restrictTo("admin", "lawyer"),
  propertyController.recordCompletion,
);

// Bulk operations
propertyRouter.patch(
  "/bulk-update",
  restrictTo("admin", "lawyer"),
  propertyController.bulkUpdatePropertyMatters,
);

// Property report PDF
propertyRouter.get(
  "/:id/report",
  propertyController.generatePropertyReportPdf,
);

module.exports = propertyRouter;
