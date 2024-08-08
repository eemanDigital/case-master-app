const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    annualLeaveBalance: {
      type: Number,
      default: 0,
    },
    sickLeaveBalance: {
      type: Number,
      default: 0,
    },
    dayAwarded: {
      type: Date,
      default: Date.now,
    },

    // add other types of leaves if needed
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leaveBalanceSchema.pre(/^find/, function (next) {
  this.populate({
    path: "employee",
    select: "firstName lastName photo",
  });
  next();
});

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

module.exports = LeaveBalance;
