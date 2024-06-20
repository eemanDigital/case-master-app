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

router.post("/signup", uploadUserPhoto, resizeUserPhoto, signup);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.patch("/resetpassword/:token", resetPassword);
router.get("/logout", logout);
router.get("/loggedIn", isLoggedIn);

router.use(protect); //login to access the routes
router.patch("/changepassword", protect, updatePassword);
router.patch(
  "/update-user-by-admin/:id",
  restrictTo("admin"),
  updateUserByAdmin
);
router.get("/", getUsers);
router.get("/:userId", getUser);
router.patch("/updateUser", uploadUserPhoto, resizeUserPhoto, updateUser);
router.delete("/:id", deleteUsers);

module.exports = router;
