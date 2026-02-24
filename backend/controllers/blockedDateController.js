const BlockedDate = require("../models/blockedDateModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ============================================
// HELPER FUNCTIONS
// ============================================

const buildFirmQuery = (req, additionalFilters = {}) => {
  return {
    firmId: req.user.firmId,
    isDeleted: false,
    ...additionalFilters,
  };
};

/**
 * Get all effective roles for a user.
 * Combines primary role + additionalRoles + isLawyer flag.
 * Mirrors the same logic used in authController.
 */
const getEffectiveRoles = (user) => {
  const roles = [user.role];
  if (user.additionalRoles && user.additionalRoles.length > 0) {
    roles.push(...user.additionalRoles);
  }
  if (user.isLawyer) {
    roles.push("lawyer");
  }
  return [...new Set(roles)];
};

/**
 * Check if user has ANY of the specified roles (primary or additional).
 */
const hasAnyRole = (user, ...roles) => {
  if (user.role === "super-admin" || user.userType === "super-admin")
    return true;
  const effectiveRoles = getEffectiveRoles(user);
  return roles.some((r) => effectiveRoles.includes(r));
};

/**
 * Check if user holds a senior position.
 * "Principal" and "Partner" variants are POSITIONS in the userModel, not roles.
 */
const hasSeniorPosition = (user) => {
  if (user.role === "super-admin" || user.userType === "super-admin")
    return true;

  const seniorPositions = [
    "Managing Partner",
    "Senior Partner",
    "Partner",
    "Principal",
    "Head of Chambers",
  ];

  return seniorPositions.includes(user.position);
};

/**
 * Can manage blocked dates:
 * Valid roles from userModel — "super-admin", "admin", "lawyer", "hr", "secretary"
 * Also allows users with senior positions (Partner, Principal, etc.)
 */
const canManageBlock = (user) => {
  if (hasSeniorPosition(user)) return true;
  return hasAnyRole(user, "super-admin", "admin", "lawyer", "hr", "secretary");
};

/**
 * Can grant/revoke exceptions:
 * Only senior positions OR super-admin / admin roles
 */
const canManageExceptions = (user) => {
  if (hasSeniorPosition(user)) return true;
  return hasAnyRole(user, "super-admin", "admin");
};

/**
 * Can block specific users (sensitive operation):
 * Only senior positions OR super-admin
 */
const canBlockSpecificUsers = (user) => {
  if (hasSeniorPosition(user)) return true;
  return hasAnyRole(user, "super-admin");
};

// ============================================
// CREATE BLOCKED DATE
// ============================================

/**
 * @desc    Create a blocked date/time slot
 * @route   POST /api/calendar/blocked-dates
 * @access  Private (Admin, Lawyer, HR, Secretary, Senior Positions)
 */
exports.createBlockedDate = catchAsync(async (req, res, next) => {
  if (!canManageBlock(req.user)) {
    return next(new AppError("You do not have permission to block dates", 403));
  }

  const { blockScope, blockedUsers, ...blockData } = req.body;

  // Only senior positions or super-admin can block specific users
  if (blockScope === "specific_users" && !canBlockSpecificUsers(req.user)) {
    return next(
      new AppError(
        "Only principals, partners, or super-admins can block specific users",
        403,
      ),
    );
  }

  const block = await BlockedDate.create({
    ...blockData,
    blockScope,
    blockedUsers,
    firmId: req.user.firmId,
    createdBy: req.user._id,
  });

  await block.populate("createdBy", "firstName lastName email");

  res.status(201).json({
    status: "success",
    data: { block },
  });
});

// ============================================
// GET ALL BLOCKED DATES
// ============================================

/**
 * @desc    Get all blocked dates
 * @route   GET /api/calendar/blocked-dates
 * @access  Private
 */
exports.getAllBlockedDates = catchAsync(async (req, res, next) => {
  const {
    startDate,
    endDate,
    blockScope,
    isActive,
    page = 1,
    limit = 50,
  } = req.query;

  const filter = buildFirmQuery(req);

  if (startDate && endDate) {
    filter.startDate = { $lte: new Date(endDate) };
    filter.endDate = { $gte: new Date(startDate) };
  }

  if (blockScope) filter.blockScope = blockScope;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const skip = (page - 1) * limit;

  const blocks = await BlockedDate.find(filter)
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("createdBy", "firstName lastName email")
    .populate("blockedUsers", "firstName lastName email")
    .populate("exceptions.user", "firstName lastName")
    .populate("exceptions.grantedBy", "firstName lastName");

  const total = await BlockedDate.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: blocks.length,
    total,
    page: Number(page),
    data: { blocks },
  });
});

