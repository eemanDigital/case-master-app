const mongoose = require("mongoose");

const leaveApplicationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
    min: Date.now(),
  },
  endDate: {
    type: Date,
    required: true,
  },
  typeOfLeave: {
    type: String,
    required: true,
  },
  reason: String,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  responseMessage: String,
});

// leaveApplicationSchema.pre("save", function (next) {
//   if (this.startDate && this.endDate) {
//     const difference = this.endDate - this.startDate;
//     this.daysAppliedFor = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;
//   }

//   next();
// });

// leaveApplicationSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "employee",
//     select: "firstName lastName",
//   }).populate("response");
//   next();
// });

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);

module.exports = LeaveApplication;
