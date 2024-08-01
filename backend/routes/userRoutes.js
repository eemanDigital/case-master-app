const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserByAdmin,
  upgradeUser,
  sendAutomatedEmail,
  getSingleUser,
} = require("../controllers/userController");
const {
  login,
  isLoggedIn,
  logout,
  protect,
  updatePassword,
  forgotPassword,
  resetPassword,
  restrictTo,
  refreshToken,
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
const cacheMiddleware = require("../utils/cacheMiddleware");

const router = express.Router();

// Public routes
// User signup with admin restriction, photo upload, and resize
router.post(
  "/register",
  // restrictTo("admin"),
  uploadUserPhoto,
  resizeUserPhoto,
  register
);
// User login
router.post("/login", login);
// // Password forgot and reset routes
router.post("/forgotpassword", forgotPassword);
// router.post("/refresh-token", refreshToken);
// // Check if user is logged in
router.get("/loginStatus", isLoggedIn);
router.patch("/verifyUser/:verificationToken", verifyUser);
router.patch("/resetpassword/:resetToken", resetPassword);
router.post("/sendLoginCode/:email", sendLoginCode);
router.post("/loginWithCode/:email", loginWithCode);
router.post("/google/callback", loginWithGoogle);

// // Middleware to protect routes below this line
router.use(protect);

// // Protected routes
// // User logout
router.post("/sendAutomatedEmail", sendAutomatedEmail);
router.post("/sendVerificationEmail", sendVerificationEmail);

router.get("/logout", logout);

// // Change password for logged-in user
router.patch("/changepassword", changePassword);
// // Admin updates user by ID, restricted to super-admin
router.post("/upgradeUser", restrictTo("super-admin"), upgradeUser);
// // Get all users and specific user by userId
router.get(
  "/",
  cacheMiddleware(() => "users"),
  getUsers
);
router.get(
  "/getUser",
  // cacheMiddleware((req) => `user:${req.params.userId}`),
  getUser
);

// // Update user details, with photo upload and resize
router.patch("/updateUser", uploadUserPhoto, resizeUserPhoto, updateUser);
router.get(
  "/:id",
  // cacheMiddleware((req) => `user:${req.params.userId}`),
  getSingleUser
);
// // Delete user by ID
router.delete("/:id", restrictTo("admin", "super-admin"), deleteUser);

module.exports = router;
