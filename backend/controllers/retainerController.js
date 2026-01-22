const Matter = require("../models/matterModel");
const { RetainerDetail } = require("../models/retainerAndGeneralDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ============================================
// RETAINER DETAILS CRUD OPERATIONS
// ============================================

/**
 * @desc    Create retainer details for a matter
 * @route   POST /api/retainer/:matterId/details
 * @access  Private
 */
exports.createRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const retainerData = req.body;

  // 1. Verify matter exists and is retainer type
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "retainer",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Retainer matter not found", 404));
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

  // 3. Create retainer detail
  const retainerDetail = new RetainerDetail({
    matterId,
    firmId: req.firmId,
    ...retainerData,
  });

  await retainerDetail.save();

  res.status(201).json({
    status: "success",
    data: {
      retainerDetail,
    },
  });
});

/**
 * @desc    Get retainer details for a matter
 * @route   GET /api/retainer/:matterId/details
 * @access  Private
 */
exports.getRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).populate({
    path: "matter",
    select: "matterNumber title client accountOfficer status priority",
    populate: [
      { path: "client", select: "firstName lastName email phone" },
      { path: "accountOfficer", select: "firstName lastName email photo" },
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

/**
 * @desc    Update retainer details
 * @route   PATCH /api/retainer/:matterId/details
 * @access  Private
 */
exports.updateRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    updateData,
    { new: true, runValidators: true },
  );

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

/**
 * @desc    Soft delete retainer details
 * @route   DELETE /api/retainer/:matterId/details
 * @access  Private
 */
exports.deleteRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user.id,
    },
    { new: true },
  );

  if (!retainerDetail) {
    return next(
      new AppError("Retainer details not found or already deleted", 404),
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * @desc    Restore soft-deleted retainer details
 * @route   PATCH /api/retainer/:matterId/details/restore
 * @access  Private
 */
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
// RETAINER LISTING WITH FILTERS
// ============================================

/**
 * @desc    Get all retainer matters
 * @route   GET /api/retainer
 * @access  Private
 */
exports.getAllRetainerMatters = catchAsync(async (req, res, next) => {
  const {
    retainerType,
    status,
    expiringInDays,
    page = 1,
    limit = 50,
    sort = "-agreementStartDate",
  } = req.query;

  const matterFilter = {
    firmId: req.firmId,
    matterType: "retainer",
    isDeleted: false,
  };

  if (status) matterFilter.status = status;

  // Filter by retainer-specific fields
  let matterIds = null;
  if (retainerType || expiringInDays) {
    const detailFilter = { firmId: req.firmId };
    if (retainerType) detailFilter.retainerType = retainerType;

    if (expiringInDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Number(expiringInDays));
      detailFilter.agreementEndDate = {
        $gte: new Date(),
        $lte: futureDate,
      };
    }

    const retainerDetails =
      await RetainerDetail.find(detailFilter).select("matterId");
    matterIds = retainerDetails.map((d) => d.matterId);
    matterFilter._id = { $in: matterIds };
  }

  const skip = (page - 1) * limit;

  const matters = await Matter.find(matterFilter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("accountOfficer", "firstName lastName email photo")
    .populate("client", "firstName lastName email phone")
    .populate("retainerDetail");

  const total = await Matter.countDocuments(matterFilter);

  res.status(200).json({
    status: "success",
    results: matters.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: {
      matters,
    },
  });
});

// ============================================
// SERVICES MANAGEMENT
// ============================================

/**
 * @desc    Add service to retainer
 * @route   POST /api/retainer/:matterId/services
 * @access  Private
 */
exports.addService = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const serviceData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: { servicesIncluded: serviceData },
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
    },
  });
});

/**
 * @desc    Update service
 * @route   PATCH /api/retainer/:matterId/services/:serviceId
 * @access  Private
 */
exports.updateService = catchAsync(async (req, res, next) => {
  const { matterId, serviceId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`servicesIncluded.$.${key}`] = updateData[key];
  });

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "servicesIncluded._id": serviceId,
    },
    {
      $set: updateObject,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Service not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
    },
  });
});

/**
 * @desc    Remove service from retainer
 * @route   DELETE /api/retainer/:matterId/services/:serviceId
 * @access  Private
 */
exports.removeService = catchAsync(async (req, res, next) => {
  const { matterId, serviceId } = req.params;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { servicesIncluded: { _id: serviceId } },
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
    },
  });
});

// ============================================
// CLIENT REQUESTS MANAGEMENT
// ============================================

/**
 * @desc    Add client request to retainer
 * @route   POST /api/retainer/:matterId/requests
 * @access  Private
 */
exports.addRequest = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const requestData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "retainer",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Retainer matter not found", 404));
  }

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: { requests: { ...requestData, requestDate: new Date() } },
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
    },
  });
});

/**
 * @desc    Update client request status
 * @route   PATCH /api/retainer/:matterId/requests/:requestId
 * @access  Private
 */
