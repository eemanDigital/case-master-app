// models/platformInviteModel.js
const mongoose = require("mongoose");
const crypto = require("crypto");

const platformInviteSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    targetPlan: {
      type: String,
      enum: ["BASIC", "PRO", "ENTERPRISE"],
      required: true,
    },

    customPricing: {
      amount: Number,
      currency: {
        type: String,
        default: "NGN",
      },
      billingCycle: {
        type: String,
        enum: ["monthly", "annual"],
      },
      discountPercent: Number,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "cancelled"],
      default: "pending",
    },

    messageToFirm: {
      type: String,
      maxlength: 1000,
    },

    internalNotes: {
      type: String,
      maxlength: 1000,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    acceptedAt: {
      type: Date,
    },

    sentBy: {
      type: String,
      default: "Platform Admin",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
platformInviteSchema.index({ token: 1 });
platformInviteSchema.index({ firmId: 1 });
platformInviteSchema.index({ status: 1 });
platformInviteSchema.index({ expiresAt: 1 });

// Static methods
platformInviteSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

platformInviteSchema.statics.validateToken = async function (token) {
  // First, try to find the invite with all conditions
  let invite = await this.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
    isDeleted: { $ne: true },
  }).populate("firmId", "name contact.email");

  // If not found, check if it exists but is expired or already used
  if (!invite) {
    const anyInvite = await this.findOne({ token }).populate("firmId", "name contact.email");
    if (anyInvite) {
      console.log("Token found but:", {
        status: anyInvite.status,
        expiresAt: anyInvite.expiresAt,
        isExpired: anyInvite.expiresAt < new Date(),
        isDeleted: anyInvite.isDeleted
      });
    }
  }

  return invite;
};

const PlatformInvite = mongoose.model("PlatformInvite", platformInviteSchema);

module.exports = PlatformInvite;
