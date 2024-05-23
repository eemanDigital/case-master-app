const mongoose = require("mongoose");

// Leave application subdocument schema
const leaveApplicationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Leave must be associated with an employee"],
  },
  leaveCategory: {
    type: String,
    enum: ["sick", "casual", "maternity", "paternity", "annual", "other"],
    required: [true, "Leave must have a category"],
  },
  startDate: {
    type: Date,
    required: [true, "Leave must have a start date"],
  },
  endDate: {
    type: Date,
    required: [true, "Leave must have an end date"],
  },
  daysAppliedFor: {
    type: Number,
  },
  reason: {
    type: String,
    maxlength: [500, "Reason should not exceed 500 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Leave schema
const leaveSchema = new mongoose.Schema({
  isEntitled: Boolean,
  annualLeaveEntitled: Number,
  leaveBalance: Number,
  isApproved: {
    type: Boolean,
    required: [true, "Specify if leave is approved or not"],
  },
  approvedOn: {
    type: Date,
    default: Date.now,
  },
  modifiedStartDate: Date,
  modifiedEndDate: Date,
  daysApproved: Number,
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  application: leaveApplicationSchema,

  leaveHistory: [
    {
      year: Number,
      daysTaken: Number,
    },
  ],
});

// Pre-save hook for leave application to calculate days applied for
leaveApplicationSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const convertedStartDate = this.startDate.getTime();
    const convertedEndDate = this.endDate.getTime();
    const difference = convertedEndDate - convertedStartDate;
    const days = Math.round(difference / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date
    this.daysAppliedFor = days;
  }
  next();
});

// Pre-save hook for leave to calculate days approved and manage leave balance
leaveSchema.pre("save", async function (next) {
  if (this.modifiedStartDate && this.modifiedEndDate) {
    const convertedStartDate = this.modifiedStartDate.getTime();
    const convertedEndDate = this.modifiedEndDate.getTime();
    const difference = convertedEndDate - convertedStartDate;
    const days = Math.round(difference / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date
    this.daysApproved = days;

    // Update leave balance and history for annual and casual leave only
    const leaveCategory = this.application.leaveCategory;
    if (leaveCategory === "annual" || leaveCategory === "casual") {
      const currentYear = new Date().getFullYear();
      const existingHistory = this.leaveHistory.find(
        (record) => record.year === currentYear
      );

      if (existingHistory) {
        existingHistory.daysTaken += days;
      } else {
        this.leaveHistory.push({ year: currentYear, daysTaken: days });
      }

      const totalDaysTaken = this.leaveHistory.reduce(
        (sum, record) => sum + record.daysTaken,
        0
      );

      if (totalDaysTaken > this.annualLeaveEntitled) {
        return next(
          new Error("Annual leave entitlement exceeded for the year")
        );
      }

      this.leaveBalance = this.annualLeaveEntitled - totalDaysTaken;
    }
  }

  next();
});

const Leave = mongoose.model("Leave", leaveSchema);

module.exports = Leave;
