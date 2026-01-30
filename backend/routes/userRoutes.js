// routes/userRoutes.js - COMPLETE MULTI-PRIVILEGE UPDATE

const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
  getUsersByRole,
  getUsersByUserType,
  getAllLawyers,
  getAllClients,
  getUsersByStatus,
  getActiveUsers,
  upgradeUser,
  sendAutomatedEmail,
  getSingleUser,
  sendAutomatedCustomEmail,
  getUserSelectOptions,
  getAllSelectOptions,
  getStaffByStatus,
  getClientsByStatus,
  getAllUsersByStatus,
  getStatusStatistics,
  getUserStatistics,
  getStaffStatistics,
  getClientStatistics,
  deleteUser,
  softDeleteUser,
  restoreUser,
} = require("../controllers/userController");

const {
  registerFirm,
  register,
  login,
  isLoggedIn,
  logout,
  protect,
  forgotPassword,
  resetPassword,
  restrictTo,
  restrictToUserTypes,
  hasPrivilege,
  requireAllPrivileges,
  canManageUsers,
  canManageCases,
  canManageBilling,
  canViewReports,
  checkPermission,
  sendLoginCode,
  sendVerificationEmail,
  verifyUser,
  changePassword,
  loginWithCode,
  loginWithGoogle,
  checkUserLimit,
  updateFirmUserCount,
} = require("../controllers/authController");

const {
  uploadUserPhoto,
  resizeUserPhoto,
} = require("../controllers/photoContoller");

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

router.post("/register-firm", registerFirm);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.get("/loginStatus", isLoggedIn);
router.patch("/verifyUser/:verificationToken", verifyUser);
router.patch("/resetpassword/:resetToken", resetPassword);
router.post("/sendLoginCode/:email", sendLoginCode);
router.post("/loginWithCode/:email", loginWithCode);
router.post("/google/callback", loginWithGoogle);

// ============================================
// PROTECTED ROUTES (All routes below require authentication)
// ============================================

router.use(protect);

router.get("/logout", logout);
router.patch("/changepassword", changePassword);

// ============================================
// USER REGISTRATION
// ✅ Uses hasPrivilege - checks primary role + additional roles
// ============================================

router.post(
  "/register",
  hasPrivilege("admin", "super-admin"), // ✅ Anyone with admin privilege (primary or additional)
  checkUserLimit,
  updateFirmUserCount,
  uploadUserPhoto,
  resizeUserPhoto,
  register,
);

// ============================================
// EMAIL ROUTES
// ✅ Admin or HR can send emails
// ============================================

router.post(
  "/sendAutomatedEmail",
  hasPrivilege("admin", "hr"), // ✅ Admin OR HR privilege
  sendAutomatedEmail,
);

router.post(
  "/sendAutomatedCustomEmail",
  hasPrivilege("admin", "hr"), // ✅ Admin OR HR privilege
  sendAutomatedCustomEmail,
);

router.post(
  "/sendVerificationEmail/:email",
  hasPrivilege("admin", "super-admin"), // ✅ Admin privilege required
  sendVerificationEmail,
);

// ============================================
// SELECT OPTIONS ROUTES
// ✅ Available to all authenticated users
// ============================================

router.get("/select-options/all", getAllSelectOptions);
router.get("/select-options", getUserSelectOptions);

// ============================================
// STATISTICS ROUTES
// ✅ Uses hasPrivilege - Admin, HR, or anyone with those additional roles
// ============================================

router.get(
  "/statistics/general",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getUserStatistics,
);

router.get(
  "/statistics/staff",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getStaffStatistics,
);

router.get(
  "/statistics/clients",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getClientStatistics,
);

router.get(
  "/statistics/status",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getStatusStatistics,
);

// ============================================
// USER TYPE SPECIFIC ROUTES
// ✅ Admin or HR can view all user types
// ============================================

router.get(
  "/type/:userType",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getUsersByUserType,
);

router.get(
  "/lawyers/all",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getAllLawyers,
);

router.get(
  "/clients/all",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getAllClients,
);

