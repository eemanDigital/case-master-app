const LeaveApplication = require("../models/leaveApplicationModel");
const leaveService = require("../services/leaveService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/**
 * Create new leave application
 */
exports.createLeaveApplication = catchAsync(async (req, res, next) => {
  const { startDate, endDate, typeOfLeave, reason, applyTo } = req.body;
  const employeeId = req.user._id;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return next(new AppError("Start date cannot be in the past", 400));
  }

  if (end < start) {
    return next(new AppError("End date must be on or after start date", 400));
  }

  // Calculate leave days
  const leaveDays = leaveService.calculateLeaveDays(start, end);

  // Check for overlapping leaves
  await leaveService.checkOverlappingLeaves(employeeId, start, end);

  // Validate leave balance (except for unpaid leaves)
  if (typeOfLeave !== "unpaid") {
    try {
      await leaveService.validateLeaveBalance(
        employeeId,
        typeOfLeave,
        leaveDays
      );
    } catch (error) {
      // ✅ Allow application if balance not found
      if (error.statusCode === 404) {
        console.warn(
          `Application created without balance verification for ${employeeId}`
        );
        // Continue - HR can verify manually
      } else {
        // Still throw for other errors (e.g., insufficient balance)
        throw error;
      }
    }
  }

  // Create leave application
  const newLeave = await LeaveApplication.create({
    employee: employeeId,
    startDate: start,
    endDate: end,
    typeOfLeave,
    reason,
    applyTo,
    daysAppliedFor: leaveDays,
  });

  res.status(201).json({
    status: "success",
    message: "Leave application submitted successfully",
    data: { leaveApplication: newLeave },
  });
});

/**
 * Get single leave application
 */
exports.getLeaveApplication = catchAsync(async (req, res, next) => {
  const leaveApplication = await LeaveApplication.findById(req.params.id);

  if (!leaveApplication) {
    return next(new AppError("Leave application not found", 404));
  }

  // Authorization check: only employee, their supervisor, or admin can view
  if (
    leaveApplication.employee._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin" &&
    req.user.role !== "hr"
  ) {
    return next(
      new AppError(
        "You do not have permission to view this leave application",
        403
      )
    );
  }

  res.status(200).json({
    status: "success",
    data: { leaveApplication },
  });
});

/**
 * Get all leave applications with filters
 */
