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
// const cacheMiddleware = require("../utils/cacheMiddleware.js");

const router = express.Router();

router.use(protect);

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
  // cacheMiddleware(() => "casesao"),
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

// Basic CRUD routes for cases
router.get(
  "/",
  // cacheMiddleware(() => "cases"),
  getCases
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
router.patch("/:caseId", updateCase);
router.delete("/:caseId", restrictTo("admin", "super-admin"), deleteCase);

module.exports = router;
