const express = require("express");
const {
  createReport,
  getReport,
  getReports,
} = require("../controllers/reportController");

const reportRouter = express.Router();

reportRouter.post("/", createReport);
reportRouter.get("/", getReports);
reportRouter.get("/:reportId", getReport);

module.exports = reportRouter;
