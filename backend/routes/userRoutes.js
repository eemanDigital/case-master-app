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
} = require("../controllers/authController");

const userRouter = express.Router();

userRouter.get("/", getUsers);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/logout", logout);
userRouter.get("/loggedIn", isLoggedIn);
userRouter.get("/:userId", getUser);
userRouter.patch("/updateUser", protect, updateUser);

module.exports = userRouter;
