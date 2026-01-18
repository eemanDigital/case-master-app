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
 * FIRM REGISTRATION (NEW)
 * ===============================
 *
 * Register a new law firm with admin user
 * This creates both the Firm and the admin User in a transaction
 */
/**
 * ===============================
 * FIRM REGISTRATION (FIXED)
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
    plan = "FREE", // ✅ NEW: Allow plan selection during registration
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
      new AppError("Password and passwordConfirm must be the same", 400)
    );
  }

  // 3) Validate subdomain format (if provided)
  if (subdomain && !/^[a-z0-9-]+$/.test(subdomain)) {
    return next(
      new AppError(
        "Subdomain can only contain lowercase letters, numbers, and hyphens",
        400
      )
    );
  }

  // 4) Check if subdomain already exists (if provided)
  if (subdomain) {
    const existingFirm = await Firm.findOne({ subdomain });
    if (existingFirm) {
      return next(new AppError("This subdomain is already taken", 400));
    }
  }

  // ✅ 5) Validate and set plan limits
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
      casesPerMonth: Infinity, // Unlimited
      trialDays: 14,
    },
    ENTERPRISE: {
      users: Infinity, // Unlimited
      storageGB: Infinity, // Unlimited
      casesPerMonth: Infinity, // Unlimited
      trialDays: 30,
    },
  };

  const selectedPlan = plan.toUpperCase();
  if (!planConfig[selectedPlan]) {
    return next(new AppError("Invalid plan selected", 400));
  }

  const limits = planConfig[selectedPlan];

  try {
    // ✅ 6) Create Firm with proper plan limits
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
      // ✅ Set limits based on selected plan
      limits: {
        users: limits.users === Infinity ? 999999 : limits.users,
        storageGB: limits.storageGB === Infinity ? 999999 : limits.storageGB,
        casesPerMonth:
          limits.casesPerMonth === Infinity ? 999999 : limits.casesPerMonth,
      },
      // ✅ Initialize usage tracking
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

    // 8) Create Admin User
    const userData = {
      firmId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      passwordConfirm,
      role: "super-admin",
      position: "Managing Partner",
      address: address || "Not provided",
      phone: phone || "+234",
      gender: req.body.gender || "male",
      isVerified: false,
      isLawyer: req.body.isLawyer || false,
      userAgent,
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

    // 10) Send success response with plan details
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

// function to implement user signup
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm } = req.body;

  if (!email || !password || !passwordConfirm) {
    return next(
      new AppError("Please, provide email and passwords fields", 400)
    );
  }

  if (password.length < 8) {
    return next(new AppError("Password must be at lease 8 characters", 400));
  }

  if (password !== passwordConfirm) {
    return next(
      new AppError("Password and passwordConfirm must be the same", 400)
    );
  }
  // check if user exist
  let existingEmail = await User.findOne({ email });

  if (existingEmail) {
    return next(new AppError("email already exist", 400));
  }

  // get user agent
  const ua = parser(req.headers["user-agent"]); // get user-agent header
  const userAgent = [ua.ua];

  // extract file for photo
  const filename = req.file ? req.file.filename : null;

  await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    secondName: req.body.secondName, //for client
    middleName: req.body.middleName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: filename,
    address: req.body.address,
    role: req.body.role,
    gender: req.body.gender,
    bio: req.body.bio,
    position: req.body.position,
    annualLeaveEntitled: req.body.annualLeaveEntitled,
    phone: req.body.phone,
    yearOfCall: req.body.yearOfCall,
    otherPosition: req.body.otherPosition,
    practiceArea: req.body.practiceArea,
    universityAttended: req.body.universityAttended,
    lawSchoolAttended: req.body.lawSchoolAttended,
    isVerified: req.body.isVerified,
    isLawyer: req.body.isLawyer,
    isActive: req.body.isActive,
    userAgent: userAgent,
  });

  // createSendToken(user, 201, res);
  res.status(201).json({ message: "User Registered Successfully" });
});

// // login user handler
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists and select password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Disallow login for deleted accounts (all roles)
  if (user.isDeleted === true) {
    return next(
      new AppError("This account has been deleted and cannot log in")
    );
  }

  // Disallow login for inactive staff, but allow inactive clients
  if (user.isActive === false && user.role !== "client") {
    return next(
      new AppError("You are no longer eligible to login to this account")
    );
  }

  // 3) Check if password is correct
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 4) Trigger 2FA for unknown user agent
  const currentUserAgent = parser(req.headers["user-agent"]).ua;
  const isAllowedAgent = user.userAgent.includes(currentUserAgent);

  if (!isAllowedAgent) {
    const loginCode = Math.floor(100000 + Math.random() * 900000);

    console.log(loginCode);

    const encryptedLoginCode = cryptr.encrypt(loginCode.toString());

    await Token.findOneAndDelete({ userId: user._id });

    await new Token({
      userId: user._id,
      loginToken: encryptedLoginCode,
      createAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000,
    }).save();

    // Send the loginCode securely via email or SMS to the user
    console.log(req.cookies);

    return next(
      new AppError(
        "New Browser or device detected. A verification code has been sent to your email.",
        400
      )
    );
  }

  // 5) Send token to client
  createSendToken(user, 200, res);
});

// Fixed sendLoginCode function
exports.sendLoginCode = catchAsync(async (req, res, next) => {
  const { email } = req.params;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No user found with this email address", 404));
  }

  // Generate new code instead of relying on existing token
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
        500
      )
    );
  }
});

// Fixed loginWithCode function
exports.loginWithCode = catchAsync(async (req, res, next) => {
  const { email } = req.params;
  const { loginCode } = req.body;

  if (!loginCode || loginCode.length !== 6) {
    return next(new AppError("Please enter a valid 6-digit code", 400));
  }

  const user = await User.findOne({ email });
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
      new AppError("Verification code expired. Please request a new one.", 400)
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
    await user.save({ validateBeforeSave: false });
  }

  // Clean up used token
  await Token.deleteMany({ userId: user._id });

  createSendToken(user, 200, res);
});

// logout handler
exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    // sameSite: "none",
  });
  res.status(200).json({ status: "success" });
};

// protect access handler
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
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification of token
  const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(verified.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  // 4) Check if user is suspended
  if (currentUser.role === "suspended") {
    return next(
      new AppError(
        "Your account has been suspended, please contact the admin.",
        400
      )
    );
  }

  // 5) Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(verified.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }
  // 6) Attach firmId and firm to req if applicable
  if (currentUser.firmId) {
    const Firm = require("../models/firmModel");
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

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'super-admin']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

// check verified user
exports.isVerified = catchAsync(async (req, res, next) => {
  if (req.user && req.user.isVerified) {
    return next();
  } else {
    return next(new AppError("Account Not Verified", 403));
  }
});

// // CHECK LOGIN STATUS

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

// forgot password handler
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  // 1) Get user based on POSTed email
  // console.log(`Searching for user with email: ${email}`);

  if (!email) {
    return next(new AppError("Please provide your email address.", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  //Check for user token and delete if found
  const token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create a new verification token
  const rToken = crypto.randomBytes(32).toString("hex") + user._id;
  const hashedToken = hashToken(rToken);

  // Save the new token to the database
  await new Token({
    userId: user._id,
    resetToken: hashedToken,
    createAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  }).save();

  // Create the verification URL
  const resetURL = `${process.env.FRONTEND_URL}/resetPassword/${rToken}`;

  // Prepare email details
  const subject = "Password Reset - CaseMaster";
  const send_to = user.email;
  const send_from = process.env.SENDINBLUE_EMAIL;
  const reply_to = "noreply@gmail.com";
  const template = "forgotPassword";
  const context = { name: user.firstName, link: resetURL };

  try {
    // Send the verification email
    await sendMail(subject, send_to, send_from, reply_to, template, context);

    // Proceed to the next middleware
    res.status(200).json({ message: "Reset Email Sent" });
  } catch (err) {
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

// Reset password handler
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get params
  const { resetToken } = req.params;

  const { password } = req.body;
  // hash token sent from frontend
  const hashedToken = hashToken(resetToken);
  // get token from database
  const userToken = await Token.findOne({
    resetToken: hashedToken,
    expiresAt: { $gt: Date.now() }, //get if it has not expired
  });

  if (!userToken) {
    return next(new AppError("Invalid or expired token", 404));
  }
  // find user
  const user = await User.findOne({ _id: userToken.userId });
  // reset password
  user.password = password;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ message: "Password Reset successful, please login" });
});

// // CHANGE PASSWORD HANDLER
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
  await user.save({ validateBeforeSave: false });
  // User.findByIdAndUpdate will NOT work as intended!

  res.status(200).json({ message: "Password Changed" });
});

// send verification email
exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  const { email } = req.params; // Assuming the new user's email is passed in the request body
  //
  const user = await User.findOne({ email }); // Find the user in the database

  //
  if (!user) {
    return next(new AppError("User does not exist", 404));
  }

  if (user.isVerified) {
    return next(new AppError("User already verified", 400));
  }

  const existingToken = await Token.findOne({ userId: user._id });
  if (existingToken) {
    await existingToken.deleteOne();
  }

  const vToken = crypto.randomBytes(32).toString("hex") + user._id;
  const hashedToken = hashToken(vToken);

  await new Token({
    userId: user._id,
    verificationToken: hashedToken,
    createAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  }).save();

  const verificationURL = `${process.env.FRONTEND_URL}/dashboard/verify-account/${vToken}`;
  console.log(verificationURL);
  const subject = "Verify Your Account - CaseMaster";
  const send_to = user.email;
  const send_from = process.env.SENDINBLUE_EMAIL;
  const reply_to = "noreply@gmail.com";
  const template = "verifyEmail";
  const context = {
    name: user.firstName,
    link: verificationURL,
    companyName: process.env.COMPANY_NAME || "A.T Lukman & Co",
    password: process.env.TEMP_PASSWORD,
  };

  try {
    await sendMail(subject, send_to, send_from, reply_to, template, context);
    return res.status(200).json({ message: "Verification Email Sent" });
  } catch (error) {
    return next(new AppError("Email sending failed", 400));
  }
});

// verify user
exports.verifyUser = catchAsync(async (req, res, next) => {
  const { verificationToken } = req.params;
  // hash token sent from frontend
  const hashedToken = hashToken(verificationToken);
  // get token from database
  const userToken = await Token.findOne({
    verificationToken: hashedToken,
    expiresAt: { $gt: Date.now() }, //get if it has not expired
  });

  if (!userToken) {
    return next(new AppError("Invalid or expired token", 404));
  }
  // find user
  const user = await User.findOne({ _id: userToken.userId });

  // check if user is already verified
  if (user.isVerified) {
    return next(new AppError("User already verified", 400));
  }
  // if not verified,then verify user
  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ message: "Account verification successful" });
});

// login with google
exports.loginWithGoogle = catchAsync(async (req, res, next) => {
  const { userToken } = req.body;

  // verify token received from the frontend
  const ticket = await client.verifyIdToken({
    idToken: userToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  // get payload
  const payload = ticket.getPayload();

  const { email } = payload;

  // check if user exist
  const user = await User.findOne({ email });

  // check if user exist
  if (!user) {
    next(new AppError("You have not been registered as a user", 403));
  }

  // Trigger user 2FA auth for unknown user agent
  const ua = parser(req.headers["user-agent"]); // Get user-agent header
  const currentUserAgent = ua.ua;

  const allowedAgent = user.userAgent.includes(currentUserAgent);

  if (!allowedAgent) {
    // Generate 6 digit code
    const loginCode = Math.floor(100000 + Math.random() * 900000);
    console.log(loginCode);
    // Encrypt loginCode
    const encryptedLoginCode = cryptr.encrypt(loginCode.toString());

    // Check for existing token and delete if found
    const userToken = await Token.findOne({ userId: user._id });
    if (userToken) {
      await userToken.deleteOne();
    }

    // Save the new token to the database
    await new Token({
      userId: user._id,
      loginToken: encryptedLoginCode,
      createAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    }).save();

    return next(new AppError("New Browser or device detected", 400));
  }

  createSendToken(user, 200, res);
});

// controllers/authController.js

// Add at the end of the file:

exports.checkUserLimit = catchAsync(async (req, res, next) => {
  const Firm = require("../models/firmModel");
  const firm = await Firm.findById(req.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  // ✅ Count active, non-deleted users
  const currentUserCount = await User.countDocuments({
    firmId: req.firmId,
    isActive: true,
    isDeleted: { $ne: true },
  });

  // ✅ Check against firm limits (not usage.currentUserCount)
  if (currentUserCount >= firm.limits.users) {
    const planDetails = firm.getPlanDetails();
    return next(
      new AppError(
        `Your ${planDetails.name} plan has reached the maximum number of users (${firm.limits.users}). Please upgrade your plan to add more users.`,
        403
      )
    );
  }

  next();
});
exports.checkCaseLimit = catchAsync(async (req, res, next) => {
  const Firm = require("../models/firmModel");
  const firm = await Firm.findById(req.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  if (!firm.canCreateCase()) {
    return next(
      new AppError(
        `Your firm has reached the monthly case limit (${firm.limits.casesPerMonth}). Please upgrade your plan.`,
        403
      )
    );
  }

  next();
});

exports.checkStorageLimit = catchAsync(async (req, res, next) => {
  const Firm = require("../models/firmModel");
  const firm = await Firm.findById(req.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  const fileSizeGB = req.file ? req.file.size / (1024 * 1024 * 1024) : 0;

  if (!firm.hasStorageAvailable(fileSizeGB)) {
    return next(
      new AppError(
        `Your firm has reached the storage limit (${firm.limits.storageGB}GB). Please upgrade your plan.`,
        403
      )
    );
  }

  next();
});

/**
 * ✅ NEW: Update firm user count after creating user
 * Call this AFTER creating a new user
 */
exports.updateFirmUserCount = catchAsync(async (req, res, next) => {
  if (!req.firmId) {
    return next();
  }

  const Firm = require("../models/firmModel");
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
