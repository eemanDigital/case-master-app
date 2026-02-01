const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2; // Import Cloudinary package
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");

dotenv.config({ path: "./config.env" });

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

// multer method to upload file
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

// resize photo handler
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(); // If no file is uploaded, proceed to the next middleware
  }

  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const uploadResult = await handleUpload(dataURI);
  req.file.cloudinaryUrl = uploadResult.secure_url;
  next();
});
