const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const {
  RetainerDetail,
  GeneralDetail,
} = require("../models/retainerAndGeneralDetailModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { GenericPdfGenerator, formatDate } = require("../utils/generateGenericPdf");
const path = require("path");

// Initialize pagination services
const matterPaginationService = PaginationServiceFactory.createService(
  Matter,
  modelConfigs.Matter,
);

const retainerDetailPaginationService = PaginationServiceFactory.createService(
  RetainerDetail,
  modelConfigs.RetainerDetail,
);

// ============================================
// RETAINER MATTERS LISTING & PAGINATION
// ============================================

exports.getAllRetainerMatters = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    sort = "-agreementStartDate",
    populate,
    select,
    debug,
    includeStats,
    retainerType,
    status,
    expiringInDays,
    search,
    includeDeleted,
    onlyDeleted,
  } = req.query;

  const customFilter = { matterType: "retainer" };

  // Handle expiring filter - FIXED to match new schema
  if (expiringInDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(expiringInDays));

    const expiringRetainers = await RetainerDetail.find({
      firmId: req.firmId,
      agreementEndDate: { $gte: new Date(), $lte: futureDate },
    })
      .select("matterId")
      .lean();

    customFilter._id =
      expiringRetainers.length > 0
        ? { $in: expiringRetainers.map((r) => r.matterId) }
        : { $in: [] };
  }

  const result = await matterPaginationService.paginate(
    {
      page,
      limit,
      sort,
      populate,
      select,
      debug,
      includeStats,
      status,
      search,
      includeDeleted,
      onlyDeleted,
      retainerType,
    },
    customFilter,
    req.firmId,
  );

  // Enhance with retainer details
  if (
    result.data.length > 0 &&
    (!populate || !populate.includes("retainerDetail"))
  ) {
    const matterIds = result.data.map((matter) => matter._id);
    const retainerDetails = await RetainerDetail.find({
      matterId: { $in: matterIds },
      firmId: req.firmId,
    }).lean();

    const detailsMap = retainerDetails.reduce((map, detail) => {
      map[detail.matterId.toString()] = detail;
      return map;
    }, {});

    result.data = result.data.map((matter) => ({
      ...matter,
      retainerDetail: detailsMap[matter._id.toString()] || null,
    }));
  }

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.searchRetainerMatters = catchAsync(async (req, res, next) => {
  const { criteria = {}, options = {} } = req.body;

  const firmCriteria = {
    ...criteria,
    firmId: req.firmId,
    matterType: "retainer",
  };

  const result = await matterPaginationService.advancedSearch(
    firmCriteria,
    options,
    req.firmId,
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// RETAINER DETAILS MANAGEMENT - FIXED FOR NEW SCHEMA
// ============================================

exports.createRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const retainerData = req.body;

  // 1. Verify matter exists
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  if (matter.matterType !== "retainer") {
    return next(new AppError("Matter is not a retainer matter", 400));
  }

  // 2. Check if retainer details already exist
  const existingDetail = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (existingDetail) {
    return next(
      new AppError("Retainer details already exist for this matter", 400),
    );
  }

  // 3. Create retainer detail with proper schema structure
  const retainerDetail = new RetainerDetail({
    matterId,
    firmId: req.firmId,
    createdBy: req.user._id,

    // Map data to new schema structure
    retainerType: retainerData.retainerType,
    agreementStartDate: retainerData.agreementStartDate,
    agreementEndDate: retainerData.agreementEndDate,
    autoRenewal: retainerData.autoRenewal || false,
    renewalTerms: retainerData.renewalTerms,

    servicesIncluded: retainerData.servicesIncluded || [],
    scopeDescription: retainerData.scopeDescription,
    exclusions: retainerData.exclusions || [],

    // Billing structure - FIXED to match new schema
    billing: {
      retainerFee:
        retainerData.retainerFee || retainerData.billing?.retainerFee,
      currency:
        retainerData.currency || retainerData.billing?.currency || "NGN",
      frequency: retainerData.frequency || retainerData.billing?.frequency,
      vatRate: retainerData.vatRate || retainerData.billing?.vatRate || 7.5,
      applyVAT:
        retainerData.applyVAT || retainerData.billing?.applyVAT !== false,
      applyWHT:
        retainerData.applyWHT || retainerData.billing?.applyWHT !== false,
      whtRate: retainerData.whtRate || retainerData.billing?.whtRate || 5,
      additionalFees:
        retainerData.additionalFees || retainerData.billing?.additionalFees,
      billingCap: retainerData.billingCap || retainerData.billing?.billingCap,
    },

    disbursements: retainerData.disbursements || [],

    responseTimes: retainerData.responseTimes,
    meetingSchedule: retainerData.meetingSchedule,
    reportingRequirements: retainerData.reportingRequirements,

    activityLog: retainerData.activityLog || [],
    requests: retainerData.requests || [],

    courtAppearances: retainerData.courtAppearances || [],

    requiresNBAStamp: retainerData.requiresNBAStamp || false,
    nbaStampDetails: retainerData.nbaStampDetails,

    terminationClause: retainerData.terminationClause || {
      noticePeriod: { value: 30, unit: "days" },
      conditions: "",
    },
  });

  await retainerDetail.save();

  // 4. Update matter to link retainer detail
  matter.retainerDetail = retainerDetail._id;
  matter.expectedClosureDate = retainerDetail.agreementEndDate;
  await matter.save();

  // 5. Populate and return
  const populatedDetail = await RetainerDetail.findById(
    retainerDetail._id,
  ).populate({
    path: "matterId",
    select: "matterNumber title client accountOfficer status priority",
    populate: [
      { path: "client", select: "firstName lastName email phone" },
      { path: "accountOfficer", select: "firstName lastName email photo" },
    ],
  });

  res.status(201).json({
    status: "success",
    data: {
      retainerDetail: populatedDetail,
    },
  });
});

exports.getRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
  })
    .populate({
      path: "matterId",
      select:
        "matterNumber title client accountOfficer status priority dateOpened",
      populate: [
        { path: "client", select: "firstName lastName email phone address" },
        {
          path: "accountOfficer",
          select: "firstName lastName email photo role",
        },
      ],
    })
    .populate("createdBy", "firstName lastName")
    .populate("lastModifiedBy", "firstName lastName");

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
    },
  });
});

