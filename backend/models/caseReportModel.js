const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    caseReported: {
      type: mongoose.Schema.ObjectId,
      ref: "Case",
    },

    date: {
      type: Date,
      default: Date.now,
    },

    update: {
      type: "string",
      trim: true,
      required: [true, "A case must have a name"],
    },

    adjournedFor: {
      type: String,
      trim: true,
      required: [true, "Set what the matter was adjourned for"],
    },
    adjournedDate: {
      type: Date,
      default: Date.now,
      required: [true, "A case must have a name"],
    },

    reportedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A case must have a reporter"],
    },

    clientEmail: {
      type: String,
      require: true,
    },

    lawyersInCourt: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// populate case and reporter
reportSchema.pre(/^find/, function (next) {
  this.populate({
    path: "reportedBy",
    select: "firstName lastName middleName",
  })
    .populate({
      path: "caseReported",
      select:
        "firstParty.name.name  secondParty.name.name client courtName suitNo courtNo location state",
    })
    .populate({
      path: "lawyersInCourt",
      select: "firstName lastName middleName",
    });
  next();
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
