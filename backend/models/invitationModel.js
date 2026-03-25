// models/invitationModel.js
const mongoose = require("mongoose");
const crypto = require("crypto");

const invitationSchema = new mongoose.Schema({
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

  firstName: {
    type: String,
    trim: true,
  },

  lastName: {
    type: String,
    trim: true,
  },

  role: {
    type: String,
    enum: ["staff", "lawyer", "secretary", "admin", "client"],
    default: "staff",
  },

  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  token: {
    type: String,
    required: true,
    unique: true,
  },

  plan: {
    type: String,
    enum: ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"],
    default: "FREE",
  },

  maxUsers: {
    type: Number,
    default: 5,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "expired", "cancelled"],
    default: "pending",
  },

  acceptedAt: {
    type: Date,
  },

  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  message: {
    type: String,
    maxlength: 500,
  },

  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

invitationSchema.index({ email: 1, status: 1 });

invitationSchema.index({ expiresAt: 1 });

invitationSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

invitationSchema.statics.validateToken = async function (token) {
  const invitation = await this.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
    isDeleted: { $ne: true },
  });
  return invitation;
};

invitationSchema.statics.applyPlanLimits = function (plan) {
  const planLimits = {
    FREE: { maxUsers: 5 },
    STARTER: { maxUsers: 10 },
    PROFESSIONAL: { maxUsers: 25 },
    ENTERPRISE: { maxUsers: 999999 },
  };
  return planLimits[plan] || planLimits.FREE;
};

invitationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

invitationSchema.virtual("isValid").get(function () {
  return this.status === "pending" && !this.isExpired();
});

const Invitation = mongoose.model("Invitation", invitationSchema);

module.exports = Invitation;
