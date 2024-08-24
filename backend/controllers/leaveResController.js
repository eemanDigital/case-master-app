const LeaveResponse = require("../models/leaveResModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// create leave
exports.createLeave = catchAsync(async (req, res, next) => {
  const newLeave = await LeaveResponse.create(req.body);
  res.status(201).json({
    message: "success",
    data: newLeave,
  });
});

//update leave app
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
    message: "success",
    data: updatedLeave,
  });
});

// get leave app
exports.getLeave = catchAsync(async (req, res, next) => {
  const leave = await LeaveResponse.findById(req.params.id);

  if (!leave) {
    return next(new AppError("The leave does not exist", 404));
  }
  res.status(200).json({
    message: "success",
    data: leave,
  });
});
