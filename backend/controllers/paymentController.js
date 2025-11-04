const Payment = require("../models/paymentModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");
// const setRedisCache = require("../utils/setRedisCache");
// const Case = require("../models/caseModel");

// exports.createPayment = catchAsync(async (req, res, next) => {
//   const {
//     invoice: invoiceFromBody,
//     invoiceId,
//     amount,
//     method,
//     reference,
//     notes,
//     client: clientFromBody,
//     clientId,
//     case: caseFromBody,
//     caseId,
//   } = req.body;

//   // Use whichever format was provided
//   const invoice_id = invoiceFromBody || invoiceId;
//   const client_id = clientFromBody || clientId;
//   const case_id = caseFromBody || caseId;

//   // Validate required fields
//   if (!invoice_id || !amount || !method) {
//     const missing = [];
//     if (!invoice_id) missing.push("invoice (or invoiceId)");
//     if (!amount) missing.push("amount");
//     if (!method) missing.push("method");

//     return next(
//       new AppError(`Missing required fields: ${missing.join(", ")}`, 400)
//     );
//   }

//   // Find invoice with case and client populated
//   const invoice = await Invoice.findById(invoice_id)
//     .populate("case")
//     .populate("client");

//   if (!invoice) {
//     return next(new AppError("No invoice found with that ID", 404));
//   }

//   // Check invoice status
//   if (invoice.status === "cancelled" || invoice.status === "void") {
//     return next(new AppError("Cannot make payment to cancelled invoice", 400));
//   }

//   // Validate relationships if IDs are provided
//   if (case_id && invoice.case && invoice.case._id.toString() !== case_id) {
//     return next(new AppError("Case does not match the invoice case", 400));
//   }

//   if (
//     client_id &&
//     invoice.client &&
//     invoice.client._id.toString() !== client_id
//   ) {
//     return next(new AppError("Client does not match the invoice client", 400));
//   }

//   // Validate amount
//   if (amount <= 0) {
//     return next(new AppError("Payment amount must be greater than zero", 400));
//   }

//   // Check for overpayment
//   const remainingBalance = invoice.balance;
//   if (amount > remainingBalance) {
//     return next(
//       new AppError(
//         `Payment amount (${amount}) exceeds remaining balance (${remainingBalance})`,
//         400
//       )
//     );
//   }

//   // ✅ NO TRANSACTION - Just regular save operations
//   try {
//     // Create payment record
//     const payment = new Payment({
//       invoice: invoice_id,
//       client: invoice.client._id,
//       case: invoice.case ? invoice.case._id : undefined,
//       amount,
//       method,
//       reference: reference || "",
//       notes: notes || "",
//       paymentDate: new Date(),
//       status: "completed",
//     });

//     await payment.save();

//     // ✅ UPDATE INVOICE AMOUNTS AND STATUS CORRECTLY
//     invoice.amountPaid = (invoice.amountPaid || 0) + amount;

//     // ✅ RECALCULATE BALANCE (CRITICAL FIX)
//     invoice.balance = invoice.total - invoice.amountPaid;

//     // ✅ UPDATE INVOICE STATUS BASED ON NEW BALANCE AND DATES
//     const today = new Date();
//     const dueDate = new Date(invoice.dueDate);

//     if (invoice.balance <= 0) {
//       invoice.status = "paid";
//     } else if (invoice.balance < invoice.total) {
//       invoice.status = "partially_paid";
//     } else if (dueDate < today) {
//       invoice.status = "overdue";
//     } else if (invoice.status === "draft") {
//       invoice.status = "sent";
//     }
//     // If none of the above, keep current status

//     // ✅ UPDATE CALCULATED FIELDS
//     invoice.paymentProgress = (invoice.amountPaid / invoice.total) * 100;
//     invoice.isOverdue = invoice.status === "overdue";
//     invoice.daysOverdue = invoice.isOverdue
//       ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
//       : 0;

//     await invoice.save();

