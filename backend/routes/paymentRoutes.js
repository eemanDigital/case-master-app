const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Create a new payment
router.post("/", paymentController.createPayment);

router.get("/paymentEachClient", paymentController.paymentEachClient);

// Get all payments for a specific client and case
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

router.get("/totalPaymentSum", paymentController.totalPayment);
// Get a specific payment by ID
router.get("/:paymentId", paymentController.getPayment);

router.get("/", paymentController.getAllPayments);
// Update a payment by ID
router.put("/:paymentId", paymentController.updatePayment);

// Delete a payment by ID
router.delete("/:paymentId", paymentController.deletePayment);

module.exports = router;
