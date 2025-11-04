const Invoice = require("../models/invoiceModel");
const Case = require("../models/caseModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generatePdf } = require("../utils/generatePdf");
const Payment = require("../models/paymentModel");
// const setRedisCache = require("../utils/setRedisCache");

// Get all invoices with advanced pagination and filtering
exports.getAllInvoices = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    client,
    case: caseId,
    sort = "-createdAt",
  } = req.query;

  let filter = {};

  // Search filter
  if (search) {
    filter.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Client filter
  if (client) {
    filter.client = client;
  }

  // Case filter
  if (caseId) {
    filter.case = caseId;
  }

  const skip = (page - 1) * limit;

  const invoices = await Invoice.find(filter)
    .populate("client", "firstName lastName email phone")
    .populate("case", "firstParty secondParty suitNo")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(filter);

  // set redis cache
  // setRedisCache("invoices", invoices, 5000);

  res.status(200).json({
    message: "success",
    fromCache: false,
    results: invoices.length,
    data: invoices,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
});

exports.getInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("client", "firstName lastName email phone address")
    .populate("case", "firstParty secondParty suitNo caseStatus");

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  // Get payment history
  const Payment = require("../models/paymentModel");
  const payments = await Payment.find({ invoice: invoice._id }).sort({
    paymentDate: -1,
  });

  // set redis cache
  // setRedisCache(`invoice:${req.params.id}`, invoice, 5000);

  res.status(200).json({
    fromCache: false,
    status: "success",
    data: {
      ...invoice.toObject(),
      payments,
    },
  });
});

// Create invoice with validation
// exports.createInvoice = catchAsync(async (req, res, next) => {
//   const { case: caseId, client: clientId, ...invoiceData } = req.body;

//   // Validate case and client relationships if provided
//   if (caseId) {
//     const caseData = await Case.findById(caseId).populate("client");
//     if (!caseData) {
//       return next(new AppError("No case found with that ID", 404));
//     }

//     // If client is also provided, validate consistency
//     if (
//       clientId &&
//       caseData.client &&
//       caseData.client._id.toString() !== clientId
//     ) {
//       return next(
//         new AppError(
//           "Client in the case does not match the provided client ID",
//           400
//         )
//       );
//     }

//     // If no client provided, use case's client
//     if (!clientId && caseData.client) {
//       invoiceData.client = caseData.client._id;
//     }
//   }

//   // Validate client exists
//   if (invoiceData.client) {
//     const clientData = await User.findById(invoiceData.client);
//     if (!clientData) {
//       return next(new AppError("No client found with that ID", 404));
//     }
//   }

//   const newInvoice = await Invoice.create({
//     ...invoiceData,
//     case: caseId,
//     client: invoiceData.client,
//   });

//   res.status(201).json({
//     message: "success",
//     data: newInvoice,
//   });
// });

exports.createInvoice = catchAsync(async (req, res, next) => {
  const { case: caseId, client: clientId, ...invoiceData } = req.body;

  console.log("Received data:", { caseId, clientId, invoiceData }); // DEBUG

  // Validate case and client relationships if provided
  if (caseId) {
    const caseData = await Case.findById(caseId).populate("client");
    if (!caseData) {
      return next(new AppError("No case found with that ID", 404));
    }

    // console.log("Case data client:", caseData.client); // DEBUG

    // If client is also provided, validate consistency
    if (
      clientId &&
      caseData.client &&
      caseData.client._id.toString() !== clientId
    ) {
      return next(
        new AppError(
          "Client in the case does not match the provided client ID",
          400
        )
      );
    }

    // If no client provided, use case's client
    if (!clientId && caseData.client) {
      invoiceData.client = caseData.client._id;
      // console.log("Setting client from case:", invoiceData.client); // DEBUG
    }
  }

  // Validate client exists if explicitly provided
  if (clientId) {
    const clientData = await User.findById(clientId);
    if (!clientData) {
      return next(new AppError("No client found with that ID", 404));
    }
    invoiceData.client = clientId;
    // console.log("Setting client from explicit ID:", invoiceData.client); // DEBUG
  }

  // console.log("Final invoiceData before creation:", invoiceData); // DEBUG

  // Check if client is actually set
  if (!invoiceData.client) {
    return next(new AppError("Client is required for invoice creation", 400));
  }

  const newInvoice = await Invoice.create({
    ...invoiceData,
    case: caseId,
    client: invoiceData.client, // Ensure this is set
  });

  res.status(201).json({
    message: "success",
    data: newInvoice,
  });
});

