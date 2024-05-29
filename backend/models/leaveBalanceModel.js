const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema({
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
  // add other types of leaves if needed
});

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

module.exports = LeaveBalance;
