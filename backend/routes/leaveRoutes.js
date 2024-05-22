const express = require("express");
const { createLeave } = require("../controllers/leaveController");
const { protect } = require("../controllers/authController");

const leaveRouter = express.Router();
leaveRouter.post("/", protect, createLeave);

// leaveRouter.get("/", getLeaves);
// leaveRouter.get("/:taskId", getTask);
// leaveRouter.put("/:id", fileUpload, updateTask);
// leaveRouter.put("/:id", updateTask);

module.exports = leaveRouter;
