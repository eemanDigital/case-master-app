const express = require("express");
const paymentController = require("../controllers/paymentController");
const invoiceController = require("../controllers/invoiceController");
const { protect, restrictTo } = require("../controllers/authController");
const { auditMiddleware } = require("../middleware/auditMiddleware");

const router = express.Router();

router.use(protect);
router.use(auditMiddleware);

router.post("/", paymentController.createPayment);

router.get("/", paymentController.getAllPayments);

router.get("/stats/", paymentController.getComprehensiveStats);
router.get("/totalBalance", paymentController.getTotalBalance);

router.get("/:paymentId", paymentController.getPayment);

// PDF generation for payment receipt
router.get("/receipt/:paymentId", invoiceController.generateReceiptPdf);

router.put(
  "/:paymentId",
  restrictTo("super-admin", "admin"),
  paymentController.updatePayment
);

router.delete(
  "/:paymentId",
  restrictTo("super-admin", "admin"),
  paymentController.deletePayment
);

module.exports = router;
