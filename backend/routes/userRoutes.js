const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
  getUsersByRole,
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
} = require("../controllers/userController");
const {
  login,
  isLoggedIn,
  logout,
  protect,
  forgotPassword,
  resetPassword,
  restrictTo,
  sendLoginCode,
  register,
  sendVerificationEmail,
  verifyUser,
  changePassword,
  loginWithCode,
  loginWithGoogle,
} = require("../controllers/authController");

const {
  uploadUserPhoto,
  resizeUserPhoto,
} = require("../controllers/photoContoller");
const { softDeleteItem } = require("../controllers/softDeleteController");
const User = require("../models/userModel");

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// User signup with admin restriction
router.post(
  "/register",
  protect,
  restrictTo("admin", "super-admin"),
  uploadUserPhoto,
  resizeUserPhoto,
  register
);

// User login
router.post("/login", login);

// Password recovery
router.post("/forgotpassword", forgotPassword);

// Check if user is logged in
router.get("/loginStatus", isLoggedIn);

// Email verification
router.patch("/verifyUser/:verificationToken", verifyUser);
router.post("/sendVerificationEmail/:email", sendVerificationEmail);

// Password reset
router.patch("/resetpassword/:resetToken", resetPassword);

// Login with code/Google
router.post("/sendLoginCode/:email", sendLoginCode);
router.post("/loginWithCode/:email", loginWithCode);
router.post("/google/callback", loginWithGoogle);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(protect);

// User logout
router.get("/logout", logout);

// Change password for logged-in user
router.patch("/changepassword", changePassword);

// ============================================
// EMAIL ROUTES
// ============================================

router.post("/sendAutomatedEmail", sendAutomatedEmail);
router.post("/sendAutomatedCustomEmail", sendAutomatedCustomEmail);

// ============================================
// ✅ USER SELECT OPTIONS ROUTES (BEFORE /:id)
// ============================================
router.get("/select-options/all", getAllSelectOptions);
router.get("/select-options", getUserSelectOptions);

// ============================================
// ✅ STATISTICS ROUTES (BEFORE /:id)
// ============================================

// Get general user statistics
router.get(
  "/statistics/general",
  restrictTo("admin", "super-admin", "hr"),
  getUserStatistics
);

// Get staff-specific statistics
router.get(
  "/statistics/staff",
  restrictTo("admin", "super-admin", "hr"),
  getStaffStatistics
);

// Get client-specific statistics
router.get(
  "/statistics/clients",
  restrictTo("admin", "super-admin", "hr"),
  getClientStatistics
);

// Get comprehensive status statistics (active/inactive counts)
router.get(
  "/statistics/status",
  restrictTo("admin", "super-admin", "hr"),
  getStatusStatistics
);

// ============================================
// ✅ ENHANCED STATUS-BASED ROUTES (BEFORE /:id)
// ============================================

// Get staff by active/inactive status
router.get(
  "/staff/status/:status",
  restrictTo("admin", "super-admin", "hr"),
  getStaffByStatus
);

// Get clients by active/inactive status
router.get(
  "/clients/status/:status",
  restrictTo("admin", "super-admin", "hr"),
  getClientsByStatus
);

// Get all users (staff + clients) by status
router.get(
  "/all/status/:status",
  restrictTo("admin", "super-admin", "hr"),
  getAllUsersByStatus
);

// ============================================
// FILTERED USER ROUTES (BEFORE /:id)
// ============================================

// Get users by role
router.get("/role/:role", getUsersByRole);

// Get users by status (legacy - uses query param)
router.get("/status/:status", getUsersByStatus);

// Get active users (legacy - active only)
router.get("/active", getActiveUsers);

// ============================================
// ✅ ENHANCED FILTERING ROUTES (BEFORE /:id)
// ============================================

// Combined filter route (role + status)
router.get(
  "/filter/combined",
  restrictTo("admin", "super-admin", "hr"),
  (req, res, next) => {
    return getUsers(req, res, next);
  }
);

// Quick access routes for common scenarios
router.get(
  "/quick/active-staff",
  restrictTo("admin", "super-admin", "hr"),
  (req, res, next) => {
    req.params.status = "active";
    return getStaffByStatus(req, res, next);
  }
);

router.get(
  "/quick/inactive-clients",
  restrictTo("admin", "super-admin", "hr"),
  (req, res, next) => {
    req.params.status = "inactive";
    return getClientsByStatus(req, res, next);
  }
);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// ⚠️ IMPORTANT: Get all users - MUST BE BEFORE /:id
router.get("/", getUsers);

// Get single user (current user)
router.get("/getUser", getUser);

// ⚠️ CRITICAL: This MUST come AFTER all specific routes above
// Get user by ID - THIS SHOULD BE LAST among GET routes
router.get("/:id", getSingleUser);

// Update user profile
router.patch("/updateUser", uploadUserPhoto, resizeUserPhoto, updateUser);

// Admin upgrade user (restricted)
router.patch(
  "/upgradeUser/:id",
  restrictTo("admin", "super-admin"),
  upgradeUser
);

// Soft delete user (restricted)
router.delete(
  "/soft-delete/:id",
  restrictTo("admin", "super-admin"),
  softDeleteItem({ model: User, modelName: "User" })
);

module.exports = router;