// ============================================
// STATUS-BASED ROUTES
// ✅ Admin or HR can view status reports
// ============================================

router.get(
  "/staff/status/:status",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getStaffByStatus,
);

router.get(
  "/clients/status/:status",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getClientsByStatus,
);

router.get(
  "/all/status/:status",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  getAllUsersByStatus,
);

// ============================================
// FILTERED USER ROUTES
// ✅ Role-based filtering with privilege checks
// ============================================

router.get(
  "/role/:role",
  hasPrivilege("admin", "hr"), // ✅ Admin or HR privilege
  getUsersByRole,
);

router.get(
  "/status/:status",
  hasPrivilege("admin", "hr"), // ✅ Admin or HR privilege
  getUsersByStatus,
);

router.get(
  "/active",
  hasPrivilege("admin", "hr"), // ✅ Admin or HR privilege
  getActiveUsers,
);

// ============================================
// ENHANCED FILTERING ROUTES
// ✅ Quick access routes with privilege checks
// ============================================

router.get(
  "/filter/combined",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  (req, res, next) => {
    return getUsers(req, res, next);
  },
);

router.get(
  "/quick/active-staff",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  (req, res, next) => {
    req.params.status = "active";
    return getStaffByStatus(req, res, next);
  },
);

router.get(
  "/quick/inactive-clients",
  hasPrivilege("admin", "super-admin", "hr"), // ✅ Any of these privileges
  (req, res, next) => {
    req.params.status = "inactive";
    return getClientsByStatus(req, res, next);
  },
);

// ============================================
// USER MANAGEMENT ROUTES
// ✅ Different privilege levels for different actions
// ============================================

// Get all users - Admin or HR
router.get(
  "/",
  hasPrivilege("super-admin", "admin", "hr"), // ✅ Admin or HR privilege
  getUsers,
);

// Get current user - All authenticated users
router.get("/getUser", getUser);

// Get single user - Admin, HR, or the user themselves (checked in controller)
router.get("/:id", getSingleUser);

// Update current user - All authenticated users (self-update)
router.patch("/updateUser", uploadUserPhoto, resizeUserPhoto, updateUser);

// Upgrade user (change role/position) - Must have user management permission
router.patch(
  "/upgradeUser/:id",
  canManageUsers, // ✅ Checks specific admin permission
  upgradeUser,
);

// ============================================
// DELETE/RESTORE ROUTES
// ✅ Only super-admin or admin with user management permission
// ============================================

// Hard delete - Super admin only
router.delete(
  "/delete/:id",
  requireAllPrivileges("super-admin"), // ✅ Must be super-admin
  deleteUser,
);

// Soft delete - Admin with user management permission
router.patch(
  "/soft-delete/:id",
  canManageUsers, // ✅ Checks specific admin permission
  softDeleteUser,
);

// Restore deleted user - Admin with user management permission
router.patch(
  "/restore/:id",
  canManageUsers, // ✅ Checks specific admin permission
  restoreUser,
);

// ============================================
// ADDITIONAL GRANULAR PERMISSION ROUTES
// ============================================

// Example: Only users with specific admin permissions
router.get(
  "/audit-logs",
  checkPermission((user) => {
    // Custom logic: Must be super-admin OR admin with report viewing permission
    return (
      user.role === "super-admin" ||
      (user.adminDetails && user.adminDetails.canViewReports === true)
    );
  }),
  (req, res) => {
    res.json({ message: "Audit logs" });
  },
);

// Example: Multi-role check - Lawyer OR Admin
router.get(
  "/legal-resources",
  hasPrivilege("lawyer", "admin"), // ✅ Anyone with lawyer OR admin privilege
  (req, res) => {
    res.json({ message: "Legal resources" });
  },
);

// Example: Require ALL privileges (rare use case)
router.post(
  "/critical-operation",
  requireAllPrivileges("admin", "super-admin"), // ✅ Must have BOTH
  (req, res) => {
    res.json({ message: "Critical operation performed" });
  },
);

module.exports = router;
