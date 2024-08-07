const dotenv = require("dotenv");
const crypto = require("crypto");
const Cryptr = require("cryptr");
const AppError = require("../utils/appError");
const parser = require("ua-parser-js");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Client = require("../models/clientModel");
// const Token = require("../models/tokenModel");
const { createSendToken, hashToken } = require("../utils/handleSendToken");
const Token = require("../models/tokenModel");
const sendMail = require("../utils/email");

dotenv.config({ path: "./config.env" });

const cryptr = new Cryptr(process.env.CRYPTR_SECRET_KEY);

// ///// function to implement user signup
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, firstName, lastName } = req.body;
  // console.log(req.originalUrl);
  // console.log(req.baseUrl);

  if (!email || !password || !firstName || !lastName) {
    return next(new AppError("Please, provide all the required fields", 400));
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
  // console.log("FILENAME", filename);

  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
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
    userAgent: userAgent,
  });

  createSendToken(user, 201, res);

  // url for to navigate
  // const url = `${req.protocol}://${req.get('host')/login}`
  // const url = "http://localhost:5173/login/staff";
  // send welcome message to user
  // await new Email(user, url).sendWelcome();
});

///// function to handle login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("User does not exist", 404));
  }

  // 3) Check if password is correct
  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Trigger user 2FA auth for unknown user agent
  const ua = parser(req.headers["user-agent"]); // Get user-agent header
  const currentUserAgent = ua.ua;
  // console.log(currentUserAgent);

  const allowedAgent = user.userAgent.includes(currentUserAgent);

  if (!allowedAgent) {
    // Generate 6 digit code
    const loginCode = Math.floor(100000 + Math.random() * 900000);

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

    return res.status(200).json({
      message: "This browser or device is unknown, kindly, very it was you",
    });
  }

  // 4) If everything is ok, send token to client
  createSendToken(user, 200, res);
});

// send login code handler
exports.sendLoginCode = catchAsync(async (req, res, next) => {
  const { email } = req.params;
  const user = await User.findOne({ email });
  // if user not found
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // find login code for user
  let userToken = await Token.findOne({
    userId: user._id,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    return next(new AppError("Invalid or expired token. Please re-login", 404));
  }

  // get the loginCode and decrypt
  const loginCode = userToken.loginToken;
  // decrypt
  const decryptedLoginCode = cryptr.decrypt(loginCode);

  // // Prepare email details
  const subject = "Login Access Code - CaseMaster";
  const send_to = email;
  const send_from = process.env.EMAIL_USER_OUTLOOK;
  const reply_to = "noreply@gmail.com";
  const template = "loginCode";
  const name = user.firstName;
  const link = decryptedLoginCode;
  try {
    await sendMail(subject, send_to, send_from, reply_to, template, name, link);
    res.status(200).json({ message: `Access Code sent to your ${email}` });
  } catch (error) {
    // Send the verification email
    return next(new AppError("Email sending failed", 400));
  }
});

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
    return next(new AppError("Invalid or expired token. Please re-login", 404));
  }

  const decryptedLoginCode = cryptr.decrypt(userToken.loginToken);
  // if login code entered by user is not the same as token in db
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
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
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
      new AppError("The user belonging to this token no longer exist.", 401)
    );
  }
  // check if user is suspended
  if (currentUser.role === "suspended") {
    new AppError(
      "Your account has been suspended, please contact the admin",
      400
    );
  }
  // 4) Check if user changed password after the token was issued
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

  const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  if (verified) {
    res.json(true);
  }
  return res.json(false);
};

// forgot password handler
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
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

  // console.log(rToken);

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
  const name = user.firstName;
  const link = resetURL;

  try {
    // Send the verification email
    await sendMail(subject, send_to, send_from, reply_to, template, name, link);

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

  // Prepare email details
  const subject = "Password Change - CaseMaster";
  const send_to = user.email;
  const send_from = process.env.EMAIL_USER_OUTLOOK;
  const reply_to = "noreply@gmail.com";
  const template = "changePassword";
  const name = user.firstName;
  const link = "";
  try {
    await sendMail(subject, send_to, send_from, reply_to, template, name, link);
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    return next(new AppError("Email sending failed", 400));
  }
});

