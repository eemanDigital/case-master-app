const dotenv = require("dotenv");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Cryptr = require("cryptr");
const AppError = require("../utils/appError");
const parser = require("ua-parser-js");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Firm = require("../models/firmModel");

const { createSendToken, hashToken } = require("../utils/handleSendToken");
const Token = require("../models/tokenModel");
const { sendMail } = require("../utils/email");
const { OAuth2Client } = require("google-auth-library");

dotenv.config({ path: "./config.env" });

const cryptr = new Cryptr(process.env.CRYPTR_SECRET_KEY);

// create new instance of google oauth2
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * ===============================
 * FIRM REGISTRATION
 * ===============================
 */
exports.registerFirm = catchAsync(async (req, res, next) => {
  const {
    firmName,
    subdomain,
    phone,
    address,
    state,
    city,
    rcNumber,
    firstName,
    lastName,
    email,
    password,
    passwordConfirm,
    plan = "FREE",
  } = req.body;

  // 1) Validate required fields
  if (!firmName || !firstName || !lastName || !email || !password) {
    return next(new AppError("Please provide all required fields", 400));
  }

  // 2) Validate password
  if (password.length < 8) {
    return next(new AppError("Password must be at least 8 characters", 400));
  }

  if (password !== passwordConfirm) {
    return next(
      new AppError("Password and passwordConfirm must be the same", 400),
    );
  }

  // 3) Validate subdomain format (if provided)
  if (subdomain && !/^[a-z0-9-]+$/.test(subdomain)) {
    return next(
      new AppError(
        "Subdomain can only contain lowercase letters, numbers, and hyphens",
        400,
      ),
    );
  }

  // 4) Check if subdomain already exists (if provided)
  if (subdomain) {
    const existingFirm = await Firm.findOne({ subdomain });
    if (existingFirm) {
      return next(new AppError("This subdomain is already taken", 400));
    }
  }

  // 5) Plan configuration
  const planConfig = {
    FREE: {
      users: 1,
      storageGB: 5,
      casesPerMonth: 10,
      trialDays: 14,
    },
    BASIC: {
      users: 3,
      storageGB: 20,
      casesPerMonth: 50,
      trialDays: 14,
    },
    PRO: {
      users: 10,
      storageGB: 100,
      casesPerMonth: 999999, // Unlimited
      trialDays: 14,
    },
    ENTERPRISE: {
      users: 999999, // Unlimited
      storageGB: 999999, // Unlimited
      casesPerMonth: 999999, // Unlimited
      trialDays: 30,
    },
  };

  const selectedPlan = plan.toUpperCase();
  if (!planConfig[selectedPlan]) {
    return next(new AppError("Invalid plan selected", 400));
  }

  const limits = planConfig[selectedPlan];

  try {
    // 6) Create Firm with CORRECT limits
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + limits.trialDays);

    const firmData = {
      name: firmName,
      subdomain: subdomain || null,
      contact: {
        phone,
        email,
        rcNumber,
        address: {
          street: address,
          city,
          state,
        },
      },
      subscription: {
        plan: selectedPlan,
        status: "TRIAL",
        trialEndsAt: trialEndDate,
      },
      limits: {
        users: limits.users,
        storageGB: limits.storageGB,
        casesPerMonth: limits.casesPerMonth,
      },
      usage: {
        currentUserCount: 1, // Admin user will be created
        storageUsedGB: 0,
        casesThisMonth: 0,
        lastResetAt: new Date(),
      },
    };

    const newFirm = await Firm.create(firmData);
    const firmId = newFirm._id;

    // 7) Get user agent
    const ua = parser(req.headers["user-agent"]);
    const userAgent = [ua.ua];

    // 8) Create Admin User with new schema
    const userData = {
      firmId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      passwordConfirm,
      userType: "super-admin",
      role: "super-admin",
      position: "Managing Partner",
      address: address || "Not provided",
      phone: phone || "+234",
      gender: req.body.gender || "male",
      isVerified: false,
      isActive: true,
      userAgent,
      // Admin details
      adminDetails: {
        adminLevel: "firm",
        canManageUsers: true,
        canManageCases: true,
        canManageBilling: true,
        canViewReports: true,
        systemAccessLevel: "full",
      },
    };

    const newUser = await User.create(userData);

    // 9) Send verification email
    try {
      const vToken = crypto.randomBytes(32).toString("hex") + newUser._id;
      const hashedToken = hashToken(vToken);

      await new Token({
        userId: newUser._id,
        verificationToken: hashedToken,
        createAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }).save();

      const verificationURL = `${process.env.FRONTEND_URL}/verify-account/${vToken}`;

      const subject = "Verify Your Account - CaseMaster";
      const send_to = email;
      const send_from = process.env.SENDINBLUE_EMAIL;
      const reply_to = "noreply@casemaster.ng";
      const template = "verifyEmail";
      const context = {
        name: firstName,
        firmName,
        link: verificationURL,
        companyName: "CaseMaster",
        plan: selectedPlan,
        trialDays: limits.trialDays,
      };

      await sendMail(subject, send_to, send_from, reply_to, template, context);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    // 10) Send success response
    res.status(201).json({
      status: "success",
      message:
        "Firm registered successfully. Please check your email to verify your account.",
      data: {
        firm: {
          id: newFirm._id,
          name: newFirm.name,
          subdomain: newFirm.subdomain,
          subscription: {
            plan: newFirm.subscription.plan,
            status: newFirm.subscription.status,
            trialEndsAt: newFirm.subscription.trialEndsAt,
          },
          limits: newFirm.limits,
        },
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          userType: newUser.userType,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        return next(new AppError("Email already exists", 400));
      }
      if (error.keyPattern.subdomain) {
        return next(new AppError("Subdomain already exists", 400));
      }
      return next(new AppError("Duplicate field value entered", 400));
    }
    throw error;
  }
});

/**
 * ===============================
 * USER REGISTRATION (for admin creating users)
 * ===============================
 */
// controllers/authController.js - REGISTER FUNCTION ONLY (Update in your existing file)

/**
 * ===============================
 * USER REGISTRATION (for admin creating users)
 * ===============================
 */
// controllers/authController.js - COMPLETE FIX for professionalInfo

// controllers/authController.js - FIXED to accept nested objects

exports.register = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, userType } = req.body;

  console.log("📥 Register Request Body:", JSON.stringify(req.body, null, 2));

  if (!email || !password || !passwordConfirm || !userType) {
    return next(new AppError("Please provide all required fields", 400));
  }

  if (password.length < 8) {
    return next(new AppError("Password must be at least 8 characters", 400));
  }

  if (password !== passwordConfirm) {
    return next(
      new AppError("Password and passwordConfirm must be the same", 400),
    );
  }

  // Check if user exists within the same firm
  let existingUser = await User.findOne({
    email: email.toLowerCase(),
    firmId: req.firmId,
  });

  if (existingUser) {
    return next(
      new AppError("User with this email already exists in your firm", 400),
    );
  }

  // Get user agent
  const ua = parser(req.headers["user-agent"]);
  const userAgent = [ua.ua];

  // Extract file for photo
  const filename = req.file ? req.file.filename : null;

  // Build user data
  const userData = {
    firmId: req.firmId,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    middleName: req.body.middleName,
    email: req.body.email.toLowerCase(),
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: filename,
    address: req.body.address,
    userType: req.body.userType,
    phone: req.body.phone || "+234",
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth,
    position: req.body.position,
    isVerified: false,
    isActive: req.body.isActive ?? true,
    userAgent,
    createdBy: req.user._id,
    additionalRoles: req.body.additionalRoles || [],
    isLawyer: req.body.isLawyer || req.body.userType === "lawyer" || false,
  };

  // ✅ CRITICAL FIX: Handle professionalInfo - accept direct object OR build from fields
  if (
    req.body.professionalInfo &&
    typeof req.body.professionalInfo === "object"
  ) {
    // Frontend sent complete object
    userData.professionalInfo = req.body.professionalInfo;
  } else {
    // Build from individual fields (backward compatibility)
    const professionalInfo = {};
    if (req.body.bio) professionalInfo.bio = req.body.bio;
    if (req.body.education) professionalInfo.education = req.body.education;
    if (req.body.workExperience)
      professionalInfo.workExperience = req.body.workExperience;
    if (req.body.publications)
      professionalInfo.publications = req.body.publications;
    if (req.body.awards) professionalInfo.awards = req.body.awards;
    if (req.body.linkedIn || req.body.twitter || req.body.website) {
      professionalInfo.socialLinks = {
        linkedIn: req.body.linkedIn,
        twitter: req.body.twitter,
        website: req.body.website,
      };
    }
    if (Object.keys(professionalInfo).length > 0) {
      userData.professionalInfo = professionalInfo;
    }
  }

  // Handle primary role based on userType
  switch (userType) {
    case "client":
      userData.role = "client";

      // ✅ Accept nested object OR build from fields
      if (
        req.body.clientDetails &&
        typeof req.body.clientDetails === "object"
      ) {
        userData.clientDetails = req.body.clientDetails;
      } else {
        userData.clientDetails = {
          company: req.body.company,
          industry: req.body.industry,
          clientCategory: req.body.clientCategory || "individual",
          preferredContactMethod: req.body.preferredContactMethod || "email",
          billingAddress: req.body.billingAddress,
          referralSource: req.body.referralSource,
        };
      }

      userData.staffDetails = undefined;
      userData.lawyerDetails = undefined;
      userData.adminDetails = undefined;
      break;

    case "staff":
      userData.role = req.body.role || "staff";

      // ✅ Accept nested object OR build from fields
      if (req.body.staffDetails && typeof req.body.staffDetails === "object") {
        userData.staffDetails = req.body.staffDetails;
      } else {
        userData.staffDetails = {
          department: req.body.department,
          designation: req.body.designation,
          employmentType: req.body.employmentType || "full-time",
          workSchedule: req.body.workSchedule || "9-5",
          skills: req.body.skills,
        };
      }

      userData.clientDetails = undefined;

      if (req.body.hasHrPrivileges) {
        if (!userData.additionalRoles.includes("hr")) {
          userData.additionalRoles.push("hr");
        }
      }

      if (!req.body.hasLawyerPrivileges) {
        userData.lawyerDetails = undefined;
      }
      if (!req.body.hasAdminPrivileges) {
        userData.adminDetails = undefined;
      }
      break;

    case "lawyer":
      userData.role = "lawyer";
      userData.isLawyer = true;

      // ✅ CRITICAL FIX: Accept nested lawyerDetails object OR build from fields
      if (
        req.body.lawyerDetails &&
        typeof req.body.lawyerDetails === "object"
      ) {
        console.log("✅ Using nested lawyerDetails object from frontend");
        userData.lawyerDetails = req.body.lawyerDetails;
      } else {
        console.log("⚠️ Building lawyerDetails from individual fields");
        userData.lawyerDetails = {
          barNumber: req.body.barNumber,
          barAssociation: req.body.barAssociation,
          yearOfCall: req.body.yearOfCall,
          practiceAreas: req.body.practiceAreas || [],
          hourlyRate: req.body.hourlyRate || 0,
          specialization: req.body.specialization,
          lawSchool: {
            name: req.body.lawSchoolAttended,
            graduationYear: req.body.lawSchoolGraduationYear,
            degree: req.body.lawSchoolDegree,
          },
          undergraduateSchool: {
            name: req.body.universityAttended,
            graduationYear: req.body.universityGraduationYear,
            degree: req.body.universityDegree,
          },
          isPartner: req.body.isPartner || false,
          partnershipPercentage: req.body.partnershipPercentage,
        };
      }

      userData.clientDetails = undefined;
      userData.staffDetails = undefined;

      if (!req.body.hasAdminPrivileges) {
        userData.adminDetails = undefined;
      }
      break;

    case "admin":
      userData.role = "admin";

      // ✅ Accept nested object OR build from fields
      if (req.body.adminDetails && typeof req.body.adminDetails === "object") {
        userData.adminDetails = req.body.adminDetails;
      } else {
        userData.adminDetails = {
          adminLevel: req.body.adminLevel || "firm",
          canManageUsers: req.body.canManageUsers || false,
          canManageCases: req.body.canManageCases || false,
          canManageBilling: req.body.canManageBilling || false,
          canViewReports: req.body.canViewReports || false,
          systemAccessLevel: req.body.systemAccessLevel || "restricted",
        };
      }

      userData.clientDetails = undefined;

      if (!req.body.hasLawyerPrivileges) {
        userData.lawyerDetails = undefined;
      }
      break;

    case "super-admin":
      userData.role = "super-admin";
      userData.adminDetails = {
        adminLevel: "firm",
        canManageUsers: true,
        canManageCases: true,
        canManageBilling: true,
        canViewReports: true,
        systemAccessLevel: "full",
      };
      userData.clientDetails = undefined;
      userData.staffDetails = undefined;
      userData.lawyerDetails = undefined;
      break;
  }

  // ✅ Handle additional privileges (multi-role support)

  // If has lawyer privileges but is not primary lawyer
  if (req.body.hasLawyerPrivileges && userType !== "lawyer") {
    userData.isLawyer = true;
    if (!userData.additionalRoles.includes("lawyer")) {
      userData.additionalRoles.push("lawyer");
    }

    // ✅ Accept nested object OR build from fields
    if (req.body.lawyerDetails && typeof req.body.lawyerDetails === "object") {
      userData.lawyerDetails = req.body.lawyerDetails;
    } else {
      userData.lawyerDetails = {
        barNumber: req.body.barNumber,
        barAssociation: req.body.barAssociation,
        yearOfCall: req.body.yearOfCall,
        practiceAreas: req.body.practiceAreas || [],
        hourlyRate: req.body.hourlyRate || 0,
        specialization: req.body.specialization,
        lawSchool: {
          name: req.body.lawSchoolAttended,
          graduationYear: req.body.lawSchoolGraduationYear,
          degree: req.body.lawSchoolDegree,
        },
        undergraduateSchool: {
          name: req.body.universityAttended,
          graduationYear: req.body.universityGraduationYear,
          degree: req.body.universityDegree,
        },
      };
    }
  }

  // If has admin privileges but is not primary admin
  if (
    req.body.hasAdminPrivileges &&
    !["admin", "super-admin"].includes(userType)
  ) {
    if (!userData.additionalRoles.includes("admin")) {
      userData.additionalRoles.push("admin");
    }

    // ✅ Accept nested object OR build from fields
    if (req.body.adminDetails && typeof req.body.adminDetails === "object") {
      userData.adminDetails = req.body.adminDetails;
    } else {
      userData.adminDetails = {
        adminLevel: "firm",
        canManageUsers: req.body.canManageUsers || false,
        canManageCases: req.body.canManageCases || false,
        canManageBilling: req.body.canManageBilling || false,
        canViewReports: req.body.canViewReports || false,
        systemAccessLevel: req.body.systemAccessLevel || "restricted",
      };
    }
  }

  console.log("📦 Final userData before create:", {
    userType: userData.userType,
    role: userData.role,
    additionalRoles: userData.additionalRoles,
    hasLawyerDetails: !!userData.lawyerDetails,
    lawyerDetails: userData.lawyerDetails,
    hasProfessionalInfo: !!userData.professionalInfo,
    professionalInfo: userData.professionalInfo,
  });

  // Create user
  const newUser = await User.create(userData);

  console.log("✅ User created successfully:", {
    id: newUser._id,
    userType: newUser.userType,
    role: newUser.role,
    lawyerDetails: newUser.lawyerDetails,
    professionalInfo: newUser.professionalInfo,
  });

  // Verify what was actually saved
  const savedUser = await User.findById(newUser._id).lean();
  console.log("🔍 VERIFICATION - User in DB:", {
    id: savedUser._id,
    hasLawyerDetails: !!savedUser.lawyerDetails,
    lawyerDetailsKeys: savedUser.lawyerDetails
      ? Object.keys(savedUser.lawyerDetails)
      : [],
    barNumber: savedUser.lawyerDetails?.barNumber,
    professionalInfo: savedUser.professionalInfo,
  });

  // Send verification email
  try {
    const vToken = crypto.randomBytes(32).toString("hex") + newUser._id;
    const hashedToken = hashToken(vToken);

    await new Token({
      userId: newUser._id,
      verificationToken: hashedToken,
      createAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }).save();

    const verificationURL = `${process.env.FRONTEND_URL}/dashboard/verify-account/${vToken}`;

    const subject = `Welcome to ${req.firm?.name || "CaseMaster"}`;
    const send_to = newUser.email;
    const send_from = process.env.SENDINBLUE_EMAIL;
    const reply_to = "noreply@casemaster.ng";
    const template = "verifyEmail";

    const roles = newUser.getEffectiveRoles();
    const context = {
      name: newUser.firstName,
      firmName: req.firm?.name || "Your Firm",
      link: verificationURL,
      companyName: "CaseMaster",
      position: newUser.position || newUser.userType,
      roles: roles.length > 1 ? roles.join(" & ") : roles[0],
    };

    await sendMail(subject, send_to, send_from, reply_to, template, context);
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
  }

  res.status(201).json({
    status: "success",
    message: "User registered successfully. Verification email sent.",
    data: {
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        userType: newUser.userType,
        role: newUser.role,
        additionalRoles: newUser.additionalRoles,
        isLawyer: newUser.isLawyer,
        effectiveRoles: newUser.getEffectiveRoles(),
        lawyerDetails: newUser.lawyerDetails,
        professionalInfo: newUser.professionalInfo,
      },
    },
  });
});

