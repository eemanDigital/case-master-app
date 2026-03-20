const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const ComplianceTracker = require("../models/complianceTrackerModel");
const User = require("../models/userModel");
const { sendCustomEmail } = require("../utils/email");
const Firm = require("../models/firmModel");

const POPULATE_FIELDS = [
  { path: "clientId", select: "firstName lastName email phone" },
  { path: "assignedTo", select: "firstName lastName email" },
  { path: "cacMatterId", select: "companyName rcNumber" },
];

exports.getAllTrackedEntities = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    entityType,
    currentComplianceStatus,
    clientId,
    isRevenueOpportunity,
    portalStatus,
    search,
  } = req.query;

  const query = {
    firmId: req.firmId,
    isDeleted: { $ne: true },
  };

  if (entityType) {
    query.entityType = entityType;
  }

  if (currentComplianceStatus) {
    query.currentComplianceStatus = currentComplianceStatus;
  }

  if (clientId) {
    query.clientId = clientId;
  }

  if (isRevenueOpportunity === "true") {
    query.isRevenueOpportunity = true;
  }

  if (portalStatus) {
    query["cacPortalStatus.portalStatus"] = portalStatus;
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
      .sort({ nextFilingDueDate: 1 })
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

exports.createTrackedEntity = catchAsync(async (req, res, next) => {
  const entityData = {
    ...req.body,
    firmId: req.firmId,
    createdBy: req.user._id,
  };

  if (entityData.incorporationDate && entityData.entityType) {
    const nextDueDate = ComplianceTracker.getNextFilingDueDate(
      entityData.entityType,
      entityData.incorporationDate,
      null
    );
    entityData.nextFilingDueDate = nextDueDate;

    entityData.annualReturns = [{
      year: nextDueDate.getFullYear(),
      dueDate: nextDueDate,
      filingDeadline: nextDueDate,
      status: "pending",
    }];
  }

  if (!entityData.penaltyTracking) {
    const penaltyRate = ComplianceTracker.getPenaltyRate(entityData.entityType);
    entityData.penaltyTracking = {
      monthlyPenaltyRate: penaltyRate,
      isPenaltyAccruing: false,
      currentPenaltyAmount: 0,
    };
  }

  const entity = new ComplianceTracker(entityData);
  await entity.save();

  await entity.populate(POPULATE_FIELDS);

  res.status(201).json({
    status: "success",
    data: entity,
  });
});

exports.getTrackedEntity = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  }).populate(POPULATE_FIELDS);

  if (!entity) {
    return next(new AppError("Tracked entity not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: entity,
  });
});

exports.updateTrackedEntity = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Tracked entity not found", 404));
  }

  const allowedUpdates = [
    "entityName",
    "bnNumber",
    "stateOfRegistration",
    "internalNotes",
    "assignedTo",
    "nextReminderDate",
    "isRevenueOpportunity",
    "revenueOpportunityNote",
    "revenueOpportunityAmount",
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      entity[field] = req.body[field];
    }
  });

  entity.updatedBy = req.user._id;
  await entity.save();

  await entity.populate(POPULATE_FIELDS);

  res.status(200).json({
    status: "success",
    data: entity,
  });
});

exports.markAnnualReturnFiled = catchAsync(async (req, res, next) => {
  const { year } = req.params;
  const { filedDate, receiptNumber, filingFee, notes } = req.body;

  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  }).populate(POPULATE_FIELDS);

  if (!entity) {
    return next(new AppError("Tracked entity not found", 404));
  }

  const annualReturn = entity.annualReturns.find(
    (ar) => ar.year === parseInt(year)
  );

  if (!annualReturn) {
    return next(new AppError(`Annual return for year ${year} not found`, 404));
  }

  const filingDate = filedDate ? new Date(filedDate) : new Date();
  const isLate = filingDate > new Date(annualReturn.dueDate);
  let latePenalty = 0;

  if (isLate) {
    const monthsLate = Math.max(1,
      Math.ceil((filingDate - new Date(annualReturn.dueDate)) / (30 * 24 * 60 * 60 * 1000))
    );
    latePenalty = ComplianceTracker.calculatePenalty(entity.entityType, monthsLate);
  }

  annualReturn.status = "filed";
  annualReturn.filedDate = filingDate;
  annualReturn.filedBy = req.user._id;
  annualReturn.receiptNumber = receiptNumber;
  annualReturn.filingFee = filingFee;
  annualReturn.latePenalty = latePenalty;
  annualReturn.totalPaid = (filingFee || 0) + latePenalty;
  annualReturn.notes = notes;

  entity.currentComplianceStatus = "compliant";
  entity.penaltyTracking.isPenaltyAccruing = false;
  entity.penaltyTracking.penaltyStartDate = null;
  entity.penaltyTracking.currentPenaltyAmount = 0;

  const nextYear = parseInt(year) + 1;
  const nextDueDate = ComplianceTracker.getNextFilingDueDate(
    entity.entityType,
    entity.incorporationDate,
    parseInt(year)
  );

  const existingNext = entity.annualReturns.find((ar) => ar.year === nextYear);
  if (!existingNext) {
    entity.annualReturns.push({
      year: nextYear,
      dueDate: nextDueDate,
      filingDeadline: nextDueDate,
      status: "pending",
    });
  }

  entity.nextFilingDueDate = nextDueDate;

  await entity.save();

  res.status(200).json({
    status: "success",
    message: "Annual return marked as filed",
    data: entity,
  });
});

