const express = require("express");
const AuditLog = require("../models/auditLogModel");
const { protect, restrictTo } = require("../controllers/authController");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

const router = express.Router();

router.use(protect);

router.get("/", restrictTo("admin", "lawyer"), catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const {
    page = 1,
    limit = 20,
    action,
    resource,
    userId,
    status,
    startDate,
    endDate,
  } = req.query;

  const filter = { firmId };

  if (action) filter.action = action;
  if (resource) filter.resource = resource;
  if (userId) filter.userId = userId;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "firstName lastName email role")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
}));

router.get("/stats", restrictTo("admin", "lawyer"), catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totalActions, todayCount, weekCount, failedCount] = await Promise.all([
    AuditLog.countDocuments({ firmId }),
    AuditLog.countDocuments({ firmId, createdAt: { $gte: today } }),
    AuditLog.countDocuments({ firmId, createdAt: { $gte: weekAgo } }),
    AuditLog.countDocuments({ firmId, status: "FAILED" }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalActions,
      todayCount,
      weekCount,
      failedCount,
    },
  });
}));

router.get("/user/:userId", restrictTo("admin", "lawyer"), catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find({ firmId, userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AuditLog.countDocuments({ firmId, userId }),
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
}));

router.get("/resource/:resourceType/:resourceId", restrictTo("admin", "lawyer"), catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { resourceType, resourceId } = req.params;

  const logs = await AuditLog.find({
    firmId,
    resource: resourceType.toUpperCase(),
    resourceId: new mongoose.Types.ObjectId(resourceId),
  })
    .sort({ createdAt: -1 })
    .populate("userId", "firstName lastName email role")
    .lean();

  res.status(200).json({
    success: true,
    data: logs,
  });
}));

module.exports = router;
