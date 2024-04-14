const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

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

  res.status(200).json({
    data: users,
  });
});

//GET A USER
exports.getUser = catchAsync(async (req, res, next) => {
  const _id = req.params.userId;
  const data = await User.findById({ _id });
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
  const filename = req.file ? req.file.filename : null; // Handle optional file

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      middleName: req.body.middleName,
      email: req.body.email,
      photo: filename,
      address: req.body.address,
      role: req.body.role,
      bio: req.body.bio,
      position: req.body.position,
      phone: req.body.phone,
      yearOfCall: req.body.yearOfCall,
      otherPosition: req.body.otherPosition,
      practiceArea: req.body.practiceArea,
      universityAttended: req.body.universityAttended,
      lawSchoolAttended: req.body.lawSchoolAttended,
    },

    "email",
    "firstName",
    "lastName",
    "middleName",
    "photo",
    "address",
    "bio",
    "phone",
    "position",
    "yearOfCall",
    "otherPosition",
    "practiceArea",
    "universityAttended",
    "lawSchoolAttended"
  );

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
