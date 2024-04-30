const express = require("express");
const { createReport, getReport } = require("../controllers/reportController");

const reportRouter = express.Router();

reportRouter.post("/", createReport);
reportRouter.get("/:reportId", getReport);

module.exports = reportRouter;
