const mongoose = require("mongoose");

const leaveApplicationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Provide start date"],
      min: Date.now(),
    },
    endDate: {
      type: Date,
      required: [true, "Provide end date"],
    },
    applyTo: {
      type: String,
      required: [true, "Provide the authority you are applying to"],
    },
    typeOfLeave: {
      type: String,
      required: [true, "Specify the type of leave"],
    },
    daysAppliedFor: Number,
    daysApproved: Number,
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    reason: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    responseMessage: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// leaveApplicationSchema.pre("save", function (next) {
//   if (this.startDate && this.endDate) {
//     const difference = this.endDate - this.startDate;
//     this.daysAppliedFor = Math.round(difference / (1000 * 60 * 60 * 24)) + 1;
//   }

//   next();
// });

leaveApplicationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "employee",
    select: "firstName lastName photo email",
  });
  next();
});

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);

module.exports = LeaveApplication;
