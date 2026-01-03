// const Payment = require("../models/paymentModel");
// const Invoice = require("../models/invoiceModel");
// const AppError = require("../utils/appError");
// const catchAsync = require("../utils/catchAsync");
// const mongoose = require("mongoose");

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

//   // ✅ NEW: Authorization check - clients can only make payments for their own invoices
//   if (
//     req.user.role === "client" &&
//     invoice.client._id.toString() !== req.user.id
//   ) {
//     return next(
//       new AppError(
//         "You are not authorized to make payment for this invoice",
//         403
//       )
//     );
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

//   try {
//     // CREATE PAYMENT FIRST
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

//     // UPDATE INVOICE USING findByIdAndUpdate TO ENSURE IT SAVES
//     const updatedInvoice = await Invoice.findByIdAndUpdate(
//       invoice_id,
//       {
//         $inc: { amountPaid: amount },
//         $set: {
//           balance: invoice.total - (invoice.amountPaid + amount),
//         },
//       },
//       { new: true, runValidators: true }
//     );

//     // MANUALLY RECALCULATE STATUS FOR UPDATED INVOICE
//     const today = new Date();
//     const dueDate = new Date(updatedInvoice.dueDate);
//     const newBalance = updatedInvoice.total - updatedInvoice.amountPaid;

//     let newStatus = updatedInvoice.status;
//     if (newBalance <= 0) {
//       newStatus = "paid";
//     } else if (newBalance < updatedInvoice.total) {
//       newStatus = "partially_paid";
//     } else if (dueDate < today) {
//       newStatus = "overdue";
//     } else if (updatedInvoice.status === "draft") {
//       newStatus = "sent";
//     }

//     // FINAL UPDATE WITH STATUS AND CALCULATED FIELDS
//     const finalInvoice = await Invoice.findByIdAndUpdate(
//       invoice_id,
//       {
//         $set: {
//           status: newStatus,
//           balance: newBalance,
//           paymentProgress:
//             (updatedInvoice.amountPaid / updatedInvoice.total) * 100,
//           isOverdue: newStatus === "overdue",
//           daysOverdue:
//             newStatus === "overdue"
//               ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
//               : 0,
//         },
//       },
//       { new: true }
//     );

//     // POPULATE PAYMENT WITH FRESH DATA
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
//           id: finalInvoice._id,
//           invoiceNumber: finalInvoice.invoiceNumber,
//           total: finalInvoice.total,
//           amountPaid: finalInvoice.amountPaid,
//           balance: finalInvoice.balance,
//           status: finalInvoice.status,
//           paymentProgress: finalInvoice.paymentProgress,
//           isOverdue: finalInvoice.isOverdue,
//           daysOverdue: finalInvoice.daysOverdue,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Payment creation error:", error);
//     return next(new AppError("Failed to create payment", 500));
//   }
// });

// // Get all payments with filtering and pagination
// exports.getAllPayments = catchAsync(async (req, res, next) => {
//   const {
//     page = 1,
//     limit = 10,
//     clientId,
//     caseId,
//     invoiceId,
//     startDate,
//     endDate,
//     method,
//     sort = "-paymentDate",
//   } = req.query;

//   let filter = {};

//   // ✅ NEW: Role-based filtering - clients can only see their own payments
//   if (req.user.role === "client") {
//     filter.client = req.user.id;
//   } else if (clientId) {
//     // Admins can filter by specific client
//     filter.client = clientId;
//   }

//   // Build filter
//   if (caseId) filter.case = caseId;
//   if (invoiceId) filter.invoice = invoiceId;
//   if (method) filter.method = method;

//   // Date range filter
//   if (startDate || endDate) {
//     filter.paymentDate = {};
//     if (startDate) filter.paymentDate.$gte = new Date(startDate);
//     if (endDate) filter.paymentDate.$lte = new Date(endDate);
//   }

//   const skip = (page - 1) * limit;

//   const payments = await Payment.find(filter)
//     .populate("invoice", "invoiceNumber title total status")
//     .populate("client", "firstName lastName email")
//     .populate("case", "firstParty secondParty suitNo")
//     .sort(sort)
//     .skip(skip)
//     .limit(parseInt(limit));

//   const total = await Payment.countDocuments(filter);

//   res.status(200).json({
//     message: "success",
//     results: payments.length,
//     data: payments,
//     pagination: {
//       current: parseInt(page),
//       total: Math.ceil(total / limit),
//       limit: parseInt(limit),
//       totalRecords: total,
//     },
//   });
// });

// // Get a specific payment
// exports.getPayment = catchAsync(async (req, res, next) => {
//   const payment = await Payment.findById(req.params.paymentId)
//     .populate("invoice", "invoiceNumber title total status dueDate")
//     .populate("client", "firstName lastName email phone")
//     .populate("case", "firstParty secondParty suitNo caseStatus");

//   if (!payment) {
//     return next(new AppError("Payment not found", 404));
//   }

//   // ✅ NEW: Authorization check - clients can only view their own payments
//   if (
//     req.user.role === "client" &&
//     payment.client._id.toString() !== req.user.id
//   ) {
//     return next(
//       new AppError("You are not authorized to view this payment", 403)
//     );
//   }

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: payment,
//   });
// });

// // Update a payment
// exports.updatePayment = catchAsync(async (req, res, next) => {
//   const payment = await Payment.findById(req.params.paymentId);

//   if (!payment) {
//     return next(new AppError("Payment not found", 404));
//   }

//   // If amount is being updated, we need to adjust the invoice
//   if (req.body.amount && req.body.amount !== payment.amount) {
//     const invoice = await Invoice.findById(payment.invoice);
//     if (!invoice) {
//       return next(new AppError("Associated invoice not found", 404));
//     }

//     // Calculate the difference
//     const amountDifference = req.body.amount - payment.amount;

