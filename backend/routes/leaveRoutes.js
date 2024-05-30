const express = require("express");
const leaveAppController = require("../controllers/leaveAppController");
const leaveBalanceController = require("../controllers/leaveBalanceController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

// Apply the protect middleware to all routes in this router
router.use(protect);

// Leave Application routes
router.post("/applications", leaveAppController.createLeaveApplication);
router.get("/applications", leaveAppController.getAllLeaveApplications);
router.get("/applications/:id", leaveAppController.getLeaveApplication);
router.put(
  "/applications/:id",
  restrictTo("admin", "hr"),
  leaveAppController.updateLeaveApplication
);
router.delete("/applications/:id", leaveAppController.deleteLeaveApplication);

// Apply the restrictTo middleware only to leave balance routes
router.post(
  "/balances",
  restrictTo("admin", "hr"),
  leaveBalanceController.createLeaveBalance
);
router.get("/balances/:employeeId", leaveBalanceController.getLeaveBalance);
router.put(
  "/balances/:employeeId",
  restrictTo("admin", "hr"),
  leaveBalanceController.updateLeaveBalance
);

module.exports = router;
