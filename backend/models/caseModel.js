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

// sub-document for processes
const partyProcessSchema = new mongoose.Schema({ name: String });

// case Schema
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
      maxlength: [1000, "Case summary should not be more than 500 characters"],
    },

    caseStatus: {
      type: String,
      trim: true,
      enum: {
        values: ["Pending", "Closed", "Decided"],
      },
    },

    // natureOfCase: String,

    natureOfCase: {
      type: String,
      trim: true,
      // required: [true, "Court's name is required"],
      enum: {
        values: [
          "Contract Dispute",
          "Personal Injury",
          "Real Estate",
          "Land Law",
          "Pre-election",
          "Election Petition",
          "Criminal Law",
          "Family Law",
          "Intellectual Property",
          "Employment Law",
          "Bankruptcy",
          "Estate Law",
          "Tortous Liability ",
          "Immigration",
          "Maritime",
          "Aviation",
          "Tax Law",
          "Other",
        ],
      },
    },

    category: {
      type: String,
      trim: true,
      enum: {
        values: ["Civil", "Criminal"],
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

    accountOfficer: [String],
    client: [nameSchema],
    generalComment: String,

    documents: [
      {
        name: {
          type: String,
          maxLength: [20, "file name can not be more than 20 characters"],
        },
        file: String, //this is file upload
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// caseSchema.virtual("caseFullTitle").get(function () {
//   return (
//     this?.firstParty?.description[0]?.name +
//     " " +
//     "vs" +
//     " " +
//     this?.secondParty?.description[0]?.name
//   );
// });
// virtual for full title name
// caseSchema.virtual("caseFullTitle").get(function () {
//   const { firstParty, secondParty } = this;
//   const firstName = firstParty?.description[0]?.name;
//   const secondName = secondParty?.description[0]?.name;

//   return `${firstName || ""} vs ${secondName || ""}`;
// });

// caseSchema.pre(/^find/, function (next) {
//   const newDate = new Date(this.fillingDate);

//   const options = { year: "numeric", month: "long", day: "numeric" };
//   new Intl.DateTimeFormat("en-US", options).format(newDate);

//   next();
// });

// virtual populate
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
