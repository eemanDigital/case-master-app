const AuditLog = require("../models/auditLogModel");

const auditMiddleware = (options = {}) => {
  const { resource, action } = options;

  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = async function (body) {
      try {
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 300;

        if (isSuccess && req.firmId && req.user) {
          const resourceId = req.params.id || req.body._id;

          if (resourceId) {
            await AuditLog.log({
              firmId: req.firmId,
              userId: req.user.id,
              action: action || (req.method === "POST" ? "CREATE" : req.method === "DELETE" ? "DELETE" : "UPDATE"),
              resource: resource,
              resourceId,
              description: `${req.method} ${req.originalUrl}`,
              ipAddress: req.ip || req.connection?.remoteAddress,
              userAgent: req.get("user-agent"),
              status: isSuccess ? "SUCCESS" : "FAILED",
              metadata: {
                method: req.method,
                statusCode,
                body: req.body ? { ...req.body, password: undefined, secret: undefined } : undefined,
              },
            });
          }
        }
      } catch (error) {
        console.error("Audit middleware error:", error);
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

const logAudit = async (data) => {
  try {
    return await AuditLog.log(data);
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

const auditActions = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  VIEW: "VIEW",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  PAYMENT: "PAYMENT",
  STATUS_CHANGE: "STATUS_CHANGE",
};

const auditResources = {
  USER: "USER",
  MATTER: "MATTER",
  TASK: "TASK",
  INVOICE: "INVOICE",
  PAYMENT: "PAYMENT",
  DOCUMENT: "DOCUMENT",
  CALENDAR: "CALENDAR",
  NOTIFICATION: "NOTIFICATION",
  FIRM: "FIRM",
  SETTINGS: "SETTINGS",
  REPORT: "REPORT",
  NOTE: "NOTE",
};

module.exports = { auditMiddleware, logAudit, auditActions, auditResources };
