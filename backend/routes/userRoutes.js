const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserByAdmin,
  verificationEmail,
  upgradeUser,
  sendAutomatedEmail,
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
  sendVerificationEmail,

  register,
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
router.get("/login", login);
// // Password forgot and reset routes
// router.post("/forgotpassword", forgotPassword);
// router.patch("/resetpassword/:token", resetPassword);
// router.post("/refresh-token", refreshToken);
// // Check if user is logged in
router.get("/loggedIn", isLoggedIn);

// // Middleware to protect routes below this line
router.use(protect);

// // Protected routes
// // User logout
router.get("/logout", logout);
router.post("/sendAutomatedEmail", sendAutomatedEmail);
router.post("/sendVerificationEmail", sendVerificationEmail);
// // Change password for logged-in user
// router.patch("/changepassword", updatePassword);
// // Admin updates user by ID, restricted to super-admin
router.post("/upgradeUser", restrictTo("super-admin"), upgradeUser);
// // Get all users and specific user by userId
router.get(
  "/",
  cacheMiddleware(() => "users"),
  getUsers
);
// router.get(
//   "/:userId",
//   cacheMiddleware((req) => `user:${req.params.userId}`),
//   getUser
// );
// // Update user details, with photo upload and resize
// router.patch("/updateUser", uploadUserPhoto, resizeUserPhoto, updateUser);
// // Delete user by ID
router.delete("/:id", restrictTo("admin", "super-admin"), deleteUser);

module.exports = router;
