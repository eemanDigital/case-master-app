const express = require("express");
const {
  createReport,
  getReport,
  getReports,
  getCaseReports,
  getUpcomingMatter,
  updateCaseReport,
  deleteReport,
  generateReportPdf,
  generateCauseListMonth,
  generateCauseListWeek,
  generateCauseListNextWeek,
  searchReports,
} = require("../controllers/CaseReportController");
const { protect } = require("../controllers/authController");
// const cacheMiddleware = require("../utils/cacheMiddleware");
const Report = require("../models/caseReportModel");
const {
  restoreItem,
  getDeletedItems,
  softDeleteItem,
} = require("../controllers/softDeleteController");

const router = express.Router();

router.use(protect);

router.post("/", createReport);
router.get("/", getReports);
// Advanced search endpoint
router.post("/search", searchReports);
router.get("/upcoming", getUpcomingMatter); //cause list route but from reports

router.post(
  "/:itemId/restore",
  restoreItem({ model: Report, modelName: "Case Report" })
); // restore soft deleted report
router.get(
  "/soft-deleted-reports",
  getDeletedItems({
    model: Report,
  })
);

router.get("/cases/:caseId", getCaseReports); // Get reports by caseId

router.delete(
  "/soft-delete/:id",
  softDeleteItem({ model: Report, modelName: "Case Report" })
);
// Specific route for generating cause list should be before the general /:reportId route
router.get("/pdf/causeList/week", generateCauseListWeek);
router.get("/pdf/causeList/month", generateCauseListMonth);
router.get("/pdf/causeList/next-week", generateCauseListNextWeek);
router.get("/pdf/:id", generateReportPdf);
router.get("/:reportId", getReport);
router.patch("/:reportId", updateCaseReport);
router.delete("/:id", deleteReport);

module.exports = router;
