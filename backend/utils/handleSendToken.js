const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config({ path: "./config.env" });

const signToken = (id, secret, expiresIn) => {
  return jwt.sign({ id }, secret, { expiresIn });
};

const createSendToken = (user, statusCode, res) => {
  try {
    const accessToken = signToken(
      user._id,
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRES_IN
    );
    const refreshToken = signToken(
      user._id,
      process.env.REFRESH_TOKEN_SECRET,
      process.env.REFRESH_TOKEN_EXPIRES_IN
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    };

    res.cookie("jwt", accessToken, {
      ...cookieOptions,
      expires: new Date(
        Date.now() + parseInt(process.env.JWT_EXPIRES_IN) * 1000
      ),
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      expires: new Date(
        Date.now() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) * 1000
      ),
      path: "/api/refresh", // restrict the cookie to your refresh token endpoint
    });

    user.password = undefined;

    res.status(statusCode).json({
      status: "success",
      accessToken, // Send the access token in the response body
      // refreshToken,
      data: { user },
    });
  } catch (error) {
    console.error("Error in createSendToken:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while creating authentication tokens",
    });
  }
};

module.exports = createSendToken;
