const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

// Create a new payment
router.post("/", paymentController.createPayment);
router.get("/", paymentController.getAllPayments);
router.get("/paymentEachClient", paymentController.paymentEachClient);
router.get("/totalBalance", paymentController.getTotalBalance);

// Get all payments for a specific client and case
// Route to get total payments for a specific month and year
router.get(
  "/totalPayments/:year/:month",
  paymentController.totalPaymentsByMonthAndYear
);

// Route to get total payments for an entire year
router.get("/totalPayments/:year", paymentController.totalPaymentsByYear);
router.get(
  "/client/:clientId/case/:caseId",
  paymentController.getPaymentsByClientAndCase
);

router.get(
  "/totalPaymentSum/client/:clientId/case/:caseId",
  paymentController.totalPaymentOnCase
);
router.get(
  "/totalPaymentSum/client/:clientId",
  paymentController.totalPaymentClient
);

// get payment received in each month of a year
router.get(
  "/totalPaymentsByMonthInYear/:year",
  paymentController.totalPaymentsByMonthInYear
);
// Get a specific payment by ID
router.get("/:paymentId", paymentController.getPayment);
// Update a payment by ID
router.put("/:paymentId", paymentController.updatePayment);
// Delete a payment by ID
router.delete("/:paymentId", paymentController.deletePayment);

module.exports = router;
