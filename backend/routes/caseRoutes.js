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
const { multerFileUploader } = require("../utils/multerFileUploader.js");
const {
  createDocument,
  downloadDocument,
  deleteDocument,
  getCasesByGroup,
} = require("../controllers/factory.js");

const router = express.Router();
// const app = express();

router.use(protect);
router.get("/:parentId/documents/:documentId/download", downloadDocument(Case));
router.get("/case-status", getCasesByGroup("$caseStatus", Case));
router.get("/cases-by-court", getCasesByGroup("$courtName", Case));
router.get("/cases-by-natureOfCase", getCasesByGroup("$natureOfCase", Case));
router.get("/cases-by-rating", getCasesByGroup("$casePriority", Case));
router.get("/cases-by-mode", getCasesByGroup("$modeOfCommencement", Case));
router.get("/cases-by-category", getCasesByGroup("$category", Case));
router.get("/cases-by-client", getCasesByClient);
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
