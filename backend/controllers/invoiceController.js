const Invoice = require("../models/invoiceModel");
const Case = require("../models/caseModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generatePdf } = require("../utils/generatePdf");
const Payment = require("../models/paymentModel");

// Get all invoices with advanced pagination and filtering
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
  // AND clients cannot see draft invoices
  if (req.user.role === "client") {
    filter.client = req.user.id;
    // Exclude draft invoices for clients
    filter.status = { $ne: "draft" };
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

  // Status filter - but override for clients if they try to filter for drafts
  if (status) {
    // If client is trying to see drafts, prevent it
    if (req.user.role === "client" && status === "draft") {
      return next(new AppError("Clients cannot view draft invoices", 403));
    }
    filter.status = status;
  } else if (req.user.role === "client") {
    // For clients without status filter, ensure we exclude drafts
    if (!filter.status) {
      filter.status = { $ne: "draft" };
    }
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
  if (req.user.role === "client") {
    // Check if client owns this invoice
    if (invoice.client._id.toString() !== req.user.id) {
      return next(
        new AppError("You are not authorized to view this invoice", 403)
      );
    }

    // Additional check: clients cannot view draft invoices
    if (invoice.status === "draft") {
      return next(new AppError("You cannot view draft invoices", 403));
    }
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
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
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

    invoice.case = caseId;
  }

  // Validate client exists if changing
  if (clientId) {
    const clientData = await User.findById(clientId);
    if (!clientData) {
      return next(new AppError("No client found with that ID", 404));
    }
    invoice.client = clientId;
  }

  // Update other fields manually
  const fieldsToUpdate = [
    "title",
    "description",
    "billingPeriodStart",
    "billingPeriodEnd",
    "services",
    "expenses",
    "dueDate",
    "discount",
    "discountType",
    "discountReason",
    "taxRate",
    "paymentTerms",
    "notes",
    "internalNotes",
    "matterReference",
    "timekeeper",
    "previousBalance",
    "billingAttorney",
  ];

  fieldsToUpdate.forEach((field) => {
    if (updateData[field] !== undefined) {
      invoice[field] = updateData[field];
    }
  });

  // Handle services updates - ensure they have proper structure
  if (updateData.services) {
    invoice.services = updateData.services.map((service) => ({
      description: service.description || "",
      billingMethod: service.billingMethod || "hourly",
      hours: service.hours || 0,
      rate: service.rate || 0,
      fixedAmount: service.fixedAmount || 0,
      quantity: service.quantity || 1,
      unitPrice: service.unitPrice || 0,
      date: service.date || new Date(),
      category: service.category || "other",
      // amount will be calculated by pre-save middleware
    }));
  }

  // Handle expenses updates
  if (updateData.expenses) {
    invoice.expenses = updateData.expenses.map((expense) => ({
      description: expense.description || "",
      amount: expense.amount || 0,
      date: expense.date || new Date(),
      category: expense.category || "other",
      receiptNumber: expense.receiptNumber || "",
      isReimbursable:
        expense.isReimbursable !== undefined ? expense.isReimbursable : true,
    }));
  }

  // IMPORTANT: If status is being updated to 'sent' and invoice is draft, set issueDate
  if (updateData.status === "sent" && invoice.status === "draft") {
    invoice.issueDate = new Date();
  }

  // Validate that we can't change status from paid/cancelled/void without special handling
  if (updateData.status) {
    const prohibitedTransitions = {
      paid: ["draft", "sent", "overdue"],
      cancelled: ["draft", "sent", "overdue", "partially_paid", "paid"],
      void: ["draft", "sent", "overdue", "partially_paid", "paid"],
    };

    if (prohibitedTransitions[invoice.status]?.includes(updateData.status)) {
      return next(
        new AppError(
          `Cannot change status from ${invoice.status} to ${updateData.status}`,
          400
        )
      );
    }

    invoice.status = updateData.status;
  }

  // SAVE the invoice to trigger pre-save middleware
  await invoice.save();

  // Populate the saved invoice
  const updatedInvoice = await Invoice.findById(invoice._id)
    .populate("client", "firstName lastName email phone address")
    .populate("case", "firstParty secondParty suitNo caseStatus")
    .populate("timekeeper", "firstName lastName email")
    .populate("billingAttorney", "firstName lastName email");

  res.status(200).json({
    message: "success",
    data: updatedInvoice,
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

  // ... (Authorization checks remain the same)

  const payments = await Payment.find({ invoice: invoice._id }).sort({
    paymentDate: -1,
  });

  // CALCULATE CURRENT CHARGES ONLY (Excluding previous balance)
  const currentServices = invoice.services.reduce(
    (sum, s) => sum + (s.amount || 0),
    0
  );
  const currentExpenses = invoice.expenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );
  const currentSubtotal = currentServices + currentExpenses;

  // Calculate discount for CURRENT items
  let currentDiscount = 0;
  if (invoice.discountType === "percentage") {
    currentDiscount = currentSubtotal * (invoice.discount / 100);
  } else {
    currentDiscount = Math.min(invoice.discount || 0, currentSubtotal);
  }

  const currentTaxable = currentSubtotal - currentDiscount;
  const currentTax = currentTaxable * (invoice.taxRate / 100);
  const totalForThisInvoice = currentTaxable + currentTax;

  const safeInvoice = {
    ...invoice.toObject(),
    payments,
    // Clarified terminology for the PDF template
    currentCharges: {
      services: currentServices,
      expenses: currentExpenses,
      subtotal: currentSubtotal,
      discount: currentDiscount,
      tax: currentTax,
      total: totalForThisInvoice,
    },
    previousBalance: invoice.previousBalance || 0,
    grandTotalOutstanding: invoice.balance, // This is the final amount due (Total + Previous Balance - Paid)
    amountPaidToDate: invoice.amountPaid || 0,
  };

  generatePdf(
    { invoice: safeInvoice },
    res,
    path.join(__dirname, "../views/invoice.pug"), // Using absolute path
    path.join(__dirname, `../output/${invoice.invoiceNumber}_invoice.pdf`)
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
