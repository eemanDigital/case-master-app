const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

// Protect all routes - authentication required
router.use(protect);

// ✅ ROUTES ACCESSIBLE TO CLIENTS (controller handles filtering/authorization)
// Create a new payment - clients can pay their own invoices
router.post("/", paymentController.createPayment);

// Get all payments - clients see only their own
router.get("/", paymentController.getAllPayments);

// Get payment statistics - clients see only their own stats
router.get("/stats/", paymentController.getComprehensiveStats);
// Get total balance - clients see only their own balance
router.get("/totalBalance", paymentController.getTotalBalance);

// Get a specific payment by ID - clients can only view their own
router.get("/:paymentId", paymentController.getPayment);

// Update a payment by ID - admin only
router.put(
  "/:paymentId",
  restrictTo("super-admin", "admin"),
  paymentController.updatePayment
);

// Delete a payment by ID - admin only
router.delete(
  "/:paymentId",
  restrictTo("super-admin", "admin"),
  paymentController.deletePayment
);

module.exports = router;
