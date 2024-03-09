const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
  firstParty: {
    title: String,
    processesFiled: [String],
    name: [
      {
        type: String,
        required: [true, "A case must have a name"],
      },
    ],
  },
  secondParty: {
    title: String,
    processesFiled: [String],
    name: [
      {
        type: String,
        required: [true, "A case must have a name"],
      },
    ],
  },
  otherParty: {
    title: String,
    processesFiled: [String],
    name: [
      {
        type: String,
      },
    ],
  },
  suitNo: String,
  caseOfficeFileNo: String,
  courtName: {
    type: String,
    required: [true, "Court's name is required"],
    enum: {
      values: [
        "Supreme Court",
        "Court of Appeal",
        "Federal High Court",
        "High Court",
        "National Industrial Court",
        "Sharia Courts of Appeal",
        "Customary Court of Appeal",
        "Magistrate Court",
        "Customary Court",
        "Sharia Court",
        "Area Court",
        "Coroner",
        "Tribunal",
      ],
      message: "Invalid court name",
    },
  },
  judge: {
    name: [
      {
        type: String,
      },
    ],
  },
  caseSummary: {
    type: String,
    maxlength: [500, "Case summary should not be more than 500 characters"],
  },
  caseStatus: {
    type: String,
    enum: {
      values: ["Pending", "Closed", "Decided"],
    },
  },
  natureOfCase: String,
  filingDate: {
    type: Date,
    default: Date.now,
  },
  modeOfCommencement: {
    type: String,
    required: [true, "State the mode of commencement of the case"],
    enum: {
      values: [
        "Writ of Summons",
        "Originating Summons",
        "Originating Motion",
        "Petition",
        "Other",
      ],
    },
  },
  otherModeOfCommencement: String,
  caseStrengths: [String],
  caseWeaknesses: [String],
  casePriority: {
    type: String,
    enum: ["Low", "Medium", "High"],
  },
  stepToBeTaken: [String],
  caseUpdates: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      update: String,
    },
  ],
  task: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Task",
    },
  ],
  accountOfficer: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  client: [String],
  generalComment: String,
});

const Case = mongoose.model("Case", caseSchema);

module.exports = Case;