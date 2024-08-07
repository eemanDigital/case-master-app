const dotenv = require("dotenv");
const crypto = require("crypto");
const AppError = require("../utils/appError");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Client = require("../models/clientModel");
// const Token = require("../models/tokenModel");
const createSendToken = require("../utils/handleSendToken");
const Email = require("../utils/email");

dotenv.config({ path: "./config.env" });

// ///// function to implement user signup
exports.signup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, firstName, secondName } = req.body;

  if (!email || !password || !firstName) {
    return next(new AppError("Required fields must be fielded", 400));
  }

  if (password !== passwordConfirm) {
    return next(
      new AppError("Password and passwordConfirm must be the same", 400)
    );
  }

  let existingEmail = await Client.findOne({ email });

  if (existingEmail) {
    return next(new AppError("Email already exists", 400));
  }

  const clientUser = await Client.create({
    firstName,
    secondName,
    email,
    password,
    passwordConfirm,
    address: req.body.address,
    phone: req.body.phone,
    case: req.body.case,
    active: req.body.active,
  });

  // URL for navigation
  const url = "http://localhost:5173/login";

  // Send welcome message to user
  await new Email(clientUser, url).sendWelcomeClient();
  console.log(clientUser);

  createSendToken(clientUser, 201, res);
});

///// function to handle login
exports.login = catchAsync(async (req, res, next) => {
  // console.log(req.cookies);
  let { email, password } = req.body;
  // console.log("REQ Headers", req.headers);

  // 1) Check if email and password exist
  if (!email || !password) {
    next(new AppError("Provide email and password", 400));
  }
  //2) compare email and password with data in db
  let clientUser = await Client.findOne({ email }).select("+password");

  if (!clientUser || !(await bcrypt.compare(password, clientUser.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // console.log("clientUser", clientUser);

  createSendToken(clientUser, 200, res);
});

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
    const currentUser = await Client.findById(decoded.id);
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

// CHANGE PASSWORD HANDLER
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await Client.findById(req.user.id).select("+password");

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
  createSendToken(clientUser, 200, res);
});

// exports.protectClient = catchAsync(async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }

//   if (!token) {
//     return next(new AppError("Kindly login before accessing this page", 401));
//   }

//   // Verify the token
//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

//   // Check if client still exists
//   const currentClient = await Client.findById(decoded.id);
//   if (!currentClient) {
//     return next(new AppError("Client no longer exists for this token", 401));
//   }

//   // Check if client changed password after the token was issued
//   if (currentClient.changePasswordAfter(decoded.iat)) {
//     return next(
//       new AppError(
//         "Client recently changed password! Please log in again.",
//         401
//       )
//     );
//   }

//   // Grant access to the protected route
//   req.user = currentClient;
//   next();
// });

//Middleware to implement restriction by role
exports.restrictTo = (...roles) => {
  // console.log("ROLES", ...roles);
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      // console.log("ROLE", req.user);
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const clientUser = await Client.findOne({ email: req.body.email });
  if (!clientUser) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = clientUser.createPasswordResetToken();
  await clientUser.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  try {
    // const resetURL = `${req.protocol}://${req.get(
    //   "host"
    // )}/api/v1/users/resetPassword/${resetToken}`;

    const resetURL = `http://localhost:5173/resetPassword/clients/${resetToken}`;

    // call the reset password function to send mail
    await new Email(clientUser, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    clientUser.passwordResetToken = undefined;
    clientUser.passwordResetExpires = undefined;
    await clientUser.save({ validateBeforeSave: false });

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

  const clientUser = await Client.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!clientUser) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  clientUser.password = req.body.password;
  clientUser.passwordConfirm = req.body.passwordConfirm;
  clientUser.passwordResetToken = undefined;
  clientUser.passwordResetExpires = undefined;
  await clientUser.save({ validateBeforeSave: false });

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(clientUser, 200, res);
});
