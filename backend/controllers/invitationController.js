// controllers/invitationController.js
const Invitation = require("../models/invitationModel");
const User = require("../models/userModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { sendCustomEmail } = require("../utils/email");

const getInvitationEmailHTML = ({
  firstName,
  lastName,
  firmName,
  inviteUrl,
  message,
  expiresAt,
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
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">You've Been Invited!</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${firstName} ${lastName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              You have been invited to join <strong>${firmName}</strong> on LawMaster. Click the button below to complete your registration.
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
              If you didn't expect this invitation, please ignore this email.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

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

  // Get firm details for email
  const firm = await Firm.findById(req.firmId).select("name");
  const expiresAtDate = new Date(invitation.expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Send invitation email
  const firmName = firm?.name || "LawMaster";
  const htmlContent = getInvitationEmailHTML({
    firstName,
    lastName,
    firmName,
    inviteUrl,
    message,
    expiresAt: expiresAtDate,
  });

  try {
    console.log("📧 Sending invitation email...");
    console.log("To:", email.toLowerCase());
    console.log("From:", process.env.SENDINBLUE_EMAIL || process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com");
    console.log("Subject:", `You're invited to join ${firmName}`);
    
    await sendCustomEmail(
      `You're invited to join ${firmName}`,
      email.toLowerCase(),
      process.env.SENDINBLUE_EMAIL || process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      htmlContent,
    );
    console.log("✅ Invitation email sent to:", email);

    // Also send to debug email for testing
    if (process.env.DEBUG_EMAIL && process.env.DEBUG_EMAIL !== email.toLowerCase()) {
      await sendCustomEmail(
        `[COPY] You're invited to join ${firmName}`,
        process.env.DEBUG_EMAIL,
        process.env.SENDINBLUE_EMAIL || process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
        null,
        htmlContent,
      );
      console.log("📧 Copy sent to DEBUG_EMAIL:", process.env.DEBUG_EMAIL);
    }
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

  // Get firm details for email
  const firm = await Firm.findById(req.firmId).select("name");
  const expiresAtDate = new Date(invitation.expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Send invitation email
  const firmName = firm?.name || "LawMaster";
  const htmlContent = getInvitationEmailHTML({
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    firmName,
    inviteUrl,
    message: invitation.message,
    expiresAt: expiresAtDate,
  });

  try {
    await sendCustomEmail(
      `You're invited to join ${firmName}`,
      invitation.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
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
    city 
  } = req.body;

  const invitation = await Invitation.validateToken(token);

  if (!invitation) {
    if (await Invitation.findOne({ token })) {
      return next(new AppError("This invitation has already been used or expired", 400));
    }
    return next(new AppError("Invalid or expired invitation", 400));
  }

  if (invitation.firmId.toString() !== req.body.firmId) {
    return next(new AppError("Invitation does not match this firm", 400));
  }

  if (invitation.status === "accepted") {
    return next(new AppError("This invitation has already been accepted", 400));
  }

  const existingUser = await User.findOne({ email: invitation.email.toLowerCase() });
  if (existingUser) {
    if (existingUser.firmId && existingUser.firmId.toString() !== invitation.firmId.toString()) {
      return next(new AppError("This email is already registered with another firm. Please contact support.", 400));
    }
    
    existingUser.firmId = invitation.firmId;
    existingUser.firstName = firstName || existingUser.firstName;
    existingUser.lastName = lastName || existingUser.lastName;
    existingUser.phone = phone || existingUser.phone;
    if (gender) existingUser.gender = gender;
    if (fullAddress) existingUser.address = fullAddress;
    existingUser.role = invitation.role;
    existingUser.userType = isClient ? "client" : "staff";
    existingUser.isVerified = true;
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

    return res.status(200).json({
      status: "success",
      message: "Invitation accepted successfully",
    });
  }

  const isClient = invitation.role === "client";
  
  if (!isClient) {
    if (!gender) {
      return next(new AppError("Gender is required for staff and lawyers", 400));
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
