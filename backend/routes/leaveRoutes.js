const express = require("express");
const {
  createLeave,
  createLeaveApplication,
  updateLeave,
  getLeave,
} = require("../controllers/leaveController");
const { protect } = require("../controllers/authController");

const leaveRouter = express.Router();
leaveRouter.post("/", protect, createLeave);
leaveRouter.patch("/:id", protect, updateLeave);
leaveRouter.get("/:id", protect, getLeave);

// leaveRouter.get("/", getLeaves);
// leaveRouter.get("/:taskId", getTask);
// leaveRouter.put("/:id", fileUpload, updateTask);
// leaveRouter.put("/:id", updateTask);

leaveRouter.post("/:leaveId/application", createLeaveApplication);

module.exports = leaveRouter;