exports.getLivePenaltyCalculation = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Tracked entity not found", 404));
  }

  if (!entity.penaltyTracking.isPenaltyAccruing || !entity.penaltyTracking.penaltyStartDate) {
    return res.status(200).json({
      status: "success",
      data: {
        isAccruing: false,
        monthsOverdue: 0,
        monthlyRate: entity.penaltyTracking.monthlyPenaltyRate,
        totalAccrued: 0,
        projectedNextMonth: entity.penaltyTracking.monthlyPenaltyRate,
      },
    });
  }

  const startDate = new Date(entity.penaltyTracking.penaltyStartDate);
  const now = new Date();

  const monthsOverdue = Math.max(0,
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())
  );

  const currentPenalty = entity.penaltyTracking.monthlyPenaltyRate * monthsOverdue;
  const nextMonthPenalty = entity.penaltyTracking.monthlyPenaltyRate * (monthsOverdue + 1);

  const nextIncrementDate = new Date(startDate);
  nextIncrementDate.setMonth(nextIncrementDate.getMonth() + monthsOverdue + 1);

  res.status(200).json({
    status: "success",
    data: {
      isAccruing: true,
      penaltyStartDate: entity.penaltyTracking.penaltyStartDate,
      monthsOverdue,
      monthlyRate: entity.penaltyTracking.monthlyPenaltyRate,
      totalAccrued: currentPenalty,
      projectedNextMonth: nextMonthPenalty,
      nextIncrementDate,
      dailyRate: entity.penaltyTracking.monthlyPenaltyRate / 30,
    },
  });
});

