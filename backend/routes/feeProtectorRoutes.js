const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/feeProtectorController");
const { protect, restrictTo } = require("../controllers/authController");

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — no authentication required
// These are the links you share with clients.
// Payment enforcement is handled inside the controller, not via auth middleware.
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/fee-protector/:id/preview-info  → document metadata for the preview page
router.get("/:id/preview-info", ctrl.getPublicDocumentInfo);

// GET /api/v1/fee-protector/:id/preview  → serves watermarked file (always)
router.get("/:id/preview", ctrl.previewProtectedDocument);

// GET /api/v1/fee-protector/:id/download  → serves clean file (403 if unpaid)
router.get("/:id/download", ctrl.downloadProtectedDocument);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES — firm staff only
// protect middleware sets req.user, req.firmId, and req.firm automatically
// ─────────────────────────────────────────────────────────────────────────────

router.use(protect);

// Stats
router.get("/stats", ctrl.getFeeProtectorStats);

// List all + Create
router
  .route("/")
  .get(ctrl.getAllFeeProtectors)
  .post(ctrl.uploadMiddleware, ctrl.createFeeProtector);

// Single document CRUD
router
  .route("/:id")
  .get(ctrl.getFeeProtector)
  .patch(ctrl.updateFeeProtector)
  .delete(ctrl.deleteFeeProtector);

// Payment actions — lawyer/admin only
router.post(
  "/:id/confirm-payment",
  restrictTo("lawyer", "admin", "super-admin"),
  ctrl.confirmPayment,
);

router.post(
  "/:id/revoke-payment",
  restrictTo("lawyer", "admin", "super-admin"),
  ctrl.revokePayment,
);

// Admin download — bypasses payment gate
router.get(
  "/:id/admin-download",
  restrictTo("lawyer", "admin", "super-admin"),
  ctrl.adminDownloadDocument,
);

module.exports = router;
