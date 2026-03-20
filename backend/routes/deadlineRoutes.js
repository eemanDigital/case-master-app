const express = require("express");
const deadlineController = require("../controllers/deadlineController");
const { protect, restrictTo } = require("../controllers/authController");
const { premiumFeatureGuard } = require("../middleware/premiumFeatureGuard");

const router = express.Router();

router.use(protect);
router.use(premiumFeatureGuard("deadlineEngine"));

router.get("/stats", restrictTo("super-admin", "admin", "lawyer"), deadlineController.getDeadlineStats);
router.get("/performance-report", restrictTo("super-admin", "admin", "lawyer"), deadlineController.getPerformanceReport);
router.post("/performance-report/export", restrictTo("super-admin", "admin", "lawyer"), deadlineController.generatePerformanceReportPdf);

router.route("/")
  .get(deadlineController.getAllDeadlines)
  .post(restrictTo("super-admin", "admin", "lawyer"), deadlineController.createDeadline);

router.route("/:id")
  .get(deadlineController.getDeadline)
  .patch(restrictTo("super-admin", "admin", "lawyer"), deadlineController.updateDeadline)
  .delete(restrictTo("super-admin", "admin"), deadlineController.deleteDeadline);

router.patch("/:id/complete", deadlineController.markComplete);
router.patch("/:id/extend", restrictTo("super-admin", "admin", "lawyer"), deadlineController.extendDeadline);

module.exports = router;
