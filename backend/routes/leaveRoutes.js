const express = require("express");
const leaveAppController = require("../controllers/leaveAppController");
const leaveBalanceController = require("../controllers/leaveBalanceController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

// Apply the protect middleware to all routes in this router
router.use(protect);

// Leave Application routes
router.post("/applications", leaveAppController.createLeaveApplication);
router.get("/applications", leaveAppController.getLeaveApplications);
router.get("/applications/:id", leaveAppController.getLeaveApplication);
router.put(
  "/applications/:id",
  restrictTo("super-admin", "admin", "hr"),
  leaveAppController.updateLeaveApplication
);

// LEAVE BALANCE ROUTES
// Apply the restrictTo middleware only to leave balance routes
router.post(
  "/balances",
  restrictTo("super-admin", "admin", "hr"),
  leaveBalanceController.createLeaveBalance
);
router.get("/balances/:employeeId", leaveBalanceController.getLeaveBalance);
router.get(
  "/balances",
  // restrictTo("super-admin", "admin", "hr"),
  leaveBalanceController.getLeaveBalances
);
router.put(
  "/balances/:employeeId",
  restrictTo("super-admin", "admin", "hr"),
  leaveBalanceController.updateLeaveBalance
);
router.delete(
  "/applications/:id",
  restrictTo("super-admin", "admin", "hr"),
  leaveAppController.deleteLeaveApplication
);
router.delete(
  "/balances/:id",
  restrictTo("super-admin", "admin", "hr"),
  leaveBalanceController.deleteLeaveBalance
);

module.exports = router;
