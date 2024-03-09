const express = require("express");
const { getCases, createCase } = require("../controllers/caseController");

const caseRouter = express.Router();

caseRouter.get("/", getCases);
caseRouter.post("/", createCase);

module.exports = caseRouter;
