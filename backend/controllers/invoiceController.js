const Invoice = require("../models/invoiceModel");
const Case = require("../models/caseModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generatePdf } = require("../utils/generatePdf");
const Payment = require("../models/paymentModel");

/**
 * Multi-tenant helper: Get firmId from authenticated user
 * Assumes req.firmId exists after authentication middleware
 */
const getFirmId = (req) => {
  if (!req.user || !req.firmId) {
    throw new AppError("Firm context not found. Please authenticate.", 401);
  }
  return req.firmId;
};

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

  // ✅ Multi-tenant: Start with firmId filter
  const firmId = getFirmId(req);
  let filter = { firmId };

  // Role-based filtering: clients can only see their own invoices
  // AND clients cannot see draft invoices
  if (req.user.role === "client") {
    filter.client = req.user.id;
    // Exclude draft invoices for clients
    filter.status = { $ne: "draft" };
  } else if (client) {
    // Admins can filter by specific client (within their firm)
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

  // ✅ Exclude soft-deleted invoices
  filter.isDeleted = { $ne: true };

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
  // ✅ Multi-tenant: Include firmId in query
  const firmId = getFirmId(req);

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    firmId,
    isDeleted: { $ne: true },
  })
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

  // Get payment history (also filtered by firmId)
  const payments = await Payment.find({
    invoice: invoice._id,
    firmId,
  }).sort({
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

  // ✅ Multi-tenant: Get firmId from authenticated user
  const firmId = getFirmId(req);

  console.log("Received data:", { caseId, clientId, invoiceData });

  // Validate case and client relationships if provided
  if (caseId) {
    // ✅ Multi-tenant: Ensure case belongs to the same firm
    const caseData = await Case.findOne({
      _id: caseId,
      firmId,
    }).populate("client");

    if (!caseData) {
      return next(new AppError("No case found with that ID in your firm", 404));
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
    // ✅ Multi-tenant: Ensure client belongs to the same firm
    const clientData = await User.findOne({
      _id: clientId,
      firmId,
      role: "client",
    });

    if (!clientData) {
      return next(
        new AppError("No client found with that ID in your firm", 404)
      );
    }
    invoiceData.client = clientId;
  }

  // Check if client is actually set
  if (!invoiceData.client) {
    return next(new AppError("Client is required for invoice creation", 400));
  }

  // ✅ Multi-tenant: Create invoice with firmId and createdBy
  const newInvoice = await Invoice.create({
    ...invoiceData,
    firmId,
    case: caseId,
    client: invoiceData.client,
    createdBy: req.user.id,
  });

  res.status(201).json({
    message: "success",
    data: newInvoice,
  });
});

// Update invoice data
exports.updateInvoice = catchAsync(async (req, res, next) => {
  const { case: caseId, client: clientId, ...updateData } = req.body;
  const { id } = req.params;

  // ✅ Multi-tenant: Get firmId
  const firmId = getFirmId(req);

  // Find existing invoice (with firm isolation)
  const invoice = await Invoice.findOne({
    _id: id,
    firmId,
    isDeleted: { $ne: true },
  });

  if (!invoice) {
    return next(
      new AppError("No invoice found with that ID in your firm", 404)
    );
  }

  // Check if invoice is editable (not in certain statuses)
  const nonEditableStatuses = ["paid", "cancelled", "void"];
  if (nonEditableStatuses.includes(invoice.status)) {
    return next(
      new AppError(`Cannot edit invoice with status: ${invoice.status}`, 400)
    );
  }

  // Validate case and client relationships if changing
  if (caseId) {
    // ✅ Multi-tenant: Ensure case belongs to the same firm
    const caseData = await Case.findOne({
      _id: caseId,
      firmId,
    }).populate("client");

    if (!caseData) {
      return next(new AppError("No case found with that ID in your firm", 404));
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

    // Also set client from case if clientId not provided
    if (!clientId && caseData.client) {
      invoice.client = caseData.client._id;
    }
  }

  // Validate client exists if changing
  if (clientId) {
    // ✅ Multi-tenant: Ensure client belongs to the same firm
    const clientData = await User.findOne({
      _id: clientId,
      firmId,
      role: "client",
    });

    if (!clientData) {
      return next(
        new AppError("No client found with that ID in your firm", 404)
      );
    }

    invoice.client = clientId;
  }

  // Update fields
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
    "previousBalance",
    "internalNotes",
    "matterReference",
    "timekeeper",
    "billingAttorney",
  ];

  fieldsToUpdate.forEach((field) => {
    if (updateData[field] !== undefined) {
      invoice[field] = updateData[field];
    }
  });

  // Handle services updates
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

  // Set issueDate when status changes from draft to sent
  if (updateData.status === "sent" && invoice.status === "draft") {
    invoice.issueDate = new Date();
  }

  // Validate status transitions
  if (updateData.status) {
    const validTransitions = {
      draft: ["sent"],
      sent: ["overdue", "partially_paid", "paid", "cancelled"],
      overdue: ["partially_paid", "paid", "cancelled"],
      partially_paid: ["paid"],
      paid: [], // Cannot change from paid
      cancelled: [], // Cannot change from cancelled
      void: [], // Cannot change from void
    };

    const allowedNextStatuses = validTransitions[invoice.status] || [];
    if (!allowedNextStatuses.includes(updateData.status)) {
      return next(
        new AppError(
          `Cannot change status from ${invoice.status} to ${
            updateData.status
          }. Allowed transitions: ${allowedNextStatuses.join(", ") || "none"}`,
          400
        )
      );
    }

    invoice.status = updateData.status;
  }

  // Save invoice
  await invoice.save();

  // Populate the saved invoice
  const updatedInvoice = await Invoice.findById(invoice._id)
    .populate("client", "firstName lastName email phone address company")
    .populate(
      "case",
      "firstParty secondParty suitNo caseStatus matterReference"
    )
    .populate("timekeeper", "firstName lastName email position")
    .populate("billingAttorney", "firstName lastName email position");

  res.status(200).json({
    success: true,
    message: "Invoice updated successfully",
    data: updatedInvoice,
  });
});

// Delete invoice handler (soft delete)
exports.deleteInvoice = catchAsync(async (req, res, next) => {
  // ✅ Multi-tenant: Get firmId
  const firmId = getFirmId(req);

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    firmId,
    isDeleted: { $ne: true },
  });

  if (!invoice) {
    return next(
      new AppError("No invoice found with that ID in your firm", 404)
    );
  }

  // Check if invoice has payments
  const paymentCount = await Payment.countDocuments({
    invoice: invoice._id,
    firmId,
  });

  if (paymentCount > 0) {
    return next(
      new AppError(
        `Cannot delete invoice with ${paymentCount} existing payment(s). Please void the invoice instead.`,
        400
      )
    );
  }

  // ✅ Use soft delete instead of hard delete
  await invoice.softDelete(req.user.id);

  res.status(204).json({
    message: "success",
    data: null,
  });
});

