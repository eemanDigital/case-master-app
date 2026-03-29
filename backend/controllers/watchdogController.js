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

  const previousStatus = entity.cacPortalStatus?.portalStatus || null;
  const newStatus = result.success ? result.status : previousStatus;
  const statusChanged =
    result.success && newStatus && newStatus !== previousStatus;

  const BAD_STATUSES = [
    "INACTIVE",
    "STRUCK-OFF",
    "WOUND-UP",
    "DISSOLVED",
    "SUSPENDED",
  ];
  const GOOD_STATUSES = ["ACTIVE", "REGISTERED", "COMPLIANT"];

  // ✅ FIXED: declare these at function scope so they are accessible everywhere
  const isBadStatus = BAD_STATUSES.includes(newStatus);
  const isGoodStatus = GOOD_STATUSES.includes(newStatus);

  const updateData = {
    "cacPortalStatus.lastChecked": new Date(),
  };

  if (result.success) {
    updateData["cacPortalStatus.portalStatus"] = newStatus;
  }

  if (result.error) {
    updateData["cacPortalStatus.watchdogNotes"] = result.error;
  }

  // Auto-fill entity name from CAC if not set
  if (result.success && result.entityName && !entity.entityName) {
    updateData.entityName = result.entityName;
  }

  // ✅ FIXED: always set requiresAttention based on current status
  // even if no status change — this clears stale flags
  if (result.success) {
    if (isBadStatus) {
      updateData["cacPortalStatus.requiresAttention"] = true;
    } else if (isGoodStatus) {
      updateData["cacPortalStatus.requiresAttention"] = false;
    }
  }

  // ✅ FIXED: declare actionItems at function scope
  let newActionItems = [];

  if (statusChanged) {
    updateData["cacPortalStatus.previousPortalStatus"] = previousStatus;
    updateData["cacPortalStatus.statusChangedAt"] = new Date();

    if (isBadStatus) {
      updateData.isRevenueOpportunity = true;
      updateData.revenueOpportunityNote = `CAC status changed to ${newStatus} — urgent client contact needed`;
      updateData.statusChangeDetails = {
        changeDate: new Date(),
        previousStatus,
        newStatus,
        reason: `Status changed from ${previousStatus || "Unknown"} to ${newStatus}`,
      };
      updateData["revenueOpportunityDetails.serviceType"] =
        "status_restoration";
      updateData["revenueOpportunityDetails.leadScore"] = "hot";
      updateData["revenueOpportunityDetails.quoteStatus"] = "draft";

      // ✅ FIXED: assigned to function-scoped variable
      newActionItems = [
        {
          title: `Contact Client About ${newStatus} Status`,
          description: `${entity.entityName} (${entity.rcNumber}) is now ${newStatus}. Contact the client immediately.`,
          type: "contact_client",
          priority: "urgent",
          status: "pending",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Prepare Status Restoration Proposal",
          description: `Prepare a proposal for ${entity.entityName} status restoration including fees and timeline.`,
          type: "restore_status",
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];

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
              <div style="font-family: Arial, sans-serif; max-width: 600px;
                   margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #dc2626, #b91c1c);
                     padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">URGENT: Status Change</h1>
                </div>
                <div style="background: #fef2f2; padding: 30px;
                     border-radius: 0 0 10px 10px; border: 1px solid #fecaca;">
                  <p>Dear ${assignedLawyer.firstName},</p>
                  <p>CAC status changed for one of your monitored entities.</p>
                  <div style="background: white; border: 2px solid #dc2626;
                       border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p><strong>Entity:</strong> ${entity.entityName}</p>
                    <p><strong>RC/BN:</strong> ${entity.rcNumber}</p>
                    <p><strong>Previous:</strong> ${previousStatus || "Unknown"}</p>
                    <p style="color: #dc2626;"><strong>Current:</strong> ${newStatus}</p>
                    <p><strong>Client:</strong> ${client?.firstName || ""} ${client?.lastName || ""}</p>
                  </div>
                  <p>${firm?.name || "LawMaster"}</p>
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

  // ✅ FIXED: updateOps now correctly uses function-scoped variables
  const updateOps = { $set: updateData };
  if (newActionItems.length > 0) {
    updateOps.$push = { actionItems: { $each: newActionItems } };
  }

  // Ensure actionItems and clientOutreach arrays exist
  if (!entity.actionItems) {
    updateOps.$set.actionItems = [];
  }
  if (!entity.clientOutreach) {
    updateOps.$set.clientOutreach = {
      outreachMethod: "none",
      outreachNotes: "",
      clientAcknowledged: false,
      communicationTemplates: {},
      templatesSent: {},
    };
  }

  await ComplianceTracker.findByIdAndUpdate(entity._id, updateOps, {
    runValidators: false,
  });

  res.status(200).json({
    status: "success",
    data: {
      entityId: entity._id,
      entityName: entity.entityName,
      rcNumber: entity.rcNumber,
      previousStatus,
      currentStatus: newStatus,
      lastChecked: updateData["cacPortalStatus.lastChecked"],
      statusChanged,
      // ✅ FIXED: use computed isBadStatus not hardcoded true
      requiresAttention: result.success
        ? isBadStatus
        : entity.cacPortalStatus?.requiresAttention,
      checkResult: {
        success: result.success,
        error: result.error || null,
      },
    },
  });
});

// ─── Fix Existing Entities (initialize missing fields) ───────────────────────
exports.fixExistingEntities = catchAsync(async (req, res, next) => {
  const result = await ComplianceTracker.updateMany(
    {
      firmId: req.firmId,
      isDeleted: { $ne: true },
      $or: [
        { actionItems: { $exists: false } },
        { clientOutreach: { $exists: false } },
        { revenueOpportunityDetails: { $exists: false } },
      ],
    },
    {
      $set: {
        actionItems: [],
        clientOutreach: {
          outreachMethod: "none",
          outreachNotes: "",
          clientAcknowledged: false,
          communicationTemplates: {},
          templatesSent: {},
        },
        revenueOpportunityDetails: {
          serviceType: "status_restoration",
          quoteStatus: "none",
          leadScore: "warm",
        },
      },
    },
  );

  res.status(200).json({
    status: "success",
    message: `Fixed ${result.modifiedCount} entities`,
    data: result,
  });
});

// ─── Watchdog Report (all entities requiring attention) ────────────────────────
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
          "currentComplianceStatus actionItems clientOutreach revenueOpportunityDetails statusChangeDetails",
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

  if (!registrationNumber) {
    return next(
      new AppError("Registration number (RC/BN) is required", 400),
    );
  }

  const entityTypeMap = {
    ltd: "private-limited",
    plc: "public-limited",
    business_name: "business-name",
    bn: "business-name",
    incorporated_trustees: "incorporated-trustee",
    llp: "llp",
  };

  const mappedEntityType = entityTypeMap[entityType] || entityType || "private-limited";

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
  let cacEntityName = null;

  try {
    const result = await checkCacStatus(registrationNumber, mappedEntityType);
    if (result.success) {
      initialPortalStatus = result.status;
      cacEntityName = result.entityName;
    } else {
      initialWatchdogNotes = result.error
        ? `${notes || ""} | Initial check failed: ${result.error}`.trim()
        : notes;
    }
  } catch (error) {
    console.error("Initial CAC status check failed:", error.message);
    initialWatchdogNotes = result?.error
      ? `${notes || ""} | Initial check failed: ${result.error}`.trim()
      : `${notes || ""} | Initial check failed: ${error.message}`.trim();
  }

  // Use CAC entity name if not provided, or validate if both provided
  const finalEntityName = entityName || cacEntityName;
  if (!finalEntityName) {
    return res.status(400).json({
      success: false,
      message: "Could not determine entity name. Please provide it manually.",
      error: initialWatchdogNotes || "The CAC portal is currently unreachable or the browser failed to launch.",
    });
  }

  const entity = await ComplianceTracker.create({
    firmId: req.firmId,
    entityName: finalEntityName,
    rcNumber: registrationNumber,
    entityType: mappedEntityType,
    clientId,
    incorporationDate: incorporationDate || undefined,
    assignedTo: assignedTo || req.user._id,
    linkedMatterId: linkedMatterId || undefined,
    createdBy: req.user._id,
    trackingType: "watchdog",
    currentComplianceStatus: "unknown",
    cacPortalStatus: {
      portalStatus: initialPortalStatus,
      lastChecked: new Date(),
      requiresAttention: ["INACTIVE", "STRUCK-OFF", "WOUND-UP", "DISSOLVED", "SUSPENDED"].includes(
        initialPortalStatus,
      ),
      watchdogNotes: initialWatchdogNotes,
    },
    actionItems: [],
    clientOutreach: {
      outreachMethod: "none",
      outreachNotes: "",
      clientAcknowledged: false,
      communicationTemplates: {},
      templatesSent: {},
    },
    revenueOpportunityDetails: {
      serviceType: "status_restoration",
      quoteStatus: "none",
      leadScore: "warm",
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

// ─── Update Monitored Entity ─────────────────────────────────────────────────
exports.updateMonitoredEntity = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Monitored entity not found", 404));
  }

  const { clientId, assignedTo, entityName, notes } = req.body;

  const updateData = {};

  if (clientId !== undefined) updateData.clientId = clientId || null;
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
  if (entityName !== undefined) updateData.entityName = entityName;
  if (notes !== undefined) updateData.internalNotes = notes;

  await ComplianceTracker.findByIdAndUpdate(req.params.id, {
    $set: updateData,
  });

  const updatedEntity = await ComplianceTracker.findById(
    req.params.id,
  ).populate(POPULATE_FIELDS);

  res.status(200).json({
    status: "success",
    data: updatedEntity,
  });
});

// ─── Update Action Item ──────────────────────────────────────────────────────
exports.updateActionItem = catchAsync(async (req, res, next) => {
  const { entityId, actionItemId } = req.params;
  const { status, notes, dueDate } = req.body;

  const entity = await ComplianceTracker.findOne({
    _id: entityId,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  const actionItem = entity.actionItems.id(actionItemId);
  if (!actionItem) {
    return next(new AppError("Action item not found", 404));
  }

  const updateFields = { "actionItems.$.updatedAt": new Date() };

  if (status) {
    updateFields["actionItems.$.status"] = status;
    if (status === "completed") {
      updateFields["actionItems.$.completedAt"] = new Date();
      updateFields["actionItems.$.completedBy"] = req.user._id;
    }
  }
  if (notes !== undefined) updateFields["actionItems.$.notes"] = notes;
  if (dueDate) updateFields["actionItems.$.dueDate"] = new Date(dueDate);

  await ComplianceTracker.updateOne(
    { _id: entityId, "actionItems._id": actionItemId },
    { $set: updateFields },
  );

  const updatedEntity = await ComplianceTracker.findById(entityId);
  const updatedItem = updatedEntity.actionItems.id(actionItemId);

  res.status(200).json({
    status: "success",
    data: updatedItem,
  });
});

// ─── Add Action Item ─────────────────────────────────────────────────────────
exports.addActionItem = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.entityId,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  const { title, description, type, priority, assignedTo, dueDate } = req.body;

  const newActionItem = {
    title,
    description,
    type: type || "follow_up",
    priority: priority || "medium",
    status: "pending",
    assignedTo: assignedTo || undefined,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    createdAt: new Date(),
  };

  entity.actionItems.push(newActionItem);
  await entity.save();

  res.status(201).json({
    status: "success",
    data: entity.actionItems[entity.actionItems.length - 1],
  });
});

// ─── Update Client Outreach ──────────────────────────────────────────────────
exports.updateClientOutreach = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.entityId,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  const {
    outreachMethod,
    outreachNotes,
    clientAcknowledged,
    clientResponse,
    followUpDate,
    emailDraft,
    letterDraft,
    smsDraft,
  } = req.body;

  const updateData = {
    "clientOutreach.outreachDate": new Date(),
  };

  if (outreachMethod)
    updateData["clientOutreach.outreachMethod"] = outreachMethod;
  if (outreachNotes !== undefined)
    updateData["clientOutreach.outreachNotes"] = outreachNotes;
  if (clientAcknowledged !== undefined)
    updateData["clientOutreach.clientAcknowledged"] = clientAcknowledged;
  if (clientResponse !== undefined) {
    updateData["clientOutreach.clientResponse"] = clientResponse;
    updateData["clientOutreach.responseDate"] = new Date();
  }
  if (followUpDate)
    updateData["clientOutreach.followUpDate"] = new Date(followUpDate);
  if (emailDraft !== undefined)
    updateData["clientOutreach.communicationTemplates.emailDraft"] = emailDraft;
  if (letterDraft !== undefined)
    updateData["clientOutreach.communicationTemplates.letterDraft"] =
      letterDraft;
  if (smsDraft !== undefined)
    updateData["clientOutreach.communicationTemplates.smsDraft"] = smsDraft;

  await ComplianceTracker.findByIdAndUpdate(req.params.entityId, {
    $set: updateData,
  });

  const updatedEntity = await ComplianceTracker.findById(req.params.entityId);

  res.status(200).json({
    status: "success",
    data: updatedEntity.clientOutreach,
  });
});