//     // Populate the response
//     await payment.populate(
//       "invoice",
//       "invoiceNumber title total balance status amountPaid paymentProgress isOverdue daysOverdue"
//     );
//     await payment.populate("client", "firstName lastName email");
//     if (payment.case) {
//       await payment.populate("case", "firstParty secondParty suitNo");
//     }

//     res.status(201).json({
//       message: "Payment created successfully",
//       data: {
//         payment,
//         updatedInvoice: {
//           id: invoice._id,
//           invoiceNumber: invoice.invoiceNumber,
//           total: invoice.total,
//           amountPaid: invoice.amountPaid,
//           balance: invoice.balance,
//           status: invoice.status,
//           paymentProgress: invoice.paymentProgress,
//           isOverdue: invoice.isOverdue,
//           daysOverdue: invoice.daysOverdue,
//         },
//       },
//     });
//   } catch (error) {
//     // If payment was created but invoice update failed, you'd need manual cleanup
//     // For production with replica set, use transactions instead
//     throw error;
//   }
// });

exports.createPayment = catchAsync(async (req, res, next) => {
  const {
    invoice: invoiceFromBody,
    invoiceId,
    amount,
    method,
    reference,
    notes,
    client: clientFromBody,
    clientId,
    case: caseFromBody,
    caseId,
  } = req.body;

  // Use whichever format was provided
  const invoice_id = invoiceFromBody || invoiceId;
  const client_id = clientFromBody || clientId;
  const case_id = caseFromBody || caseId;

  // Validate required fields
  if (!invoice_id || !amount || !method) {
    const missing = [];
    if (!invoice_id) missing.push("invoice (or invoiceId)");
    if (!amount) missing.push("amount");
    if (!method) missing.push("method");

    return next(
      new AppError(`Missing required fields: ${missing.join(", ")}`, 400)
    );
  }

  // Find invoice with case and client populated
  const invoice = await Invoice.findById(invoice_id)
    .populate("case")
    .populate("client");

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  // Check invoice status
  if (invoice.status === "cancelled" || invoice.status === "void") {
    return next(new AppError("Cannot make payment to cancelled invoice", 400));
  }

  // Validate relationships if IDs are provided
  if (case_id && invoice.case && invoice.case._id.toString() !== case_id) {
    return next(new AppError("Case does not match the invoice case", 400));
  }

  if (
    client_id &&
    invoice.client &&
    invoice.client._id.toString() !== client_id
  ) {
    return next(new AppError("Client does not match the invoice client", 400));
  }

  // Validate amount
  if (amount <= 0) {
    return next(new AppError("Payment amount must be greater than zero", 400));
  }

  // Check for overpayment
  const remainingBalance = invoice.balance;
  if (amount > remainingBalance) {
    return next(
      new AppError(
        `Payment amount (${amount}) exceeds remaining balance (${remainingBalance})`,
        400
      )
    );
  }

  try {
    // ✅ CREATE PAYMENT FIRST
    const payment = new Payment({
      invoice: invoice_id,
      client: invoice.client._id,
      case: invoice.case ? invoice.case._id : undefined,
      amount,
      method,
      reference: reference || "",
      notes: notes || "",
      paymentDate: new Date(),
      status: "completed",
    });

    await payment.save();

    // ✅ UPDATE INVOICE USING findByIdAndUpdate TO ENSURE IT SAVES
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoice_id,
      {
        $inc: { amountPaid: amount }, // Atomic increment
        $set: {
          balance: invoice.total - (invoice.amountPaid + amount),
          // Status will be updated in pre-save middleware or here
        },
      },
      { new: true, runValidators: true } // Return updated document
    );

    // ✅ MANUALLY RECALCULATE STATUS FOR UPDATED INVOICE
    const today = new Date();
    const dueDate = new Date(updatedInvoice.dueDate);
    const newBalance = updatedInvoice.total - updatedInvoice.amountPaid;

    let newStatus = updatedInvoice.status;
    if (newBalance <= 0) {
      newStatus = "paid";
    } else if (newBalance < updatedInvoice.total) {
      newStatus = "partially_paid";
    } else if (dueDate < today) {
      newStatus = "overdue";
    } else if (updatedInvoice.status === "draft") {
      newStatus = "sent";
    }

    // ✅ FINAL UPDATE WITH STATUS AND CALCULATED FIELDS
    const finalInvoice = await Invoice.findByIdAndUpdate(
      invoice_id,
      {
        $set: {
          status: newStatus,
          balance: newBalance,
          paymentProgress:
            (updatedInvoice.amountPaid / updatedInvoice.total) * 100,
          isOverdue: newStatus === "overdue",
          daysOverdue:
            newStatus === "overdue"
              ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
              : 0,
        },
      },
      { new: true }
    );

    // ✅ POPULATE PAYMENT WITH FRESH DATA
    await payment.populate(
      "invoice",
      "invoiceNumber title total balance status amountPaid paymentProgress isOverdue daysOverdue"
    );
    await payment.populate("client", "firstName lastName email");
    if (payment.case) {
      await payment.populate("case", "firstParty secondParty suitNo");
    }

    res.status(201).json({
      message: "Payment created successfully",
      data: {
        payment,
        updatedInvoice: {
          id: finalInvoice._id,
          invoiceNumber: finalInvoice.invoiceNumber,
          total: finalInvoice.total,
          amountPaid: finalInvoice.amountPaid,
          balance: finalInvoice.balance,
          status: finalInvoice.status,
          paymentProgress: finalInvoice.paymentProgress,
          isOverdue: finalInvoice.isOverdue,
          daysOverdue: finalInvoice.daysOverdue,
        },
      },
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return next(new AppError("Failed to create payment", 500));
  }
});
// Get all payments with filtering and pagination
exports.getAllPayments = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    clientId,
    caseId,
    invoiceId,
    startDate,
    endDate,
    method,
    sort = "-paymentDate",
  } = req.query;

  let filter = {};

  // Build filter
  if (clientId) filter.client = clientId;
  if (caseId) filter.case = caseId;
  if (invoiceId) filter.invoice = invoiceId;
  if (method) filter.method = method;

  // Date range filter
  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) filter.paymentDate.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const payments = await Payment.find(filter)
    .populate("invoice", "invoiceNumber title total status")
    .populate("client", "firstName lastName email")
    .populate("case", "firstParty secondParty suitNo")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(filter);

  // set redis cache
  // setRedisCache("payments", payments, 1200);

  res.status(200).json({
    message: "success",
    results: payments.length,
    data: payments,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
});

