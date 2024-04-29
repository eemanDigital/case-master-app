const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    // required: [true, "A case must have a name"],
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

  reporter: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },

  caseReported: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Case",
    },
  ],
});

// populate case and reporter
reportSchema.pre(/^find/, function (next) {
  this.populate({
    path: "reporter",
    select: "firstName lastName middleName",
  }).populate({
    path: "caseReported",
    select: "firstParty.description.name",
  });
  next();
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
