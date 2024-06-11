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
} = require("../controllers/CaseReportController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.post("/", createReport);
router.get("/", getReports);
router.get("/upcoming", getUpcomingMatter); //need to be before the below route
router.get("/:reportId", getReport);
router.patch("/:reportId", updateCaseReport);
router.delete("/:id", deleteReport);

// router for assigning lawyers to court

router.get("/pdf/:id", generateReportPdf);
// router.delete("/:id/lawyers", removeLawyerInCourt);

module.exports = router;
