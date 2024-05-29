const LeaveApplication = require("../models/leaveApplicationModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const LeaveResponse = require("../models/leaveResModel");

// exports.createLeaveApplication = catchAsync(async (req, res, next) => {
//   // const { employee } = req.body;

//   // get current loggedIn user
//   const currentUser = await User.findById(req.user.id);

//   // console.log("EMP", employee);
//   // insert current user as employee making application
//   const leaveApplication = await LeaveApplication.create({
//     employee: currentUser._id,
//     ...req.body,
//   });

//   // get current user

//   res.status(201).json({
//     status: "success",
//     data: leaveApplication,
//   });
// });

exports.createLeaveApplication = async (req, res, next) => {
  // Fetch existing leave response for the employee
  const existingLeaveRes = await LeaveResponse.findOne({
    employee: req.body.employee,
  });

  // if (!existingLeaveRes) {
  //   return res.status(400).json({
  //     status: "fail",
  //     message: "Leave response not found for the employee",
  //   });
  // }
  if (!existingLeaveRes) {
    const newApplication = await LeaveApplication.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        application: newApplication,
      },
    });
  } else {
    const currentYear = new Date().getFullYear();
    const existingHistory = existingLeaveRes?.leaveHistory.find(
      (record) => record.year === currentYear
    );

    const daysAppliedFor =
      Math.round(
        (new Date(req.body.endDate) - new Date(req.body.startDate)) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    let totalDaysTaken = existingHistory
      ? existingHistory.daysTaken + daysAppliedFor
      : daysAppliedFor;

    if (totalDaysTaken > existingLeaveRes.annualLeaveEntitled) {
      return res.status(400).json({
        status: "fail",
        message: "Annual leave entitlement exceeded for the year",
      });
    }
  }
};

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
