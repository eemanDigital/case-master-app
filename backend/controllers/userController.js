// controllers/userController.js - UPDATED FOR NEW USER MODEL

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const filterObj = require("../utils/filterObj");
const sendMail = require("../utils/email");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const Firm = require("../models/firmModel");

// Create pagination service for User model
const userPagination = PaginationServiceFactory.createService(User);

/**
 * ✅ ENHANCED: Get all users with role and userType filtering support
 *
 * Query params:
 * - role: single role or comma-separated roles
 * - userType: single userType or comma-separated userTypes
 * - page, limit, search, etc.
 */
exports.getUsers = catchAsync(async (req, res, next) => {
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  if (debug) {
    console.log("\n🔍 [getUsers] Request Query:", req.query);
  }

  // ✅ Build custom filter
  let customFilter = {
    firmId: req.firmId,
    isDeleted: { $ne: true },
  };

  // Handle role filtering
  if (req.query.role) {
    const roles = req.query.role.split(",").map((r) => r.trim());
    customFilter.role = roles.length === 1 ? roles[0] : { $in: roles };
  }

  // Handle userType filtering
  if (req.query.userType) {
    const userTypes = req.query.userType.split(",").map((t) => t.trim());
    customFilter.userType =
      userTypes.length === 1 ? userTypes[0] : { $in: userTypes };
  }

  // Handle isLawyer filtering
  if (req.query.isLawyer) {
    customFilter.isLawyer = req.query.isLawyer === "true";
  }

  // Handle deleted items filter
  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  // ✅ Always include statistics
  const result = await userPagination.paginate(
    {
      ...req.query,
      includeStats: "true",
    },
    customFilter,
  );

  if (debug) {
    console.log("📊 Results:", {
      dataCount: result.data.length,
      totalRecords: result.pagination.totalRecords,
      currentPage: result.pagination.currentPage,
    });
  }

  res.status(200).json({
    success: true,
    message:
      result.data.length === 0
        ? "No users found"
        : "Users fetched successfully",
    data: result.data,
    pagination: {
      currentPage: result.pagination.currentPage,
      totalPages: result.pagination.totalPages,
      totalRecords: result.pagination.totalRecords,
      limit: result.pagination.limit,
      hasNextPage: result.pagination.hasNextPage,
      hasPrevPage: result.pagination.hasPrevPage,
    },
    statistics: result.statistics,
  });
});

/**
 * ✅ Get users by specific role (alternative endpoint)
 */
exports.getUsersByRole = catchAsync(async (req, res, next) => {
  const { role } = req.params;

  const customFilter = {
    firmId: req.firmId,
    role: role,
    isDeleted: { $ne: true },
  };

  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter,
  );

  res.status(200).json({
    success: true,
    message:
      result.data.length === 0
        ? `No ${role} users found`
        : `${role} users fetched successfully`,
    data: result.data,
    pagination: {
      currentPage: result.pagination.currentPage,
      totalPages: result.pagination.totalPages,
      totalRecords: result.pagination.totalRecords,
      limit: result.pagination.limit,
      hasNextPage: result.pagination.hasNextPage,
      hasPrevPage: result.pagination.hasPrevPage,
    },
    statistics: result.statistics,
  });
});

/**
 * ✅ Get users by userType
 */
exports.getUsersByUserType = catchAsync(async (req, res, next) => {
  const { userType } = req.params;

  // Validate userType
  const validUserTypes = ["client", "staff", "lawyer", "admin", "super-admin"];
  if (!validUserTypes.includes(userType)) {
    return next(
      new AppError(
        `Invalid user type. Must be one of: ${validUserTypes.join(", ")}`,
        400,
      ),
    );
  }

  const customFilter = {
    firmId: req.firmId,
    userType: userType,
    isDeleted: { $ne: true },
  };

  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter,
  );

  res.status(200).json({
    success: true,
    message:
      result.data.length === 0
        ? `No ${userType}s found`
        : `${userType}s fetched successfully`,
    data: result.data,
    pagination: result.pagination,
    statistics: result.statistics,
  });
});

/**
 * ✅ Get all lawyers
 */