exports.updateRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  // Transform data for proper schema structure
  const transformedData = { ...updateData, lastModifiedBy: req.user._id };

  // Handle billing transformation
  if (
    updateData.billing ||
    updateData.retainerFee ||
    updateData.currency ||
    updateData.frequency
  ) {
    transformedData.billing = {
      ...(updateData.billing || {}),
      retainerFee: updateData.retainerFee || updateData.billing?.retainerFee,
      currency: updateData.currency || updateData.billing?.currency || "NGN",
      frequency: updateData.frequency || updateData.billing?.frequency,
      vatRate: updateData.vatRate || updateData.billing?.vatRate || 7.5,
      applyVAT: updateData.applyVAT ?? updateData.billing?.applyVAT ?? true,
      applyWHT: updateData.applyWHT ?? updateData.billing?.applyWHT ?? true,
      whtRate: updateData.whtRate || updateData.billing?.whtRate || 5,
    };

    // Remove old fields
    delete transformedData.retainerFee;
    delete transformedData.currency;
    delete transformedData.frequency;
    delete transformedData.vatRate;
    delete transformedData.applyVAT;
    delete transformedData.applyWHT;
    delete transformedData.whtRate;
  }

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    transformedData,
    { new: true, runValidators: true },
  ).populate({
    path: "matterId",
    select: "matterNumber title client accountOfficer",
    populate: [
      { path: "client", select: "firstName lastName email" },
      { path: "accountOfficer", select: "firstName lastName email" },
    ],
  });

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
    },
  });
});

exports.deleteRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user._id,
    },
    { new: true },
  );

  if (!retainerDetail) {
    return next(
      new AppError("Retainer details not found or already deleted", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: null,
    message: "Retainer details deleted successfully",
  });
});

exports.restoreRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    { new: true },
  );

  if (!retainerDetail) {
    return next(
      new AppError("No deleted retainer details found to restore", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
    },
  });
});

// ============================================
// SERVICES MANAGEMENT - FIXED FOR NIGERIAN MODEL
// ============================================

