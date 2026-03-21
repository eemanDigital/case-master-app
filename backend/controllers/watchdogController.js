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
  { path: "linkedMatterId", select: "title matterNumber clientId" },
];

// ─── Manual Status Check (single entity) ─────────────────────────────────────
exports.manualStatusCheck = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) return next(new AppError("Tracked entity not found", 404));

  if (!entity.rcNumber) {
    return next(new AppError("RC/BN number is required for status check", 400));
  }

  const result = await checkCacStatus(entity.rcNumber, entity.entityType);

  // ✅ FIXED: capture previousStatus BEFORE any mutation
  const previousStatus = entity.cacPortalStatus?.portalStatus || null;
  const newStatus = result.success ? result.status : previousStatus;
  const statusChanged =
    result.success && newStatus && newStatus !== previousStatus;

  const updateData = {
    "cacPortalStatus.lastChecked": new Date(),
  };

  if (result.success) {
    updateData["cacPortalStatus.portalStatus"] = newStatus;
  }

  if (result.error) {
    updateData["cacPortalStatus.watchdogNotes"] = result.error;
  }

  if (statusChanged) {
    updateData["cacPortalStatus.previousPortalStatus"] = previousStatus;
    updateData["cacPortalStatus.statusChangedAt"] = new Date();

    const badStatuses = [
      "INACTIVE",
      "STRUCK-OFF",
      "WOUND-UP",
      "DISSOLVED",
      "SUSPENDED",
    ];
    const goodStatuses = ["ACTIVE", "REGISTERED", "COMPLIANT"];

    const isBadStatus = badStatuses.includes(newStatus);
    const isGoodStatus = goodStatuses.includes(newStatus);

    updateData["cacPortalStatus.requiresAttention"] = isBadStatus;

    if (isBadStatus) {
      updateData.isRevenueOpportunity = true;
      updateData.revenueOpportunityNote = `CAC status changed to ${newStatus} — urgent client contact needed`;

      const [assignedLawyer, client, firm] = await Promise.all([
        User.findById(entity.assignedTo),
        User.findById(entity.clientId),
        Firm.findById(req.firmId),
      ]);

      if (assignedLawyer?.email) {
        try {
          await sendCustomEmail(
            `🚨 URGENT: ${entity.entityName} is now ${newStatus} on CAC portal`,
            assignedLawyer.email,
            process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
            null,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #dc2626, #b91c1c);
                     padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">URGENT: Status Change Detected</h1>
                </div>
                <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px;
                     border: 1px solid #fecaca;">
                  <p style="color: #374151;">Dear ${assignedLawyer.firstName},</p>
                  <p style="color: #374151;">
                    The CAC portal status for one of your clients has changed and
                    requires immediate attention.
                  </p>
                  <div style="background: white; border: 2px solid #dc2626;
                       border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Entity:</strong> ${entity.entityName}</p>
                    <p style="margin: 5px 0;"><strong>RC/BN Number:</strong> ${entity.rcNumber}</p>
                    <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${previousStatus || "Unknown"}</p>
                    <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">
                      <strong>Current Status:</strong> ${newStatus}
                    </p>
                    <p style="margin: 5px 0;">
                      <strong>Client:</strong>
                      ${client?.firstName || ""} ${client?.lastName || ""}
                    </p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">
                    ${firm?.name || "LawMaster"}
                  </p>
                </div>
              </div>
            `,
          );
        } catch (emailError) {
          console.error("Error sending watchdog alert:", emailError.message);
        }
      }
    } else if (isGoodStatus) {
      updateData.isRevenueOpportunity = false;
      updateData.revenueOpportunityNote = undefined;
    }
  }

  if (
    !statusChanged &&
    ["ACTIVE", "REGISTERED", "COMPLIANT"].includes(newStatus)
  ) {
    updateData["cacPortalStatus.requiresAttention"] = false;
  }

  // ✅ FIXED: use findByIdAndUpdate to apply changes atomically
  await ComplianceTracker.findByIdAndUpdate(
    entity._id,
    { $set: updateData },
    { runValidators: false },
  );

  res.status(200).json({
    status: "success",
    data: {
      entityId: entity._id,
      entityName: entity.entityName,
      rcNumber: entity.rcNumber,
      previousStatus,
      currentStatus: newStatus,
      lastChecked: updateData["cacPortalStatus.lastChecked"],
      // ✅ FIXED: statusChanged computed from local variables, not from re-reading entity
      statusChanged,
      requiresAttention: statusChanged
        ? true
        : entity.cacPortalStatus?.requiresAttention,
      checkResult: {
        success: result.success,
        error: result.error || null,
      },
    },
  });
});

// ─── Watchdog Report (all entities requiring attention) ───────────────────────
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
    totalRevenueOpportunityAmount: 0,
    revenueOpportunityCount: 0,
  };

  alerts.forEach((alert) => {
    const status = alert.cacPortalStatus?.portalStatus || "UNKNOWN";
    summary.byNewStatus[status] = (summary.byNewStatus[status] || 0) + 1;
    if (alert.isRevenueOpportunity) {
      summary.totalRevenueOpportunityAmount +=
        alert.revenueOpportunityAmount || 0;
      summary.revenueOpportunityCount++;
    }
  });

  res.status(200).json({
    status: "success",
    results: alerts.length,
    summary,
    data: alerts,
  });
});

// ─── Acknowledge Status Change ────────────────────────────────────────────────
exports.acknowledgeStatusChange = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) return next(new AppError("Tracked entity not found", 404));

  const acknowledgementNote = `Acknowledged by ${req.user.firstName} ${req.user.lastName} on ${new Date().toISOString()}`;

  await ComplianceTracker.findByIdAndUpdate(req.params.id, {
    $set: {
      "cacPortalStatus.requiresAttention": false,
      "cacPortalStatus.watchdogNotes": entity.cacPortalStatus?.watchdogNotes
        ? `${entity.cacPortalStatus.watchdogNotes}\n[${acknowledgementNote}]`
        : `[${acknowledgementNote}]`,
    },
  });

  res.status(200).json({
    status: "success",
    message: "Status change acknowledged successfully",
    data: {
      entityId: entity._id,
      entityName: entity.entityName,
      requiresAttention: false,
      acknowledgedBy: `${req.user.firstName} ${req.user.lastName}`,
      acknowledgedAt: new Date(),
    },
  });
});

// ─── Watchdog Stats ───────────────────────────────────────────────────────────
exports.getWatchdogStats = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalMonitored,
    statusDistribution,
    lastCheckResult,
    changesThisMonth,
    alertsRequiringAttention,
    revenueOpportunities,
  ] = await Promise.all([
    ComplianceTracker.countDocuments({
      firmId,
      rcNumber: { $exists: true, $ne: null, $ne: "" },
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
      {
        $group: {
          _id: "$cacPortalStatus.portalStatus",
          count: { $sum: 1 },
        },
      },
    ]),

    // ✅ FIXED: field name is lastChecked not lastCheck
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
      "cacPortalStatus.statusChangedAt": { $gte: startOfMonth },
      isDeleted: { $ne: true },
    }),

    ComplianceTracker.countDocuments({
      firmId,
      "cacPortalStatus.requiresAttention": true,
      isDeleted: { $ne: true },
    }),

    ComplianceTracker.aggregate([
      {
        $match: {
          firmId,
          isRevenueOpportunity: true,
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: "$revenueOpportunityAmount" },
        },
      },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalMonitored,
      statusDistribution: statusDistribution.reduce(
        (acc, s) => ({ ...acc, [s._id]: s.count }),
        {},
      ),
      lastCheckDate: lastCheckResult[0]?.lastChecked || null,
      changesThisMonth,
      alertsRequiringAttention,
      revenueOpportunities: {
        count: revenueOpportunities[0]?.count || 0,
        totalAmount: revenueOpportunities[0]?.totalAmount || 0,
      },
    },
  });
});

// ─── Get All Monitored Entities ───────────────────────────────────────────────
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
    // ✅ FIXED: correct field name — top-level rcNumber
    rcNumber: { $exists: true, $ne: null, $ne: "" },
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
      .select(
        "entityName entityType rcNumber bnNumber cacPortalStatus " +
          "clientId assignedTo isRevenueOpportunity revenueOpportunityAmount " +
          "currentComplianceStatus",
      )
      .sort({
        "cacPortalStatus.requiresAttention": -1,
        "cacPortalStatus.lastChecked": -1,
      })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    ComplianceTracker.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: entities.length,
    data: entities,
    pagination: {
      current: parseInt(page),
      limit: parseInt(limit),
      total: Math.ceil(total / parseInt(limit)),
      totalRecords: total,
    },
  });
});

// ─── Trigger Manual Check All (bulk) ─────────────────────────────────────────
exports.triggerManualCheckAll = catchAsync(async (req, res, next) => {
  const entities = await ComplianceTracker.find({
    firmId: req.firmId,
    // ✅ FIXED: correct top-level field
    rcNumber: { $exists: true, $ne: null, $ne: "" },
    isDeleted: { $ne: true },
  }).select("_id rcNumber entityType entityName cacPortalStatus");

  if (entities.length === 0) {
    return res.status(200).json({
      status: "success",
      data: {
        totalChecked: 0,
        successful: 0,
        failed: 0,
        results: [],
        errors: [],
      },
    });
  }

  const results = [];
  const errors = [];

  for (const entity of entities) {
    try {
      const result = await checkCacStatus(entity.rcNumber, entity.entityType);

      // ✅ FIXED: capture previousStatus and detect changes
      const previousStatus = entity.cacPortalStatus?.portalStatus;
      const newStatus = result.success ? result.status : previousStatus;
      const statusChanged =
        result.success && newStatus && newStatus !== previousStatus;

      const updateData = {
        "cacPortalStatus.lastChecked": new Date(),
      };

      if (result.success) {
        updateData["cacPortalStatus.portalStatus"] = newStatus;
      }

      if (statusChanged) {
        updateData["cacPortalStatus.previousPortalStatus"] = previousStatus;
        updateData["cacPortalStatus.statusChangedAt"] = new Date();

        const badStatuses = [
          "INACTIVE",
          "STRUCK-OFF",
          "WOUND-UP",
          "DISSOLVED",
          "SUSPENDED",
        ];
        const goodStatuses = ["ACTIVE", "REGISTERED", "COMPLIANT"];

        const isBadStatus = badStatuses.includes(newStatus);
        const isGoodStatus = goodStatuses.includes(newStatus);

        updateData["cacPortalStatus.requiresAttention"] = isBadStatus;

        if (isBadStatus) {
          updateData.isRevenueOpportunity = true;
          updateData.revenueOpportunityNote = `CAC status changed to ${newStatus} — urgent contact needed`;
        } else if (isGoodStatus) {
          updateData.isRevenueOpportunity = false;
          updateData.revenueOpportunityNote = undefined;
        }
      }

      if (
        !statusChanged &&
        ["ACTIVE", "REGISTERED", "COMPLIANT"].includes(newStatus)
      ) {
        updateData["cacPortalStatus.requiresAttention"] = false;
      }

      await ComplianceTracker.findByIdAndUpdate(
        entity._id,
        { $set: updateData },
        { runValidators: false },
      );

      results.push({
        entityId: entity._id,
        entityName: entity.entityName,
        rcNumber: entity.rcNumber,
        success: result.success,
        previousStatus,
        currentStatus: newStatus,
        statusChanged,
        error: result.error || null,
      });
    } catch (error) {
      errors.push({
        entityId: entity._id,
        entityName: entity.entityName,
        rcNumber: entity.rcNumber,
        error: error.message,
      });
    }

    // ✅ Respect CAC portal with delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  res.status(200).json({
    status: "success",
    data: {
      totalChecked: entities.length,
      successful: results.length,
      failed: errors.length,
      statusChangesDetected: results.filter((r) => r.statusChanged).length,
      results,
      errors,
    },
  });
});

// ─── Create Monitored Entity ──────────────────────────────────────────────────
exports.createMonitoredEntity = catchAsync(async (req, res, next) => {
  const {
    entityName,
    registrationNumber,
    entityType,
    clientId,
    incorporationDate,
    linkedMatterId,
    notes,
    assignedTo,
  } = req.body;

  if (!entityName || !registrationNumber) {
    return next(
      new AppError("Entity name and registration number are required", 400),
    );
  }

  // ✅ FIXED: clientId is required — validate it
  // if (!clientId) {
  //   return next(new AppError("Client ID is required", 400));
  // }

  const entityTypeMap = {
    ltd: "private-limited",
    plc: "public-limited",
    business_name: "business-name",
    bn: "business-name",
    incorporated_trustees: "incorporated-trustee",
    llp: "llp",
  };

  const mappedEntityType = entityTypeMap[entityType] || entityType || "other";

  // Check for existing entity with same RC number in this firm
  const existing = await ComplianceTracker.findOne({
    firmId: req.firmId,
    rcNumber: registrationNumber,
    isDeleted: { $ne: true },
  });

  if (existing) {
    return next(
      new AppError(
        `An entity with RC/BN number ${registrationNumber} is already being monitored`,
        409,
      ),
    );
  }

  // Attempt CAC status check immediately on creation
  let initialPortalStatus = "UNKNOWN";
  let initialWatchdogNotes = notes || undefined;

  try {
    const result = await checkCacStatus(registrationNumber, mappedEntityType);
    if (result.success) {
      initialPortalStatus = result.status;
    } else {
      initialWatchdogNotes = result.error
        ? `${notes || ""} | Initial check failed: ${result.error}`.trim()
        : notes;
    }
  } catch (error) {
    console.error("Initial CAC status check failed:", error.message);
    // ✅ Do not block creation if CAC check fails
  }

  const entity = await ComplianceTracker.create({
    firmId: req.firmId,
    entityName,
    rcNumber: registrationNumber,
    entityType: mappedEntityType,
    // ✅ FIXED: include required fields
    clientId,
    incorporationDate: incorporationDate || undefined,
    assignedTo: assignedTo || req.user._id,
    linkedMatterId: linkedMatterId || undefined,
    createdBy: req.user._id,
    currentComplianceStatus: "unknown",
    cacPortalStatus: {
      portalStatus: initialPortalStatus,
      lastChecked: new Date(),
      requiresAttention: ["INACTIVE", "STRUCK-OFF", "WOUND-UP"].includes(
        initialPortalStatus,
      ),
      watchdogNotes: initialWatchdogNotes,
    },
  });

  await entity.populate(POPULATE_FIELDS);

  res.status(201).json({
    status: "success",
    data: entity,
  });
});

// ─── Delete Monitored Entity (soft delete) ────────────────────────────────────
exports.deleteMonitoredEntity = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Monitored entity not found", 404));
  }

  // ✅ FIXED: proper soft delete — never destroy data with $unset
  await ComplianceTracker.findByIdAndUpdate(req.params.id, {
    $set: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id,
    },
  });

  res.status(200).json({
    status: "success",
    message: "Entity removed from watchdog monitoring",
    data: {
      entityId: entity._id,
      entityName: entity.entityName,
    },
  });
});
