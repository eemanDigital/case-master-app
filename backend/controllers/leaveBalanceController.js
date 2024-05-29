const LeaveBalance = require("../models/leaveBalanceModel");

exports.createLeaveBalance = async (req, res, next) => {
  const leaveBalance = await LeaveBalance.create(req.body);
  res.status(201).json({
    status: "success",
    data: leaveBalance,
  });
};

exports.getLeaveBalance = async (req, res, next) => {
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
};

exports.updateLeaveBalance = async (req, res, next) => {
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
};
