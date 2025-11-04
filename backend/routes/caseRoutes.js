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
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../controllers/authController");
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

// const cacheMiddleware = require("../utils/cacheMiddleware.js");

const router = express.Router();

router.use(protect);

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

// Aggregate routes for various case groupings
router.get(
  "/case-status",
  // cacheMiddleware(() => "$caseStatus"),
  getCasesByGroup("$caseStatus", Case)
);

router.get(
  "/cases-by-court",
  // cacheMiddleware(() => "$courtName"),
  getCasesByGroup("$courtName", Case)
);
router.get(
  "/cases-by-natureOfCase",
  // cacheMiddleware(() => "$natureOfCase"),
  getCasesByGroup("$natureOfCase", Case)
);
router.get(
  "/cases-by-rating",
  // cacheMiddleware(() => "$casePriority"),
  getCasesByGroup("$casePriority", Case)
);
router.get(
  "/cases-by-mode",
  // cacheMiddleware(() => "$modeOfCommencement"),
  getCasesByGroup("$modeOfCommencement", Case)
);
router.get(
  "/cases-by-category",
  // cacheMiddleware(() => "$category"),
  getCasesByGroup("$category", Case)
);

// Specific case retrieval routes
router.get(
  "/cases-by-client",
  // cacheMiddleware(() => "cbc"),
  getCasesByClient
);
router.get(
  "/cases-by-accountOfficer",
  // cacheMiddleware(() => "case"),
  getCasesByAccountOfficer
);
router.get(
  "/monthly-new-cases",
  // cacheMiddleware(() => "mnc"),
  getMonthlyNewCases
);
router.get(
  "/yearly-new-cases",
  // cacheMiddleware(() => "ync"),

  getYearlyNewCases
);

// Document related routes
router.get("/:parentId/documents/:documentId/download", downloadDocument(Case));
router.delete("/:parentId/documents/:documentId", deleteDocument(Case));
router.delete(
  "/soft-delete/:id",
  softDeleteItem({ model: Case, modelName: "Case" })
);

// Basic CRUD routes for cases
router.get(
  "/",
  // cacheMiddleware(() => "cases"),
  getCases
);
router.get(
  "/soft-deleted-cases",

  getDeletedItems({ model: Case })
);
router.post("/", createCase);

// Document upload route
router.post(
  "/:id/documents",
  multerFileUploader("file"),
  uploadToCloudinary,
  createDocument(Case)
);

// Single case manipulation routes
router.get(
  "/:caseId",
  // cacheMiddleware((req) => `singleCase:${req.params.caseId}`),
  getCase
);
router.post(
  "/:itemId/restore",
  restoreItem({ model: Case, modelName: "Case" })
); // restore soft deleted case

router.patch("/:caseId", updateCase); // update case by id
router.delete("/:caseId", restrictTo("admin", "super-admin"), deleteCase); // hard delete case by id

module.exports = router;
