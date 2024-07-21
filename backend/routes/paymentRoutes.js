const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../controllers/authController");
const cacheMiddleware = require("../utils/cacheMiddleware");

const router = express.Router();

router.use(protect);

// Create a new payment
router.post(
  "/",
  cacheMiddleware(() => "payments"),
  paymentController.createPayment
);
router.get("/", paymentController.getAllPayments);
router.get(
  "/paymentEachClient",
  cacheMiddleware(() => "paymentByEachClient"),
  paymentController.paymentEachClient
);
router.get(
  "/totalBalance",
  cacheMiddleware(() => "totalBalance"),
  paymentController.getTotalBalance
);

// Get all payments for a specific client and case
// Route to get total payments for a specific month and year
router.get(
  "/totalPayments/:year/:month",
  cacheMiddleware(() => "paymentMonthAndYear"),

  paymentController.totalPaymentsByMonthAndYear
);

// Route to get total payments for an entire year
router.get(
  "/totalPayments/:year",
  cacheMiddleware(() => "paymentByYear"),
  paymentController.totalPaymentsByYear
);
router.get(
  "/client/:clientId/case/:caseId",
  cacheMiddleware(() => "paymentByClientAndCase"),
  paymentController.getPaymentsByClientAndCase
);

router.get(
  "/totalPaymentSum/client/:clientId/case/:caseId",
  cacheMiddleware(() => "paymentOnCase"),
  paymentController.totalPaymentOnCase
);
router.get(
  "/totalPaymentSum/client/:clientId",
  cacheMiddleware(() => "paymentByClient"),
  paymentController.totalPaymentClient
);

// get payment received in each month of a year
router.get(
  "/totalPaymentsByMonthInYear/:year",
  cacheMiddleware(() => "paymentMonthInYear"),
  paymentController.totalPaymentsByMonthInYear
);
// Get a specific payment by ID
router.get("/:paymentId", paymentController.getPayment);
// Update a payment by ID
router.put("/:paymentId", paymentController.updatePayment);
// Delete a payment by ID
router.delete("/:paymentId", paymentController.deletePayment);

module.exports = router;