exports.getAllLawyers = catchAsync(async (req, res, next) => {
  const customFilter = {
    firmId: req.firmId,
    userType: "lawyer",
    isDeleted: { $ne: true },
  };

  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter,
  );

  res.status(200).json({
    success: true,
    message:
      result.data.length === 0
        ? "No lawyers found"
        : "Lawyers fetched successfully",
    data: result.data,
    pagination: result.pagination,
    statistics: result.statistics,
  });
});

/**
 * ✅ Get all clients
 */
exports.getAllClients = catchAsync(async (req, res, next) => {
  const customFilter = {
    firmId: req.firmId,
    userType: "client",
    isDeleted: { $ne: true },
  };

  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter,
  );

  res.status(200).json({
    success: true,
    message:
      result.data.length === 0
        ? "No clients found"
        : "Clients fetched successfully",
    data: result.data,
    pagination: result.pagination,
    statistics: result.statistics,
  });
});

/**
 * ✅ PROFESSIONAL: Get staff by status (active/inactive)
 */
exports.getStaffByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  // Validate status parameter
  if (!["active", "inactive"].includes(status.toLowerCase())) {
    return next(new AppError("Status must be 'active' or 'inactive'", 400));
  }

  const isActive = status.toLowerCase() === "active";

  const customFilter = {
    firmId: req.firmId,
    userType: { $in: ["staff", "lawyer", "admin", "super-admin"] }, // All non-client types
    isActive: isActive,
    isDeleted: { $ne: true },
  };

  // Handle query overrides
  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  if (debug) {
    console.log(
      `🔍 [getStaffByStatus] Filtering ${status} staff:`,
      customFilter,
    );
  }

  const result = await userPagination.paginate(
    {
      ...req.query,
      includeStats: "true",
      ...(req.query.isActive && delete req.query.isActive),
    },
    customFilter,
  );

  res.status(200).json({
    success: true,
    message: `${isActive ? "Active" : "Inactive"} staff fetched successfully`,
    data: result.data,
    pagination: result.pagination,
    statistics: result.statistics,
    statusSummary: {
      status: status,
      isActive: isActive,
      count: result.data.length,
      total: result.pagination.totalRecords,
    },
  });
});

/**
 * ✅ PROFESSIONAL: Get clients by status (active/inactive)
 */
exports.getClientsByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  if (!["active", "inactive"].includes(status.toLowerCase())) {
    return next(new AppError("Status must be 'active' or 'inactive'", 400));
  }

  const isActive = status.toLowerCase() === "active";

  const customFilter = {
    firmId: req.firmId,
    userType: "client",
    isActive: isActive,
    isDeleted: { $ne: true },
  };

  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  if (debug) {
    console.log(
      `🔍 [getClientsByStatus] Filtering ${status} clients:`,
      customFilter,
    );
  }

  const result = await userPagination.paginate(
    {
      ...req.query,
      includeStats: "true",
      ...(req.query.isActive && delete req.query.isActive),
    },
    customFilter,
  );

  res.status(200).json({
    success: true,
    message: `${isActive ? "Active" : "Inactive"} clients fetched successfully`,
    data: result.data,
    pagination: result.pagination,
    statistics: result.statistics,
    statusSummary: {
      status: status,
      isActive: isActive,
      count: result.data.length,
      total: result.pagination.totalRecords,
    },
  });
});

/**
 * ✅ PROFESSIONAL: Get all users by status
 */