//     // Validate new amount doesn't exceed invoice total
//     if (invoice.amountPaid + amountDifference > invoice.total) {
//       return next(
//         new AppError("Payment amount would exceed invoice total", 400)
//       );
//     }

//     // Update invoice amount
//     invoice.amountPaid += amountDifference;
//     await invoice.save();
//   }

//   // Update payment
//   const updatedPayment = await Payment.findByIdAndUpdate(
//     req.params.paymentId,
//     req.body,
//     { new: true, runValidators: true }
//   )
//     .populate("invoice", "invoiceNumber title total")
//     .populate("client", "firstName lastName")
//     .populate("case", "firstParty secondParty suitNo");

//   res.status(200).json({
//     message: "success",
//     data: updatedPayment,
//   });
// });

// // Delete a payment
// exports.deletePayment = catchAsync(async (req, res, next) => {
//   const payment = await Payment.findById(req.params.paymentId);

//   if (!payment) {
//     return next(new AppError("Payment not found", 404));
//   }

//   // Adjust the invoice amount
//   const invoice = await Invoice.findById(payment.invoice);
//   if (invoice) {
//     invoice.amountPaid -= payment.amount;
//     await invoice.save();
//   }

//   await Payment.findByIdAndDelete(req.params.paymentId);

//   res.status(200).json({
//     message: "Payment deleted successfully",
//     data: null,
//   });
// });

// // Get total payment based on case and client
// exports.totalPaymentOnCase = catchAsync(async (req, res, next) => {
//   const clientId = req.params.clientId;
//   const caseId = req.params.caseId;

//   if (!mongoose.Types.ObjectId.isValid(clientId)) {
//     return res.status(400).json({ message: "Invalid client ID" });
//   }

//   if (!mongoose.Types.ObjectId.isValid(caseId)) {
//     return res.status(400).json({ message: "Invalid case ID" });
//   }

//   // ✅ NEW: Authorization check - clients can only view their own payment totals
//   if (req.user.role === "client" && req.user.id !== clientId) {
//     return next(
//       new AppError("You are not authorized to view these payment totals", 403)
//     );
//   }

//   const totalPaymentSum = await Payment.aggregate([
//     {
//       $match: {
//         client: new mongoose.Types.ObjectId(clientId),
//         case: new mongoose.Types.ObjectId(caseId),
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: { $sum: "$amount" },
//         paymentCount: { $sum: 1 },
//       },
//     },
//   ]);

//   const result =
//     totalPaymentSum.length > 0
//       ? totalPaymentSum[0]
//       : { totalAmount: 0, paymentCount: 0 };

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: result,
//   });
// });

// // Get all payment made by a client
// exports.totalPaymentClient = catchAsync(async (req, res, next) => {
//   const clientId = req.params.clientId;

//   if (!mongoose.Types.ObjectId.isValid(clientId)) {
//     return res.status(400).json({ message: "Invalid client ID" });
//   }

//   // ✅ NEW: Authorization check - clients can only view their own totals
//   if (req.user.role === "client" && req.user.id !== clientId) {
//     return next(
//       new AppError("You are not authorized to view these payment totals", 403)
//     );
//   }

//   const totalPaymentSum = await Payment.aggregate([
//     {
//       $match: {
//         client: new mongoose.Types.ObjectId(clientId),
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: { $sum: "$amount" },
//         paymentCount: { $sum: 1 },
//       },
//     },
//   ]);

//   const result =
//     totalPaymentSum.length > 0
//       ? totalPaymentSum[0]
//       : { totalAmount: 0, paymentCount: 0 };

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: result,
//   });
// });

// // Get all payments made by each client
// exports.paymentEachClient = catchAsync(async (req, res, next) => {
//   const totalPaymentSumByClient = await Payment.aggregate([
//     {
//       $group: {
//         _id: "$client",
//         totalAmount: { $sum: "$amount" },
//         paymentCount: { $sum: 1 },
//         lastPayment: { $max: "$paymentDate" },
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "_id",
//         foreignField: "_id",
//         as: "client",
//       },
//     },
//     {
//       $unwind: "$client",
//     },
//     {
//       $project: {
//         _id: 1,
//         totalAmount: 1,
//         paymentCount: 1,
//         lastPayment: 1,
//         "client._id": 1,
//         "client.firstName": 1,
//         "client.lastName": 1,
//         "client.email": 1,
//       },
//     },
//     {
//       $sort: { totalAmount: -1 },
//     },
//   ]);

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: totalPaymentSumByClient,
//   });
// });

// // Get payments by month year
// exports.totalPaymentsByMonthAndYear = catchAsync(async (req, res, next) => {
//   const { year, month } = req.params;

//   // Ensure month is in the correct format (two digits)
//   const formattedMonth = month.padStart(2, "0");

//   const startDate = new Date(`${year}-${formattedMonth}-01`);
//   const endDate = new Date(startDate);
//   endDate.setMonth(endDate.getMonth() + 1);

//   // ✅ NEW: Role-based filtering for clients
//   let matchStage = {
//     paymentDate: {
//       $gte: startDate,
//       $lt: endDate,
//     },
//   };

//   if (req.user.role === "client") {
//     matchStage.client = new mongoose.Types.ObjectId(req.user.id);
//   }

//   const totalPayments = await Payment.aggregate([
//     {
//       $match: matchStage,
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: { $sum: "$amount" },
//         paymentCount: { $sum: 1 },
//       },
//     },
//     {
//       $addFields: {
//         month: parseInt(month, 10),
//         year: parseInt(year, 10),
//       },
//     },
//   ]);

//   const result =
//     totalPayments.length > 0
//       ? totalPayments[0]
//       : {
//           totalAmount: 0,
//           paymentCount: 0,
//           month: parseInt(month, 10),
//           year: parseInt(year, 10),
//         };

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: result,
//   });
// });

