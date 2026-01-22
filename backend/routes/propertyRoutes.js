const express = require("express");
const propertyController = require("../controllers/propertyController");
const { protect } = require("../controllers/authController");

const propertyRouter = express.Router();

// Protect all routes
propertyRouter.use(protect);

// ============================================
// PROPERTY DETAILS CRUD
// ============================================

propertyRouter.post(
  "/:matterId/details",
  propertyController.createPropertyDetails,
);
propertyRouter.get("/:matterId/details", propertyController.getPropertyDetails);
propertyRouter.patch(
  "/:matterId/details",
  propertyController.updatePropertyDetails,
);
propertyRouter.delete(
  "/:matterId/details",
  propertyController.deletePropertyDetails,
);
propertyRouter.patch(
  "/:matterId/details/restore",
  propertyController.restorePropertyDetails,
);

// ============================================
// PROPERTY LISTING & STATISTICS
// ============================================

propertyRouter.get("/", propertyController.getAllPropertyMatters);
propertyRouter.get("/stats", propertyController.getPropertyStats);
propertyRouter.get("/pending-consents", propertyController.getPendingConsents);

// ============================================
// PROPERTIES MANAGEMENT
// ============================================

propertyRouter.post("/:matterId/properties", propertyController.addProperty);
propertyRouter.patch(
  "/:matterId/properties/:index",
  propertyController.updateProperty,
);
propertyRouter.delete(
  "/:matterId/properties/:index",
  propertyController.removeProperty,
);

// ============================================
// PAYMENT SCHEDULE MANAGEMENT
// ============================================

propertyRouter.post("/:matterId/payments", propertyController.addPayment);
propertyRouter.patch(
  "/:matterId/payments/:installmentId",
  propertyController.updatePayment,
);
propertyRouter.delete(
  "/:matterId/payments/:installmentId",
  propertyController.deletePayment,
);

// ============================================
// LEGAL PROCESSES & DUE DILIGENCE
// ============================================

propertyRouter.patch(
  "/:matterId/title-search",
  propertyController.updateTitleSearch,
);
propertyRouter.patch(
  "/:matterId/governors-consent",
  propertyController.updateGovernorsConsent,
);
propertyRouter.patch(
  "/:matterId/contract-of-sale",
  propertyController.updateContractOfSale,
);
propertyRouter.patch(
  "/:matterId/lease-agreement",
  propertyController.updateLeaseAgreement,
);
propertyRouter.patch(
  "/:matterId/physical-inspection",
  propertyController.recordPhysicalInspection,
);

// ============================================
// CONDITIONS MANAGEMENT
// ============================================

propertyRouter.post("/:matterId/conditions", propertyController.addCondition);
propertyRouter.patch(
  "/:matterId/conditions/:conditionId",
  propertyController.updateCondition,
);
propertyRouter.delete(
  "/:matterId/conditions/:conditionId",
  propertyController.deleteCondition,
);

// ============================================
// TRANSACTION COMPLETION
// ============================================

propertyRouter.patch(
  "/:matterId/completion",
  propertyController.recordCompletion,
);

module.exports = propertyRouter;
