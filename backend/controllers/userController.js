const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const filterObj = require("../utils/filterObj");
// const setRedisCache = require("../utils/setRedisCache");
const sendMail = require("../utils/email");

// GET ALL USERS
exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({});

  // set redis cache
  // setRedisCache("users", users, 100);

  res.status(200).json({
    results: users.length,
    fromCache: false,
    data: users,
  });
});

// GET A USER
exports.getUser = catchAsync(async (req, res, next) => {
  // const _id = req.params.userId; //he used req.user._id

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
    "secondName",
    "middleName",
    "photo",
    "address",
    "bio",
    "phone",
    "yearOfCall",
    "otherPosition",
    "practiceArea",
    "universityAttended",
    "lawSchoolAttended",
    "isActive"
  );

  // If there's a file, save its Cloudinary URL in the filtered body
  if (req.file) filteredBody.photo = req.file.cloudinaryUrl;

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    message: "success",
    data: {
      user: updatedUser,
    },
  });
});

// UPDATE USER PROFILE BY ADMIN
exports.upgradeUser = catchAsync(async (req, res, next) => {
  const { role, position, isActive } = req.body;
  const { id } = req.params; // Get the id from the URL parameters

  // get if user exist
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  // update user if user exist
  if (user.role !== "client") {
    user.role = role;
    user.position = position;
    user.isActive = isActive;
  } else {
    if (role || position) {
      return next(
        new AppError("Clients can only have their active status updated.", 404)
      );
    }
    user.isActive = isActive;
  }

  // save user to db
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
  const { send_to, reply_to, template, subject, url, context } = req.body;

  if (!send_to || !reply_to || !template || !subject) {
    return next(new AppError("Missing email fields", 404));
  }

  // get user
  const user = await User.findOne({ email: send_to });
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const send_from = process.env.SENDINBLUE_EMAIL;

  const baseContext = {
    ...context,
    name: user.firstName,
    link: ` ${process.env.FRONTEND_URL}/${url}`,
  };

  await sendMail(subject, send_to, send_from, reply_to, template, baseContext);
  res.status(200).json({ message: "Email Sent" });
});

// send automated custom/dynamic email handler
exports.sendAutomatedCustomEmail = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const { send_to, reply_to, template, subject, url, context } = req.body;

  if (!send_to || !reply_to || !template || !subject) {
    return next(new AppError("Missing email fields", 400));
  }

  // Convert send_to to an array if it's a multiple email
  const recipients = Array.isArray(send_to) ? send_to : [send_to];

  const devEmail = process.env.DEVELOPER_EMAIL;

  // Prepare the base context
  const baseContext = {
    ...context,
    link: `${process.env.FRONTEND_URL}/${url}`,
    year: new Date().getFullYear(),
    companyName: process.env.COMPANY_NAME || "A.T Lukman & Co",
  };

  // Function to send email to a single recipient
  const sendEmailToRecipient = async (recipientEmail) => {
    let user = null;
    let fullContext = { ...baseContext };

    if (recipientEmail === devEmail) {
      fullContext.name = "Developer";
    } else {
      user = await User.findOne({ email: recipientEmail });
      if (!user) {
        throw new AppError(`No user found with email: ${recipientEmail}`, 404);
      }
      fullContext.name = user.firstName;
    }

    const send_from = process.env.SENDINBLUE_EMAIL; // Send from the company email

    await sendMail(
      subject,
      recipientEmail,
      send_from,
      reply_to,
      template,
      fullContext
    );
  };

  try {
    // Send emails to all recipients in parallel
    await Promise.all(recipients.map(sendEmailToRecipient));
    res
      .status(200)
      .json({ message: `Email${recipients.length > 1 ? "s" : ""} Sent` });
  } catch (error) {
    return next(error);
  }
});
