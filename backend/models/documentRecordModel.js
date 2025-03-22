const mongoose = require("mongoose");

const documentRecordSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: [true, "please provide document's name"],
      trim: true,
    },
    documentType: {
      type: String,
      enum: [
        "Court Process",
        "Client Document",
        "Official Correspondence",
        "Others",
      ],
      required: [true, "Please select document type"],
    },

    docRef: { type: String, trim: true },
    sender: {
      type: String,
      required: [true, "Please provide sender's name"],
      trim: true,
    },
    dateReceived: {
      type: Date,
      default: Date.now,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    forwardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

documentRecordSchema.pre(/^find/, function (next) {
  this.populate({
    path: "forwardedTo",
    select: "firstName lastName",
  });

  this.populate({
    path: "recipient",
    select: "firstName lastName",
  });

  next();
});

const DocumentRecord = mongoose.model("DocumentRecord", documentRecordSchema);

module.exports = DocumentRecord;
