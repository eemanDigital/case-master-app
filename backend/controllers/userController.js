const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");
const sharp = require("sharp");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req?.user?.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/images/users/${req.file?.filename}`);

  next();
});

// function to filter out some restricted fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//
// exports.createUser = async (req, res, next) => {
//   const user = await User.create(req.body);

//   res.status(201).json({
//     data: user,
//   });
// };

// GET ALL USERS
exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({});
  // console.log(users);

  res.status(200).json({
    results: users.length,
    data: users,
  });
});

//GET A USER
exports.getUser = catchAsync(async (req, res, next) => {
  // req.params.id = req.user.id; //just added this, delete if your code has error here
  const _id = req.params.userId;
  const data = await User.findById({ _id }).populate({
    path: "task",
    select: "-assignedTo",
  });

  // console.log(id);
  if (!data) {
    return next(new AppError("no user found with that Id", 404));
  }
  res.status(200).json({
    data,
  });
});

// UPDATE USER PROFILE
exports.updateUser = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // extracting file from the req
  // const filename = req.file ? req.file?.filename : null; // Handle optional file

  // 2) Filtered out unwanted fields names that are not allowed to be updated
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
  if (req.file) filteredBody.photo = req.file?.filename;
  // 3) Update user document
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

// update for admin
exports.updateUserByAdmin = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, "role", "position");
  const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.deleteUsers = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
