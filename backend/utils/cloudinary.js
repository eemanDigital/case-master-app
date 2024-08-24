const cloudinary = require("cloudinary").v2;
const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET } = process.env;

// cloudinary configuration
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_SECRET,
});

module.exports = cloudinary;
