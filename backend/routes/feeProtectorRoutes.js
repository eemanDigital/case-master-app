const express = require("express");
const feeProtectorController = require("../controllers/feeProtectorController");
const { protect, restrictTo } = require("../controllers/authController");
const { premiumFeatureGuard } = require("../middleware/premiumFeatureGuard");

const router = express.Router();

router.use(protect);

router.get("/", restrictTo("super-admin", "admin", "lawyer"), feeProtectorController.getAllFeeProtectors);
router.get("/stats", restrictTo("super-admin", "admin", "lawyer"), feeProtectorController.getFeeProtectorStats);

router.post(
  "/:entityType/:entityId/upload",
  premiumFeatureGuard("feeProtector"),
  restrictTo("super-admin", "admin", "lawyer"),
  feeProtectorController.uploadMiddleware,
  feeProtectorController.uploadProtectedDocument
);

router.get(
  "/:entityType/:entityId/document",
  feeProtectorController.getProtectedDocument
);

router.get(
  "/:entityType/:entityId/status",
  feeProtectorController.getProtectedDocumentStatus
);

router.patch(
  "/:entityType/:entityId/confirm-payment",
  premiumFeatureGuard("feeProtector"),
  restrictTo("super-admin", "admin", "lawyer"),
  feeProtectorController.confirmPayment
);

router.patch(
  "/:entityType/:entityId/revoke-payment",
  premiumFeatureGuard("feeProtector"),
  restrictTo("super-admin", "admin"),
  feeProtectorController.revokePaymentConfirmation
);

router.get(
  "/:entityType/:entityId/access-log",
  premiumFeatureGuard("feeProtector"),
  restrictTo("super-admin", "admin", "lawyer"),
  feeProtectorController.getAccessLog
);

module.exports = router;
