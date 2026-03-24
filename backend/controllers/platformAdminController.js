const crypto = require("crypto");
const Firm = require("../models/firmModel");
const User = require("../models/userModel");
const PlatformInvite = require("../models/platformInviteModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendCustomEmail, sendMail } = require("../utils/email");

const PLAN_LIMITS = {
  FREE: { users: 3, storageGB: 5, casesPerMonth: 10 },
  BASIC: { users: 10, storageGB: 20, casesPerMonth: 50 },
  PRO: { users: 25, storageGB: 100, casesPerMonth: 500 },
  ENTERPRISE: { users: 999999, storageGB: 999999, casesPerMonth: 999999 },
};

const PLAN_ORDER = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

exports.getAllFirms = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    plan,
    status,
    search,
  } = req.query;

  const query = {};

  if (plan) {
    query["subscription.plan"] = plan;
  }

  if (status) {
    query["subscription.status"] = status;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [firms, total] = await Promise.all([
    Firm.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-encryptedTaxId"),
    Firm.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: firms.length,
    total,
    data: firms,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
      totalRecords: total,
    },
  });
});

exports.getFirmById = catchAsync(async (req, res, next) => {
  const firm = await Firm.findById(req.params.firmId).select("-encryptedTaxId");

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  const superAdmin = await User.findOne({
    firmId: firm._id,
    userType: "super-admin",
  }).select("firstName lastName email status isActive");

  res.status(200).json({
    status: "success",
    data: {
      ...firm.toObject(),
      superAdmin,
    },
  });
});

exports.createFirm = catchAsync(async (req, res, next) => {
  const {
    firmName,
    email,
    firstName,
    lastName,
    plan = "FREE",
    phone,
    address,
    gender,
  } = req.body;

  if (!firmName || !email || !firstName || !lastName) {
    return next(new AppError("Please provide firmName, email, firstName, and lastName", 400));
  }

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

  // Generate a valid temp password that meets validation requirements
  const generateValidPassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const special = "!@#$%&*";
    const allChars = upper + lower + numbers + special;

    const getRandom = (str) => str[Math.floor(crypto.randomBytes(2).readUInt16LE() % str.length)];
    const base = getRandom(upper) + getRandom(lower) + getRandom(numbers) + getRandom(special);
    const extra = Array.from({ length: 4 }, () => getRandom(allChars)).join("");

    return (base + extra).split("").sort(() => crypto.randomBytes(1)[0] % 3 - 1).join("");
  };

  const tempPassword = generateValidPassword();

  const firm = await Firm.create({
    name: firmName,
    contact: {
      email,
      phone,
      address: {
        street: address,
      },
    },
    subscription: {
      plan,
      status: "ACTIVE",
    },
    limits,
    usage: {
      currentUserCount: 1,
      storageUsedGB: 0,
      casesThisMonth: 0,
      lastResetAt: new Date(),
    },
  });

  const user = await User.create({
    firmId: firm._id,
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: tempPassword,
    passwordConfirm: tempPassword,
    userType: "super-admin",
    role: "super-admin",
    position: "Managing Partner",
    address: address || "Platform created account",
    phone: phone || "+234",
    gender: gender || "male",
    isVerified: false,
    isActive: true,
    status: "active",
    userAgent: ["platform-created"],
    adminDetails: {
      adminLevel: "firm",
      canManageUsers: true,
      canManageCases: true,
      canManageBilling: true,
      canViewReports: true,
      systemAccessLevel: "full",
    },
  });

  try {
    // Generate a verification token for the user
    const verifyToken = crypto.randomBytes(32).toString("hex");
    user.verifyToken = verifyToken;
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "https://case-master-app.vercel.app";
    const verifyLink = `${frontendUrl}/dashboard/verify-account/${verifyToken}`;

    await sendMail(
      "Welcome to LawMaster - Verify Your Account",
      email,
      process.env.SENDINBLUE_EMAIL || "noreply@lawmaster.ng",
      "noreply@lawmaster.ng",
      "verifyEmail",
      {
        name: firstName,
        companyName: firmName,
        password: tempPassword,
        link: verifyLink,
        toEmail: email,
      }
    );
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError);
  }

  res.status(201).json({
    status: "success",
    data: {
      firm,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        userType: user.userType,
      },
      tempPassword,
    },
  });
});

