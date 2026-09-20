const AppError = require('../utils/appError');

const scopeToFirm = (req, res, next) => {
  if (!req.user || !req.user.firmId) {
    return next(new AppError('Authentication required', 401));
  }
  req.firmId = req.user.firmId;
  next();
};

// Any staff member may access the CAC Compliance module.
const canAccessCACModule = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.userType === 'staff') {
    return next();
  }

  return next(new AppError('You do not have access to the CAC Compliance module', 403));
};

module.exports = {
  scopeToFirm,
  canAccessCACModule
};