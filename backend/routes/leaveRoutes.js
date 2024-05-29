const express = require("express");
const leaveAppController = require("../controllers/leaveAppController");
const leaveBalanceController = require("../controllers/leaveBalanceController");
const { restrictTo, protect } = require("../controllers/authController");

const router = express.Router();
const app = express();

app.use(protect); //only signed in users can access these routes

// Leave Application routes
router.post("/applications", leaveAppController.createLeaveApplication);
router.get("/applications/:id", leaveAppController.getLeaveApplication);
router.put(
  "/applications/:id",
  restrictTo("admin", "hr"),
  leaveAppController.updateLeaveApplication
);
router.delete("/applications/:id", leaveAppController.deleteLeaveApplication);

// Leave Balance routes
app.use(restrictTo("admin", "hr"));
router.post("/balances", leaveBalanceController.createLeaveBalance);
router.get("/balances/:employeeId", leaveBalanceController.getLeaveBalance);
router.put("/balances/:employeeId", leaveBalanceController.updateLeaveBalance);

module.exports = router;
