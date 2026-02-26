const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const photoController = require("../controllers/photoController");
const multer = require("multer");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Destructuring for cleaner routes
const {
  registerFirm,
  login,
  isLoggedIn,
  forgotPassword,
  verifyUser,
  resetPassword,
  sendLoginCode,
  loginWithCode,
  loginWithGoogle,
  protect,
  logout,
  changePassword,
  register,
  sendVerificationEmail,
  restrictTo,
  checkPermission,
  canManageUsers,
  checkUserLimit,
  updateFirmUserCount,
} = authController;

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
  sendCustomEmail,
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
} = userController;

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
router.use(protect); // Global protect for all routes below

router.get("/logout", logout);
router.patch("/changepassword", changePassword);

// Registration: Restricted to those with admin or super-admin privilege
router.post(
  "/register",
  restrictTo("admin", "super-admin"),
  checkUserLimit,
  updateFirmUserCount,
  photoController.uploadUserPhoto,
  photoController.resizeUserPhoto,
  register,
);

// ============================================
// COMMUNICATION & STATS
// ============================================
// restrictTo now checks primary role + additionalRoles automatically
router.post(
  "/sendAutomatedEmail",
  restrictTo("admin", "hr"),
  sendAutomatedEmail,
);
router.post(
  "/sendAutomatedCustomEmail",
  restrictTo("admin", "hr"),
  sendAutomatedCustomEmail,
);

router.post(
  "/sendCustomEmail",
  restrictTo("admin", "hr", "lawyer"),
  upload.any(), // Accept any fields including attachments
  sendCustomEmail,
);

router.post(
  "/sendVerificationEmail/:email",

  sendVerificationEmail,
);

router.get(
  "/statistics/general",
  restrictTo("admin", "super-admin", "hr", "lawyer"),
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
// DATA FETCHING (Multi-Privilege Aware)
// ============================================
router.get(
  "/type/:userType",
  restrictTo("admin", "super-admin", "hr"),
  getUsersByUserType,
);
router.get(
  "/lawyers/all",
  restrictTo("admin", "super-admin", "hr", "lawyer"),
  getAllLawyers,
);
router.get(
  "/clients/all",
  restrictTo("admin", "super-admin", "hr"),
  getAllClients,
);

router.get("/role/:role", restrictTo("admin", "hr"), getUsersByRole);
router.get("/status/:status", restrictTo("admin", "hr"), getUsersByStatus);
router.get("/active", restrictTo("admin", "hr"), getActiveUsers);

// Select options are public to all authenticated staff/admins
router.get("/select-options/all", getAllSelectOptions);
router.get("/select-options", getUserSelectOptions);

// ============================================
// USER MANAGEMENT
// ============================================
router.get("/", restrictTo("super-admin", "admin", "hr"), getUsers);
router.get("/getUser", getUser); // Self
router.get("/:id", getSingleUser);

router.patch(
  "/updateUser",
  photoController.uploadUserPhoto,
  photoController.resizeUserPhoto,
  updateUser,
);

// Upgrade/Manage (Uses granular adminDetails checks)
router.patch("/upgradeUser/:id", canManageUsers, upgradeUser);
router.patch("/soft-delete/:id", canManageUsers, softDeleteUser);
router.patch("/restore/:id", canManageUsers, restoreUser);

// Hard Delete: Only Super Admin (Must use the array logic)
router.delete("/delete/:id", restrictTo("super-admin"), deleteUser);

// ============================================
// SPECIAL PERMISSIONS
// ============================================
router.get(
  "/audit-logs",
  checkPermission((user) => {
    return (
      user.role === "super-admin" ||
      (user.adminDetails && user.adminDetails.canViewReports)
    );
  }),
  (req, res) => res.json({ message: "Audit logs" }),
);

module.exports = router;
