const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/platformAdminController");
const platformAdminGuard = require("../middleware/platformAdminGuard");

// ==============================
// PUBLIC ROUTES (no guard)
// ==============================
router.post("/upgrade/accept/:token", ctrl.acceptUpgradeInvitation);

// ==============================
// PROTECTED ROUTES (guard applied to everything below)
// ==============================
router.use(platformAdminGuard);

// Stats and pending (specific routes before param routes)
router.get("/firms/stats", ctrl.getPlatformStats);
router.get("/firms/pending", ctrl.getPendingFirms);

// Firm CRUD
router.get("/firms", ctrl.getAllFirms);
router.post("/firms", ctrl.createFirm);
router.get("/firms/:firmId", ctrl.getFirmById);

// Firm status management
router.patch("/firms/:firmId/approve", ctrl.approveFirm);
router.patch("/firms/:firmId/reject", ctrl.rejectFirm);
router.patch("/firms/:firmId/suspend", ctrl.suspendFirm);
router.patch("/firms/:firmId/reactivate", ctrl.reactivateFirm);
router.patch("/firms/:firmId/confirm-payment", ctrl.confirmPayment);

// Upgrade invitations
router.post("/firms/:firmId/upgrade-invite", ctrl.sendUpgradeInvitation);
router.delete("/invites/:inviteId/cancel", ctrl.cancelUpgradeInvitation);

module.exports = router;
