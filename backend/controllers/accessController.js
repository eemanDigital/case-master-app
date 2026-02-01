const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**
 * ===============================
 * UTILITY FUNCTION TO GET ALL USER ROLES
 * ===============================
 */
const getAllUserRoles = (user) => {
  const roles = new Set();

  // Add primary role
  if (user.role) {
    roles.add(user.role);
  }

  // Add userType as role for compatibility
  if (user.userType) {
    roles.add(user.userType);
  }

  // Add additional roles
  if (user.additionalRoles && user.additionalRoles.length > 0) {
    user.additionalRoles.forEach((role) => roles.add(role));
  }

  // Add isLawyer flag as "lawyer" role
  if (user.isLawyer === true) {
    roles.add("lawyer");
  }

  return Array.from(roles);
};

/**
 * ===============================
 * CHECK IF USER HAS SUPER ADMIN OR ADMIN PRIVILEGE
 * This is the most important check - super-admin/admin in any role
 * ===============================
 */
const hasSuperOrAdminPrivilege = (user) => {
  if (!user) return false;

  // Check primary role
  if (user.role === "super-admin" || user.userType === "super-admin") {
    return true;
  }

  // Check additional roles for super-admin/admin
  if (user.additionalRoles && user.additionalRoles.length > 0) {
    if (
      user.additionalRoles.includes("super-admin") ||
      user.additionalRoles.includes("admin")
    ) {
      return true;
    }
  }

  return false;
};

/**
 * ===============================
 * CHECK IF USER HAS ANY OF THE REQUIRED ROLES
 * ===============================
 */
const hasAnyRole = (user, requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) {
    return false;
  }

  // First check: Super admin or admin in ANY role has access to everything
  if (hasSuperOrAdminPrivilege(user)) {
    return true;
  }

  const userRoles = getAllUserRoles(user);

  return requiredRoles.some((requiredRole) => userRoles.includes(requiredRole));
};

/**
 * ===============================
 * CHECK IF USER HAS ALL REQUIRED ROLES
 * ===============================
 */
const hasAllRoles = (user, requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Super admin or admin in ANY role has all privileges
  if (hasSuperOrAdminPrivilege(user)) {
    return true;
  }

  const userRoles = getAllUserRoles(user);

  return requiredRoles.every((requiredRole) =>
    userRoles.includes(requiredRole),
  );
};

/**
 * ===============================
 * GET USER'S HIGHEST PRIVILEGE LEVEL
 * ===============================
 */
const getUserPrivilegeLevel = (user) => {
  if (!user) return 0;

  const userRoles = getAllUserRoles(user);

  // Define privilege hierarchy
  const privilegeLevels = {
    "super-admin": 100,
    admin: 90,
    lawyer: 80,
    hr: 70,
    secretary: 60,
    staff: 50,
    client: 10,
  };

  let highestLevel = 0;
  userRoles.forEach((role) => {
    const level = privilegeLevels[role] || 0;
    if (level > highestLevel) {
      highestLevel = level;
    }
  });

  return highestLevel;
};

/**
 * ===============================
 * RESTRICT TO ROLES (UPDATED WITH ADDITIONAL ROLES)
 * ===============================
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (hasAnyRole(req.user, roles)) {
      return next();
    }

    return next(
      new AppError("You do not have permission to perform this action", 403),
    );
  };
};

/**
 * ===============================
 * RESTRICT TO USER TYPES (UPDATED)
 * ===============================
 */
exports.restrictToUserTypes = (...userTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Super admin or admin in ANY role can access any user type
    if (hasSuperOrAdminPrivilege(req.user)) {
      return next();
    }

    if (!userTypes.includes(req.user.userType)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

/**
 * ===============================
 * HAS PRIVILEGE (ANY OF THE SPECIFIED PRIVILEGES)
 * ===============================
 */
exports.hasPrivilege = (...privileges) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (hasAnyRole(req.user, privileges)) {
      return next();
    }

    return next(
      new AppError("You do not have permission to perform this action", 403),
    );
  };
};

/**
 * ===============================
 * REQUIRE ALL PRIVILEGES
 * ===============================
 */
exports.requireAllPrivileges = (...privileges) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (hasAllRoles(req.user, privileges)) {
      return next();
    }

    return next(
      new AppError(
        "You do not have all required permissions to perform this action",
        403,
      ),
    );
  };
};

/**
 * ===============================
 * CHECK ADMIN PERMISSION WITH ADDITIONAL ROLES
 * IMPORTANT: Super-admin or admin in ANY role can manage everything
 * ===============================
 */
