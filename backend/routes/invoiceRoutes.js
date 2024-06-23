const express = require("express");
const {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  uploadUserSignature,
  generateInvoicePdf,
  getTotalAmountDueOnInvoice,
} = require("../controllers/invoiceController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);
// Routes for invoices
router.route("/").get(getAllInvoices).post(uploadUserSignature, createInvoice);
router.get("/total-amount-due-on-invoice", getTotalAmountDueOnInvoice);

router.route("/:id").get(getInvoice).patch(updateInvoice).delete(deleteInvoice);

router.get("/pdf/:id", generateInvoicePdf);

module.exports = router;