exports.getAllUsersByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  if (!["active", "inactive"].includes(status.toLowerCase())) {
    return next(new AppError("Status must be 'active' or 'inactive'", 400));
  }

  const isActive = status.toLowerCase() === "active";

  const customFilter = {
    firmId: req.firmId,
    isActive: isActive,
    isDeleted: { $ne: true },
  };

  // Allow userType filtering within the status
  if (req.query.userType) {
    const userTypes = req.query.userType.split(",").map((t) => t.trim());
    customFilter.userType =
      userTypes.length === 1 ? userTypes[0] : { $in: userTypes };
  }

  // Allow role filtering
  if (req.query.role) {
    const roles = req.query.role.split(",").map((r) => r.trim());
    customFilter.role = roles.length === 1 ? roles[0] : { $in: roles };
  }

  if (debug) {
    console.log(
      `🔍 [getAllUsersByStatus] Filtering ${status} users:`,
      customFilter,
    );
  }

  const result = await userPagination.paginate(
    {
      ...req.query,
      includeStats: "true",
      ...(req.query.isActive && delete req.query.isActive),
    },
    customFilter,
  );

  // Enhanced statistics with breakdown
  let enhancedStats = result.statistics || {};
  if (result.data.length > 0) {
    const userTypeBreakdown = result.data.reduce((acc, user) => {
      acc[user.userType] = (acc[user.userType] || 0) + 1;
      return acc;
    }, {});

    const roleBreakdown = result.data.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    enhancedStats = {
      ...enhancedStats,
      userTypeBreakdown,
      roleBreakdown,
    };
  }

  res.status(200).json({
    success: true,
    message: `${isActive ? "Active" : "Inactive"} users fetched successfully`,
    data: result.data,
    pagination: result.pagination,
    statistics: enhancedStats,
    statusSummary: {
      status: status,
      isActive: isActive,
      count: result.data.length,
      total: result.pagination.totalRecords,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * ✅ PROFESSIONAL: Get status statistics (aggregated counts)
 */
exports.getStatusStatistics = catchAsync(async (req, res, next) => {
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  try {
    // Get counts in parallel for efficiency
    const [
      activeClients,
      inactiveClients,
      activeStaff,
      inactiveStaff,
      activeLawyers,
      inactiveLawyers,
      activeAdmins,
      inactiveAdmins,
    ] = await Promise.all([
      // Active clients
      User.countDocuments({
        firmId: req.firmId,
        userType: "client",
        isActive: true,
        isDeleted: { $ne: true },
      }),
      // Inactive clients
      User.countDocuments({
        firmId: req.firmId,
        userType: "client",
        isActive: false,
        isDeleted: { $ne: true },
      }),
      // Active staff
      User.countDocuments({
        firmId: req.firmId,
        userType: "staff",
        isActive: true,
        isDeleted: { $ne: true },
      }),
      // Inactive staff
      User.countDocuments({
        firmId: req.firmId,
        userType: "staff",
        isActive: false,
        isDeleted: { $ne: true },
      }),
      // Active lawyers
      User.countDocuments({
        firmId: req.firmId,
        userType: "lawyer",
        isActive: true,
        isDeleted: { $ne: true },
      }),
      // Inactive lawyers
      User.countDocuments({
        firmId: req.firmId,
        userType: "lawyer",
        isActive: false,
        isDeleted: { $ne: true },
      }),
      // Active admins (including super-admin)
      User.countDocuments({
        firmId: req.firmId,
        userType: { $in: ["admin", "super-admin"] },
        isActive: true,
        isDeleted: { $ne: true },
      }),
      // Inactive admins
      User.countDocuments({
        firmId: req.firmId,
        userType: { $in: ["admin", "super-admin"] },
        isActive: false,
        isDeleted: { $ne: true },
      }),
    ]);

    const totalClients = activeClients + inactiveClients;
    const totalStaff = activeStaff + inactiveStaff;
    const totalLawyers = activeLawyers + inactiveLawyers;
    const totalAdmins = activeAdmins + inactiveAdmins;

    const statistics = {
      byUserType: {
        clients: {
          active: activeClients,
          inactive: inactiveClients,
          total: totalClients,
          activePercentage:
            totalClients > 0
              ? Math.round((activeClients / totalClients) * 100)
              : 0,
        },
        staff: {
          active: activeStaff,
          inactive: inactiveStaff,
          total: totalStaff,
          activePercentage:
            totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0,
        },
        lawyers: {
          active: activeLawyers,
          inactive: inactiveLawyers,
          total: totalLawyers,
          activePercentage:
            totalLawyers > 0
              ? Math.round((activeLawyers / totalLawyers) * 100)
              : 0,
        },
        admins: {
          active: activeAdmins,
          inactive: inactiveAdmins,
          total: totalAdmins,
          activePercentage:
            totalAdmins > 0
              ? Math.round((activeAdmins / totalAdmins) * 100)
              : 0,
        },
      },
      summary: {
        totalUsers: totalClients + totalStaff + totalLawyers + totalAdmins,
        totalActive: activeClients + activeStaff + activeLawyers + activeAdmins,
        totalInactive:
          inactiveClients + inactiveStaff + inactiveLawyers + inactiveAdmins,
        overallActivePercentage:
          totalClients + totalStaff + totalLawyers + totalAdmins > 0
            ? Math.round(
                ((activeClients + activeStaff + activeLawyers + activeAdmins) /
                  (totalClients + totalStaff + totalLawyers + totalAdmins)) *
                  100,
              )
            : 0,
      },
      timestamp: new Date().toISOString(),
    };

    if (debug) {
      console.log("📊 Status Statistics:", statistics);
    }

    res.status(200).json({
      success: true,
      message: "Status statistics fetched successfully",
      statistics: statistics,
    });
  } catch (error) {
    console.error("❌ Error fetching status statistics:", error);
    return next(new AppError("Failed to fetch status statistics", 500));
  }
});

/**
 * Get users by status
 */
exports.getUsersByStatus = catchAsync(async (req, res, next) => {
  const customFilter = {
    firmId: req.firmId,
    status: req.params.status,
    isDeleted: { $ne: true },
  };

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter,
  );

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    statistics: result.statistics,
  });
});