/**
 * ===============================
 * USER LOGIN
 * ===============================
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists and select password
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) Disallow login for deleted accounts
  if (user.isDeleted === true) {
    return next(
      new AppError("This account has been deleted and cannot log in", 401),
    );
  }

  // 4) Disallow login for inactive users (except clients)
  if (user.isActive === false && user.userType !== "client") {
    return next(
      new AppError(
        "Your account is currently inactive. Please contact your administrator.",
        401,
      ),
    );
  }

  // 5) Check if password is correct
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 6) ✅ DEVICE / 2FA CHECK — must come BEFORE the verification check.
  //    This ensures users on a new device always get the code flow,
  //    whether or not their email has been verified yet.
  const currentUserAgent = parser(req.headers["user-agent"]).ua;
  const isKnownDevice = user.userAgent.includes(currentUserAgent);

  if (!isKnownDevice) {
    const loginCode = Math.floor(100000 + Math.random() * 900000);
    console.log("🔐 2FA Code:", loginCode);

    const encryptedLoginCode = cryptr.encrypt(loginCode.toString());

    // Replace any existing token
    await Token.deleteMany({ userId: user._id });

    await new Token({
      userId: user._id,
      loginToken: encryptedLoginCode,
      createAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    }).save();

    // Send the code via email (best-effort — don't block the response)
    try {
      const { sendMail } = require("../utils/email");
      await sendMail(
        "Your Login Verification Code - CaseMaster",
        user.email,
        process.env.SENDINBLUE_EMAIL,
        "noreply@casemaster.ng",
        "loginCode",
        {
          name: user.firstName,
          code: loginCode,
          expiresIn: "60 minutes",
          year: new Date().getFullYear(),
          companyName: process.env.COMPANY_NAME || "CaseMaster",
        },
      );
    } catch (emailErr) {
      console.error("❌ Failed to send 2FA code email:", emailErr.message);
      // We still return the 400 so the frontend redirects to the code entry page.
      // The user can use "Resend Code" from that screen.
    }

    return next(
      new AppError(
        "New Browser or device detected. A verification code has been sent to your email.",
        400,
      ),
    );
  }

  // 7) Email verification check — only reached on KNOWN devices.
  //    Clients are exempt (they may operate without verifying).
  if (!user.isVerified && user.userType !== "client") {
    return next(
      new AppError("Please verify your email address before logging in", 401),
    );
  }

  // 8) Update last login metadata
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  // 9) Issue JWT
  createSendToken(user, 200, res);
});

/**
 * ===============================
 * SEND LOGIN CODE (2FA)
 * ===============================
 */
