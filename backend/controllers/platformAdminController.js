const crypto = require("crypto");
const Firm = require("../models/firmModel");
const User = require("../models/userModel");
const PlatformInvite = require("../models/platformInviteModel");
const Invitation = require("../models/invitationModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendCustomEmail, sendMail } = require("../utils/email");

const PLAN_LIMITS = {
  FREE: { users: 3, storageGB: 5, activeMatters: 3 },
  BASIC: { users: 10, storageGB: 20, activeMatters: 15 },
  PRO: { users: 25, storageGB: 100, activeMatters: 50 },
  ENTERPRISE: { users: 999999, storageGB: 999999, activeMatters: 999999 },
};

const PLAN_ORDER = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

// Email template for Platform Admin (App Owner) inviting new law firms
const getPlatformFirmInvitationEmailHTML = ({
  firmName,
  inviteUrl,
  message,
  expiresAt,
  targetPlan,
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <div style="background-color: #f4f4f4; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
      <tr>
        <td style="padding: 0;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">You're Invited to Join LawMaster!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${firmName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              The LawMaster Team is excited to invite you to join our legal practice management platform! 
              Get started with the <strong>${targetPlan || "PRO"}</strong> plan and transform how your firm handles cases and clients.
            </p>
            
            ${
              message
                ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #4b5563; font-size: 14px; margin: 0; font-style: italic;">"${message}"</p>
            </div>
            `
                : ""
            }
            
            <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #065f46; margin-top: 0;">Why LawMaster?</h3>
              <ul style="color: #047857; padding-left: 20px;">
                <li>Manage cases, clients, and deadlines in one place</li>
                <li>Automate deadline reminders and compliance alerts</li>
                <li>Secure cloud storage for all your documents</li>
                <li>Team collaboration tools</li>
                <li>Real-time analytics and reporting</li>
              </ul>
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <a href="${inviteUrl}" style="background-color: #059669; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px; display: inline-block;">
                    Get Started Now
                  </a>
                </td>
              </tr>
            </table>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              This invitation will expire on <strong>${expiresAt}</strong>. Claim your spot today!
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Questions? Contact us at support@lawmaster.ng<br>
              © ${new Date().getFullYear()} LawMaster. All rights reserved.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

exports.getAllFirms = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, plan, status, search } = req.query;

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
    userType = "super-admin",
  } = req.body;

  if (!firmName || !email || !firstName || !lastName) {
    return next(
      new AppError(
        "Please provide firmName, email, firstName, and lastName",
        400,
      ),
    );
  }

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

  // Generate a valid temp password that meets validation requirements
  const generateValidPassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const special = "!@#$%&*";
    const allChars = upper + lower + numbers + special;

    const getRandom = (str) =>
      str[Math.floor(crypto.randomBytes(2).readUInt16LE() % str.length)];
    const base =
      getRandom(upper) +
      getRandom(lower) +
      getRandom(numbers) +
      getRandom(special);
    const extra = Array.from({ length: 4 }, () => getRandom(allChars)).join("");

    return (base + extra)
      .split("")
      .sort(() => (crypto.randomBytes(1)[0] % 3) - 1)
      .join("");
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
      activeMatterCount: 0,
    },
  });

  const role = userType === "super-admin" ? "super-admin" : userType;

  let userData = {
    firmId: firm._id,
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: tempPassword,
    passwordConfirm: tempPassword,
    userType,
    role,
    address: address || "Platform created account",
    phone: phone || "+234",
    gender: gender || "male",
    isVerified: true,
    isActive: true,
    status: "active",
    userAgent: ["platform-created"],
  };

  if (userType === "super-admin" || userType === "admin") {
    userData.position = "Managing Partner";
    userData.adminDetails = {
      adminLevel: "firm",
      canManageUsers: true,
      canManageCases: true,
      canManageBilling: true,
      canViewReports: true,
      systemAccessLevel: "full",
    };
  } else if (userType === "lawyer") {
    userData.lawyerDetails = { barNumber: "N/A", specialization: "General" };
  }

  const user = await User.create(userData);

  try {
    const frontendUrl =
      process.env.FRONTEND_URL || "https://case-master-app.vercel.app";
    const loginUrl = `${frontendUrl}/users/login`;

    await sendMail(
      "Welcome to LawMaster - Your Account Credentials",
      email,
      process.env.SENDINBLUE_EMAIL || "noreply@lawmaster.ng",
      "noreply@lawmaster.ng",
      "welcome",
      {
        firstName,
        email,
        password: tempPassword,
        loginUrl,
        baseUrl: frontendUrl,
      },
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

  // Activate ALL users in the firm and mark email as verified
  await User.updateMany(
    { firmId: firm._id },
    { isActive: true, status: "active", isVerified: true },
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
            <li><strong>Login URL:</strong> ${process.env.FRONTEND_URL}/users/login</li>
            <li><strong>Email:</strong> ${superAdmin.email}</li>
          </ul>
          <p>If you have any questions, contact support at support@lawmaster.ng</p>
          <p style="margin-top: 30px;">Best regards,<br/>The LawMaster Team</p>
        </div>
        `,
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
      `,
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

  await User.updateMany({ firmId: firm._id }, { isActive: false });

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
    { isActive: true, status: "active" },
  );

  console.log(
    `Reactivated ${result.modifiedCount} users for firm ${firm.name}`,
  );

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
    return next(
      new AppError(
        "Target plan must be higher than the firm's current plan",
        400,
      ),
    );
  }

  await PlatformInvite.updateMany(
    { firmId, status: "pending" },
    { status: "cancelled" },
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

  const upgradeUrl = `${process.env.FRONTEND_URL || "https://case-master-app.vercel.app"}/upgrade?token=${token}`;

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
      `,
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
    isDeleted: anyInvite.isDeleted,
  });

  if (anyInvite.status !== "pending") {
    return next(
      new AppError("This invitation has already been used or cancelled", 400),
    );
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

// Platform Admin invites a new law firm to subscribe
exports.inviteNewFirm = catchAsync(async (req, res, next) => {
  const {
    firmName,
    contactEmail,
    contactName,
    phone,
    targetPlan = "PRO",
    message,
    expiresInDays = 14,
  } = req.body;

  // Check if firm with this email already exists
  const existingFirm = await Firm.findOne({
    $or: [
      { "contact.email": contactEmail.toLowerCase() },
      { name: { $regex: new RegExp(`^${firmName}$`, "i") } },
    ],
  });

  if (existingFirm) {
    return next(
      new AppError("A firm with this name or email already exists", 400),
    );
  }

  const token = Invitation.generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

  const invitation = await Invitation.create({
    firmId: null, // No firm yet - this is for new firm registration
    email: contactEmail.toLowerCase(),
    firstName: contactName,
    lastName: "",
    role: "super-admin",
    invitedBy: null, // Platform admin - special case
    token,
    plan: targetPlan,
    maxUsers: PLAN_LIMITS[targetPlan]?.users || 25,
    expiresAt,
    message,
    invitationType: "new-firm", // Mark as new firm invitation
  });

  const inviteUrl = `${process.env.FRONTEND_URL || "https://case-master-app.vercel.app"}/register-firm?token=${token}&plan=${targetPlan}`;

  const expiresAtDate = expiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const htmlContent = getPlatformFirmInvitationEmailHTML({
    firmName,
    inviteUrl,
    message,
    expiresAt: expiresAtDate,
    targetPlan,
  });

  try {
    await sendCustomEmail(
      `You're Invited to Join LawMaster - ${targetPlan} Plan`,
      contactEmail.toLowerCase(),
      process.env.SENDINBLUE_EMAIL || "noreply@lawmaster.ng",
      process.env.DEFAULT_REPLY_TO || "support@lawmaster.ng",
      htmlContent,
    );
    console.log("✅ Platform firm invitation sent to:", contactEmail);
  } catch (emailError) {
    console.error(
      "❌ Failed to send platform firm invitation:",
      emailError.message,
    );
  }

  res.status(201).json({
    status: "success",
    data: {
      invitation: {
        id: invitation._id,
        email: invitation.email,
        firmName,
        targetPlan,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      },
      inviteUrl,
    },
  });
});

exports.getPlatformStats = catchAsync(async (req, res) => {
  const [totalFirms, planCounts, statusCounts, totalUsers, newFirmsThisMonth] =
    await Promise.all([
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
    }),
  );

  res.status(200).json({
    status: "success",
    data: firmsWithAdmins,
  });
});
