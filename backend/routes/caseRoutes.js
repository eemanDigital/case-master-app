const express = require("express");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../controllers/authController");
// const { fileUpload } = require("../utils/multerDocHandler");
const upload = require("../utils/multerDocHandler");
// const {uploadFile}

const caseRouter = express.Router();

caseRouter.route("/").get(getCases).post(createCase);
// .post(createCase);
caseRouter
  .route("/:caseId")
  .get(getCase)
  .put(updateCase)
  .delete(restrictTo("admin"), deleteCase);

module.exports = caseRouter;