exports.sendLoginCode = catchAsync(async (req, res, next) => {
  const { email } = req.params;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError("No user found with this email address", 404));
  }

  // Generate new code
  const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("🔐 New Login Code:", loginCode);

  const encryptedLoginCode = cryptr.encrypt(loginCode);

  // Delete any existing tokens
  await Token.deleteMany({ userId: user._id });

  console.log(loginCode);

  // Save new token
  await new Token({
    userId: user._id,
    loginToken: encryptedLoginCode,
    createAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  }).save();

  try {
    const subject = "Your New Login Verification Code - CaseMaster";
    const send_to = user.email;
    const send_from =
      process.env.SENDINBLUE_EMAIL || process.env.EMAIL_USERNAME;
    const reply_to = "noreply@casemaster.com";
    const template = "loginCode";
    const context = {
      name: user.firstName,
      code: loginCode,
      expiresIn: "10 minutes",
      year: new Date().getFullYear(),
      companyName: process.env.COMPANY_NAME || "CaseMaster",
    };

    await sendMail(subject, send_to, send_from, reply_to, template, context);

    res.status(200).json({
      message: `New verification code sent to ${email}`,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("❌ Failed to resend verification code:", error);

    // Clean up on failure
    await Token.deleteMany({ userId: user._id });

    return next(
      new AppError(
        "Failed to send verification code. Please try again later.",
        500,
      ),
    );
  }
});

