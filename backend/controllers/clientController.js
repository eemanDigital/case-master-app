const Client = require("../models/clientModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// exports.createClient = catchAsync(async (req, res, next) => {
//   const client = await Client.create(req.body);

//   res.status(201).json({
//     status: "success",
//     data: client,
//   });
// });

// function to filter out some restricted fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

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
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    "email",
    "firstName",
    "secondName",
    "address",
    "phone",
    "case",
    "active"
  );

  // 3) Update user document
  const updatedClient = await Client.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );
  // console.log("UPC", updatedClient);
  console.log("FILTER BODY", req.body);

  res.status(200).json({
    status: "success",
    data: updatedClient,
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
