const LeaveApplication = require("../models/leaveApplicationModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const LeaveBalance = require("../models/leaveBalanceModel");

exports.createLeaveApplication = catchAsync(async (req, res, next) => {
  // get current user
  const userId = req.user._id;
  console.log(req.body);

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
    (req.body.typeOfLeave === "annual" || req.body.typeOfLeave === "casual") &&
    leaveDays > leaveBalance.annualLeaveBalance
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
exports.getLeaveApplications = catchAsync(async (req, res, next) => {
  const leaveApps = await LeaveApplication.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    data: leaveApps,
  });
});

// exports.updateLeaveApplication = catchAsync(async (req, res, next) => {
//   const leaveApplication = await LeaveApplication.findById(req.params.id);
//   if (!leaveApplication) {
//     return next(new AppError("No leave application found with that ID", 404));
//   }

//   // get the leave balance for the employee
//   const leaveBalance = await LeaveBalance.findOne({
//     employee: leaveApplication.employee,
//   });
//   if (!leaveBalance) {
//     return next(new AppError("No leave balance found for that employee", 404));
//   }

//   // Calculate the number of leave days for the application
//   let leaveDays =
//     Math.ceil(
//       (new Date(leaveApplication.endDate) -
//         new Date(leaveApplication.startDate)) /
//         (1000 * 60 * 60 * 24)
//     ) + 1;

//   // Check if the employee has enough leave balance
//   if (
//     (leaveApplication.typeOfLeave === "annual" ||
//       leaveApplication.typeOfLeave === "casual") &&
//     leaveDays > leaveBalance.annualLeaveBalance
//   ) {
//     return next(new AppError("Not enough annual leave balance", 400));
//   } else if (
//     leaveApplication.typeOfLeave === "sick" &&
//     leaveDays > leaveBalance.sickLeaveBalance
//   ) {
//     return next(new AppError("Not enough sick leave balance", 400));
//   }

//   // If the leave application is approved, deduct the leave days from the leave balance
//   if (req.body.status === "approved") {
//     if (
//       leaveApplication.typeOfLeave === "annual" ||
//       leaveApplication.typeOfLeave === "casual"
//     ) {
//       leaveBalance.annualLeaveBalance -= leaveDays;
//     } else if (leaveApplication.typeOfLeave === "sick") {
//       leaveBalance.sickLeaveBalance -= leaveDays;
//     }
//     // add other types of leaves if needed
//     await leaveBalance.save();

//     // Recalculate the number of leave days if the start or end date is modified
//     if (req.body.startDate || req.body.endDate) {
//       leaveDays =
//         Math.ceil(
//           (new Date(req.body.endDate || leaveApplication.endDate) -
//             new Date(req.body.startDate || leaveApplication.startDate)) /
//             (1000 * 60 * 60 * 24)
//         ) + 1;
//     }
//   }

//   // Update the leave application
//   leaveApplication.set({
//     daysApproved: leaveDays,
//     startDate: req.body.startDate || leaveApplication.startDate,
//     endDate: req.body.endDate || leaveApplication.endDate,
//     ...req.body,
//   });
//   req.leaveApp = leaveApplication;

//   await leaveApplication.save();

//   res.status(200).json({
//     status: "success",
//     data: leaveApplication,
//   });
// });

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
  let leaveDays =
    Math.ceil(
      (new Date(leaveApplication.endDate) -
        new Date(leaveApplication.startDate)) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // Check if the employee has enough leave balance
  if (
    (leaveApplication.typeOfLeave === "annual" ||
      leaveApplication.typeOfLeave === "casual") &&
    leaveDays > leaveBalance.annualLeaveBalance
  ) {
    return next(new AppError("Not enough annual leave balance", 400));
  } else if (
    leaveApplication.typeOfLeave === "sick" &&
    leaveDays > leaveBalance.sickLeaveBalance
  ) {
    return next(new AppError("Not enough sick leave balance", 400));
  }

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

    // Recalculate the number of leave days if the start or end date is modified
    if (req.body.startDate || req.body.endDate) {
      leaveDays =
        Math.ceil(
          (new Date(req.body.endDate || leaveApplication.endDate) -
            new Date(req.body.startDate || leaveApplication.startDate)) /
            (1000 * 60 * 60 * 24)
        ) + 1;
    }
  }

  // Update the leave application
  const updatedLeaveApplication = await LeaveApplication.findOneAndUpdate(
    { _id: req.params.id },
    {
      daysApproved: leaveDays,
      startDate: req.body.startDate || leaveApplication.startDate,
      endDate: req.body.endDate || leaveApplication.endDate,
      ...req.body,
    },
    {
      runValidators: false,
      new: true,
    }
  );

  if (!updatedLeaveApplication) {
    return next(new AppError("No leave application found with that ID", 404));
  }

  req.leaveApp = updatedLeaveApplication;

  res.status(200).json({
    status: "success",
    data: updatedLeaveApplication,
  });
});

// delete application handler
exports.deleteLeaveApplication = catchAsync(async (req, res, next) => {
  let leaveApplication = await LeaveApplication.findById(req.params.id);

  if (!leaveApplication) {
    return next(new AppError("No leave application found with that ID", 404));
  }

  // check user's role to allow delete
  if (
    req.user.role === "admin" ||
    req.user.role === "hr" ||
    (req.user.role === "user" && leaveApplication.status === "pending")
  ) {
    await LeaveApplication.findByIdAndDelete(req.params.id);
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
