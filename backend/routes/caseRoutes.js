const express = require("express");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
  upload,
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../controllers/authController");

const caseRouter = express.Router();

caseRouter.route("/").get(getCases).post(createCase);
// .post(createCase);
caseRouter
  .route("/:caseId")
  .get(getCase)
  .patch(upload.single("file"), updateCase)
  .delete(restrictTo("admin"), deleteCase);

module.exports = caseRouter;