// // Flag to prevent concurrent refresh attempts
// let isRefreshing = false;
// let failedRequests = [];

// // CHECK LOGIN STATUS

// exports.isLoggedIn = async (req, res) => {
//   try {
//     const accessToken = req.cookies.jwt;
//     const refreshToken = req.cookies.refreshToken;

//     if (!accessToken) {
//       return res.json({ isLoggedIn: false });
//     }

//     try {
//       const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.id);

//       if (!user) {
//         return res.json({ isLoggedIn: false });
//       }

//       return res.json({ isLoggedIn: true });
//     } catch (error) {
//       if (error instanceof jwt.TokenExpiredError && refreshToken) {
//         if (isRefreshing) {
//           // Wait for the ongoing refresh to complete
//           await new Promise((resolve) => failedRequests.push(resolve));
//           return res.json({ isLoggedIn: true });
//         }

//         isRefreshing = true;

//         try {
//           const { accessToken, user } = await refreshAccessToken(refreshToken);

//           res.cookie("jwt", accessToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
//             maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000,
//           });

//           isRefreshing = false;
//           failedRequests.forEach((callback) => callback());
//           failedRequests = [];

//           return res.json({ isLoggedIn: true });
//         } catch (refreshError) {
//           isRefreshing = false;
//           failedRequests = [];
//           return res.json({ isLoggedIn: false });
//         }
//       }

//       return res.json({ isLoggedIn: false });
//     }
//   } catch (err) {
//     console.error("Error in isLoggedIn:", err);
//     return res.json({ isLoggedIn: false });
//   }
// };

// exports.logout = (req, res) => {
//   res.cookie("jwt", "", {
//     expires: new Date(0),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
//   });
//   res.cookie("refreshToken", "", {
//     expires: new Date(0),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
//   });
//   res.status(200).json({ status: "success" });
// };

// exports.forgotPassword = catchAsync(async (req, res, next) => {
//   // 1) Get user based on POSTed email
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return next(new AppError("There is no user with email address.", 404));
//   }

//   // 2) Generate the random reset token
//   const resetToken = user.createPasswordResetToken();
//   await user.save({ validateBeforeSave: false });

//   // 3) Send it to user's email

//   try {
//     // const resetURL = `${req.protocol}://${req.get(
//     //   "host"
//     // )}/api/v1/users/resetPassword/${resetToken}`;

//     const resetURL = `http://localhost:5173/resetPassword/staff/${resetToken}`;

//     // call the reset password function to send mail
//     await new Email(user, resetURL).sendPasswordReset();

//     res.status(200).json({
//       status: "success",
//       message: "Token sent to email!",
//     });
//   } catch (err) {
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     await user.save({ validateBeforeSave: false });

//     return next(
//       new AppError("There was an error sending the email. Try again later!"),
//       500
//     );
//   }
// });

// send verification email
exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  // Get user from the database
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User does not exist", 404));
  }

  // Check if user is already verified
  if (user.isVerified) {
    return next(new AppError("User already verified", 400));
  }

  // Check for existing token and delete if found
  const existingToken = await Token.findOne({ userId: user._id });
  if (existingToken) {
    await existingToken.deleteOne();
  }

  // Create a new verification token
  const vToken = crypto.randomBytes(32).toString("hex") + user._id;
  const hashedToken = hashToken(vToken);

  // Save the new token to the database
  await new Token({
    userId: user._id,
    verificationToken: hashedToken,
    createAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  }).save();

  // Create the verification URL
  const verificationURL = `${process.env.FRONTEND_URL}/dashboard/verify-account/${vToken}`;

  // Prepare email details
  const subject = "Verify Your Account - CaseMaster";
  const send_to = user.email;
  const send_from = process.env.EMAIL_USER_OUTLOOK;
  const reply_to = "noreply@gmail.com";
  const template = "verifyEmail";
  const name = user.firstName;
  const link = verificationURL;
  try {
    await sendMail(subject, send_to, send_from, reply_to, template, name, link);
  } catch (error) {
    res.status(200).json({ message: "Verification Email Sent" });
  }
  // Send the verification email
  return next(new AppError("Email sending failed", 400));
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
