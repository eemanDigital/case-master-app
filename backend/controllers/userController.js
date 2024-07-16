const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2; // Import Cloudinary package
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");
const sharp = require("sharp");
// const { uploadImageToCloudinary } = require("../utils/cloudinary");

dotenv.config({ path: "./config.env" });

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// const uploadImageToCloudinary = catchAsync(async (buffer) => {
//   // Convert Buffer to base64
//   const base64String = buffer.toString("base64");

//   // Prepare data URI
//   const dataUri = `data:image/jpeg;base64,${base64String}`;

//   // Upload to Cloudinary
//   const result = await cloudinary.uploader.upload(dataUri, {
//     resource_type: "image",
//   });
//   // console.log("RE", result);
//   return result;
// });

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

// resize image
// exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
//   if (!req.file) return next();

//   const buffer = await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat("jpeg")
//     .jpeg({ quality: 90 })
//     .toBuffer();

//   // Upload the processed image buffer to Cloudinary
//   const uploadResult = uploadImageToCloudinary(buffer);
//   const secureUrl = uploadResult.secure_url;
//   console.log(secureUrl, "Secure URL");
//   console.log(uploadResult, "UP");
//   // Save the Cloudinary URL to the request file object
//   req.file.cloudinaryUrl = uploadResult.secure_url;

//   next();
// });

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const uploadResult = await handleUpload(dataURI);
  req.file.cloudinaryUrl = uploadResult.secure_url;
  next();
});

// Function to filter out restricted fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// GET ALL USERS
exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    results: users.length,
    data: users,
  });
});

// GET A USER
exports.getUser = catchAsync(async (req, res, next) => {
  const _id = req.params.userId;
  const data = await User.findById({ _id }).populate({
    path: "task",
    select: "-assignedTo",
  });

  if (!data) {
    return next(new AppError("No user found with that Id", 404));
  }
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

// DELETE USER
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
