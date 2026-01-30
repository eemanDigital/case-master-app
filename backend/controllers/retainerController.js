const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const { RetainerDetail } = require("../models/retainerAndGeneralDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

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

/**
 * @desc    Get all retainer matters with pagination, filtering, and sorting
 * @route   GET /api/retainer-matters
 * @access  Private
 */
exports.getAllRetainerMatters = catchAsync(async (req, res, next) => {
  const {
    // Standard pagination
    page = 1,
    limit = 50,
    sort = "-agreementStartDate",
    populate,
    select,
    debug,
    includeStats,

    // Retainer-specific filters
    retainerType,
    status,
    expiringInDays,

    // Search
    search,

    // Other
    includeDeleted,
    onlyDeleted,
  } = req.query;

  // Add retainer matter type filter
  const customFilter = {
    matterType: "retainer",
  };

  // Handle expiring filter
  if (expiringInDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(expiringInDays));

    // Find retainers expiring in specified days
    const expiringRetainers = await RetainerDetail.find({
      firmId: req.firmId,
      agreementEndDate: {
        $gte: new Date(),
        $lte: futureDate,
      },
    })
      .select("matterId")
      .lean();

    if (expiringRetainers.length > 0) {
      const matterIds = expiringRetainers.map((r) => r.matterId);
      customFilter._id = { $in: matterIds };
    } else {
      // No expiring retainers found
      customFilter._id = { $in: [] };
    }
  }

  // Use matter pagination service
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

  // Enhance matters with retainer details if not already populated
  if (
    result.data.length > 0 &&
    (!populate || !populate.includes("retainerDetail"))
  ) {
    const matterIds = result.data.map((matter) => matter._id);
    const retainerDetails = await RetainerDetail.find({
      matterId: { $in: matterIds },
      firmId: req.firmId,
    }).lean();

    // Map retainer details to matters
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

// ============================================
// ADVANCED RETAINER SEARCH
// ============================================

/**
 * @desc    Advanced search for retainer matters
 * @route   POST /api/retainer-matters/search
 * @access  Private
 */
exports.searchRetainerMatters = catchAsync(async (req, res, next) => {
  const { criteria = {}, options = {} } = req.body;

  // Add retainer matter type and firmId to criteria
  const firmCriteria = {
    ...criteria,
    firmId: req.firmId,
    matterType: "retainer",
  };

  // Use advanced search from pagination service
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
// RETAINER DETAILS MANAGEMENT
// ============================================

/**
 * @desc    Create retainer details for a matter
 * @route   POST /api/retainer-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.createRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const retainerData = req.body;

  // Start transaction
  const session = await Matter.startSession();
  session.startTransaction();

  try {
    // 1. Verify matter exists
    const matter = await Matter.findOne({
      _id: matterId,
      firmId: req.firmId,
      isDeleted: false,
    }).session(session);

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Matter not found", 404));
    }

    if (matter.matterType !== "retainer") {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Matter is not a retainer matter", 400));
    }

    // 2. Check if retainer details already exist
    const existingDetail = await RetainerDetail.findOne({
      matterId,
      firmId: req.firmId,
    }).session(session);

    if (existingDetail) {
      await session.abortTransaction();
      session.endSession();
      return next(
        new AppError("Retainer details already exist for this matter", 400),
      );
    }

    // 3. Create retainer detail
    const retainerDetail = new RetainerDetail({
      matterId,
      firmId: req.firmId,
      createdBy: req.user._id,
      ...retainerData,
    });

    await retainerDetail.save({ session });

    // 4. Update matter to link retainer detail
    matter.retainerDetail = retainerDetail._id;
    matter.expectedClosureDate = retainerDetail.agreementEndDate;
    await matter.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate and return
    const populatedDetail = await RetainerDetail.findById(
      retainerDetail._id,
    ).populate({
      path: "matter",
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
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

/**
 * @desc    Get retainer details for a specific matter
 * @route   GET /api/retainer-matters/:matterId/details
 * @access  Private
 */
exports.getRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
  })
    .populate({
      path: "matter",
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

/**
 * @desc    Update retainer details
 * @route   PATCH /api/retainer-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.updateRetainerDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      ...updateData,
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  ).populate({
    path: "matter",
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

/**
 * @desc    Delete retainer details
 * @route   DELETE /api/retainer-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
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

/**
 * @desc    Restore retainer details
 * @route   PATCH /api/retainer-matters/:matterId/details/restore
 * @access  Private (Admin, Lawyer)
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
// SERVICES MANAGEMENT
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
          hoursUsed: serviceData.hoursUsed || 0,
          hoursAllocated: serviceData.hoursAllocated || 0,
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

exports.updateService = catchAsync(async (req, res, next) => {
  const { matterId, serviceId } = req.params;
  const updateData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "servicesIncluded._id": serviceId,
    },
    {
      $set: {
        "servicesIncluded.$": {
          ...updateData,
          _id: serviceId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
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

exports.updateServiceHours = catchAsync(async (req, res, next) => {
  const { matterId, serviceId } = req.params;
  const { hoursUsed, hoursAllocated } = req.body;

  const updateObject = {};
  if (hoursUsed !== undefined) {
    updateObject["servicesIncluded.$.hoursUsed"] = hoursUsed;
    updateObject["servicesIncluded.$.hoursUpdatedBy"] = req.user._id;
    updateObject["servicesIncluded.$.hoursUpdatedAt"] = new Date();
  }
  if (hoursAllocated !== undefined) {
    updateObject["servicesIncluded.$.hoursAllocated"] = hoursAllocated;
  }

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "servicesIncluded._id": serviceId,
    },
    {
      $set: updateObject,
      lastModifiedBy: req.user._id,
    },
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
// CLIENT REQUESTS MANAGEMENT
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

exports.updateRequest = catchAsync(async (req, res, next) => {
  const { matterId, requestId } = req.params;
  const updateData = req.body;

  const retainerDetail = await RetainerDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "requests._id": requestId,
    },
    {
      $set: {
        "requests.$": {
          ...updateData,
          _id: requestId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
          completedAt:
            updateData.status === "completed"
              ? updateData.completedAt || new Date()
              : null,
        },
      },
      lastModifiedBy: req.user._id,
    },
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
// REPORTS & ANALYTICS
// ============================================

exports.getHoursSummary = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const retainerDetail = await RetainerDetail.findOne({
    matterId,
    firmId: req.firmId,
  })
    .populate({
      path: "matter",
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

  const summary = retainerDetail.servicesIncluded.map((service) => ({
    serviceType: service.serviceType,
    description: service.description,
    hoursAllocated: service.hoursAllocated || 0,
    hoursUsed: service.hoursUsed || 0,
    hoursRemaining: (service.hoursAllocated || 0) - (service.hoursUsed || 0),
    utilizationRate:
      service.hoursAllocated > 0
        ? ((service.hoursUsed / service.hoursAllocated) * 100).toFixed(2)
        : "0.00",
    lastUpdated: service.hoursUpdatedAt,
  }));

  const totalAllocated = retainerDetail.servicesIncluded.reduce(
    (sum, s) => sum + (s.hoursAllocated || 0),
    0,
  );
  const totalUsed = retainerDetail.servicesIncluded.reduce(
    (sum, s) => sum + (s.hoursUsed || 0),
    0,
  );
  const utilizationRate =
    totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;

  res.status(200).json({
    status: "success",
    data: {
      matter: retainerDetail.matter,
      accountOfficer: retainerDetail.accountOfficer,
      services: summary,
      totals: {
        allocated: totalAllocated,
        used: totalUsed,
        remaining: totalAllocated - totalUsed,
        utilizationRate: utilizationRate.toFixed(2),
        utilizationStatus:
          utilizationRate >= 80
            ? "high"
            : utilizationRate >= 50
              ? "moderate"
              : "low",
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
    },
  });
});

// ============================================
// RETAINER RENEWAL & TERMINATION
// ============================================

exports.renewRetainer = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { newEndDate, retainerFee, servicesIncluded, renewalNotes } = req.body;

  const session = await Matter.startSession();
  session.startTransaction();

  try {
    // Get current retainer
    const currentRetainer = await RetainerDetail.findOne({
      matterId,
      firmId: req.firmId,
      isDeleted: false,
    }).session(session);

    if (!currentRetainer) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Retainer details not found", 404));
    }

    // Archive current retainer
    currentRetainer.isArchived = true;
    currentRetainer.archivedAt = new Date();
    currentRetainer.archivedBy = req.user._id;
    currentRetainer.renewalNotes = renewalNotes;
    await currentRetainer.save({ session });

    // Calculate new end date (default 1 year from now)
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
          serviceType: s.serviceType,
          description: s.description,
          hoursAllocated: s.hoursAllocated,
          hoursUsed: 0, // Reset hours for new term
        })),
      scopeDescription: currentRetainer.scopeDescription,
      retainerFee: retainerFee || currentRetainer.retainerFee,
      autoRenewal: currentRetainer.autoRenewal,
      renewalTerms: currentRetainer.renewalTerms,
      responseTimes: currentRetainer.responseTimes,
      meetingSchedule: currentRetainer.meetingSchedule,
      reportingRequirements: currentRetainer.reportingRequirements,
      terminationClause: currentRetainer.terminationClause,
      previousRetainerId: currentRetainer._id,
      renewalNotes,
      createdBy: req.user._id,
    });

    await newRetainerDetail.save({ session });

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
        lastModifiedBy: req.user._id,
        lastActivityDate: new Date(),
      },
      { new: true, session },
    );

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Retainer matter not found", 404));
    }

    // Link new retainer to matter
    matter.retainerDetail = newRetainerDetail._id;
    await matter.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      message: "Retainer renewed successfully",
      data: {
        previousRetainer: currentRetainer,
        newRetainer: newRetainerDetail,
        matter,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

exports.terminateRetainer = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { terminationReason, terminationDate, terminationNotes } = req.body;

  const session = await Matter.startSession();
  session.startTransaction();

  try {
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
      { new: true, runValidators: true, session },
    );

    if (!retainerDetail) {
      await session.abortTransaction();
      session.endSession();
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
      { new: true, session },
    );

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Retainer matter not found", 404));
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      message: "Retainer terminated successfully",
      data: {
        retainerDetail,
        matter,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

// ============================================
// STATISTICS & DASHBOARD
// ============================================

exports.getRetainerStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false, isArchived: false };

  const [
    overviewStats,
    byType,
    requestsStats,
    hoursUtilization,
    revenueStats,
    expiringSoon,
  ] = await Promise.all([
    // Overview statistics
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

    // By retainer type
    RetainerDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: "$retainerType",
          count: { $sum: 1 },
          totalMonthlyRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$retainerFee.frequency", "monthly"] },
                "$retainerFee.amount",
                {
                  $cond: [
                    { $eq: ["$retainerFee.frequency", "quarterly"] },
                    { $divide: ["$retainerFee.amount", 3] },
                    { $divide: ["$retainerFee.amount", 12] },
                  ],
                },
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Requests statistics
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

    // Hours utilization
    RetainerDetail.aggregate([
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
    ]),

    // Revenue statistics
    RetainerDetail.aggregate([
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
                    { $divide: ["$retainerFee.amount", 12] },
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
                    "$retainerFee.amount",
                  ],
                },
              ],
            },
          },
          avgRetainerValue: { $avg: "$retainerFee.amount" },
        },
      },
    ]),

    // Expiring soon (next 30 days)
    RetainerDetail.countDocuments({
      ...firmQuery,
      agreementEndDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
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
      hours: hoursUtilization[0] || {
        totalAllocated: 0,
        totalUsed: 0,
        avgUtilization: 0,
      },
      revenue: revenueStats[0] || {
        totalMonthlyRevenue: 0,
        totalAnnualRevenue: 0,
        avgRetainerValue: 0,
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
      path: "matter",
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

  const filtered = retainerDetails.filter((detail) => detail.matter);

  const total = await RetainerDetail.countDocuments({
    firmId: req.firmId,
    isDeleted: false,
    isArchived: false,
    agreementEndDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
  });

  // Calculate days remaining
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
      path: "matter",
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

  const filtered = retainerDetails.filter((detail) => detail.matter);

  // Extract and flatten pending requests
  const pendingRequests = [];
  filtered.forEach((detail) => {
    detail.requests.forEach((request) => {
      if (request.status === "pending") {
        pendingRequests.push({
          ...request.toObject(),
          matter: detail.matter,
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

// ============================================
// BULK OPERATIONS
// ============================================

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

module.exports = exports;