/**
 * Get active users only
 */
exports.getActiveUsers = catchAsync(async (req, res, next) => {
  const customFilter = {
    firmId: req.firmId,
    isActive: true,
    isDeleted: { $ne: true },
  };

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter,
  );

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    statistics: result.statistics,
  });
});

/**
 * ✅ Get user statistics only (no data)
 */
exports.getUserStatistics = catchAsync(async (req, res, next) => {
  const result = await userPagination.paginate(
    {
      page: 1,
      limit: 1,
      includeStats: "true",
    },
    { firmId: req.firmId, isDeleted: { $ne: true } },
  );

  res.status(200).json({
    success: true,
    statistics: result.statistics,
  });
});

/**
 * ✅ Get staff-specific statistics
 */
exports.getStaffStatistics = catchAsync(async (req, res, next) => {
  const customFilter = {
    firmId: req.firmId,
    userType: { $in: ["staff", "lawyer", "admin", "super-admin"] },
    isDeleted: { $ne: true },
  };

  const result = await userPagination.paginate(
    {
      page: 1,
      limit: 1,
      includeStats: "true",
    },
    customFilter,
  );

  res.status(200).json({
    success: true,
    statistics: result.statistics,
  });
});

/**
 * ✅ Get client-specific statistics
 */
exports.getClientStatistics = catchAsync(async (req, res, next) => {
  const customFilter = {
    firmId: req.firmId,
    userType: "client",
    isDeleted: { $ne: true },
  };

  const result = await userPagination.paginate(
    {
      page: 1,
      limit: 1,
      includeStats: "true",
    },
    customFilter,
  );

  res.status(200).json({
    success: true,
    statistics: result.statistics,
  });
});

/**
 * GET A USER (current user)
 */
exports.getUser = catchAsync(async (req, res, next) => {
  const data = await User.findOne({
    _id: req.user._id,
    firmId: req.firmId,
  })
    .populate({
      path: "task",
      select: "-assignedTo",
    })
    .populate({
      path: "firmId",
      select: "name address contact.email logo",
    })
    .lean();

  if (!data) {
    return next(new AppError("No user found with that Id", 404));
  }

  if (data.isDeleted) {
    return next(new AppError("This user account has been deleted", 404));
  }

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET A SINGLE USER (by ID)
 */
exports.getSingleUser = catchAsync(async (req, res, next) => {
  const data = await User.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  })
    .populate({
      path: "task",
      select: "-assignedTo",
    })
    .populate({
      path: "firmId",
      select: "name address contact.email logo",
    })
    .lean();

  if (!data) {
    return next(new AppError("No user found with that Id", 404));
  }

  if (data.isDeleted) {
    return next(new AppError("This user account has been deleted", 404));
  }

  // Hide sensitive information based on user role
  const safeData = { ...data };
  if (req.user.role !== "super-admin" && req.user.role !== "admin") {
    delete safeData.adminDetails;
    delete safeData.lawyerDetails?.hourlyRate;
    delete safeData.lawyerDetails?.retainerFee;
  }

  res.status(200).json({
    success: true,
    data: safeData,
  });
});

