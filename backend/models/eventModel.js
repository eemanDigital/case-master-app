const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.start;
        },
        message: "End date must be after start date",
      },
    },
    description: {
      type: String,
      maxlength: 500,
    },
    // caseId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Case",
    //   required: true,
    // },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    location: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

eventSchema.pre(/^find/, function (next) {
  this.populate({
    path: "participants",
    select: "firstName lastName secondName",
  });

  next();
});

module.exports = mongoose.model("Event", eventSchema);