// ============================================
// GET SINGLE BLOCKED DATE
// ============================================

/**
 * @desc    Get single blocked date by ID
 * @route   GET /api/calendar/blocked-dates/:id
 * @access  Private
 */
exports.getBlockedDate = catchAsync(async (req, res, next) => {
  const block = await BlockedDate.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  )
    .populate("createdBy", "firstName lastName email phone")
    .populate("blockedUsers", "firstName lastName email role")
    .populate("exceptions.user", "firstName lastName email")
    .populate("exceptions.grantedBy", "firstName lastName");

  if (!block) {
    return next(new AppError("Blocked date not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { block },
  });
});

// ============================================
// UPDATE BLOCKED DATE
// ============================================

/**
 * @desc    Update blocked date
 * @route   PATCH /api/calendar/blocked-dates/:id
 * @access  Private (Admin, Lawyer, HR, Secretary, Senior Positions)
 */
exports.updateBlockedDate = catchAsync(async (req, res, next) => {
  if (!canManageBlock(req.user)) {
    return next(
      new AppError("You do not have permission to update blocked dates", 403),
    );
  }

  const block = await BlockedDate.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  );

  if (!block) {
    return next(new AppError("Blocked date not found", 404));
  }

  const allowedUpdates = [
    "title",
    "reason",
    "description",
    "blockCategory",
    "isActive",
    "enforceStrict",
    "allowOverride",
    "overrideRoles",
    "warningMessage",
    "startDate",
    "endDate",
    "startTime",
    "endTime",
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      block[field] = req.body[field];
    }
  });

  block.lastModifiedBy = req.user._id;
  await block.save();

  res.status(200).json({
    status: "success",
    data: { block },
  });
});

// ============================================
// DELETE BLOCKED DATE
// ============================================

/**
 * @desc    Delete (soft delete) blocked date
 * @route   DELETE /api/calendar/blocked-dates/:id
 * @access  Private (Admin, Lawyer, HR, Secretary, Senior Positions)
 */
exports.deleteBlockedDate = catchAsync(async (req, res, next) => {
  if (!canManageBlock(req.user)) {
    return next(
      new AppError("You do not have permission to delete blocked dates", 403),
    );
  }

  const block = await BlockedDate.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  );

  if (!block) {
    return next(new AppError("Blocked date not found", 404));
  }

  await block.softDelete(req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ============================================
// RESTORE BLOCKED DATE
// ============================================

/**
 * @desc    Restore a deleted blocked date
 * @route   PATCH /api/calendar/blocked-dates/:id/restore
 * @access  Private (Admin, Lawyer, HR, Secretary, Senior Positions)
 */
exports.restoreBlockedDate = catchAsync(async (req, res, next) => {
  if (!canManageBlock(req.user)) {
    return next(
      new AppError("You do not have permission to restore blocked dates", 403),
    );
  }

  const block = await BlockedDate.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
    isDeleted: true,
  });

  if (!block) {
    return next(new AppError("Deleted blocked date not found", 404));
  }

  await block.restore();

  res.status(200).json({
    status: "success",
    data: { block },
  });
});

// ============================================
// GRANT EXCEPTION TO USER
// ============================================

/**
 * @desc    Grant exception to a user for a blocked date
 * @route   POST /api/calendar/blocked-dates/:id/exceptions
 * @access  Private (Senior Positions, Admin, Super-Admin)
 */
