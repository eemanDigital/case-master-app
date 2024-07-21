const Invoice = require("../models/invoiceModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");
// const pdf = require("pdf-creator-node");
// const path = require("path");
// const pug = require("pug");
// const pdfoptions = require("../utils/pdfoptions");
const { generatePdf } = require("../utils/generatePdf");
const setRedisCache = require("../utils/setRedisCache");

// handle signature upload for the invoice
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an file! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserSignature = upload.single("signature");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `invoice-${req?.user?.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(200, 200)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/images/signature/${req.file?.filename}`);

  next();
});

exports.getAllInvoices = catchAsync(async (req, res, next) => {
  const invoices = await Invoice.find().sort({
    createdAt: -1,
  });

  // set redis cache
  setRedisCache("invoices", invoices, 5000);

  res.status(200).json({
    status: "success",
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
  setRedisCache("invoice", invoice, 5000);

  res.status(200).json({
    fromCache: false,
    status: "success",
    data: invoice,
  });
});

exports.createInvoice = catchAsync(async (req, res, next) => {
  const filename = req.file ? req.file.filename : null;
  const newInvoice = await Invoice.create({ signature: filename, ...req.body });

  res.status(201).json({
    status: "success",
    data: newInvoice,
  });
});

exports.updateInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: invoice,
  });
});

exports.deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

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
