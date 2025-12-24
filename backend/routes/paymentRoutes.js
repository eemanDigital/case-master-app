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
router.get("/statistics", paymentController.getPaymentSummary);

// Get total balance - clients see only their own balance
router.get("/totalBalance", paymentController.getTotalBalance);

// Get total payments for a specific month and year - clients see only their own
router.get(
  "/totalPayments/:year/:month",
  paymentController.totalPaymentsByMonthAndYear
);

// Get total payments for an entire year - clients see only their own
router.get("/totalPayments/:year", paymentController.totalPaymentsByYear);

// Get payments for specific client and case - clients can only view their own
router.get(
  "/client/:clientId/case/:caseId",
  paymentController.getPaymentsByClientAndCase
);

// Get payment totals for client and case - clients can only view their own
router.get(
  "/totalPaymentSum/client/:clientId/case/:caseId",
  paymentController.totalPaymentOnCase
);

// Get payment totals for a client - clients can only view their own
router.get(
  "/totalPaymentSum/client/:clientId",
  paymentController.totalPaymentClient
);

// Get payment received in each month of a year - clients see only their own
router.get(
  "/totalPaymentsByMonthInYear/:year",
  paymentController.totalPaymentsByMonthInYear
);

// Get a specific payment by ID - clients can only view their own
router.get("/:paymentId", paymentController.getPayment);

// ✅ ADMIN-ONLY ROUTES
// Get all payments made by each client - admin only
router.get(
  "/paymentEachClient",
  restrictTo("super-admin", "admin"),
  paymentController.paymentEachClient
);

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