exports.approveFirm = catchAsync(async (req, res, next) => {
  const firm = await Firm.findById(req.params.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  if (firm.subscription.status !== "PENDING_APPROVAL") {
    return next(new AppError("Firm is not pending approval", 400));
  }

  firm.subscription.status = "ACTIVE";
  firm.isActive = true;
  await firm.save();

  // Activate ALL users in the firm, not just super-admin
  await User.updateMany(
    { firmId: firm._id },
    { isActive: true, status: "active" }
  );

  const superAdmin = await User.findOne({
    firmId: firm._id,
    userType: "super-admin",
  });

  if (superAdmin) {
    try {
      await sendCustomEmail(
        "Your LawMaster Account Has Been Approved",
        superAdmin.email,
        process.env.SENDINBLUE_EMAIL || "noreply@lawmaster.ng",
        "noreply@lawmaster.ng",
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Account Approved!</h2>
          <p>Dear ${superAdmin.firstName},</p>
          <p>Your firm <strong>${firm.name}</strong> has been approved and is now active.</p>
          <p>You can now log in to your account:</p>
          <ul>
            <li><strong>Login URL:</strong> ${process.env.FRONTEND_URL}/login</li>
            <li><strong>Email:</strong> ${superAdmin.email}</li>
          </ul>
          <p>If you have any questions, contact support at support@lawmaster.ng</p>
          <p style="margin-top: 30px;">Best regards,<br/>The LawMaster Team</p>
        </div>
        `
      );
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }
  }

  res.status(200).json({
    status: "success",
    data: firm,
  });
});

exports.rejectFirm = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new AppError("Rejection reason is required", 400));
  }

  const firm = await Firm.findById(req.params.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  firm.subscription.status = "REJECTED";
  await firm.save();

  try {
    await sendCustomEmail(
      "Your LawMaster Application Was Not Approved",
      firm.contact.email,
      process.env.SENDINBLUE_EMAIL || "noreply@lawmaster.ng",
      "noreply@lawmaster.ng",
      `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Application Not Approved</h2>
        <p>Dear ${firm.name},</p>
        <p>Thank you for your interest in LawMaster.</p>
        <p>Unfortunately, your application could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>If you believe this is an error or would like to discuss further, please contact support.</p>
        <p style="margin-top: 30px;">Best regards,<br/>The LawMaster Team</p>
      </div>
      `
    );
  } catch (emailError) {
    console.error("Failed to send rejection email:", emailError);
  }

  res.status(200).json({
    status: "success",
    data: firm,
  });
});

exports.suspendFirm = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const firm = await Firm.findById(req.params.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  firm.subscription.status = "SUSPENDED";
  firm.isActive = false;
  await firm.save();

  await User.updateMany(
    { firmId: firm._id },
    { isActive: false }
  );

  res.status(200).json({
    status: "success",
    data: firm,
  });
});

exports.reactivateFirm = catchAsync(async (req, res, next) => {
  const firm = await Firm.findById(req.params.firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  firm.subscription.status = "ACTIVE";
  firm.isActive = true;
  await firm.save();

  // Reactivate ALL users in the firm
  const result = await User.updateMany(
    { firmId: firm._id },
    { isActive: true, status: "active" }
  );

  console.log(`Reactivated ${result.modifiedCount} users for firm ${firm.name}`);

  res.status(200).json({
    status: "success",
    data: firm,
  });
});

exports.sendUpgradeInvitation = catchAsync(async (req, res, next) => {
  const { firmId } = req.params;
  const {
    targetPlan,
    messageToFirm,
    internalNotes,
    expiresInDays = 14,
  } = req.body;

  const firm = await Firm.findById(firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  const currentPlanIndex = PLAN_ORDER.indexOf(firm.subscription.plan);
  const targetPlanIndex = PLAN_ORDER.indexOf(targetPlan);

  if (targetPlanIndex <= currentPlanIndex) {
    return next(new AppError("Target plan must be higher than the firm's current plan", 400));
  }

  await PlatformInvite.updateMany(
    { firmId, status: "pending" },
    { status: "cancelled" }
  );

  const token = PlatformInvite.generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

  const invite = await PlatformInvite.create({
    firmId: firm._id,
    email: firm.contact.email,
    targetPlan,
    token,
    status: "pending",
    messageToFirm,
    internalNotes,
    expiresAt,
    sentBy: "Platform Admin",
  });

  const upgradeUrl = `${process.env.FRONTEND_URL || 'https://case-master-app.vercel.app'}/upgrade?token=${token}`;

  try {
    await sendCustomEmail(
      `Upgrade to ${targetPlan} Plan - LawMaster`,
      firm.contact.email,
      process.env.SENDINBLUE_EMAIL || "noreply@lawmaster.ng",
      "noreply@lawmaster.ng",
      `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Upgrade Your LawMaster Plan</h2>
        <p>Dear ${firm.name},</p>
        <p>We're excited to offer you an upgrade to our <strong>${targetPlan}</strong> plan!</p>
        ${messageToFirm ? `<p>${messageToFirm}</p>` : ""}
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Upgrade URL:</strong> <a href="${upgradeUrl}">${upgradeUrl}</a></p>
          <p><strong>Expires:</strong> ${expiresAt.toLocaleDateString()}</p>
        </div>
        <p>This upgrade includes a 14-day free trial. After the trial, you can confirm payment to continue with the full plan.</p>
        <p style="margin-top: 30px;">Best regards,<br/>The LawMaster Team</p>
      </div>
      `
    );
  } catch (emailError) {
    console.error("Failed to send upgrade email:", emailError);
  }

  res.status(201).json({
    status: "success",
    data: {
      invite,
      upgradeUrl,
    },
  });
});

exports.acceptUpgradeInvitation = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  // Debug: Check what invites exist with this token
  const anyInvite = await PlatformInvite.findOne({ token });
  if (!anyInvite) {
    console.log("No invite found with token:", token);
    return next(new AppError("Invalid invitation token - not found", 400));
  }

  console.log("Found invite:", {
    status: anyInvite.status,
    expiresAt: anyInvite.expiresAt,
    isExpired: anyInvite.expiresAt < new Date(),
    isDeleted: anyInvite.isDeleted
  });

  if (anyInvite.status !== "pending") {
    return next(new AppError("This invitation has already been used or cancelled", 400));
  }

  if (anyInvite.expiresAt < new Date()) {
    return next(new AppError("This invitation has expired", 400));
  }

  if (anyInvite.isDeleted) {
    return next(new AppError("This invitation has been deleted", 400));
  }

  const firm = await Firm.findById(anyInvite.firmId);
  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  const limits = PLAN_LIMITS[anyInvite.targetPlan];
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  firm.subscription.plan = anyInvite.targetPlan;
  firm.subscription.status = "TRIAL";
  firm.subscription.trialEndsAt = trialEndsAt;
  firm.limits = limits;
  await firm.save();

  anyInvite.status = "accepted";
  anyInvite.acceptedAt = new Date();
  await anyInvite.save();

  res.status(200).json({
    status: "success",
    message: `Successfully started trial for ${anyInvite.targetPlan} plan. Your trial ends on ${trialEndsAt.toLocaleDateString()}.`,
  });
});

exports.confirmPayment = catchAsync(async (req, res, next) => {
  const { firmId } = req.params;

  const firm = await Firm.findById(firmId);

  if (!firm) {
    return next(new AppError("Firm not found", 404));
  }

  if (firm.subscription.status !== "TRIAL") {
    return next(new AppError("Firm is not on a trial", 400));
  }

  firm.subscription.status = "ACTIVE";
  firm.subscription.trialEndsAt = null;
  await firm.save();

  res.status(200).json({
    status: "success",
    message: "Payment confirmed. Firm is now on the full paid plan.",
    data: firm,
  });
});

exports.cancelUpgradeInvitation = catchAsync(async (req, res, next) => {
  const invite = await PlatformInvite.findById(req.params.inviteId);

  if (!invite) {
    return next(new AppError("Invitation not found", 404));
  }

  invite.status = "cancelled";
  await invite.save();

  res.status(200).json({
    status: "success",
    data: invite,
  });
});

exports.getPlatformStats = catchAsync(async (req, res) => {
  const [
    totalFirms,
    planCounts,
    statusCounts,
    totalUsers,
    newFirmsThisMonth,
  ] = await Promise.all([
    Firm.countDocuments(),
    Firm.aggregate([
      { $group: { _id: "$subscription.plan", count: { $sum: 1 } } },
    ]),
    Firm.aggregate([
      { $group: { _id: "$subscription.status", count: { $sum: 1 } } },
    ]),
    User.countDocuments({ isDeleted: { $ne: true } }),
    Firm.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
  ]);

  const planBreakdown = {
    FREE: 0,
    BASIC: 0,
    PRO: 0,
    ENTERPRISE: 0,
  };

  planCounts.forEach((p) => {
    if (planBreakdown.hasOwnProperty(p._id)) {
      planBreakdown[p._id] = p.count;
    }
  });

  const statusBreakdown = {};
  statusCounts.forEach((s) => {
    statusBreakdown[s._id] = s.count;
  });

  res.status(200).json({
    status: "success",
    data: {
      totalFirms,
      planBreakdown,
      statusBreakdown,
      totalUsers,
      newFirmsThisMonth,
    },
  });
});

exports.getPendingFirms = catchAsync(async (req, res) => {
  const firms = await Firm.find({
    "subscription.status": "PENDING_APPROVAL",
  })
    .sort({ createdAt: 1 })
    .select("-encryptedTaxId");

  const firmsWithAdmins = await Promise.all(
    firms.map(async (firm) => {
      const superAdmin = await User.findOne({
        firmId: firm._id,
        userType: "super-admin",
      }).select("firstName lastName email");
      return {
        ...firm.toObject(),
        superAdmin,
      };
    })
  );

  res.status(200).json({
    status: "success",
    data: firmsWithAdmins,
  });
});
