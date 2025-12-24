const express = require("express");
const {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getOverdueInvoices,
  generateInvoicePdf,
  getTotalAmountDueOnInvoice,
  sendInvoice,
  voidInvoice,
  checkOverdueInvoices,
} = require("../controllers/invoiceController");
const { protect, restrictTo } = require("../controllers/authController");
// const cacheMiddleware = require("../utils/cacheMiddleware");

const router = express.Router();

// Protect all routes - require authentication
router.use(protect);

// Routes accessible by ALL authenticated users (clients can see their own invoices)
router
  .route("/")
  .get(getAllInvoices) // Controller handles role-based filtering
  .post(restrictTo("super-admin", "admin"), createInvoice);

// These routes are accessible to all authenticated users
// Controller will handle authorization checks
router.get("/total-amount-due-on-invoice", getTotalAmountDueOnInvoice);
router.get("/overdue", getOverdueInvoices);

router
  .route("/:id")
  .get(getInvoice) // Controller checks ownership
  .patch(restrictTo("super-admin", "admin"), updateInvoice)
  .delete(restrictTo("super-admin", "admin"), deleteInvoice);

// Admin-only routes
router.patch("/:id/send", restrictTo("super-admin", "admin"), sendInvoice);
router.patch("/:id/void", restrictTo("super-admin", "admin"), voidInvoice);
router.get(
  "/overdue-check",
  restrictTo("super-admin", "admin"),
  checkOverdueInvoices
);

// PDF generation - accessible to all (controller checks ownership)
router.get("/pdf/:id", generateInvoicePdf);

module.exports = router;
