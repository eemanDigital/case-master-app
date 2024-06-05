const Payment = require("../models/paymentModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Create a new payment
exports.createPayment = catchAsync(async (req, res, next) => {
  const payment = new Payment(req.body);
  const savedPayment = await payment.save();

  res.status(201).json({
    message: "success",
    data: savedPayment,
  });
});

// Get all payments for a specific client and case
exports.getPaymentsByClientAndCase = catchAsync(async (req, res, next) => {
  const { clientId, caseId } = req.params;
  const payments = await Payment.find({
    client: clientId,
    case: caseId,
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

// Get a specific payment
exports.getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId).populate(
    "client case"
  );

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
