const LeaveBalance = require("../models/leaveBalanceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createLeaveBalance = catchAsync(async (req, res, next) => {
  const leaveBalance = await LeaveBalance.create(req.body);

  // console.log("USER", req.user);

  res.status(201).json({
    message: "success",
    data: leaveBalance,
  });
});

exports.getLeaveBalance = catchAsync(async (req, res, next) => {
  const leaveBalance = await LeaveBalance.findOne({
    employee: req.params.employeeId,
  });
  if (!leaveBalance) {
    return next(new AppError("No leave balance found for that employee", 404));
  }
  res.status(200).json({
    status: "success",
    data: leaveBalance,
  });
});

// get all leave balance
exports.getLeaveBalances = catchAsync(async (req, res, next) => {
  const leaveBalance = await LeaveBalance.find().sort({
    annualLeaveBalance: -1,
  });

  res.status(200).json({
    status: "success",
    data: leaveBalance,
  });
});

exports.updateLeaveBalance = catchAsync(async (req, res, next) => {
  const leaveBalance = await LeaveBalance.findOneAndUpdate(
    { employee: req.params.employeeId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!leaveBalance) {
    return next(new AppError("No leave balance found for that employee", 404));
  }
  res.status(200).json({
    status: "success",
    data: leaveBalance,
  });
});

exports.deleteLeaveBalance = catchAsync(async (req, res, next) => {
  let leaveBalance = await LeaveBalance.findById(req.params.id);

  if (!leaveBalance) {
    return next(new AppError("No leave application found with that ID", 404));
  }

  // check user's role to allow delete
  if (req.user.role === "admin" || req.user.role === "hr") {
    await LeaveBalance.findByIdAndDelete(req.params.id);
  } else {
    return next(
      new AppError("You are not authorised to perform this operation", 400)
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
