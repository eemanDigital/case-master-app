const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Create a new payment
router.post("/", paymentController.createPayment);

// Get all payments for a specific client and case
router.get(
  "/client/:clientId/case/:caseId",
  paymentController.getPaymentsByClientAndCase
);

// Get a specific payment by ID
router.get("/:paymentId", paymentController.getPayment);

router.get("/", paymentController.getAllPayments);
// Update a payment by ID
router.put("/:paymentId", paymentController.updatePayment);

// Delete a payment by ID
router.delete("/:paymentId", paymentController.deletePayment);

module.exports = router;
