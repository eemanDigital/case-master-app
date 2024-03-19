const express = require("express");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
} = require("../controllers/caseController");

const caseRouter = express.Router();

caseRouter.route("/").get(getCases).post(createCase);
caseRouter.route("/:caseId").get(getCase).put(updateCase).delete(deleteCase);

module.exports = caseRouter;
