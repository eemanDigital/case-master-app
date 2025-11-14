const mongoose = require("mongoose");

const leaveApplicationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee reference is required"],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (value) {
          // Allow past dates for admin/HR creating historical records
          // Current date validation should be in controller/service layer
          return value instanceof Date && !isNaN(value);
        },
        message: "Invalid start date",
      },
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          return value >= this.startDate;
        },
        message: "End date must be on or after start date",
      },
    },
    applyTo: {
      type: String,
      required: [true, "Approving authority is required"],
      trim: true,
      maxlength: [200, "Authority name cannot exceed 200 characters"],
    },
    typeOfLeave: {
      type: String,
      required: [true, "Leave type is required"],
      enum: {
        values: [
          "annual",
          "casual",
          "sick",
          "maternity",
          "paternity",
          "unpaid",
          "compassionate",
        ],
        message: "{VALUE} is not a valid leave type",
      },
      index: true,
    },
    daysAppliedFor: {
      type: Number,
      required: [true, "Days applied for is required"],
      min: [0.5, "Minimum leave duration is 0.5 days"],
      max: [365, "Maximum leave duration is 365 days"],
    },
    daysApproved: {
      type: Number,
      min: [0, "Approved days cannot be negative"],
      validate: {
        validator: function (value) {
          return !value || value <= this.daysAppliedFor;
        },
        message: "Approved days cannot exceed applied days",
      },
    },
    reason: {
      type: String,
      required: [true, "Reason for leave is required"],
      trim: true,
      minlength: [10, "Reason must be at least 10 characters"],
      maxlength: [1000, "Reason cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
      index: true,
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: [500, "Response message cannot exceed 500 characters"],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
leaveApplicationSchema.index({ employee: 1, status: 1 });
leaveApplicationSchema.index({ startDate: 1, endDate: 1 });
leaveApplicationSchema.index({ createdAt: -1 });

// Virtual for checking if leave is active
leaveApplicationSchema.virtual("isActive").get(function () {
  const now = new Date();
  return (
    this.status === "approved" && this.startDate <= now && this.endDate >= now
  );
});

// Pre-save middleware to calculate days
leaveApplicationSchema.pre("save", function (next) {
  if (this.isModified("startDate") || this.isModified("endDate")) {
    this.daysAppliedFor = this.calculateLeaveDays(this.startDate, this.endDate);
  }
  next();
});

// Method to calculate leave days (excluding weekends - optional)
leaveApplicationSchema.methods.calculateLeaveDays = function (start, end) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.ceil((end - start) / msPerDay) + 1;
  return days;
};

// Populate employee details on find queries
leaveApplicationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "employee",
    select: "firstName lastName email photo employeeId department",
  }).populate({
    path: "reviewedBy",
    select: "firstName lastName email",
  });
  next();
});

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);

module.exports = LeaveApplication;