/**
 * UPDATE USER PROFILE
 */
exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400,
      ),
    );
  }

  // Filter allowed fields
  const allowedFields = [
    "firstName",
    "lastName",
    "middleName",
    "email",
    "photo",
    "address",
    "gender",
    "dateOfBirth",
    "phone",
    "bio",
    "isActive",
    "preferences",
  ];

  const filteredBody = filterObj(req.body, ...allowedFields);

  // Add type-specific fields based on userType
  const user = await User.findById(req.user.id);
  if (user) {
    switch (user.userType) {
      case "client":
        if (req.body.clientDetails) {
          filteredBody.clientDetails = req.body.clientDetails;
        }
        break;
      case "staff":
        if (req.body.staffDetails) {
          filteredBody.staffDetails = req.body.staffDetails;
        }
        break;
      case "lawyer":
        if (req.body.lawyerDetails) {
          filteredBody.lawyerDetails = req.body.lawyerDetails;
        }
        if (req.body.professionalInfo) {
          filteredBody.professionalInfo = req.body.professionalInfo;
        }
        break;
      case "admin":
        if (req.body.adminDetails) {
          filteredBody.adminDetails = req.body.adminDetails;
        }
        break;
    }
  }

  if (req.file) filteredBody.photo = req.file.cloudinaryUrl;

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: req.user.id,
      firmId: req.firmId,
    },
    filteredBody,
    { new: true, runValidators: true },
  );

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: {
      user: updatedUser,
    },
  });
});

/**
 * UPDATE USER PROFILE BY ADMIN
 */
exports.upgradeUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userType, role, position, isActive, ...otherFields } = req.body;

  // Find the user
  const user = await User.findOne({
    _id: id,
    firmId: req.firmId,
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  if (user.isDeleted) {
    return next(new AppError("Cannot update a deleted user account", 400));
  }

  // Check permission
  if (req.user.role === "admin" && user.role === "super-admin") {
    return next(new AppError("Admins cannot update super-admin accounts", 403));
  }

  // Update userType and role (only if different)
  if (userType && userType !== user.userType) {
    user.userType = userType;
    // Auto-set role based on userType
    if (userType === "client") {
      user.role = "client";
      user.position = null;
    } else if (userType === "lawyer") {
      user.role = "lawyer";
      user.isLawyer = true;
    } else if (userType === "admin") {
      user.role = role || "admin";
    } else if (userType === "staff") {
      user.role = role || "staff";
    }
  }

  // Update other fields
  if (role && user.userType !== "client") {
    user.role = role;
  }

  if (position && user.userType !== "client") {
    user.position = position;
  }

  if (typeof isActive !== "undefined") {
    user.isActive = isActive;
  }

  // Update type-specific details
  if (req.body.clientDetails && user.userType === "client") {
    user.clientDetails = { ...user.clientDetails, ...req.body.clientDetails };
  }

  if (req.body.staffDetails && user.userType === "staff") {
    user.staffDetails = { ...user.staffDetails, ...req.body.staffDetails };
  }

  if (req.body.lawyerDetails && user.userType === "lawyer") {
    user.lawyerDetails = { ...user.lawyerDetails, ...req.body.lawyerDetails };
  }

  if (
    req.body.adminDetails &&
    (user.userType === "admin" || user.userType === "super-admin")
  ) {
    user.adminDetails = { ...user.adminDetails, ...req.body.adminDetails };
  }

  if (req.body.professionalInfo) {
    user.professionalInfo = {
      ...user.professionalInfo,
      ...req.body.professionalInfo,
    };
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `User updated successfully`,
    data: user,
  });
});

/**
 * DELETE USER (Hard delete)
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndDelete({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(204).json({
    success: true,
    message: "User permanently deleted",
    data: null,
  });
});

/**
 * SOFT DELETE USER
 */
exports.softDeleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id, firmId: req.firmId });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  if (user.isDeleted) {
    return next(new AppError("User is already deleted", 400));
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.isActive = false;
  user.deletedBy = req.user._id;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "User soft deleted successfully",
    data: null,
  });
});

/**
 * RESTORE DELETED USER
 */