exports.updateRequest = catchAsync(async (req, res, next) => {
  const { matterId, requestId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`requests.$.${key}`] = updateData[key];
  });

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "requests._id": requestId,
    },
    {
      $set: updateObject,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Request not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
    },
  });
});

/**
 * @desc    Delete client request
 * @route   DELETE /api/retainer/:matterId/requests/:requestId
 * @access  Private
 */
exports.deleteRequest = catchAsync(async (req, res, next) => {
  const { matterId, requestId } = req.params;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { requests: { _id: requestId } },
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
    },
  });
});

// ============================================
// SERVICE HOURS MANAGEMENT
// ============================================

/**
 * @desc    Update hours used for a service
 * @route   PATCH /api/retainer/:matterId/services/:serviceId/hours
 * @access  Private
 */
exports.updateServiceHours = catchAsync(async (req, res, next) => {
  const { matterId, serviceId } = req.params;
  const { hoursUsed, hoursAllocated } = req.body;

  const updateObject = {};
  if (hoursUsed !== undefined)
    updateObject[`servicesIncluded.$.hoursUsed`] = hoursUsed;
  if (hoursAllocated !== undefined)
    updateObject[`servicesIncluded.$.hoursAllocated`] = hoursAllocated;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "servicesIncluded._id": serviceId,
    },
    {
      $set: updateObject,
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Service not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      retainerDetail,
    },
  });
});

// ============================================
// REPORTS & ANALYTICS
// ============================================

/**
 * @desc    Get hours allocation vs usage summary
 * @route   GET /api/retainer/:matterId/hours-summary
 * @access  Private
 */
exports.getHoursSummary = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).populate({
    path: "matter",
    select: "matterNumber title client",
    populate: { path: "client", select: "firstName lastName email" },
  });

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  const summary = retainerDetail.servicesIncluded.map((service) => ({
    serviceType: service.serviceType,
    hoursAllocated: service.hoursAllocated,
    hoursUsed: service.hoursUsed,
    hoursRemaining: service.hoursAllocated - service.hoursUsed,
    utilizationRate:
      service.hoursAllocated > 0
        ? ((service.hoursUsed / service.hoursAllocated) * 100).toFixed(2)
        : "0.00",
  }));

  const totalAllocated = retainerDetail.servicesIncluded.reduce(
    (sum, s) => sum + (s.hoursAllocated || 0),
    0,
  );
  const totalUsed = retainerDetail.servicesIncluded.reduce(
    (sum, s) => sum + (s.hoursUsed || 0),
    0,
  );

  res.status(200).json({
    status: "success",
    data: {
      matter: retainerDetail.matter,
      services: summary,
      totalHours: {
        allocated: totalAllocated,
        used: totalUsed,
        remaining: totalAllocated - totalUsed,
        utilizationRate:
          totalAllocated > 0
            ? ((totalUsed / totalAllocated) * 100).toFixed(2)
            : "0.00",
      },
    },
  });
});

// ============================================
// RETAINER RENEWAL & TERMINATION
// ============================================

/**
 * @desc    Renew retainer agreement
 * @route   POST /api/retainer/:matterId/renew
 * @access  Private
 */
exports.renewRetainer = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { newEndDate, retainerFee, servicesIncluded } = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "retainer",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Retainer matter not found", 404));
  }

  const retainerDetail = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  // Archive old retainer
  retainerDetail.isArchived = true;
  retainerDetail.archivedAt = new Date();
  await retainerDetail.save();

  // Create new retainer detail for renewal
  const newRetainerDetail = new RetainerDetail({
    matterId,
    firmId: req.firmId,
    retainerType: retainerDetail.retainerType,
    agreementStartDate: new Date(),
    agreementEndDate:
      newEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
    servicesIncluded:
      servicesIncluded ||
      retainerDetail.servicesIncluded.map((s) => ({
        ...s.toObject(),
        hoursUsed: 0,
      })),
    scopeDescription: retainerDetail.scopeDescription,
    retainerFee: retainerFee || retainerDetail.retainerFee,
    autoRenewal: retainerDetail.autoRenewal,
    renewalTerms: retainerDetail.renewalTerms,
    responseTimes: retainerDetail.responseTimes,
    meetingSchedule: retainerDetail.meetingSchedule,
    reportingRequirements: retainerDetail.reportingRequirements,
    terminationClause: retainerDetail.terminationClause,
    previousRetainerId: retainerDetail._id,
  });

  await newRetainerDetail.save();

  // Update matter
  matter.status = "active";
  matter.expectedClosureDate = newRetainerDetail.agreementEndDate;
  matter.lastActivityDate = new Date();
  await matter.save();

  res.status(200).json({
    status: "success",
    message: "Retainer renewed successfully",
    data: {
      retainerDetail: newRetainerDetail,
      matter,
    },
  });
});

/**
 * @desc    Terminate retainer agreement
 * @route   POST /api/retainer/:matterId/terminate
 * @access  Private
 */