exports.getComplianceStats = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;

  const [
    totalTracked,
    statusCounts,
    penaltyExposure,
    revenueOpportunities,
  ] = await Promise.all([
    ComplianceTracker.countDocuments({ firmId, isDeleted: { $ne: true } }),
    ComplianceTracker.aggregate([
      { $match: { firmId, isDeleted: { $ne: true } } },
      { $group: { _id: "$currentComplianceStatus", count: { $sum: 1 } } },
    ]),
    ComplianceTracker.aggregate([
      {
        $match: {
          firmId,
          "penaltyTracking.isPenaltyAccruing": true,
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          totalExposure: { $sum: "$penaltyTracking.currentPenaltyAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
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
          totalValue: { $sum: "$revenueOpportunityAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalTracked,
      byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      totalPenaltyExposure: penaltyExposure[0]?.totalExposure || 0,
      penaltyCount: penaltyExposure[0]?.count || 0,
      revenueOpportunityCount: revenueOpportunities[0]?.count || 0,
      revenueOpportunityValue: revenueOpportunities[0]?.totalValue || 0,
    },
  });
});

exports.sendComplianceReminder = catchAsync(async (req, res, next) => {
  const { reminderType = "filing-reminder" } = req.body;

  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  }).populate(POPULATE_FIELDS);

  if (!entity) {
    return next(new AppError("Tracked entity not found", 404));
  }

  const client = await User.findById(entity.clientId);
  if (!client || !client.email) {
    return next(new AppError("Client email not found", 400));
  }

  const firm = await Firm.findById(req.firmId);
  const penaltyCalculation = entity.calculateCurrentPenalty();
  const monthlyRate = entity.penaltyTracking.monthlyPenaltyRate || 0;

  let subject = "";
  let emailBody = "";

  if (reminderType === "filing-reminder") {
    subject = `Action Required: ${entity.entityName} Annual Returns Due`;
    emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Annual Returns Reminder</h1>
        </div>
        <div style="background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fcd34d;">
          <p style="color: #374151; font-size: 16px;">Dear ${client.firstName},</p>
          <p style="color: #374151; font-size: 16px;">This is a reminder that the annual returns for <strong>${entity.entityName}</strong> (${entity.entityType}) are due on <strong>${entity.nextFilingDueDate?.toLocaleDateString("en-NG") || "TBD"}</strong>.</p>
          ${penaltyCalculation > 0 ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #dc2626; margin: 0; font-weight: bold;">Warning: Penalty is accruing!</p>
              <p style="color: #dc2626; margin: 10px 0 0;">Current penalty: <strong>₦${penaltyCalculation.toLocaleString()}</strong></p>
              <p style="color: #991b1b; margin: 5px 0 0; font-size: 14px;">₦${monthlyRate.toLocaleString()} per month</p>
            </div>
          ` : ""}
          <p style="color: #374151; font-size: 16px;">Please contact our office to schedule the filing of your annual returns.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">${firm?.name || "LawMaster"}</p>
        </div>
      </div>
    `;
  } else if (reminderType === "penalty-warning") {
    subject = `Urgent: Penalty Increasing for ${entity.entityName}`;
    emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Penalty Warning</h1>
        </div>
        <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fecaca;">
          <p style="color: #374151; font-size: 16px;">Dear ${client.firstName},</p>
          <div style="background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">CURRENT PENALTY</p>
            <p style="color: #dc2626; font-size: 36px; font-weight: bold; margin: 10px 0;">₦${penaltyCalculation.toLocaleString()}</p>
            <p style="color: #991b1b; margin: 0; font-size: 14px;">₦${monthlyRate.toLocaleString()} per month</p>
          </div>
          <p style="color: #374151; font-size: 16px;">Every day you wait costs you approximately <strong>₦${Math.round(monthlyRate / 30).toLocaleString()}</strong> in additional penalties.</p>
          <p style="color: #374151; font-size: 16px; margin-top: 20px;">Let us handle your filing today and stop the penalty from growing.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">${firm?.name || "LawMaster"}</p>
        </div>
      </div>
    `;
  }

  try {
    await sendCustomEmail(
      subject,
      client.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      emailBody
    );

    entity.notificationsSent.push({
      type: reminderType,
      sentAt: new Date(),
      sentTo: client.email,
      channel: "email",
      wasOpened: false,
      messagePreview: subject,
    });

    await entity.save();
  } catch (emailError) {
    console.error("Error sending reminder email:", emailError);
    return next(new AppError("Failed to send reminder email", 500));
  }

  res.status(200).json({
    status: "success",
    message: "Reminder sent successfully",
  });
});

exports.getRevenueOpportunities = catchAsync(async (req, res, next) => {
  const opportunities = await ComplianceTracker.find({
    firmId: req.firmId,
    isRevenueOpportunity: true,
    isDeleted: { $ne: true },
  })
    .populate(POPULATE_FIELDS)
    .sort({ revenueOpportunityAmount: -1 });

  const totalValue = opportunities.reduce(
    (sum, o) => sum + (o.revenueOpportunityAmount || 0),
    0
  );

  res.status(200).json({
    status: "success",
    data: opportunities,
    summary: {
      count: opportunities.length,
      totalValue,
    },
  });
});

exports.deleteTrackedEntity = catchAsync(async (req, res, next) => {
  const entity = await ComplianceTracker.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!entity) {
    return next(new AppError("Tracked entity not found", 404));
  }

  entity.isDeleted = true;
  entity.deletedAt = new Date();
  await entity.save();

  res.status(200).json({
    status: "success",
    message: "Entity removed from tracking",
  });
});

exports.createFromCacMatter = catchAsync(async (req, res, next) => {
  const { cacMatterId } = req.body;

  const CacMatter = require("../models/cacMatterModel");
  const cacMatter = await CacMatter.findOne({
    _id: cacMatterId,
    firmId: req.firmId,
  });

  if (!cacMatter) {
    return next(new AppError("CAC matter not found", 404));
  }

  if (cacMatter.status !== "completed") {
    return next(new AppError("CAC matter must be completed before creating compliance tracker", 400));
  }

  const existingTracker = await ComplianceTracker.findOne({
    firmId: req.firmId,
    rcNumber: cacMatter.rcNumber,
    isDeleted: { $ne: true },
  });

  if (existingTracker) {
    return next(new AppError("Compliance tracker already exists for this entity", 400));
  }

  const entityData = {
    firmId: req.firmId,
    clientId: cacMatter.clientId,
    cacMatterId: cacMatter._id,
    entityName: cacMatter.companyName,
    entityType: cacMatter.registrationType,
    rcNumber: cacMatter.rcNumber,
    bnNumber: cacMatter.bnNumber,
    incorporationDate: cacMatter.registrationDate || new Date(),
    createdBy: req.user._id,
    assignedTo: cacMatter.assignedTo,
  };

  const nextDueDate = ComplianceTracker.getNextFilingDueDate(
    entityData.entityType,
    entityData.incorporationDate,
    null
  );

  entityData.nextFilingDueDate = nextDueDate;
  entityData.annualReturns = [{
    year: nextDueDate.getFullYear(),
    dueDate: nextDueDate,
    filingDeadline: nextDueDate,
    status: "pending",
  }];

  const penaltyRate = ComplianceTracker.getPenaltyRate(entityData.entityType);
  entityData.penaltyTracking = {
    monthlyPenaltyRate: penaltyRate,
    isPenaltyAccruing: false,
    currentPenaltyAmount: 0,
  };

  const entity = new ComplianceTracker(entityData);
  await entity.save();

  await entity.populate(POPULATE_FIELDS);

  res.status(201).json({
    status: "success",
    data: entity,
  });
});
