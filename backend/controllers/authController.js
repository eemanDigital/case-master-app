const dotenv = require("dotenv");
const crypto = require("crypto");
const AppError = require("../utils/appError");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Client = require("../models/clientModel");
// const Token = require("../models/tokenModel");
const createSendToken = require("../utils/handleSendToken");
const Email = require("../utils/email");

dotenv.config({ path: "./config.env" });

// ///// function to implement user signup
exports.signup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, firstName, lastName } = req.body;
  // console.log(req.originalUrl);
  // console.log(req.baseUrl);

  if (!email || !password || !firstName || !lastName) {
    return next(new AppError("Required fields must be fielded", 400));
  }

  if (password !== passwordConfirm) {
    return next(
      new AppError("Password and passwordConfirm must be the same", 400)
    );
  }

  let existingEmail = await User.findOne({ email });

  if (existingEmail) {
    return next(new AppError("email already exist", 400));
  }

  // extract file
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
  });

  // url for to navigate
  // const url = `${req.protocol}://${req.get('host')/login}`
  const url = "http://localhost:5173/login/staff";
  // send welcome message to user
  await new Email(user, url).sendWelcome();

  // const user = await User.create(req.body);
  createSendToken(user, 201, res);
});

///// function to handle login
// exports.login = catchAsync(async (req, res, next) => {
//   // console.log(req.cookies);
//   let { email, password } = req.body;
//   // console.log("REQ USER", req.user);

//   // 1) Check if email and password exist
//   if (!email || !password) {
//     next(new AppError("Provide email and password", 400));
//   }
//   //2) compare email and password with data in db
//   let user = await User.findOne({ email }).select("+password");

//   if (!user || !(await bcrypt.compare(password, user.password))) {
//     return next(new AppError("Incorrect email or password", 401));
//   }
//   // console.log("USER", user);

//   createSendToken(user, 200, res);
// });

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    }
  );

  res.cookie("jwt", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) * 1000,
  });

  user.password = undefined;

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// exports.protect = catchAsync(async (req, res, next) => {
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

//   console.log("PROTECT TOKEN", token);

//   // Verify token
//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

//   // Check if user or client still exists
//   let currentUser = await User.findById(decoded.id);
//   if (!currentUser) {
//     currentUser = await Client.findById(decoded.id);
//     if (!currentUser) {
//       return next(new AppError("User no longer exists for this token", 401));
//     }
//   }

//   // Check if user changed password after the token was issued
//   if (currentUser.changePasswordAfter(decoded.iat)) {
//     return next(
//       new AppError("User recently changed password! Please log in again.", 401)
//     );
//   }

//   // Grant access to the protected route
//   req.user = currentUser;
//   next();
// });

//Middleware to implement restriction by role
exports.protect = async (req, res, next) => {
  try {
    const accessToken = req.cookies.jwt;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) {
      return res
        .status(401)
        .json({ message: "Please log in to access this resource" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError && refreshToken) {
        if (isRefreshing) {
          // Wait for the ongoing refresh to complete
          await new Promise((resolve) => failedRequests.push(resolve));
          return exports.protect(req, res, next);
        }

        isRefreshing = true;

        try {
          const { accessToken, user } = await refreshAccessToken(refreshToken);

          res.cookie("jwt", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000,
          });

          isRefreshing = false;
          failedRequests.forEach((callback) => callback());
          failedRequests = [];

          req.user = user;
          next();
        } catch (refreshError) {
          isRefreshing = false;
          failedRequests = [];
          return res.status(401).json({ message: "Please log in again" });
        }
      } else {
        return res.status(401).json({ message: "Invalid token" });
      }
    }
  } catch (err) {
    console.error("Error in protect middleware:", err);
    return res.status(500).json({ message: "An error occurred" });
  }
};

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

// Flag to prevent concurrent refresh attempts
let isRefreshing = false;
let failedRequests = [];

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return { accessToken, user };
  } catch (error) {
    throw error;
  }
};

// refresh token
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    console.log(refreshToken, "REFRESH TOKEN");

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.cookie("jwt", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({ status: "success", accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// CHECK LOGIN STATUS
// exports.isLoggedIn = async (req, res) => {
//   try {
//     const token = req.cookies.jwt;

//     if (!token) {
//       return res.json({ isLoggedIn: false });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const currentUser = await User.findById(decoded.id);

//     if (!currentUser) {
//       return res.json({ isLoggedIn: false });
//     }

//     return res.json({ isLoggedIn: true });
//   } catch (err) {
//     if (err instanceof jwt.TokenExpiredError) {
//       // Token has expired, try to refresh
//       try {
//         const refreshToken = req.cookies.refreshToken;
//         if (!refreshToken) {
//           return res.json({ isLoggedIn: false });
//         }

//         const decoded = jwt.verify(
//           refreshToken,
//           process.env.REFRESH_TOKEN_SECRET
//         );
//         const user = await User.findById(decoded.id);

//         if (!user) {
//           return res.json({ isLoggedIn: false });
//         }

//         const newAccessToken = jwt.sign(
//           { id: user._id },
//           process.env.JWT_SECRET,
//           {
//             expiresIn: process.env.JWT_EXPIRES_IN,
//           }
//         );

//         res.cookie("jwt", newAccessToken, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
//           maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000,
//         });

//         return res.json({ isLoggedIn: true });
//       } catch (refreshError) {
//         return res.json({ isLoggedIn: false });
//       }
//     }
//     return res.json({ isLoggedIn: false });
//   }
// };
exports.isLoggedIn = async (req, res) => {
  try {
    const accessToken = req.cookies.jwt;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) {
      return res.json({ isLoggedIn: false });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.json({ isLoggedIn: false });
      }

      return res.json({ isLoggedIn: true });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError && refreshToken) {
        if (isRefreshing) {
          // Wait for the ongoing refresh to complete
          await new Promise((resolve) => failedRequests.push(resolve));
          return res.json({ isLoggedIn: true });
        }

        isRefreshing = true;

        try {
          const { accessToken, user } = await refreshAccessToken(refreshToken);

          res.cookie("jwt", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000,
          });

          isRefreshing = false;
          failedRequests.forEach((callback) => callback());
          failedRequests = [];

          return res.json({ isLoggedIn: true });
        } catch (refreshError) {
          isRefreshing = false;
          failedRequests = [];
          return res.json({ isLoggedIn: false });
        }
      }

      return res.json({ isLoggedIn: false });
    }
  } catch (err) {
    console.error("Error in isLoggedIn:", err);
    return res.json({ isLoggedIn: false });
  }
};
//LOGOUT USER HANDLER
// exports.logout = (req, res) => {
//   res.cookie("jwt", "", { expires: new Date(0), httpOnly: true });
//   res.cookie("refreshToken", "", { expires: new Date(0), httpOnly: true });
//   res.status(200).json({ status: "success" });
// };

exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
  res.cookie("refreshToken", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
  res.status(200).json({ status: "success" });
};

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

  try {
    // const resetURL = `${req.protocol}://${req.get(
    //   "host"
    // )}/api/v1/users/resetPassword/${resetToken}`;

    const resetURL = `http://localhost:5173/resetPassword/staff/${resetToken}`;

    // call the reset password function to send mail
    await new Email(user, resetURL).sendPasswordReset();

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
  await user.save({ validateBeforeSave: false });

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});
