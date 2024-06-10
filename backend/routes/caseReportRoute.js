const express = require("express");
const {
  createReport,
  getReport,
  getReports,
  getUpcomingMatter,
} = require("../controllers/CaseReportController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.post("/", createReport);
router.get("/", getReports);
router.get("/upcoming", getUpcomingMatter); //need to be before the below route
router.get("/:reportId", getReport);

module.exports = router;
