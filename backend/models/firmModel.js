// models/Firm.js
const mongoose = require("mongoose");

const firmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional: use later if you want firm.casemaster.ng
    subdomain: {
      type: String,
      unique: true,
      sparse: true, // allows null - perfect!
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },

    // ✅ ADDED: Contact info for Nigerian market
    contact: {
      phone: {
        type: String,
        trim: true,
        // Nigerian phone format validation (optional)
        match: /^(\+234|0)[789][01]\d{8}$/,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      // RC Number (CAC registration) - important for Nigerian businesses
      rcNumber: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: {
          type: String,
          // Nigerian states if you want validation
          enum: [
            "Abia",
            "Adamawa",
            "Akwa Ibom",
            "Anambra",
            "Bauchi",
            "Bayelsa",
            "Benue",
            "Borno",
            "Cross River",
            "Delta",
            "Ebonyi",
            "Edo",
            "Ekiti",
            "Enugu",
            "FCT",
            "Gombe",
            "Imo",
            "Jigawa",
            "Kaduna",
            "Kano",
            "Katsina",
            "Kebbi",
            "Kogi",
            "Kwara",
            "Lagos",
            "Nasarawa",
            "Niger",
            "Ogun",
            "Ondo",
            "Osun",
            "Oyo",
            "Plateau",
            "Rivers",
            "Sokoto",
            "Taraba",
            "Yobe",
            "Zamfara",
          ],
        },
      },
    },

    settings: {
      timezone: {
        type: String,
        default: "Africa/Lagos", // ✅ Perfect for Nigeria
      },
      dateFormat: {
        type: String,
        default: "DD/MM/YYYY", // ✅ Nigerian standard
      },
      currency: {
        type: String,
        default: "NGN", // ✅ Naira
      },
      // ✅ ADDED: Language preference (English/Pidgin/Yoruba/Hausa/Igbo)
      language: {
        type: String,
        enum: ["en", "yo", "ha", "ig", "pcm"], // pcm = Pidgin
        default: "en",
      },
    },

    subscription: {
      plan: {
        type: String,
        enum: ["FREE", "BASIC", "PRO", "ENTERPRISE"],
        default: "FREE",
      },

      status: {
        type: String,
        enum: ["ACTIVE", "EXPIRED", "TRIAL", "SUSPENDED"], // ✅ Added SUSPENDED
        default: "TRIAL",
      },

      trialEndsAt: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },

      expiresAt: {
        type: Date,
      },

      payment: {
        provider: {
          type: String,
          enum: ["PAYSTACK", "FLUTTERWAVE", "MANUAL"], // ✅ Added MANUAL for bank transfer
        },
        reference: String, // Paystack/Flutterwave reference
        lastPaidAt: Date,
        // ✅ ADDED: Amount in Kobo (Paystack uses kobo, not naira)
        lastAmountKobo: Number,
      },
    },

    limits: {
      users: {
        type: Number,
        default: 1, // FREE plan default
      },
      storageGB: {
        type: Number,
        default: 5, // ✅ Perfect for budget hosting
      },
      // ✅ ADDED: Monthly case limit (for FREE tier)
      casesPerMonth: {
        type: Number,
        default: 10, // FREE tier: 10 cases/month
      },
    },

    // ✅ ADDED: Usage tracking (for limit enforcement)
    usage: {
      currentUserCount: {
        type: Number,
        default: 0,
      },
      storageUsedGB: {
        type: Number,
        default: 0,
      },
      casesThisMonth: {
        type: Number,
        default: 0,
      },
      lastResetAt: {
        type: Date,
        default: Date.now,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ✅ ADDED: Soft delete support (for compliance)
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    // ✅ Enable virtuals in JSON/Object responses
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * ======================
 * Indexes (optimized for queries)
 * ======================
 */
firmSchema.index({ subdomain: 1 });
firmSchema.index({ "subscription.status": 1 });
firmSchema.index({ "subscription.expiresAt": 1 }); // ✅ For expiry checks
firmSchema.index({ isActive: 1 });
firmSchema.index({ deletedAt: 1 }); // ✅ For soft delete queries

/**
 * ======================
 * Virtual Fields
 * ======================
 */

// ✅ Check if subscription is truly active
firmSchema.virtual("isSubscriptionValid").get(function () {
  return this.isSubscriptionActive();
});

// ✅ Days remaining in trial/subscription
firmSchema.virtual("daysRemaining").get(function () {
  const expiryDate =
    this.subscription.status === "TRIAL"
      ? this.subscription.trialEndsAt
      : this.subscription.expiresAt;

  if (!expiryDate) return null;

  const now = new Date();
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
});

/**
 * ======================
 * Instance Methods
 * ======================
 */

/**
 * Check if subscription is currently active
 */
firmSchema.methods.isSubscriptionActive = function () {
  // Check if firm is active
  if (!this.isActive) return false;

  // Check subscription status
  if (this.subscription.status === "TRIAL") {
    return this.subscription.trialEndsAt > new Date();
  }

  if (this.subscription.status === "ACTIVE") {
    // If no expiry date set, assume active (for lifetime plans)
    if (!this.subscription.expiresAt) return true;
    return this.subscription.expiresAt > new Date();
  }

  return false;
};

/**
 * Check if firm can add more users
 */
firmSchema.methods.canAddUser = function (currentUserCount) {
  return (currentUserCount || this.usage.currentUserCount) < this.limits.users;
};

/**
 * Check if firm can create more cases this month
 */
firmSchema.methods.canCreateCase = function () {
  // PRO and ENTERPRISE have unlimited cases
  if (["PRO", "ENTERPRISE"].includes(this.subscription.plan)) {
    return true;
  }

  // Reset counter if month has changed
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetAt);

  if (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    this.usage.casesThisMonth = 0;
    this.usage.lastResetAt = now;
  }

  return this.usage.casesThisMonth < this.limits.casesPerMonth;
};

/**
 * Check if firm has storage available
 */
firmSchema.methods.hasStorageAvailable = function (fileSizeGB) {
  const availableStorage = this.limits.storageGB - this.usage.storageUsedGB;
  return availableStorage >= fileSizeGB;
};

/**
 * Increment case counter (call after creating case)
 */
firmSchema.methods.incrementCaseCount = async function () {
  this.usage.casesThisMonth += 1;
  await this.save();
};

/**
 * Update storage usage (call after file upload/delete)
 */
firmSchema.methods.updateStorageUsage = async function (deltaGB) {
  this.usage.storageUsedGB = Math.max(0, this.usage.storageUsedGB + deltaGB);
  await this.save();
};

/**
 * Get subscription plan details (for display)
 */
firmSchema.methods.getPlanDetails = function () {
  const plans = {
    FREE: {
      name: "Free",
      price: 0,
      features: [
        "1 user",
        "10 cases per month",
        "5GB storage",
        "Basic features",
      ],
    },
    BASIC: {
      name: "Basic",
      price: 5000, // ₦5,000/month
      features: [
        "Up to 3 users",
        "50 cases per month",
        "20GB storage",
        "Email support",
      ],
    },
    PRO: {
      name: "Professional",
      price: 15000, // ₦15,000/month
      features: [
        "Up to 10 users",
        "Unlimited cases",
        "100GB storage",
        "Priority support",
        "Advanced reporting",
      ],
    },
    ENTERPRISE: {
      name: "Enterprise",
      price: null, // Custom pricing
      features: [
        "Unlimited users",
        "Unlimited cases",
        "Unlimited storage",
        "Dedicated support",
        "Custom features",
      ],
    },
  };

  return plans[this.subscription.plan] || plans.FREE;
};

/**
 * ✅ Soft delete (for GDPR/compliance)
 */
firmSchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  await this.save();
};

