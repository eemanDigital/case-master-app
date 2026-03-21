const express = require("express");
const multer = require("multer");
const feeProtectorController = require("../controllers/feeProtectorController");
const { protect, restrictTo } = require("../controllers/authController");
const { premiumFeatureGuard } = require("../middleware/premiumFeatureGuard");

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(require("path").extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only images and documents are allowed"), false);
};
const uploadForCreate = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }).single("file");

const router = express.Router();

router.use(protect);

router.get("/", restrictTo("super-admin", "admin", "lawyer"), feeProtectorController.getAllFeeProtectors);
router.get("/stats", restrictTo("super-admin", "admin", "lawyer"), feeProtectorController.getFeeProtectorStats);

router.post(
  "/",
  premiumFeatureGuard("feeProtector"),
  restrictTo("super-admin", "admin", "lawyer"),
  uploadForCreate,
  feeProtectorController.createFeeProtector
);

router.route("/:id")
  .get(feeProtectorController.getFeeProtector)
  .patch(premiumFeatureGuard("feeProtector"), restrictTo("super-admin", "admin", "lawyer"), feeProtectorController.updateFeeProtector)
  .delete(premiumFeatureGuard("feeProtector"), restrictTo("super-admin", "admin"), feeProtectorController.deleteFeeProtector);

router.get("/:id/download", feeProtectorController.downloadProtectedDocument);
router.get("/:id/preview", feeProtectorController.previewProtectedDocument);

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
