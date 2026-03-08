const AppError = require("../utils/appError");

const platformAdminGuard = (req, res, next) => {
  const secret = req.headers["x-platform-secret"];
  const email = req.headers["x-platform-admin-email"];

  if (!secret || !email) {
    return res.status(404).json({
      status: "error",
      message: "Not found",
    });
  }

  if (secret !== process.env.PLATFORM_ADMIN_SECRET) {
    return res.status(404).json({
      status: "error",
      message: "Not found",
    });
  }

  if (email !== process.env.PLATFORM_ADMIN_EMAIL) {
    return res.status(404).json({
      status: "error",
      message: "Not found",
    });
  }

  next();
};

module.exports = platformAdminGuard;