/**
 * ✅ Restore soft-deleted firm
 */
firmSchema.methods.restore = async function () {
  this.isActive = true;
  this.deletedAt = null;
  await this.save();
};

/**
 * ======================
 * Static Methods (for queries)
 * ======================
 */

/**
 * Find active firms only (exclude soft-deleted)
 */
firmSchema.statics.findActive = function (query = {}) {
  return this.find({
    ...query,
    isActive: true,
    deletedAt: null,
  });
};

/**
 * Find firms with expiring subscriptions (for reminder emails)
 */
firmSchema.statics.findExpiringSoon = async function (daysThreshold = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysThreshold);

  return this.find({
    isActive: true,
    "subscription.status": { $in: ["TRIAL", "ACTIVE"] },
    $or: [
      {
        "subscription.status": "TRIAL",
        "subscription.trialEndsAt": {
          $gte: new Date(),
          $lte: futureDate,
        },
      },
      {
        "subscription.status": "ACTIVE",
        "subscription.expiresAt": {
          $gte: new Date(),
          $lte: futureDate,
        },
      },
    ],
  });
};

/**
 * Find firms with expired subscriptions (for suspension)
 */
firmSchema.statics.findExpired = async function () {
  const now = new Date();

  return this.find({
    isActive: true,
    $or: [
      {
        "subscription.status": "TRIAL",
        "subscription.trialEndsAt": { $lt: now },
      },
      {
        "subscription.status": "ACTIVE",
        "subscription.expiresAt": { $lt: now },
      },
    ],
  });
};

/**
 * ======================
 * Pre-save Hook
 * ======================
 */

// ✅ Auto-update subscription status based on expiry
firmSchema.pre("save", function (next) {
  const now = new Date();

  // If trial expired, update status
  if (
    this.subscription.status === "TRIAL" &&
    this.subscription.trialEndsAt < now
  ) {
    this.subscription.status = "EXPIRED";
  }

  // If active subscription expired, update status
  if (
    this.subscription.status === "ACTIVE" &&
    this.subscription.expiresAt &&
    this.subscription.expiresAt < now
  ) {
    this.subscription.status = "EXPIRED";
  }

  next();
});

module.exports = mongoose.model("Firm", firmSchema);