// ─── Send Client Communication ───────────────────────────────────────────────
exports.sendClientCommunication = catchAsync(async (req, res, next) => {
  // ✅ FIXED: correct populate syntax
  const entity = await ComplianceTracker.findOne({
    _id: req.params.entityId,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  }).populate([
    { path: "clientId", select: "firstName lastName email phone" },
    { path: "assignedTo", select: "firstName lastName email" },
  ]);

  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  const { channel, templateType } = req.body;

  if (!entity.clientId?.email) {
    return next(
      new AppError(
        "No client email found. Please link a client to this entity first.",
        400,
      ),
    );
  }

  const templates = entity.clientOutreach?.communicationTemplates || {};
  let content =
    templates.emailDraft || templates.letterDraft || templates.smsDraft || "";

  const revenue = entity.revenueOpportunityDetails || {};
  const hasQuote = revenue.totalQuote && revenue.totalQuote > 0;

  if (!content || content === templates.emailDraft) {
    content = generateDefaultTemplate(
      entity,
      templateType || "email",
      hasQuote ? revenue : null,
    );
  }

  const subject = `Regarding ${entity.entityName} (${entity.rcNumber}) — CAC Status Update & Service Proposal`;

  try {
    await sendCustomEmail(
      subject,
      entity.clientId.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      content,
    );

    await ComplianceTracker.findByIdAndUpdate(req.params.entityId, {
      $set: {
        [`clientOutreach.communicationTemplates.${channel}Sent`]: true,
        [`clientOutreach.communicationTemplates.${channel}SentAt`]: new Date(),
        "clientOutreach.outreachMethod": channel,
        "clientOutreach.outreachDate": new Date(),
      },
    });

    res.status(200).json({
      status: "success",
      message: `Email sent to ${entity.clientId.email}`,
    });
  } catch (error) {
    return next(new AppError(`Failed to send email: ${error.message}`, 500));
  }
});