/**
 * ===============================
 * LOGIN WITH CODE (2FA)
 * ===============================
 */
exports.loginWithCode = catchAsync(async (req, res, next) => {
  const { email } = req.params;
  const { loginCode } = req.body;

  const codeString = String(loginCode);
  if (!loginCode || codeString.length !== 6 || !/^\d{6}$/.test(codeString)) {
    return next(new AppError("Please enter a valid 6-digit code", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Find valid token
  const userToken = await Token.findOne({
    userId: user._id,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    return next(
      new AppError("Verification code expired. Please request a new one.", 400),
    );
  }

  if (!userToken.loginToken) {
    return next(new AppError("Invalid verification code", 400));
  }

  let decryptedLoginCode;
  try {
    decryptedLoginCode = cryptr.decrypt(userToken.loginToken);
  } catch (error) {
    return next(new AppError("Invalid verification code", 400));
  }

  if (String(loginCode) !== decryptedLoginCode) {
    return next(new AppError("Incorrect verification code", 400));
  }

  // Code is correct - register user agent and login
  const ua = parser(req.headers["user-agent"]);
  const currentUserAgent = ua.ua;

  if (!user.userAgent.includes(currentUserAgent)) {
    user.userAgent.push(currentUserAgent);
  }

  // Update last login
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  // Clean up used token
  await Token.deleteMany({ userId: user._id });

  createSendToken(user, 200, res);
});

/**
 * ===============================
 * LOGOUT
 * ===============================
 */
exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ status: "success" });
};

/**
 * ===============================
 * PROTECT MIDDLEWARE
 * ===============================
 */
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }

  // 2) Verification of token
  const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(verified.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401),
    );
  }

  // 4) Check if user is suspended
  if (currentUser.status === "suspended") {
    return next(
      new AppError(
        "Your account has been suspended, please contact the admin.",
        400,
      ),
    );
  }

  // 5) Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(verified.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401),
    );
  }

  // 6) Check if user is deleted
  if (currentUser.isDeleted) {
    return next(
      new AppError(
        "This account has been deleted and cannot access the system.",
        401,
      ),
    );
  }

  // 7) Attach firmId and firm to req if applicable
  if (currentUser.firmId) {
    const firm = await Firm.findById(currentUser.firmId);

    if (!firm || !firm.isActive) {
      return next(new AppError("Your firm account is not accessible.", 403));
    }

    if (!firm.isSubscriptionActive()) {
      return next(new AppError("Your firm's subscription has expired.", 402));
    }

    req.firmId = currentUser.firmId;
    req.firm = firm;
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

/**
 * Helper to consolidate all user roles into a single array
 * This includes the primary role, additional roles, and lawyer status
 */
const getEffectiveRoles = (user) => {
  const roles = [user.role];
  if (user.additionalRoles && user.additionalRoles.length > 0) {
    roles.push(...user.additionalRoles);
  }
  if (user.isLawyer) {
    roles.push("lawyer");
  }
  return [...new Set(roles)]; // Remove duplicates
};

/**
 * ===============================
 * 1. RESTRICT TO ROLES (OR)
 * Access if user has ANY of the specified roles
 * ===============================
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // 1) Super admin bypass
    if (
      req.user.role === "super-admin" ||
      req.user.userType === "super-admin"
    ) {
      return next();
    }

    // 2) Get all effective roles
    const userRoles = getEffectiveRoles(req.user);

    // 3) Check if user has ANY of the required roles
    const hasAccess = roles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }

    next();
  };
};

/**
 * ===============================
 * 2. REQUIRE ALL PRIVILEGES (AND)
 * Access only if user possesses ALL specified roles/privileges
 * ===============================
 */
exports.requireAllPrivileges = (...privileges) => {
  return (req, res, next) => {
    if (
      req.user.role === "super-admin" ||
      req.user.userType === "super-admin"
    ) {
      return next();
    }

    const userRoles = getEffectiveRoles(req.user);
    const hasAll = privileges.every((priv) => userRoles.includes(priv));

    if (!hasAll) {
      return next(
        new AppError(
          "This action requires all of the following privileges: " +
            privileges.join(", "),
          403,
        ),
      );
    }

    next();
  };
};

/**
 * ===============================
 * 3. RESTRICT BY USER TYPE
 * Checks the base identity (e.g., Staff vs Client)
 * ===============================
 */
exports.restrictToUserTypes = (...userTypes) => {
  return (req, res, next) => {
    if (req.user.userType === "super-admin") return next();

    if (!userTypes.includes(req.user.userType)) {
      return next(
        new AppError(`Access restricted to: ${userTypes.join(", ")}`, 403),
      );
    }
    next();
  };
};

/**
 * ===============================
 * 4. ADMIN-SPECIFIC PERMISSIONS
 * (Granular checks inside the Admin role)
 * ===============================
 */
const checkAdminCapability = (capability) => {
  return (req, res, next) => {
    // 1. Super-admin in ANY role (primary or additional) bypasses all checks
    if (req.user.role === "super-admin") return next();

    // Check additional roles for super-admin
    if (
      req.user.additionalRoles &&
      req.user.additionalRoles.includes("super-admin")
    ) {
      return next(); // Super-admin in additional roles has full access
    }

    // 2. Admin with specific capability check
    const isAdmin =
      req.user.role === "admin" ||
      (req.user.additionalRoles && req.user.additionalRoles.includes("admin"));

    if (isAdmin) {
      // Admin in additional roles might not have adminDetails
      // So we need to check if they have it, and if so, check capability
      if (!req.user.adminDetails) {
        // Admin in additional roles without adminDetails gets default access
        // Or you can decide to deny access
        return next(); // or return error based on your requirements
      }

      if (req.user.adminDetails[capability] === true) {
        return next();
      }
    }

    return next(
      new AppError(`Insufficient administrative privilege: ${capability}`, 403),
    );
  };
};

exports.canManageUsers = checkAdminCapability("canManageUsers");
exports.canManageCases = checkAdminCapability("canManageCases");
exports.canManageBilling = checkAdminCapability("canManageBilling");
exports.canViewReports = checkAdminCapability("canViewReports");
exports.hasFullSystemAccess = checkAdminCapability("systemAccessLevel");

/**
 * ===============================
 * 5. VERIFICATION CHECK
 * ===============================
 */
exports.isVerified = (req, res, next) => {
  if (req.user && req.user.isVerified) {
    return next();
  }
  return next(
    new AppError("Please verify your account to access this feature", 403),
  );
};

/**
 * ===============================
 * FLEXIBLE PERMISSION CHECKER
 * ===============================
 */
exports.checkPermission = (permissionChecker) => {
  return (req, res, next) => {
    // 1) Super admin bypass
    if (
      req.user.role === "super-admin" ||
      req.user.userType === "super-admin"
    ) {
      return next();
    }

    // 2) Run the custom logic passed into the middleware
    // We pass req.user to the checker function
    if (permissionChecker(req.user)) {
      return next();
    }

    // 3) If logic returns false, deny access
    return next(
      new AppError("You do not have permission to perform this action", 403),
    );
  };
};

/**
 * ===============================
 * CHECK LOGIN STATUS
 * ===============================
 */
exports.isLoggedIn = async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.json(false);
  }
  try {
    const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // If verification is successful, respond with true
    if (verified) {
      return res.json(true);
    }
    // If verification fails, respond with false
    return res.json(false);
  } catch (error) {
    // If token verification throws an error, respond with false
    console.error("Error verifying token:", error);
    return res.json(false);
  }
};

