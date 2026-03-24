const AppError = require('../utils/appError');

const scopeToFirm = (req, res, next) => {
  if (!req.user || !req.user.firmId) {
    return next(new AppError('Authentication required', 401));
  }
  req.firmId = req.user.firmId;
  next();
};

const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userRole = req.user.role;
    const userType = req.user.userType;

    const firmAdminRoles = ['admin', 'super-admin', 'firm_admin'];
    const seniorRoles = ['lawyer', 'senior_associate', 'admin', 'super-admin'];
    const associateRoles = ['lawyer', 'senior_associate', 'associate', 'admin', 'super-admin'];
    const paralegalRoles = ['lawyer', 'senior_associate', 'associate', 'paralegal', 'admin', 'super-admin'];

    if (allowedRoles.includes('firm_admin') && firmAdminRoles.includes(userRole)) {
      return next();
    }
    if (allowedRoles.includes('senior_associate') && seniorRoles.includes(userRole)) {
      return next();
    }
    if (allowedRoles.includes('associate') && associateRoles.includes(userRole)) {
      return next();
    }
    if (allowedRoles.includes('paralegal') && paralegalRoles.includes(userRole)) {
      return next();
    }
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return next(new AppError('You do not have permission to perform this action', 403));
  };
};

const cacComplianceRoles = {
  view: ['firm_admin', 'senior_associate', 'associate', 'paralegal', 'lawyer', 'admin', 'super-admin'],
  create: ['firm_admin', 'senior_associate', 'associate', 'paralegal', 'lawyer', 'admin', 'super-admin'],
  edit: ['firm_admin', 'senior_associate', 'associate', 'lawyer', 'admin', 'super-admin'],
  admin: ['firm_admin', 'admin', 'super-admin']
};

const canAccessCACModule = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  
  const userRole = req.user.role;
  const userType = req.user.userType;
  
  const allowedRoles = [
    'admin', 'super-admin', 'lawyer', 'senior_associate', 'associate', 
    'paralegal', 'firm_admin'
  ];
  
  if (allowedRoles.includes(userRole) || userType === 'staff' || userType === 'lawyer') {
    return next();
  }
  
  return next(new AppError('You do not have access to the CAC Compliance module', 403));
};

module.exports = {
  scopeToFirm,
  restrictTo,
  cacComplianceRoles,
  canAccessCACModule
};