// Update invoice data
exports.updateInvoice = catchAsync(async (req, res, next) => {
  const { case: caseId, client: clientId, ...updateData } = req.body;

  // Find existing invoice
  const existingInvoice = await Invoice.findById(req.params.id);
  if (!existingInvoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  // Validate case and client relationships if changing
  if (caseId) {
    const caseData = await Case.findById(caseId).populate("client");
    if (!caseData) {
      return next(new AppError("No case found with that ID", 404));
    }

    // Validate client consistency
    if (
      clientId &&
      caseData.client &&
      caseData.client._id.toString() !== clientId
    ) {
      return next(
        new AppError(
          "Client in the case does not match the provided client ID",
          400
        )
      );
    }
  }

  // Validate client exists if changing
  if (clientId) {
    const clientData = await User.findById(clientId);
    if (!clientData) {
      return next(new AppError("No client found with that ID", 404));
    }
  }

  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    {
      ...updateData,
      ...(caseId && { case: caseId }),
      ...(clientId && { client: clientId }),
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("client", "firstName lastName email phone")
    .populate("case", "firstParty secondParty suitNo");

  res.status(200).json({
    message: "success",
    data: invoice,
  });
});

// Delete invoice handler
exports.deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  // Check if invoice has payments
  const Payment = require("../models/paymentModel");
  const paymentCount = await Payment.countDocuments({ invoice: invoice._id });

  // ✅ REPLACE THIS EXISTING CODE:
  if (paymentCount > 0) {
    return next(
      new AppError(
        "Cannot delete invoice with existing payments. Please void the invoice instead.",
        400
      )
    );
  }

  // ✅ WITH THIS ENHANCED VERSION:
  if (paymentCount > 0) {
    return next(
      new AppError(
        `Cannot delete invoice with ${paymentCount} existing payment(s). Please void the invoice instead.`,
        400
      )
    );
  }

  await Invoice.findByIdAndDelete(req.params.id);

  res.status(204).json({
    message: "success",
    data: null,
  });
});

// Generate invoice in PDF format
exports.generateInvoicePdf = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("client", "firstName lastName email phone address")
    .populate("case", "firstParty secondParty suitNo");

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  // Get payment history
  const payments = await Payment.find({ invoice: invoice._id }).sort({
    paymentDate: -1,
  });

  const safeInvoice = {
    ...invoice.toObject(),
    payments,
    invoiceReference: invoice.invoiceNumber || "",
    client: invoice.client || {},
    accountDetails: invoice.accountDetails || {},
    createdAt: invoice.createdAt || "",
    dueDate: invoice.dueDate || "",
    status: invoice.status || "",
    taxType: invoice.taxType || "",
    workTitle: invoice.title || "",
    case: invoice.case || {},
    services: invoice.services || [],
    totalHours: invoice.totalHours || 0,
    totalProfessionalFees: invoice.totalProfessionalFees || 0,
    previousBalance: invoice.previousBalance || 0,
    totalAmountDue: invoice.balance || 0,
    totalInvoiceAmount: invoice.total || 0,
    amountPaid: invoice.amountPaid || 0,
    paymentInstructionTAndC: invoice.paymentTerms || "",
    expenses: invoice.expenses || [],
    totalExpenses: invoice.totalExpenses || 0,
    taxAmount: invoice.taxAmount || 0,
    totalAmountWithTax: invoice.total || 0,
  };

  // Generate PDF handler function
  generatePdf(
    { invoice: safeInvoice },
    res,
    "../views/invoice.pug",
    `../output/${invoice.invoiceNumber || invoice._id}_invoice.pdf`
  );
});

// Get total amount due across all invoices
exports.getTotalAmountDueOnInvoice = catchAsync(async (req, res, next) => {
  const result = await Invoice.aggregate([
    {
      $group: {
        _id: null,
        totalAmountDue: { $sum: "$balance" },
        totalInvoiceAmount: { $sum: "$total" },
        totalPaid: { $sum: "$amountPaid" },
        invoiceCount: { $sum: 1 },
      },
    },
  ]);

  const summary = result[0] || {
    totalAmountDue: 0,
    totalInvoiceAmount: 0,
    totalPaid: 0,
    invoiceCount: 0,
  };

  res.status(200).json({
    message: "success",
    data: summary,
  });
});

// Get invoices by status
exports.getInvoicesByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const invoices = await Invoice.find({ status })
    .populate("client", "firstName lastName email")
    .populate("case", "firstParty secondParty suitNo")
    .sort({ dueDate: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments({ status });

  res.status(200).json({
    message: "success",
    results: invoices.length,
    data: invoices,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
});

// Get overdue invoices
exports.getOverdueInvoices = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const overdueInvoices = await Invoice.find({
    status: "overdue",
    balance: { $gt: 0 },
  })
    .populate("client", "firstName lastName email phone")
    .populate("case", "firstParty secondParty suitNo")
    .sort({ dueDate: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments({
    status: "overdue",
    balance: { $gt: 0 },
  });

  res.status(200).json({
    message: "success",
    results: overdueInvoices.length,
    data: overdueInvoices,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
});

// Add automatic overdue invoice detection
exports.checkOverdueInvoices = catchAsync(async (req, res, next) => {
  const result = await Invoice.updateMany(
    {
      status: { $in: ["sent", "partially_paid"] },
      dueDate: { $lt: new Date() },
      balance: { $gt: 0 },
    },
    { status: "overdue" }
  );

  // Optional: Return info about what was updated
  if (res) {
    // Only if called via HTTP route
    res.status(200).json({
      message: "Overdue invoices checked",
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    });
  }

  return result;
});
// Send/issue invoice
exports.sendInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  if (invoice.status !== "draft") {
    return next(new AppError("Only draft invoices can be sent", 400));
  }

  if (invoice.total <= 0) {
    return next(new AppError("Cannot send invoice with zero amount", 400));
  }

  invoice.status = "sent";
  invoice.issueDate = new Date();
  await invoice.save();

  // Here you would typically send email notification
  // await sendInvoiceEmail(invoice);

  res.status(200).json({
    message: "Invoice sent successfully",
    data: invoice,
  });
});

// Void invoice
exports.voidInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  if (invoice.status === "paid") {
    return next(
      new AppError("Cannot void a paid invoice. Issue a refund instead.", 400)
    );
  }

  invoice.status = "cancelled";
  await invoice.save();

  res.status(200).json({
    message: "Invoice voided successfully",
    data: invoice,
  });
});
