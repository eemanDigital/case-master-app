const mongoose = require("mongoose");
const LeaveApplication = require("./leaveApplicationModel");
const AppError = require("../utils/appError");

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

leaveResSchema.pre("save", async function (next) {
  const application = await mongoose
    .model("LeaveApplication")
    .findById(this.application);
  if (!application) {
    next(new AppError("No Application found", 404));
  }
});

// Pre-save hook to calculate daysAppliedFor in leave application
// leaveApplicationSchema.pre("save", function (next) {
//   if (this.startDate && this.endDate) {
//     const difference = this.endDate - this.startDate;
//     this.daysAppliedFor = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;
//   }
//   next();
// });

// // Static method to update leave balance
// leaveSchema.statics.updateLeaveBalance = async function (leave) {
//   const currentYear = new Date().getFullYear();
//   const leaveCategory = leave.application.leaveCategory;

//   if (leaveCategory === "annual" || leaveCategory === "casual") {
//     const existingHistory = leave.leaveHistory.find(
//       (record) => record.year === currentYear
//     );

//     if (existingHistory) {
//       existingHistory.daysTaken += leave.daysApproved;
//     } else {
//       leave.leaveHistory.push({
//         year: currentYear,
//         daysTaken: leave.daysApproved,
//       });
//     }

//     const totalDaysTaken = leave.leaveHistory.reduce(
//       (sum, record) => sum + record.daysTaken,
//       0
//     );

//     if (totalDaysTaken > leave.annualLeaveEntitled) {
//       throw new Error("Annual leave entitlement exceeded for the year");
//     }

//     leave.leaveBalance = leave.annualLeaveEntitled - totalDaysTaken;
//   }

//   await leave.save();
// };

// // Pre-save hook for leave to calculate daysApproved and manage leave balance
// leaveSchema.pre("save", async function (next) {
//   if (this.isApproved && this.modifiedStartDate && this.modifiedEndDate) {
//     const difference = this.modifiedEndDate - this.modifiedStartDate;
//     this.daysApproved = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;
//     try {
//       await this.constructor.updateLeaveBalance(this);
//     } catch (error) {
//       return next(error);
//     }
//   } else {
//     this.daysApproved = undefined;
//   }
//   next();
// });

const LeaveResponse = mongoose.model("LeaveResponse", leaveResSchema);

module.exports = LeaveResponse;
