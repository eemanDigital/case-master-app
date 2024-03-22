const express = require("express");
const { getUsers, getUser } = require("../controllers/userController");
const { signup } = require("../controllers/authController");

const userRouter = express.Router();

userRouter.get("/", getUsers);
userRouter.post("/signup", signup);
userRouter.get("/:userId", getUser);

module.exports = userRouter;
