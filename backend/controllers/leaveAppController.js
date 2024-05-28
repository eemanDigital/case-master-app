const LeaveApplication = require("../models/leaveApplicationModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");

exports.createLeaveApplication = catchAsync(async (req, res, next) => {
  // const { employee } = req.body;
  const currentUser = await User.findById(req.user.id);

  // console.log("EMP", employee);

  const leaveApplication = await LeaveApplication.create({
    employee: currentUser._id,
    ...req.body,
  });

  // get current user

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
