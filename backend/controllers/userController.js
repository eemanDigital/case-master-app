// controllers/userController.js - ENHANCED WITH ROLE FILTERING

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const filterObj = require("../utils/filterObj");
const sendMail = require("../utils/email");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");

// Create pagination service for User model
const userPagination = PaginationServiceFactory.createService(User);

/**
 * ✅ ENHANCED: Get all users with role filtering support
 *
 * Query params:
 * - role: single role or comma-separated roles (e.g., "client" or "staff,admin,hr")
 * - page, limit, search, etc.
 */
exports.getUsers = catchAsync(async (req, res, next) => {
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  if (debug) {
    console.log("\n🔍 [getUsers] Request Query:", req.query);
  }

  // ✅ Build custom filter for role(s)
  let customFilter = {
    isDeleted: { $ne: true },
  };

  // Handle role filtering
  if (req.query.role) {
    const roles = req.query.role.split(",").map((r) => r.trim());

    if (roles.length === 1) {
      customFilter.role = roles[0];
    } else {
      customFilter.role = { $in: roles };
    }

    if (debug) {
      console.log("🎭 Role filter applied:", customFilter.role);
    }
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
    customFilter
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
    customFilter
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
 * Get users by status
 */

/**
 * ✅ PROFESSIONAL: Get staff by status (active/inactive)
 * Query: ?status=active or ?status=inactive
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
    role: { $ne: "client" }, // Staff = all non-client roles
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
      customFilter
    );
  }

  const result = await userPagination.paginate(
    {
      ...req.query,
      includeStats: "true",
      // Ensure we don't override the status filter
      ...(req.query.isActive && delete req.query.isActive),
    },
    customFilter
  );

  res.status(200).json({
    success: true,
    message: `${isActive ? "Active" : "Inactive"} staff fetched successfully`,
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
 * Query: ?status=active or ?status=inactive
 */
exports.getClientsByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  // Validate status parameter
  if (!["active", "active", "inactive"].includes(status.toLowerCase())) {
    return next(new AppError("Status must be 'active' or 'inactive'", 400));
  }

  const isActive = status.toLowerCase() === "active";

  const customFilter = {
    role: "client",
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
      `🔍 [getClientsByStatus] Filtering ${status} clients:`,
      customFilter
    );
  }

  const result = await userPagination.paginate(
    {
      ...req.query,
      includeStats: "true",
      // Ensure we don't override the status filter
      ...(req.query.isActive && delete req.query.isActive),
    },
    customFilter
  );

  res.status(200).json({
    success: true,
    message: `${isActive ? "Active" : "Inactive"} clients fetched successfully`,
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
    statusSummary: {
      status: status,
      isActive: isActive,
      count: result.data.length,
      total: result.pagination.totalRecords,
    },
  });
});

/**
 * ✅ PROFESSIONAL: Get all users by status (mixed staff & clients)
 * Useful for admin dashboard showing all inactive users across system
 */