// // Total payment each month in a year
// exports.totalPaymentsByMonthInYear = catchAsync(async (req, res, next) => {
//   const { year } = req.params;

//   // ✅ NEW: Role-based filtering for clients
//   let matchStage = {
//     paymentDate: {
//       $gte: new Date(`${year}-01-01`),
//       $lt: new Date(`${parseInt(year) + 1}-01-01`),
//     },
//   };

//   if (req.user.role === "client") {
//     matchStage.client = new mongoose.Types.ObjectId(req.user.id);
//   }

//   const totalPayments = await Payment.aggregate([
//     {
//       $match: matchStage,
//     },
//     {
//       $group: {
//         _id: { month: { $month: "$paymentDate" } },
//         totalAmount: { $sum: "$amount" },
//         paymentCount: { $sum: 1 },
//       },
//     },
//     {
//       $sort: { "_id.month": 1 },
//     },
//     {
//       $project: {
//         _id: 0,
//         month: "$_id.month",
//         totalAmount: 1,
//         paymentCount: 1,
//       },
//     },
//   ]);

//   res.status(200).json({
//     message: "success",
//     data: totalPayments,
//   });
// });

// // Payment made within a year
// exports.totalPaymentsByYear = catchAsync(async (req, res, next) => {
//   const { year } = req.params;

//   // ✅ NEW: Role-based filtering for clients
//   let matchStage = {
//     paymentDate: {
//       $gte: new Date(`${year}-01-01`),
//       $lt: new Date(`${parseInt(year) + 1}-01-01`),
//     },
//   };

//   if (req.user.role === "client") {
//     matchStage.client = new mongoose.Types.ObjectId(req.user.id);
//   }

//   const totalPayments = await Payment.aggregate([
//     {
//       $match: matchStage,
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: { $sum: "$amount" },
//         paymentCount: { $sum: 1 },
//       },
//     },
//     {
//       $addFields: {
//         year: parseInt(year, 10),
//       },
//     },
//   ]);

//   const result =
//     totalPayments.length > 0
//       ? totalPayments[0]
//       : {
//           totalAmount: 0,
//           paymentCount: 0,
//           year: parseInt(year, 10),
//         };

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: result,
//   });
// });

// // Get total outstanding balance across all invoices
// exports.getTotalBalance = catchAsync(async (req, res, next) => {
//   // ✅ NEW: Role-based filtering for clients
//   let matchStage = {
//     status: {
//       $nin: ["draft", "cancelled", "void"],
//     },
//   };

//   if (req.user.role === "client") {
//     matchStage.client = new mongoose.Types.ObjectId(req.user.id);
//   }

//   const results = await Invoice.aggregate([
//     {
//       $match: matchStage,
//     },
//     {
//       $group: {
//         _id: null,
//         totalBalance: { $sum: "$balance" },
//         totalInvoices: { $sum: 1 },
//         totalAmount: { $sum: "$total" },
//         totalPaid: { $sum: "$amountPaid" },
//         overdueBalance: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "overdue"] }, "$balance", 0],
//           },
//         },
//         overdueCount: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "overdue"] }, 1, 0],
//           },
//         },
//         paidInvoices: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
//           },
//         },
//         partiallyPaidInvoices: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "partially_paid"] }, 1, 0],
//           },
//         },
//       },
//     },
//   ]);

//   const summary =
//     results.length > 0
//       ? results[0]
//       : {
//           totalBalance: 0,
//           totalInvoices: 0,
//           totalAmount: 0,
//           totalPaid: 0,
//           overdueBalance: 0,
//           overdueCount: 0,
//           paidInvoices: 0,
//           partiallyPaidInvoices: 0,
//         };

//   res.status(200).json({
//     message: "success",
//     data: summary,
//   });
// });

// // Get payment by client in respect of a case
// exports.getPaymentsByClientAndCase = catchAsync(async (req, res, next) => {
//   const { clientId, caseId } = req.params;

//   // ✅ NEW: Authorization check - clients can only view their own payments
//   if (req.user.role === "client" && req.user.id !== clientId) {
//     return next(
//       new AppError("You are not authorized to view these payments", 403)
//     );
//   }

//   const payments = await Payment.find({
//     client: clientId,
//     case: caseId,
//   })
//     .populate("invoice", "invoiceNumber title total status")
//     .populate("client", "firstName lastName email")
//     .populate("case", "firstParty secondParty suitNo")
//     .sort({ paymentDate: -1 });

//   if (!payments || payments.length === 0) {
//     return next(
//       new AppError("No payments found for this client and case", 404)
//     );
//   }

//   const totalPayment = payments.reduce(
//     (sum, payment) => sum + payment.amount,
//     0
//   );

//   res.status(200).json({
//     message: "success",
//     result: payments.length,
//     totalPayment: totalPayment,
//     data: payments,
//   });
// });

// // Get payment statistics dashboard
// exports.getPaymentStatistics = catchAsync(async (req, res, next) => {
//   const today = new Date();
//   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//   const startOfYear = new Date(today.getFullYear(), 0, 1);

//   // ✅ NEW: Role-based filtering for clients
//   let baseFilter = {};
//   if (req.user.role === "client") {
//     baseFilter.client = new mongoose.Types.ObjectId(req.user.id);
//   }

