// SUBDOCUMENT CONTROLLER
const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");

const path = require("path");

// multer config

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/taskResponseDoc");
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

// const upload = multer({
//   storage: multerStorage,

//   // limits: {
//   //   fileSize: 1024 * 1024 * 5,
//   // },
//   fileFilter: fileFilter,
// });

// // module.exports = upload;
// // Middleware to handle file upload errors
// const uploadErrorHandler = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     // Multer error occurred
//     res.status(400).json({ error: "File upload error", message: err.message });
//   } else if (err) {
//     // Other non-Multer error occurred
//     res
//       .status(500)
//       .json({ error: "Internal server error", message: err.message });
//   } else {
//     // No error occurred, proceed to the next middleware
//     next();
//   }
// };

// exports.taskResponseFileUpload = (req, res, next) => {
//   // Use the upload middleware to handle file upload
//   upload.single("doc")(req, res, (err) => {
//     // upload.single("file")(req, res, (err) => {
//     if (err) {
//       // Pass the error to the error handling middleware
//       uploadErrorHandler(err, req, res, next);
//     } else {
//       // No error occurred, proceed to the next middleware
//       next();
//     }
//   });
// };
// create response
exports.createTaskResponse = catchAsync(async (req, res, next) => {
  // get parent id
  const id = req.params.taskId;
  const response = req.body;

  console.log("FILE =>", req.file);

  const filePath = req.file.cloudinaryUrl;

  if (!filePath) {
    return next(new AppError("Error uploading file to Cloudinary", 500));
  }

  response.doc = filePath;
  // console.log("FILE =>", response);

  // Find the parent task
  const parentTask = await Task.findById(id);

  if (!parentTask) {
    return next(new AppError("No parent task for this response", 404));
  } else {
    // Push taskResponse to parent data (if parent is found)
    parentTask.taskResponse.push(response);
    await parentTask.save(); // Save the parent task document
    // console.log("PARENT", parentTask);
    res.status(201).json(parentTask);
  }
});

//remove response
exports.deleteTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params; //parentTask id

  const task = await Task.findById(taskId);
  // const resId = await task.taskResponse.id(responseId).findOne();
  // console.log(resId);

  if (!task) {
    next(new AppError("task/response does not response"));
  }

  task.taskResponse.pull({ _id: responseId });
  await task.save();

  res.status(204).json({ message: "success" });
});

exports.getTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;
  const task = await Task.findById(taskId).populate({
    path: "taskResponse",
    match: { _id: responseId },
  });

  if (!task) {
    next(new AppError("task/response does not exist"));
  }
  //   select the last response
  const lastResponse = task.taskResponse.slice(-1)[0];
  //   const lastResponse = task.taskResponse;

  res.status(200).json(lastResponse);
});

// download file
exports.downloadFile = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params;
  const task = await Task.findById(taskId);

  if (!task) {
    next(new AppError("task/response does not exist"));
  }

  const responseIndex = task.taskResponse.findIndex(
    (r) => r._id.toString() === responseId
  );
  if (responseIndex === -1) {
    next(new AppError("response not found"));
  }

  const fileUrl = task.taskResponse[responseIndex].doc;

  res.status(200).json({
    status: "success",
    data: {
      fileUrl,
    },
  });
});

