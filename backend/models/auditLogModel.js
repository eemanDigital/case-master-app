const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
    index: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  action: {
    type: String,
    required: true,
    enum: [
      "CREATE",
      "UPDATE",
      "DELETE",
      "VIEW",
      "LOGIN",
      "LOGOUT",
      "EXPORT",
      "IMPORT",
      "APPROVE",
      "REJECT",
      "PAYMENT",
      "STATUS_CHANGE",
    ],
    index: true,
  },

  resource: {
    type: String,
    required: true,
    enum: [
      "USER",
      "MATTER",
      "TASK",
      "INVOICE",
      "PAYMENT",
      "DOCUMENT",
      "CALENDAR",
      "NOTIFICATION",
      "FIRM",
      "SETTINGS",
      "REPORT",
      "NOTE",
      "INVITATION",
      "SYSTEM",
    ],
    index: true,
  },

  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null,
  },

  description: {
    type: String,
    required: true,
  },

  changes: {
    type: Map,
    of: {
      old: mongoose.Schema.Types.Mixed,
      new: mongoose.Schema.Types.Mixed,
    },
  },

  ipAddress: {
    type: String,
  },

  userAgent: {
    type: String,
  },

  location: {
    country: String,
    city: String,
    region: String,
  },

  status: {
    type: String,
    enum: ["SUCCESS", "FAILED", "PENDING"],
    default: "SUCCESS",
  },

  errorMessage: {
    type: String,
  },

  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

auditLogSchema.index({ firmId: 1, createdAt: -1 });
auditLogSchema.index({ firmId: 1, userId: 1, createdAt: -1 });
auditLogSchema.index({ firmId: 1, resource: 1, createdAt: -1 });
auditLogSchema.index({ firmId: 1, action: 1, createdAt: -1 });

auditLogSchema.statics.log = async function (data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

auditLogSchema.statics.getFirmAuditLogs = async function (firmId, options = {}) {
  const {
    page = 1,
    limit = 50,
    userId,
    action,
    resource,
    startDate,
    endDate,
    status,
  } = options;

  const filter = { firmId };

  if (userId) filter.userId = userId;
  if (action) filter.action = action;
  if (resource) filter.resource = resource;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "firstName lastName email role")
      .lean(),
    this.countDocuments(filter),
  ]);

  return {
    data: logs,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  };
};

auditLogSchema.statics.getResourceHistory = async function (resource, resourceId, firmId) {
  return this.find({
    firmId,
    resource,
    resourceId,
  })
    .sort({ createdAt: -1 })
    .populate("userId", "firstName lastName email role")
    .lean();
};

auditLogSchema.statics.getUserActivity = async function (userId, firmId, options = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  return this.find({ userId, firmId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
};

auditLogSchema.statics.getSecurityEvents = async function (firmId, options = {}) {
  const { page = 1, limit = 50, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const filter = {
    firmId,
    action: { $in: ["LOGIN", "LOGOUT", "CREATE", "DELETE", "UPDATE"] },
    status: "FAILED",
  };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [events, total] = await Promise.all([
    this.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "firstName lastName email role")
      .lean(),
    this.countDocuments(filter),
  ]);

  return {
    data: events,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  };
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
