const File = require("../models/fileModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createFile = catchAsync(async (req, res, next) => {
  const { fileName, date } = req.body;
  const file = req.file.path;

  if (!fileName || !file) {
    return AppError("Upload file and add name", 400);
  }

  const doc = await File.create({ fileName, file, date });

  res.status(200).json({
    message: "Success",
    data: doc,
  });
});
