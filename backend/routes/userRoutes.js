const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
  uploadUserPhoto,
  resizeUserPhoto,
  deleteUsers,
  updateUserByAdmin,
} = require("../controllers/userController");
const {
  signup,
  login,
  isLoggedIn,
  logout,
  protect,
  updatePassword,
  forgotPassword,
  resetPassword,
  restrictTo,
} = require("../controllers/authController");

const router = express.Router();

// Public routes
// User signup with admin restriction, photo upload, and resize
router.post(
  "/signup",
  restrictTo("admin"),
  uploadUserPhoto,
  resizeUserPhoto,
  signup
);
// User login
router.post("/login", login);
// Password forgot and reset routes
router.post("/forgotpassword", forgotPassword);
router.patch("/resetpassword/:token", resetPassword);
// Check if user is logged in
router.get("/loggedIn", isLoggedIn);

// Middleware to protect routes below this line
router.use(protect);

// Protected routes
// User logout
router.get("/logout", logout);
// Change password for logged-in user
router.patch("/changepassword", updatePassword);
// Admin updates user by ID, restricted to super-admin
router.patch(
  "/update-user-by-admin/:id",
  restrictTo("super-admin"),
  updateUserByAdmin
);
// Get all users and specific user by userId
router.get("/", getUsers);
router.get("/:userId", getUser);
// Update user details, with photo upload and resize
router.patch("/updateUser", uploadUserPhoto, resizeUserPhoto, updateUser);
// Delete user by ID
router.delete("/:id", deleteUsers);

module.exports = router;
