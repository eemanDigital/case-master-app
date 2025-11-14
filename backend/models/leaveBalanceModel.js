const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee reference is required"],
      unique: true,
      index: true,
    },
    annualLeaveBalance: {
      type: Number,
      required: [true, "Annual leave balance is required"],
      min: [0, "Annual leave balance cannot be negative"],
      default: 0,
    },
    sickLeaveBalance: {
      type: Number,
      required: [true, "Sick leave balance is required"],
      min: [0, "Sick leave balance cannot be negative"],
      default: 0,
    },
    maternityLeaveBalance: {
      type: Number,
      min: [0, "Maternity leave balance cannot be negative"],
      default: 0,
    },
    paternityLeaveBalance: {
      type: Number,
      min: [0, "Paternity leave balance cannot be negative"],
      default: 0,
    },
    compassionateLeaveBalance: {
      type: Number,
      min: [0, "Compassionate leave balance cannot be negative"],
      default: 0,
    },
    carryOverDays: {
      type: Number,
      min: [0, "Carry over days cannot be negative"],
      default: 0,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be 2000 or later"],
      default: () => new Date().getFullYear(),
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for employee and year
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

// Virtual for total available leave
leaveBalanceSchema.virtual("totalAvailableLeave").get(function () {
  return (
    this.annualLeaveBalance +
    this.sickLeaveBalance +
    this.maternityLeaveBalance +
    this.paternityLeaveBalance +
    this.compassionateLeaveBalance +
    this.carryOverDays
  );
});

// Update lastUpdated on save
leaveBalanceSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Populate employee details
leaveBalanceSchema.pre(/^find/, function (next) {
  this.populate({
    path: "employee",
    select: "firstName lastName email employeeId department",
  });
  next();
});

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

module.exports = LeaveBalance;
