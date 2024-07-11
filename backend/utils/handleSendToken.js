const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config({ path: "./config.env" });

// Function to generate a JWT token with the user's ID embedded
const signToken = (id) => {
  // Sign the JWT token with the user's ID and the JWT secret key
  // Set expiration time
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Function to create and send JWT token to the client upon successful login/signup
const createSendToken = (user, statusCode, res) => {
  // Generate JWT token using user's ID
  const token = signToken(user._id);

  // Configure options for the JWT token cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: false, // Cookie accessible only via HTTP(S) and not by JavaScript
  };

  // Set 'secure' option for cookie if in production environment (HTTPS)
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  // Set the JWT token as a cookie in the response
  res.cookie("jwt", token, cookieOptions);

  // Remove the 'password' field from the user object before sending the response
  // to ensure it is not exposed in the client's browser
  user.password = undefined;

  // Send response with status code, JWT token, and user data
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
// console.log("JWT S", process.env.JWT_SECRET);

module.exports = createSendToken;
