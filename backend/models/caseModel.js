const mongoose = require("mongoose");
// sub-document for party name
const nameSchema = new mongoose.Schema({
  name: {
    type: "string",
    trim: true,
    // required: [true, "A case must have a name"],
  },
});
const judgeSchema = new mongoose.Schema({
  name: {
    type: "string",
    trim: true,
    // required: [true, "A case must have a name"],
  },
});
const caseUpdateSchema = new mongoose.Schema({
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
});

// sub-document for processes
const partyProcessSchema = new mongoose.Schema({ name: String });

const caseSchema = new mongoose.Schema({
  firstParty: {
    title: String,
    processesFiled: [partyProcessSchema],
    description: [nameSchema],
  },
  secondParty: {
    title: String,
    processesFiled: [partyProcessSchema],
    description: [nameSchema],
  },

  otherParty: [
    {
      title: String,
      processesFiled: [partyProcessSchema],
      description: [nameSchema],
    },
  ],

  suitNo: {
    type: String,
    trim: true,
    // required: [true, "A case must have a suit no"],
    // unique: [true, "This suit no. has been used"],
    trim: true,
  },
  caseOfficeFileNo: String,
  courtName: {
    type: String,
    trim: true,
    // required: [true, "Court's name is required"],
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
  otherCourt: String,
  judge: [judgeSchema],
  caseSummary: {
    type: String,
    trim: true,
    maxlength: [500, "Case summary should not be more than 500 characters"],
  },
  caseStatus: {
    type: String,
    trim: true,
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
    trim: true,
    // required: [true, "State the mode of commencement of the case"],
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
  caseStrengths: [nameSchema],
  caseWeaknesses: [nameSchema],
  casePriority: {
    type: String,
    enum: ["Low", "Medium", "High"],
  },
  stepToBeTaken: [nameSchema],
  caseUpdates: [caseUpdateSchema],
  task: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Task",
    },
  ],
  accountOfficer: [String],
  client: [nameSchema],
  generalComment: String,
});

const Case = mongoose.model("Case", caseSchema);

module.exports = Case;