/**
 * ===============================
 * FORGOT PASSWORD
 * ===============================
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Please provide your email address.", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // Check for user token and delete if found
  const token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create a new reset token
  const rToken = crypto.randomBytes(32).toString("hex") + user._id;
  const hashedToken = hashToken(rToken);

  // Save the new token to the database
  await new Token({
    userId: user._id,
    resetToken: hashedToken,
    createAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  }).save();

  // Create the reset URL
  const resetURL = `${process.env.FRONTEND_URL}/resetPassword/${rToken}`;

  // Prepare email details
  const subject = "Password Reset - CaseMaster";
  const send_to = user.email;
  const send_from = process.env.SENDINBLUE_EMAIL;
  const reply_to = "noreply@gmail.com";
  const template = "forgotPassword";
  const context = {
    name: user.firstName,
    link: resetURL,
    firmName: user.firmId
      ? (await Firm.findById(user.firmId))?.name
      : "CaseMaster",
  };

  try {
    await sendMail(subject, send_to, send_from, reply_to, template, context);
    res.status(200).json({ message: "Reset Email Sent" });
  } catch (err) {
    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500,
      ),
    );
  }
});

/**
 * ===============================
 * RESET PASSWORD
 * ===============================
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  // Hash token sent from frontend
  const hashedToken = hashToken(resetToken);

  // Get token from database
  const userToken = await Token.findOne({
    resetToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    return next(new AppError("Invalid or expired token", 404));
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId }).select(
    "+password",
  );

  // Reset password
  user.password = password;
  user.passwordConfirm = password;
  user.passwordChangedAt = Date.now();

  await user.save({ validateBeforeSave: false });

  // Delete the used token
  await Token.deleteMany({ userId: user._id });

  res.status(200).json({
    message: "Password Reset successful, please login",
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
    },
  });
});

/**
 * ===============================
 * CHANGE PASSWORD
 * ===============================
 */
