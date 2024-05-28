const LeaveResponse = require("../models/leaveResModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createLeave = catchAsync(async (req, res, next) => {
  const newLeave = await LeaveResponse.create(req.body);
  res.status(201).json({
    status: "success",
    data: newLeave,
  });
});

exports.updateLeave = catchAsync(async (req, res, next) => {
  const updatedLeave = await LeaveResponse.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedLeave) {
    return next(new AppError("No leave found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: updatedLeave,
  });
});

exports.getLeave = catchAsync(async (req, res, next) => {
  const leave = await LeaveResponse.findById(req.params.id);
  // console.log(req.user.id);

  if (!leave) {
    return next(new AppError("The leave does not exist", 404));
  }
  res.status(200).json({
    status: "success",
    data: leave,
  });
});

// exports.createLeaveApplication = catchAsync(async (req, res, next) => {
//   // Get parent leave ID
//   const leave = await Leave.findById(req.params.leaveId);

//   if (!leave) {
//     return next(
//       new AppError("No parent leave found for this application", 404)
//     );
//   }

//   // Assign the application to the leave's application field
//   leave.application = req.body;

//   // Calculate days applied for
//   const difference =
//     new Date(req.body.endDate).getTime() -
//     new Date(req.body.startDate).getTime();
//   const daysAppliedFor = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;

//   // Update history for annual and casual leave only
//   const leaveCategory = leave.application.leaveCategory;
//   if (leaveCategory === "annual" || leaveCategory === "casual") {
//     const currentYear = new Date().getFullYear();
//     let existingHistory = leave.leaveHistory.find(
//       (record) => record.year === currentYear
//     );

//     if (existingHistory) {
//       existingHistory.daysTaken += daysAppliedFor;
//     } else {
//       leave.leaveHistory.push({
//         year: currentYear,
//         daysTaken: daysAppliedFor,
//       });
//     }

//     const totalDaysTaken = leave.leaveHistory.reduce(
//       (total, record) => total + record.daysTaken,
//       0
//     );

//     if (totalDaysTaken > leave.annualLeaveEntitled) {
//       return next(
//         new AppError("You have exceeded your annual leave entitlement", 400)
//       );
//     }
//   }

//   // Set isApproved, modifiedStartDate, and modifiedEndDate based on the application data
//   leave.isApproved = req.body.isApproved;
//   leave.modifiedStartDate = req.body.startDate;
//   leave.modifiedEndDate = req.body.endDate;

//   // Save the updated leave record
//   await leave.save();

//   res.status(200).json({
//     status: "success",
//     data: {
//       leave,
//     },
//   });
// });
