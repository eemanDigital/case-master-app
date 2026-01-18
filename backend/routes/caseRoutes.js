const express = require("express");
const Case = require("../models/caseModel.js");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
  getMonthlyNewCases,
  getYearlyNewCases,
  getCasesByAccountOfficer,
  getCasesByClient,
  searchCases,
  getActiveCases,
  getCasesByCategory,
  getCasesByPriority,
  getCasesByStatus,
  getCasesByCourt,
  getDashboardStats, // Add the new endpoint
  getCasesByAccountOfficerAggregate,
  getCasesByClientAggregate,
} = require("../controllers/caseController");
const {
  protect,
  restrictTo,
  checkCaseLimit,
} = require("../controllers/authController");
const {
  multerFileUploader,
  uploadToCloudinary,
} = require("../utils/multerFileUploader.js");
const {
  createDocument,
  downloadDocument,
  deleteDocument,
  getCasesByGroup,
} = require("../controllers/factory.js");
const {
  softDeleteItem,
  restoreItem,
  getDeletedItems,
} = require("../controllers/softDeleteController.js");

const router = express.Router();

router.use(protect);

// Dashboard stats - single optimized endpoint
router.get("/dashboard-stats", getDashboardStats);

// Advanced pagination and filtering for cases
router.get("/", getCases);

// Advanced search endpoint
router.post("/search", searchCases);

// Filtered case routes
router.get("/status/:status", getCasesByStatus);
router.get("/account-officer/:accountOfficerId", getCasesByAccountOfficer);
router.get("/client/:clientId", getCasesByClient);
router.get("/court/:courtName", getCasesByCourt);
router.get("/category/:category", getCasesByCategory);
router.get("/priority/:priority", getCasesByPriority);
router.get("/active", getActiveCases);

// Aggregate routes (keep for backward compatibility)
router.get("/account-officers/aggregate", getCasesByAccountOfficerAggregate);
router.get("/cases-by-client", getCasesByClientAggregate);
router.get("/monthly-new-cases", getMonthlyNewCases);
router.get("/yearly-new-cases", getYearlyNewCases);

// Document related routes
router.get("/:parentId/documents/:documentId/download", downloadDocument(Case));
router.delete("/:parentId/documents/:documentId", deleteDocument(Case));
router.delete(
  "/soft-delete/:id",
  softDeleteItem({ model: Case, modelName: "Case" })
);

// Basic CRUD routes for cases
router.get("/soft-deleted-cases", getDeletedItems({ model: Case }));
router.post("/", checkCaseLimit, createCase);

// Document upload route
router.post(
  "/:id/documents",
  multerFileUploader("file"),
  uploadToCloudinary,
  createDocument(Case)
);

// Single case manipulation routes
router.get("/:caseId", getCase);
router.post(
  "/:itemId/restore",
  restoreItem({ model: Case, modelName: "Case" })
);
router.patch("/:caseId", updateCase);
router.delete("/:caseId", restrictTo("admin", "super-admin"), deleteCase);

module.exports = router;
