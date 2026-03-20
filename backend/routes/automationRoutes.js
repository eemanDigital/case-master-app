const express = require("express");
const automationController = require("../controllers/automationController");
const { protect, restrictTo } = require("../controllers/authController");
const { premiumFeatureGuard } = require("../middleware/premiumFeatureGuard");

const router = express.Router();

router.use(protect);

router.get("/templates", automationController.getAutomationTemplates);
router.post("/from-template", premiumFeatureGuard("automationBuilder"), automationController.createFromTemplate);
router.get("/variables", automationController.getAvailableVariables);
router.get("/stats", restrictTo("super-admin", "admin"), automationController.getAutomationStats);

router.route("/")
  .get(automationController.getAllAutomations)
  .post(premiumFeatureGuard("automationBuilder"), automationController.createAutomation);

router.route("/:id")
  .get(automationController.getAutomation)
  .patch(premiumFeatureGuard("automationBuilder"), automationController.updateAutomation)
  .delete(premiumFeatureGuard("automationBuilder"), automationController.deleteAutomation);

router.patch("/:id/toggle", premiumFeatureGuard("automationBuilder"), automationController.toggleAutomation);
router.post("/:id/test", premiumFeatureGuard("automationBuilder"), automationController.testAutomation);
router.post("/:id/run", premiumFeatureGuard("automationBuilder"), automationController.runAutomation);
router.get("/:id/logs", premiumFeatureGuard("automationBuilder"), automationController.getExecutionLog);
router.post("/:id/duplicate", premiumFeatureGuard("automationBuilder"), automationController.duplicateAutomation);

module.exports = router;
