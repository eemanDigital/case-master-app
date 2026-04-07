// routes/invitationRoutes.js
const express = require("express");
const invitationController = require("../controllers/invitationController");
const { protect, restrictTo } = require("../controllers/authController");
const { auditMiddleware } = require("../middleware/auditMiddleware");

const router = express.Router();

// Public routes (no auth required)
router.get("/validate/:token", invitationController.validateInvitation);
router.post("/accept/:token", invitationController.acceptInvitation);

// Protected routes (auth required)
router.use(protect);
router.use(restrictTo("admin", "super-admin"));
router.use(auditMiddleware);

router.post("/generate", invitationController.generateInvitation);
router.get("/", invitationController.getInvitations);
router.get("/pending", invitationController.getPendingInvitations);
router.get("/:id", invitationController.getInvitation);
router.patch("/:id/cancel", invitationController.cancelInvitation);
router.delete("/:id", invitationController.deleteInvitation);
router.post("/resend/:id", invitationController.resendInvitation);

module.exports = router;
