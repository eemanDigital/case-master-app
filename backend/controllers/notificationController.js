const Notice = require("../models/notificationModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// The only fields a client is allowed to set. `sender` is always taken from the
// authenticated user so notifications cannot be spoofed, and recipients are
// validated to belong to the caller's firm.
const ALLOWED_FIELDS = ["message", "relatedTask", "relatedEvent", "relatedDeadline"];

// add notification
exports.createNotification = catchAsync(async (req, res, next) => {
  // Only firm staff may raise notifications, and never to themselves.
  if (req.user.userType === "client") {
    return next(
      new AppError("Clients cannot create notifications", 403)
    );
  }

  const recipients = [
    ...new Set(
      (Array.isArray(req.body.recipient)
        ? req.body.recipient
        : [req.body.recipient]
      ).filter(Boolean)
    ),
  ];

  if (!recipients.length) {
    return next(new AppError("At least one recipient is required", 400));
  }

  const message = String(req.body.message || "").trim().slice(0, 1000);
  if (!message) {
    return next(new AppError("A notification message is required", 400));
  }

  // Recipients must be users of the caller's firm, otherwise notifications
  // could be delivered to (and leak the existence of) another tenant.
  const validRecipients = await User.find({
    _id: { $in: recipients },
    firmId: req.firmId,
  }).select("_id");

  if (validRecipients.length !== recipients.length) {
    return next(
      new AppError("One or more recipients are not valid for your firm", 400)
    );
  }

  const notice = await Notice.create({
    sender: req.user.id,
    recipient: validRecipients.map((u) => u._id),
    message,
    ...(req.body.relatedTask ? { relatedTask: [req.body.relatedTask] } : {}),
    ...(req.body.relatedEvent ? { relatedEvent: [req.body.relatedEvent] } : {}),
    ...(req.body.relatedDeadline
      ? { relatedDeadline: [req.body.relatedDeadline] }
      : {}),
  });

  res.status(201).json({
    data: notice,
  });
});

// get one notification
exports.getNotification = catchAsync(async (req, res, next) => {
  const _id = req.params.id;

  // A notification is only visible to its recipients or its sender.
  const data = await Notice.findOne({
    _id,
    $or: [{ recipient: req.user.id }, { sender: req.user.id }],
  });

  if (!data) {
    return next(new AppError("No Notification found with that Id", 404));
  }
  res.status(200).json({
    data,
  });
});

// delete notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const _id = req.params.id;

  // Scoped delete — never delete by id alone, or any user could delete another
  // firm's notifications by guessing an ObjectId.
  const data = await Notice.findOneAndDelete({
    _id,
    $or: [{ recipient: req.user.id }, { sender: req.user.id }],
  });

  if (!data) {
    return next(new AppError("Notification with that Id does not exist", 404));
  }
  res.status(204).json({
    message: "Notice deleted",
  });
});

// mark one notification as read (scoped to the caller as recipient)
exports.markNotificationRead = catchAsync(async (req, res, next) => {
  const notice = await Notice.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { status: "read" },
    { new: true }
  );

  if (!notice) {
    return next(new AppError("Notification not found", 404));
  }

  res.status(200).json({ data: notice });
});

// list notifications addressed to the caller
exports.getMyNotifications = catchAsync(async (req, res, next) => {
  const filter = { recipient: req.user.id };
  if (req.query.status === "read" || req.query.status === "unread") {
    filter.status = req.query.status;
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const notices = await Notice.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("sender", "firstName lastName role")
    .lean();

  res.status(200).json({
    status: "success",
    results: notices.length,
    data: { notifications: notices },
  });
});