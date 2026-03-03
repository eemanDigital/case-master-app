const express = require("express");
const {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getOverdueInvoices,
  generateInvoicePdf,
  generateReceiptPdf,
  generateBillOfChargesPdf,
  getTotalAmountDueOnInvoice,
  sendInvoice,
  voidInvoice,
  checkOverdueInvoices,
} = require("../controllers/invoiceController");
const { protect, restrictTo } = require("../controllers/authController");
const { auditMiddleware } = require("../middleware/auditMiddleware");

const router = express.Router();

router.use(protect);

// Auto-filter for clients - they can only see their own invoices
router.use((req, res, next) => {
  if (req.user.role === "client" && req.user.id) {
    req.query.clientId = req.user.id;
  }
  next();
});

router.use(auditMiddleware);

router
  .route("/")
  .get(getAllInvoices)
  .post(restrictTo("super-admin", "admin"), createInvoice);

router.get("/total-amount-due-on-invoice", getTotalAmountDueOnInvoice);
router.get("/overdue", getOverdueInvoices);

router
  .route("/:id")
  .get(getInvoice)
  .patch(restrictTo("super-admin", "admin"), updateInvoice)
  .delete(restrictTo("super-admin", "admin"), deleteInvoice);

router.patch("/:id/send", restrictTo("super-admin", "admin"), sendInvoice);
router.patch("/:id/void", restrictTo("super-admin", "admin"), voidInvoice);
router.get(
  "/overdue-check",
  restrictTo("super-admin", "admin"),
  checkOverdueInvoices
);

// PDF generation routes
router.get("/pdf/:id", generateInvoicePdf);
router.get("/bill-of-charges/:id", generateBillOfChargesPdf);

module.exports = router;