exports.canManageUsers = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can always manage users
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  // Check if user has admin role with canManageUsers permission
  if (userRoles.includes("admin")) {
    if (
      req.user.adminDetails &&
      req.user.adminDetails.canManageUsers === true
    ) {
      return next();
    }
  }

  // HR role can also manage users (non-admin users)
  if (userRoles.includes("hr")) {
    return next();
  }

  return next(new AppError("You do not have permission to manage users", 403));
};

exports.canManageCases = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can always manage cases
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  // Lawyers can manage cases
  if (userRoles.includes("lawyer")) {
    return next();
  }

  // Admins with canManageCases permission
  if (userRoles.includes("admin")) {
    if (
      req.user.adminDetails &&
      req.user.adminDetails.canManageCases === true
    ) {
      return next();
    }
  }

  return next(new AppError("You do not have permission to manage cases", 403));
};

exports.canManageBilling = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can always manage billing
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  // Admins with canManageBilling permission
  if (userRoles.includes("admin")) {
    if (
      req.user.adminDetails &&
      req.user.adminDetails.canManageBilling === true
    ) {
      return next();
    }
  }

  // Special: Lawyers with billing permission in additional roles
  if (
    userRoles.includes("lawyer") &&
    req.user.additionalRoles &&
    req.user.additionalRoles.includes("billing-manager")
  ) {
    return next();
  }

  return next(
    new AppError("You do not have permission to manage billing", 403),
  );
};

exports.canViewReports = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can always view reports
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  // Admins with canViewReports permission
  if (userRoles.includes("admin")) {
    if (
      req.user.adminDetails &&
      req.user.adminDetails.canViewReports === true
    ) {
      return next();
    }
  }

  // Lawyers can view reports related to their cases
  if (userRoles.includes("lawyer")) {
    return next();
  }

  // HR can view staff reports
  if (userRoles.includes("hr")) {
    return next();
  }

  return next(new AppError("You do not have permission to view reports", 403));
};

/**
 * ===============================
 * ROLE-SPECIFIC PERMISSION MIDDLEWARE
 * ===============================
 */

// For lawyer-specific actions
exports.isLawyer = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can perform lawyer actions
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  if (userRoles.includes("lawyer")) {
    return next();
  }

  return next(new AppError("This action requires lawyer privileges", 403));
};

// For HR-specific actions
exports.isHR = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can perform HR actions
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  if (userRoles.includes("hr")) {
    return next();
  }

  return next(new AppError("This action requires HR privileges", 403));
};

// For secretary-specific actions
exports.isSecretary = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can perform secretary actions
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  if (userRoles.includes("secretary")) {
    return next();
  }

  return next(new AppError("This action requires secretary privileges", 403));
};

/**
 * ===============================
 * FLEXIBLE PERMISSION CHECKER
 * ===============================
 */
exports.checkPermission = (permissionChecker) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Super admin or admin in ANY role bypasses all checks
    if (hasSuperOrAdminPrivilege(req.user)) {
      return next();
    }

    // Get all user roles for the permission checker
    const userRoles = getAllUserRoles(req.user);

    // Create enhanced user object
    const enhancedUser = {
      ...(req.user.toObject ? req.user.toObject() : req.user),
      allRoles: userRoles,
      isSuperOrAdmin: hasSuperOrAdminPrivilege(req.user),
      privilegeLevel: getUserPrivilegeLevel(req.user),
    };

    // Custom permission logic
    if (permissionChecker(enhancedUser)) {
      return next();
    }

    return next(
      new AppError("You do not have permission to perform this action", 403),
    );
  };
};

/**
 * ===============================
 * COMBINED PERMISSION MIDDLEWARE
 * ===============================
 */

// For case management
exports.canAccessCases = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can always access cases
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  // Lawyers can access cases
  if (userRoles.includes("lawyer")) {
    return next();
  }

  // Admins with canManageCases permission
  if (userRoles.includes("admin")) {
    if (
      req.user.adminDetails &&
      req.user.adminDetails.canManageCases === true
    ) {
      return next();
    }
  }

  // Secretaries can access cases for document management
  if (userRoles.includes("secretary")) {
    return next();
  }

  return next(new AppError("You do not have permission to access cases", 403));
};

// For client management
exports.canAccessClients = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can always access clients
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  // Lawyers can access clients
  if (userRoles.includes("lawyer")) {
    return next();
  }

  // Admins with user management permission
  if (userRoles.includes("admin")) {
    if (
      req.user.adminDetails &&
      req.user.adminDetails.canManageUsers === true
    ) {
      return next();
    }
  }

  // Secretaries can access clients for scheduling
  if (userRoles.includes("secretary")) {
    return next();
  }

  // HR can access client information for reporting
  if (userRoles.includes("hr")) {
    return next();
  }

  return next(
    new AppError("You do not have permission to access clients", 403),
  );
};

