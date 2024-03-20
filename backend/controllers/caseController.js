const Case = require("../models/caseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createCase = catchAsync(async (req, res, next) => {
  const singleCase = await Case.create(req.body);

  res.status(201).json({
    data: singleCase,
  });
});

exports.getCases = catchAsync(async (req, res, next) => {
  const cases = await Case.find().populate("task");

  res.status(200).json({
    results: cases.length,
    data: cases,
  });
});

exports.getCase = catchAsync(async (req, res, next) => {
  const _id = req.params.caseId;
  // console.log(id);

  const data = await Case.findById({ _id });

  //if id/caseid provided does not exist
  if (!data) {
    return next(new AppError("no case found with that Id", 404));
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