exports.changePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if current user password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is incorrect.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = Date.now();

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    message: "Password Changed Successfully",
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
    },
  });
});

/**
 * ===============================
 * SEND VERIFICATION EMAIL
 * ===============================
 */
exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  const { email } = req.params;

  const user = await User.findOne({
    email: email.toLowerCase(),
    firmId: req.firmId,
  });

  const firm = await Firm.findById(req.firmId);

  if (!user) {
    return next(new AppError("User does not exist", 404));
  }

  if (user.isVerified) {
    return next(new AppError("User already verified", 400));
  }

  // Delete existing tokens
  await Token.deleteMany({ userId: user._id });

  const vToken = crypto.randomBytes(32).toString("hex") + user._id;
  const hashedToken = hashToken(vToken);

  await new Token({
    userId: user._id,
    verificationToken: hashedToken,
    createAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  }).save();

  const verificationURL = `${process.env.FRONTEND_URL}/dashboard/verify-account/${vToken}`;

  const subject = "Verify Your Account - CaseMaster";
  const send_to = user.email;
  const send_from = process.env.SENDINBLUE_EMAIL;
  const reply_to = "noreply@gmail.com";
  const template = "verifyEmail";
  const context = {
    name: user.firstName,
    link: verificationURL,
    companyName: firm?.name || "CaseMaster",
    position: user.position || user.userType,
  };

  try {
    await sendMail(subject, send_to, send_from, reply_to, template, context);
    return res.status(200).json({
      message: "Verification Email Sent",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
      },
    });
  } catch (error) {
    return next(new AppError("Email sending failed", 400));
  }
});

