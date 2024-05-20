// SUBDOCUMENT CONTROLLER
const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");

// multer config

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/taskResponseDoc");
  },
  filename: (req, file, cb) => {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );

    // console.log(req.file);
  },
});

const fileFilter = (req, file, cb) => {
  // filter out file if not specified here
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // For .docx files
    file.mimetype === "text/plain" // For plain text files
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Not a valid document! Please upload only valid document.",
        400
      ),
      false
    );
  }
};

exports.uploadTaskResponseFile = multer({
  storage: multerStorage,

  // limits: {
  //   fileSize: 1024 * 1024 * 5,
  // },
  fileFilter: fileFilter,
});

// create response
exports.createTaskResponse = catchAsync(async (req, res, next) => {
  // get parent id
  const id = req.params.taskId;
  const response = req.body;
  const filename = req.file ? req.file.filename : null;
  response.file = filename;
  console.log("RES =>", response);

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
// exports.downloadFile = catchAsync(async (req, res, next) => {
//     const { id } = req.params;
//     console.log(id);
//     const doc = await File.findById(id);
//     if (!doc) {
//       return next(new AppError("No Document found", 404));
//     }
//     const file = doc.file;
//     const filePath = path.join(__dirname, `../public/caseDoc/${file}`); // Assuming the files are in the uploads folder
//     res.download(filePath);
//   });

// update response
//   exports.updateTaskResponse = catchAsync(async (req, res, next) => {
//     const { taskId, responseId } = req.params;
//     const task = await Task.findById(taskId);

//     if (!task) {
//       next(new AppError("task/response does not exist"));
//     }

//     const responseIndex = task.taskResponse.findIndex(
//       (r) => r._id.toString() === responseId
//     );
//     if (responseIndex === -1) {
//       next(new AppError("response not found"));
//     }

//     task.taskResponse[responseIndex] = req.body;
//     await task.save();

//     res.status(200).json({ message: "success" });
//   });
