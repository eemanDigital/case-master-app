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
const sendMail = require("../utils/email");
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
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, userType } = req.body;

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

  // Build user data based on userType
  const userData = {
    firmId: req.firmId,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email.toLowerCase(),
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: filename,
    address: req.body.address,
    userType: req.body.userType,
    phone: req.body.phone || "+234",
    gender: req.body.gender,
    bio: req.body.bio,
    isVerified: false,
    isActive: true,
    userAgent,
    createdBy: req.user._id,
  };

  // ✅ Explicitly set unused type-specific fields to undefined
  if (req.body.userType !== "staff") {
    userData.staffDetails = undefined;
  }
  if (req.body.userType !== "client") {
    userData.clientDetails = undefined;
  }
  if (req.body.userType !== "lawyer") {
    userData.lawyerDetails = undefined;
  }
  if (!["admin", "super-admin"].includes(req.body.userType)) {
    userData.adminDetails = undefined;
  }

  // Add type-specific fields
  switch (userType) {
    case "client":
      userData.role = "client";
      userData.clientDetails = {
        company: req.body.company,
        industry: req.body.industry,
        clientCategory: req.body.clientCategory || "individual",
        preferredContactMethod: req.body.preferredContactMethod || "email",
        billingAddress: req.body.billingAddress,
        referralSource: req.body.referralSource,
      };
      break;

    case "staff":
      userData.role = req.body.role || "staff";
      userData.position = req.body.position;
      userData.staffDetails = {
        department: req.body.department,
        designation: req.body.designation,
        employmentType: req.body.employmentType || "full-time",
        workSchedule: req.body.workSchedule || "9-5",
      };
      break;

    case "lawyer":
      userData.role = "lawyer";
      userData.position = req.body.position || "Associate";
      userData.isLawyer = true;
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
        },
        undergraduateSchool: {
          name: req.body.universityAttended,
          graduationYear: req.body.universityGraduationYear,
        },
      };
      userData.professionalInfo = {
        bio: req.body.bio,
      };
      break;

    case "admin":
      userData.role = "admin";
      userData.position = req.body.position || "Administrator";
      userData.adminDetails = {
        adminLevel: req.body.adminLevel || "firm",
        canManageUsers: req.body.canManageUsers || false,
        canManageCases: req.body.canManageCases || false,
        canManageBilling: req.body.canManageBilling || false,
        canViewReports: req.body.canViewReports || false,
      };
      break;
  }

  const newUser = await User.create(userData);

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
    const context = {
      name: newUser.firstName,
      firmName: req.firm?.name || "Your Firm",
      link: verificationURL,
      companyName: "CaseMaster",
      position: newUser.position || newUser.userType,
    };

    await sendMail(subject, send_to, send_from, reply_to, template, context);
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
  }

  res.status(201).json({
    status: "success",
    message: "User registered successfully. Verification email sent.",
    data: newUser,
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

  // 4) Disallow login for inactive users (except clients - they might be inactive but need access)
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

  // 6) Check if user is verified (optional for clients, required for staff/lawyers/admins)
  if (!user.isVerified && user.userType !== "client") {
    return next(
      new AppError("Please verify your email address before logging in", 401),
    );
  }

  // 7) Trigger 2FA for unknown user agent
  const currentUserAgent = parser(req.headers["user-agent"]).ua;
  const isAllowedAgent = user.userAgent.includes(currentUserAgent);

  if (!isAllowedAgent) {
    const loginCode = Math.floor(100000 + Math.random() * 900000);
    console.log(loginCode);

    const encryptedLoginCode = cryptr.encrypt(loginCode.toString());

    await Token.deleteMany({ userId: user._id });

    await new Token({
      userId: user._id,
      loginToken: encryptedLoginCode,
      createAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000,
    }).save();

    return next(
      new AppError(
        "New Browser or device detected. A verification code has been sent to your email.",
        400,
      ),
    );
  }

  // 8) Update last login
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  // 9) Send token to client
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

  if (!loginCode || loginCode.length !== 6) {
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

  if (loginCode !== decryptedLoginCode) {
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
 * ===============================
 * RESTRICT TO ROLES
 * ===============================
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

/**
 * ===============================
 * RESTRICT TO USER TYPES
 * ===============================
 */
exports.restrictToUserTypes = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

/**
 * ===============================
 * CHECK VERIFIED USER
 * ===============================
 */
exports.isVerified = catchAsync(async (req, res, next) => {
  if (req.user && req.user.isVerified) {
    return next();
  } else {
    return next(new AppError("Account Not Verified", 403));
  }
});

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