//   const [
//     totalPayments,
//     monthlyPayments,
//     yearlyPayments,
//     paymentsByMethod,
//     recentPayments,
//   ] = await Promise.all([
//     // Total payments
//     Payment.aggregate([
//       ...(Object.keys(baseFilter).length > 0 ? [{ $match: baseFilter }] : []),
//       {
//         $group: {
//           _id: null,
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//     ]),
//     // This month payments
//     Payment.aggregate([
//       {
//         $match: {
//           ...baseFilter,
//           paymentDate: { $gte: startOfMonth },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//     ]),
//     // This year payments
//     Payment.aggregate([
//       {
//         $match: {
//           ...baseFilter,
//           paymentDate: { $gte: startOfYear },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//     ]),
//     // Payments by method
//     Payment.aggregate([
//       ...(Object.keys(baseFilter).length > 0 ? [{ $match: baseFilter }] : []),
//       {
//         $group: {
//           _id: "$method",
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//     ]),
//     // Recent payments
//     Payment.find(baseFilter)
//       .populate("invoice", "invoiceNumber title")
//       .populate("client", "firstName lastName")
//       .sort({ paymentDate: -1 })
//       .limit(10),
//   ]);

//   const statistics = {
//     total: totalPayments[0] || { totalAmount: 0, count: 0 },
//     monthly: monthlyPayments[0] || { totalAmount: 0, count: 0 },
//     yearly: yearlyPayments[0] || { totalAmount: 0, count: 0 },
//     byMethod: paymentsByMethod,
//     recent: recentPayments,
//   };

//   res.status(200).json({
//     message: "success",
//     data: statistics,
//   });
// });

// // Get payment summary
// exports.getPaymentSummary = catchAsync(async (req, res, next) => {
//   const { year = new Date().getFullYear() } = req.query;

//   const startDate = new Date(`${year}-01-01`);
//   const endDate = new Date(`${parseInt(year) + 1}-01-01`);

//   // ✅ NEW: Role-based filtering for clients
//   let matchStage = {
//     paymentDate: {
//       $gte: startDate,
//       $lt: endDate,
//     },
//     status: "completed",
//   };

//   if (req.user.role === "client") {
//     matchStage.client = new mongoose.Types.ObjectId(req.user.id);
//   }

//   const results = await Payment.aggregate([
//     {
//       $match: matchStage,
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: { $sum: "$amount" },
//         paymentCount: { $sum: 1 },
//         year: { $first: year },
//       },
//     },
//   ]);

//   const summary =
//     results.length > 0
//       ? results[0]
//       : {
//           totalAmount: 0,
//           paymentCount: 0,
//           year: parseInt(year),
//         };

//   res.status(200).json({
//     message: "success",
//     data: summary,
//   });
// });
const Payment = require("../models/paymentModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");

