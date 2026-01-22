const Payment = require("../models/paymentModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");

// ✅ Multi-tenant helper
const getFirmId = (req) => {
  if (!req.user || !req.firmId) {
    throw new AppError("Firm context not found. Please authenticate.", 401);
  }
  return req.firmId;
};

exports.createPayment = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId

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
      new AppError(`Missing required fields: ${missing.join(", ")}`, 400),
    );
  }

  // ✅ Query invoice with firmId
  const invoice = await Invoice.findOne({
    _id: invoice_id,
    firmId,
    isDeleted: { $ne: true },
  })
    .populate("case")
    .populate("client");

  if (!invoice) {
    return next(
      new AppError("No invoice found with that ID in your firm", 404),
    );
  }

  if (
    req.user.role === "client" &&
    invoice.client._id.toString() !== req.user.id
  ) {
    return next(
      new AppError(
        "You are not authorized to make payment for this invoice",
        403,
      ),
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
        400,
      ),
    );
  }

  try {
    // ✅ Create payment with firmId
    const payment = new Payment({
      firmId, // ✅ Add firmId
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
      { new: true, runValidators: true },
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
      { new: true },
    );

    await payment.populate(
      "invoice",
      "invoiceNumber title total balance status amountPaid paymentProgress isOverdue daysOverdue",
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
  const firmId = getFirmId(req); // ✅ Get firmId

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

  // ✅ Start with firmId filter
  let filter = { firmId };

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
  const firmId = getFirmId(req); // ✅ Get firmId

  const payment = await Payment.findOne({
    _id: req.params.paymentId,
    firmId, // ✅ Filter by firmId
  })
    .populate("invoice", "invoiceNumber title total status dueDate")
    .populate("client", "firstName lastName email phone")
    .populate("case", "firstParty secondParty suitNo caseStatus");

  if (!payment) {
    return next(new AppError("Payment not found in your firm", 404));
  }

  if (
    req.user.role === "client" &&
    payment.client._id.toString() !== req.user.id
  ) {
    return next(
      new AppError("You are not authorized to view this payment", 403),
    );
  }

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: payment,
  });
});

