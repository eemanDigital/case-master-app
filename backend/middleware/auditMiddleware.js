const AuditLog = require("../models/auditLogModel");
const mongoose = require("mongoose");

const getActionFromMethod = (method) => {
  switch (method) {
    case "POST": return "CREATE";
    case "PUT":
    case "PATCH": return "UPDATE";
    case "DELETE": return "DELETE";
    case "GET": return "VIEW";
    default: return "VIEW";
  }
};

const getResourceFromPath = (path) => {
  const pathMap = {
    "/users": "USER",
    "/matters": "MATTER",
    "/tasks": "TASK",
    "/invoices": "INVOICE",
    "/payments": "PAYMENT",
    "/files": "DOCUMENT",
    "/calendar": "CALENDAR",
    "/events": "CALENDAR",
    "/notifications": "NOTIFICATION",
    "/contacts": "USER",
    "/notes": "NOTE",
    "/webhooks": "NOTIFICATION",
    "/audit-logs": "SETTINGS",
  };
  
  for (const [key, value] of Object.entries(pathMap)) {
    if (path.includes(key)) return value;
  }
  return "SYSTEM";
};

const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function (body) {
    const responseTime = Date.now() - startTime;
    
    try {
      const statusCode = res.statusCode;
      const isSuccess = statusCode >= 200 && statusCode < 400;
      const isError = statusCode >= 400;
      
      if (req.firmId && req.user && req.user.id) {
        const resource = getResourceFromPath(req.originalUrl);
        const action = getActionFromMethod(req.method);
        
        const resourceId = req.params.id || 
                          req.body?._id || 
                          (body && typeof body === 'string' ? JSON.parse(body)?._id : null);
        
        const validResourceId = resourceId && mongoose.Types.ObjectId.isValid(resourceId) ? resourceId : null;
        
        const logData = {
          firmId: req.firmId,
          userId: req.user.id,
          action: action,
          resource: resource,
          resourceId: validResourceId,
          description: `${req.method} ${req.originalUrl} - ${statusCode} (${responseTime}ms)`,
          ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
          userAgent: req.get("user-agent"),
          status: isSuccess ? "SUCCESS" : isError ? "FAILED" : "SUCCESS",
          errorMessage: isError ? (body?.message || `HTTP ${statusCode}`) : undefined,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            query: req.query,
            statusCode,
            responseTime,
          },
        };
        
        AuditLog.log(logData).catch(err => console.error("Audit log error:", err));
      }
    } catch (error) {
      console.error("Audit middleware error:", error);
    }

    return originalSend.call(this, body);
  };

  next();
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
