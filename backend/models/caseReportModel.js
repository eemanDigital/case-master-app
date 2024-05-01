const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    // required: [true, "A case must have a name"],
  },
  caseReported: {
    type: mongoose.Schema.ObjectId,
    ref: "Case",
  },

  update: {
    type: "string",
    trim: true,
    // required: [true, "A case must have a name"],
  },
  adjournedDate: {
    type: Date,
    default: Date.now,
    // required: [true, "A case must have a name"],
  },

  reportedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

// populate case and reporter
reportSchema.pre(/^find/, function (next) {
  this.populate({
    path: "reportedBy",
    select: "firstName lastName middleName",
  }).populate({
    path: "caseReported",
    select: "firstParty.name.name  secondParty.name.name",
  });
  next();
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
