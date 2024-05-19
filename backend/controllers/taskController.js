// const Task = require("../models/taskModel");
// const AppError = require("../utils/appError");
// const catchAsync = require("../utils/catchAsync");

// exports.createTask = catchAsync(async (req, res, next) => {
//   const {
//     title,
//     instruction,
//     caseToWorkOn,
//     assignedTo,
//     dateAssigned,
//     dueDate,
//     taskPriority,
//     document,
//   } = req.body;

//   const task = await Task.create({
//     title,
//     instruction,
//     caseToWorkOn,
//     assignedTo,
//     dateAssigned,
//     dueDate,
//     taskPriority,
//     document,
//   });

//   res.status(201).json({
//     data: task,
//   });
// });

// exports.getTasks = catchAsync(async (req, res, next) => {
//   const tasks = await Task.find()
//     .populate("assignedTo")
//     .populate("caseToWorkOn");

//   res.status(200).json({
//     results: tasks.length,
//     data: tasks,
//   });
// });

// exports.getTask = catchAsync(async (req, res, next) => {
//   const task = await Task.findById(req.params.taskId);

//   if (!task) {
//     return next(new AppError("The task does not exist", 404));
//   }
//   res.status(200).json({
//     data: task,
//   });
// });

const Task = require("../models/taskModel");

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// const multer = require("multer");
// const sharp = require("sharp");

// const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(new AppError("Not an image! Please upload only images.", 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadTaskDoc = upload.single("attachedFile");

// exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
//   if (!req.file) return next();

//   req.file.filename = `user-${req?.user?.id}-${Date.now()}`;

//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat("jpeg")
//     .jpeg({ quality: 90 })
//     .toFile(`public/images/users/${req.file?.filename}`);

//   next();
// });

exports.createTask = catchAsync(async (req, res, next) => {
  // const {
  //   title,
  //   instruction,
  //   caseToWorkOn,
  //   assignedTo,
  //   dateAssigned,
  //   dueDate,
  //   taskPriority,
  //   document,
  //   message,
  // } = req.body;

  // const task = await Task.create({
  //   title,
  //   instruction,
  //   caseToWorkOn,
  //   assignedTo,
  //   dateAssigned,
  //   dueDate,
  //   taskPriority,
  //   document,
  //   message,
  // });

  // const { reminder } = req.body;

  const task = await Task.create(req.body);
  res.status(201).json({
    data: task,
  });
});

exports.getTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find();
  // .populate("assignedTo")
  // .populate("caseToWorkOn");

  res.status(200).json({
    results: tasks.length,
    data: tasks,
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId).populate("documents");
  // .populate({
  //   path: "notice",
  //   select: "-recipient -relatedTask",
  // });
  // .populate("assignedTo")
  // .populate("caseToWorkOn");
  if (!task) {
    return next(new AppError("The task does not exist", 404));
  }
  res.status(200).json({
    data: task,
  });
});

// exports.downloadFile = catchAsync(async (req, res, next) => {
//   const { id } = req.params;
//   console.log(id);
//   const doc = await File.findById(id);
//   if (!doc) {
//     return next(new AppError("No Document found", 404));
//   }
//   const file = doc.file;
//   const filePath = path.join(__dirname, `../public/taskDoc/${file}`); // Assuming the files are in the uploads folder
//   res.download(filePath);
// });

exports.updateTask = catchAsync(async (req, res, next) => {
  // const filename = req.file ? req.file.filename : null;
  // 3) Update user task
  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedTask,
  });
});

// TASK RESPONSE
// exports.createTaskResponse = catchAsync(async (req, res, next) => {
//   // get parent id
//   const id = req.params.taskId;
//   const newResponse = req.body;

//   // Find the parent task
//   const parentTask = await Task.findById(id);

//   if (!parentTask) {
//     return next(new AppError("No parent task for this response", 404));
//   } else {
//     // Push taskResponse to parent data (if parent is found)
//     parentTask.taskResponse.push(newResponse);
//     await parentTask.save(); // Save the parent task document
//     res.status(201).json(parentTask);
//   }
// });
exports.createTaskResponse = catchAsync(async (req, res, next) => {
  // get parent id
  const id = req.params.taskId;
  const response = req.body;
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

exports.deleteTaskResponse = catchAsync(async (req, res, next) => {
  const { taskId, responseId } = req.params; //parentTask id

  const parentTask = await Task.findById(taskId);
  // const taskResponse = await Task.task.findById(responseId);

  if (!parentTask) {
    next(new AppError("task/response does not response"));
  }

  parentTask.taskResponse.id(responseId).remove();
  await parentTask.save();

  res.status(204).json({ message: "success" });
});
