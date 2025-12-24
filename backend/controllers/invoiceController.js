const Invoice = require("../models/invoiceModel");
const Case = require("../models/caseModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generatePdf } = require("../utils/generatePdf");
const Payment = require("../models/paymentModel");

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

  // Role-based filtering: clients can only see their own invoices
  if (req.user.role === "client") {
    filter.client = req.user.id;
  } else if (client) {
    // Admins can filter by specific client
    filter.client = client;
  }

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

  // Authorization check: clients can only view their own invoices
  if (
    req.user.role === "client" &&
    invoice.client._id.toString() !== req.user.id
  ) {
    return next(
      new AppError("You are not authorized to view this invoice", 403)
    );
  }

  // Get payment history
  const payments = await Payment.find({ invoice: invoice._id }).sort({
    paymentDate: -1,
  });

  res.status(200).json({
    fromCache: false,
    status: "success",
    data: {
      ...invoice.toObject(),
      payments,
    },
  });
});

exports.createInvoice = catchAsync(async (req, res, next) => {
  const { case: caseId, client: clientId, ...invoiceData } = req.body;

  console.log("Received data:", { caseId, clientId, invoiceData });

  // Validate case and client relationships if provided
  if (caseId) {
    const caseData = await Case.findById(caseId).populate("client");
    if (!caseData) {
      return next(new AppError("No case found with that ID", 404));
    }

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
    }
  }

  // Validate client exists if explicitly provided
  if (clientId) {
    const clientData = await User.findById(clientId);
    if (!clientData) {
      return next(new AppError("No client found with that ID", 404));
    }
    invoiceData.client = clientId;
  }

  // Check if client is actually set
  if (!invoiceData.client) {
    return next(new AppError("Client is required for invoice creation", 400));
  }

  const newInvoice = await Invoice.create({
    ...invoiceData,
    case: caseId,
    client: invoiceData.client,
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
  const paymentCount = await Payment.countDocuments({ invoice: invoice._id });

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

  // Authorization check: clients can only download their own invoices
  if (
    req.user.role === "client" &&
    invoice.client._id.toString() !== req.user.id
  ) {
    return next(
      new AppError("You are not authorized to download this invoice", 403)
    );
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
  let matchStage = {};

  // Role-based filtering: clients can only see their own totals
  if (req.user.role === "client") {
    const mongoose = require("mongoose");
    matchStage.client = new mongoose.Types.ObjectId(req.user.id);
  }

  const pipeline = [];

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push({
    $group: {
      _id: null,
      totalAmountDue: { $sum: "$balance" },
      totalInvoiceAmount: { $sum: "$total" },
      totalPaid: { $sum: "$amountPaid" },
      invoiceCount: { $sum: 1 },
    },
  });

  const result = await Invoice.aggregate(pipeline);

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

  let filter = { status };

  // Role-based filtering: clients can only see their own invoices
  if (req.user.role === "client") {
    filter.client = req.user.id;
  }

  const invoices = await Invoice.find(filter)
    .populate("client", "firstName lastName email")
    .populate("case", "firstParty secondParty suitNo")
    .sort({ dueDate: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(filter);

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

  let filter = {
    status: "overdue",
    balance: { $gt: 0 },
  };

  // Role-based filtering: clients can only see their own overdue invoices
  if (req.user.role === "client") {
    filter.client = req.user.id;
  }

  const overdueInvoices = await Invoice.find(filter)
    .populate("client", "firstName lastName email phone")
    .populate("case", "firstParty secondParty suitNo")
    .sort({ dueDate: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(filter);

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