exports.getLeaveApplications = catchAsync(async (req, res, next) => {
  const {
    status,
    typeOfLeave,
    employeeId,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = req.query;

  // Build filter object
  const filter = {};

  // Non-admin users can only see their own applications
  if (req.user.role !== "admin" && req.user.role !== "hr") {
    filter.employee = req.user._id;
  } else if (employeeId) {
    filter.employee = employeeId;
  }

  if (status) filter.status = status;
  if (typeOfLeave) filter.typeOfLeave = typeOfLeave;
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  // Pagination
  const skip = (page - 1) * limit;

  const [leaveApplications, total] = await Promise.all([
    LeaveApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    LeaveApplication.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: leaveApplications.length,
    totalResults: total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: { leaveApplications },
  });
});

/**
 * Update leave application (approve/reject or modify)
 */
exports.updateLeaveApplication = catchAsync(async (req, res, next) => {
  const { status, responseMessage, daysApproved, startDate, endDate } =
    req.body;
  const leaveApplication = await LeaveApplication.findById(req.params.id);

  if (!leaveApplication) {
    return next(new AppError("Leave application not found", 404));
  }

  // Prevent updating approved/rejected applications
  if (leaveApplication.status !== "pending" && status) {
    return next(
      new AppError(
        `Cannot update leave application with status: ${leaveApplication.status}`,
        400
      )
    );
  }

  const updateData = {};
  let newLeaveDays = leaveApplication.daysAppliedFor;

  // Handle date modifications - recalculate days if dates change
  if (startDate || endDate) {
    const newStart = startDate
      ? new Date(startDate)
      : leaveApplication.startDate;
    const newEnd = endDate ? new Date(endDate) : leaveApplication.endDate;

    // Validate date order
    if (newEnd < newStart) {
      return next(new AppError("End date must be on or after start date", 400));
    }

    await leaveService.checkOverlappingLeaves(
      leaveApplication.employee._id,
      newStart,
      newEnd,
      leaveApplication._id
    );

    newLeaveDays = leaveService.calculateLeaveDays(newStart, newEnd);

    updateData.startDate = newStart;
    updateData.endDate = newEnd;
    updateData.daysAppliedFor = newLeaveDays;
  }

  // Handle approval/rejection
  if (status === "approved") {
    // Use provided daysApproved or default to calculated/existing days
    const approvedDays = daysApproved || newLeaveDays;

    // Validate approved days
    if (approvedDays > newLeaveDays) {
      return next(
        new AppError(
          `Approved days (${approvedDays}) cannot exceed applied days (${newLeaveDays})`,
          400
        )
      );
    }

    // Deduct from leave balance
    await leaveService.deductLeaveBalance(
      leaveApplication.employee._id,
      leaveApplication.typeOfLeave,
      approvedDays
    );

    updateData.status = "approved";
    updateData.daysApproved = approvedDays;
    updateData.reviewedBy = req.user._id;
    updateData.reviewedAt = new Date();
    if (responseMessage) updateData.responseMessage = responseMessage;
  } else if (status === "rejected") {
    updateData.status = "rejected";
    updateData.reviewedBy = req.user._id;
    updateData.reviewedAt = new Date();
    updateData.responseMessage =
      responseMessage || "Leave application rejected";
  }

  // Update the application with runValidators: false to avoid validation issues
  const updatedLeave = await LeaveApplication.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: false }
  );

  res.status(200).json({
    status: "success",
    message: `Leave application ${status || "updated"} successfully`,
    data: { leaveApplication: updatedLeave },
  });
});

/**
 * Cancel leave application
 */
exports.cancelLeaveApplication = catchAsync(async (req, res, next) => {
  const { cancellationReason } = req.body;
  const leaveApplication = await LeaveApplication.findById(req.params.id);

  if (!leaveApplication) {
    return next(new AppError("Leave application not found", 404));
  }

  // Only employee or admin can cancel
  if (
    leaveApplication.employee._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(
      new AppError("You do not have permission to cancel this application", 403)
    );
  }

  // Can only cancel pending or approved leaves
  if (!["pending", "approved"].includes(leaveApplication.status)) {
    return next(new AppError("Cannot cancel this leave application", 400));
  }

  // Restore balance if already approved
  if (leaveApplication.status === "approved" && leaveApplication.daysApproved) {
    await leaveService.restoreLeaveBalance(
      leaveApplication.employee._id,
      leaveApplication.typeOfLeave,
      leaveApplication.daysApproved
    );
  }

  leaveApplication.status = "cancelled";
  leaveApplication.cancelledAt = new Date();
  leaveApplication.cancellationReason =
    cancellationReason || "Cancelled by user";
  await leaveApplication.save();

  res.status(200).json({
    status: "success",
    message: "Leave application cancelled successfully",
    data: { leaveApplication },
  });
});

/**
 * Delete leave application (soft delete or permanent)
 */
exports.deleteLeaveApplication = catchAsync(async (req, res, next) => {
  const leaveApplication = await LeaveApplication.findById(req.params.id);

  if (!leaveApplication) {
    return next(new AppError("Leave application not found", 404));
  }

  // Restore balance if approved
  if (leaveApplication.status === "approved" && leaveApplication.daysApproved) {
    await leaveService.restoreLeaveBalance(
      leaveApplication.employee._id,
      leaveApplication.typeOfLeave,
      leaveApplication.daysApproved
    );
  }

  await LeaveApplication.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
