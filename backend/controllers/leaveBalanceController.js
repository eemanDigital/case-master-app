const LeaveBalance = require("../models/leaveBalanceModel");
const leaveService = require("../services/leaveService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/**
 * Helper to check if user has privileged access
 */
const isPrivilegedUser = (role) =>
  ["admin", "super-admin", "hr"].includes(role);

/**
 * Create leave balance for employee
 */
exports.createLeaveBalance = catchAsync(async (req, res, next) => {
  const { employee, year, ...balances } = req.body;

  // Optional: Ensure only HR/Admin can create balances
  if (!isPrivilegedUser(req.user.role)) {
    return next(
      new AppError("You are not authorized to create leave balances.", 403)
    );
  }

  const existing = await LeaveBalance.findOne({
    employee,
    year,
    firmId: req.firmId,
  });

  if (existing) {
    return next(
      new AppError(
        "Leave balance already exists for this employee and year",
        400
      )
    );
  }

  const leaveBalance = await LeaveBalance.create({
    firmId: req.firmId,
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
 * RESTRICTION: Users see their own; Admin/HR/Super-Admin see all.
 */
exports.getLeaveBalance = catchAsync(async (req, res, next) => {
  const { employeeId } = req.params;
  const year = req.query.year || new Date().getFullYear();

  // --- ACCESS CONTROL LOGIC START ---
  const isOwner = req.user._id.toString() === employeeId;
  const hasAccess = isPrivilegedUser(req.user.role);

  if (!isOwner && !hasAccess) {
    return next(
      new AppError("You are not authorized to view this leave balance.", 403)
    );
  }
  // --- ACCESS CONTROL LOGIC END ---

  try {
    const leaveBalance = await leaveService.getEmployeeLeaveBalance(
      employeeId,
      year
    );

    res.status(200).json({
      status: "success",
      data: { leaveBalance },
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(200).json({
        status: "success",
        data: {
          leaveBalance: null,
          message: "No leave balance found for this employee.",
        },
      });
    }
    throw error;
  }
});

/**
 * Get all leave balances
 * RESTRICTION: Only Admin, Super-Admin, and HR.
 */
exports.getLeaveBalances = catchAsync(async (req, res, next) => {
  // --- ACCESS CONTROL LOGIC START ---
  if (!isPrivilegedUser(req.user.role)) {
    return next(
      new AppError("You are not authorized to view all leave balances.", 403)
    );
  }
  // --- ACCESS CONTROL LOGIC END ---

  const { year, sortBy = "-annualLeaveBalance" } = req.query;

  const filter = {};
  if (year) filter.year = parseInt(year);
  // Add department filtering logic here if needed based on your User model

  const leaveBalances = await LeaveBalance.find({
    ...filter,
    firmId: req.firmId,
  })
    .sort(sortBy)
    .populate("employee", "firstName lastName email"); // Helpful to see who owns the balance

  res.status(200).json({
    status: "success",
    results: leaveBalances.length,
    data: { leaveBalances },
  });
});

/**
 * Update leave balance
 * RESTRICTION: Only Admin/HR/Super-Admin
 */
exports.updateLeaveBalance = catchAsync(async (req, res, next) => {
  // --- ACCESS CONTROL LOGIC START ---
  if (!isPrivilegedUser(req.user.role)) {
    return next(
      new AppError("You are not authorized to update leave balances.", 403)
    );
  }
  // --- ACCESS CONTROL LOGIC END ---

  const { employeeId } = req.params;
  const year = req.body.year || new Date().getFullYear();

  const leaveBalance = await LeaveBalance.findOneAndUpdate(
    { employee: employeeId, year, firmId: req.firmId },
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
 * RESTRICTION: ONLY HR.
 */
exports.deleteLeaveBalance = catchAsync(async (req, res, next) => {
  // --- ACCESS CONTROL LOGIC START ---
  // Strictly check for 'hr' role only
  if (req.user.role !== "hr") {
    return next(
      new AppError("Permission denied: Only HR can delete leave balances.", 403)
    );
  }
  // --- ACCESS CONTROL LOGIC END ---

  const leaveBalance = await LeaveBalance.findOneAndDelete({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!leaveBalance) {
    return next(new AppError("Leave balance not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Get leave balance summary
 */
exports.getLeaveBalanceSummary = catchAsync(async (req, res, next) => {
  let employeeId = req.params.employeeId;

  if (!employeeId) {
    employeeId = req.user._id;
  } else {
    const isOwner = req.user._id.toString() === employeeId.toString();
    const hasAccess = isPrivilegedUser(req.user.role);

    if (!isOwner && !hasAccess) {
      return next(new AppError("Permission denied", 403));
    }
  }

  const year = req.query.year || new Date().getFullYear();

  const [balance, applications] = await Promise.all([
    leaveService.getEmployeeLeaveBalance(employeeId, year, req.firmId), // ✅ Pass firmId to service

    require("../models/leaveApplicationModel").find({
      employee: employeeId,
      firmId: req.firmId, // ✅ ADD THIS
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
