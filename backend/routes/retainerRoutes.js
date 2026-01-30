const express = require("express");
const retainerController = require("../controllers/retainerController");
const { protect, restrictTo } = require("../controllers/authController");

const retainerRouter = express.Router();

// Protect all routes
retainerRouter.use(protect);

// Retainer matters listing & search
retainerRouter.get("/", retainerController.getAllRetainerMatters);
retainerRouter.post("/search", retainerController.searchRetainerMatters);

// Statistics & analytics
retainerRouter.get("/stats", retainerController.getRetainerStats);
retainerRouter.get("/expiring", retainerController.getExpiringRetainers);
retainerRouter.get("/pending-requests", retainerController.getPendingRequests);

// Retainer details CRUD
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

// Services management
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

// Hours management
retainerRouter.patch(
  "/:matterId/services/:serviceId/hours",
  restrictTo("admin", "lawyer"),
  retainerController.updateServiceHours,
);

retainerRouter.get(
  "/:matterId/hours-summary",
  retainerController.getHoursSummary,
);

// Client requests management
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

// Retainer life cycle
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

// Bulk operations
retainerRouter.patch(
  "/bulk-update",
  restrictTo("admin", "lawyer"),
  retainerController.bulkUpdateRetainerMatters,
);

module.exports = retainerRouter;
