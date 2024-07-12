const mongoose = require("mongoose");

// Sub-document for party name
const nameSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
});

const judgeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
});

// Sub-document for processes
const partyProcessSchema = new mongoose.Schema({ name: String });

// Sub-document for documents
const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, "Provide file name"],
    trim: true,
  },
  file: {
    type: String,
    required: [true, "Provide document to upload"],
  },
});

// Case Schema
const caseSchema = new mongoose.Schema(
  {
    firstParty: {
      description: String,
      name: [nameSchema],
      processesFiled: [partyProcessSchema],
    },
    secondParty: {
      description: String,
      name: [nameSchema],
      processesFiled: [partyProcessSchema],
    },
    otherParty: [
      {
        description: String,
        name: [nameSchema],
        processesFiled: [partyProcessSchema],
      },
    ],
    suitNo: {
      type: String,
      trim: true,
    },
    caseOfficeFileNo: String,
    courtName: {
      type: String,
      trim: true,
      enum: {
        values: [
          "supreme court",
          "court of appeal",
          "federal high court",
          "high court",
          "national industrial court",
          "sharia courts of appeal",
          "customary court of appeal",
          "magistrate court",
          "customary court",
          "sharia court",
          "area court",
          "coroner",
          "tribunal",
          "others",
        ],
        message: "Invalid court name",
      },
    },
    courtNo: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    otherCourt: String,
    judge: [judgeSchema],
    caseSummary: {
      type: String,
      trim: true,
      maxlength: [2000, "Case summary should not be more than 1000 characters"],
    },
    caseStatus: {
      type: String,
      trim: true,
      enum: {
        values: ["pending", "closed", "decided", "settled", "lost", "won"],
      },
    },
    // caseStatus: {
    //   type: String,
    //   trim: true,
    //   enum: {
    //     values: ["pending", "closed", "decided", "settled"],
    //   },
    // },
    natureOfCase: {
      type: String,
      trim: true,
      enum: {
        values: [
          "contract dispute",
          "personal injury",
          "real estate",
          "land law",
          "pre-election",
          "election petition",
          "criminal law",
          "family law",
          "intellectual property",
          "employment law",
          "bankruptcy",
          "estate law",
          "tortous liability",
          "immigration",
          "maritime",
          "tax law",
          "other",
        ],
        message: "Invalid nature of case",
      },
    },
    category: {
      type: String,
      trim: true,
      enum: {
        values: ["civil", "criminal"],
        message: "A case must have a category",
      },
    },
    isFiledByTheOffice: Boolean,
    filingDate: {
      type: Date,
      default: Date.now,
    },
    modeOfCommencement: {
      type: String,
      trim: true,
      enum: {
        values: [
          "writ of summons",
          "originating summons",
          "originating motion",
          "petition",
          "other",
        ],
        message: "Invalid mode of commencement",
      },
    },
    otherModeOfCommencement: String,
    caseStrengths: [nameSchema],
    caseWeaknesses: [nameSchema],
    casePriority: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    stepToBeTaken: [nameSchema],
    accountOfficer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    client: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
      },
    ],

    generalComment: String,
    documents: [documentSchema],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

caseSchema.pre(/^find/, function (next) {
  // Populate the accountOfficer field with the firstName and lastName of the user
  this.populate({
    path: "accountOfficer",
    select: "firstName lastName phone email photo",
  });

  next();
});

// Virtual populate
caseSchema.virtual("reports", {
  ref: "Report",
  foreignField: "caseReported",
  localField: "_id",
});

caseSchema.virtual("reporter", {
  ref: "Report",
  foreignField: "reportedBy",
  localField: "_id",
});

const Case = mongoose.model("Case", caseSchema);

module.exports = Case;