// Get a specific payment
exports.getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId)
    .populate("invoice", "invoiceNumber title total status dueDate")
    .populate("client", "firstName lastName email phone")
    .populate("case", "firstParty secondParty suitNo caseStatus");

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: payment,
  });
});

// Update a payment
exports.updatePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  // If amount is being updated, we need to adjust the invoice
  if (req.body.amount && req.body.amount !== payment.amount) {
    const invoice = await Invoice.findById(payment.invoice);
    if (!invoice) {
      return next(new AppError("Associated invoice not found", 404));
    }

    // Calculate the difference
    const amountDifference = req.body.amount - payment.amount;

    // Validate new amount doesn't exceed invoice total
    if (invoice.amountPaid + amountDifference > invoice.total) {
      return next(
        new AppError("Payment amount would exceed invoice total", 400)
      );
    }

    // Update invoice amount
    invoice.amountPaid += amountDifference;
    await invoice.save();
  }

  // Update payment
  const updatedPayment = await Payment.findByIdAndUpdate(
    req.params.paymentId,
    req.body,
    { new: true, runValidators: true }
  )
    .populate("invoice", "invoiceNumber title total")
    .populate("client", "firstName lastName")
    .populate("case", "firstParty secondParty suitNo");

  res.status(200).json({
    message: "success",
    data: updatedPayment,
  });
});

