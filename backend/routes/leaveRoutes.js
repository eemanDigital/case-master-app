const express = require("express");
const leaveAppController = require("../controllers/leaveAppController");
const leaveBalanceController = require("../controllers/leaveBalanceController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

// Apply the protect middleware to all routes in this router
router.use(protect);

// ============================================================================
// LEAVE APPLICATION ROUTES
// ============================================================================

// Employees can create their own leave applications
router.post("/applications", leaveAppController.createLeaveApplication);

// Employees can view their own applications, admins can view all
router.get("/applications", leaveAppController.getLeaveApplications);

// Employees can view their own application, admins can view any
router.get("/applications/:id", leaveAppController.getLeaveApplication);

// Only admins/HR can approve/reject applications
router.put(
  "/applications/:id",
  restrictTo("super-admin", "admin", "hr"),
  leaveAppController.updateLeaveApplication
);

// Employees can cancel their own pending applications, admins can cancel any
router.patch(
  "/applications/:id/cancel",
  leaveAppController.cancelLeaveApplication
);

// Only admins/HR can delete applications
router.delete(
  "/applications/:id",
  restrictTo("super-admin", "admin", "hr"),
  leaveAppController.deleteLeaveApplication
);

// ============================================================================
// LEAVE BALANCE ROUTES
// ============================================================================

// Only admins/HR can create leave balances
router.post(
  "/balances",
  restrictTo("super-admin", "admin", "hr"),
  leaveBalanceController.createLeaveBalance
);

// Employees can view their own balance, admins can view any
router.get("/balances/:employeeId", leaveBalanceController.getLeaveBalance);

// Only admins/HR can view all balances
router.get(
  "/balances",
  // restrictTo("super-admin", "admin", "hr"),
  leaveBalanceController.getLeaveBalances
);

// Only admins/HR can update balances
router.put(
  "/balances/:employeeId",
  restrictTo("super-admin", "admin", "hr"),
  leaveBalanceController.updateLeaveBalance
);

// Only admins/HR can delete balances
router.delete(
  "/balances/:id",
  restrictTo("super-admin", "admin", "hr"),
  leaveBalanceController.deleteLeaveBalance
);

// ============================================================================
// LEAVE SUMMARY ROUTES
// ============================================================================

// Employees can view their own summary, admins can view any
router.get(
  "/summary/:employeeId?",
  leaveBalanceController.getLeaveBalanceSummary
);

module.exports = router;
