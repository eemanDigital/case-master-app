const express = require("express");
const complianceController = require("../controllers/complianceController");
const { protect, restrictTo } = require("../controllers/authController");
const { premiumFeatureGuard } = require("../middleware/premiumFeatureGuard");

const router = express.Router();

router.use(protect);
router.use(premiumFeatureGuard("complianceTracker"));

router.get("/stats", restrictTo("super-admin", "admin", "lawyer"), complianceController.getComplianceStats);
router.get("/revenue-opportunities", restrictTo("super-admin", "admin", "lawyer"), complianceController.getRevenueOpportunities);

router.route("/")
  .get(complianceController.getAllTrackedEntities)
  .post(restrictTo("super-admin", "admin", "lawyer"), complianceController.createTrackedEntity);

router.route("/from-cac-matter")
  .post(restrictTo("super-admin", "admin", "lawyer"), complianceController.createFromCacMatter);

router.route("/:id")
  .get(complianceController.getTrackedEntity)
  .patch(restrictTo("super-admin", "admin", "lawyer"), complianceController.updateTrackedEntity)
  .delete(restrictTo("super-admin", "admin"), complianceController.deleteTrackedEntity);

router.get("/:id/penalty", complianceController.getLivePenaltyCalculation);
router.patch("/:id/annual-returns/:year/filed", restrictTo("super-admin", "admin", "lawyer"), complianceController.markAnnualReturnFiled);
router.post("/:id/send-reminder", restrictTo("super-admin", "admin", "lawyer"), complianceController.sendComplianceReminder);

module.exports = router;
