const Photo = require("../models/photoModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// add file
exports.createPhoto = catchAsync(async (req, res, next) => {
  // const { photo } = req.body;

  const photo = req.file?.filename;
  // console.log(file);

  // check if user input filename and file
  if (!photo) {
    return next(new AppError("Please, upload a file", 400));
  }

  const doc = await Photo.create({ photo });

  res.status(201).json({
    message: "Success",
    data: doc,
  });
});

exports.getPhotos = catchAsync(async (req, res, next) => {
  const photos = await Photo.find();

  res.status(200).json({
    message: "Success",
    data: photos,
  });
});
// exports.downloadFile = catchAsync(async (req, res, next) => {
//   const doc = await Photo.findById(req.params.id);
//   if (!doc) {
//     return next(new AppError("No Document found", 404));
//   }

//   res.download(doc.file); // This will initiate a file download with the provided file path
// });
exports.getPhoto = catchAsync(async (req, res, next) => {
  const photoDoc = await Photo.findById(req.params.id);
  if (!photoDoc) {
    return next(new AppError("No Document found", 404));
  }

  res.status(200).json({
    message: "success",
    data: photoDoc,
  });
});

exports.updatePhoto = catchAsync(async (req, res, next) => {
  const photoDoc = await Photo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidator: true,
  });
  console.log(photoDoc);

  if (!photoDoc) {
    return next(new AppError("No Document found", 404));
  }

  res.status(200).json({
    message: "success",
    data: photoDoc,
  });
});

exports.deletePhoto = catchAsync(async (req, res, next) => {
  const doc = await Photo.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError(`No Tour Found with that ID`, 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
