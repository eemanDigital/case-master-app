const Invoice = require("../models/invoiceModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");

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
  const invoices = await Invoice.find();

  res.status(200).json({
    status: "success",
    results: invoices.length,
    data: invoices,
  });
});

exports.getInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new AppError("No invoice found with that ID", 404));
  }

  res.status(200).json({
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
