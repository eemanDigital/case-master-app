const mongoose = require("mongoose");

// const responseSchema = new mongoose.Schema({
//   isApproved: Boolean,
//   responseDate: Date,
//   modifiedStartDate: Date,
//   modifiedEndDate: Date,
//   approvedBy: String,
//   status: {
//     type: String,
//     enum: ["pending", "approved", "rejected"],
//     default: "pending",
//   },
// });
// leave application sub document
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

// leave schema
const leaveSchema = new mongoose.Schema({
  isEntitled: Boolean,
  annual: Number,
  maternity: Number,
  paternity: Number,
  casual: Number,
  leaveBalance: Number,
  isApproved: {
    type: Boolean,
    required: [true, "Specify if leave is approved or not"],
  },
  approvedOn: {
    type: Date,
    default: Date.now(),
  },
  modifiedStartDate: Date,
  modifiedEndDate: Date,
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },

  application: [leaveApplicationSchema],
});

// calculate number of days applied for
leaveApplicationSchema.pre("save", function (next) {
  const convertedStartDate = this.startDate.getTime();
  const convertedEndDate = this.endDate.getTime();
  const difference = convertedEndDate - convertedStartDate;

  const days = Math.round(difference / (1000 * 60 * 60 * 24));
  this.daysAppliedFor = days;

  next();
});

// manage number of days entitled to
// leaveSchema.pre("save", function (next) {
//   if (this.leaveCategory === "annual") next();
// });

const Leave = mongoose.model("Leave", leaveSchema);

module.exports = Leave;