exports.restoreUser = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  if (!user.isDeleted) {
    return next(new AppError("User is not deleted", 400));
  }

  user.isDeleted = false;
  user.deletedAt = null;
  user.deletedBy = null;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "User restored successfully",
    data: user,
  });
});

/**
 * Send automated email to user
 */
exports.sendAutomatedEmail = catchAsync(async (req, res, next) => {
  const { send_to, reply_to, template, subject, url, context } = req.body;

  if (!send_to || !reply_to || !template || !subject) {
    return next(new AppError("Missing email fields", 400));
  }

  const user = await User.findOne({
    firmId: req.firmId,
    email: send_to,
    isDeleted: { $ne: true },
  });

  if (!user) {
    return next(new AppError("No active user found with that email", 404));
  }

  const send_from = process.env.SENDINBLUE_EMAIL;

  const baseContext = {
    ...context,
    name: user.firstName,
    userType: user.userType,
    link: `${process.env.FRONTEND_URL}/${url}`,
  };

  await sendMail(subject, send_to, send_from, reply_to, template, baseContext);

  res.status(200).json({
    success: true,
    message: "Email sent successfully",
  });
});

/**
 * Helper function to sanitize HTML for email
 */
const sanitizeForEmail = (maybeEncodedHtml) => {
  if (!maybeEncodedHtml) return "";

  const { decode } = require("html-entities");
  const sanitizeHtml = require("sanitize-html");

  const EMAIL_SANITIZE_OPTIONS = {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "blockquote",
      "h3",
      "h4",
    ],
    allowedAttributes: {},
    transformTags: {
      a: function (tagName, attribs) {
        return {
          tagName: "span",
          attribs: {},
        };
      },
    },
  };

  const decoded = decode(String(maybeEncodedHtml));
  return sanitizeHtml(decoded, EMAIL_SANITIZE_OPTIONS);
};

/**
 * Send automated custom/dynamic email handler
 */
