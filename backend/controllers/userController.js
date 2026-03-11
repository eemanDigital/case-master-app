// controllers/userController.js - UPDATED FOR NEW USER MODEL

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const filterObj = require("../utils/filterObj");
const { sendMail, sendCustomEmail } = require("../utils/email");
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
/**
 * ✅ ENHANCED: Get all users with role and userType filtering support
 *
 * Query params:
 * - role: single role or comma-separated roles OR array format role[$in][0]=value
 * - userType: single userType or comma-separated userTypes
 * - page, limit, search, etc.
 */
exports.getUsers = catchAsync(async (req, res, next) => {
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  if (debug) {
    console.log(
      "\n🔍 [getUsers] Request Query:",
      JSON.stringify(req.query, null, 2),
    );
    console.log("📋 Raw Query Keys:", Object.keys(req.query));
  }

  // ✅ Build custom filter
  let customFilter = {
    firmId: req.firmId,
    isDeleted: { $ne: true },
  };

  // Handle role filtering - COMPLETELY REWRITTEN
  if (req.query.role !== undefined && req.query.role !== null) {
    if (debug) {
      console.log("👤 Role parameter:", {
        type: typeof req.query.role,
        value: req.query.role,
        isArray: Array.isArray(req.query.role),
        isObject: typeof req.query.role === "object",
        keys:
          typeof req.query.role === "object"
            ? Object.keys(req.query.role)
            : "N/A",
      });
    }

    // Case 1: Simple string (not an object) - e.g., role=admin or role=admin,lawyer
    if (typeof req.query.role === "string") {
      // Check if it's comma-separated
      if (req.query.role.includes(",")) {
        const roles = req.query.role.split(",").map((r) => r.trim());
        customFilter.role = roles.length === 1 ? roles[0] : { $in: roles };
      } else {
        // Single role
        customFilter.role = req.query.role;
      }
    }
    // Case 2: Object with $in property (parsed by Express from role[$in][0]=admin)
    else if (
      typeof req.query.role === "object" &&
      req.query.role !== null &&
      !Array.isArray(req.query.role)
    ) {
      // Check if it has $in property
      if (req.query.role.$in !== undefined) {
        const roles = Array.isArray(req.query.role.$in)
          ? req.query.role.$in
          : [req.query.role.$in];
        customFilter.role = { $in: roles };
      }
      // Check if it's an object with numeric keys like { '0': 'admin', '1': 'lawyer' }
      else if (Object.keys(req.query.role).every((key) => !isNaN(key))) {
        const roles = Object.values(req.query.role);
        customFilter.role = { $in: roles };
      }
      // Empty object - skip it
      else if (Object.keys(req.query.role).length === 0) {
        // Don't add role filter
      }
      // Some other object format
      else {
        // Try to use it as-is (for MongoDB operators)
        customFilter.role = req.query.role;
      }
    }
    // Case 3: Array (rare but possible)
    else if (Array.isArray(req.query.role)) {
      customFilter.role =
        req.query.role.length === 1
          ? req.query.role[0]
          : { $in: req.query.role };
    }
    // Case 4: Other types (number, boolean) - convert to string
    else {
      customFilter.role = String(req.query.role);
    }
  }

  // Handle userType filtering - same pattern
  if (req.query.userType !== undefined && req.query.userType !== null) {
    if (debug) {
      console.log("👤 userType parameter:", {
        type: typeof req.query.userType,
        value: req.query.userType,
      });
    }

    if (typeof req.query.userType === "string") {
      if (req.query.userType.includes(",")) {
        const userTypes = req.query.userType.split(",").map((t) => t.trim());
        customFilter.userType =
          userTypes.length === 1 ? userTypes[0] : { $in: userTypes };
      } else {
        customFilter.userType = req.query.userType;
      }
    } else if (
      typeof req.query.userType === "object" &&
      req.query.userType !== null &&
      !Array.isArray(req.query.userType)
    ) {
      if (req.query.userType.$in !== undefined) {
        const userTypes = Array.isArray(req.query.userType.$in)
          ? req.query.userType.$in
          : [req.query.userType.$in];
        customFilter.userType = { $in: userTypes };
      } else if (Object.keys(req.query.userType).every((key) => !isNaN(key))) {
        const userTypes = Object.values(req.query.userType);
        customFilter.userType = { $in: userTypes };
      } else if (Object.keys(req.query.userType).length === 0) {
        // Skip empty object
      } else {
        customFilter.userType = req.query.userType;
      }
    } else if (Array.isArray(req.query.userType)) {
      customFilter.userType =
        req.query.userType.length === 1
          ? req.query.userType[0]
          : { $in: req.query.userType };
    } else {
      customFilter.userType = String(req.query.userType);
    }
  }

  // Handle isLawyer filtering
  if (req.query.isLawyer !== undefined && req.query.isLawyer !== null) {
    customFilter.isLawyer = req.query.isLawyer === "true";
  }

  // Handle deleted items filter
  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  // Clean up any empty objects in the filter
  Object.keys(customFilter).forEach((key) => {
    if (
      customFilter[key] &&
      typeof customFilter[key] === "object" &&
      !Array.isArray(customFilter[key]) &&
      Object.keys(customFilter[key]).length === 0
    ) {
      delete customFilter[key];
    }
  });

  if (debug) {
    console.log(
      "🔧 Final Custom Filter:",
      JSON.stringify(customFilter, null, 2),
    );
  }

  try {
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
  } catch (error) {
    console.error("❌ Pagination error in getUsers:", error);

    // Return a graceful error response
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid filter value for ${error.path}: ${error.value}`,
        error: error.message,
      });
    }

    throw error; // Let the global error handler handle it
  }
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
      select: "name address contact.email logo subscription limits usage",
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
// controllers/userController.js - UPDATE upgradeUser function
exports.upgradeUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    userType,
    role,
    position,
    isActive,
    additionalRoles,
    ...otherFields
  } = req.body;

  console.log("🔄 Upgrade User Request:", {
    userId: id,
    body: req.body,
  });

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

  if (req.user.role === "admin" && user.role === "super-admin") {
    return next(new AppError("Admins cannot update super-admin accounts", 403));
  }

  // Update userType and role
  if (userType && userType !== user.userType) {
    user.userType = userType;
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

  if (role && user.userType !== "client") {
    user.role = role;
  }

  if (position !== undefined && user.userType !== "client") {
    user.position = position;
  }

  if (typeof isActive !== "undefined") {
    user.isActive = isActive;
  }

  // ✅ Handle additional roles
  if (additionalRoles !== undefined) {
    user.additionalRoles = Array.isArray(additionalRoles)
      ? additionalRoles
      : [];
  }

  // ✅ Handle isLawyer flag
  if (req.body.isLawyer !== undefined) {
    user.isLawyer = req.body.isLawyer;
  }

  // Update type-specific details
  if (req.body.clientDetails && user.userType === "client") {
    user.clientDetails = { ...user.clientDetails, ...req.body.clientDetails };
  }

  if (req.body.staffDetails && user.userType === "staff") {
    user.staffDetails = { ...user.staffDetails, ...req.body.staffDetails };
  }

  if (req.body.lawyerDetails && (user.userType === "lawyer" || user.isLawyer)) {
    user.lawyerDetails = { ...user.lawyerDetails, ...req.body.lawyerDetails };
  }

  if (
    req.body.adminDetails &&
    (user.userType === "admin" ||
      user.userType === "super-admin" ||
      user.additionalRoles?.includes("admin"))
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

  console.log("✅ User updated:", {
    id: user._id,
    userType: user.userType,
    role: user.role,
    additionalRoles: user.additionalRoles,
    isLawyer: user.isLawyer,
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: {
      user: {
        id: user._id,
        userType: user.userType,
        role: user.role,
        position: user.position,
        isActive: user.isActive,
        additionalRoles: user.additionalRoles,
        isLawyer: user.isLawyer,
        effectiveRoles: user.getEffectiveRoles(),
      },
    },
  });
});

/**
 * DELETE USER (Hard delete)
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  // Prevent users from permanently deleting themselves
  if (user._id.equals(req.user._id)) {
    return next(
      new AppError("You cannot permanently delete your own account", 400),
    );
  }

  await User.findByIdAndDelete(req.params.id);

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

  // Prevent users from deleting themselves
  if (user._id.equals(req.user._id)) {
    return next(new AppError("You cannot delete your own account", 400));
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
  user.isActive = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "User restored successfully",
    data: user,
  });
});

/**
 * GET DELETED USERS (Archive)
 */
exports.getDeletedUsers = catchAsync(async (req, res, next) => {
  const customFilter = {
    firmId: req.firmId,
    isDeleted: true,
  };

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter,
  );

  res.status(200).json({
    success: true,
    message:
      result.data.length === 0
        ? "No deleted users found"
        : "Deleted users fetched successfully",
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
 * Send custom email with HTML content and attachments
 * SECURITY: Added input validation, sanitization, and audit logging
 */
exports.sendCustomEmail = catchAsync(async (req, res, next) => {
  // Handle both JSON and FormData (Multer puts fields in req.body)
  let { send_to, reply_to, subject, htmlContent, textContent, attachment } =
    req.body;

  // With upload.any(), fields might be in req.body but need parsing
  if (!subject && req.body.subject) {
    subject = req.body.subject;
  }
  if (!send_to && req.body.send_to) {
    send_to = req.body.send_to;
  }
  if (!reply_to && req.body.reply_to) {
    reply_to = req.body.reply_to;
  }
  if (!htmlContent && req.body.htmlContent) {
    htmlContent = req.body.htmlContent;
  }
  if (!textContent && req.body.textContent) {
    textContent = req.body.textContent;
  }
  if (!attachment && req.body.attachment) {
    attachment = req.body.attachment;
  }

  // Security: Validate and sanitize inputs
  if (!subject || typeof subject !== "string") {
    return next(new AppError("Subject is required", 400));
  }

  // Validate textContent is a string if provided
  if (textContent !== undefined && typeof textContent !== "string") {
    textContent = String(textContent);
  }

  // Security: Sanitize subject to prevent header injection
  subject = subject.replace(/[\r\n]/g, "").trim();
  if (subject.length > 200) {
    return next(new AppError("Subject too long (max 200 characters)", 400));
  }

  // Parse send_to if it comes as string from FormData
  let recipients = [];
  if (typeof send_to === "string") {
    recipients = [send_to];
  } else if (Array.isArray(send_to)) {
    recipients = send_to;
  }

  // Security: Validate recipients
  if (!recipients.length) {
    return next(new AppError("At least one recipient is required", 400));
  }

  // Security: Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const email of recipients) {
    if (!emailRegex.test(email)) {
      return next(new AppError(`Invalid email address: ${email}`, 400));
    }
  }

  // Security: Limit number of recipients
  if (recipients.length > 50) {
    return next(new AppError("Maximum 50 recipients allowed", 400));
  }

  // Handle attachments from FormData (files)
  let processedAttachments = [];
  let totalAttachmentSize = 0;

  // Security: Check file upload count
  if (req.files && req.files.length > 10) {
    return next(new AppError("Maximum 10 files allowed", 400));
  }

  // Check for uploaded files (from Multer)
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      totalAttachmentSize += file.size;
      if (file.size > 10 * 1024 * 1024) {
        return next(
          new AppError(`File ${file.originalname} exceeds 10MB limit`, 400),
        );
      }
      processedAttachments.push({
        content: file.buffer.toString("base64"),
        filename: file.originalname,
      });
    }
  }

  // Security: Check total attachment size (max 20MB)
  if (totalAttachmentSize > 20 * 1024 * 1024) {
    return next(new AppError("Total attachments exceed 20MB limit", 400));
  }

  // Check for attachment data (from JSON or stringified FormData)
  if (attachment) {
    try {
      const attachmentsArray =
        typeof attachment === "string" ? JSON.parse(attachment) : attachment;

      const atts = Array.isArray(attachmentsArray)
        ? attachmentsArray
        : [attachmentsArray];

      for (const att of atts) {
        if (att.content && att.filename) {
          // Security: Validate base64 size
          const estSize = (att.content.length * 3) / 4;
          if (estSize > 10 * 1024 * 1024) {
            return next(
              new AppError(
                `Attachment ${att.filename} exceeds 10MB limit`,
                400,
              ),
            );
          }
          processedAttachments.push({
            content: att.content,
            filename: att.filename,
          });
        }
      }
    } catch (e) {
      console.log("Could not parse attachments:", e.message);
    }
  }

  if (!recipients.length || !subject) {
    return next(new AppError("Recipient(s) and subject are required", 400));
  }

  const firm = await Firm.findById(req.firmId);
  const send_from = process.env.SENDINBLUE_EMAIL || process.env.EMAIL_FROM;
  const devEmail = process.env.DEVELOPER_EMAIL;

  // Convert markdown-like formatting to HTML
  const convertToHtml = (text) => {
    if (!text) return "";

    let html = text
      // Escape HTML characters first
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Convert markdown to HTML
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.*?)__/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
      // Convert line breaks to paragraphs
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    return `<p>${html}</p>`;
  };

  // Security: Sanitize HTML content to prevent XSS in email
  const sanitizeHtml = (html) => {
    if (!html) return "";
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  };

  // Convert text content to HTML if only text is provided
  let htmlContentToUse = htmlContent;
  if (!htmlContentToUse && textContent) {
    htmlContentToUse = convertToHtml(textContent);
  }

  // Default HTML with sanitization
  const defaultHtmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${firm?.name || "Law Firm"}</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        ${htmlContentToUse ? sanitizeHtml(htmlContentToUse) : "<p>Please find below important information from your legal team.</p>"}
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${firm?.name || "Law Firm"}. All rights reserved.</p>
      </div>
    </div>
  `;

  // Use provided HTML with sanitization (or converted from text)
  const finalHtmlContent = htmlContent
    ? sanitizeHtml(htmlContent) + defaultHtmlContent
    : defaultHtmlContent;

  const sendEmailToRecipient = async (recipientEmail) => {
    let user = null;
    let personalizedHtml = finalHtmlContent;
    let personalizedText = textContent;

    // Personalize for known users
    if (recipientEmail !== devEmail) {
      user = await User.findOne({
        email: recipientEmail,
        firmId: req.firmId,
        isDeleted: { $ne: true },
      });

      if (user) {
        // Security: Sanitize name before inserting
        const safeName = (user.firstName || "Client").replace(/[<>]/g, "");
        personalizedHtml = personalizedHtml.replace(/\{\{name\}\}/g, safeName);
        personalizedText =
          personalizedText?.replace(/\{\{name\}\}/g, safeName) || "";
      }
    }

    await sendCustomEmail(
      subject,
      recipientEmail,
      send_from,
      reply_to || send_from,
      personalizedHtml,
      processedAttachments,
      personalizedText,
    );
  };

  try {
    await Promise.all(recipients.map(sendEmailToRecipient));

    // Security: Log email activity for audit (without sensitive data)
    console.log(
      `📧 [AUDIT] Custom email sent: subject="${subject}", recipients=${recipients.length}, attachments=${processedAttachments.length}, by=${req.user?._id}`,
    );

    res.status(200).json({
      success: true,
      message: `Custom email${recipients.length > 1 ? "s" : ""} sent successfully`,
      data: {
        recipients: recipients.length,
        attachmentsCount: processedAttachments.length,
      },
    });
  } catch (error) {
    console.error("Custom email error:", error);
    return next(new AppError(`Failed to send email: ${error.message}`, 500));
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

/**
 * REQUEST PLAN UPGRADE
 */
exports.requestPlanUpgrade = catchAsync(async (req, res, next) => {
  const { targetPlan } = req.body;

  if (!targetPlan || !["BASIC", "PRO", "ENTERPRISE"].includes(targetPlan)) {
    return next(new AppError("Invalid plan selected", 400));
  }

  const firm = await Firm.findById(req.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  const currentPlan = firm.subscription?.plan || "FREE";

  if (currentPlan === targetPlan) {
    return next(new AppError(`You are already on the ${targetPlan} plan`, 400));
  }

  const planPrices = {
    BASIC: "₦5,000/month",
    PRO: "₦15,000/month",
    ENTERPRISE: "Custom pricing",
  };

  const platformEmail =
    process.env.PLATFORM_ADMIN_EMAIL || "admin@lawmaster.ng";
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const emailSubject = `Plan Upgrade Request - ${firm.name}`;
  const emailContext = {
    subject: emailSubject,
    baseUrl,
    adminUrl: `${baseUrl}/admin/firms`,
    year: new Date().getFullYear(),
    firmName: firm.name,
    currentPlan: currentPlan,
    targetPlan: targetPlan,
    price: planPrices[targetPlan],
    requestedBy: `${req.user.firstName} ${req.user.lastName}`,
    requestedAt: new Date().toLocaleString(),
    firmEmail: firm.contact?.email || "N/A",
    firmPhone: firm.phone || "N/A",
  };

  try {
    await sendMail(
      emailSubject,
      platformEmail,
      req.user.email,
      req.user.email,
      "planUpgradeRequest",
      emailContext,
    );
  } catch (emailError) {
    console.error("Failed to send upgrade email:", emailError.message);
  }

  res.status(200).json({
    success: true,
    message:
      "Upgrade request submitted successfully. Our team will contact you shortly.",
    data: {
      currentPlan,
      targetPlan,
      requestedAt: new Date(),
    },
  });
});

module.exports = exports;
