const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const ComplianceTracker = require("../models/complianceTrackerModel");
const User = require("../models/userModel");
const { sendCustomEmail } = require("../utils/email");
const Firm = require("../models/firmModel");
const { checkCacStatus } = require("../utils/cacWatchdog");

const POPULATE_FIELDS = [
  { path: "clientId", select: "firstName lastName email phone" },
  { path: "assignedTo", select: "firstName lastName email" },
];

exports.manualStatusCheck = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Tracked entity not found", 404));
  }

  if (!entity.rcNumber) {
    return next(new AppError("RC/BN number is required for status check", 400));
  }

  const result = await checkCacStatus(entity.rcNumber, entity.entityType);

  entity.cacPortalStatus = {
    ...entity.cacPortalStatus,
    lastChecked: new Date(),
    previousPortalStatus: entity.cacPortalStatus.portalStatus,
    portalStatus: result.success ? result.status : entity.cacPortalStatus.portalStatus,
    watchdogNotes: result.error || undefined,
  };

  if (result.success && result.status !== entity.cacPortalStatus.previousPortalStatus) {
    entity.cacPortalStatus.statusChangedAt = new Date();
    entity.cacPortalStatus.requiresAttention = true;

    if (["INACTIVE", "STRUCK-OFF", "WOUND-UP"].includes(result.status)) {
      entity.isRevenueOpportunity = true;
      entity.revenueOpportunityNote = `CAC status changed to ${result.status} - urgent client contact needed`;

      const assignedLawyer = await User.findById(entity.assignedTo);
      const client = await User.findById(entity.clientId);

      if (assignedLawyer && assignedLawyer.email) {
        const firm = await Firm.findById(req.firmId);

        try {
          await sendCustomEmail(
            `URGENT: ${entity.entityName} is now ${result.status} on CAC portal`,
            assignedLawyer.email,
            process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
            null,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">URGENT: Status Change Detected</h1>
                </div>
                <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fecaca;">
                  <p style="color: #374151; font-size: 16px;">Dear ${assignedLawyer.firstName},</p>
                  <p style="color: #374151; font-size: 16px;">The CAC portal status for one of your clients has changed and requires immediate attention.</p>

                  <div style="background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Entity:</strong> ${entity.entityName}</p>
                    <p style="margin: 5px 0;"><strong>RC/BN Number:</strong> ${entity.rcNumber}</p>
                    <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${entity.cacPortalStatus.previousPortalStatus || "Unknown"}</p>
                    <p style="margin: 5px 0; color: #dc2626; font-weight: bold;"><strong>Current Status:</strong> ${result.status}</p>
                    <p style="margin: 5px 0;"><strong>Client:</strong> ${client?.firstName} ${client?.lastName}</p>
                  </div>

                  <p style="color: #374151; font-size: 16px;"><strong>Recommended Action:</strong></p>
                  <ol style="color: #374151; font-size: 14px;">
                    <li>Contact the client immediately to discuss the status change</li>
                    <li>Assess the implications for the client's business</li>
                    <li>Discuss options for status restoration if applicable</li>
                    <li>Document all communications in the client file</li>
                  </ol>

                  <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">${firm?.name || "LawMaster"}</p>
                </div>
              </div>
            `
          );
        } catch (emailError) {
          console.error("Error sending watchdog alert:", emailError);
        }
      }
    }
  }

  await entity.save();

  res.status(200).json({
    status: "success",
    data: {
      entityId: entity._id,
      previousStatus: entity.cacPortalStatus.previousPortalStatus,
      currentStatus: entity.cacPortalStatus.portalStatus,
      lastChecked: entity.cacPortalStatus.lastChecked,
      statusChanged: result.success && result.status !== entity.cacPortalStatus.previousPortalStatus,
      requiresAttention: entity.cacPortalStatus.requiresAttention,
      result,
    },
  });
});

exports.getWatchdogReport = catchAsync(async (req, res, next) => {
  const alerts = await ComplianceTracker.find({
    firmId: req.firmId,
    "cacPortalStatus.requiresAttention": true,
    isDeleted: { $ne: true },
  })
    .populate(POPULATE_FIELDS)
    .sort({ "cacPortalStatus.statusChangedAt": -1 });

  const summary = {
    totalAlerts: alerts.length,
    byNewStatus: {},
    totalRevenueOpportunity: 0,
  };

  alerts.forEach((alert) => {
    const status = alert.cacPortalStatus.portalStatus;
    summary.byNewStatus[status] = (summary.byNewStatus[status] || 0) + 1;
    summary.totalRevenueOpportunity += alert.revenueOpportunityAmount || 0;
  });

  res.status(200).json({
    status: "success",
    data: alerts,
    summary,
  });
});

exports.acknowledgeStatusChange = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Tracked entity not found", 404));
  }

  entity.cacPortalStatus.requiresAttention = false;
  entity.cacPortalStatus.watchdogNotes = entity.cacPortalStatus.watchdogNotes
    ? `${entity.cacPortalStatus.watchdogNotes}\n[Acknowledged by ${req.user.firstName} ${req.user.lastName} on ${new Date().toISOString()}]`
    : `Acknowledged by ${req.user.firstName} ${req.user.lastName} on ${new Date().toISOString()}`;

  await entity.save();

  res.status(200).json({
    status: "success",
    message: "Status change acknowledged",
    data: {
      entityId: entity._id,
      requiresAttention: false,
    },
  });
});

exports.getWatchdogStats = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;

  const [
    totalMonitored,
    statusDistribution,
    lastCheckDate,
    changesThisMonth,
    alertsRequiringAttention,
  ] = await Promise.all([
    ComplianceTracker.countDocuments({
      firmId,
      "cacPortalStatus.rcNumber": { $exists: true },
      isDeleted: { $ne: true },
    }),
    ComplianceTracker.aggregate([
      {
        $match: {
          firmId,
          "cacPortalStatus.portalStatus": { $exists: true, $ne: null },
          isDeleted: { $ne: true },
        },
      },
      { $group: { _id: "$cacPortalStatus.portalStatus", count: { $sum: 1 } } },
    ]),
    ComplianceTracker.aggregate([
      {
        $match: {
          firmId,
          "cacPortalStatus.lastChecked": { $exists: true },
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          lastChecked: { $max: "$cacPortalStatus.lastChecked" },
        },
      },
    ]),
    ComplianceTracker.countDocuments({
      firmId,
      "cacPortalStatus.statusChangedAt": {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
      isDeleted: { $ne: true },
    }),
    ComplianceTracker.countDocuments({
      firmId,
      "cacPortalStatus.requiresAttention": true,
      isDeleted: { $ne: true },
    }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalMonitored,
      statusDistribution: statusDistribution.reduce(
        (acc, s) => ({ ...acc, [s._id]: s.count }),
        {}
      ),
      lastCheckDate: lastCheckDate[0]?.lastChecked || null,
      changesThisMonth,
      alertsRequiringAttention,
    },
  });
});

exports.getAllMonitoredEntities = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    portalStatus,
    requiresAttention,
    search,
  } = req.query;

  const query = {
    firmId: req.firmId,
    "cacPortalStatus.rcNumber": { $exists: true },
    isDeleted: { $ne: true },
  };

  if (portalStatus) {
    query["cacPortalStatus.portalStatus"] = portalStatus;
  }

  if (requiresAttention === "true") {
    query["cacPortalStatus.requiresAttention"] = true;
  }

  if (search) {
    query.$or = [
      { entityName: { $regex: search, $options: "i" } },
      { rcNumber: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [entities, total] = await Promise.all([
    ComplianceTracker.find(query)
      .populate(POPULATE_FIELDS)
      .select("entityName entityType rcNumber bnNumber cacPortalStatus clientId assignedTo")
      .sort({ "cacPortalStatus.lastChecked": -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ComplianceTracker.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    data: entities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.triggerManualCheckAll = catchAsync(async (req, res, next) => {
  const entities = await ComplianceTracker.find({
    firmId: req.firmId,
    "cacPortalStatus.rcNumber": { $exists: true },
    isDeleted: { $ne: true },
  }).select("_id rcNumber entityType entityName");

  const results = [];
  const errors = [];

  for (const entity of entities) {
    try {
      const result = await checkCacStatus(entity.rcNumber, entity.entityType);

      await ComplianceTracker.findByIdAndUpdate(entity._id, {
        "cacPortalStatus.lastChecked": new Date(),
        "cacPortalStatus.portalStatus": result.success ? result.status : undefined,
      });

      results.push({
        entityId: entity._id,
        entityName: entity.entityName,
        success: result.success,
        status: result.status,
      });
    } catch (error) {
      errors.push({
        entityId: entity._id,
        entityName: entity.entityName,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      totalChecked: entities.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    },
  });
});
