const dotenv = require("dotenv");
const crypto = require("crypto");
const AppError = require("../utils/appError");
const parser = require("ua-parser-js");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Client = require("../models/clientModel");
// const Token = require("../models/tokenModel");
const { createSendToken } = require("../utils/handleSendToken");
const Token = require("../models/tokenModel");

dotenv.config({ path: "./config.env" });

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

exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  // get user
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User does not exist", 404));
  }

  // check if user is verified
  if (user.isVerified) {
    return next(new AppError("User already verified", 400));
  }

  // if user exist check token in the db for the user and delete
  const token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  //create verification token and save to db
  const verificationToken = crypto.randomBytes(32).toString("hex") + user._id;

  console.log(verificationToken);
});
///// function to handle login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2)check if user exist
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return next(new AppError("User does not exist", 404));
  }

  // 3) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // trigger user 2fa auth for unknown user agent

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
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
// // Flag to prevent concurrent refresh attempts
// let isRefreshing = false;
// let failedRequests = [];

// const refreshAccessToken = async (refreshToken) => {
//   try {
//     const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//     const user = await User.findById(decoded.id);

//     if (!user) {
//       throw new Error("User not found");
//     }

//     const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN,
//     });

//     return { accessToken, user };
//   } catch (error) {
//     throw error;
//   }
// };

// // refresh token
// exports.refreshToken = async (req, res) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;

//     console.log(refreshToken, "REFRESH TOKEN");

//     if (!refreshToken) {
//       return res.status(401).json({ message: "Refresh token not found" });
//     }

//     const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//     const user = await User.findById(decoded.id);

//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN,
//     });

//     res.cookie("jwt", accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//     });

//     res.status(200).json({ status: "success", accessToken });
//   } catch (error) {
//     res.status(401).json({ message: "Invalid refresh token" });
//   }
// };

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

// // CHANGE PASSWORD HANDLER
// exports.updatePassword = catchAsync(async (req, res, next) => {
//   // 1) Get user from collection
//   const user = await User.findById(req.user.id).select("+password");

//   // 2) Check if POSTed current password is correct
//   if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
//     return next(new AppError("Your current password is wrong.", 401));
//   }

//   // 3) If so, update password
//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   await user.save();
//   // User.findByIdAndUpdate will NOT work as intended!

//   // 4) Log user in, send JWT
//   createSendToken(user, 200, res);
// });

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

// exports.resetPassword = catchAsync(async (req, res, next) => {
//   // 1) Get user based on the token
//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(req.params.token)
//     .digest("hex");

//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() },
//   });

//   // 2) If token has not expired, and there is user, set the new password
//   if (!user) {
//     return next(new AppError("Token is invalid or has expired", 400));
//   }
//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save({ validateBeforeSave: false });

//   // 3) Update changedPasswordAt property for the user
//   // 4) Log the user in, send JWT
//   createSendToken(user, 200, res);
// });
