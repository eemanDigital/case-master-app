const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect, restrictTo } = require("../controllers/authController");
// const cacheMiddleware = require("../utils/cacheMiddleware");

const router = express.Router();

router.use(protect);
router.use(restrictTo("super-admin", "admin"));

// Create a new payment
router.post(
  "/",
  // cacheMiddleware(() => "payments"),
  paymentController.createPayment
);
router.get("/", paymentController.getAllPayments);
router.get(
  "/paymentEachClient",
  // cacheMiddleware(() => "paymentByEachClient"),
  paymentController.paymentEachClient
);
router.get(
  "/totalBalance",
  // cacheMiddleware(() => "totalBalance"),
  paymentController.getTotalBalance
);

// Get all payments for a specific client and case
// Route to get total payments for a specific month and year
router.get(
  "/totalPayments/:year/:month",
  // cacheMiddleware(
  // (req) => `paymentMonthAndYear:${req.params.year}${req.params.month}`
  // ),

  paymentController.totalPaymentsByMonthAndYear
);

// Route to get total payments for an entire year
router.get(
  "/totalPayments/:year",
  // cacheMiddleware((req) => `paymentByYear:${req.params.year}`),
  paymentController.totalPaymentsByYear
);
router.get(
  "/client/:clientId/case/:caseId",
  // cacheMiddleware(
  //   (req) => `paymentByClientAndCase:${req.params.clientId}${req.params.caseId}`
  // ),
  paymentController.getPaymentsByClientAndCase
);

router.get(
  "/totalPaymentSum/client/:clientId/case/:caseId",
  // cacheMiddleware(
  //   (req) => `paymentOnCase:${req.params.clientId}${req.params.caseId}`
  // ),
  paymentController.totalPaymentOnCase
);
router.get(
  "/totalPaymentSum/client/:clientId",
  // cacheMiddleware((req) => `paymentByClient:${req.params.clientId}`),
  paymentController.totalPaymentClient
);

// get payment received in each month of a year
router.get(
  "/totalPaymentsByMonthInYear/:year",
  // cacheMiddleware((req) => `paymentMonthInYear:${req.params.year}`),
  paymentController.totalPaymentsByMonthInYear
);
// Get a specific payment by ID
router.get("/:paymentId", paymentController.getPayment);
// Update a payment by ID
router.put("/:paymentId", paymentController.updatePayment);
// Delete a payment by ID
router.delete("/:paymentId", paymentController.deletePayment);

module.exports = router;