exports.addService = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const serviceData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        servicesIncluded: {
          ...serviceData,
          addedBy: req.user._id,
          addedAt: new Date(),
          // Nigerian billing model - units instead of hours
          serviceLimit: serviceData.serviceLimit || 0,
          usageCount: serviceData.usageCount || 0,
          unitDescription: serviceData.unitDescription || "matters/filings",
          billingModel: serviceData.billingModel || "within-retainer",
          lproScale: serviceData.lproScale || "N/A",
          lproReference: serviceData.lproReference,
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      newService:
        retainerDetail.servicesIncluded[
          retainerDetail.servicesIncluded.length - 1
        ],
    },
  });
});

// ✅ FIXED - Proper array element update for Nigerian service model
exports.updateService = catchAsync(async (req, res, next) => {
  const { matterId, serviceId } = req.params;
  const updateData = req.body;

  // Build $set object with proper field paths
  const setObject = { lastModifiedBy: req.user._id };

  Object.keys(updateData).forEach((key) => {
    setObject[`servicesIncluded.$.${key}`] = updateData[key];
  });

  setObject["servicesIncluded.$.updatedBy"] = req.user._id;
  setObject["servicesIncluded.$.updatedAt"] = new Date();

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "servicesIncluded._id": serviceId,
    },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Service not found", 404));
  }

  const updatedService = retainerDetail.servicesIncluded.id(serviceId);

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      updatedService,
    },
  });
});

exports.removeService = catchAsync(async (req, res, next) => {
  const { matterId, serviceId } = req.params;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { servicesIncluded: { _id: serviceId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details or service not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      message: "Service removed successfully",
    },
  });
});

// ✅ FIXED - Updated for Nigerian units model (replaces hours)
exports.updateServiceUsage = catchAsync(async (req, res, next) => {
  const { matterId, serviceId } = req.params;
  const { usageCount, serviceLimit, unitDescription } = req.body;

  const updateObject = { lastModifiedBy: req.user._id };

  if (usageCount !== undefined) {
    updateObject["servicesIncluded.$.usageCount"] = usageCount;
    updateObject["servicesIncluded.$.usageUpdatedBy"] = req.user._id;
    updateObject["servicesIncluded.$.usageUpdatedAt"] = new Date();
  }
  if (serviceLimit !== undefined) {
    updateObject["servicesIncluded.$.serviceLimit"] = serviceLimit;
  }
  if (unitDescription !== undefined) {
    updateObject["servicesIncluded.$.unitDescription"] = unitDescription;
  }

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "servicesIncluded._id": serviceId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Service not found", 404));
  }

  const updatedService = retainerDetail.servicesIncluded.id(serviceId);

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      updatedService,
    },
  });
});

// ============================================
// DISBURSEMENTS MANAGEMENT - NEW FOR NIGERIAN MODEL
// ============================================

exports.addDisbursement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const disbursementData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        disbursements: {
          ...disbursementData,
          incurredDate: disbursementData.incurredDate || new Date(),
          addedBy: req.user._id,
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      newDisbursement:
        retainerDetail.disbursements[retainerDetail.disbursements.length - 1],
    },
  });
});

exports.updateDisbursement = catchAsync(async (req, res, next) => {
  const { matterId, disbursementId } = req.params;
  const updateData = req.body;

  const setObject = { lastModifiedBy: req.user._id };

  Object.keys(updateData).forEach((key) => {
    setObject[`disbursements.$.${key}`] = updateData[key];
  });

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "disbursements._id": disbursementId,
    },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Disbursement not found", 404));
  }

  const updatedDisbursement = retainerDetail.disbursements.id(disbursementId);

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      updatedDisbursement,
    },
  });
});

exports.deleteDisbursement = catchAsync(async (req, res, next) => {
  const { matterId, disbursementId } = req.params;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { disbursements: { _id: disbursementId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!retainerDetail) {
    return next(
      new AppError("Retainer details or disbursement not found", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      message: "Disbursement removed successfully",
    },
  });
});

// ============================================
// COURT APPEARANCES MANAGEMENT - NEW
// ============================================

exports.addCourtAppearance = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const appearanceData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        courtAppearances: {
          ...appearanceData,
          addedBy: req.user._id,
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      newAppearance:
        retainerDetail.courtAppearances[
          retainerDetail.courtAppearances.length - 1
        ],
    },
  });
});

// ============================================
// ACTIVITY LOG MANAGEMENT - NEW
// ============================================

exports.logActivity = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { description, serviceType, unitsConsumed = 1 } = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        activityLog: {
          description,
          serviceType,
          unitsConsumed,
          performedBy: req.user._id,
          actionDate: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      newActivity:
        retainerDetail.activityLog[retainerDetail.activityLog.length - 1],
    },
  });
});

