const Case = require("../models/caseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// exports.createCase = catchAsync(async (req, res, next) => {
//   const singleCase = await Case.create(req.body);
//   res.status(201).json({
//     data: singleCase,
//   });
// });

exports.createCase = catchAsync(async (req, res, next) => {
  const { file, body } = req;
  if (!file || !body) {
    return next(new AppError("Please provide a file and request body", 400));
  }
  const { filename } = file;
  const { fileName, ...rest } = body;
  if (!fileName) {
    return next(
      new AppError("Please provide a fileName in the request body", 400)
    );
  }
  const document = {
    name: fileName,
    file: filename,
  };
  const singleCase = await Case.create({ documents: [document], ...rest });
  res.status(201).json({ data: singleCase });
});

exports.getCases = catchAsync(async (req, res, next) => {
  const cases = await Case.find();
  // .populate({
  //   path: "task",
  //   select: "description status dateAssigned dueDate taskPriority",
  // })
  // .populate({ path: "reports", select: "date update" });
  res.status(200).json({
    results: cases.length,
    data: cases,
  });
});

exports.getCase = catchAsync(async (req, res, next) => {
  //if id/caseId provided does not exist
  const _id = req.params.caseId;
  const data = await Case.findById({ _id }).populate({
    path: "reports",
    select: "-caseReported",
  });

  // res.status(200).json({
  //   data,
  // });
  //   .populate({
  //     path: "task",
  //     select: "description status dateAssigned dueDate taskPriority",
  //   })
  //   .populate("updates");
  // res.status(200).json({
  //   data,
  // });
  // console.log(id);
  if (!data) {
    return next(new AppError("No case found with that Id", 404));
  }
  res.status(200).json({
    data,
  });
});

exports.updateCase = catchAsync(async (req, res, next) => {
  const doc = await Case.findByIdAndUpdate(req.params.caseId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError(`No Case Found with that ID`, 404));
  }
  // console.log(updatedCase);
  res.status(200).json({
    message: "case successfully updated",
    doc,
  });
});

exports.deleteCase = catchAsync(async (req, res, next) => {
  const _id = req.params.caseId;
  const data = await Case.findByIdAndDelete({ _id });

  if (!data) {
    return next(new AppError("case with that Id does not exist", 404));
  }
  res.status(204).json({
    message: "Case deleted",
  });
});