// For document management
exports.canManageDocuments = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can always manage documents
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  const userRoles = getAllUserRoles(req.user);

  // Lawyers can manage documents
  if (userRoles.includes("lawyer")) {
    return next();
  }

  // Admins can manage documents
  if (userRoles.includes("admin")) {
    return next();
  }

  // Secretaries can manage documents
  if (userRoles.includes("secretary")) {
    return next();
  }

  return next(
    new AppError("You do not have permission to manage documents", 403),
  );
};

// For system settings management (highest privilege)
exports.canManageSettings = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Only super-admin or admin in ANY role can manage system settings
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  return next(
    new AppError("You do not have permission to manage system settings", 403),
  );
};

// For audit and logs access
exports.canViewAuditLogs = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can view audit logs
  if (hasSuperOrAdminPrivilege(req.user)) {
    return next();
  }

  // HR with audit permission can view logs
  const userRoles = getAllUserRoles(req.user);
  if (
    userRoles.includes("hr") &&
    req.user.additionalRoles &&
    req.user.additionalRoles.includes("auditor")
  ) {
    return next();
  }

  return next(
    new AppError("You do not have permission to view audit logs", 403),
  );
};

/**
 * ===============================
 * CHECK VERIFIED USER
 * ===============================
 */
exports.isVerified = catchAsync(async (req, res, next) => {
  if (req.user && req.user.isVerified) {
    return next();
  } else {
    return next(new AppError("Account Not Verified", 403));
  }
});

/**
 * ===============================
 * PERMISSION LEVEL CHECKER
 * ===============================
 */
exports.hasPermissionLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Super admin or admin in ANY role automatically has highest level
    if (hasSuperOrAdminPrivilege(req.user)) {
      return next();
    }

    // Define permission levels
    const permissionLevels = {
      client: 10,
      staff: 20,
      secretary: 30,
      hr: 40,
      lawyer: 50,
      admin: 90,
      "super-admin": 100,
    };

    const userRoles = getAllUserRoles(req.user);

    // Get the highest permission level from user's roles
    let userLevel = 0;
    userRoles.forEach((role) => {
      const level = permissionLevels[role] || 0;
      if (level > userLevel) {
        userLevel = level;
      }
    });

    // Check if user meets minimum level
    if (userLevel >= minLevel) {
      return next();
    }

    return next(
      new AppError(
        "Your permission level is insufficient for this action",
        403,
      ),
    );
  };
};

/**
 * ===============================
 * CHECK IF USER CAN MANAGE OTHER USERS
 * (For user hierarchy - higher roles can manage lower roles)
 * ===============================
 */
exports.canManageUser = (targetUserField = "params.id") => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Super admin or admin in ANY role can manage any user
    if (hasSuperOrAdminPrivilege(req.user)) {
      return next();
    }

    // Get target user ID from the specified field
    const targetUserId = req.params.id || req.body.userId || req.query.userId;

    if (!targetUserId) {
      return next(new AppError("Target user not specified", 400));
    }

    // Don't need to check if managing self (allow self-update)
    if (targetUserId === req.user.id.toString()) {
      return next();
    }

    // Get target user
    const User = require("../models/userModel");
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return next(new AppError("Target user not found", 404));
    }

    // Get privilege levels
    const currentUserLevel = getUserPrivilegeLevel(req.user);
    const targetUserLevel = getUserPrivilegeLevel(targetUser);

    // User can only manage users with lower privilege level
    if (currentUserLevel > targetUserLevel) {
      return next();
    }

    return next(
      new AppError("You do not have permission to manage this user", 403),
    );
  });
};

/**
 * ===============================
 * FIRM-SPECIFIC PERMISSION CHECKER
 * ===============================
 */
exports.isFirmMember = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin or admin in ANY role can access across firms (if multi-tenant)
  if (
    hasSuperOrAdminPrivilege(req.user) &&
    process.env.MULTI_TENANT === "true"
  ) {
    return next();
  }

  // Check if user belongs to the requested firm
  if (!req.user.firmId) {
    return next(new AppError("You are not associated with any firm", 403));
  }

  // If route has firmId param, check if it matches user's firm
  if (req.params.firmId && req.params.firmId !== req.user.firmId.toString()) {
    return next(new AppError("Access denied to this firm's resources", 403));
  }

  next();
};
