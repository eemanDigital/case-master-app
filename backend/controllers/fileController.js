const File = require("../models/fileModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/cases/docs");
//   },
//   filename: (req, file, cb) => {
//     // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(
//       null,
//       file.fieldname + "_" + Date.now() + path.extname(file.originalname)
//     );

//     // console.log(req.file);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   // filter out file if not specified here
//   if (
//     file.mimetype === "image/jpeg" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/png" ||
//     file.mimetype === "application/pdf" ||
//     file.mimetype ===
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // For .docx files
//     file.mimetype === "text/plain" // For plain text files
//   ) {
//     cb(null, true);
//   } else {
//     cb(
//       new AppError(
//         "Not a valid document! Please upload only valid document.",
//         400
//       ),
//       false
//     );
//   }
// };

// exports.upload = multer({
//   storage: multerStorage,
//   limits: {
//     fileSize: 1024 * 1024 * 5,
//   },
//   fileFilter: fileFilter,
// });

// exports.createFile = catchAsync(async (req, res, next) => {
//   const { file, body } = req;
//   if (!file || !body) {
//     return next(new AppError("Please provide a file and request body", 400));
//   }
//   const { filename } = file;
//   const { fileName, ...rest } = body;
//   if (!fileName) {
//     return next(
//       new AppError("Please provide a fileName in the request body", 400)
//     );
//   }
//   const document = {
//     name: fileName,
//     file: filename,
//   };
//   const singleFile = await Case.create({ documents: [document], ...rest });
//   res.status(201).json({ data: singleFile });
// });
// add file
exports.createFile = catchAsync(async (req, res, next) => {
  //     const { fileName } = req.body;

  //   // check if user input filename and file
  //     if (!file) {
  //       return next(new AppError("Please, upload a file", 400));
  //     }
  const filename = req.file ? req.file.filename : null;

  const doc = await File.create({ file: filename, ...req.body });

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
