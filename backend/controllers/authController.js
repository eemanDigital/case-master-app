const dotenv = require("dotenv");
const crypto = require("crypto");
const Cryptr = require("cryptr");
const AppError = require("../utils/appError");
const parser = require("ua-parser-js");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { createSendToken, hashToken } = require("../utils/handleSendToken");
const Token = require("../models/tokenModel");
const sendMail = require("../utils/email");
const { OAuth2Client } = require("google-auth-library");

dotenv.config({ path: "./config.env" });

const cryptr = new Cryptr(process.env.CRYPTR_SECRET_KEY);

// create new instance of google oauth2
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

///// function to handle login
// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;

//   // 1) Check if email and password exist
//   if (!email || !password) {
//     return next(new AppError("Please provide email and password!", 400));
//   }

//   // 2) Check if user exists
//   const user = await User.findOne({ email }).select("+password");
//   if (!user) {
//     return next(new AppError("User does not exist", 404));
//   }

//   // 3) Check if password is correct
//   if (!(await user.correctPassword(password, user.password))) {
//     return next(new AppError("Incorrect email or password", 401));
//   }

//   // Trigger user 2FA auth for unknown user agent
//   const ua = parser(req.headers["user-agent"]); // Get user-agent header
//   const currentUserAgent = ua.ua;

//   const allowedAgent = user.userAgent.includes(currentUserAgent);

//   if (!allowedAgent) {
//     // Generate 6 digit code
//     const loginCode = Math.floor(100000 + Math.random() * 900000);

//     console.log(loginCode);

//     // Encrypt loginCode
//     const encryptedLoginCode = cryptr.encrypt(loginCode.toString());

//     // Check for existing token and delete if found
//     const userToken = await Token.findOne({ userId: user._id });
//     if (userToken) {
//       await userToken.deleteOne();
//     }

//     // Save the new token to the database
//     await new Token({
//       userId: user._id,
//       loginToken: encryptedLoginCode,
//       createAt: Date.now(),
//       expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
//     }).save();

//     return next(new AppError("New Browser or device detected", 400));
//   }

//   // 4) If everything is ok, send token to client
//   createSendToken(user, 200, res);
// });

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

// send login code handler
exports.sendLoginCode = catchAsync(async (req, res, next) => {
  const { email } = req.params;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  let userToken = await Token.findOne({
    userId: user._id,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    return next(new AppError("Invalid or expired token. Please re-login", 404));
  }

  const loginCode = userToken.loginToken;
  if (!loginCode) {
    return next(new AppError("Login code is missing or invalid.", 400));
  }

  let decryptedLoginCode;
  try {
    decryptedLoginCode = cryptr.decrypt(loginCode);
  } catch (error) {
    return next(new AppError("Failed to decrypt login code.", 400));
  }

  const subject = "Login Access Code - CaseMaster";
  const send_to = email;
  const send_from = process.env.EMAIL_USER_OUTLOOK;
  const reply_to = "noreply@gmail.com";
  const template = "loginCode";
  const context = { name: user.firstName, link: decryptedLoginCode };

  try {
    await sendMail(subject, send_to, send_from, reply_to, template, context);
    res.status(200).json({ message: `Access Code sent to your ${email}` });
  } catch (error) {
    return next(new AppError("Email sending failed", 400));
  }
});
// 2fa
exports.loginWithCode = catchAsync(async (req, res, next) => {
  const { email } = req.params;
  const { loginCode } = req.body;

  const user = await User.findOne({ email });
  // if user not found
  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  // find login code
  // find login code for user
  let userToken = await Token.findOne({
    userId: user._id,
    expiresAt: { $gt: Date.now() },
  });
  if (!userToken) {
    return next(new AppError("Invalid or expired token", 404));
  }

  const decryptedLoginCode = cryptr.decrypt(userToken.loginToken);
  // if login code entered by user is not the same as token in db
  // console.log(loginCode, decryptedLoginCode);
  if (loginCode !== decryptedLoginCode) {
    return next(new AppError("Incorrect access code, please try again", 404));
  } else {
    // register user agent
    const ua = parser(req.headers["user-agent"]); // Get user-agent header
    const currentUserAgent = ua.ua;
    // add new user agent to the list of existing agents
    user.userAgent.push(currentUserAgent);
    await user.save({ validateBeforeSave: false });

    // 4) If everything is ok, login user
    createSendToken(user, 200, res);
  }
});

// logout handler
exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "none",
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
  const send_from = process.env.EMAIL_USER_OUTLOOK;
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
  // Prepare email details
  // const subject = "Password Change - CaseMaster";
  // const send_to = user.email;
  // const send_from = process.env.EMAIL_USER_OUTLOOK;
  // const reply_to = "noreply@gmail.com";
  // const template = "changePassword";
  // const name = user.firstName;
  // const link = "";
  // try {
  //   await sendMail(subject, send_to, send_from, reply_to, template, name, link);
  //   // 4) Log user in, send JWT
  //   // createSendToken(user, 200, res);
  //   res.status(200).json({ message: "Password Changed Successfully" });
  // } catch (error) {
  //   return next(new AppError("Email sending failed", 400));
  // }
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
  const send_from = process.env.EMAIL_USER_OUTLOOK;
  const reply_to = "noreply@gmail.com";
  const template = "verifyEmail";
  const context = { name: user.firstName, link: verificationURL };

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