/**
 * ===============================
 * VERIFY USER
 * ===============================
 */
exports.verifyUser = catchAsync(async (req, res, next) => {
  const { verificationToken } = req.params;

  // Hash token sent from frontend
  const hashedToken = hashToken(verificationToken);

  // Get token from database
  const userToken = await Token.findOne({
    verificationToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    return next(new AppError("Invalid or expired token", 404));
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });

  // Check if user is already verified
  if (user.isVerified) {
    return next(new AppError("User already verified", 400));
  }

  // Verify user
  user.isVerified = true;
  user.status = "active";
  await user.save({ validateBeforeSave: false });

  // Delete the used token
  await Token.deleteMany({ userId: user._id });

  res.status(200).json({
    message: "Account verification successful",
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      isVerified: user.isVerified,
    },
  });
});

/**
 * ===============================
 * LOGIN WITH GOOGLE
 * ===============================
 */
exports.loginWithGoogle = catchAsync(async (req, res, next) => {
  const { userToken } = req.body;

  // Verify token received from the frontend
  const ticket = await client.verifyIdToken({
    idToken: userToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  // Get payload
  const payload = ticket.getPayload();
  const { email } = payload;

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new AppError("You have not been registered as a user", 403));
  }

  // Trigger 2FA for unknown user agent
  const ua = parser(req.headers["user-agent"]);
  const currentUserAgent = ua.ua;

  const allowedAgent = user.userAgent.includes(currentUserAgent);

  if (!allowedAgent) {
    // Generate 6 digit code
    const loginCode = Math.floor(100000 + Math.random() * 900000);
    console.log(loginCode);

    // Encrypt loginCode
    const encryptedLoginCode = cryptr.encrypt(loginCode.toString());

    // Check for existing token and delete if found
    await Token.deleteMany({ userId: user._id });

    // Save new token
    await new Token({
      userId: user._id,
      loginToken: encryptedLoginCode,
      createAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000,
    }).save();

    return next(new AppError("New Browser or device detected", 400));
  }

  // Update last login
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

/**
 * ===============================
 * FIRM LIMIT CHECKERS
 * ===============================
 */
exports.checkUserLimit = catchAsync(async (req, res, next) => {
  const firm = await Firm.findById(req.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  // Count active, non-deleted users
  const currentUserCount = await User.countDocuments({
    firmId: req.firmId,
    isActive: true,
    isDeleted: { $ne: true },
  });

  // Check against firm limits
  if (currentUserCount >= firm.limits.users) {
    return next(
      new AppError(
        `Your plan has reached the maximum number of users (${firm.limits.users}). Please upgrade your plan to add more users.`,
        403,
      ),
    );
  }

  next();
});

exports.checkCaseLimit = catchAsync(async (req, res, next) => {
  const firm = await Firm.findById(req.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  if (!firm.canCreateCase()) {
    return next(
      new AppError(
        `Your firm has reached the monthly case limit (${firm.limits.casesPerMonth}). Please upgrade your plan.`,
        403,
      ),
    );
  }

  next();
});

exports.checkStorageLimit = catchAsync(async (req, res, next) => {
  const firm = await Firm.findById(req.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  const fileSizeGB = req.file ? req.file.size / (1024 * 1024 * 1024) : 0;

  if (!firm.hasStorageAvailable(fileSizeGB)) {
    return next(
      new AppError(
        `Your firm has reached the storage limit (${firm.limits.storageGB}GB). Please upgrade your plan.`,
        403,
      ),
    );
  }

  next();
});

/**
 * ===============================
 * UPDATE FIRM USER COUNT
 * ===============================
 */
exports.updateFirmUserCount = catchAsync(async (req, res, next) => {
  if (!req.firmId) {
    return next();
  }

  const firm = await Firm.findById(req.firmId);

  if (firm) {
    const currentUserCount = await User.countDocuments({
      firmId: req.firmId,
      isActive: true,
      isDeleted: { $ne: true },
    });

    firm.usage.currentUserCount = currentUserCount;
    await firm.save({ validateBeforeSave: false });
  }

  next();
});

/**
 * ===============================
 * GET CURRENT USER PROFILE
 * ===============================
 */
exports.getCurrentUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate("firmId", "name subdomain logo")
    .select("-password -passwordConfirm");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

/**
 * ===============================
 * UPDATE CURRENT USER PROFILE
 * ===============================
 */
exports.updateCurrentUser = catchAsync(async (req, res, next) => {
  // 1) Filter out unwanted fields that are not allowed to be updated
  const filteredBody = { ...req.body };

  // Remove fields that should not be updated
  delete filteredBody.role;
  delete filteredBody.userType;
  delete filteredBody.isVerified;
  delete filteredBody.isActive;
  delete filteredBody.isDeleted;
  delete filteredBody.password;
  delete filteredBody.passwordConfirm;

  // 2) Handle photo upload
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3) Update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }).select("-password -passwordConfirm");

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

module.exports = exports;
