const express = require("express");
const {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  uploadUserSignature,
} = require("../controllers/invoiceController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);
// Routes for invoices
router.route("/").get(getAllInvoices).post(uploadUserSignature, createInvoice);

router.route("/:id").get(getInvoice).patch(updateInvoice).delete(deleteInvoice);

module.exports = router;
