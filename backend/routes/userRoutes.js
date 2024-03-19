const express = require("express");
const { getUsers } = require("../controllers/userController");
const { signup } = require("../controllers/authController");

const userRouter = express.Router();

userRouter.get("/", getUsers);
userRouter.post("/signup", signup);

module.exports = userRouter;