// ============================================
// CLIENT REQUESTS MANAGEMENT - UPDATED
// ============================================

exports.addRequest = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const requestData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        requests: {
          ...requestData,
          requestDate: new Date(),
          addedBy: req.user._id,
          status: requestData.status || "pending",
          priority: requestData.priority || "normal",
        },
      },
      $inc: { totalRequestsHandled: 1 },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      newRequest: retainerDetail.requests[retainerDetail.requests.length - 1],
    },
  });
});

// ✅ FIXED - Proper array element update
exports.updateRequest = catchAsync(async (req, res, next) => {
  const { matterId, requestId } = req.params;
  const updateData = req.body;

  const setObject = { lastModifiedBy: req.user._id };

  Object.keys(updateData).forEach((key) => {
    setObject[`requests.$.${key}`] = updateData[key];
  });

  setObject["requests.$.updatedBy"] = req.user._id;
  setObject["requests.$.updatedAt"] = new Date();

  if (updateData.status === "completed") {
    setObject["requests.$.completedAt"] = updateData.completedAt || new Date();
  }

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "requests._id": requestId,
    },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Request not found", 404));
  }

  const updatedRequest = retainerDetail.requests.id(requestId);

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      updatedRequest,
    },
  });
});

exports.deleteRequest = catchAsync(async (req, res, next) => {
  const { matterId, requestId } = req.params;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { requests: { _id: requestId } },
      $inc: { totalRequestsHandled: -1 },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details or request not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      message: "Request removed successfully",
    },
  });
});

// ============================================
// REPORTS & ANALYTICS - UPDATED FOR NIGERIAN MODEL
// ============================================

exports.getRetainerSummary = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
  })
    .populate({
      path: "matterId",
      select: "matterNumber title client",
      populate: {
        path: "client",
        select: "firstName lastName email companyName",
      },
    })
    .populate("accountOfficer", "firstName lastName email");

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  // Calculate usage summary based on Nigerian model
  const usageSummary = retainerDetail.servicesIncluded.map((service) => ({
    serviceType: service.serviceType,
    description: service.description,
    billingModel: service.billingModel,
    serviceLimit: service.serviceLimit || 0,
    usageCount: service.usageCount || 0,
    unitsRemaining: (service.serviceLimit || 0) - (service.usageCount || 0),
    utilizationRate:
      service.serviceLimit > 0
        ? ((service.usageCount / service.serviceLimit) * 100).toFixed(2)
        : "0.00",
    unitDescription: service.unitDescription || "units",
    lproScale: service.lproScale,
  }));

  const totalServices = retainerDetail.servicesIncluded.length;
  const totalUnitsAllocated = retainerDetail.servicesIncluded.reduce(
    (sum, s) => sum + (s.serviceLimit || 0),
    0,
  );
  const totalUnitsUsed = retainerDetail.servicesIncluded.reduce(
    (sum, s) => sum + (s.usageCount || 0),
    0,
  );
  const overallUtilizationRate =
    totalUnitsAllocated > 0 ? (totalUnitsUsed / totalUnitsAllocated) * 100 : 0;

  // Calculate financial summary
  const taxSummary = retainerDetail.totalWithTax;

  res.status(200).json({
    status: "success",
    data: {
      matter: retainerDetail.matterId,
      accountOfficer: retainerDetail.accountOfficer,
      services: usageSummary,
      totals: {
        services: totalServices,
        unitsAllocated: totalUnitsAllocated,
        unitsUsed: totalUnitsUsed,
        unitsRemaining: totalUnitsAllocated - totalUnitsUsed,
        utilizationRate: overallUtilizationRate.toFixed(2),
        utilizationStatus:
          overallUtilizationRate >= 80
            ? "high"
            : overallUtilizationRate >= 50
              ? "moderate"
              : "low",
      },
      financial: taxSummary,
      disbursements: {
        total: retainerDetail.totalDisbursements || 0,
        items: retainerDetail.disbursements || [],
      },
      retainerPeriod: {
        startDate: retainerDetail.agreementStartDate,
        endDate: retainerDetail.agreementEndDate,
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (retainerDetail.agreementEndDate - new Date()) /
              (1000 * 60 * 60 * 24),
          ),
        ),
      },
      performance: {
        totalRequests: retainerDetail.totalRequestsHandled || 0,
        pendingRequests: retainerDetail.requests.filter(
          (r) => r.status === "pending",
        ).length,
        courtAppearances: retainerDetail.courtAppearances?.length || 0,
        activitiesLogged: retainerDetail.activityLog?.length || 0,
      },
    },
  });
});

