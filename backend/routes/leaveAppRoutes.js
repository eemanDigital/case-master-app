const express = require("express");
const leaveAppController = require("../controllers/leaveAppController");
const { protect } = require("../controllers/authController");

const leaveAppRouter = express.Router();

leaveAppRouter.post("/", protect, leaveAppController.createLeaveApplication);
leaveAppRouter.get("/:id", protect, leaveAppController.getLeaveApplication);
leaveAppRouter.patch(
  "/:id",
  protect,
  leaveAppController.updateLeaveApplication
);
leaveAppRouter.delete(
  "/:id",
  protect,
  leaveAppController.deleteLeaveApplication
);

module.exports = leaveAppRouter;
