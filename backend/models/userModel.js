// models/userModel.js - COMPLETE WITH MULTI-PRIVILEGE SUPPORT
const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { encryptField, decryptField } = require("../utils/encryption");

const encryptedField = {
  type: {
    iv: String,
    data: String,
    authTag: String,
  },
  select: false,
};

const userSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      index: true,
    },

    // ========================
    // BASIC USER INFORMATION
    // ========================
    firstName: {
      type: String,
      trim: true,
      required: [true, "First name is required"],
    },

    lastName: {
      type: String,
      trim: true,
      required: function () {
        return this.userType !== "client";
      },
    },

    middleName: String,

    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Email is required"],
      validate: [validator.isEmail, "Please provide a valid email address"],
    },

    phone: {
      type: String,
      trim: true,
      required: [true, "Phone number is required"],
      default: "+234",
    },

    photo: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg",
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
      required: function () {
        return this.userType !== "client";
      },
    },

    address: {
      type: String,
      trim: true,
      required: [true, "Please provide your residential address"],
    },

    encryptedAddress: encryptedField,

    phone: {
      type: String,
      trim: true,
      required: [true, "Phone number is required"],
      default: "+234",
    },

    encryptedPhone: encryptedField,

    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },

    encryptedDateOfBirth: encryptedField,

    // ========================
    // USER TYPE & ROLE SYSTEM
    // ========================
    userType: {
      type: String,
      enum: {
        values: ["client", "staff", "lawyer", "admin", "super-admin"],
        message: "{VALUE} is not a valid user type",
      },
      default: "staff",
      required: true,
    },

    role: {
      type: String,
      enum: {
        values: [
          "client",
          "staff",
          "lawyer",
          "secretary",
          "hr",
          "admin",
          "super-admin",
        ],
        message: "{VALUE} is not a valid role",
      },
      default: function () {
        if (this.userType === "client") return "client";
        if (this.userType === "lawyer") return "lawyer";
        if (this.userType === "admin") return "admin";
        if (this.userType === "super-admin") return "super-admin";
        return "staff";
      },
    },

    // ✅ NEW: Multiple roles/privileges support
    additionalRoles: {
      type: [String],
      enum: ["lawyer", "admin", "hr", "secretary"],
      default: [],
    },

    // ✅ NEW: Position field (moved from nested objects)
    position: {
      type: String,
      enum: [
        "Managing Partner",
        "Senior Partner",
        "Partner",
        "Principal",
        "Head of Chambers",
        "Senior Associate",
        "Associate",
        "Junior Associate",
        "Counsel",
        "Administrator",
        "Secretary",
        "HR Manager",
        "Other",
      ],
    },

    // ✅ NEW: Lawyer flag (for easy querying)
    isLawyer: {
      type: Boolean,
      default: false,
    },

    // ========================
    // CLIENT SPECIFIC FIELDS
    // ========================
    clientDetails: {
      company: String,
      industry: String,
      clientSince: {
        type: Date,
        default: Date.now,
      },
      clientCategory: {
        type: String,
        enum: ["individual", "corporate", "government", "ngo"],
        default: "individual",
      },
      preferredContactMethod: {
        type: String,
        enum: ["email", "phone", "whatsapp", "in-person"],
        default: "email",
      },
      billingAddress: String,
      taxId: String,
      encryptedBillingAddress: encryptedField,
      encryptedTaxId: encryptedField,
      referralSource: String,
      clientNotes: String,
      importantDates: [
        {
          date: Date,
          description: String,
          type: {
            type: String,
            enum: ["anniversary", "reminder", "follow-up", "other"],
          },
        },
      ],
    },

    // ========================
    // STAFF SPECIFIC FIELDS
    // ========================
    staffDetails: {
      employeeId: String,
      department: {
        type: String,
        enum: ["hr", "finance", "it", "administration", "support", "other"],
      },
      designation: String,
      reportingTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      dateOfJoining: {
        type: Date,
        default: Date.now,
      },
      employmentType: {
        type: String,
        enum: ["full-time", "part-time", "contract", "intern"],
        default: "full-time",
      },
      workSchedule: {
        type: String,
        enum: ["9-5", "flexible", "shift", "remote", "hybrid"],
        default: "9-5",
      },
      skills: [String],
      certifications: [
        {
          name: String,
          issuer: String,
          issueDate: Date,
          expiryDate: Date,
        },
      ],
    },

    // ========================
    // LAWYER SPECIFIC FIELDS
    // ========================
    lawyerDetails: {
      barNumber: {
        type: String,
        unique: true,
        sparse: true,
      },
      barAssociation: String,
      yearOfCall: Date,
      practiceAreas: [
        {
          type: String,
          enum: [
            "corporate",
            "criminal",
            "family",
            "real-estate",
            "intellectual-property",
            "tax",
            "labor",
            "immigration",
            "bankruptcy",
            "personal-injury",
            "estate-planning",
            "other",
          ],
        },
      ],
      specialization: String,
      hourlyRate: {
        type: Number,
        min: 0,
      },
      retainerFee: {
        type: Number,
        min: 0,
      },
      courtExperience: {
        type: Number,
        min: 0,
      },
      lawSchool: {
        name: String,
        graduationYear: Number,
        degree: String,
      },
      undergraduateSchool: {
        name: String,
        graduationYear: Number,
        degree: String,
      },
      languages: [
        {
          language: String,
          proficiency: {
            type: String,
            enum: ["basic", "intermediate", "fluent", "native"],
          },
        },
      ],
      isPartner: {
        type: Boolean,
        default: false,
      },
      partnershipPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      availableForNewCases: {
        type: Boolean,
        default: true,
      },
      maxCaseload: {
        type: Number,
        default: 50,
        min: 1,
      },
    },

    // ========================
    // ADMIN SPECIFIC FIELDS
    // ========================
    adminDetails: {
      adminLevel: {
        type: String,
        enum: ["system", "firm", "department"],
        default: "firm",
      },
      permissions: [
        {
          module: String,
          actions: [String],
        },
      ],
      canManageUsers: {
        type: Boolean,
        default: false,
      },
      canManageCases: {
        type: Boolean,
        default: false,
      },
      canManageBilling: {
        type: Boolean,
        default: false,
      },
      canViewReports: {
        type: Boolean,
        default: false,
      },
      systemAccessLevel: {
        type: String,
        enum: ["full", "restricted", "view-only"],
        default: "restricted",
      },
    },

    // ========================
    // COMMON PROFESSIONAL FIELDS
    // ========================
    professionalInfo: {
      bio: {
        type: String,
        trim: true,
        maxlength: 2000,
      },
      education: [
        {
          institution: String,
          degree: String,
          field: String,
          graduationYear: Number,
          honors: String,
        },
      ],
      workExperience: [
        {
          position: String,
          company: String,
          startDate: Date,
          endDate: Date,
          current: Boolean,
          description: String,
        },
      ],
      publications: [
        {
          title: String,
          publisher: String,
          date: Date,
          link: String,
        },
      ],
      awards: [
        {
          name: String,
          issuer: String,
          year: Number,
          description: String,
        },
      ],
      socialLinks: {
        linkedIn: String,
        twitter: String,
        website: String,
      },
    },

    // ========================
    // SECURITY & AUTHENTICATION
    // ========================
    password: {
      type: String,
      trim: true,
      select: false,
      required: [true, "Password is required"],
      minLength: [8, "Password must have at least 8 characters"],
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value
          );
        },
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      },
    },

    passwordConfirm: {
      type: String,
      trim: true,
      required: [
        function () {
          return this.isNew || this.isModified("password");
        },
        "Please confirm your password",
      ],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords do not match",
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,
    verificationTokenExpires: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    passwordChangedAt: Date,

    // ========================
    // STATUS & PREFERENCES
    // ========================
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
      language: {
        type: String,
        default: "en",
      },
      timezone: {
        type: String,
        default: "Africa/Lagos",
      },
      dateFormat: {
        type: String,
        default: "DD/MM/YYYY",
      },
    },

    // ========================
    // SYSTEM FIELDS
    // ========================
    userAgent: {
      type: Array,
      required: true,
      default: [],
    },

    lastLogin: Date,
    lastActivity: Date,
    loginCount: {
      type: Number,
      default: 0,
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
    minimize: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * ===============================
 * ENCRYPTION MIDDLEWARE
 * ===============================
 */
userSchema.pre("save", async function (next) {
  if (this.isModified("address") && this.address) {
    this.encryptedAddress = encryptField(this.address);
  }
  
  if (this.isModified("phone") && this.phone) {
    this.encryptedPhone = encryptField(this.phone);
  }
  
  if (this.isModified("dateOfBirth") && this.dateOfBirth) {
    this.encryptedDateOfBirth = encryptField(this.dateOfBirth.toISOString());
  }
  
  if (this.isModified("clientDetails")) {
    if (this.clientDetails?.billingAddress) {
      this.clientDetails.encryptedBillingAddress = encryptField(this.clientDetails.billingAddress);
    }
    if (this.clientDetails?.taxId) {
      this.clientDetails.encryptedTaxId = encryptField(this.clientDetails.taxId);
    }
  }
  
  next();
});

/**
 * ===============================
 * INDEXES
 * ===============================
 */
userSchema.index({ firmId: 1, email: 1 }, { unique: true });
userSchema.index({ firmId: 1, userType: 1 });
userSchema.index({ firmId: 1, role: 1 });
userSchema.index({ firmId: 1, status: 1 });
userSchema.index({ firmId: 1, isActive: 1 });
userSchema.index({ firmId: 1, isDeleted: 1 });
userSchema.index({ firmId: 1, isLawyer: 1 }); // ✅ NEW
userSchema.index({ firmId: 1, additionalRoles: 1 }); // ✅ NEW

userSchema.index({ "lawyerDetails.practiceAreas": 1 });
userSchema.index({ "lawyerDetails.isPartner": 1 });
userSchema.index({ "clientDetails.clientCategory": 1 });
userSchema.index({ "staffDetails.employeeId": 1 }, { sparse: true });
userSchema.index({ "staffDetails.department": 1 });

/**
 * ===============================
 * VIRTUAL FIELDS
 * ===============================
 */
userSchema.virtual("fullName").get(function () {
  if (this.middleName) {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("initials").get(function () {
  return `${this.firstName?.charAt(0) || ""}${this.lastName?.charAt(0) || ""}`.toUpperCase();
});

userSchema.virtual("displayName").get(function () {
  if (this.userType === "client") {
    return this.fullName || this.firstName;
  }
  if (this.lawyerDetails?.title) {
    return `${this.lawyerDetails.title} ${this.fullName}`;
  }
  return this.fullName;
});

// ✅ NEW: Virtual for all effective roles
userSchema.virtual("allRoles").get(function () {
  const roles = [this.role];
  if (this.additionalRoles && this.additionalRoles.length > 0) {
    roles.push(...this.additionalRoles);
  }
  return [...new Set(roles)];
});

/**
 * ===============================
 * INSTANCE METHODS
 * ===============================
 */
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  return verificationToken;
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.getUserTypeLabel = function () {
  const labels = {
    client: "Client",
    staff: "Staff",
    lawyer: "Lawyer",
    admin: "Administrator",
    "super-admin": "Super Administrator",
  };
  return labels[this.userType] || this.userType;
};

// ✅ NEW: Check if user has specific privilege
userSchema.methods.hasPrivilege = function (privilege) {
  // Super admin has all privileges
  if (this.role === "super-admin" || this.userType === "super-admin") return true;

  // Check primary role
  if (this.role === privilege) return true;

  // Check additional roles
  if (this.additionalRoles && this.additionalRoles.includes(privilege)) {
    return true;
  }

  // Check if lawyer privilege
  if (privilege === "lawyer" && this.isLawyer === true) {
    return true;
  }

  return false;
};

// ✅ NEW: Get all effective roles
userSchema.methods.getEffectiveRoles = function () {
  const roles = [this.role];
  if (this.additionalRoles && this.additionalRoles.length > 0) {
    roles.push(...this.additionalRoles);
  }
  return [...new Set(roles)];
};

// ✅ NEW: Check if user can perform action
userSchema.methods.can = function (permission) {
  if (this.userType === "super-admin") return true;

  if (this.hasPrivilege("admin") && this.adminDetails) {
    return this.adminDetails.permissions.some((p) => p.actions.includes(permission));
  }

  return false;
};

/**
 * ===============================
 * PRE-SAVE MIDDLEWARE
 * ===============================
 */
userSchema.pre("save", async function (next) {
  // Auto-set isLawyer flag
  if (this.userType === "lawyer" || this.role === "lawyer") {
    this.isLawyer = true;
  } else if (this.additionalRoles && this.additionalRoles.includes("lawyer")) {
    this.isLawyer = true;
  }

  // Auto-set role based on userType if new
  if (this.isNew) {
    if (this.userType === "lawyer") {
      this.role = "lawyer";
    } else if (this.userType === "client") {
      this.role = "client";
    } else if (this.userType === "admin") {
      this.role = this.role || "admin";
    } else if (this.userType === "staff") {
      this.role = this.role || "staff";
    }
  }

  // Hash password if modified
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

// Auto-generate employee ID for staff
userSchema.pre("save", async function (next) {
  if (this.userType === "staff" && !this.staffDetails?.employeeId) {
    const count = await this.constructor.countDocuments({
      firmId: this.firmId,
      userType: "staff",
    });
    this.staffDetails = this.staffDetails || {};
    this.staffDetails.employeeId = `EMP-${(count + 1).toString().padStart(4, "0")}`;
  }
  next();
});

/**
 * ===============================
 * STATIC METHODS
 * ===============================
 */

// ✅ UPDATED: Get all lawyers (including those with lawyer privileges)
userSchema.statics.getLawyers = function (firmId, options = {}) {
  const query = {
    firmId,
    isLawyer: true, // Use isLawyer flag instead of just userType
    isActive: true,
    isDeleted: { $ne: true },
  };

  if (options.practiceArea) {
    query["lawyerDetails.practiceAreas"] = options.practiceArea;
  }

  return this.find(query);
};

// Get all clients
userSchema.statics.getClients = function (firmId, options = {}) {
  const query = {
    firmId,
    userType: "client",
    isActive: true,
    isDeleted: { $ne: true },
  };

  if (options.category) {
    query["clientDetails.clientCategory"] = options.category;
  }

  return this.find(query);
};

// ✅ NEW: Get users by privilege (including additional roles)
userSchema.statics.getUsersByPrivilege = function (firmId, privilege) {
  return this.find({
    firmId,
    $or: [
      { role: privilege },
      { additionalRoles: privilege },
      ...(privilege === "lawyer" ? [{ isLawyer: true }] : []),
    ],
    isActive: true,
    isDeleted: { $ne: true },
  });
};

// Count users by type
userSchema.statics.countByType = async function (firmId) {
  return this.aggregate([
    { $match: { firmId, isActive: true, isDeleted: { $ne: true } } },
    { $group: { _id: "$userType", count: { $sum: 1 } } },
  ]);
};

const User = mongoose.model("User", userSchema);

module.exports = User;