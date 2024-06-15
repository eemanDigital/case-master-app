const express = require("express");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
  createDocuments,
  downloadCaseDocument,
  uploadCaseFile,
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../controllers/authController");
// const multer = require("multer");
// const upload = multer({ dest: "public/uploads/" });

const router = express.Router();
// const app = express();

router.use(protect);
router.get("/:caseId/documents/:documentId/download", downloadCaseDocument);

router.route("/").get(getCases).post(createCase);
// .post(createCase);

router.post("/:caseId/documents", uploadCaseFile, createDocuments);

router
  .route("/:caseId")
  .get(getCase)
  .patch(updateCase)
  .delete(restrictTo("admin"), deleteCase);

module.exports = router;
