const LeaveBalance = require("../models/leaveBalanceModel");
const leaveService = require("../services/leaveService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/**
 * Create leave balance for employee
 */
exports.createLeaveBalance = catchAsync(async (req, res, next) => {
  const { employee, year, ...balances } = req.body;

  // Check if balance already exists for this employee and year
  const existing = await LeaveBalance.findOne({ employee, year });

  if (existing) {
    return next(
      new AppError(
        "Leave balance already exists for this employee and year",
        400
      )
    );
  }

  const leaveBalance = await LeaveBalance.create({
    employee,
    year: year || new Date().getFullYear(),
    ...balances,
  });

  res.status(201).json({
    status: "success",
    message: "Leave balance created successfully",
    data: { leaveBalance },
  });
});

/**
 * Get leave balance for specific employee
 */
exports.getLeaveBalance = catchAsync(async (req, res, next) => {
  const { employeeId } = req.params;
  const year = req.query.year || new Date().getFullYear();

  const leaveBalance = await leaveService.getEmployeeLeaveBalance(
    employeeId,
    year
  );

  res.status(200).json({
    status: "success",
    data: { leaveBalance },
  });
});

/**
 * Get all leave balances with filters
 */
exports.getLeaveBalances = catchAsync(async (req, res, next) => {
  const { year, department, sortBy = "-annualLeaveBalance" } = req.query;

  const filter = {};
  if (year) filter.year = parseInt(year);

  const leaveBalances = await LeaveBalance.find(filter).sort(sortBy);

  res.status(200).json({
    status: "success",
    results: leaveBalances.length,
    data: { leaveBalances },
  });
});

/**
 * Update leave balance
 */
exports.updateLeaveBalance = catchAsync(async (req, res, next) => {
  const { employeeId } = req.params;
  const year = req.body.year || new Date().getFullYear();

  const leaveBalance = await LeaveBalance.findOneAndUpdate(
    { employee: employeeId, year },
    req.body,
    {
      new: true,
      runValidators: true,
      upsert: false,
    }
  );

  if (!leaveBalance) {
    return next(new AppError("Leave balance not found for this employee", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Leave balance updated successfully",
    data: { leaveBalance },
  });
});

/**
 * Delete leave balance
 */
exports.deleteLeaveBalance = catchAsync(async (req, res, next) => {
  const leaveBalance = await LeaveBalance.findByIdAndDelete(req.params.id);

  if (!leaveBalance) {
    return next(new AppError("Leave balance not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Get leave balance summary for employee
 */
exports.getLeaveBalanceSummary = catchAsync(async (req, res, next) => {
  const employeeId = req.params.employeeId || req.user._id;
  const year = req.query.year || new Date().getFullYear();

  const [balance, applications] = await Promise.all([
    leaveService.getEmployeeLeaveBalance(employeeId, year),
    LeaveApplication.find({
      employee: employeeId,
      status: { $in: ["pending", "approved"] },
      startDate: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31),
      },
    }),
  ]);

  const summary = {
    totalAvailable: balance.totalAvailableLeave,
    annual: balance.annualLeaveBalance,
    sick: balance.sickLeaveBalance,
    maternity: balance.maternityLeaveBalance,
    paternity: balance.paternityLeaveBalance,
    compassionate: balance.compassionateLeaveBalance,
    carryOver: balance.carryOverDays,
    pendingApplications: applications.filter((app) => app.status === "pending")
      .length,
    approvedApplications: applications.filter(
      (app) => app.status === "approved"
    ).length,
    upcomingLeaves: applications.filter(
      (app) => app.status === "approved" && app.startDate > new Date()
    ),
  };

  res.status(200).json({
    status: "success",
    data: { summary },
  });
});
