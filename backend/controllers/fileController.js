const File = require("../models/fileModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// add file
exports.createFile = catchAsync(async (req, res, next) => {
  const { fileName, date } = req.body;
  const file = req.file.path;
  //   console.log(file);

  // check if user input filename and file
  if (!fileName || !file) {
    return next(new AppError("Upload file and add file's name", 400));
  }

  const doc = await File.create({ fileName, file, date });

  res.status(200).json({
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