exports.sendAutomatedCustomEmail = catchAsync(async (req, res, next) => {
  const { send_to, reply_to, template, subject, url, context } = req.body;
  const firm = await Firm.findById(req.firmId);

  if (!send_to || !reply_to || !template || !subject) {
    return next(new AppError("Missing email fields", 400));
  }

  const recipients = Array.isArray(send_to) ? send_to : [send_to];
  const devEmail = process.env.DEVELOPER_EMAIL;

  const baseContext = {
    ...context,
    link: `${process.env.FRONTEND_URL}/${url}`,
    year: new Date().getFullYear(),
    companyName: firm.name,
  };

  if (template === "caseReport" && baseContext.update) {
    baseContext.update = sanitizeForEmail(baseContext.update);
  }

  const sendEmailToRecipient = async (recipientEmail) => {
    let user = null;
    let fullContext = { ...baseContext };

    if (recipientEmail === devEmail) {
      fullContext.name = "Developer";
    } else {
      user = await User.findOne({
        email: recipientEmail,
        firmId: req.firmId,
        isDeleted: { $ne: true },
      });

      if (!user) {
        throw new AppError(
          `No active user found with email: ${recipientEmail}`,
          404,
        );
      }

      fullContext.name = user.firstName;
      fullContext.userType = user.userType;
      fullContext.position = user.position;
    }

    const send_from = process.env.SENDINBLUE_EMAIL;

    await sendMail(
      subject,
      recipientEmail,
      send_from,
      reply_to,
      template,
      fullContext,
    );
  };

  try {
    await Promise.all(recipients.map(sendEmailToRecipient));
    res.status(200).json({
      success: true,
      message: `Email${recipients.length > 1 ? "s" : ""} sent successfully`,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * ✅ Get users for select dropdowns (lightweight, unpaginated)
 * Query params:
 * - type: 'staff' | 'clients' | 'lawyers' | 'admins' | 'all'
 * - userType: specific userType filter
 * - includeInactive: 'true' | 'false' (default: false)
 */
exports.getUserSelectOptions = catchAsync(async (req, res, next) => {
  const { type = "staff", userType, includeInactive = "false" } = req.query;

  // Build filter
  let filter = {
    firmId: req.firmId,
    isDeleted: { $ne: true },
  };

  if (includeInactive !== "true") {
    filter.isActive = true;
  }

  // Apply type filter
  if (userType) {
    filter.userType = userType;
  } else {
    switch (type) {
      case "staff":
        filter.userType = { $in: ["staff", "lawyer", "admin", "super-admin"] };
        break;
      case "clients":
        filter.userType = "client";
        break;
      case "lawyers":
        filter.userType = "lawyer";
        break;
      case "admins":
        filter.userType = { $in: ["admin", "super-admin"] };
        break;
      case "hr":
        filter.role = "hr";
        break;
      case "all":
        // No additional filter
        break;
      default:
        filter.userType = { $in: ["staff", "lawyer", "admin", "super-admin"] };
    }
  }

  // Fetch only necessary fields
  const users = await User.find(filter)
    .select(
      "firstName lastName middleName email role userType position isLawyer practiceArea isActive lawyerDetails.practiceAreas",
    )
    .sort({ firstName: 1 })
    .lean();

  // Format for select dropdowns
  const options = users.map((user) => {
    let displayName = user.firstName || "";
    if (user.lastName) displayName += ` ${user.lastName}`;
    if (user.middleName) displayName += ` ${user.middleName}`;

    // Add context to display name
    if (!user.isActive) displayName += " (Inactive)";
    if (user.position) displayName += ` - ${user.position}`;

    // Add user type indicator for clarity
    if (user.userType === "client") displayName += " (Client)";
    if (user.userType === "lawyer") displayName += " (Lawyer)";

    return {
      value: user._id,
      label: displayName.trim(),
      email: user.email,
      role: user.role,
      userType: user.userType,
      isActive: user.isActive,
      isLawyer: user.isLawyer,
      position: user.position,
      practiceArea: user.practiceArea,
      lawyerPracticeAreas: user.lawyerDetails?.practiceAreas || [],
    };
  });

  res.status(200).json({
    success: true,
    message: `${type} options fetched successfully`,
    data: options,
    count: options.length,
  });
});

/**
 * ✅ Get multiple select option types in one request
 */
exports.getAllSelectOptions = catchAsync(async (req, res, next) => {
  const { includeInactive = "false" } = req.query;

  const baseFilter = {
    firmId: req.firmId,
    isDeleted: { $ne: true },
  };

  if (includeInactive !== "true") {
    baseFilter.isActive = true;
  }

  // Fetch all users once
  const allUsers = await User.find(baseFilter)
    .select(
      "firstName lastName middleName email role userType position isLawyer practiceArea isActive lawyerDetails.practiceAreas",
    )
    .sort({ firstName: 1 })
    .lean();

  // Helper function to format user
  const formatUser = (user) => {
    let displayName = user.firstName || "";
    if (user.lastName) displayName += ` ${user.lastName}`;
    if (user.middleName) displayName += ` ${user.middleName}`;
    if (!user.isActive) displayName += " (Inactive)";
    if (user.position) displayName += ` - ${user.position}`;

    return {
      value: user._id,
      label: displayName.trim(),
      email: user.email,
      role: user.role,
      userType: user.userType,
      isActive: user.isActive,
      isLawyer: user.isLawyer,
      position: user.position,
      practiceArea: user.practiceArea,
      lawyerPracticeAreas: user.lawyerDetails?.practiceAreas || [],
    };
  };

  // Categorize users by userType
  const options = {
    clients: allUsers.filter((u) => u.userType === "client").map(formatUser),
    staff: allUsers.filter((u) => u.userType === "staff").map(formatUser),
    lawyers: allUsers.filter((u) => u.userType === "lawyer").map(formatUser),
    admins: allUsers
      .filter((u) => u.userType === "admin" || u.userType === "super-admin")
      .map(formatUser),
    all: allUsers.map(formatUser),
  };

  // Add role-based categories for backward compatibility
  options.hr = allUsers.filter((u) => u.role === "hr").map(formatUser);

  res.status(200).json({
    success: true,
    message: "All select options fetched successfully",
    data: options,
    counts: {
      clients: options.clients.length,
      staff: options.staff.length,
      lawyers: options.lawyers.length,
      admins: options.admins.length,
      hr: options.hr.length,
      total: options.all.length,
    },
  });
});

module.exports = exports;
