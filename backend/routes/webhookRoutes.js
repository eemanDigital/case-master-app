const express = require("express");
const { Webhook, WebhookDelivery } = require("../models/webhookModel");
const { protect, restrictTo } = require("../controllers/authController");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const crypto = require("crypto");

const router = express.Router();

router.use(protect);

router.get("/", catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [webhooks, total] = await Promise.all([
    Webhook.find({ firmId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Webhook.countDocuments({ firmId, isDeleted: { $ne: true } }),
  ]);

  res.status(200).json({
    success: true,
    data: webhooks,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
}));

router.post("/", restrictTo("admin"), catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { name, url, events, headers } = req.body;

  if (!name || !url || !events || !events.length) {
    return next(new AppError("Name, URL, and at least one event are required", 400));
  }

  const secret = crypto.randomBytes(32).toString("hex");

  const webhook = await Webhook.create({
    firmId,
    name,
    url,
    events,
    headers,
    secret,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: webhook,
  });
}));

router.get("/:id", catchAsync(async (req, res, next) => {
  const webhook = await Webhook.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!webhook) {
    return next(new AppError("Webhook not found", 404));
  }

  res.status(200).json({
    success: true,
    data: webhook,
  });
}));

router.patch("/:id", restrictTo("admin"), catchAsync(async (req, res, next) => {
  const { name, url, events, headers, isActive, retryPolicy } = req.body;

  const webhook = await Webhook.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!webhook) {
    return next(new AppError("Webhook not found", 404));
  }

  if (name) webhook.name = name;
  if (url) webhook.url = url;
  if (events) webhook.events = events;
  if (headers) webhook.headers = headers;
  if (typeof isActive === "boolean") webhook.isActive = isActive;
  if (retryPolicy) webhook.retryPolicy = retryPolicy;

  await webhook.save();

  res.status(200).json({
    success: true,
    data: webhook,
  });
}));

router.delete("/:id", restrictTo("admin"), catchAsync(async (req, res, next) => {
  const webhook = await Webhook.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!webhook) {
    return next(new AppError("Webhook not found", 404));
  }

  webhook.isDeleted = true;
  webhook.isActive = false;
  await webhook.save();

  res.status(200).json({
    success: true,
    message: "Webhook deleted successfully",
  });
}));

router.get("/:id/deliveries", catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const webhook = await Webhook.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!webhook) {
    return next(new AppError("Webhook not found", 404));
  }

  const [deliveries, total] = await Promise.all([
    WebhookDelivery.find({ webhookId: webhook._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    WebhookDelivery.countDocuments({ webhookId: webhook._id }),
  ]);

  res.status(200).json({
    success: true,
    data: deliveries,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
}));

router.post("/:id/test", catchAsync(async (req, res, next) => {
  const webhook = await Webhook.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!webhook) {
    return next(new AppError("Webhook not found", 404));
  }

  const testPayload = {
    event: "test",
    timestamp: new Date().toISOString(),
    firm: {
      id: req.firmId,
      name: req.user.firm?.name,
    },
    user: {
      id: req.user.id,
      email: req.user.email,
    },
    message: "This is a test webhook delivery",
  };

  const result = await webhook.trigger("test", testPayload);

  res.status(200).json({
    success: result.success,
    message: result.success ? "Test webhook delivered successfully" : "Test webhook failed",
    delivery: {
      id: result.delivery._id,
      status: result.delivery.status,
      responseStatus: result.delivery.responseStatus,
      errorMessage: result.delivery.errorMessage,
    },
  });
}));

router.get("/:id/regenerate-secret", restrictTo("admin"), catchAsync(async (req, res, next) => {
  const webhook = await Webhook.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!webhook) {
    return next(new AppError("Webhook not found", 404));
  }

  webhook.secret = crypto.randomBytes(32).toString("hex");
  await webhook.save();

  res.status(200).json({
    success: true,
    data: {
      secret: webhook.secret,
    },
  });
}));

module.exports = router;
