const express = require("express");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
  downloadCaseDocument,
  getCasesByStatus,
  getMonthlyNewCases,
  getYearlyNewCases,
  getCasesByCourt,
  getCasesByNature,
  getCasesByRating,
  getCasesByModeOfCommencement,
  getCasesByCategory,
  getCasesByAccountOfficer,
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../controllers/authController");
const { multerFileUploader } = require("../utils/multerFileUploader.js");
const {
  createDocument,
  downloadDocument,
  deleteDocument,
} = require("../controllers/factory.js");
// const Case = require("../models/caseModel");
const Case = require("../models/caseModel.js");

const router = express.Router();
// const app = express();

router.use(protect);
router.get("/:parentId/documents/:documentId/download", downloadDocument(Case));
router.get("/case-status", getCasesByStatus);
router.get("/cases-by-court", getCasesByCourt);
router.get("/cases-by-natureOfCase", getCasesByNature);
router.get("/cases-by-rating", getCasesByRating);
router.get("/cases-by-mode", getCasesByModeOfCommencement);
router.get("/cases-by-category", getCasesByCategory);
router.get("/cases-by-accountOfficer", getCasesByAccountOfficer);
router.get("/monthly-new-cases", getMonthlyNewCases);
router.get("/yearly-new-cases", getYearlyNewCases);
router.delete("/:parentId/documents/:documentId", deleteDocument(Case));

router.route("/").get(getCases).post(createCase);
// .post(createCase);

router.post(
  "/:id/documents",
  multerFileUploader("public/caseDoc", "file"),
  createDocument(Case, "public/caseDoc")
);

router
  .route("/:caseId")
  .get(getCase)
  .patch(updateCase)
  .delete(restrictTo("admin"), deleteCase);

module.exports = router;
