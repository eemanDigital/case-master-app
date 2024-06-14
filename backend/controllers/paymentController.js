const Payment = require("../models/paymentModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Create a new payment
// exports.createPayment = catchAsync(async (req, res, next) => {
//   const payment = new Payment(req.body);
//   const savedPayment = await payment.save();

//   res.status(201).json({
//     message: "success",
//     data: savedPayment,
//   });
// });

// exports.createPayment = async (req, res, next) => {
//   const { invoiceId, amountPaid } = req.body;

//   // Find the corresponding invoice
//   const invoice = await Invoice.findById(invoiceId);
//   if (!invoice) {
//     return next(new AppError("No invoice found", 404));
//   }

//   // Calculate the new balance
//   const totalAmountWithTax = invoice.totalAmountWithTax;
//   const newPayment = new Payment({
//     invoiceId: invoiceId,
//     amountPaid,
//     method,
//     date,
//     totalInvoiceAmount: totalAmountWithTax,
//     balance: totalAmountWithTax - amountPaid,
//   });

//   // Save the payment
//   await newPayment.save();

//   // Update the invoice status if fully paid
//   if (newPayment.balance <= 0) {
//     invoice.status = "paid";
//   }

//   await invoice.save();

//   res.status(201).json({
//     status: "success",
//     data: newPayment,
//   });
// };
exports.createPayment = catchAsync(async (req, res, next) => {
  const {
    caseId,
    clientId,
    invoiceId,
    amountPaid,
    method,
    date,
    totalAmountDue,
  } = req.body;

  // Find the corresponding invoice
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return next(new AppError("No invoice found", 404));
  }

  // Calculate the new balance
  const newPayment = new Payment({
    invoiceId: invoiceId,
    caseId,
    clientId,
    amountPaid,
    method,
    date,
    totalAmountDue,
    balance: totalAmountDue - amountPaid,
  });

  // Save the payment
  await newPayment.save();

  // Update the invoice status if fully paid
  if (newPayment.balance <= 0) {
    invoice.status = "paid";
  }

  await invoice.save();

  res.status(201).json({
    status: "success",
    data: newPayment,
  });
});
// Get all payments for a specific client and case
exports.getPaymentsByClientAndCase = catchAsync(async (req, res, next) => {
  const { clientId, caseId } = req.params;
  const payments = await Payment.find({
    clientId: clientId,
    caseId: caseId,
  }).sort({ createAt: -1 });

  if (!payments) {
    return next(
      new AppError("No payments found for this client and case", 404)
    );
  }

  res.status(201).json({
    message: "success",
    result: payments.length,
    data: payments,
  });
});

// Get all payments
exports.getAllPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find();

  res.status(200).json({
    status: 'success',
    results: payments.length,
    data: {
      payments
    }
  });
});

// Get a specific payment
exports.getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  res.status(201).json({
    message: "success",
    data: payment,
  });
});

// Update a payment
exports.updatePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findByIdAndUpdate(
    req.params.paymentId,
    req.body,
    { new: true }
  );

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  res.status(201).json({
    message: "success",
    data: payment,
  });
});

// Delete a payment
exports.deletePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findByIdAndDelete(req.params.paymentId);

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  res.status(200).json({ message: "Payment deleted" });
});
