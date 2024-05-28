const mongoose = require("mongoose");
const LeaveApplication = require("./leaveApplicationModel");
const AppError = require("../utils/appError");
const User = require("./userModel");

// Leave schema
const leaveResSchema = new mongoose.Schema(
  {
    isEntitled: Boolean,
    annualLeaveEntitled: Number,
    leaveBalance: Number,
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "{VALUE} is not supported",
      },
      default: "pending",
    },
    approvedOn: Date,
    modifiedStartDate: Date,
    modifiedEndDate: Date,
    daysApproved: Number,
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    leaveBalance: {
      type: Number,
      required: [true, "State the remaining leave balance"],
    },
    application: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "LeaveApplication",
      },
    ],

    leaveHistory: [
      {
        year: Number,
        daysTaken: Number,
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leaveResSchema.pre(/^find/, function (next) {
  this.populate({
    path: "approvedBy",
    select: "firstName lastName",
  }).populate("application");
  next();
});

// handles application history
leaveResSchema.statics.updateLeaveBalance = async function (leaveApp) {
  // get employee's id
  const employeeId = leaveApp.employee;
  // get leave category
  const leaveCategory = leaveApp.leaveCategory;

  if (leaveCategory === "annual" || leaveCategory === "casual") {
    const currentYear = new Date().getFullYear();
    console.log("CURRENT YEAR", currentYear);
  }
};

leaveResSchema.pre("save", async function (next) {
  // console.log("Inside pre-save hook for LeaveResponse");

  // Fetch the associated application
  const application = await mongoose
    .model("LeaveApplication")
    .findById(this.application);

  // console.log("APP", application);

  // check is there is a leave application
  if (!application) {
    return next(new AppError("No Application found", 404));
  }

  console.log("Application found: ", application);
  console.log("LEAVE CAT: ", application.leaveCategory);

  if (
    application.leaveCategory === "annual" &&
    this.status === "approved" &&
    this.modifiedStartDate &&
    this.modifiedEndDate
  ) {
    const difference = this.modifiedEndDate - this.modifiedStartDate;
    this.daysApproved = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;

    if (this.daysApproved <= this.annualLeaveEntitled) {
      this.annualLeaveEntitled = this.annualLeaveEntitled - this.daysApproved;
      this.leaveBalance = this.annualLeaveEntitled;
    } else {
      return next(new AppError("You do not have up to what was approved"));
    }

    console.log(
      "Leave approved. Annual leave entitlement updated to:",
      this.annualLeaveEntitled
    );
  }

  next();
});

const LeaveResponse = mongoose.model("LeaveResponse", leaveResSchema);
module.exports = LeaveResponse;
