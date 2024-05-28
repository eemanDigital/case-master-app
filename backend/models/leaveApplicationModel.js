const mongoose = require("mongoose");
const User = require("./userModel");

const leaveApplicationSchema = new mongoose.Schema(
  {
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
      maxLength: [500, "Reason should not exceed 500 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    response: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "LeaveResponse",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leaveApplicationSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const difference = this.endDate - this.startDate;
    this.daysAppliedFor = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;
  }

  next();
});

leaveApplicationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "employee",
    select: "firstName lastName",
  });
  next();
});

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);

module.exports = LeaveApplication;
