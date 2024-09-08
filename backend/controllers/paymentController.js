const Payment = require("../models/paymentModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");
// const setRedisCache = require("../utils/setRedisCache");
const Case = require("../models/caseModel");

// Create a new payment
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

  // Validate that all required fields are provided
  if (
    !clientId ||
    !invoiceId ||
    !amountPaid ||
    !method ||
    !date ||
    !totalAmountDue
  ) {
    return next(new AppError("Please fill all fields", 401));
  }

  // Find the corresponding invoice
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return next(new AppError("No invoice found", 404));
  }

  console.log("INV CASEID", invoice.case.id, caseId);

  // Check if the caseId in the invoice matches the provided caseId
  if (invoice.case._id.toString() !== caseId) {
    return next(
      new AppError("Case does not match the case in the invoice", 400)
    );
  }

  // Find the corresponding case
  const caseData = await Case.findById(caseId).populate("client");
  if (!caseData) {
    return next(new AppError("No case found", 404));
  }

  // Check if the case has an associated client
  if (!caseData.client) {
    return next(new AppError("No client associated with this case", 400));
  }

  // Check if the client associated with the case is the same as the clientId provided
  if (caseData.client._id.toString() !== clientId) {
    return next(
      new AppError(
        "Client in the case does not match the provided client name",
        400
      )
    );
  }

  // Validate that amountPaid is less than or equal to totalAmountDue
  if (amountPaid > totalAmountDue) {
    return next(
      new AppError("Amount paid cannot be greater than total amount due", 400)
    );
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
    message: "success",
    data: newPayment,
  });
});

// Get all payments
exports.getAllPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find().sort("-date");

  // set redis cache
  // setRedisCache("payments", payments, 1200);

  res.status(200).json({
    message: "success",
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
    fromCache: false,
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

  // set redis cache
  // setRedisCache(
  //   `paymentOnCase:${req.params.clientId}${req.params.caseId}`,
  //   totalPaymentSum,
  //   1200
  // );

  res.status(200).json({
    message: "success",
    fromCache: false,
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

  // setRedisCache(`paymentByClient:${clientId}`, totalPaymentSum, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
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
        // from: "clients", // The actual name of the Client collection
        from: "users", // The actual name of the Client collection
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

  // set redis cache
  // setRedisCache("paymentByEachClient", totalPaymentSumByClient, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: totalPaymentSumByClient,
  });
});

// get payments by month year and week
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
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPaid" },
      },
    },
    {
      $addFields: {
        month: parseInt(month, 10),
        year: parseInt(year, 10),
      },
    },
  ]);

  // setRedisCache(`paymentMonthAndYear:${year}${month}`, totalPayments, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data:
      totalPayments.length > 0
        ? totalPayments[0]
        : {
            totalAmount: 0,
            month: parseInt(month, 10),
            year: parseInt(year, 10),
          },
  });
});

// total payment each month
exports.totalPaymentsByMonthInYear = catchAsync(async (req, res, next) => {
  const { year } = req.params;

  const totalPayments = await Payment.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$date" } },
        totalAmount: { $sum: "$amountPaid" },
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

// payment made within a month
exports.totalPaymentsByYear = catchAsync(async (req, res, next) => {
  const { year } = req.params;

  const totalPayments = await Payment.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPaid" },
      },
    },
    {
      $addFields: {
        year: parseInt(year, 10),
      },
    },
  ]);

  // set redis cache
  // setRedisCache(`paymentByYear:${year}`, totalPayments, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data:
      totalPayments.length > 0
        ? totalPayments[0]
        : { totalAmount: 0, year: parseInt(year, 10) },
  });
});

// get total outstanding balance
exports.getTotalBalance = catchAsync(async (req, res, next) => {
  const results = await Payment.aggregate([
    {
      // Sort payments by invoiceId and date in descending order
      $sort: { invoiceId: 1, date: -1 },
    },
    {
      // Group by invoiceId and get the latest payment for each invoice
      $group: {
        _id: "$invoiceId",
        latestBalance: { $first: "$balance" },
      },
    },
    {
      // Sum the latest balances
      $group: {
        _id: null,
        totalBalance: { $sum: "$latestBalance" },
      },
    },
  ]);

  // set redis cache
  // setRedisCache("totalBalance", results, 1200);

  res.status(200).json({
    message: "success",
    data: results,
  });
});

//get payment by client in respect of a case
exports.getPaymentsByClientAndCase = catchAsync(async (req, res, next) => {
  const { clientId, caseId } = req.params;

  const payments = await Payment.aggregate([
    {
      $match: {
        clientId: new mongoose.Types.ObjectId(clientId),
        caseId: new mongoose.Types.ObjectId(caseId),
      },
    },
    {
      $lookup: {
        from: "cases", // replace with your actual Case collection name
        localField: "caseId",
        foreignField: "_id",
        as: "case",
      },
    },
    {
      $unwind: "$case",
    },
    {
      $lookup: {
        from: "users", // replace with your actual Client collection name
        localField: "clientId",
        foreignField: "_id",
        as: "client",
      },
    },
    {
      $unwind: "$client",
    },
    {
      $lookup: {
        from: "invoices", // replace with your actual Invoice collection name
        localField: "invoiceId",
        foreignField: "_id",
        as: "invoice",
      },
    },
    {
      $unwind: {
        path: "$invoice",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: null,
        totalPayment: { $sum: "$amountPaid" },
        payments: {
          $push: {
            amountPaid: "$amountPaid",
            date: "$date",
            client: {
              clientId: "$clientId",
              firstName: "$client.firstName",
              secondName: "$client.secondName",
            },
            case: {
              firstParty: "$case.firstParty.name.name",
              secondParty: "$case.secondParty.name.name",
            },
            invoiceId: "$invoiceId",
            invoiceNumber: "$invoice.invoiceNumber",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalPayment: 1,
        payments: 1,
      },
    },
    {
      $sort: { "payments.date": -1 },
    },
  ]);

  if (!payments || payments.length === 0) {
    return next(
      new AppError("No payments found for this client and case", 404)
    );
  }

  // set redis cache
  // setRedisCache(`paymentByClientAndCase:${clientId}${caseId}`, payments, 1200);
  res.status(200).json({
    message: "success",
    result: payments[0].payments.length,
    totalPayment: payments[0].totalPayment,
    data: payments[0].payments,
  });
});
