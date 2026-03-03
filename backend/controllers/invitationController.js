// controllers/invitationController.js
const Invitation = require("../models/invitationModel");
const User = require("../models/userModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.generateInvitation = catchAsync(async (req, res, next) => {
  const { email, firstName, lastName, role, plan, maxUsers, message, expiresInDays } = req.body;

  const existingInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    firmId: req.firmId,
    status: "pending",
    expiresAt: { $gt: new Date() },
    isDeleted: { $ne: true },
  });

  if (existingInvitation) {
    return next(new AppError("An invitation has already been sent to this email", 400));
  }

  const token = Invitation.generateToken();
  const planLimits = Invitation.applyPlanLimits(plan || "FREE");

  const invitation = await Invitation.create({
    firmId: req.firmId,
    email: email.toLowerCase(),
    firstName,
    lastName,
    role: role || "staff",
    invitedBy: req.user.id,
    token,
    plan: plan || "FREE",
    maxUsers: maxUsers || planLimits.maxUsers,
    expiresAt: new Date(Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000),
    message,
  });

  const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?token=${token}`;

  res.status(201).json({
    status: "success",
    data: {
      invitation: {
        id: invitation._id,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        plan: invitation.plan,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      },
      inviteUrl,
    },
  });
});

exports.getInvitations = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, search } = req.query;

  const filter = {
    firmId: req.firmId,
    isDeleted: { $ne: true },
  };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [invitations, total] = await Promise.all([
    Invitation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("invitedBy", "firstName lastName email")
      .lean(),
    Invitation.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: invitations.length,
    data: invitations,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
});

exports.getPendingInvitations = catchAsync(async (req, res, next) => {
  const invitations = await Invitation.find({
    firmId: req.firmId,
    status: "pending",
    expiresAt: { $gt: new Date() },
    isDeleted: { $ne: true },
  })
    .sort({ expiresAt: 1 })
    .lean();

  res.status(200).json({
    status: "success",
    results: invitations.length,
    data: invitations,
  });
});

exports.getInvitation = catchAsync(async (req, res, next) => {
  const invitation = await Invitation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  })
    .populate("invitedBy", "firstName lastName email")
    .populate("invitedUser", "firstName lastName email");

  if (!invitation) {
    return next(new AppError("Invitation not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: invitation,
  });
});

exports.cancelInvitation = catchAsync(async (req, res, next) => {
  const invitation = await Invitation.findOneAndUpdate(
    {
      _id: req.params.id,
      firmId: req.firmId,
      status: "pending",
    },
    { status: "cancelled" },
    { new: true }
  );

  if (!invitation) {
    return next(new AppError("Invitation not found or already processed", 404));
  }

  res.status(200).json({
    status: "success",
    data: invitation,
  });
});

exports.deleteInvitation = catchAsync(async (req, res, next) => {
  const invitation = await Invitation.findOneAndUpdate(
    {
      _id: req.params.id,
      firmId: req.firmId,
    },
    { isDeleted: true },
    { new: true }
  );

  if (!invitation) {
    return next(new AppError("Invitation not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.resendInvitation = catchAsync(async (req, res, next) => {
  const invitation = await Invitation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    status: "pending",
  });

  if (!invitation) {
    return next(new AppError("Invitation not found or already processed", 404));
  }

  const { expiresInDays } = req.body;
  invitation.expiresAt = new Date(Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000);
  await invitation.save();

  const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?token=${invitation.token}`;

  res.status(200).json({
    status: "success",
    data: {
      invitation,
      inviteUrl,
    },
  });
});

exports.validateInvitation = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const invitation = await Invitation.validateToken(token);

  if (!invitation) {
    return next(new AppError("Invalid or expired invitation", 400));
  }

  res.status(200).json({
    status: "success",
    data: {
      valid: true,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      plan: invitation.plan,
      maxUsers: invitation.maxUsers,
      firmId: invitation.firmId,
    },
  });
});

exports.acceptInvitation = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm, firstName, lastName, phone, address } = req.body;

  const invitation = await Invitation.validateToken(token);

  if (!invitation) {
    return next(new AppError("Invalid or expired invitation", 400));
  }

  if (invitation.firmId.toString() !== req.body.firmId) {
    return next(new AppError("Invitation does not match this firm", 400));
  }

  const user = await User.create({
    firmId: invitation.firmId,
    firstName: firstName || invitation.firstName,
    lastName: lastName || invitation.lastName,
    email: invitation.email,
    phone: phone || "+234",
    address: address || "",
    password,
    passwordConfirm,
    role: invitation.role,
    userType: invitation.role === "client" ? "client" : "staff",
    isVerified: true,
  });

  invitation.status = "accepted";
  invitation.acceptedAt = new Date();
  invitation.invitedUser = user._id;
  await invitation.save();

  const firm = await Firm.findById(invitation.firmId);
  if (firm) {
    firm.subscription.plan = invitation.plan;
    firm.usage.currentUserCount = (firm.usage.currentUserCount || 0) + 1;
    if (invitation.maxUsers) {
      firm.subscription.maxUsers = invitation.maxUsers;
    }
    await firm.save();
  }

  res.status(200).json({
    status: "success",
    message: "Invitation accepted successfully",
  });
});