// Generate invoice in PDF format
exports.generateInvoicePdf = catchAsync(async (req, res, next) => {
  // ✅ Multi-tenant: Get firmId
  const firmId = getFirmId(req);
  const path = require("path");

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    firmId,
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone address")
    .populate("case", "firstParty secondParty suitNo");

  if (!invoice) {
    return next(
      new AppError("No invoice found with that ID in your firm", 404)
    );
  }

  // Authorization check: clients can only view their own invoices
  if (req.user.role === "client") {
    if (invoice.client._id.toString() !== req.user.id) {
      return next(
        new AppError("You are not authorized to view this invoice", 403)
      );
    }

    if (invoice.status === "draft") {
      return next(new AppError("You cannot view draft invoices", 403));
    }
  }

  const payments = await Payment.find({
    invoice: invoice._id,
    firmId,
  }).sort({
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
    path.join(__dirname, "../views/invoice.pug"),
    path.join(__dirname, `../output/${invoice.invoiceNumber}_invoice.pdf`)
  );
});

// Get total amount due across all invoices
exports.getTotalAmountDueOnInvoice = catchAsync(async (req, res, next) => {
  // ✅ Multi-tenant: Start with firmId
  const firmId = getFirmId(req);
  const mongoose = require("mongoose");

  let matchStage = {
    firmId: new mongoose.Types.ObjectId(firmId),
    isDeleted: { $ne: true },
  };

  // Role-based filtering: clients can only see their own totals
  if (req.user.role === "client") {
    matchStage.client = new mongoose.Types.ObjectId(req.user.id);
    matchStage.status = { $ne: "draft" };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmountDue: { $sum: "$balance" },
        totalInvoiceAmount: { $sum: "$total" },
        totalPaid: { $sum: "$amountPaid" },
        invoiceCount: { $sum: 1 },
      },
    },
  ];

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

  // ✅ Multi-tenant: Include firmId
  const firmId = getFirmId(req);
  let filter = {
    status,
    firmId,
    isDeleted: { $ne: true },
  };

  // Role-based filtering: clients can only see their own invoices
  if (req.user.role === "client") {
    filter.client = req.user.id;
    // Prevent clients from viewing drafts
    if (status === "draft") {
      return next(new AppError("Clients cannot view draft invoices", 403));
    }
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

  // ✅ Multi-tenant: Include firmId
  const firmId = getFirmId(req);
  let filter = {
    status: "overdue",
    balance: { $gt: 0 },
    firmId,
    isDeleted: { $ne: true },
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
  // ✅ Multi-tenant: Only update invoices for the user's firm
  const firmId = getFirmId(req);

  const result = await Invoice.updateMany(
    {
      firmId,
      status: { $in: ["sent", "partially_paid"] },
      dueDate: { $lt: new Date() },
      balance: { $gt: 0 },
      isDeleted: { $ne: true },
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
  // ✅ Multi-tenant: Include firmId
  const firmId = getFirmId(req);

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    firmId,
    isDeleted: { $ne: true },
  });

  if (!invoice) {
    return next(
      new AppError("No invoice found with that ID in your firm", 404)
    );
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
  // ✅ Multi-tenant: Include firmId
  const firmId = getFirmId(req);

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    firmId,
    isDeleted: { $ne: true },
  });

  if (!invoice) {
    return next(
      new AppError("No invoice found with that ID in your firm", 404)
    );
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
