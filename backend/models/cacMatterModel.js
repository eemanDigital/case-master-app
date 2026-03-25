const mongoose = require("mongoose");

const protectedDocumentSchema = new mongoose.Schema({
  originalFileUrl: String,
  watermarkedFileUrl: String,
  thumbnailUrl: String,
  originalFilename: String,
  mimeType: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isBalancePaid: {
    type: Boolean,
    default: false,
  },
  balancePaidAt: Date,
  balancePaidConfirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  balanceAmount: Number,
  accessLog: [{
    accessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    accessedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
    wasGranted: Boolean,
    attemptType: {
      type: String,
      enum: ["view", "download"],
    },
  }],
}, { _id: false });

const cacMatterSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client ID is required"],
    },

    matterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
    },

    matterNumber: {
      type: String,
      trim: true,
    },

    registrationType: {
      type: String,
      enum: [
        "business-name",
        "private-limited",
        "public-limited",
        "limited-by-guarantee",
        "unlimited-company",
        "incorporation",
        "registration",
        "name-change",
        "increase-capital",
        "restoration",
        "other",
      ],
      required: [true, "Registration type is required"],
    },

    companyName: {
      type: String,
      trim: true,
    },

    rcNumber: {
      type: String,
      trim: true,
    },

    bnNumber: {
      type: String,
      trim: true,
    },

    proposedNames: [{
      name: String,
      priority: Number,
      approved: Boolean,
    }],

    registeredAddress: {
      street: String,
      city: String,
      state: String,
      lga: String,
      postalCode: String,
    },

    shareholders: [{
      name: String,
      nationality: String,
      email: String,
      phone: String,
      address: String,
      idType: String,
      idNumber: String,
      isNigerian: {
        type: Boolean,
        default: true,
      },
      shares: Number,
    }],

    directors: [{
      name: String,
      nationality: String,
      email: String,
      phone: String,
      address: String,
      idType: String,
      idNumber: String,
      isNigerian: {
        type: Boolean,
        default: true,
      },
      position: String,
      appointmentDate: Date,
    }],

    secretaries: [{
      name: String,
      email: String,
      phone: String,
      firmName: String,
    }],

    shareCapital: {
      authorized: Number,
      paidUp: Number,
      currency: {
        type: String,
        default: "NGN",
      },
    },

    objects: [{
      serial: Number,
      description: String,
    }],

    status: {
      type: String,
      enum: [
        "draft",
        "name-reservation-pending",
        "name-reserved",
        "name-rejected",
        "incorporation-pending",
        "incorporation-submitted",
        "incorporation-approved",
        "incorporation-rejected",
        "certificate-issued",
        "completed",
        "rejected",
        "cancelled",
      ],
      default: "draft",
    },

    nameReservationExpiry: Date,

    timeline: [{
      action: {
        type: String,
        trim: true,
      },
      description: String,
      date: {
        type: Date,
        default: Date.now,
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      documents: [{
        name: String,
        url: String,
        type: String,
      }],
    }],

    documents: [{
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: [
          "id-card",
          "passport-photo",
          "proof-of-address",
          "name-reservation",
          "certificate",
          "mou",
          "other",
        ],
      },
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    }],

    fees: {
      registrationFee: Number,
      processingFee: Number,
      vat: Number,
      total: Number,
      paid: {
        type: Boolean,
        default: false,
      },
      paidAt: Date,
      paymentReference: String,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    protectedDocument: protectedDocumentSchema,

    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cacMatterSchema.index({ firmId: 1, status: 1 });
cacMatterSchema.index({ firmId: 1, registrationType: 1 });
cacMatterSchema.index({ firmId: 1, clientId: 1 });

cacMatterSchema.index({ bnNumber: 1 });
cacMatterSchema.index({ companyName: "text" });

cacMatterSchema.virtual("isComplete").get(function () {
  return this.status === "completed";
});

cacMatterSchema.virtual("daysUntilNameExpiry").get(function () {
  if (!this.nameReservationExpiry) return null;
  const now = new Date();
  const expiry = new Date(this.nameReservationExpiry);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

cacMatterSchema.set("toJSON", { virtuals: true });
cacMatterSchema.set("toObject", { virtuals: true });

cacMatterSchema.statics.getNextMatterNumber = async function (firmId) {
  const year = new Date().getFullYear();
  const prefix = `CAC-${year}-`;

  const lastMatter = await this.findOne({
    firmId,
    matterNumber: new RegExp(`^${prefix}`),
  })
    .sort({ matterNumber: -1 })
    .select("matterNumber");

  let lastNumber = 0;
  if (lastMatter && lastMatter.matterNumber) {
    const numStr = lastMatter.matterNumber.replace(prefix, "");
    lastNumber = parseInt(numStr, 10) || 0;
  }

  const newNumber = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}${newNumber}`;
};

const CacMatter = mongoose.model("CacMatter", cacMatterSchema);

module.exports = CacMatter;