// ─── Update Revenue Opportunity ──────────────────────────────────────────────
exports.updateRevenueOpportunity = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.entityId,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  const {
    serviceType,
    estimatedFee,
    governmentFee,
    totalQuote,
    quoteSentDate,
    quoteExpiryDate,
    quoteStatus,
    leadScore,
    expectedCloseDate,
    wonDate,
    lostDate,
    lostReason,
  } = req.body;

  const updateData = {};

  if (serviceType)
    updateData["revenueOpportunityDetails.serviceType"] = serviceType;
  if (estimatedFee !== undefined)
    updateData["revenueOpportunityDetails.estimatedFee"] = estimatedFee;
  if (governmentFee !== undefined)
    updateData["revenueOpportunityDetails.governmentFee"] = governmentFee;
  if (totalQuote !== undefined)
    updateData["revenueOpportunityDetails.totalQuote"] = totalQuote;
  if (quoteSentDate)
    updateData["revenueOpportunityDetails.quoteSentDate"] = new Date(
      quoteSentDate,
    );
  if (quoteExpiryDate)
    updateData["revenueOpportunityDetails.quoteExpiryDate"] = new Date(
      quoteExpiryDate,
    );
  if (quoteStatus)
    updateData["revenueOpportunityDetails.quoteStatus"] = quoteStatus;
  if (leadScore) updateData["revenueOpportunityDetails.leadScore"] = leadScore;
  if (expectedCloseDate)
    updateData["revenueOpportunityDetails.expectedCloseDate"] = new Date(
      expectedCloseDate,
    );
  if (wonDate)
    updateData["revenueOpportunityDetails.wonDate"] = new Date(wonDate);
  if (lostDate)
    updateData["revenueOpportunityDetails.lostDate"] = new Date(lostDate);
  if (lostReason !== undefined)
    updateData["revenueOpportunityDetails.lostReason"] = lostReason;

  if (
    quoteStatus === "approved" &&
    !entity.revenueOpportunityDetails?.wonDate
  ) {
    updateData["revenueOpportunityDetails.wonDate"] = new Date();
  }
  if (
    quoteStatus === "rejected" &&
    !entity.revenueOpportunityDetails?.lostDate
  ) {
    updateData["revenueOpportunityDetails.lostDate"] = new Date();
  }

  await ComplianceTracker.findByIdAndUpdate(req.params.entityId, {
    $set: updateData,
  });

  const updatedEntity = await ComplianceTracker.findById(req.params.entityId);

  res.status(200).json({
    status: "success",
    data: updatedEntity.revenueOpportunityDetails,
  });
});

