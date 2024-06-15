const express = require("express");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
  createDocuments,
  downloadCaseDocument,
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../controllers/authController");
const { multerFileUploader } = require("../utils/multerFileUploader.js");

const router = express.Router();
// const app = express();

router.use(protect);
router.get("/:caseId/documents/:documentId/download", downloadCaseDocument);

router.route("/").get(getCases).post(createCase);
// .post(createCase);

router.post(
  "/:caseId/documents",
  multerFileUploader("public/caseDoc", "file"),
  createDocuments
);

router
  .route("/:caseId")
  .get(getCase)
  .patch(updateCase)
  .delete(restrictTo("admin"), deleteCase);

module.exports = router;
