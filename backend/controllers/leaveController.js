const Leave = require("../models/leaveModel");
const AppError = require("../utils/appError");

exports.createLeave = catchAsync(async (req, res, next) => {
  const newLeave = await Leave.create(req.body);
  res.status(201).json({
    data: newLeave,
  });
});
