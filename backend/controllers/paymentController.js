const Payment = require("../models/paymentModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");

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

  res.status(200).json({
    message: "success",
    result: payments.length,
    data: payments,
  });
});

// Get all payments
exports.getAllPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find();

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});

// Get a specific payment
exports.getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  res.status(200).json({
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

// get total payment base on case and client
exports.totalPaymentOnCase = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;
  const caseId = req.params.caseId;

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return res.status(400).json({ message: "Invalid client ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(caseId)) {
    return res.status(400).json({ message: "Invalid case ID" });
  }

  const totalPaymentSum = await Payment.aggregate([
    {
      $match: {
        clientId: new mongoose.Types.ObjectId(clientId),
        caseId: new mongoose.Types.ObjectId(caseId),
      },
    },

    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPaid" },
      },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: totalPaymentSum.length > 0 ? totalPaymentSum[0].totalAmount : 0,
  });
});

// get all payment made by a client
exports.totalPaymentClient = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return res.status(400).json({ message: "Invalid client ID" });
  }

  const totalPaymentSum = await Payment.aggregate([
    {
      $match: {
        clientId: new mongoose.Types.ObjectId(clientId),
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPaid" },
      },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: totalPaymentSum.length > 0 ? totalPaymentSum[0].totalAmount : 0,
  });
});

// get all payments made by each client
exports.paymentEachClient = catchAsync(async (req, res, next) => {
  const totalPaymentSumByClient = await Payment.aggregate([
    {
      $group: {
        _id: "$clientId",
        totalAmount: { $sum: "$amountPaid" },
      },
    },
    {
      $lookup: {
        from: "clients", // The actual name of the Client collection
        localField: "_id",
        foreignField: "_id",
        as: "client",
      },
    },
    {
      $unwind: "$client",
    },
    {
      $project: {
        _id: 1,
        totalAmount: 1,
        "client._id": 1,
        "client.firstName": 1,
      },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: totalPaymentSumByClient,
  });
});

// get payments by month year and week
exports.totalPaymentByWeekToYear = catchAsync(async (req, res, next) => {
  const now = new Date();
  const oneWeekAgo = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7
  );
  const oneMonthAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate()
  );
  const oneYearAgo = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate()
  );

  // const totalPaymentSum = await Payment.aggregate([
  //   {
  //     $group: {
  //       _id: null,
  //       totalAmount: { $sum: "$amountPaid" },
  //     },
  //   },
  // ]);
  const totalPaymentSumWeek = await Payment.aggregate([
    {
      $match: {
        date: { $gte: oneWeekAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPaid" },
      },
    },
  ]);

  const totalPaymentSumMonth = await Payment.aggregate([
    {
      $match: {
        date: { $gte: oneMonthAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPaid" },
      },
    },
  ]);

  const totalPaymentSumYear = await Payment.aggregate([
    {
      $match: {
        date: { $gte: oneYearAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPaid" },
      },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: {
      week:
        totalPaymentSumWeek.length > 0 ? totalPaymentSumWeek[0].totalAmount : 0,
      month:
        totalPaymentSumMonth.length > 0
          ? totalPaymentSumMonth[0].totalAmount
          : 0,
      year:
        totalPaymentSumYear.length > 0 ? totalPaymentSumYear[0].totalAmount : 0,
      // all: totalPaymentSum.length > 0 ? totalPaymentSum[0].totalAmount : 0,
    },
  });
});

// get total outstanding balance
exports.getTotalBalance = catchAsync(async (req, res, next) => {
  const result = await Payment.aggregate([
    {
      $group: { _id: null, totalBalance: { $sum: "$balance" } },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: result,
  });
});

// exports.getPaymentsByClientAndCase = catchAsync(async (req, res, next) => {
//   const { clientId, caseId } = req.params;

//   const payments = await Payment.aggregate([
//     {
//       $match: {
//         clientId: new mongoose.Types.ObjectId(clientId),
//         caseId: new mongoose.Types.ObjectId(caseId),
//       },
//     },
//     {
//       $lookup: {
//         from: "cases", // replace with your actual Case collection name
//         localField: "caseId",
//         foreignField: "_id",
//         as: "case",
//       },
//     },
//     {
//       $unwind: "$case",
//     },
//     {
//       $lookup: {
//         from: "clients", // replace with your actual Client collection name
//         localField: "clientId",
//         foreignField: "_id",
//         as: "client",
//       },
//     },
//     {
//       $unwind: "$client",
//     },
//     {
//       $sort: { createAt: -1 },
//     },
//   ]);

//   if (!payments || payments.length === 0) {
//     return next(
//       new AppError("No payments found for this client and case", 404)
//     );
//   }

//   res.status(200).json({
//     message: "success",
//     result: payments.length,
//     data: payments,
//   });
// });