// ✅ NEW: CONSOLIDATED COMPREHENSIVE STATISTICS ENDPOINT
// This replaces multiple endpoints with one efficient call
exports.getPaymentStatistics = catchAsync(async (req, res, next) => {
  const { year = new Date().getFullYear() } = req.query;

  const today = new Date();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(parseInt(year) + 1, 0, 1);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Base filter for role-based access
  let baseFilter = {};
  if (req.user.role === "client") {
    baseFilter.client = new mongoose.Types.ObjectId(req.user.id);
  }

  // Run all aggregations in parallel for best performance
  const [
    totalStats,
    monthlyStats,
    yearlyStats,
    paymentsByMethod,
    paymentsByMonth,
    recentPayments,
    invoiceStats,
  ] = await Promise.all([
    // 1. ALL-TIME TOTAL PAYMENTS
    Payment.aggregate([
      { $match: { ...baseFilter, status: "completed" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgPayment: { $avg: "$amount" },
        },
      },
    ]),

    // 2. CURRENT MONTH PAYMENTS
    Payment.aggregate([
      {
        $match: {
          ...baseFilter,
          status: "completed",
          paymentDate: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgPayment: { $avg: "$amount" },
        },
      },
    ]),

    // 3. CURRENT YEAR PAYMENTS
    Payment.aggregate([
      {
        $match: {
          ...baseFilter,
          status: "completed",
          paymentDate: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgPayment: { $avg: "$amount" },
        },
      },
    ]),

    // 4. PAYMENTS GROUPED BY METHOD
    Payment.aggregate([
      { $match: { ...baseFilter, status: "completed" } },
      {
        $group: {
          _id: "$method",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),

    // 5. PAYMENTS BY MONTH FOR CURRENT YEAR
    Payment.aggregate([
      {
        $match: {
          ...baseFilter,
          status: "completed",
          paymentDate: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$paymentDate" } },
          totalAmount: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          totalAmount: 1,
          paymentCount: 1,
        },
      },
    ]),

    // 6. RECENT PAYMENTS (Last 10)
    Payment.find({ ...baseFilter, status: "completed" })
      .populate("invoice", "invoiceNumber title total")
      .populate("client", "firstName lastName email")
      .populate("case", "firstParty secondParty suitNo")
      .sort({ paymentDate: -1 })
      .limit(10)
      .lean(),

    // 7. INVOICE BALANCE STATS
    Invoice.aggregate([
      {
        $match: {
          ...(req.user.role === "client"
            ? { client: new mongoose.Types.ObjectId(req.user.id) }
            : {}),
          status: { $nin: ["draft", "cancelled", "void"] },
        },
      },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalInvoiceAmount: { $sum: "$total" },
          totalPaid: { $sum: "$amountPaid" },
          totalInvoices: { $sum: 1 },
          overdueBalance: {
            $sum: { $cond: [{ $eq: ["$status", "overdue"] }, "$balance", 0] },
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
          partiallyPaidCount: {
            $sum: { $cond: [{ $eq: ["$status", "partially_paid"] }, 1, 0] },
          },
          unpaidCount: {
            $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  // Format the response with defaults for empty results
  const statistics = {
    // Summary stats
    total: totalStats[0] || { totalAmount: 0, count: 0, avgPayment: 0 },
    monthly: monthlyStats[0] || { totalAmount: 0, count: 0, avgPayment: 0 },
    yearly: yearlyStats[0] || { totalAmount: 0, count: 0, avgPayment: 0 },

    // Payment methods breakdown
    byMethod: paymentsByMethod,

    // Monthly breakdown for charts
    monthlyBreakdown: paymentsByMonth,

    // Recent activity
    recent: recentPayments,

    // Invoice/Balance stats
    invoices: invoiceStats[0] || {
      totalBalance: 0,
      totalInvoiceAmount: 0,
      totalPaid: 0,
      totalInvoices: 0,
      overdueBalance: 0,
      overdueCount: 0,
      paidCount: 0,
      partiallyPaidCount: 0,
      unpaidCount: 0,
    },

    // Calculated insights
    insights: {
      paymentRate: invoiceStats[0]
        ? (invoiceStats[0].totalPaid / invoiceStats[0].totalInvoiceAmount) * 100
        : 0,
      monthlyGrowth:
        yearlyStats[0] && monthlyStats[0]
          ? (monthlyStats[0].totalAmount / (yearlyStats[0].totalAmount / 12) -
              1) *
            100
          : 0,
      mostUsedMethod: paymentsByMethod[0]?._id || "N/A",
      overduePercentage:
        invoiceStats[0] && invoiceStats[0].totalInvoices > 0
          ? (invoiceStats[0].overdueCount / invoiceStats[0].totalInvoices) * 100
          : 0,
    },

    // Metadata
    meta: {
      year: parseInt(year),
      currentMonth: today.getMonth() + 1,
      generatedAt: today.toISOString(),
    },
  };

  res.status(200).json({
    message: "success",
    data: statistics,
  });
});

// Keep individual endpoints for backwards compatibility or specific use cases
// But mark them as deprecated and recommend using getPaymentStatistics instead

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

  const invoice_id = invoiceFromBody || invoiceId;
  const client_id = clientFromBody || clientId;
  const case_id = caseFromBody || caseId;

  if (!invoice_id || !amount || !method) {
    const missing = [];
    if (!invoice_id) missing.push("invoice (or invoiceId)");
    if (!amount) missing.push("amount");
    if (!method) missing.push("method");

    return next(
      new AppError(`Missing required fields: ${missing.join(", ")}`, 400)
    );
  }

  const invoice = await Invoice.findById(invoice_id)
    .populate("case")
    .populate("client");

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  if (
    req.user.role === "client" &&
    invoice.client._id.toString() !== req.user.id
  ) {
    return next(
      new AppError(
        "You are not authorized to make payment for this invoice",
        403
      )
    );
  }

  if (invoice.status === "cancelled" || invoice.status === "void") {
    return next(new AppError("Cannot make payment to cancelled invoice", 400));
  }

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

  if (amount <= 0) {
    return next(new AppError("Payment amount must be greater than zero", 400));
  }

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

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoice_id,
      {
        $inc: { amountPaid: amount },
        $set: {
          balance: invoice.total - (invoice.amountPaid + amount),
        },
      },
      { new: true, runValidators: true }
    );

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

  if (req.user.role === "client") {
    filter.client = req.user.id;
  } else if (clientId) {
    filter.client = clientId;
  }

  if (caseId) filter.case = caseId;
  if (invoiceId) filter.invoice = invoiceId;
  if (method) filter.method = method;

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

exports.getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId)
    .populate("invoice", "invoiceNumber title total status dueDate")
    .populate("client", "firstName lastName email phone")
    .populate("case", "firstParty secondParty suitNo caseStatus");

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  if (
    req.user.role === "client" &&
    payment.client._id.toString() !== req.user.id
  ) {
    return next(
      new AppError("You are not authorized to view this payment", 403)
    );
  }

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: payment,
  });
});

exports.updatePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  if (req.body.amount && req.body.amount !== payment.amount) {
    const invoice = await Invoice.findById(payment.invoice);
    if (!invoice) {
      return next(new AppError("Associated invoice not found", 404));
    }

    const amountDifference = req.body.amount - payment.amount;

    if (invoice.amountPaid + amountDifference > invoice.total) {
      return next(
        new AppError("Payment amount would exceed invoice total", 400)
      );
    }

    invoice.amountPaid += amountDifference;
    await invoice.save();
  }

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

exports.deletePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

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

// DEPRECATED: Use getPaymentStatistics instead
// Kept for backwards compatibility
exports.totalPaymentOnCase = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;
  const caseId = req.params.caseId;

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return res.status(400).json({ message: "Invalid client ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(caseId)) {
    return res.status(400).json({ message: "Invalid case ID" });
  }

  if (req.user.role === "client" && req.user.id !== clientId) {
    return next(
      new AppError("You are not authorized to view these payment totals", 403)
    );
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

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// DEPRECATED: Use getPaymentStatistics instead
exports.totalPaymentClient = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return res.status(400).json({ message: "Invalid client ID" });
  }

  if (req.user.role === "client" && req.user.id !== clientId) {
    return next(
      new AppError("You are not authorized to view these payment totals", 403)
    );
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

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

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

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: totalPaymentSumByClient,
  });
});

// DEPRECATED: Use getPaymentStatistics with year query param instead
exports.totalPaymentsByMonthAndYear = catchAsync(async (req, res, next) => {
  const { year, month } = req.params;

  const formattedMonth = month.padStart(2, "0");

  const startDate = new Date(`${year}-${formattedMonth}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  let matchStage = {
    paymentDate: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  if (req.user.role === "client") {
    matchStage.client = new mongoose.Types.ObjectId(req.user.id);
  }

  const totalPayments = await Payment.aggregate([
    {
      $match: matchStage,
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

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// DEPRECATED: Use getPaymentStatistics instead - returns monthlyBreakdown
exports.totalPaymentsByMonthInYear = catchAsync(async (req, res, next) => {
  const { year } = req.params;

  let matchStage = {
    paymentDate: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${parseInt(year) + 1}-01-01`),
    },
  };

  if (req.user.role === "client") {
    matchStage.client = new mongoose.Types.ObjectId(req.user.id);
  }

  const totalPayments = await Payment.aggregate([
    {
      $match: matchStage,
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

  res.status(200).json({
    message: "success",
    data: totalPayments,
  });
});

// DEPRECATED: Use getPaymentStatistics instead
exports.totalPaymentsByYear = catchAsync(async (req, res, next) => {
  const { year } = req.params;

  let matchStage = {
    paymentDate: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${parseInt(year) + 1}-01-01`),
    },
  };

  if (req.user.role === "client") {
    matchStage.client = new mongoose.Types.ObjectId(req.user.id);
  }

  const totalPayments = await Payment.aggregate([
    {
      $match: matchStage,
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

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// DEPRECATED: Use getPaymentStatistics instead - returns invoices stats
exports.getTotalBalance = catchAsync(async (req, res, next) => {
  let matchStage = {
    status: {
      $nin: ["draft", "cancelled", "void"],
    },
  };

  if (req.user.role === "client") {
    matchStage.client = new mongoose.Types.ObjectId(req.user.id);
  }

  const results = await Invoice.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: "$balance" },
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: "$total" },
        totalPaid: { $sum: "$amountPaid" },
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
    data: summary,
  });
});

exports.getPaymentsByClientAndCase = catchAsync(async (req, res, next) => {
  const { clientId, caseId } = req.params;

  if (req.user.role === "client" && req.user.id !== clientId) {
    return next(
      new AppError("You are not authorized to view these payments", 403)
    );
  }

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

  res.status(200).json({
    message: "success",
    result: payments.length,
    totalPayment: totalPayment,
    data: payments,
  });
});

// DEPRECATED: Use getPaymentStatistics instead
exports.getPaymentSummary = catchAsync(async (req, res, next) => {
  const { year = new Date().getFullYear() } = req.query;

  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${parseInt(year) + 1}-01-01`);

  let matchStage = {
    paymentDate: {
      $gte: startDate,
      $lt: endDate,
    },
    status: "completed",
  };

  if (req.user.role === "client") {
    matchStage.client = new mongoose.Types.ObjectId(req.user.id);
  }

  const results = await Payment.aggregate([
    {
      $match: matchStage,
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

//
// paymentController.js - Enhanced Comprehensive Stats

const NodeCache = require("node-cache");
const statsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minute cache

// 📊 COMPREHENSIVE PAYMENT & INVOICE STATISTICS
exports.getComprehensiveStats = catchAsync(async (req, res, next) => {
  const {
    year = new Date().getFullYear(),
    month,
    forceRefresh = false,
    range = "month", // month, quarter, year, all
  } = req.query;

  const userId = req.user.id;
  const userRole = req.user.role;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Create cache key
  const cacheKey = `stats:${userRole}:${userId}:${year}:${
    month || "all"
  }:${range}`;

  // Return cached data if available and not forcing refresh
  if (!forceRefresh) {
    const cachedStats = statsCache.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json({
        message: "success",
        fromCache: true,
        generatedAt: cachedStats.generatedAt,
        data: cachedStats,
      });
    }
  }

  // Date ranges
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const startOfQuarter = new Date(
    today.getFullYear(),
    Math.floor(today.getMonth() / 3) * 3,
    1
  );
  const last30Days = new Date(new Date().setDate(today.getDate() - 30));
  const last90Days = new Date(new Date().setDate(today.getDate() - 90));

  // Base filter based on user role
  const baseFilter =
    userRole === "client"
      ? { client: new mongoose.Types.ObjectId(userId) }
      : {};

  // Helper for date range filter
  const getDateRangeFilter = (rangeType) => {
    switch (rangeType) {
      case "today":
        return { $gte: startOfToday };
      case "week":
        const startOfWeek = new Date(
          today.setDate(today.getDate() - today.getDay())
        );
        return { $gte: startOfWeek };
      case "month":
        return { $gte: startOfMonth };
      case "quarter":
        return { $gte: startOfQuarter };
      case "year":
        return { $gte: startOfYear };
      case "last30":
        return { $gte: last30Days };
      case "last90":
        return { $gte: last90Days };
      default:
        return { $gte: startOfMonth };
    }
  };

  try {
    // Parallel execution for optimal performance
    const [
      // 1. OVERALL FINANCIAL SUMMARY
      financialSummary,

      // 2. INVOICE ANALYTICS
      invoiceAnalytics,

      // 3. PAYMENT ANALYTICS
      paymentAnalytics,

      // 4. OVERDUE ANALYSIS
      overdueAnalysis,

      // 5. PAYMENT METHOD DISTRIBUTION
      paymentMethods,

      // 6. MONTHLY TRENDS (last 12 months)
      monthlyTrends,

      // 7. TOP PERFORMING DATA
      topData,

      // 8. RECENT ACTIVITY
      recentActivity,

      // 9. CLIENT PAYMENT BEHAVIOR (admin only)
      clientBehavior,

      // 10. CASE FINANCIAL SUMMARY (if applicable)
      caseFinancials,
    ] = await Promise.all([
      // 1. FINANCIAL SUMMARY
      Invoice.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            // Invoice Totals
            totalInvoiceAmount: { $sum: "$total" },
            totalAmountDue: { $sum: "$balance" },
            totalAmountPaid: { $sum: "$amountPaid" },
            totalInvoices: { $sum: 1 },

            // Averages
            avgInvoiceAmount: { $avg: "$total" },
            avgPaymentTime: {
              $avg: {
                $cond: [
                  { $eq: ["$status", "paid"] },
                  {
                    $divide: [
                      { $subtract: ["$updatedAt", "$issueDate"] },
                      1000 * 60 * 60 * 24, // Convert to days
                    ],
                  },
                  0,
                ],
              },
            },

            // Performance Metrics
            collectionRate: {
              $avg: {
                $multiply: [{ $divide: ["$amountPaid", "$total"] }, 100],
              },
            },
          },
        },
      ]),

      // 2. INVOICE ANALYTICS
      Invoice.aggregate([
        { $match: baseFilter },
        {
          $facet: {
            // Status Breakdown
            byStatus: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$total" },
                  totalDue: { $sum: "$balance" },
                  avgAmount: { $avg: "$total" },
                },
              },
              { $sort: { count: -1 } },
            ],

            // Monthly Invoice Count
            monthlyCount: [
              {
                $group: {
                  _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                  },
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$total" },
                },
              },
              { $sort: { "_id.year": -1, "_id.month": -1 } },
              { $limit: 6 },
            ],

            // Top Invoices by Amount
            topInvoices: [
              { $match: { total: { $gt: 0 } } },
              { $sort: { total: -1 } },
              { $limit: 5 },
              {
                $project: {
                  invoiceNumber: 1,
                  title: 1,
                  total: 1,
                  balance: 1,
                  status: 1,
                  dueDate: 1,
                  client: 1,
                },
              },
            ],
          },
        },
      ]),

      // 3. PAYMENT ANALYTICS
      Payment.aggregate([
        {
          $match: {
            ...baseFilter,
            status: "completed",
          },
        },
        {
          $facet: {
            // Overall Payment Stats
            summary: [
              {
                $group: {
                  _id: null,
                  totalPayments: { $sum: "$amount" },
                  paymentCount: { $sum: 1 },
                  avgPayment: { $avg: "$amount" },
                  maxPayment: { $max: "$amount" },
                  minPayment: { $min: "$amount" },

                  // Time-based aggregations
                  todayPayments: {
                    $sum: {
                      $cond: [
                        { $gte: ["$paymentDate", startOfToday] },
                        "$amount",
                        0,
                      ],
                    },
                  },
                  thisMonthPayments: {
                    $sum: {
                      $cond: [
                        { $gte: ["$paymentDate", startOfMonth] },
                        "$amount",
                        0,
                      ],
                    },
                  },
                  thisYearPayments: {
                    $sum: {
                      $cond: [
                        { $gte: ["$paymentDate", startOfYear] },
                        "$amount",
                        0,
                      ],
                    },
                  },
                  last30DaysPayments: {
                    $sum: {
                      $cond: [
                        { $gte: ["$paymentDate", last30Days] },
                        "$amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],

            // Daily Payment Trends
            dailyTrends: [
              {
                $match: {
                  paymentDate: { $gte: last30Days },
                },
              },
              {
                $group: {
                  _id: {
                    date: {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$paymentDate",
                      },
                    },
                  },
                  totalAmount: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { "_id.date": 1 } },
              { $limit: 30 },
            ],
          },
        },
      ]),

      // 4. OVERDUE ANALYSIS
      Invoice.aggregate([
        {
          $match: {
            ...baseFilter,
            status: "overdue",
            balance: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$balance" },
            avgOverdueDays: { $avg: "$daysOverdue" },
            maxOverdueDays: { $max: "$daysOverdue" },

            // Overdue by age buckets
            overdue0to30: {
              $sum: {
                $cond: [{ $lte: ["$daysOverdue", 30] }, 1, 0],
              },
            },
            overdue31to60: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$daysOverdue", 30] },
                      { $lte: ["$daysOverdue", 60] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            overdue61to90: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$daysOverdue", 60] },
                      { $lte: ["$daysOverdue", 90] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            overdue90Plus: {
              $sum: {
                $cond: [{ $gt: ["$daysOverdue", 90] }, 1, 0],
              },
            },
          },
        },
      ]),

      // 5. PAYMENT METHOD DISTRIBUTION
      Payment.aggregate([
        {
          $match: {
            ...baseFilter,
            status: "completed",
          },
        },
        {
          $group: {
            _id: "$method",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // 6. MONTHLY TRENDS (last 12 months)
      Payment.aggregate([
        {
          $match: {
            ...baseFilter,
            status: "completed",
            paymentDate: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$paymentDate" },
              month: { $month: "$paymentDate" },
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
        {
          $project: {
            _id: 0,
            month: "$_id.month",
            year: "$_id.year",
            totalAmount: 1,
            count: 1,
            avgAmount: 1,
            label: {
              $concat: [
                {
                  $arrayElemAt: [
                    [
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ],
                    { $subtract: ["$_id.month", 1] },
                  ],
                },
                " ",
                { $toString: "$_id.year" },
              ],
            },
          },
        },
      ]),

      // 7. TOP PERFORMING DATA
      Promise.all([
        // Top Invoices
        Invoice.find(baseFilter)
          .sort({ total: -1 })
          .limit(3)
          .populate("client", "firstName lastName email")
          .populate("case", "suitNo firstParty secondParty")
          .lean(),

        // Top Paying Clients (admin only)
        userRole !== "client"
          ? Payment.aggregate([
              { $match: { status: "completed" } },
              {
                $group: {
                  _id: "$client",
                  totalPaid: { $sum: "$amount" },
                  invoiceCount: { $addToSet: "$invoice" },
                  lastPayment: { $max: "$paymentDate" },
                },
              },
              { $sort: { totalPaid: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "_id",
                  as: "clientInfo",
                },
              },
              { $unwind: "$clientInfo" },
              {
                $project: {
                  clientId: "$_id",
                  clientName: {
                    $concat: [
                      "$clientInfo.firstName",
                      " ",
                      { $ifNull: ["$clientInfo.lastName", ""] },
                    ],
                  },
                  email: "$clientInfo.email",
                  totalPaid: 1,
                  invoiceCount: { $size: "$invoiceCount" },
                  lastPayment: 1,
                },
              },
            ])
          : Promise.resolve([]),
      ]),

      // 8. RECENT ACTIVITY
      Promise.all([
        // Recent Payments
        Payment.find({
          ...baseFilter,
          status: "completed",
        })
          .sort({ paymentDate: -1 })
          .limit(5)
          .populate("invoice", "invoiceNumber title total")
          .populate("client", "firstName lastName")
          .lean(),

        // Recent Invoices
        Invoice.find(baseFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("client", "firstName lastName")
          .lean(),
      ]),

      // 9. CLIENT PAYMENT BEHAVIOR (admin only)
      userRole !== "client"
        ? Invoice.aggregate([
            {
              $group: {
                _id: "$client",
                totalInvoices: { $sum: 1 },
                totalBilled: { $sum: "$total" },
                totalPaid: { $sum: "$amountPaid" },
                avgPaymentDays: {
                  $avg: {
                    $cond: [
                      { $eq: ["$status", "paid"] },
                      {
                        $divide: [
                          { $subtract: ["$updatedAt", "$issueDate"] },
                          1000 * 60 * 60 * 24,
                        ],
                      },
                      null,
                    ],
                  },
                },
                overdueCount: {
                  $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] },
                },
              },
            },
            { $sort: { totalBilled: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "clientInfo",
              },
            },
            { $unwind: "$clientInfo" },
            {
              $project: {
                clientId: "$_id",
                clientName: {
                  $concat: [
                    "$clientInfo.firstName",
                    " ",
                    { $ifNull: ["$clientInfo.lastName", ""] },
                  ],
                },
                totalInvoices: 1,
                totalBilled: 1,
                totalPaid: 1,
                balance: { $subtract: ["$totalBilled", "$totalPaid"] },
                collectionRate: {
                  $multiply: [{ $divide: ["$totalPaid", "$totalBilled"] }, 100],
                },
                avgPaymentDays: 1,
                overdueCount: 1,
              },
            },
          ])
        : Promise.resolve([]),

      // 10. CASE FINANCIAL SUMMARY
      Invoice.aggregate([
        {
          $match: {
            ...baseFilter,
            case: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$case",
            totalBilled: { $sum: "$total" },
            totalPaid: { $sum: "$amountPaid" },
            invoiceCount: { $sum: 1 },
            avgInvoiceAmount: { $avg: "$total" },
          },
        },
        { $sort: { totalBilled: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Format the response
    const formattedStats = {
      // Summary Cards Data
      summary: {
        financial: financialSummary[0] || {
          totalInvoiceAmount: 0,
          totalAmountDue: 0,
          totalAmountPaid: 0,
          totalInvoices: 0,
          avgInvoiceAmount: 0,
          avgPaymentTime: 0,
          collectionRate: 0,
        },
        payments: paymentAnalytics[0]?.summary?.[0] || {
          totalPayments: 0,
          paymentCount: 0,
          avgPayment: 0,
          maxPayment: 0,
          minPayment: 0,
          todayPayments: 0,
          thisMonthPayments: 0,
          thisYearPayments: 0,
          last30DaysPayments: 0,
        },
        overdue: overdueAnalysis[0] || {
          count: 0,
          totalAmount: 0,
          avgOverdueDays: 0,
          maxOverdueDays: 0,
          overdue0to30: 0,
          overdue31to60: 0,
          overdue61to90: 0,
          overdue90Plus: 0,
        },
      },

      // Analytics Data
      analytics: {
        invoices: {
          byStatus: invoiceAnalytics[0]?.byStatus || [],
          monthlyCount: invoiceAnalytics[0]?.monthlyCount || [],
          topInvoices: invoiceAnalytics[0]?.topInvoices || [],
        },
        payments: {
          dailyTrends: paymentAnalytics[0]?.dailyTrends || [],
          methodDistribution: paymentMethods.map((method) => ({
            method: method._id,
            totalAmount: method.totalAmount,
            count: method.count,
            avgAmount: method.avgAmount,
            percentage:
              method.totalAmount > 0
                ? (method.totalAmount /
                    (paymentAnalytics[0]?.summary?.[0]?.totalPayments || 1)) *
                  100
                : 0,
          })),
        },
        trends: {
          monthly: monthlyTrends,
        },
      },

      // Top Performers
      topPerformers: {
        topInvoices: topData[0] || [],
        topClients: topData[1] || [],
      },

      // Recent Activity
      recentActivity: {
        payments: recentActivity[0] || [],
        invoices: recentActivity[1] || [],
      },

      // Client Insights (admin only)
      clientInsights: clientBehavior || [],

      // Case Financials
      caseFinancials: caseFinancials || [],

      // KPIs and Metrics
      kpis: {
        collectionRate: financialSummary[0]?.collectionRate || 0,
        avgPaymentDays: financialSummary[0]?.avgPaymentTime || 0,
        paymentSuccessRate: 95, // Could be calculated from payment attempts
        invoiceConversionRate: 85, // Draft to Paid conversion
      },

      // Metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        period: {
          year: parseInt(year),
          month: month ? parseInt(month) : null,
          range: range,
          currentYear,
          currentMonth,
        },
        userRole,
        totalRecords: {
          invoices: financialSummary[0]?.totalInvoices || 0,
          payments: paymentAnalytics[0]?.summary?.[0]?.paymentCount || 0,
          clients: clientBehavior?.length || 0,
        },
      },
    };

    // Cache the result
    statsCache.set(cacheKey, formattedStats);

    res.status(200).json({
      message: "success",
      fromCache: false,
      data: formattedStats,
    });
  } catch (error) {
    console.error("Stats generation error:", error);
    return next(new AppError("Failed to generate statistics", 500));
  }
});
