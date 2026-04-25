// controllers/invitationController.js
const Invitation = require("../models/invitationModel");
const User = require("../models/userModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { sendCustomEmail } = require("../utils/email");

// Email template for Platform Admin (App Owner) inviting a new law firm to subscribe
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

// Email template for Firm Admin adding users to their existing firm
const getInvitationEmailHTML = ({
  firstName,
  lastName,
  firmName,
  inviteUrl,
  message,
  expiresAt,
  invitedByName,
  invitedByRole,
  role,
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
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">You've Been Invited to Join ${firmName}!</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${firstName} ${lastName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              <strong>${invitedByName}</strong> from <strong>${firmName}</strong> has invited you to join their team on LawMaster as a <strong>${role}</strong>.
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
            
            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                    Accept Invitation
                  </a>
                </td>
              </tr>
            </table>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              This invitation will expire on <strong>${expiresAt}</strong>. Please accept before then.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              If you didn't expect this invitation, please ignore this email or contact us at support@lawmaster.ng.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

const getInvitationAcceptedEmailHTML = ({
  inviterName,
  invitedName,
  invitedEmail,
  firmName,
  role,
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
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Team Member Joined!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${inviterName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Great news! <strong>${invitedName}</strong> (<strong>${invitedEmail}</strong>) has accepted your invitation to join <strong>${firmName}</strong> as a <strong>${role}</strong>.
            </p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                <strong>New User Details:</strong><br>
                Name: ${invitedName}<br>
                Email: ${invitedEmail}<br>
                Role: ${role}
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              You can now assign them cases and manage their access from your admin dashboard.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

const getWelcomeEmailHTML = ({
  firstName,
  firmName,
  role,
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
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to ${firmName}!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${firstName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Welcome to <strong>${firmName}</strong> on LawMaster! You have been added as a <strong>${role}</strong> on the platform.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #4b5563; font-size: 14px; margin: 0;">
                <strong>Your login credentials:</strong><br>
                Email: Your registered email<br>
                Password: Set during invitation acceptance
              </p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              You can now access the dashboard and start working. If you have any questions, please contact your administrator.
            </p>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>The LawMaster Team</strong>
            </p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

// Role label helper
const getRoleLabel = (role) => {
  const roleLabels = {
    admin: "Administrator",
    lawyer: "Lawyer",
    staff: "Staff",
    client: "Client",
    "super-admin": "Super Admin",
  };
  return roleLabels[role] || role;
};

// Send notification to inviter when invitation is accepted
const sendInvitationAcceptedNotification = async (invitation, invitedUser, firm) => {
  try {
    const inviter = await User.findById(invitation.invitedBy);
    if (!inviter || !inviter.email) return;

    const firmName = firm?.name || "LawMaster";
    const invitedName = `${invitedUser.firstName} ${invitedUser.lastName}`;
    const roleLabel = getRoleLabel(invitation.role);

    const htmlContent = getInvitationAcceptedEmailHTML({
      inviterName: inviter.firstName,
      invitedName,
      invitedEmail: invitedUser.email,
      firmName,
      role: roleLabel,
    });

    await sendCustomEmail(
      `New Team Member: ${invitedName} joined ${firmName}`,
      inviter.email,
      process.env.SENDINBLUE_EMAIL || process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      process.env.DEFAULT_REPLY_TO || "support@lawmaster.ng",
      htmlContent,
    );
    console.log("✅ Invitation accepted notification sent to:", inviter.email);
  } catch (emailError) {
    console.error("❌ Failed to send invitation accepted notification:", emailError.message);
  }
};

// Send welcome email to new user
const sendWelcomeEmail = async (user, firm) => {
  try {
    const firmName = firm?.name || "LawMaster";
    const roleLabel = getRoleLabel(user.role);

    const htmlContent = getWelcomeEmailHTML({
      firstName: user.firstName,
      firmName,
      role: roleLabel,
    });

    await sendCustomEmail(
      `Welcome to ${firmName}!`,
      user.email,
      process.env.SENDINBLUE_EMAIL || process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      process.env.DEFAULT_REPLY_TO || "support@lawmaster.ng",
      htmlContent,
    );
    console.log("✅ Welcome email sent to:", user.email);
  } catch (emailError) {
    console.error("❌ Failed to send welcome email:", emailError.message);
  }
};

exports.generateInvitation = catchAsync(async (req, res, next) => {
  const {
    email,
    firstName,
    lastName,
    role,
    plan,
    maxUsers,
    message,
    expiresInDays,
  } = req.body;

  const existingInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    firmId: req.firmId,
    status: "pending",
    expiresAt: { $gt: new Date() },
    isDeleted: { $ne: true },
  });

  if (existingInvitation) {
    return next(
      new AppError("An invitation has already been sent to this email", 400),
    );
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
    expiresAt: new Date(
      Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000,
    ),
    message,
  });

  const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?token=${token}`;

  // Get firm details for email
  const firm = await Firm.findById(req.firmId).select("name");
  const inviter = await User.findById(req.user.id).select("firstName lastName role");
  const expiresAtDate = new Date(invitation.expiresAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  // Send invitation email
  const firmName = firm?.name || "LawMaster";
  const invitedByName = inviter ? `${inviter.firstName} ${inviter.lastName}` : "Your Firm";
  const invitedByRole = inviter ? getRoleLabel(inviter.role) : "Administrator";
  const roleLabel = getRoleLabel(invitation.role);

  const htmlContent = getInvitationEmailHTML({
    firstName,
    lastName,
    firmName,
    inviteUrl,
    message,
    expiresAt: expiresAtDate,
    invitedByName,
    invitedByRole,
    role: roleLabel,
  });

  try {
    console.log("📧 Sending invitation email...");
    console.log("To:", email.toLowerCase());
    console.log(
      "From:",
      process.env.SENDINBLUE_EMAIL ||
        process.env.DEFAULT_FROM_EMAIL ||
        "noreply@lawmaster.com",
    );
    console.log("Subject:", `You're invited to join ${firmName} as ${roleLabel}`);
    console.log("Invited by:", invitedByName, "-", invitedByRole);

    await sendCustomEmail(
      `You're invited to join ${firmName} as ${roleLabel}`,
      email.toLowerCase(),
      process.env.SENDINBLUE_EMAIL ||
        process.env.DEFAULT_FROM_EMAIL ||
        "noreply@lawmaster.com",
      process.env.DEFAULT_REPLY_TO || "support@lawmaster.ng",
      htmlContent,
    );
    console.log("✅ Invitation email sent to:", email);
  } catch (emailError) {
    console.error("❌ Failed to send invitation email:", emailError.message);
    console.error("Full error:", emailError);
  }

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
    { new: true },
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
    { new: true },
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
  invitation.expiresAt = new Date(
    Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000,
  );
  await invitation.save();

  const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?token=${invitation.token}`;

  // Get firm details for email
  const firm = await Firm.findById(req.firmId).select("name");
  const inviter = await User.findById(req.user.id).select("firstName lastName role");
  const expiresAtDate = new Date(invitation.expiresAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  // Send invitation email
  const firmName = firm?.name || "LawMaster";
  const invitedByName = inviter ? `${inviter.firstName} ${inviter.lastName}` : "Your Firm";
  const invitedByRole = inviter ? getRoleLabel(inviter.role) : "Administrator";
  const roleLabel = getRoleLabel(invitation.role);

  const htmlContent = getInvitationEmailHTML({
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    firmName,
    inviteUrl,
    message: invitation.message,
    expiresAt: expiresAtDate,
    invitedByName,
    invitedByRole,
    role: roleLabel,
  });

  try {
    await sendCustomEmail(
      `You're invited to join ${firmName} as ${roleLabel}`,
      invitation.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      process.env.DEFAULT_REPLY_TO || "support@lawmaster.ng",
      htmlContent,
    );
    console.log("✅ Resent invitation email to:", invitation.email);
  } catch (emailError) {
    console.error("❌ Failed to resend invitation email:", emailError.message);
  }

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
      invitationType: invitation.invitationType,
    },
  });
});

