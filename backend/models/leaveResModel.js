// const mongoose = require("mongoose");
// const LeaveApplication = require("./leaveApplicationModel");
// const AppError = require("../utils/appError");
// const User = require("./userModel");

// // Leave schema
// const leaveResSchema = new mongoose.Schema(
//   {
//     isEntitled: Boolean,
//     annualLeaveEntitled: Number,
//     leaveBalance: Number,
//     status: {
//       type: String,
//       enum: {
//         values: ["pending", "approved", "rejected"],
//         message: "{VALUE} is not supported",
//       },
//       default: "pending",
//     },
//     approvedOn: Date,
//     modifiedStartDate: Date,
//     modifiedEndDate: Date,
//     daysApproved: Number,
//     approvedBy: {
//       type: mongoose.Schema.ObjectId,
//       ref: "User",
//     },
//     leaveBalance: {
//       type: Number,
//       // required: [true, "State the remaining leave balance"],
//     },
//     application: [
//       {
//         type: mongoose.Schema.ObjectId,
//         ref: "LeaveApplication",
//       },
//     ],

//     leaveHistory: [
//       {
//         year: Number,
//         daysTaken: Number,
//       },
//     ],
//   },

//   {
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// leaveResSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "approvedBy",
//     select: "firstName lastName",
//   }).populate("application");
//   next();
// });

// // mongoose statics to handle leave application history
// leaveResSchema.statics.updateLeaveBalance = async function (leaveAppDoc) {
//   // get employee's id
//   const employeeId = leaveAppDoc.employee;
//   // get leave category
//   const leaveCategory = leaveAppDoc.leaveCategory;

//   if (leaveCategory === "annual" || leaveCategory === "casual") {
//     const currentYear = new Date().getFullYear();
//     // console.log("CURRENT YEAR", currentYear);

//     // get existing leaveHistory for the employee
//     const existingLeave = await this.findOne({ employee: employeeId });

//     console.log("EXISTING LEAVE", existingLeave);

//     // find current year
//     if (existingLeave) {
//       let existingHistory = existingLeave.leaveHistory.find(
//         (record) => record.year === currentYear
//       );
//       // if there is existing leave history for the year add days approved to leaveHistory daysTaken if not create new year with days approved as daysTaken
//       if (existingHistory) {
//         existingHistory.daysTaken += leaveAppDoc.daysApproved;
//       } else {
//         existingLeave.leaveHistory.push({
//           year: currentYear,
//           daysTaken: leaveDocApp.daysApproved,
//         });
//       }

//       const totalDaysTaken = existingLeave.leaveHistory.reduce(
//         (sum, record) => sum + record.daysTaken,
//         0
//       );

//       // check if employee has enough leave benefit
//       if (totalDaysTaken > existingLeave.annualLeaveEntitled) {
//         next(new AppError("Annual leave benefits exceeded for the year"));
//       }
//       existingLeave.leaveBalance =
//         existingLeave.annualLeaveEntitled - totalDaysTaken;

//       await existingLeave.save();
//     }
//   }
// };

// leaveResSchema.pre("save", async function (next) {
//   // console.log("Inside pre-save hook for LeaveResponse");

//   // Fetch the associated application
//   const application = await mongoose
//     .model("LeaveApplication")
//     .findById(this.application);

//   // console.log("APP", application);

//   // check is there is a leave application
//   if (!application) {
//     return next(new AppError("No Application found", 404));
//   }

//   // console.log("Application found: ", application);
//   // console.log("LEAVE CAT: ", application.leaveCategory);

//   if (
//     application.leaveCategory === "annual" &&
//     this.status === "approved" &&
//     this.modifiedStartDate &&
//     this.modifiedEndDate
//   ) {
//     const difference = this.modifiedEndDate - this.modifiedStartDate;
//     this.daysApproved = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;

//     // if (this.daysApproved <= this.annualLeaveEntitled) {
//     //   this.annualLeaveEntitled = this.annualLeaveEntitled - this.daysApproved;
//     //   this.leaveBalance = this.annualLeaveEntitled;

//     try {
//       await this.constructor.updateLeaveBalance(this);
//     } catch (error) {
//       return next(error);
//     }
//   } else {
//     this.daysApproved = undefined;
//   }

//   // console.log(
//   //   "Leave approved. Annual leave entitlement updated to:",
//   //   this.annualLeaveEntitled
//   // );

//   next();
// });

// const LeaveResponse = mongoose.model("LeaveResponse", leaveResSchema);
// module.exports = LeaveResponse;

const mongoose = require("mongoose");
const LeaveApplication = require("./leaveApplicationModel");
const AppError = require("../utils/appError");
// const User = require("./userModel");

const leaveResSchema = new mongoose.Schema(
  {
    isEntitled: Boolean,
    annualLeaveEntitled: Number,
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
    application: {
      type: mongoose.Schema.ObjectId,
      ref: "LeaveApplication",
      required: [true, "Leave must be associated with an application"],
    },
    leaveBalance: {
      type: Number,
      // required: [true, "State the remaining leave balance"],
    },
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

leaveResSchema.statics.updateLeaveBalance = async function (leaveResDoc) {
  const application = await LeaveApplication.findById(leaveResDoc.application);

  console.log("APP", application);
  if (!application) {
    throw new AppError("No Application found", 404);
  }

  const employeeId = application.employee;
  const leaveCategory = application.leaveCategory;

  if (leaveCategory === "annual" || leaveCategory === "casual") {
    const currentYear = new Date().getFullYear();

    console.log("ID,CAT, YEAR", employeeId, leaveCategory, currentYear);

    const existingLeave = await this.findOne({ employee: employeeId });
    console.log("ExistingLeave => ", existingLeave);

    if (existingLeave) {
      let existingHistory = existingLeave.leaveHistory.find(
        (record) => record.year === currentYear
      );

      console.log("ExistingHistory => ", existingHistory);

      if (existingHistory) {
        existingHistory.daysTaken += leaveResDoc.daysApproved;
      } else {
        existingLeave.leaveHistory.push({
          year: currentYear,
          daysTaken: leaveResDoc.daysApproved,
        });
      }

      const totalDaysTaken = existingLeave.leaveHistory.reduce(
        (sum, record) => sum + record.daysTaken,
        0
      );

      if (totalDaysTaken > existingLeave.annualLeaveEntitled) {
        throw new AppError(
          "Annual leave entitlement exceeded for the year",
          400
        );
      }

      existingLeave.leaveBalance =
        existingLeave.annualLeaveEntitled - totalDaysTaken;

      console.log("BALANCE", existingLeave.leaveBalance);

      await existingLeave.save();
    }
  }
};

leaveResSchema.pre("save", async function (next) {
  const application = await LeaveApplication.findById(this.application);

  if (!application) {
    return next(new AppError("No Application found", 404));
  }

  if (
    application.leaveCategory === "annual" &&
    this.status === "approved" &&
    this.modifiedStartDate &&
    this.modifiedEndDate
  ) {
    const difference = this.modifiedEndDate - this.modifiedStartDate;
    this.daysApproved = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;

    console.log("DAYS APPROVED", this.daysApproved);
    try {
      await this.constructor.updateLeaveBalance(this);
    } catch (error) {
      return next(error);
    }
  } else {
    this.daysApproved = undefined;
  }

  next();
});

const LeaveResponse = mongoose.model("LeaveResponse", leaveResSchema);
module.exports = LeaveResponse;
