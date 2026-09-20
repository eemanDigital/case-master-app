const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**
 * ===============================
 * UTILITY FUNCTION TO GET ALL USER ROLES
 * ===============================
 */
const getAllUserRoles = (user) => {
  const roles = new Set();

  if (user.role) {
    roles.add(user.role);
  }

  if (user.userType) {
    roles.add(user.userType);
  }

  return Array.from(roles);
};

/**
 * ===============================
 * CHECK IF USER IS ADMIN OR SUPER-ADMIN
 * ===============================
 */
const isAdminUser = (user) => {
  if (!user) return false;
  return typeof user.isAdmin === "function" && user.isAdmin();
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

  // First check: Admin or super-admin in ANY role has access to everything
  if (isAdminUser(user)) {
    return true;
  }

  const userRoles = getAllUserRoles(user);

  return requiredRoles.some(
    (requiredRole) =>
      user.role === requiredRole || userRoles.includes(requiredRole),
  );
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

  // Admin or super-admin in ANY role has all privileges
  if (isAdminUser(user)) {
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

  if (typeof user.isSuperAdmin === "function" && user.isSuperAdmin()) {
    return 100;
  }

  if (isAdminUser(user)) {
    return 90;
  }

  // Define privilege hierarchy
  const privilegeLevels = {
    lawyer: 80,
    paralegal: 75,
    hr: 70,
    accountant: 65,
    secretary: 60,
    receptionist: 55,
    it: 55,
    other: 50,
    staff: 50,
    client: 10,
  };

  const level = privilegeLevels[user.role] || privilegeLevels[user.userType] || 0;
  return level;
};

/**
 * ===============================
 * RESTRICT TO ROLES
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
 * RESTRICT TO USER TYPES
 * ===============================
 */
exports.restrictToUserTypes = (...userTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Admin or super-admin in ANY role can access any user type
    if (isAdminUser(req.user)) {
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
 * CHECK ADMIN PERMISSION
 * ===============================
 */
exports.canManageUsers = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin or super-admin in ANY role can always manage users
  if (isAdminUser(req.user)) {
    return next();
  }

  // HR role can also manage users (non-admin users)
  if (req.user.role === "hr") {
    return next();
  }

  return next(new AppError("You do not have permission to manage users", 403));
};

exports.canManageCases = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin or super-admin in ANY role can always manage cases
  if (isAdminUser(req.user)) {
    return next();
  }

  // Lawyers can manage cases
  if (typeof req.user.isLawyer === "function" && req.user.isLawyer()) {
    return next();
  }

  return next(new AppError("You do not have permission to manage cases", 403));
};

exports.canManageBilling = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin or super-admin in ANY role can always manage billing
  if (isAdminUser(req.user)) {
    return next();
  }

  // Accountants can manage billing
  if (req.user.role === "accountant") {
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

  // Admin or super-admin in ANY role can always view reports
  if (isAdminUser(req.user)) {
    return next();
  }

  // Lawyers can view reports related to their cases
  if (typeof req.user.isLawyer === "function" && req.user.isLawyer()) {
    return next();
  }

  // HR can view staff reports
  if (req.user.role === "hr") {
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

  // Admin or super-admin in ANY role can perform lawyer actions
  if (isAdminUser(req.user)) {
    return next();
  }

  if (typeof req.user.isLawyer === "function" && req.user.isLawyer()) {
    return next();
  }

  return next(new AppError("This action requires lawyer privileges", 403));
};

// For HR-specific actions
exports.isHR = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin or super-admin in ANY role can perform HR actions
  if (isAdminUser(req.user)) {
    return next();
  }

  if (req.user.role === "hr") {
    return next();
  }

  return next(new AppError("This action requires HR privileges", 403));
};

// For secretary-specific actions
exports.isSecretary = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin or super-admin in ANY role can perform secretary actions
  if (isAdminUser(req.user)) {
    return next();
  }

  if (req.user.role === "secretary") {
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

    // Admin or super-admin in ANY role bypasses all checks
    if (isAdminUser(req.user)) {
      return next();
    }

    // Get all user roles for the permission checker
    const userRoles = getAllUserRoles(req.user);

    // Create enhanced user object
    const enhancedUser = {
      ...(req.user.toObject ? req.user.toObject() : req.user),
      allRoles: userRoles,
      isAdmin: isAdminUser(req.user),
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

  // Admin or super-admin in ANY role can always access cases
  if (isAdminUser(req.user)) {
    return next();
  }

  // Lawyers can access cases
  if (typeof req.user.isLawyer === "function" && req.user.isLawyer()) {
    return next();
  }

  // Secretaries can access cases for document management
  if (req.user.role === "secretary") {
    return next();
  }

  return next(new AppError("You do not have permission to access cases", 403));
};

// For client management
exports.canAccessClients = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin or super-admin in ANY role can always access clients
  if (isAdminUser(req.user)) {
    return next();
  }

  // Lawyers can access clients
  if (typeof req.user.isLawyer === "function" && req.user.isLawyer()) {
    return next();
  }

  // Secretaries can access clients for scheduling
  if (req.user.role === "secretary") {
    return next();
  }

  // HR can access client information for reporting
  if (req.user.role === "hr") {
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

  // Admin or super-admin in ANY role can always manage documents
  if (isAdminUser(req.user)) {
    return next();
  }

  // Lawyers can manage documents
  if (typeof req.user.isLawyer === "function" && req.user.isLawyer()) {
    return next();
  }

  // Secretaries can manage documents
  if (req.user.role === "secretary") {
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

  // Only admin or super-admin can manage system settings
  if (isAdminUser(req.user)) {
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

  // Admin or super-admin in ANY role can view audit logs
  if (isAdminUser(req.user)) {
    return next();
  }

  // HR can view logs
  if (req.user.role === "hr") {
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

    // Admin or super-admin in ANY role automatically has highest level
    if (isAdminUser(req.user)) {
      return next();
    }

    // Define permission levels
    const permissionLevels = {
      lawyer: 80,
      paralegal: 75,
      hr: 70,
      accountant: 65,
      secretary: 60,
      receptionist: 55,
      it: 55,
      other: 50,
      staff: 50,
      client: 10,
    };

    // Get the highest permission level from the user's role
    const userLevel =
      permissionLevels[req.user.role] || permissionLevels[req.user.userType] || 0;

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

    // Admin or super-admin in ANY role can manage any user
    if (isAdminUser(req.user)) {
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

  // Admin or super-admin can access across firms (if multi-tenant)
  if (isAdminUser(req.user) && process.env.MULTI_TENANT === "true") {
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