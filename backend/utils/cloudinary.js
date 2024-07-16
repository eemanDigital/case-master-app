const cloudinary = require("cloudinary"); // Import Cloudinary package
const catchAsync = require("./catchAsync");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

exports.uploadImageToCloudinary = catchAsync(async (buffer) => {
  // Convert Buffer to base64
  const base64String = buffer.toString("base64");

  // Prepare data URI
  const dataUri = `data:image/jpeg;base64,${base64String}`;

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: "image",
  });

  return result;
});
