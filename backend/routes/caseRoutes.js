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

const router = express.Router();

router.use(protect);

// Aggregate routes for various case groupings
router.get("/case-status", getCasesByGroup("$caseStatus", Case));
router.get("/cases-by-court", getCasesByGroup("$courtName", Case));
router.get("/cases-by-natureOfCase", getCasesByGroup("$natureOfCase", Case));
router.get("/cases-by-rating", getCasesByGroup("$casePriority", Case));
router.get("/cases-by-mode", getCasesByGroup("$modeOfCommencement", Case));
router.get("/cases-by-category", getCasesByGroup("$category", Case));

// Specific case retrieval routes
router.get("/cases-by-client", getCasesByClient);
router.get("/cases-by-accountOfficer", getCasesByAccountOfficer);
router.get("/monthly-new-cases", getMonthlyNewCases);
router.get("/yearly-new-cases", getYearlyNewCases);

// Document related routes
router.get("/:parentId/documents/:documentId/download", downloadDocument(Case));
router.delete("/:parentId/documents/:documentId", deleteDocument(Case));

// Basic CRUD routes for cases
router.get("/", getCases);
router.post("/", createCase);

// Document upload route
router.post(
  "/:id/documents",
  multerFileUploader("file"),
  uploadToCloudinary,
  createDocument(Case)
);

// Single case manipulation routes
router.get("/:caseId", getCase);
router.patch("/:caseId", updateCase);
router.delete("/:caseId", restrictTo("admin"), deleteCase);

module.exports = router;