// ─── Helper: Generate Default Template ───────────────────────────────────────
function generateDefaultTemplate(entity, type, revenue) {
  const firmName = "LawMaster";
  const currentYear = new Date().getFullYear();
  const hasQuote = revenue && revenue.totalQuote && revenue.totalQuote > 0;

  const serviceTypeLabels = {
    status_restoration: "Status Restoration Service",
    annual_return_filing: "Annual Return Filing",
    compliance_filing: "Compliance Filing Service",
    name_change: "Name Change Service",
    amendment: "Amendment Service",
    other: "Professional Service",
  };

  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc2626; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ Urgent: CAC Status Update</h1>
      </div>
      <div style="background: #fef2f2; padding: 30px; border: 1px solid #fecaca; border-top: none;">
        <p>Dear ${entity.clientId?.firstName || "Valued Client"},</p>
        <p>We are writing to inform you about an <strong style="color: #dc2626;">important update</strong> regarding your company registration with the Corporate Affairs Commission (CAC).</p>
        
        <div style="background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">Company Details</h3>
          <p style="margin: 5px 0;"><strong>Company Name:</strong> ${entity.entityName}</p>
          <p style="margin: 5px 0;"><strong>RC/BN Number:</strong> ${entity.rcNumber}</p>
          <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="color: #dc2626; font-weight: bold;">${entity.cacPortalStatus?.portalStatus || "Unknown"}</span></p>
        </div>
        
        <p><strong>What does this mean?</strong></p>
        <p>When a company becomes inactive on the CAC register, it may face:</p>
        <ul>
          <li>Inability to open bank accounts or access credit</li>
          <li>Inability to enter into contracts</li>
          <li>Legal complications in business operations</li>
          <li>Potential involuntary dissolution</li>
        </ul>
        
        <p><strong>What can we do for you?</strong></p>
        <p>We specialize in CAC status restoration services. We can help restore your company to active status.</p>
        
        ${
          hasQuote
            ? `
        <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #059669;">📋 Service Proposal</h3>
          <p style="margin: 5px 0;"><strong>Service Type:</strong> ${serviceTypeLabels[revenue.serviceType] || revenue.serviceType || "Status Restoration"}</p>
          <p style="margin: 5px 0;"><strong>Professional Fee:</strong> ₦${(revenue.estimatedFee || 0).toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Government Fee:</strong> ₦${(revenue.governmentFee || 0).toLocaleString()}</p>
          <p style="margin: 10px 0; font-size: 18px;"><strong style="color: #059669;">Total Quote: ₦${revenue.totalQuote.toLocaleString()}</strong></p>
          ${revenue.quoteExpiryDate ? `<p style="margin: 5px 0; font-size: 12px; color: #666;">Quote valid until: ${new Date(revenue.quoteExpiryDate).toLocaleDateString()}</p>` : ""}
        </div>
        `
            : `
        <p><em>Contact us today for a free consultation and quote.</em></p>
        `
        }
        
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Contact our office to discuss this matter</li>
          <li>Provide required documents</li>
          <li>We'll handle the rest!</li>
        </ol>
        
        <p>We are committed to providing you with the best legal support for your business needs.</p>
        <p>Best regards,<br><strong>${firmName} Legal Team</strong></p>
        <p style="color: #666; font-size: 12px;">Phone: +234 XXX XXX XXXX | Email: info@lawmaster.com</p>
      </div>
      <div style="background: #1f2937; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; color: white; font-size: 12px;">
        &copy; ${currentYear} ${firmName}. All rights reserved.
      </div>
    </div>
  `;

  if (type === "sms") {
    if (hasQuote) {
      return `Dear ${entity.clientId?.firstName || "Client"}, your company ${entity.entityName} (${entity.rcNumber}) requires attention. We can help restore it. Quote: ₦${revenue.totalQuote.toLocaleString()}. Contact us for details. - ${firmName}`;
    }
    return `Dear Client, your company ${entity.entityName} (${entity.rcNumber}) requires immediate attention. Please contact us to discuss status restoration options. - ${firmName}`;
  }

  if (type === "letter") {
    let letterContent = `
LEGAL NOTICE

Date: ${new Date().toLocaleDateString()}

Dear ${entity.clientId?.firstName || "Client"},

RE: IMPORTANT UPDATE - ${entity.entityName} (${entity.rcNumber})

We write to inform you that our records indicate a change in the status of your company's registration with the Corporate Affairs Commission (CAC).

COMPANY DETAILS:
Company Name: ${entity.entityName}
Registration Number: ${entity.rcNumber}
Current Status: ${entity.cacPortalStatus?.portalStatus || "Unknown"}

IMPLICATIONS:
When a company becomes inactive, it may face difficulties including:
- Inability to open bank accounts or access credit
- Inability to enter into contracts
- Potential involuntary dissolution

SERVICE PROPOSAL:
${
  hasQuote
    ? `
Service Type: ${serviceTypeLabels[revenue.serviceType] || revenue.serviceType || "Status Restoration"}
Professional Fee: ₦${(revenue.estimatedFee || 0).toLocaleString()}
Government Fee: ₦${(revenue.governmentFee || 0).toLocaleString()}
Total Quote: ₦${revenue.totalQuote.toLocaleString()}
`
    : `
Contact our office for a consultation and quote.
`
}

We recommend immediate action to address this matter. Please contact our office within 7 days to discuss available options.

${firmName}
Date: ${new Date().toLocaleDateString()}
    `.trim();
    return letterContent;
  }

  return emailTemplate;
}
