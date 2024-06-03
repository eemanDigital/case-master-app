const Client = require("../models/clientModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createClient = catchAsync(async (req, res, next) => {
  const client = await Client.create(req.body);

  res.status(201).json({
    status: "success",
    data: client,
  });
});

exports.getClients = catchAsync(async (req, res, next) => {
  const clients = await Client.find({});

  res.status(200).json({
    status: "success",
    results: clients.length,
    data: clients,
  });
});

exports.getClient = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: client,
  });
});

exports.updateClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: client,
  });
});

exports.deleteClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndDelete(req.params.id);

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