exports.updatePayment = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId

  const payment = await Payment.findOne({
    _id: req.params.paymentId,
    firmId, // ✅ Filter by firmId
  });

  if (!payment) {
    return next(new AppError("Payment not found in your firm", 404));
  }

  if (req.body.amount && req.body.amount !== payment.amount) {
    const invoice = await Invoice.findOne({
      _id: payment.invoice,
      firmId, // ✅ Filter by firmId
    });

    if (!invoice) {
      return next(
        new AppError("Associated invoice not found in your firm", 404),
      );
    }

    const amountDifference = req.body.amount - payment.amount;

    if (invoice.amountPaid + amountDifference > invoice.total) {
      return next(
        new AppError("Payment amount would exceed invoice total", 400),
      );
    }

    invoice.amountPaid += amountDifference;
    await invoice.save();
  }

  const updatedPayment = await Payment.findByIdAndUpdate(
    req.params.paymentId,
    req.body,
    { new: true, runValidators: true },
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
  const firmId = getFirmId(req); // ✅ Get firmId

  const payment = await Payment.findOne({
    _id: req.params.paymentId,
    firmId, // ✅ Filter by firmId
  });

  if (!payment) {
    return next(new AppError("Payment not found in your firm", 404));
  }

  const invoice = await Invoice.findOne({
    _id: payment.invoice,
    firmId, // ✅ Filter by firmId
  });

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

exports.totalPaymentOnCase = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId
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
      new AppError("You are not authorized to view these payment totals", 403),
    );
  }

  const totalPaymentSum = await Payment.aggregate([
    {
      $match: {
        firmId: new mongoose.Types.ObjectId(firmId), // ✅ Filter by firmId
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

exports.totalPaymentClient = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId
  const clientId = req.params.clientId;

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return res.status(400).json({ message: "Invalid client ID" });
  }

  if (req.user.role === "client" && req.user.id !== clientId) {
    return next(
      new AppError("You are not authorized to view these payment totals", 403),
    );
  }

  const totalPaymentSum = await Payment.aggregate([
    {
      $match: {
        firmId: new mongoose.Types.ObjectId(firmId), // ✅ Filter by firmId
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
  const firmId = getFirmId(req); // ✅ Get firmId

  const totalPaymentSumByClient = await Payment.aggregate([
    {
      $match: {
        firmId: new mongoose.Types.ObjectId(firmId), // ✅ Filter by firmId
      },
    },
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

exports.totalPaymentsByMonthAndYear = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId
  const { year, month } = req.params;

  const formattedMonth = month.padStart(2, "0");

  const startDate = new Date(`${year}-${formattedMonth}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  let matchStage = {
    firmId: new mongoose.Types.ObjectId(firmId), // ✅ Filter by firmId
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

exports.totalPaymentsByMonthInYear = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId
  const { year } = req.params;

  let matchStage = {
    firmId: new mongoose.Types.ObjectId(firmId), // ✅ Filter by firmId
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

exports.totalPaymentsByYear = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId
  const { year } = req.params;

  let matchStage = {
    firmId: new mongoose.Types.ObjectId(firmId), // ✅ Filter by firmId
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

exports.getTotalBalance = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId

  let matchStage = {
    firmId: new mongoose.Types.ObjectId(firmId), // ✅ Filter by firmId
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
  const firmId = getFirmId(req); // ✅ Get firmId
  const { clientId, caseId } = req.params;

  if (req.user.role === "client" && req.user.id !== clientId) {
    return next(
      new AppError("You are not authorized to view these payments", 403),
    );
  }

  const payments = await Payment.find({
    firmId, // ✅ Filter by firmId
    client: clientId,
    case: caseId,
  })
    .populate("invoice", "invoiceNumber title total status")
    .populate("client", "firstName lastName email")
    .populate("case", "firstParty secondParty suitNo")
    .sort({ paymentDate: -1 });

  if (!payments || payments.length === 0) {
    return next(
      new AppError("No payments found for this client and case", 404),
    );
  }

  const totalPayment = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  res.status(200).json({
    message: "success",
    result: payments.length,
    totalPayment: totalPayment,
    data: payments,
  });
});

exports.getPaymentSummary = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId
  const { year = new Date().getFullYear() } = req.query;

  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${parseInt(year) + 1}-01-01`);

  let matchStage = {
    firmId: new mongoose.Types.ObjectId(firmId), // ✅ Filter by firmId
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

// ✅ COMPREHENSIVE STATS WITH FIRMID
const NodeCache = require("node-cache");
const statsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

exports.getComprehensiveStats = catchAsync(async (req, res, next) => {
  const firmId = getFirmId(req); // ✅ Get firmId first

  const {
    year = new Date().getFullYear(),
    month,
    forceRefresh = false,
    range = "month",
  } = req.query;

  const userId = req.user.id;
  const userRole = req.user.role;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const cacheKey = `stats:${firmId}:${userRole}:${userId}:${year}:${
    month || "all"
  }:${range}`; // ✅ Include firmId in cache key

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

  let startDate,
    endDate = new Date();
  const now = new Date();

  switch (range) {
    case "today":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      break;
    case "week":
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      startDate = weekStart;
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case "quarter":
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    case "last30":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last90":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 30);
  const last90Days = new Date(now);
  last90Days.setDate(now.getDate() - 90);

  // ✅ Base filter with firmId
  const baseFilter =
    userRole === "client"
      ? {
          firmId: new mongoose.Types.ObjectId(firmId),
          client: new mongoose.Types.ObjectId(userId),
        }
      : { firmId: new mongoose.Types.ObjectId(firmId) };

  const invoiceDateFilter = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const paymentDateFilter = {
    paymentDate: { $gte: startDate, $lte: endDate },
  };

  try {
    const [
      financialSummary,
      invoiceAnalytics,
      paymentAnalytics,
      overdueAnalysis,
      paymentMethods,
      monthlyTrends,
      topData,
      recentActivity,
      clientBehavior,
      caseFinancials,
    ] = await Promise.all([
      // All aggregations now include firmId in baseFilter
      Invoice.aggregate([
        {
          $match: {
            ...baseFilter,
            ...invoiceDateFilter,
            isDeleted: { $ne: true }, // ✅ Exclude deleted
          },
        },
        {
          $group: {
            _id: null,
            totalInvoiceAmount: { $sum: "$total" },
            totalAmountDue: { $sum: "$balance" },
            totalAmountPaid: { $sum: "$amountPaid" },
            totalInvoices: { $sum: 1 },
            avgInvoiceAmount: { $avg: "$total" },
            avgPaymentTime: {
              $avg: {
                $cond: [
                  { $eq: ["$status", "paid"] },
                  {
                    $divide: [
                      { $subtract: ["$updatedAt", "$issueDate"] },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                  0,
                ],
              },
            },
            collectionRate: {
              $avg: {
                $multiply: [{ $divide: ["$amountPaid", "$total"] }, 100],
              },
            },
          },
        },
      ]),

      Invoice.aggregate([
        {
          $match: {
            ...baseFilter,
            ...invoiceDateFilter,
            isDeleted: { $ne: true },
          },
        },
        {
          $facet: {
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

      Payment.aggregate([
        {
          $match: {
            ...baseFilter,
            status: "completed",
            ...paymentDateFilter,
          },
        },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalPayments: { $sum: "$amount" },
                  paymentCount: { $sum: 1 },
                  avgPayment: { $avg: "$amount" },
                  maxPayment: { $max: "$amount" },
                  minPayment: { $min: "$amount" },
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
            dailyTrends: [
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

      Invoice.aggregate([
        {
          $match: {
            ...baseFilter,
            ...invoiceDateFilter,
            status: "overdue",
            balance: { $gt: 0 },
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$balance" },
            avgOverdueDays: { $avg: "$daysOverdue" },
            maxOverdueDays: { $max: "$daysOverdue" },
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

      Payment.aggregate([
        {
          $match: {
            ...baseFilter,
            status: "completed",
            ...paymentDateFilter,
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

      Promise.all([
        Invoice.find({
          ...baseFilter,
          ...invoiceDateFilter,
          isDeleted: { $ne: true },
        })
          .sort({ total: -1 })
          .limit(5)
          .populate("client", "firstName lastName email")
          .populate("case", "suitNo firstParty secondParty")
          .lean(),

        userRole !== "client"
          ? Payment.aggregate([
              {
                $match: {
                  firmId: new mongoose.Types.ObjectId(firmId),
                  status: "completed",
                  ...paymentDateFilter,
                },
              },
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

      Promise.all([
        Payment.find({
          ...baseFilter,
          status: "completed",
          ...paymentDateFilter,
        })
          .sort({ paymentDate: -1 })
          .limit(10)
          .populate("invoice", "invoiceNumber title total")
          .populate("client", "firstName lastName")
          .lean(),

        Invoice.find({
          ...baseFilter,
          ...invoiceDateFilter,
          isDeleted: { $ne: true },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("client", "firstName lastName")
          .lean(),
      ]),

      userRole !== "client"
        ? Invoice.aggregate([
            {
              $match: {
                firmId: new mongoose.Types.ObjectId(firmId),
                ...invoiceDateFilter,
                isDeleted: { $ne: true },
              },
            },
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

      Invoice.aggregate([
        {
          $match: {
            ...baseFilter,
            ...invoiceDateFilter,
            case: { $ne: null },
            isDeleted: { $ne: true },
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

    const formattedStats = {
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
        outstanding: {
          count:
            invoiceAnalytics[0]?.byStatus?.find((s) => s._id === "sent")
              ?.count || 0,
        },
        paid: {
          count:
            invoiceAnalytics[0]?.byStatus?.find((s) => s._id === "paid")
              ?.count || 0,
        },
      },

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

      topPerformers: {
        topInvoices: topData[0] || [],
        topClients: topData[1] || [],
      },

      recentActivity: {
        payments: recentActivity[0] || [],
        invoices: recentActivity[1] || [],
      },

      clientInsights: clientBehavior || [],
      caseFinancials: caseFinancials || [],

      kpis: {
        collectionRate: financialSummary[0]?.collectionRate || 0,
        avgPaymentDays: financialSummary[0]?.avgPaymentTime || 0,
        paymentSuccessRate: 95,
        invoiceConversionRate: 85,
      },

      metadata: {
        generatedAt: new Date().toISOString(),
        period: {
          year: parseInt(year),
          month: month ? parseInt(month) : null,
          range: range,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          currentYear,
          currentMonth,
        },
        userRole,
        firmId: firmId.toString(), // ✅ Include firmId in metadata
        totalRecords: {
          invoices: financialSummary[0]?.totalInvoices || 0,
          payments: paymentAnalytics[0]?.summary?.[0]?.paymentCount || 0,
          clients: clientBehavior?.length || 0,
        },
      },
    };

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