// Delete a payment
exports.deletePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  // Adjust the invoice amount
  const invoice = await Invoice.findById(payment.invoice);
  if (invoice) {
    invoice.amountPaid -= payment.amount;
    await invoice.save();
  }

  await Payment.findByIdAndDelete(req.params.paymentId);

  res.status(200).json({
    message: "Payment deleted successfully",
    data: null,
  });
});

// Get total payment based on case and client
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
        client: new mongoose.Types.ObjectId(clientId),
        case: new mongoose.Types.ObjectId(caseId),
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
  ]);

  const result =
    totalPaymentSum.length > 0
      ? totalPaymentSum[0]
      : { totalAmount: 0, paymentCount: 0 };

  // set redis cache
  // setRedisCache(`paymentOnCase:${clientId}${caseId}`, result, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// Get all payment made by a client
exports.totalPaymentClient = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return res.status(400).json({ message: "Invalid client ID" });
  }

  const totalPaymentSum = await Payment.aggregate([
    {
      $match: {
        client: new mongoose.Types.ObjectId(clientId),
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
  ]);

  const result =
    totalPaymentSum.length > 0
      ? totalPaymentSum[0]
      : { totalAmount: 0, paymentCount: 0 };

  // setRedisCache(`paymentByClient:${clientId}`, result, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// Get all payments made by each client
exports.paymentEachClient = catchAsync(async (req, res, next) => {
  const totalPaymentSumByClient = await Payment.aggregate([
    {
      $group: {
        _id: "$client",
        totalAmount: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
        lastPayment: { $max: "$paymentDate" },
      },
    },
    {
      $lookup: {
        from: "users",
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
        paymentCount: 1,
        lastPayment: 1,
        "client._id": 1,
        "client.firstName": 1,
        "client.lastName": 1,
        "client.email": 1,
      },
    },
    {
      $sort: { totalAmount: -1 },
    },
  ]);

  // set redis cache
  // setRedisCache("paymentByEachClient", totalPaymentSumByClient, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: totalPaymentSumByClient,
  });
});

