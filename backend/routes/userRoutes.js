const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
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
} = require("../controllers/authController");

const userRouter = express.Router();

userRouter.get("/", getUsers);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.post("/forgotpassword", forgotPassword);
userRouter.patch("/resetPassword/:token", resetPassword);
// userRouter.post("/resetpassword", resetPassword);
userRouter.get("/logout", logout);
userRouter.get("/loggedIn", isLoggedIn);
userRouter.get("/:userId", getUser);
userRouter.patch("/updateUser", protect, updateUser);
userRouter.patch("/changepassword", protect, updatePassword);

module.exports = userRouter;
