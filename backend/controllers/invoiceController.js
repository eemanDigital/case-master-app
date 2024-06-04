const Invoice = require("../models/invoiceModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createInvoice = catchAsync(async (req, res, next) => {
  const newInvoice = await Invoice.create(req.body);

  res.status(201).json({
    status: "success",
    data: newInvoice,
  });
});