// Get payments by month year
exports.totalPaymentsByMonthAndYear = catchAsync(async (req, res, next) => {
  const { year, month } = req.params;

  // Ensure month is in the correct format (two digits)
  const formattedMonth = month.padStart(2, "0");

  const startDate = new Date(`${year}-${formattedMonth}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const totalPayments = await Payment.aggregate([
    {
      $match: {
        paymentDate: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
    {
      $addFields: {
        month: parseInt(month, 10),
        year: parseInt(year, 10),
      },
    },
  ]);

  const result =
    totalPayments.length > 0
      ? totalPayments[0]
      : {
          totalAmount: 0,
          paymentCount: 0,
          month: parseInt(month, 10),
          year: parseInt(year, 10),
        };

  // setRedisCache(`paymentMonthAndYear:${year}${month}`, result, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// Total payment each month in a year
exports.totalPaymentsByMonthInYear = catchAsync(async (req, res, next) => {
  const { year } = req.params;

  const totalPayments = await Payment.aggregate([
    {
      $match: {
        paymentDate: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$paymentDate" } },
        totalAmount: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.month": 1 },
    },
    {
      $project: {
        _id: 0,
        month: "$_id.month",
        totalAmount: 1,
        paymentCount: 1,
      },
    },
  ]);

  // set redis cache
  // setRedisCache(`paymentMonthInYear:${year}`, totalPayments, 1200);

  res.status(200).json({
    message: "success",
    data: totalPayments,
  });
});

// Payment made within a year
exports.totalPaymentsByYear = catchAsync(async (req, res, next) => {
  const { year } = req.params;

  const totalPayments = await Payment.aggregate([
    {
      $match: {
        paymentDate: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
    {
      $addFields: {
        year: parseInt(year, 10),
      },
    },
  ]);

  const result =
    totalPayments.length > 0
      ? totalPayments[0]
      : {
          totalAmount: 0,
          paymentCount: 0,
          year: parseInt(year, 10),
        };

  // set redis cache
  // setRedisCache(`paymentByYear:${year}`, result, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// Get total outstanding balance across all invoices

exports.getTotalBalance = catchAsync(async (req, res, next) => {
  const results = await Invoice.aggregate([
    {
      $match: {
        // ✅ Only include non-cancelled invoices
        status: {
          $nin: ["draft", "cancelled", "void"],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: "$balance" },
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: "$total" },
        totalPaid: { $sum: "$amountPaid" },
        // Additional useful metrics:
        overdueBalance: {
          $sum: {
            $cond: [{ $eq: ["$status", "overdue"] }, "$balance", 0],
          },
        },
        overdueCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "overdue"] }, 1, 0],
          },
        },
        paidInvoices: {
          $sum: {
            $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
          },
        },
        partiallyPaidInvoices: {
          $sum: {
            $cond: [{ $eq: ["$status", "partially_paid"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const summary =
    results.length > 0
      ? results[0]
      : {
          totalBalance: 0,
          totalInvoices: 0,
          totalAmount: 0,
          totalPaid: 0,
          overdueBalance: 0,
          overdueCount: 0,
          paidInvoices: 0,
          partiallyPaidInvoices: 0,
        };

  res.status(200).json({
    message: "success",
    data: summary, // ✅ Return as object, not array
  });
});

// Get payment by client in respect of a case
exports.getPaymentsByClientAndCase = catchAsync(async (req, res, next) => {
  const { clientId, caseId } = req.params;

  const payments = await Payment.find({
    client: clientId,
    case: caseId,
  })
    .populate("invoice", "invoiceNumber title total status")
    .populate("client", "firstName lastName email")
    .populate("case", "firstParty secondParty suitNo")
    .sort({ paymentDate: -1 });

  if (!payments || payments.length === 0) {
    return next(
      new AppError("No payments found for this client and case", 404)
    );
  }

  const totalPayment = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // set redis cache
  // setRedisCache(`paymentByClientAndCase:${clientId}${caseId}`, payments, 1200);

  res.status(200).json({
    message: "success",
    result: payments.length,
    totalPayment: totalPayment,
    data: payments,
  });
});

// Get payment statistics dashboard
exports.getPaymentStatistics = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [
    totalPayments,
    monthlyPayments,
    yearlyPayments,
    paymentsByMethod,
    recentPayments,
  ] = await Promise.all([
    // Total payments
    Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    // This month payments
    Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    // This year payments
    Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    // Payments by method
    Payment.aggregate([
      {
        $group: {
          _id: "$method",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    // Recent payments
    Payment.find()
      .populate("invoice", "invoiceNumber title")
      .populate("client", "firstName lastName")
      .sort({ paymentDate: -1 })
      .limit(10),
  ]);

  const statistics = {
    total: totalPayments[0] || { totalAmount: 0, count: 0 },
    monthly: monthlyPayments[0] || { totalAmount: 0, count: 0 },
    yearly: yearlyPayments[0] || { totalAmount: 0, count: 0 },
    byMethod: paymentsByMethod,
    recent: recentPayments,
  };

  res.status(200).json({
    message: "success",
    data: statistics,
  });
});

// In your paymentController.js
exports.getPaymentSummary = catchAsync(async (req, res, next) => {
  const { year = new Date().getFullYear() } = req.query;

  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${parseInt(year) + 1}-01-01`);

  const results = await Payment.aggregate([
    {
      $match: {
        paymentDate: {
          $gte: startDate,
          $lt: endDate,
        },
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
        year: { $first: year },
      },
    },
  ]);

  const summary =
    results.length > 0
      ? results[0]
      : {
          totalAmount: 0,
          paymentCount: 0,
          year: parseInt(year),
        };

  res.status(200).json({
    message: "success",
    data: summary,
  });
});
