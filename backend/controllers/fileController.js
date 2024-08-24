const File = require("../models/fileModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const path = require("path");

exports.createFile = catchAsync(async (req, res, next) => {
  const { fileName } = req.body;
  let filePath = null;

  // Check if a file was uploaded
  if (req.file) {
    filePath = req.file.cloudinaryUrl;
  }
  console.log(filePath);

  const doc = await File.create({ fileName, file: filePath });

  res.status(201).json({
    message: "success",
    data: doc,
  });
});
exports.getFiles = catchAsync(async (req, res, next) => {
  const files = await File.find().sort("-date");

  res.status(200).json({
    message: "success",
    data: files,
  });
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
    message: "success",
    data: null,
  });
});

// hnaldle file download
exports.downloadFile = catchAsync(async (req, res, next) => {
  // Fetch the case by ID
  const doc = await File.findById(req.params.id);
  if (!doc) {
    return next(new AppError(`No document found with ID: ${parentId}`, 404));
  }
  const fileUrl = doc.file;
  const fileName = doc.fileName;

  // console.log(fileUrl, fileName);

  res.status(200).json({
    message: "success",
    data: {
      fileUrl,
      fileName,
    },
  });
});
