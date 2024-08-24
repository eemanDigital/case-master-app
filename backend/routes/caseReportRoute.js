const express = require("express");
const {
  createReport,
  getReport,
  getReports,
  getUpcomingMatter,
  updateCaseReport,
  addLawyerInCourt,
  removeLawyerInCourt,
  deleteReport,
  generateReportPdf,
  generateCauseList,
  generateCauseListMonth,
  generateCauseListWeek,
  generateCauseListNextWeek,
} = require("../controllers/CaseReportController");
const { protect } = require("../controllers/authController");
const cacheMiddleware = require("../utils/cacheMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createReport);
router.get("/", getReports);
router.get("/upcoming", getUpcomingMatter); //cause list route but from reports
// Specific route for generating cause list should be before the general /:reportId route
router.get("/pdf/causeList/week", generateCauseListWeek);
router.get("/pdf/causeList/month", generateCauseListMonth);
router.get("/pdf/causeList/next-week", generateCauseListNextWeek);
router.get("/pdf/:id", generateReportPdf);
router.get("/:reportId", getReport);
router.patch("/:reportId", updateCaseReport);
router.delete("/:id", deleteReport);

module.exports = router;
