const mongoose = require("mongoose");

// ============================================
// RETAINER DETAIL MODEL
// ============================================

const serviceSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    hoursAllocated: {
      type: Number,
      min: 0,
    },
    hoursUsed: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const retainerDetailSchema = new mongoose.Schema(
  {
    matterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
      required: [true, "Matter ID is required"],
      unique: true,
      index: true,
    },

    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },

    // ============================================
    // RETAINER AGREEMENT DETAILS
    // ============================================
    retainerType: {
      type: String,
      required: [true, "Retainer type is required"],
      enum: {
        values: [
          "general-counsel",
          "advisory",
          "compliance",
          "specialized",
          "other",
        ],
        message: "Invalid retainer type",
      },
    },

    agreementStartDate: {
      type: Date,
      required: [true, "Agreement start date is required"],
    },

    agreementEndDate: {
      type: Date,
    },

    autoRenewal: {
      type: Boolean,
      default: false,
    },

    renewalTerms: {
      type: String,
      trim: true,
    },

    // ============================================
    // SCOPE OF SERVICES
    // ============================================
    servicesIncluded: [serviceSchema],

    scopeDescription: {
      type: String,
      trim: true,
      required: [true, "Scope description is required"],
      maxlength: [5000, "Scope description must be less than 5000 characters"],
    },

    exclusions: [
      {
        type: String,
        trim: true,
      },
    ],

    // ============================================
    // BILLING & FEES
    // ============================================
    retainerFee: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually"],
        required: true,
      },
    },

    additionalFees: {
      isApplicable: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
        trim: true,
      },
    },

    billingCap: {
      isApplicable: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        min: 0,
      },
      period: {
        type: String,
        enum: ["monthly", "quarterly", "annually"],
      },
    },

    // ============================================
    // SERVICE DELIVERY
    // ============================================
    responseTimes: {
      routine: {
        value: Number,
        unit: {
          type: String,
          enum: ["hours", "days"],
        },
      },
      urgent: {
        value: Number,
        unit: {
          type: String,
          enum: ["hours", "days"],
        },
      },
    },

    meetingSchedule: {
      frequency: {
        type: String,
        enum: ["weekly", "bi-weekly", "monthly", "quarterly", "as-needed"],
      },
      description: {
        type: String,
        trim: true,
      },
    },

    reportingRequirements: {
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually", "as-needed"],
      },
      format: {
        type: String,
        trim: true,
      },
    },

    // ============================================
    // PERFORMANCE TRACKING
    // ============================================
    requests: [
      {
        requestDate: {
          type: Date,
          required: true,
        },
        requestType: {
          type: String,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        responseDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed", "on-hold"],
          default: "pending",
        },
        hoursSpent: {
          type: Number,
          min: 0,
        },
      },
    ],

    totalRequestsHandled: {
      type: Number,
      default: 0,
    },

    // ============================================
    // TERMINATION
    // ============================================
    terminationClause: {
      noticePeriod: {
        value: Number,
        unit: {
          type: String,
          enum: ["days", "weeks", "months"],
        },
      },
      conditions: {
        type: String,
        trim: true,
      },
    },

    // ============================================
    // SOFT DELETE & AUDIT
    // ============================================
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================
// INDEXES
// ============================================

retainerDetailSchema.index({ matterId: 1 }, { unique: true });
retainerDetailSchema.index({ firmId: 1, retainerType: 1 });
retainerDetailSchema.index({ firmId: 1, agreementEndDate: 1 });

// ============================================
// MIDDLEWARE
// ============================================

retainerDetailSchema.pre("save", async function (next) {
  if (this.isNew && this.matterId) {
    const Matter = mongoose.model("Matter");
    const matter = await Matter.findById(this.matterId).select("firmId");
    if (matter) {
      this.firmId = matter.firmId;
    }
  }

  // Update total requests count
  if (this.isModified("requests")) {
    this.totalRequestsHandled = this.requests.length;
  }

  next();
});

// ============================================
// VIRTUALS
// ============================================

retainerDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

// ============================================
// GENERAL DETAIL MODEL
// ============================================

const generalDetailSchema = new mongoose.Schema(
  {
    matterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
      required: [true, "Matter ID is required"],
      unique: true,
      index: true,
    },

    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },

    // ============================================
    // GENERAL SERVICE TYPE
    // ============================================
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: {
        values: [
          "notarial-services",
          "documentation",
          "legal-representation",
          "consultation",
          "arbitration",
          "mediation",
          "registration",
          "certification",
          "attestation",
          "verification",
          "other",
        ],
        message: "Invalid service type",
      },
    },

    otherServiceType: {
      type: String,
      trim: true,
    },

    // ============================================
    // SERVICE DETAILS
    // ============================================
    serviceDescription: {
      type: String,
      trim: true,
      required: [true, "Service description is required"],
      maxlength: [
        5000,
        "Service description must be less than 5000 characters",
      ],
    },

    specificRequirements: [
      {
        requirement: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: ["pending", "met", "not-applicable"],
          default: "pending",
        },
      },
    ],

    // ============================================
    // PARTIES INVOLVED
    // ============================================
    partiesInvolved: [
      {
        name: {
          type: String,
          trim: true,
        },
        role: {
          type: String,
          trim: true,
        },
        contact: {
          type: String,
          trim: true,
        },
      },
    ],

    // ============================================
    // DELIVERABLES
    // ============================================
    expectedDeliverables: [
      {
        deliverable: {
          type: String,
          trim: true,
        },
        dueDate: {
          type: Date,
        },
        deliveryDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "in-progress", "delivered", "approved"],
          default: "pending",
        },
      },
    ],

    // ============================================
    // DOCUMENTATION
    // ============================================
    documentsRequired: [
      {
        documentType: {
          type: String,
          trim: true,
        },
        isReceived: {
          type: Boolean,
          default: false,
        },
        receivedDate: {
          type: Date,
        },
      },
    ],

    // ============================================
    // TIMELINE
    // ============================================
    requestDate: {
      type: Date,
      default: Date.now,
    },

    expectedCompletionDate: {
      type: Date,
    },

    actualCompletionDate: {
      type: Date,
    },

    // ============================================
    // NOTES & REMARKS
    // ============================================
    procedureNotes: {
      type: String,
      trim: true,
      maxlength: [5000, "Procedure notes must be less than 5000 characters"],
    },

    // ============================================
    // SOFT DELETE & AUDIT
    // ============================================
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================
// INDEXES
// ============================================

generalDetailSchema.index({ matterId: 1 }, { unique: true });
generalDetailSchema.index({ firmId: 1, serviceType: 1 });
generalDetailSchema.index({ firmId: 1, expectedCompletionDate: 1 });

// ============================================
// MIDDLEWARE
// ============================================

generalDetailSchema.pre("save", async function (next) {
  if (this.isNew && this.matterId) {
    const Matter = mongoose.model("Matter");
    const matter = await Matter.findById(this.matterId).select("firmId");
    if (matter) {
      this.firmId = matter.firmId;
    }
  }
  next();
});

// ============================================
// VIRTUALS
// ============================================

generalDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

// ============================================
// EXPORT MODELS
// ============================================

const RetainerDetail = mongoose.model("RetainerDetail", retainerDetailSchema);
const GeneralDetail = mongoose.model("GeneralDetail", generalDetailSchema);

module.exports = {
  RetainerDetail,
  GeneralDetail,
};
