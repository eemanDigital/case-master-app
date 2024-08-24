const mongoose = require("mongoose");

// Sub-document for party name
const nameSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [2, "field should be at least 2 characters long"],
    maxlength: [200, "field should be less than 100 characters long"],
  },
});

// Sub-document for judge
const judgeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Judge name is required"],
    minlength: [2, "Judge name must be at least 2 characters long"],
    maxlength: [100, "Judge name must be less than 100 characters long"],
  },
});

// Sub-document for processes
const partyProcessSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Process name is required"],
  },
});

// Sub-document for documents
const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, "File name is required"],
    trim: true,
    maxlength: [200, "File name must be less than 200 characters long"],
  },
  file: {
    type: String,
    required: [true, "Document file is required"],
  },
});

// Case Schema
const caseSchema = new mongoose.Schema(
  {
    firstParty: {
      description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description must be less than 1000 characters long"],
      },
      name: [nameSchema],
      processesFiled: [partyProcessSchema],
    },
    secondParty: {
      description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description must be less than 1000 characters long"],
      },
      name: [nameSchema],
      processesFiled: [partyProcessSchema],
    },
    otherParty: [
      {
        description: {
          type: String,
          trim: true,
          maxlength: [
            1000,
            "Description must be less than 1000 characters long",
          ],
        },
        name: [nameSchema],
        processesFiled: [partyProcessSchema],
      },
    ],
    suitNo: {
      type: String,
      trim: true,
      required: [true, "Suit number is required"],
      unique: true,
      minlength: [3, "Suit number must be at least 3 characters long"],
    },
    caseOfficeFileNo: {
      type: String,
      trim: true,
    },
    courtName: {
      type: String,
      trim: true,
      required: [true, "Court name is required"],
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
          "election tribunal",
          "code of conduct tribunal",
          "tax appeal tribunal",
          "rent tribunal",
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
      required: [true, "State is required"],
    },
    otherCourt: String,
    judge: [judgeSchema],
    caseSummary: {
      type: String,
      trim: true,
      required: [true, "Provide a brief fact of the case"],

      maxlength: [4000, "Case summary should not exceed 2000 characters"],
    },
    caseStatus: {
      type: String,
      trim: true,
      required: [true, "Provide case status"],
      enum: {
        values: ["pending", "closed", "decided", "settled", "lost", "won"],
        message: "Invalid case status",
      },
    },
    natureOfCase: {
      type: String,
      trim: true,
      required: [true, "specify nature of case filed"],
      enum: {
        values: [
          "contract dispute",
          "personal injury",
          "real estate",
          "land law",
          "pre-election",
          "election petition",
          "family law",
          "intellectual property",
          "employment law",
          "bankruptcy",
          "estate law",
          "tortous liability",
          "immigration",
          "maritime",
          "tax law",
          "constitutional law",
          "environmental law",
          "human rights",
          "corporate law",
          "commercial law",
          "criminal law",
          "insurance law",
          "consumer protection",
          "cyber law",
          "energy law",
          "entertainment law",
          "healthcare law",
          "media law",
          "military law",
          "public international law",
          "private international law",
          "telecommunications law",
          "transportation law",
          "trusts and estates",
          "urban development law",
          "water law",
          "other",
        ],
        message: "Invalid nature of case",
      },
    },
    category: {
      type: String,
      trim: true,
      required: [true, "select case category"],
      enum: {
        values: ["civil", "criminal"],
        message: "Category must be either civil or criminal",
      },
      required: [true, "Case category is required"],
    },
    isFiledByTheOffice: {
      type: Boolean,
      default: false,
    },
    filingDate: {
      type: Date,
      required: [true, "specify filing date"],
      default: Date.now,
    },
    modeOfCommencement: {
      type: String,
      trim: true,
      required: [true, "Specify mode of commencement of the suit"],
      enum: {
        values: [
          "writ of summons",
          "originating summons",
          "originating motion",
          "petition",
          "information",
          "charge",
          "application",
          "notice of appeal",
          "notice of application",
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
      required: [true, "specify the rank/priority of the case"],
      enum: ["low", "medium", "high"],
    },
    stepToBeTaken: [nameSchema],
    accountOfficer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    generalComment: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "General comment must be less than 2000 characters long",
      ],
    },
    documents: [documentSchema],
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
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

// // exclude deleted document from all find query
// caseSchema.pre(/^find/, function () {
//   this.where({ deleted: false });
//   // next()
// });

// // method to soft delete
// caseSchema.methods.softDelete = function () {
//   this.deleted = true;
//   this.deletedAt = new Date();
//   return this.save();
// };

// middle to deactivate document upon delete
caseSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
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
