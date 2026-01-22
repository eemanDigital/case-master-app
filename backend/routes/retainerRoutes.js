const express = require("express");
const retainerController = require("../controllers/retainerController");
const { protect } = require("../controllers/authController");

const retainerRouter = express.Router();

// Protect all routes
retainerRouter.use(protect);

// ============================================
// RETAINER DETAILS CRUD
// ============================================

retainerRouter.post(
  "/:matterId/details",
  retainerController.createRetainerDetails,
);
retainerRouter.get("/:matterId/details", retainerController.getRetainerDetails);
retainerRouter.patch(
  "/:matterId/details",
  retainerController.updateRetainerDetails,
);
retainerRouter.delete(
  "/:matterId/details",
  retainerController.deleteRetainerDetails,
);
retainerRouter.patch(
  "/:matterId/details/restore",
  retainerController.restoreRetainerDetails,
);

// ============================================
// RETAINER LISTING & STATISTICS
// ============================================

retainerRouter.get("/", retainerController.getAllRetainerMatters);
retainerRouter.get("/stats", retainerController.getRetainerStats);
retainerRouter.get("/expiring", retainerController.getExpiringRetainers);
retainerRouter.get("/pending-requests", retainerController.getPendingRequests);

// ============================================
// SERVICES MANAGEMENT
// ============================================

retainerRouter.post("/:matterId/services", retainerController.addService);
retainerRouter.patch(
  "/:matterId/services/:serviceId",
  retainerController.updateService,
);
retainerRouter.delete(
  "/:matterId/services/:serviceId",
  retainerController.removeService,
);

// ============================================
// HOURS MANAGEMENT
// ============================================

retainerRouter.patch(
  "/:matterId/services/:serviceId/hours",
  retainerController.updateServiceHours,
);
retainerRouter.get(
  "/:matterId/hours-summary",
  retainerController.getHoursSummary,
);

// ============================================
// CLIENT REQUESTS MANAGEMENT
// ============================================

retainerRouter.post("/:matterId/requests", retainerController.addRequest);
retainerRouter.patch(
  "/:matterId/requests/:requestId",
  retainerController.updateRequest,
);
retainerRouter.delete(
  "/:matterId/requests/:requestId",
  retainerController.deleteRequest,
);

// ============================================
// RETAINER LIFE CYCLE
// ============================================

retainerRouter.post("/:matterId/renew", retainerController.renewRetainer);
retainerRouter.post(
  "/:matterId/terminate",
  retainerController.terminateRetainer,
);

module.exports = retainerRouter;
