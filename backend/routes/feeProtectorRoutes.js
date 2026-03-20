const express = require("express");
const feeProtectorController = require("../controllers/feeProtectorController");
const { protect } = require("../controllers/authController");
const { premiumFeatureGuard } = require("../middleware/premiumFeatureGuard");

const router = express.Router();

router.use(protect);

router.post(
  "/:entityType/:entityId/upload",
  premiumFeatureGuard("feeProtector"),
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
  feeProtectorController.confirmPayment
);

router.patch(
  "/:entityType/:entityId/revoke-payment",
  premiumFeatureGuard("feeProtector"),
  feeProtectorController.revokePaymentConfirmation
);

router.get(
  "/:entityType/:entityId/access-log",
  premiumFeatureGuard("feeProtector"),
  feeProtectorController.getAccessLog
);

module.exports = router;
