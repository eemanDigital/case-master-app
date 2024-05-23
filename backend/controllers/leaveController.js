const Leave = require("../models/leaveModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createLeave = catchAsync(async (req, res, next) => {
  const newLeave = await Leave.create(req.body);
  res.status(201).json({
    data: newLeave,
  });
});

exports.updateLeave = catchAsync(async (req, res, next) => {
  // const filename = req.file ? req.file.filename : null;
  // 3) Update user task
  const updatedLeave = await Leave.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedLeave,
  });
});

exports.getLeave = catchAsync(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id);
  // .populate({
  //   path: "notice",
  //   select: "-recipient -relatedleave",
  // });
  // .populate("assignedTo")
  // .populate("caseToWorkOn");
  if (!leave) {
    return next(new AppError("The leave does not exist", 404));
  }
  res.status(200).json({
    data: leave,
  });
});

exports.createLeaveApplication = catchAsync(async (req, res, next) => {
  // Get parent leave ID
  const id = req.params.leaveId;
  const app = req.body;

  // Find the parent leave
  const leave = await Leave.findById(id);

  if (!leave) {
    return next(
      new AppError("No parent leave found for this application", 404)
    );
  } else {
    // Assign the application to the leave's application field
    leave.application = app;

    // Calculate days applied for
    const startDate = new Date(app.startDate).getTime();
    const endDate = new Date(app.endDate).getTime();
    const daysAppliedFor =
      Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Check if leave is within the same year and update history for annual and casual leave only
    const leaveCategory = leave.application.leaveCategory;
    if (leaveCategory === "annual" || leaveCategory === "casual") {
      const currentYear = new Date().getFullYear();
      const existingHistory = leave.leaveHistory.find(
        (record) => record.year === currentYear
      );

      if (existingHistory) {
        existingHistory.daysTaken += daysAppliedFor;
      } else {
        leave.leaveHistory.push({
          year: currentYear,
          daysTaken: daysAppliedFor,
        });
      }

      const totalDaysTaken = leave.leaveHistory.reduce(
        (sum, record) => sum + record.daysTaken,
        0
      );

      if (totalDaysTaken > leave.annualLeaveEntitled) {
        return next(
          new AppError("Annual leave entitlement exceeded for the year", 400)
        );
      }

      leave.leaveBalance = leave.annualLeaveEntitled - totalDaysTaken;
    }

    await leave.save(); // Save the updated leave document

    res.status(201).json({
      status: "success",
      data: leave,
    });
  }
});
