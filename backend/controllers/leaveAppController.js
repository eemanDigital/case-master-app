const LeaveApplication = require("../models/leaveApplicationModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createLeaveApplication = catchAsync(async (req, res, next) => {
  const leaveApplication = await LeaveApplication.create(req.body);

  res.status(201).json({
    status: "success",
    data: leaveApplication,
  });
});

exports.getLeaveApplication = catchAsync(async (req, res, next) => {
  const leaveApplication = await LeaveApplication.findById(req.params.id);

  if (!leaveApplication) {
    return next(new AppError("No leave application found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: leaveApplication,
  });
});

exports.updateLeaveApplication = catchAsync(async (req, res, next) => {
  const leaveApplication = await LeaveApplication.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!leaveApplication) {
    return next(new AppError("No leave application found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: leaveApplication,
  });
});

exports.deleteLeaveApplication = catchAsync(async (req, res, next) => {
  const leaveApplication = await LeaveApplication.findByIdAndDelete(
    req.params.id
  );

  if (!leaveApplication) {
    return next(new AppError("No leave application found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
