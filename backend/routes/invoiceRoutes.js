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
const { protect, restrictTo } = require("../controllers/authController");
const cacheMiddleware = require("../utils/cacheMiddleware");

const router = express.Router();

router.use(protect); //allow access to logged in user
router.use(restrictTo("super-admin", "admin")); //restrict to admin & super-admin

// Routes for invoices
router
  .route("/")
  .get(
    // cacheMiddleware(() => "invoices"),
    getAllInvoices
  )
  .post(createInvoice);
router.get("/total-amount-due-on-invoice", getTotalAmountDueOnInvoice);

router
  .route("/:id")
  .get(
    // cacheMiddleware((req) => `invoice:${req.params.id}`),
    getInvoice
  )
  .patch(updateInvoice)
  .delete(deleteInvoice);

router.get("/pdf/:id", generateInvoicePdf);

module.exports = router;