exports.getAllUsersByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  // Validate status parameter
  if (!["active", "inactive"].includes(status.toLowerCase())) {
    return next(new AppError("Status must be 'active' or 'inactive'", 400));
  }

  const isActive = status.toLowerCase() === "active";

  const customFilter = {
    isActive: isActive,
    isDeleted: { $ne: true },
  };

  // Handle query overrides
  if (req.query.includeDeleted === "true") {
    delete customFilter.isDeleted;
  } else if (req.query.onlyDeleted === "true") {
    customFilter.isDeleted = true;
  }

  // Allow role filtering within the status
  if (req.query.role) {
    const roles = req.query.role.split(",").map((r) => r.trim());
    if (roles.length === 1) {
      customFilter.role = roles[0];
    } else {
      customFilter.role = { $in: roles };
    }
  }

  if (debug) {
    console.log(
      `🔍 [getAllUsersByStatus] Filtering ${status} users:`,
      customFilter
    );
  }

  const result = await userPagination.paginate(
    {
      ...req.query,
      includeStats: "true",
      // Ensure we don't override the status filter
      ...(req.query.isActive && delete req.query.isActive),
    },
    customFilter
  );

  // Enhanced statistics with breakdown
  let enhancedStats = result.statistics || {};
  if (result.data.length > 0) {
    // Calculate role breakdown within this status
    const roleBreakdown = result.data.reduce((acc, user) => {
      if (user.role === "client") {
        acc.clients = (acc.clients || 0) + 1;
      } else {
        acc.staff = (acc.staff || 0) + 1;
        acc[user.role] = (acc[user.role] || 0) + 1;
      }
      return acc;
    }, {});

    enhancedStats = {
      ...enhancedStats,
      statusBreakdown: roleBreakdown,
    };
  }

  res.status(200).json({
    success: true,
    message: `${isActive ? "Active" : "Inactive"} users fetched successfully`,
    data: result.data,
    pagination: {
      currentPage: result.pagination.currentPage,
      totalPages: result.pagination.totalPages,
      totalRecords: result.pagination.totalRecords,
      limit: result.pagination.limit,
      hasNextPage: result.pagination.hasNextPage,
      hasPrevPage: result.pagination.hasPrevPage,
    },
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
 * Returns counts of active/inactive for both staff and clients
 */
exports.getStatusStatistics = catchAsync(async (req, res, next) => {
  const debug =
    process.env.DEBUG_QUERIES === "true" || req.query.debug === "true";

  try {
    // Get counts in parallel for efficiency
    const [
      activeStaffCount,
      inactiveStaffCount,
      activeClientCount,
      inactiveClientCount,
      totalStaffCount,
      totalClientCount,
    ] = await Promise.all([
      // Active staff
      User.countDocuments({
        role: { $ne: "client" },
        isActive: true,
        isDeleted: { $ne: true },
      }),
      // Inactive staff
      User.countDocuments({
        role: { $ne: "client" },
        isActive: false,
        isDeleted: { $ne: true },
      }),
      // Active clients
      User.countDocuments({
        role: "client",
        isActive: true,
        isDeleted: { $ne: true },
      }),
      // Inactive clients
      User.countDocuments({
        role: "client",
        isActive: false,
        isDeleted: { $ne: true },
      }),
      // Total staff (for verification)
      User.countDocuments({
        role: { $ne: "client" },
        isDeleted: { $ne: true },
      }),
      // Total clients (for verification)
      User.countDocuments({
        role: "client",
        isDeleted: { $ne: true },
      }),
    ]);

    // Verify counts match
    const staffVerification =
      totalStaffCount === activeStaffCount + inactiveStaffCount;
    const clientVerification =
      totalClientCount === activeClientCount + inactiveClientCount;

    const statistics = {
      staff: {
        active: activeStaffCount,
        inactive: inactiveStaffCount,
        total: totalStaffCount,
        activePercentage:
          totalStaffCount > 0
            ? Math.round((activeStaffCount / totalStaffCount) * 100)
            : 0,
        verification: staffVerification ? "valid" : "mismatch",
      },
      clients: {
        active: activeClientCount,
        inactive: inactiveClientCount,
        total: totalClientCount,
        activePercentage:
          totalClientCount > 0
            ? Math.round((activeClientCount / totalClientCount) * 100)
            : 0,
        verification: clientVerification ? "valid" : "mismatch",
      },
      overall: {
        totalActive: activeStaffCount + activeClientCount,
        totalInactive: inactiveStaffCount + inactiveClientCount,
        grandTotal: totalStaffCount + totalClientCount,
        overallActivePercentage:
          totalStaffCount + totalClientCount > 0
            ? Math.round(
                ((activeStaffCount + activeClientCount) /
                  (totalStaffCount + totalClientCount)) *
                  100
              )
            : 0,
      },
      summary: {
        totalUsers: totalStaffCount + totalClientCount,
        totalActive: activeStaffCount + activeClientCount,
        totalInactive: inactiveStaffCount + inactiveClientCount,
        staffRatio:
          totalStaffCount > 0
            ? Math.round((activeStaffCount / totalStaffCount) * 100)
            : 0,
        clientRatio:
          totalClientCount > 0
            ? Math.round((activeClientCount / totalClientCount) * 100)
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

//
exports.getUsersByStatus = catchAsync(async (req, res, next) => {
  const customFilter = {
    status: req.params.status,
    isDeleted: { $ne: true },
  };

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter
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
    isActive: true,
    isDeleted: { $ne: true },
  };

  const result = await userPagination.paginate(
    { ...req.query, includeStats: "true" },
    customFilter
  );

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    statistics: result.statistics,
  });
});

/**
 * ✅ NEW: Get user statistics only (no data)
 */
exports.getUserStatistics = catchAsync(async (req, res, next) => {
  // Get statistics without paginated data
  const result = await userPagination.paginate({
    page: 1,
    limit: 1,
    includeStats: "true",
  });

  res.status(200).json({
    success: true,
    statistics: result.statistics,
  });
});

/**
 * ✅ NEW: Get staff-specific statistics
 * Returns stats for staff members only (excluding clients)
 */
exports.getStaffStatistics = catchAsync(async (req, res, next) => {
  const customFilter = {
    role: { $ne: "client" },
    isDeleted: { $ne: true },
  };

  const result = await userPagination.paginate(
    {
      page: 1,
      limit: 1,
      includeStats: "true",
    },
    customFilter
  );

  res.status(200).json({
    success: true,
    statistics: result.statistics,
  });
});

/**
 * ✅ NEW: Get client-specific statistics
 */
exports.getClientStatistics = catchAsync(async (req, res, next) => {
  const customFilter = {
    role: "client",
    isDeleted: { $ne: true },
  };

  const result = await userPagination.paginate(
    {
      page: 1,
      limit: 1,
      includeStats: "true",
    },
    customFilter
  );

  res.status(200).json({
    success: true,
    statistics: result.statistics,
  });
});

// ... rest of your existing controller methods remain the same ...

/**
 * GET A USER (current user)
 */
exports.getUser = catchAsync(async (req, res, next) => {
  const data = await User.findById(req.user._id)
    .populate({
      path: "task",
      select: "-assignedTo",
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
  const data = await User.findById(req.params.id)
    .populate({
      path: "task",
      select: "-assignedTo",
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
 * UPDATE USER PROFILE
 */
exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  const filteredBody = filterObj(
    req.body,
    "email",
    "firstName",
    "lastName",
    "secondName",
    "middleName",
    "photo",
    "address",
    "bio",
    "phone",
    "yearOfCall",
    "otherPosition",
    "practiceArea",
    "universityAttended",
    "lawSchoolAttended",
    "isActive"
  );

  if (req.file) filteredBody.photo = req.file.cloudinaryUrl;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

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
  const { role, position, isActive } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  if (user.isDeleted) {
    return next(new AppError("Cannot update a deleted user account", 400));
  }

  if (user.role !== "client") {
    user.role = role;
    user.position = position;
    user.isActive = isActive;
  } else {
    if (role || position) {
      return next(
        new AppError("Clients can only have their active status updated.", 400)
      );
    }
    user.isActive = isActive;
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
  const user = await User.findByIdAndDelete(req.params.id);

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
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  if (user.isDeleted) {
    return next(new AppError("User is already deleted", 400));
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.isActive = false;
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
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  if (!user.isDeleted) {
    return next(new AppError("User is not deleted", 400));
  }

  user.isDeleted = false;
  user.deletedAt = null;
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

  const user = await User.findOne({ email: send_to, isDeleted: { $ne: true } });
  if (!user) {
    return next(new AppError("No active user found with that email", 404));
  }

  const send_from = process.env.SENDINBLUE_EMAIL;

  const baseContext = {
    ...context,
    name: user.firstName,
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

  if (!send_to || !reply_to || !template || !subject) {
    return next(new AppError("Missing email fields", 400));
  }

  const recipients = Array.isArray(send_to) ? send_to : [send_to];
  const devEmail = process.env.DEVELOPER_EMAIL;

  const baseContext = {
    ...context,
    link: `${process.env.FRONTEND_URL}/${url}`,
    year: new Date().getFullYear(),
    companyName: process.env.COMPANY_NAME || "A.T Lukman & Co",
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
        isDeleted: { $ne: true },
      });
      if (!user) {
        throw new AppError(
          `No active user found with email: ${recipientEmail}`,
          404
        );
      }
      fullContext.name = user.firstName;
    }

    const send_from = process.env.SENDINBLUE_EMAIL;

    await sendMail(
      subject,
      recipientEmail,
      send_from,
      reply_to,
      template,
      fullContext
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
 * - includeInactive: 'true' | 'false' (default: false)
 */
exports.getUserSelectOptions = catchAsync(async (req, res, next) => {
  const { type = "staff", includeInactive = "false" } = req.query;

  // Build filter based on type
  let filter = {
    isDeleted: { $ne: true },
  };

  // Only include active users by default
  if (includeInactive !== "true") {
    filter.isActive = true;
  }

  // Apply type filter
  switch (type) {
    case "staff":
      filter.role = { $ne: "client" };
      break;
    case "clients":
      filter.role = "client";
      break;
    case "lawyers":
      filter.isLawyer = true;
      filter.role = { $ne: "client" };
      break;
    case "admins":
      filter.role = { $in: ["admin", "super-admin"] };
      break;
    case "hr":
      filter.role = "hr";
      break;
    case "all":
      // No additional role filter
      break;
    default:
      filter.role = { $ne: "client" };
  }

  // Fetch only necessary fields for select options
  const users = await User.find(filter)
    .select(
      "firstName lastName middleName email role position isLawyer practiceArea isActive"
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
    if (user.role === "client") displayName += " (Client)";
    if (user.position) displayName += ` - ${user.position}`;

    return {
      value: user._id,
      label: displayName.trim(),
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isLawyer: user.isLawyer,
      position: user.position,
      practiceArea: user.practiceArea,
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
 * ✅ Get multiple select option types in one request (for efficiency) no pagination
 */
exports.getAllSelectOptions = catchAsync(async (req, res, next) => {
  const { includeInactive = "false" } = req.query;

  const baseFilter = {
    isDeleted: { $ne: true },
  };

  if (includeInactive !== "true") {
    baseFilter.isActive = true;
  }

  // Fetch all users once with minimal fields
  const allUsers = await User.find(baseFilter)
    .select(
      "firstName lastName middleName email role position isLawyer practiceArea isActive"
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
      isActive: user.isActive,
      isLawyer: user.isLawyer,
      position: user.position,
      practiceArea: user.practiceArea,
    };
  };

  // Categorize users
  const options = {
    staff: allUsers.filter((u) => u.role !== "client").map(formatUser),

    clients: allUsers.filter((u) => u.role === "client").map(formatUser),

    lawyers: allUsers
      .filter((u) => u.isLawyer === true && u.role !== "client")
      .map(formatUser),

    admins: allUsers
      .filter((u) => ["admin", "super-admin"].includes(u.role))
      .map(formatUser),

    hr: allUsers.filter((u) => u.role === "hr").map(formatUser),

    all: allUsers.map(formatUser),
  };

  res.status(200).json({
    success: true,
    message: "All select options fetched successfully",
    data: options,
    counts: {
      staff: options.staff.length,
      clients: options.clients.length,
      lawyers: options.lawyers.length,
      admins: options.admins.length,
      hr: options.hr.length,
      total: options.all.length,
    },
  });
});
module.exports = exports;
