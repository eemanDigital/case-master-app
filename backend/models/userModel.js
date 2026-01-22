const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ✅ CRITICAL: Add firmId for multi-tenancy
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
        "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?t=st=1722072885~exp=1722076485~hmac=fad6e85b55559cb0eff906e5e75cc3ce337bce7edda8da18f4ccdcb02a7442ad&w=740",
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

    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },

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

    // Main role for permissions (tied to userType)
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
        // Automatically set role based on userType
        if (this.userType === "client") return "client";
        if (this.userType === "lawyer") return "lawyer";
        if (this.userType === "admin") return "admin";
        if (this.userType === "super-admin") return "super-admin";
        return "staff";
      },
    },

    // ========================
    // CLIENT SPECIFIC FIELDS
    // ========================
    clientDetails: {
      type: {
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
      required: function () {
        return this.userType === "client";
      },
    },

    // ========================
    // STAFF SPECIFIC FIELDS
    // ========================
    staffDetails: {
      type: {
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
      required: function () {
        return this.userType === "staff";
      },
    },

    // ========================
    // LAWYER SPECIFIC FIELDS
    // ========================
    lawyerDetails: {
      type: {
        barNumber: {
          type: String,
          unique: true,
          sparse: true, // Allows null/undefined values
        },
        barAssociation: String,
        yearOfCall: {
          type: Date,
          required: true,
          validate: {
            validator: function (value) {
              return value <= new Date();
            },
            message: "Year of call cannot be in the future",
          },
        },
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
          type: Number, // Years of experience
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
        // For lawyers who are also partners
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
      required: function () {
        return this.userType === "lawyer";
      },
    },

    // ========================
    // ADMIN SPECIFIC FIELDS
    // ========================
    adminDetails: {
      type: {
        adminLevel: {
          type: String,
          enum: ["system", "firm", "department"],
          default: "firm",
        },
        permissions: [
          {
            module: String,
            actions: [String], // ['create', 'read', 'update', 'delete']
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
      required: function () {
        return this.userType === "admin";
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
            value,
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
  },
);

/**
 * ===============================
 * INDEXES (CRITICAL FOR MULTI-TENANCY)
 * ===============================
 */

// ✅ Compound unique index - email must be unique per firm only
userSchema.index({ firmId: 1, email: 1 }, { unique: true });

// ✅ Indexes by userType for quick filtering
userSchema.index({ firmId: 1, userType: 1 });
userSchema.index({ firmId: 1, role: 1 });
userSchema.index({ firmId: 1, status: 1 });
userSchema.index({ firmId: 1, isActive: 1 });
userSchema.index({ firmId: 1, isDeleted: 1 });

// ✅ Lawyer-specific indexes
userSchema.index({ "lawyerDetails.barNumber": 1 }, { sparse: true });
userSchema.index({ "lawyerDetails.practiceAreas": 1 });
userSchema.index({ "lawyerDetails.isPartner": 1 });

// ✅ Client-specific indexes
userSchema.index({ "clientDetails.clientCategory": 1 });

// ✅ Staff-specific indexes
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

// Virtual populate for related data
userSchema.virtual("cases", {
  ref: "Case",
  foreignField: "client",
  localField: "_id",
});

userSchema.virtual("assignedTasks", {
  ref: "Task",
  foreignField: "assignee",
  localField: "_id",
});

userSchema.virtual("reports", {
  ref: "Report",
  foreignField: "reportedBy",
  localField: "_id",
});

/**
 * ===============================
 * INSTANCE METHODS
 * ===============================
 */

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

userSchema.methods.createVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Get user type label
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

// Check if user can perform action
userSchema.methods.can = function (permission) {
  if (this.userType === "super-admin") return true;

  if (this.userType === "admin" && this.adminDetails) {
    // Check admin permissions
    return this.adminDetails.permissions.some((p) =>
      p.actions.includes(permission),
    );
  }

  // Add more permission checks as needed
  return false;
};

/**
 * ===============================
 * PRE-SAVE MIDDLEWARE
 * ===============================
 */

userSchema.pre("save", async function (next) {
  // Auto-set some fields based on userType
  if (this.isNew) {
    if (this.userType === "lawyer") {
      this.role = "lawyer";
    } else if (this.userType === "client") {
      this.role = "client";
      this.staffDetails = undefined;
      this.lawyerDetails = undefined;
      this.adminDetails = undefined;
    } else if (this.userType === "staff") {
      this.role = this.role || "staff";
      this.lawyerDetails = undefined;
      this.clientDetails = undefined;
    }
  }

  // Hash password if modified
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  // Set passwordChangedAt
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
 * PRE-QUERY MIDDLEWARE
 * ===============================
 */

// Filter out inactive and deleted users automatically
userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false }, isDeleted: { $ne: true } });
  next();
});

// Populate firm info by default
userSchema.pre(/^find/, function (next) {
  this.populate({
    path: "firmId",
    select: "name subdomain logo",
  });
  next();
});

/**
 * ===============================
 * STATIC METHODS
 * ===============================
 */

// Find by user type
userSchema.statics.findByType = function (firmId, userType) {
  return this.find({
    firmId,
    userType,
    isActive: true,
    isDeleted: { $ne: true },
  });
};

// Get all lawyers for a firm
userSchema.statics.getLawyers = function (firmId, options = {}) {
  const query = {
    firmId,
    userType: "lawyer",
    isActive: true,
    isDeleted: { $ne: true },
  };

  if (options.practiceArea) {
    query["lawyerDetails.practiceAreas"] = options.practiceArea;
  }

  return this.find(query);
};

// Get all clients for a firm
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

// Count users by type
userSchema.statics.countByType = async function (firmId) {
  return this.aggregate([
    { $match: { firmId, isActive: true, isDeleted: { $ne: true } } },
    { $group: { _id: "$userType", count: { $sum: 1 } } },
  ]);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