// ============================================
// NBA STAMP MANAGEMENT - NEW
// ============================================

exports.updateNBAStamp = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { stampNumber, stampDate, stampValue } = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      requiresNBAStamp: true,
      nbaStampDetails: {
        stampNumber,
        stampDate: stampDate || new Date(),
        stampValue,
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
      nbaStampDetails: retainerDetail.nbaStampDetails,
    },
  });
});

// ============================================
// RETAINER RENEWAL & TERMINATION - UPDATED
// ============================================

exports.renewRetainer = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { newEndDate, retainerFee, servicesIncluded, renewalNotes } = req.body;

  // Get current retainer
  const currentRetainer = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!currentRetainer) {
    return next(new AppError("Retainer details not found", 404));
  }

  // Archive current retainer
  currentRetainer.isArchived = true;
  currentRetainer.archivedAt = new Date();
  currentRetainer.archivedBy = req.user._id;
  currentRetainer.renewalNotes = renewalNotes;
  await currentRetainer.save();

  // Calculate new end date
  const endDate =
    newEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // Create new retainer detail
  const newRetainerDetail = new RetainerDetail({
    matterId,
    firmId: req.firmId,
    retainerType: currentRetainer.retainerType,
    agreementStartDate: new Date(),
    agreementEndDate: endDate,
    servicesIncluded:
      servicesIncluded ||
      currentRetainer.servicesIncluded.map((s) => ({
        ...s.toObject(),
        usageCount: 0, // Reset usage for new term
      })),
    scopeDescription: currentRetainer.scopeDescription,
    billing: currentRetainer.billing,
    disbursements: [],
    responseTimes: currentRetainer.responseTimes,
    meetingSchedule: currentRetainer.meetingSchedule,
    reportingRequirements: currentRetainer.reportingRequirements,
    terminationClause: currentRetainer.terminationClause,
    previousRetainerId: currentRetainer._id,
    renewalNotes,
    createdBy: req.user._id,
  });

  await newRetainerDetail.save();

  // Update matter
  const matter = await Matter.findOneAndUpdate(
    {
      _id: matterId,
      firmId: req.firmId,
      matterType: "retainer",
      isDeleted: false,
    },
    {
      status: "active",
      expectedClosureDate: newRetainerDetail.agreementEndDate,
      retainerDetail: newRetainerDetail._id,
      lastModifiedBy: req.user._id,
      lastActivityDate: new Date(),
    },
    { new: true },
  );

  if (!matter) {
    return next(new AppError("Retainer matter not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Retainer renewed successfully",
    data: {
      previousRetainer: currentRetainer,
      newRetainer: newRetainerDetail,
      matter,
    },
  });
});

exports.terminateRetainer = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { terminationReason, terminationDate, terminationNotes } = req.body;

  // Update retainer detail
  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      agreementEndDate: terminationDate || new Date(),
      terminationReason,
      terminationDate: terminationDate || new Date(),
      terminationNotes,
      terminatedBy: req.user._id,
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  // Update matter status
  const matter = await Matter.findOneAndUpdate(
    {
      _id: matterId,
      firmId: req.firmId,
      matterType: "retainer",
      isDeleted: false,
    },
    {
      status: "terminated",
      actualClosureDate: retainerDetail.agreementEndDate,
      terminationReason,
      lastModifiedBy: req.user._id,
      lastActivityDate: new Date(),
    },
    { new: true },
  );

  if (!matter) {
    return next(new AppError("Retainer matter not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Retainer terminated successfully",
    data: {
      retainerDetail,
      matter,
    },
  });
});

// ============================================
// GENERAL DETAILS MANAGEMENT (Non-Retainer)
// ============================================

exports.createGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const generalData = req.body;

  // 1. Verify matter exists
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  // 2. Check if general details already exist
  const existingDetail = await GeneralDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (existingDetail) {
    return next(
      new AppError("General details already exist for this matter", 400),
    );
  }

  // 3. Create general detail
  const generalDetail = new GeneralDetail({
    matterId,
    firmId: req.firmId,
    createdBy: req.user._id,
    ...generalData,
  });

  await generalDetail.save();

  res.status(201).json({
    status: "success",
    data: {
      generalDetail,
    },
  });
});