exports.grantException = catchAsync(async (req, res, next) => {
  if (!canManageExceptions(req.user)) {
    return next(
      new AppError(
        "Only principals, partners, admins, or super-admins can grant exceptions",
        403,
      ),
    );
  }

  const { userId, reason } = req.body;

  const block = await BlockedDate.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  );

  if (!block) {
    return next(new AppError("Blocked date not found", 404));
  }

  const existingException = block.exceptions.find(
    (e) => e.user.toString() === userId,
  );

  if (existingException) {
    return next(new AppError("Exception already granted to this user", 400));
  }

  await block.grantException(userId, req.user._id, reason);
  await block.populate("exceptions.user", "firstName lastName email");

  res.status(200).json({
    status: "success",
    message: "Exception granted successfully",
    data: { block },
  });
});

// ============================================
// REVOKE EXCEPTION FROM USER
// ============================================

/**
 * @desc    Revoke exception from a user
 * @route   DELETE /api/calendar/blocked-dates/:id/exceptions/:userId
 * @access  Private (Senior Positions, Admin, Super-Admin)
 */
exports.revokeException = catchAsync(async (req, res, next) => {
  if (!canManageExceptions(req.user)) {
    return next(
      new AppError(
        "Only principals, partners, admins, or super-admins can revoke exceptions",
        403,
      ),
    );
  }

  const { userId } = req.params;

  const block = await BlockedDate.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  );

  if (!block) {
    return next(new AppError("Blocked date not found", 404));
  }

  await block.revokeException(userId);

  res.status(200).json({
    status: "success",
    message: "Exception revoked successfully",
    data: { block },
  });
});

// ============================================
// CHECK IF DATE IS BLOCKED
// ============================================

/**
 * @desc    Check if a specific date/time is blocked
 * @route   POST /api/calendar/blocked-dates/check
 * @access  Private
 */
exports.checkIfBlocked = catchAsync(async (req, res, next) => {
  const { startDateTime, endDateTime, eventType } = req.body;

  if (!startDateTime || !endDateTime) {
    return next(new AppError("Start and end date/time are required", 400));
  }

  const blockCheck = await BlockedDate.isDateBlocked(
    req.user.firmId,
    req.user._id,
    new Date(startDateTime),
    new Date(endDateTime),
    eventType,
    req.user.role,
  );

  res.status(200).json({
    status: "success",
    data: {
      isBlocked: blockCheck.isBlocked,
      hasWarning: blockCheck.hasWarning,
      message: blockCheck.message,
      block: blockCheck.block || null,
    },
  });
});

// ============================================
// GET BLOCKED DATES IN RANGE
// ============================================

/**
 * @desc    Get all blocked dates within a date range
 * @route   GET /api/calendar/blocked-dates/range
 * @access  Private
 */
exports.getBlockedDatesInRange = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError("Start and end dates are required", 400));
  }

  const blocks = await BlockedDate.getBlockedDatesInRange(
    req.user.firmId,
    new Date(startDate),
    new Date(endDate),
    req.user._id,
  );

  res.status(200).json({
    status: "success",
    results: blocks.length,
    data: { blocks },
  });
});

// ============================================
// GET MY BLOCKED DATES
// ============================================

/**
 * @desc    Get blocked dates that affect the logged-in user
 * @route   GET /api/calendar/blocked-dates/my-blocks
 * @access  Private
 */
exports.getMyBlockedDates = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const filter = buildFirmQuery(req, { isActive: true });

  if (startDate && endDate) {
    filter.startDate = { $lte: new Date(endDate) };
    filter.endDate = { $gte: new Date(startDate) };
  }

  const blocks = await BlockedDate.find(filter);

  const relevantBlocks = blocks.filter((block) => {
    if (block.blockScope === "firm_wide") return true;

    if (block.blockScope === "specific_users") {
      return block.blockedUsers.some(
        (u) => u.toString() === req.user._id.toString(),
      );
    }

    return false;
  });

  res.status(200).json({
    status: "success",
    results: relevantBlocks.length,
    data: { blocks: relevantBlocks },
  });
});

module.exports = exports;
