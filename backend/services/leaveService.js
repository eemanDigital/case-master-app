const LeaveApplication = require("../models/leaveApplicationModel");
const LeaveBalance = require("../models/leaveBalanceModel");
const AppError = require("../utils/appError");

class LeaveService {
  /**
   * Get leave balance for employee
   */
  async getEmployeeLeaveBalance(employeeId, year = new Date().getFullYear()) {
    const balance = await LeaveBalance.findOne({
      employee: employeeId,
      year: year,
    });

    if (!balance) {
      throw new AppError("Leave balance not found for this employee", 404);
    }

    return balance;
  }

  /**
   * Calculate leave days between dates
   */
  calculateLeaveDays(startDate, endDate) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const days =
      Math.ceil((new Date(endDate) - new Date(startDate)) / msPerDay) + 1;
    return days;
  }

  /**
   * Validate leave balance availability
   */
  async validateLeaveBalance(employeeId, leaveType, daysRequired) {
    const balance = await this.getEmployeeLeaveBalance(employeeId);

    const balanceMap = {
      annual: balance.annualLeaveBalance,
      casual: balance.annualLeaveBalance, // Casual often shares with annual
      sick: balance.sickLeaveBalance,
      maternity: balance.maternityLeaveBalance,
      paternity: balance.paternityLeaveBalance,
      compassionate: balance.compassionateLeaveBalance,
      unpaid: Infinity, // No balance check needed
    };

    const availableBalance = balanceMap[leaveType];

    if (availableBalance === undefined) {
      throw new AppError(`Invalid leave type: ${leaveType}`, 400);
    }

    if (availableBalance < daysRequired && leaveType !== "unpaid") {
      throw new AppError(
        `Insufficient ${leaveType} leave balance. Available: ${availableBalance}, Required: ${daysRequired}`,
        400
      );
    }

    return { balance, availableBalance };
  }

  /**
   * Check for overlapping leave applications
   */
  async checkOverlappingLeaves(
    employeeId,
    startDate,
    endDate,
    excludeId = null
  ) {
    const query = {
      employee: employeeId,
      status: { $in: ["pending", "approved"] },
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const overlapping = await LeaveApplication.findOne(query);

    if (overlapping) {
      throw new AppError(
        `Leave application overlaps with existing leave from ${overlapping.startDate.toDateString()} to ${overlapping.endDate.toDateString()}`,
        400
      );
    }
  }

  /**
   * Deduct leave balance
   */
  async deductLeaveBalance(employeeId, leaveType, days) {
    const balance = await this.getEmployeeLeaveBalance(employeeId);

    const deductionMap = {
      annual: "annualLeaveBalance",
      casual: "annualLeaveBalance",
      sick: "sickLeaveBalance",
      maternity: "maternityLeaveBalance",
      paternity: "paternityLeaveBalance",
      compassionate: "compassionateLeaveBalance",
    };

    const balanceField = deductionMap[leaveType];

    if (balanceField && balance[balanceField] !== undefined) {
      balance[balanceField] -= days;

      if (balance[balanceField] < 0) {
        throw new AppError(`Insufficient ${leaveType} leave balance`, 400);
      }

      await balance.save();
    }

    return balance;
  }

  /**
   * Restore leave balance (for rejected/cancelled leaves)
   */
  async restoreLeaveBalance(employeeId, leaveType, days) {
    const balance = await this.getEmployeeLeaveBalance(employeeId);

    const restorationMap = {
      annual: "annualLeaveBalance",
      casual: "annualLeaveBalance",
      sick: "sickLeaveBalance",
      maternity: "maternityLeaveBalance",
      paternity: "paternityLeaveBalance",
      compassionate: "compassionateLeaveBalance",
    };

    const balanceField = restorationMap[leaveType];

    if (balanceField && balance[balanceField] !== undefined) {
      balance[balanceField] += days;
      await balance.save();
    }

    return balance;
  }
}

module.exports = new LeaveService();
