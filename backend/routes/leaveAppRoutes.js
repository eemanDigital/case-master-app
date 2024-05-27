const express = require("express");
const leaveAppController = require("../controllers/leaveAppController");
const { protect } = require("../controllers/authController");

const leaveAppRouter = express.Router();
const app = express();

app.use(protect);

leaveAppRouter.post("/", leaveAppController.createLeaveApplication);
leaveAppRouter.get("/:id", leaveAppController.getLeaveApplication);
leaveAppRouter.patch("/:id", leaveAppController.updateLeaveApplication);
leaveAppRouter.delete("/:id", leaveAppController.deleteLeaveApplication);

module.exports = leaveAppRouter;