exports.getGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const generalDetail = await GeneralDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).populate({
    path: "matterId",
    select: "matterNumber title client accountOfficer",
    populate: [
      { path: "client", select: "firstName lastName email phone" },
      { path: "accountOfficer", select: "firstName lastName email" },
    ],
  });

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
    },
  });
});

// ============================================
// STATISTICS & DASHBOARD - UPDATED
// ============================================

exports.getRetainerStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false, isArchived: false };

  const [
    overviewStats,
    byType,
    requestsStats,
    serviceUtilization,
    revenueStats,
    expiringSoon,
    disbursementStats,
  ] = await Promise.all([
    Matter.aggregate([
      {
        $match: {
          firmId: req.firmId,
          matterType: "retainer",
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalRetainerMatters: { $sum: 1 },
          activeRetainerMatters: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          pendingRetainerMatters: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          terminatedRetainerMatters: {
            $sum: { $cond: [{ $eq: ["$status", "terminated"] }, 1, 0] },
          },
          expiredRetainerMatters: {
            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
          },
        },
      },
    ]),

    RetainerDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: "$retainerType",
          count: { $sum: 1 },
          totalMonthlyRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$billing.frequency", "monthly"] },
                "$billing.retainerFee",
                {
                  $cond: [
                    { $eq: ["$billing.frequency", "quarterly"] },
                    { $divide: ["$billing.retainerFee", 3] },
                    { $divide: ["$billing.retainerFee", 12] },
                  ],
                },
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),

    RetainerDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$requests" },
      {
        $group: {
          _id: "$requests.status",
          count: { $sum: 1 },
          avgResponseTime: { $avg: "$requests.responseTimeHours" },
        },
      },
    ]),

    RetainerDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$servicesIncluded" },
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: "$servicesIncluded.serviceLimit" },
          totalUsed: { $sum: "$servicesIncluded.usageCount" },
          avgUtilization: {
            $avg: {
              $cond: [
                { $gt: ["$servicesIncluded.serviceLimit", 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        "$servicesIncluded.usageCount",
                        "$servicesIncluded.serviceLimit",
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]),

    RetainerDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: null,
          totalMonthlyRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$billing.frequency", "monthly"] },
                "$billing.retainerFee",
                {
                  $cond: [
                    { $eq: ["$billing.frequency", "quarterly"] },
                    { $divide: ["$billing.retainerFee", 3] },
                    { $divide: ["$billing.retainerFee", 12] },
                  ],
                },
              ],
            },
          },
          totalAnnualRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$billing.frequency", "monthly"] },
                { $multiply: ["$billing.retainerFee", 12] },
                {
                  $cond: [
                    { $eq: ["$billing.frequency", "quarterly"] },
                    { $multiply: ["$billing.retainerFee", 4] },
                    "$billing.retainerFee",
                  ],
                },
              ],
            },
          },
          avgRetainerValue: { $avg: "$billing.retainerFee" },
        },
      },
    ]),

    RetainerDetail.countDocuments({
      ...firmQuery,
      agreementEndDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),

    RetainerDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: null,
          totalDisbursements: { $sum: "$totalDisbursements" },
          avgDisbursements: { $avg: "$totalDisbursements" },
        },
      },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      overview: overviewStats[0] || {
        totalRetainerMatters: 0,
        activeRetainerMatters: 0,
        pendingRetainerMatters: 0,
        terminatedRetainerMatters: 0,
        expiredRetainerMatters: 0,
      },
      byType,
      requests: requestsStats,
      serviceUtilization: serviceUtilization[0] || {
        totalAllocated: 0,
        totalUsed: 0,
        avgUtilization: 0,
      },
      revenue: revenueStats[0] || {
        totalMonthlyRevenue: 0,
        totalAnnualRevenue: 0,
        avgRetainerValue: 0,
      },
      disbursements: disbursementStats[0] || {
        totalDisbursements: 0,
        avgDisbursements: 0,
      },
      expiringSoon: expiringSoon || 0,
    },
  });
});

