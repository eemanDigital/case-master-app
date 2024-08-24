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
  sendAutomatedCustomEmail,
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
  protect, // Ensure the user is authenticated
  restrictTo("admin", "super-admin"), // Ensure the user has the correct role
  uploadUserPhoto, // Handle file uploads
  resizeUserPhoto, // Resize the uploaded photo
  register // Handle the registration logic
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
router.post("/sendAutomatedCustomEmail", sendAutomatedCustomEmail);
router.post("/sendVerificationEmail/:email", sendVerificationEmail);

router.get("/logout", logout);

// Change password for logged-in user
router.patch("/changepassword", changePassword);
// // Admin updates user by ID, restricted to super-admin

router.get(
  "/",
  // cacheMiddleware(() => "users"),
  getUsers
);
router.get(
  "/getUser",
  // cacheMiddleware((req) => `user:${req.params.userId}`),
  getUser
);

// // Update user details, with photo upload and resize
router.patch("/updateUser", uploadUserPhoto, resizeUserPhoto, updateUser);
router.patch("/upgradeUser/:id", restrictTo("super-admin"), upgradeUser);

router.get(
  "/:id",
  // cacheMiddleware((req) => `user:${req.params.userId}`),
  getSingleUser
);
// // Delete user by ID
router.delete("/:id", restrictTo("admin", "super-admin"), deleteUser);

module.exports = router;
