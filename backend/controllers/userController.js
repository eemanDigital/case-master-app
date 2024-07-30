const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const filterObj = require("../utils/filterObj");
const setRedisCache = require("../utils/setRedisCache");
const sendMail = require("../utils/email");

// GET ALL USERS
exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({});

  // set redis cache
  setRedisCache("users", users, 1200);

  res.status(200).json({
    results: users.length,
    fromCache: false,
    data: users,
  });
});

// GET A USER
exports.getUser = catchAsync(async (req, res, next) => {
  // const _id = req.params.userId; //he used req.user._id
  console.log(req.user.id);
  const data = await User.findById(req.user._id).populate({
    path: "task",
    select: "-assignedTo",
  });

  if (!data) {
    return next(new AppError("No user found with that Id", 404));
  }

  // set redis cache
  // setRedisCache(`user:${req.params.userId}`, data, 1200);

  res.status(200).json({
    data,
  });
});
// GET A USER
exports.getSingleUser = catchAsync(async (req, res, next) => {
  // const _id = req.params.userId; //he used req.user._id
  const data = await User.findById(req.params.id).populate({
    path: "task",
    select: "-assignedTo",
  });

  if (!data) {
    return next(new AppError("No user found with that Id", 404));
  }

  // set redis cache
  // setRedisCache(`user:${req.params.userId}`, data, 1200);

  res.status(200).json({
    data,
  });
});

// UPDATE USER PROFILE
exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    "email",
    "firstName",
    "lastName",
    "middleName",
    "photo",
    "address",
    "bio",
    "phone",
    "annualLeaveEntitled",
    "yearOfCall",
    "otherPosition",
    "practiceArea",
    "universityAttended",
    "lawSchoolAttended"
  );

  // If there's a file, save its Cloudinary URL in the filtered body
  if (req.file) filteredBody.photo = req.file.cloudinaryUrl;

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// UPDATE USER PROFILE BY ADMIN
exports.upgradeUser = catchAsync(async (req, res, next) => {
  const { role, id } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }
  user.role = role;

  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    message: `User role updated to ${role}`,
    data: user,
  });
});

// DELETE USER
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(204).json({
    message: "User deleted",
    data: null,
  });
});

// send automated email to user
exports.sendAutomatedEmail = catchAsync(async (req, res, next) => {
  const { send_to, reply_to, template, subject, url } = req.body;

  if (!send_to || !reply_to || !template || !subject) {
    return next(new AppError("Missing email fields", 404));
  }

  // get user
  const user = await User.findOne({ email: send_to });
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const send_from = process.env.EMAIL_USER_OUTLOOK;
  const name = user.firstName;
  const link = ` ${process.env.FRONTEND_URL}/${url}`;

  await sendMail(subject, send_to, send_from, reply_to, template, name, link);
  res.status(200).json({ message: "Email Sent" });
});