exports.getExpiringRetainers = catchAsync(async (req, res, next) => {
  const { days = 30, page = 1, limit = 20 } = req.query;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Number(days));

  const skip = (page - 1) * limit;

  const retainerDetails = await RetainerDetail.find({
    firmId: req.firmId,
    isDeleted: false,
    isArchived: false,
    agreementEndDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
  })
    .populate({
      path: "matterId",
      select: "matterNumber title client accountOfficer status priority",
      match: { isDeleted: false },
      populate: [
        {
          path: "client",
          select: "firstName lastName email phone companyName",
        },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    })
    .sort({ agreementEndDate: 1 })
    .skip(skip)
    .limit(Number(limit));

  const filtered = retainerDetails.filter((detail) => detail.matterId);

  const total = await RetainerDetail.countDocuments({
    firmId: req.firmId,
    isDeleted: false,
    isArchived: false,
    agreementEndDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
  });

  const retainersWithDaysRemaining = filtered.map((detail) => ({
    ...detail.toObject(),
    daysRemaining: Math.ceil(
      (detail.agreementEndDate - new Date()) / (1000 * 60 * 60 * 24),
    ),
  }));

  res.status(200).json({
    status: "success",
    results: filtered.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: {
      retainers: retainersWithDaysRemaining,
    },
  });
});

exports.getPendingRequests = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const retainerDetails = await RetainerDetail.find({
    firmId: req.firmId,
    isDeleted: false,
    isArchived: false,
    "requests.status": "pending",
  })
    .populate({
      path: "matterId",
      select: "matterNumber title client accountOfficer priority",
      match: { isDeleted: false },
      populate: [
        { path: "client", select: "firstName lastName email companyName" },
        { path: "accountOfficer", select: "firstName lastName email" },
      ],
    })
    .sort({ "requests.requestDate": 1 })
    .skip(skip)
    .limit(Number(limit));

  const filtered = retainerDetails.filter((detail) => detail.matterId);

  const pendingRequests = [];
  filtered.forEach((detail) => {
    detail.requests.forEach((request) => {
      if (request.status === "pending") {
        pendingRequests.push({
          ...request.toObject(),
          matter: detail.matterId,
          matterId: detail.matterId,
          retainerDetailId: detail._id,
        });
      }
    });
  });

  const total = await RetainerDetail.countDocuments({
    firmId: req.firmId,
    isDeleted: false,
    isArchived: false,
    "requests.status": "pending",
  });

  res.status(200).json({
    status: "success",
    results: pendingRequests.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: {
      pendingRequests,
    },
  });
});

exports.bulkUpdateRetainerMatters = catchAsync(async (req, res, next) => {
  const { matterIds, updates } = req.body;

  if (!matterIds || !Array.isArray(matterIds) || matterIds.length === 0) {
    return next(new AppError("Please provide matter IDs to update", 400));
  }

  if (!updates || Object.keys(updates).length === 0) {
    return next(new AppError("Please provide updates to apply", 400));
  }

  const result = await Matter.updateMany(
    {
      _id: { $in: matterIds },
      firmId: req.firmId,
      matterType: "retainer",
    },
    {
      ...updates,
      lastModifiedBy: req.user._id,
      lastActivityDate: Date.now(),
    },
    { runValidators: true },
  );

  res.status(200).json({
    status: "success",
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    },
  });
});

// ============================================
// RETAINER REPORT PDF GENERATION
// ============================================

/**
 * @desc    Generate retainer report PDF
 * @route   GET /api/retainers/:matterId/report
 * @access  Private
 */
