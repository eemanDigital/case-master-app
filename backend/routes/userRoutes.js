// routes/userRoutes.js - UPDATED

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
// PROTECTED ROUTES
// ============================================

router.use(protect);

router.get("/logout", logout);
router.patch("/changepassword", changePassword);

// ============================================
// USER REGISTRATION
// ============================================

router.post(
  "/register",
  restrictTo("admin", "super-admin"),
  checkUserLimit,
  updateFirmUserCount,
  uploadUserPhoto,
  resizeUserPhoto,
  register,
);

// ============================================
// EMAIL ROUTES
// ============================================

router.post("/sendAutomatedEmail", sendAutomatedEmail);
router.post("/sendAutomatedCustomEmail", sendAutomatedCustomEmail);
router.post("/sendVerificationEmail/:email", sendVerificationEmail);

// ============================================
// SELECT OPTIONS ROUTES
// ============================================

router.get("/select-options/all", getAllSelectOptions);
router.get("/select-options", getUserSelectOptions);

// ============================================
// STATISTICS ROUTES
// ============================================

router.get(
  "/statistics/general",
  restrictTo("admin", "super-admin", "hr"),
  getUserStatistics,
);

router.get(
  "/statistics/staff",
  restrictTo("admin", "super-admin", "hr"),
  getStaffStatistics,
);

router.get(
  "/statistics/clients",
  restrictTo("admin", "super-admin", "hr"),
  getClientStatistics,
);

router.get(
  "/statistics/status",
  restrictTo("admin", "super-admin", "hr"),
  getStatusStatistics,
);

// ============================================
// USER TYPE SPECIFIC ROUTES
// ============================================

router.get(
  "/type/:userType",
  restrictTo("admin", "super-admin", "hr"),
  getUsersByUserType,
);
router.get(
  "/lawyers/all",
  restrictTo("admin", "super-admin", "hr"),
  getAllLawyers,
);
router.get(
  "/clients/all",
  restrictTo("admin", "super-admin", "hr"),
  getAllClients,
);

// ============================================
// STATUS-BASED ROUTES
// ============================================

router.get(
  "/staff/status/:status",
  restrictTo("admin", "super-admin", "hr"),
  getStaffByStatus,
);

router.get(
  "/clients/status/:status",
  restrictTo("admin", "super-admin", "hr"),
  getClientsByStatus,
);

router.get(
  "/all/status/:status",
  restrictTo("admin", "super-admin", "hr"),
  getAllUsersByStatus,
);

// ============================================
// FILTERED USER ROUTES
// ============================================

router.get("/role/:role", getUsersByRole);
router.get("/status/:status", getUsersByStatus);
router.get("/active", getActiveUsers);

// ============================================
// ENHANCED FILTERING ROUTES
// ============================================

router.get(
  "/filter/combined",
  restrictTo("admin", "super-admin", "hr"),
  (req, res, next) => {
    return getUsers(req, res, next);
  },
);

router.get(
  "/quick/active-staff",
  restrictTo("admin", "super-admin", "hr"),
  (req, res, next) => {
    req.params.status = "active";
    return getStaffByStatus(req, res, next);
  },
);

router.get(
  "/quick/inactive-clients",
  restrictTo("admin", "super-admin", "hr"),
  (req, res, next) => {
    req.params.status = "inactive";
    return getClientsByStatus(req, res, next);
  },
);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

router.get("/", getUsers);
router.get("/getUser", getUser);
router.get("/:id", getSingleUser);
router.patch("/updateUser", uploadUserPhoto, resizeUserPhoto, updateUser);

router.patch(
  "/upgradeUser/:id",
  restrictTo("admin", "super-admin"),
  upgradeUser,
);

// ============================================
// DELETE/UNDELETE ROUTES
// ============================================

router.delete(
  "/delete/:id",
  restrictTo("admin", "super-admin"),
  updateFirmUserCount,
  deleteUser,
  updateFirmUserCount,
);

router.patch(
  "/soft-delete/:id",
  restrictTo("admin", "super-admin"),
  updateFirmUserCount,
  softDeleteUser,
  updateFirmUserCount,
);

router.patch(
  "/restore/:id",
  restrictTo("admin", "super-admin"),
  updateFirmUserCount,
  restoreUser,
  updateFirmUserCount,
);

module.exports = router;
