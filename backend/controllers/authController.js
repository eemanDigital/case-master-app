const crypto = require("crypto");
const AppError = require("../utils/appError");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
// const Token = require("../models/tokenModel");
const path = require("path");
const multer = require("multer");
const createSendToken = require("../utils/handleSendToken");
const sendEmail = require("../utils/email");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    // Generate a unique filename for the uploaded file
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: multerStorage,
});

exports.uploadUserPhoto = upload.single("photo");

///// function to implement user signup
exports.signup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, firstName, lastName } = req.body;
  // console.log(req.originalUrl);
  // console.log(req.baseUrl);

  if (!email || !password || !firstName || !lastName) {
    next(new AppError("Required fields must be fielded", 400));
  }

  if (password !== passwordConfirm) {
    next(new AppError("Password and passwordConfirm must be the same", 400));
  }

  let existingEmail = await User.findOne({ email });

  if (existingEmail) {
    next(new AppError("email already exist", 400));
  }

  const filename = req.file ? req.file.filename : null; // Handle optional file

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
    // task: req.body.task,
    bio: req.body.bio,
    position: req.body.position,
    phone: req.body.phone,
    yearOfCall: req.body.yearOfCall,
    otherPosition: req.body.otherPosition,
    practiceArea: req.body.practiceArea,
    universityAttended: req.body.universityAttended,
    lawSchoolAttended: req.body.lawSchoolAttended,
    // passwordResetToken: req.body.passwordResetToken,
    // passwordResetExpire: req.body.passwordResetExpire,
  });

  // console.log({ task: req.body.task });
  createSendToken(user, 201, res);
});

///// function to handle login
exports.login = catchAsync(async (req, res, next) => {
  // console.log(req.cookies);
  let { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    next(new AppError("Provide email and password", 400));
  }
  //2) compare email and password with data in db
  let user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  createSendToken(user, 200, res);
});

///PROTECT HANDLER FUNCTION
//1) check if user has token
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // console.log(req.headers.authorization);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // console.log(token);
  if (!token) {
    return next(new AppError("Kindly login before accessing this page", 401));
  }

  //2) verify the token whether valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("User no longer exist for this token", 401));
  }

  //4 Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    console.log(decoded.iat);
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  //5) give user access
  req.user = currentUser;
  // console.log(req.user.position);
  next();
});

//Middleware to implement restriction by role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You are not eligible to perform this operation", 400)
      );
    }
    next();
  };
};

// CHECK LOGIN STATUS
exports.isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.json(false);
    }

    // 1) verify token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );
    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }
    // 3) Check if user changed password after the token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
      return next();
    }
    // verify token
    const verified = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    if (verified) {
      return res.json(true);
    }
    return res.json(false);
  } catch (err) {
    return next(err);
  }
};

//LOGOUT USER HANDLER
exports.logout = (req, res, next) => {
  // Set the 'jwt' cookie to null and expire it immediately
  res.cookie("jwt", "", { expires: new Date(0), httpOnly: true });
  res.status(200).json({ status: "success" });
};

//FORGOT PASSWORD HANDLER
// exports.forgotPassword = catchAsync(async (req, res, next) => {
//   const { email } = req.body;

//   //get user's email and check whether user exists
//   const user = await User.findOne({ email });
//   if (!user) {
//     return next(new AppError("User not found", 404));
//   }

//   // create password reset token
//   let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
//   console.log(resetToken);
//   // res.send("reset token sent");

//   //encrypt token to be saved in the DB
//   const encryptedToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//   // console.log("encrypted", encryptedToken);

//   // save encrypted token in the database

//   let token = await new Token({
//     userId: user._id,
//     token: encryptedToken,
//     createAt: Date.now(),
//     expiresAt: Date.now() + 30 * (60 * 1000), // expire in thirty minutes
//   });
//   token.save();

//   // reset url
//   const resetURL = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

//   // construct and send password reset email
//   const message = `<h2>Hello ${user.firstName}</h2>
//   <p>Please use the url to reset your password</p>
//   <p>This reset link is valid for only 30 minutes</p>

//   <a href=${resetURL} clicktracking=off >${resetURL}</a>

//   <p>Thanks</p>

//   <p>eemanTech</p>

//   `;

//   const subject = "Password Reset Request";
//   const sentTo = user.email;
//   const sendFrom = process.env.EMAIL_USER;

//   try {
//     await sendEmail(subject, message, sentTo, sendFrom);

//     res.status(200).json({
//       success: true,
//       message: "Reset email sent",
//     });
//   } catch (err) {
//     res.status(500);
//     throw new Error("Email not sent, try again");
//   }
// });

// CHANGE PASSWORD HANDLER
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});