exports.terminateRetainer = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { terminationReason, terminationDate } = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "retainer",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Retainer matter not found", 404));
  }

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      agreementEndDate: terminationDate || new Date(),
      terminationReason,
      terminationDate: terminationDate || new Date(),
    },
    { new: true, runValidators: true },
  );

  if (!retainerDetail) {
    return next(new AppError("Retainer details not found", 404));
  }

  // Update matter status
  matter.status = "terminated";
  matter.actualClosureDate = retainerDetail.agreementEndDate;
  matter.lastActivityDate = new Date();
  await matter.save();

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
// DASHBOARD & STATISTICS
// ============================================

/**
 * @desc    Get expiring retainers
 * @route   GET /api/retainer/expiring
 * @access  Private
 */
exports.getExpiringRetainers = catchAsync(async (req, res, next) => {
  const { days = 30 } = req.query;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Number(days));

  const retainerDetails = await RetainerDetail.find({
    firmId: req.firmId,
    isDeleted: false,
    agreementEndDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
  })
    .populate({
      path: "matter",
      select: "matterNumber title client accountOfficer status priority",
      populate: [
        { path: "client", select: "firstName lastName email phone" },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    })
    .sort({ agreementEndDate: 1 });

  const filtered = retainerDetails.filter(
    (detail) => detail.matter && !detail.matter.isDeleted,
  );

  res.status(200).json({
    status: "success",
    results: filtered.length,
    data: {
      retainers: filtered,
    },
  });
});

/**
 * @desc    Get retainer-specific statistics
 * @route   GET /api/retainer/stats
 * @access  Private
 */
exports.getRetainerStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  // By retainer type
  const byType = await RetainerDetail.aggregate([
    { $match: firmQuery },
    {
      $group: {
        _id: "$retainerType",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Active vs expired retainers
  const [activeRetainers, expiredRetainers] = await Promise.all([
    RetainerDetail.countDocuments({
      ...firmQuery,
      agreementEndDate: { $gte: new Date() },
    }),
    RetainerDetail.countDocuments({
      ...firmQuery,
      agreementEndDate: { $lt: new Date() },
    }),
  ]);

  // Requests statistics
  const requestsStats = await RetainerDetail.aggregate([
    { $match: firmQuery },
    { $unwind: "$requests" },
    {
      $group: {
        _id: "$requests.status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Hours utilization
  const hoursUtilization = await RetainerDetail.aggregate([
    { $match: firmQuery },
    { $unwind: "$servicesIncluded" },
    {
      $group: {
        _id: null,
        totalAllocated: { $sum: "$servicesIncluded.hoursAllocated" },
        totalUsed: { $sum: "$servicesIncluded.hoursUsed" },
        avgUtilization: {
          $avg: {
            $cond: [
              { $gt: ["$servicesIncluded.hoursAllocated", 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      "$servicesIncluded.hoursUsed",
                      "$servicesIncluded.hoursAllocated",
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
  ]);

  // Revenue projection
  const revenueStats = await RetainerDetail.aggregate([
    { $match: firmQuery },
    {
      $group: {
        _id: null,
        totalMonthlyRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$retainerFee.frequency", "monthly"] },
              "$retainerFee.amount",
              {
                $cond: [
                  { $eq: ["$retainerFee.frequency", "quarterly"] },
                  { $divide: ["$retainerFee.amount", 3] },
                  { $divide: ["$retainerFee.amount", 12] }, // annually
                ],
              },
            ],
          },
        },
        totalAnnualRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$retainerFee.frequency", "monthly"] },
              { $multiply: ["$retainerFee.amount", 12] },
              {
                $cond: [
                  { $eq: ["$retainerFee.frequency", "quarterly"] },
                  { $multiply: ["$retainerFee.amount", 4] },
                  "$retainerFee.amount", // annually
                ],
              },
            ],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      byType,
      activeRetainers,
      expiredRetainers,
      requestsByStatus: requestsStats,
      hoursUtilization: hoursUtilization[0] || {
        totalAllocated: 0,
        totalUsed: 0,
        avgUtilization: 0,
      },
      revenue: revenueStats[0] || {
        totalMonthlyRevenue: 0,
        totalAnnualRevenue: 0,
      },
    },
  });
});

/**
 * @desc    Get retainers with pending requests
 * @route   GET /api/retainer/pending-requests
 * @access  Private
 */
exports.getPendingRequests = catchAsync(async (req, res, next) => {
  const retainerDetails = await RetainerDetail.find({
    firmId: req.firmId,
    isDeleted: false,
    "requests.status": "pending",
  })
    .populate({
      path: "matter",
      select: "matterNumber title client accountOfficer priority",
      populate: [
        { path: "client", select: "firstName lastName email" },
        { path: "accountOfficer", select: "firstName lastName email" },
      ],
    })
    .sort({ "requests.requestDate": 1 });

  const filtered = retainerDetails
    .filter((detail) => detail.matter && !detail.matter.isDeleted)
    .map((detail) => ({
      ...detail.toObject(),
      requests: detail.requests.filter((req) => req.status === "pending"),
    }));

  res.status(200).json({
    status: "success",
    results: filtered.length,
    data: {
      retainers: filtered,
    },
  });
});

module.exports = exports;
