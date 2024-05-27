const mongoose = require("mongoose");
const User = require("../models/userModel");

// Leave application sub-document schema
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

leaveApplicationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "employee",
    select: "firstName lastName",
  }).populate("response");
  next();
});

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);
module.exports = LeaveApplication;
