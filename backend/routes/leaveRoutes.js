const express = require("express");
const {
  createLeave,

  updateLeave,
  getLeave,
} = require("../controllers/leaveResController");
const { protect } = require("../controllers/authController");

const leaveRouter = express.Router();
leaveRouter.post("/", protect, createLeave);
leaveRouter.patch("/:id", protect, updateLeave);
leaveRouter.get("/:id", protect, getLeave);

module.exports = leaveRouter;
