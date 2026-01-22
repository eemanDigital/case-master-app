const mongoose = require("mongoose");

// Sub-schemas
const researchQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      trim: true,
      required: true,
    },
    answer: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "researching", "answered"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const deliverableSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      enum: ["legal-opinion", "memo", "report", "presentation", "other"],
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
  { timestamps: true },
);

// AdvisoryDetail Schema
const advisoryDetailSchema = new mongoose.Schema(
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
    // ADVISORY TYPE
    // ============================================
    advisoryType: {
      type: String,
      required: [true, "Advisory type is required"],
      enum: {
        values: [
          "legal_opinion",
          "regulatory_compliance",
          "due_diligence",
          "contract_review",
          "policy_development",
          "legal_research",
          "risk_assessment",
          "litigation_risk_analysis",
          "regulatory_strategy",
          "transaction_advisory",
          "other",
        ],
        message: "Invalid advisory type",
      },
    },

    otherAdvisoryType: {
      type: String,
      trim: true,
    },

    // ============================================
    // SCOPE & REQUEST
    // ============================================
    requestDescription: {
      type: String,
      trim: true,
      required: [true, "Request description is required"],
      maxlength: [
        5000,
        "Request description must be less than 5000 characters",
      ],
    },

    scope: {
      type: String,
      trim: true,
      maxlength: [5000, "Scope must be less than 5000 characters"],
    },

    researchQuestions: [researchQuestionSchema],

    // ============================================
    // JURISDICTION & APPLICABLE LAW
    // ============================================
    jurisdiction: [
      {
        type: String,
        trim: true,
        // E.g., "Nigeria", "Lagos State", "Federal"
      },
    ],

    applicableLaws: [
      {
        type: String,
        trim: true,
      },
    ],

    regulatoryBodies: [
      {
        type: String,
        trim: true,
        // E.g., "SEC", "CBN", "FCCPC"
      },
    ],

    // ============================================
    // RESEARCH & ANALYSIS
    // ============================================
    researchNotes: {
      type: String,
      trim: true,
      maxlength: [10000, "Research notes must be less than 10000 characters"],
    },

    keyFindings: [
      {
        finding: {
          type: String,
          trim: true,
        },
        source: {
          type: String,
          trim: true,
        },
        relevance: {
          type: String,
          trim: true,
        },
      },
    ],

    legalPrecedents: [
      {
        caseName: {
          type: String,
          trim: true,
        },
        citation: {
          type: String,
          trim: true,
        },
        summary: {
          type: String,
          trim: true,
        },
        relevance: {
          type: String,
          trim: true,
        },
      },
    ],

    // ============================================
    // OPINION & RECOMMENDATIONS
    // ============================================
    opinion: {
      summary: {
        type: String,
        trim: true,
        maxlength: [5000, "Opinion summary must be less than 5000 characters"],
      },
      conclusion: {
        type: String,
        trim: true,
        maxlength: [2000, "Conclusion must be less than 2000 characters"],
      },
      confidence: {
        type: String,
        enum: ["high", "medium", "low"],
      },
    },

    recommendations: [
      {
        recommendation: {
          type: String,
          trim: true,
        },
        priority: {
          type: String,
          enum: ["high", "medium", "low"],
        },
        implementationStatus: {
          type: String,
          enum: ["pending", "in-progress", "implemented", "rejected"],
          default: "pending",
        },
      },
    ],

    // ============================================
    // DELIVERABLES
    // ============================================
    deliverables: [deliverableSchema],

    // ============================================
    // COMPLIANCE TRACKING
    // ============================================
    complianceChecklist: [
      {
        requirement: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: [
            "compliant",
            "non-compliant",
            "partially-compliant",
            "not-applicable",
          ],
        },
        notes: {
          type: String,
          trim: true,
        },
        dueDate: {
          type: Date,
        },
      },
    ],

    // ============================================
    // RISK ASSESSMENT
    // ============================================
    riskAssessment: {
      overallRisk: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      risks: [
        {
          risk: {
            type: String,
            trim: true,
          },
          likelihood: {
            type: String,
            enum: ["low", "medium", "high"],
          },
          impact: {
            type: String,
            enum: ["low", "medium", "high"],
          },
          mitigation: {
            type: String,
            trim: true,
          },
        },
      ],
    },

    // ============================================
    // TIMELINE
    // ============================================
    requestDate: {
      type: Date,
      default: Date.now,
    },

    targetDeliveryDate: {
      type: Date,
    },

    actualDeliveryDate: {
      type: Date,
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

advisoryDetailSchema.index({ matterId: 1 }, { unique: true });
advisoryDetailSchema.index({ firmId: 1, advisoryType: 1 });
advisoryDetailSchema.index({ firmId: 1, targetDeliveryDate: 1 });

// ============================================
// MIDDLEWARE
// ============================================

advisoryDetailSchema.pre("save", async function (next) {
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

advisoryDetailSchema.virtual("matter", {
  ref: "Matter",
  localField: "matterId",
  foreignField: "_id",
  justOne: true,
});

const AdvisoryDetail =
  mongoose.models.AdvisoryDetail ||
  mongoose.model("AdvisoryDetail", advisoryDetailSchema);

module.exports = AdvisoryDetail;