// Validate new firm invitation (platform admin invited a new law firm)
exports.validateNewFirmInvitation = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const invitation = await Invitation.validateNewFirmToken(token);

  if (!invitation) {
    return next(new AppError("Invalid or expired firm invitation", 400));
  }

  res.status(200).json({
    status: "success",
    data: {
      valid: true,
      email: invitation.email,
      firmName: invitation.firstName,
      contactName: invitation.firstName,
      targetPlan: invitation.plan,
      maxUsers: invitation.maxUsers,
      invitationType: invitation.invitationType,
    },
  });
});

exports.acceptInvitation = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const {
    password,
    passwordConfirm,
    firstName,
    lastName,
    gender,
    phone,
    address,
    state,
    city,
  } = req.body;

  const userAgent = req.headers["user-agent"] || "Unknown";
  const parser = require("ua-parser-js");
  const currentDevice = parser(userAgent).ua;

  const invitation = await Invitation.validateToken(token);

  if (!invitation) {
    if (await Invitation.findOne({ token })) {
      return next(
        new AppError("This invitation has already been used or expired", 400),
      );
    }
    return next(new AppError("Invalid or expired invitation", 400));
  }

  if (invitation.firmId.toString() !== req.body.firmId) {
    return next(new AppError("Invitation does not match this firm", 400));
  }

  if (invitation.status === "accepted") {
    return next(new AppError("This invitation has already been accepted", 400));
  }

  const existingUser = await User.findOne({
    email: invitation.email.toLowerCase(),
  });
  const isClient = invitation.role === "client";
  
  if (existingUser) {
    if (
      existingUser.firmId &&
      existingUser.firmId.toString() !== invitation.firmId.toString()
    ) {
      return next(
        new AppError(
          "This email is already registered with another firm. Please contact support.",
          400,
        ),
      );
    }

    const fullAddress = [address, city, state].filter(Boolean).join(", ");

    existingUser.firmId = invitation.firmId;
    existingUser.firstName = firstName || existingUser.firstName;
    existingUser.lastName = lastName || existingUser.lastName;
    existingUser.phone = phone || existingUser.phone;
    if (gender) existingUser.gender = gender;
    if (fullAddress) existingUser.address = fullAddress;
    existingUser.role = invitation.role;
    existingUser.userType = isClient ? "client" : "staff";
    existingUser.isVerified = true;
    if (!existingUser.userAgent) existingUser.userAgent = [];
    if (!existingUser.userAgent.includes(currentDevice)) {
      existingUser.userAgent.push(currentDevice);
    }
    await existingUser.save();

    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    invitation.invitedUser = existingUser._id;
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

    // Send notification to inviter
    await sendInvitationAcceptedNotification(invitation, existingUser, firm);

    return res.status(200).json({
      status: "success",
      message: "Invitation accepted successfully",
    });
  }

  if (!isClient) {
    if (!gender) {
      return next(
        new AppError("Gender is required for staff and lawyers", 400),
      );
    }
    if (!address) {
      return next(new AppError("Residential address is required", 400));
    }
  }

  const fullAddress = [address, city, state].filter(Boolean).join(", ");

  const user = await User.create({
    firmId: invitation.firmId,
    firstName: firstName || invitation.firstName,
    lastName: lastName || invitation.lastName,
    email: invitation.email,
    phone: phone || "+234",
    gender: gender || undefined,
    address: fullAddress || "",
    password,
    passwordConfirm,
    role: invitation.role,
    userType: isClient ? "client" : "staff",
    isVerified: true,
    userAgent: [currentDevice],
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

  // Send notification to inviter and welcome email to new user
  await sendInvitationAcceptedNotification(invitation, user, firm);
  await sendWelcomeEmail(user, firm);

  res.status(200).json({
    status: "success",
    message: "Invitation accepted successfully",
  });
});
