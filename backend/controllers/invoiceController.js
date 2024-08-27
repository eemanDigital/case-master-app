const Invoice = require("../models/invoiceModel");
const Case = require("../models/caseModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generatePdf } = require("../utils/generatePdf");
// const setRedisCache = require("../utils/setRedisCache");

// get all invoices
exports.getAllInvoices = catchAsync(async (req, res, next) => {
  const invoices = await Invoice.find().sort({
    createdAt: -1,
  });

  // set redis cache
  // setRedisCache("invoices", invoices, 5000);

  res.status(200).json({
    message: "success",
    fromCache: false,
    results: invoices.length,
    data: invoices,
  });
});

exports.getInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  // set redis cache
  // setRedisCache(`invoice:${req.params.id}`, invoice, 5000);

  res.status(200).json({
    fromCache: false,
    status: "success",
    data: invoice,
  });
});

// create invoice
exports.createInvoice = catchAsync(async (req, res, next) => {
  const { case: caseId, client: clientId } = req.body;

  // Check if the case exists and populate the client
  if (caseId) {
    const caseData = await Case.findById(caseId).populate("client");
    if (!caseData) {
      return next(new AppError("No case found with that ID", 404));
    }

    // Check if the case has an associated client
    if (!caseData.client) {
      return next(new AppError("No client associated with this case", 400));
    }

    // Check if the client associated with the case is the same as the clientId provided
    if (caseData.client._id.toString() !== clientId) {
      return next(
        new AppError(
          "Client in the case does not match the provided client ID",
          400
        )
      );
    }
  }

  // Check if the client exists
  const clientData = await User.findById(clientId);
  if (!clientData) {
    return next(new AppError("No client found with that ID", 404));
  }

  const newInvoice = await Invoice.create(req.body);

  res.status(201).json({
    message: "success",
    data: newInvoice,
  });
});

// update invoice data
exports.updateInvoice = catchAsync(async (req, res, next) => {
  const { case: caseId, client: clientId } = req.body;

  // Check if the case exists and populate the client
  const caseData = await Case.findById(caseId).populate("client");

  if (!caseData) {
    return next(new AppError("No case found with that ID", 404));
  }

  // Check if the case has an associated client
  if (!caseData.client) {
    return next(new AppError("No client associated with this case", 400));
  }

  // Check if the client associated with the case is the same as the clientId provided
  if (caseData.client._id.toString() !== clientId) {
    return next(
      new AppError(
        "Client in the case does not match the provided client ID",
        400
      )
    );
  }

  // Check if the client exists
  const clientData = await User.findById(clientId);
  if (!clientData) {
    return next(new AppError("No client found with that ID", 404));
  }

  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  res.status(200).json({
    message: "success",
    data: invoice,
  });
});
// delete invoice handler
exports.deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  res.status(204).json({
    message: "success",
    data: null,
  });
});

// generate invoice in pdf format
exports.generateInvoicePdf = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  // Handle undefined data
  const safeInvoice = {
    invoiceReference: invoice.invoiceReference || "",
    client: invoice.client || {},
    accountDetails: invoice.accountDetails || {},
    createdAt: invoice.createdAt || "",
    dueDate: invoice.dueDate || "",
    status: invoice.status || "",
    taxType: invoice.taxType || "",
    workTitle: invoice.workTitle || "",
    case: invoice.case || {},
    services: invoice.services || [],
    totalHours: invoice.totalHours || 0,
    totalProfessionalFees: invoice.totalProfessionalFees || 0,
    previousBalance: invoice.previousBalance || 0,
    totalAmountDue: invoice.totalAmountDue || 0,
    totalInvoiceAmount: invoice.totalInvoiceAmount || 0,
    amountPaid: invoice.amountPaid || 0,
    paymentInstructionTAndC: invoice.paymentInstructionTAndC || "",
    expenses: invoice.expenses || [],
    totalExpenses: invoice.totalExpenses || 0,
    taxAmount: invoice.taxAmount || 0,
    totalAmountWithTax: invoice.totalAmountWithTax || 0,
    serviceDescriptions: invoice.serviceDescriptions || "",
    hours: invoice.hours || 0,
    date: invoice.date || "",
    feeRatePerHour: invoice.feeRatePerHour || 0,
    amount: invoice.amount || 0,
    financialSummary: invoice.financialSummary || "",
  };

  // generate pdf handler function
  generatePdf(
    { invoice: safeInvoice },
    res,
    "../views/invoice.pug",
    `../output/${Math.random()}_invoice.pdf`
  );
});

// get total amount due
exports.getTotalAmountDueOnInvoice = catchAsync(async (req, res, next) => {
  const result = await Invoice.aggregate([
    {
      $group: {
        _id: null,
        totalAmountDueOnInvoice: { $sum: "$totalAmountDue" },
      },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: result,
  });
});
