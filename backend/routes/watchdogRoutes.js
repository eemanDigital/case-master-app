const express = require("express");
const watchdogController = require("../controllers/watchdogController");
const { protect, restrictTo } = require("../controllers/authController");
const { premiumFeatureGuard } = require("../middleware/premiumFeatureGuard");

const router = express.Router();

router.use(protect);
router.use(premiumFeatureGuard("watchdog"));

router.get("/report", restrictTo("super-admin", "admin", "lawyer"), watchdogController.getWatchdogReport);
router.get("/stats", restrictTo("super-admin", "admin", "lawyer"), watchdogController.getWatchdogStats);
router.get("/entities", watchdogController.getAllMonitoredEntities);
router.get("/dashboard", restrictTo("super-admin", "admin", "lawyer"), watchdogController.getWatchdogStats);
router.get("/monitored", watchdogController.getAllMonitoredEntities);
router.get("/alerts", restrictTo("super-admin", "admin", "lawyer"), watchdogController.getWatchdogReport);
router.post("/check-all", restrictTo("super-admin", "admin", "lawyer"), watchdogController.triggerManualCheckAll);
router.post("/monitored", restrictTo("super-admin", "admin", "lawyer"), watchdogController.createMonitoredEntity);

router.post("/check/:id", restrictTo("super-admin", "admin", "lawyer"), watchdogController.manualStatusCheck);
router.patch("/:id/acknowledge", restrictTo("super-admin", "admin", "lawyer"), watchdogController.acknowledgeStatusChange);
router.delete("/monitored/:id", restrictTo("super-admin", "admin", "lawyer"), watchdogController.deleteMonitoredEntity);

module.exports = router;