exports.generateRetainerReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "retainer",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No retainer matter found with that ID", 404));
  }

  const retainerDetails = await RetainerDetail.findOne({ matterId, firmId });
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Retainer Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
  });

  pdf.init(res, path.resolve(__dirname, `../output/${matter.matterNumber}_retainer_report_${Date.now()}.pdf`));

  // Firm Information
  pdf.addSection("Firm Information");
  pdf.addField("Firm Name", firm?.name);
  pdf.addField("Email", firm?.email);
  pdf.addField("Phone", firm?.phone);
  pdf.addField("Address", firm?.address);

  // Matter Information
  pdf.addSection("Matter Information");
  pdf.addField("Matter Number", matter?.matterNumber);
  pdf.addField("Title", matter?.title);
  pdf.addStatusField("Status", matter?.status);
  pdf.addStatusField("Priority", matter?.priority);
  pdf.addField("Date Opened", formatDate(matter?.dateOpened));
  pdf.addField("Client", matter?.client ? `${matter.client.firstName} ${matter.client.lastName}` : null);
  if (matter?.client?.companyName) pdf.addField("Company", matter.client.companyName);
  if (matter?.client?.email) pdf.addField("Client Email", matter.client.email);
  if (matter?.client?.phone) pdf.addField("Client Phone", matter.client.phone);
  if (matter?.accountOfficer) pdf.addField("Account Officer", `${matter.accountOfficer.firstName} ${matter.accountOfficer.lastName}`);

  // Retainer Details
  if (retainerDetails) {
    // Agreement Details
    pdf.addSection("Retainer Agreement");
    pdf.addField("Retainer Type", retainerDetails.retainerType?.replace(/_/g, " ").toUpperCase());
    pdf.addField("Start Date", formatDate(retainerDetails.agreementStartDate));
    pdf.addField("End Date", formatDate(retainerDetails.agreementEndDate));
    pdf.addStatusField("Auto Renewal", retainerDetails.autoRenewal ? "Yes" : "No");
    if (retainerDetails.agreementEndDate) {
      const daysRemaining = Math.ceil((new Date(retainerDetails.agreementEndDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysRemaining > 0) {
        pdf.addField("Days Remaining", `${daysRemaining} days`);
      } else {
        pdf.addField("Days Remaining", `Expired ${Math.abs(daysRemaining)} days ago`);
      }
    }

    // Scope
    if (retainerDetails.scopeDescription) {
      pdf.addSection("Scope of Services");
      pdf.addField("Description", retainerDetails.scopeDescription);
    }

    // Billing Information
    if (retainerDetails.billing) {
      pdf.addSection("Billing Information");
      pdf.addField("Retainer Fee", `₦${Number(retainerDetails.billing.retainerFee || 0).toLocaleString()}`);
      pdf.addField("Currency", retainerDetails.billing.currency || "NGN");
      pdf.addField("Frequency", retainerDetails.billing.frequency?.toUpperCase());
      if (retainerDetails.billing.applyVAT) pdf.addField("VAT Rate", `${retainerDetails.billing.vatRate || 7.5}%`);
      if (retainerDetails.billing.applyWHT) pdf.addField("WHT Rate", `${retainerDetails.billing.whtRate || 5}%`);
    }

    // Services Included
    if (retainerDetails.servicesIncluded?.length > 0) {
      pdf.addSection("Services Included");
      retainerDetails.servicesIncluded.forEach((service, idx) => {
        pdf.addSubSection(`Service ${idx + 1}`);
        pdf.addField("Type", service.serviceType);
        pdf.addField("Description", service.description);
        pdf.addField("Billing Model", service.billingModel?.replace(/-/g, " ").toUpperCase());
        if (service.serviceLimit) pdf.addField("Limit", `${service.serviceLimit} ${service.unitDescription || "units"}`);
        if (service.usageCount !== undefined) pdf.addField("Usage", `${service.usageCount}/${service.serviceLimit || "∞"}`);
      });
    }

    // Termination Clause
    if (retainerDetails.terminationClause) {
      pdf.addSection("Termination Clause");
      if (retainerDetails.terminationClause.noticePeriod) {
        pdf.addField("Notice Period", `${retainerDetails.terminationClause.noticePeriod.value || 30} ${retainerDetails.terminationClause.noticePeriod.unit || "days"}`);
      }
      if (retainerDetails.terminationClause.conditions) {
        pdf.addField("Conditions", retainerDetails.terminationClause.conditions);
      }
    }

    // Performance Metrics
    if (retainerDetails.totalRequestsHandled !== undefined) {
      pdf.addSection("Performance Metrics");
      pdf.addField("Total Requests Handled", retainerDetails.totalRequestsHandled.toString());
      const pendingRequests = retainerDetails.requests?.filter(r => r.status === "pending").length || 0;
      pdf.addField("Pending Requests", pendingRequests.toString());
      if (retainerDetails.activityLog?.length) pdf.addField("Activities Logged", retainerDetails.activityLog.length.toString());
      if (retainerDetails.courtAppearances?.length) pdf.addField("Court Appearances", retainerDetails.courtAppearances.length.toString());
    }
  }

  await pdf.generate();
});

module.exports = exports;
