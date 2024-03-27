const express = require("express");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../controllers/authController");

const caseRouter = express.Router();

caseRouter
  .route("/")
  .get(protect, restrictTo("admin"), getCases)
  .post(createCase);
caseRouter.route("/:caseId").get(getCase).put(updateCase).delete(deleteCase);

module.exports = caseRouter;
