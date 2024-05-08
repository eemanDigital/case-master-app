const File = require("../models/fileModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// add file
exports.createFile = catchAsync(async (req, res, next) => {
  const { fileName, date } = req.body;
  const file = req.file?.filename;
  // console.log(file);

  // check if user input filename and file
  if (!file) {
    return next(new AppError("Please, upload a file", 400));
  }

  const doc = await File.create({ fileName, file, date });

  res.status(201).json({
    message: "Success",
    data: doc,
  });
});

exports.getFiles = catchAsync(async (req, res, next) => {
  const files = await File.find();

  res.status(200).json({
    message: "Success",
    data: files,
  });
});
exports.downloadFile = catchAsync(async (req, res, next) => {
  const doc = await File.findById(req.params.id);
  if (!doc) {
    return next(new AppError("No Document found", 404));
  }

  res.download(doc.file); // This will initiate a file download with the provided file path
});
exports.getFile = catchAsync(async (req, res, next) => {
  const fileDoc = await File.findById(req.params.id);
  if (!fileDoc) {
    return next(new AppError("No Document found", 404));
  }

  res.status(200).json({
    message: "success",
    data: fileDoc,
  });
});

exports.updateFile = catchAsync(async (req, res, next) => {
  const fileDoc = await File.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidator: true,
  });
  console.log(fileDoc);

  if (!fileDoc) {
    return next(new AppError("No Document found", 404));
  }

  res.status(200).json({
    message: "success",
    data: fileDoc,
  });
});

exports.deleteFile = catchAsync(async (req, res, next) => {
  const doc = await File.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError(`No Tour Found with that ID`, 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
