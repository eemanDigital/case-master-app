const LeaveApplication = require("../models/leaveApplicationModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const LeaveBalance = require("../models/leaveBalanceModel");

exports.createLeaveApplication = catchAsync(async (req, res, next) => {
  // get current user
  const userId = req.user._id;

  // get the leave balance for the employee
  const leaveBalance = await LeaveBalance.findOne({
    employee: userId,
  });
  if (!leaveBalance) {
    return next(new AppError("No leave balance found for that employee", 404));
  }

  // Calculate the number of leave days for the application
  const leaveDays =
    Math.ceil(
      (new Date(req.body.endDate) - new Date(req.body.startDate)) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // Check if the employee has enough leave balance
  if (
    req.body.typeOfLeave === "annual" ||
    (req.body.typeOfLeave === "casual" &&
      leaveDays > leaveBalance.annualLeaveBalance)
  ) {
    return next(new AppError("Not enough annual leave balance", 400));
  } else if (
    req.body.typeOfLeave === "sick" &&
    leaveDays > leaveBalance.sickLeaveBalance
  ) {
    return next(new AppError("Not enough sick leave balance", 400));
  }
  // add other types of leaves if needed

  //create new leave application
  const newLeave = await LeaveApplication.create({
    daysAppliedFor: leaveDays,
    employee: userId,
    ...req.body,
  });

  res.status(201).json({
    status: "success",
    data: newLeave,
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

// get all leave applications
exports.getAllLeaveApplications = catchAsync(async (req, res, next) => {
  const leaveApps = await LeaveApplication.find();

  res.status(200).json({
    status: "success",
    data: leaveApps,
  });
});

exports.updateLeaveApplication = catchAsync(async (req, res, next) => {
  const leaveApplication = await LeaveApplication.findById(req.params.id);
  if (!leaveApplication) {
    return next(new AppError("No leave application found with that ID", 404));
  }

  // get the leave balance for the employee
  const leaveBalance = await LeaveBalance.findOne({
    employee: leaveApplication.employee,
  });
  if (!leaveBalance) {
    return next(new AppError("No leave balance found for that employee", 404));
  }

  // Calculate the number of leave days for the application
  const leaveDays =
    Math.ceil(
      (new Date(leaveApplication.endDate) -
        new Date(leaveApplication.startDate)) /
        (1000 * 60 * 60 * 24)
    ) + 1;
  // console.log("DAYS", leaveDays);
  // Check if the employee has enough leave balance
  if (
    leaveApplication.typeOfLeave === "annual" ||
    (leaveApplication.typeOfLeave === "casual" &&
      leaveDays > leaveBalance.annualLeaveBalance)
  ) {
    return next(new AppError("Not enough annual leave balance", 400));
  } else if (
    leaveApplication.typeOfLeave === "sick" &&
    leaveDays > leaveBalance.sickLeaveBalance
  ) {
    return next(new AppError("Not enough sick leave balance", 400));
  }
  // add other types of leaves if needed

  // If the leave application is approved, deduct the leave days from the leave balance
  if (req.body.status === "approved") {
    if (
      leaveApplication.typeOfLeave === "annual" ||
      leaveApplication.typeOfLeave === "casual"
    ) {
      leaveBalance.annualLeaveBalance -= leaveDays;
    } else if (leaveApplication.typeOfLeave === "sick") {
      leaveBalance.sickLeaveBalance -= leaveDays;
    }
    // add other types of leaves if needed
    await leaveBalance.save();
  }

  // Update the leave application
  leaveApplication.set({ daysApproved: leaveDays, ...req.body });
  req.leaveApp = leaveApplication;

  // console.log("LEAVEAPP", req.leaveApp);
  await leaveApplication.save();

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
