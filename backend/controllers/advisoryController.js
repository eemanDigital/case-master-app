const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const AdvisoryDetail = require("../models/advisoryDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Initialize pagination services
const matterPaginationService = PaginationServiceFactory.createService(
  Matter,
  modelConfigs.Matter,
);

const advisoryDetailPaginationService = PaginationServiceFactory.createService(
  AdvisoryDetail,
  modelConfigs.AdvisoryDetail,
);

// ============================================
// ADVISORY MATTERS LISTING & PAGINATION
// ============================================

/**
 * @desc    Get all advisory matters with pagination, filtering, and sorting
 * @route   GET /api/advisory-matters
 * @access  Private
 */
exports.getAllAdvisoryMatters = catchAsync(async (req, res, next) => {
  const {
    // Standard pagination
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    includeStats,

    // Advisory-specific filters
    advisoryType,
    industry,
    status,

    // Search
    search,

    // Other
    includeDeleted,
    onlyDeleted,
  } = req.query;

  // Add advisory matter type filter
  const customFilter = {
    matterType: "advisory",
  };

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
      advisoryType,
      industry,
    },
    customFilter,
    req.firmId,
  );

  // Enhance matters with advisory details if not already populated
  if (
    result.data.length > 0 &&
    (!populate || !populate.includes("advisoryDetail"))
  ) {
    const matterIds = result.data.map((matter) => matter._id);
    const advisoryDetails = await AdvisoryDetail.find({
      matterId: { $in: matterIds },
      firmId: req.firmId,
    }).lean();

    // Map advisory details to matters
    const detailsMap = advisoryDetails.reduce((map, detail) => {
      map[detail.matterId.toString()] = detail;
      return map;
    }, {});

    result.data = result.data.map((matter) => ({
      ...matter,
      advisoryDetail: detailsMap[matter._id.toString()] || null,
    }));
  }

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// ADVANCED ADVISORY SEARCH
// ============================================

/**
 * @desc    Advanced search for advisory matters
 * @route   POST /api/advisory-matters/search
 * @access  Private
 */
exports.searchAdvisoryMatters = catchAsync(async (req, res, next) => {
  const { criteria = {}, options = {} } = req.body;

  // Add advisory matter type and firmId to criteria
  const firmCriteria = {
    ...criteria,
    firmId: req.firmId,
    matterType: "advisory",
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
// ADVISORY DETAILS MANAGEMENT
// ============================================

/**
 * @desc    Create advisory details for a matter
 * @route   POST /api/advisory-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.createAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const advisoryData = req.body;

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

    if (matter.matterType !== "advisory") {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Matter is not an advisory matter", 400));
    }

    // 2. Check if advisory details already exist
    const existingDetail = await AdvisoryDetail.findOne({
      matterId,
      firmId: req.firmId,
    }).session(session);

    if (existingDetail) {
      await session.abortTransaction();
      session.endSession();
      return next(
        new AppError("Advisory details already exist for this matter", 400),
      );
    }

    // 3. Create advisory detail
    const advisoryDetail = new AdvisoryDetail({
      matterId,
      firmId: req.firmId,
      createdBy: req.user._id,
      ...advisoryData,
    });

    await advisoryDetail.save({ session });

    // 4. Update matter to link advisory detail
    matter.advisoryDetail = advisoryDetail._id;
    await matter.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate and return
    const populatedDetail = await AdvisoryDetail.findById(
      advisoryDetail._id,
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
        advisoryDetail: populatedDetail,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

/**
 * @desc    Get advisory details for a specific matter
 * @route   GET /api/advisory-matters/:matterId/details
 * @access  Private
 */
exports.getAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOne({
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

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
    },
  });
});

/**
 * @desc    Update advisory details
 * @route   PATCH /api/advisory-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.updateAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
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

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
    },
  });
});

/**
 * @desc    Delete advisory details
 * @route   DELETE /api/advisory-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.deleteAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user._id,
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(
      new AppError("Advisory details not found or already deleted", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: null,
    message: "Advisory details deleted successfully",
  });
});

/**
 * @desc    Restore advisory details
 * @route   PATCH /api/advisory-matters/:matterId/details/restore
 * @access  Private (Admin, Lawyer)
 */
exports.restoreAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(
      new AppError("No deleted advisory details found to restore", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
    },
  });
});

// ============================================
// RESEARCH QUESTIONS MANAGEMENT
// ============================================

exports.addResearchQuestion = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const questionData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        researchQuestions: {
          ...questionData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newQuestion:
        advisoryDetail.researchQuestions[
          advisoryDetail.researchQuestions.length - 1
        ],
    },
  });
});

exports.updateResearchQuestion = catchAsync(async (req, res, next) => {
  const { matterId, questionId } = req.params;
  const updateData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "researchQuestions._id": questionId,
    },
    {
      $set: {
        "researchQuestions.$": {
          ...updateData,
          _id: questionId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Research question not found", 404));
  }

  const updatedQuestion = advisoryDetail.researchQuestions.id(questionId);

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      updatedQuestion,
    },
  });
});

exports.deleteResearchQuestion = catchAsync(async (req, res, next) => {
  const { matterId, questionId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { researchQuestions: { _id: questionId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(
      new AppError("Advisory details or research question not found", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      message: "Research question removed successfully",
    },
  });
});

// ============================================
// KEY FINDINGS MANAGEMENT
// ============================================

exports.addKeyFinding = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const findingData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        keyFindings: {
          ...findingData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newFinding:
        advisoryDetail.keyFindings[advisoryDetail.keyFindings.length - 1],
    },
  });
});

exports.updateKeyFinding = catchAsync(async (req, res, next) => {
  const { matterId, findingId } = req.params;
  const updateData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "keyFindings._id": findingId,
    },
    {
      $set: {
        "keyFindings.$": {
          ...updateData,
          _id: findingId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Key finding not found", 404));
  }

  const updatedFinding = advisoryDetail.keyFindings.id(findingId);

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      updatedFinding,
    },
  });
});

exports.deleteKeyFinding = catchAsync(async (req, res, next) => {
  const { matterId, findingId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { keyFindings: { _id: findingId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details or key finding not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      message: "Key finding removed successfully",
    },
  });
});

// ============================================
// OPINION MANAGEMENT
// ============================================

exports.updateOpinion = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const opinionData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        opinion: {
          ...opinionData,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
    },
  });
});

// ============================================
// RECOMMENDATIONS MANAGEMENT
// ============================================

exports.addRecommendation = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const recommendationData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        recommendations: {
          ...recommendationData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newRecommendation:
        advisoryDetail.recommendations[
          advisoryDetail.recommendations.length - 1
        ],
    },
  });
});

exports.updateRecommendation = catchAsync(async (req, res, next) => {
  const { matterId, recommendationId } = req.params;
  const updateData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "recommendations._id": recommendationId,
    },
    {
      $set: {
        "recommendations.$": {
          ...updateData,
          _id: recommendationId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Recommendation not found", 404));
  }

  const updatedRecommendation =
    advisoryDetail.recommendations.id(recommendationId);

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      updatedRecommendation,
    },
  });
});

exports.deleteRecommendation = catchAsync(async (req, res, next) => {
  const { matterId, recommendationId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { recommendations: { _id: recommendationId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(
      new AppError("Advisory details or recommendation not found", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      message: "Recommendation removed successfully",
    },
  });
});

// ============================================
// DELIVERABLES MANAGEMENT
// ============================================

exports.addDeliverable = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const deliverableData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        deliverables: {
          ...deliverableData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newDeliverable:
        advisoryDetail.deliverables[advisoryDetail.deliverables.length - 1],
    },
  });
});

exports.updateDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;
  const updateData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "deliverables._id": deliverableId,
    },
    {
      $set: {
        "deliverables.$": {
          ...updateData,
          _id: deliverableId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Deliverable not found", 404));
  }

  const updatedDeliverable = advisoryDetail.deliverables.id(deliverableId);

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      updatedDeliverable,
    },
  });
});

exports.deleteDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { deliverables: { _id: deliverableId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details or deliverable not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      message: "Deliverable removed successfully",
    },
  });
});

// ============================================
// SERVICE COMPLETION
// ============================================

exports.completeAdvisory = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { completionDate, finalOpinion } = req.body;

  const session = await Matter.startSession();
  session.startTransaction();

  try {
    // Update matter
    const matter = await Matter.findOneAndUpdate(
      {
        _id: matterId,
        firmId: req.firmId,
        matterType: "advisory",
        isDeleted: false,
      },
      {
        status: "completed",
        actualClosureDate: completionDate || new Date(),
        lastModifiedBy: req.user._id,
      },
      { new: true, runValidators: true, session },
    );

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Advisory matter not found", 404));
    }

    // Update advisory detail
    const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
      { matterId, firmId: req.firmId },
      {
        $set: {
          opinion: {
            ...finalOpinion,
            finalizedBy: req.user._id,
            finalizationDate: new Date(),
          },
          completionDate: completionDate || new Date(),
          lastModifiedBy: req.user._id,
        },
      },
      { new: true, runValidators: true, session },
    );

    if (!advisoryDetail) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Advisory details not found", 404));
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      message: "Advisory marked as completed",
      data: {
        advisoryDetail,
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

exports.getAdvisoryStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  const [
    overviewStats,
    byType,
    researchStats,
    deliverableStats,
    recentAdvisories,
  ] = await Promise.all([
    // Overview statistics
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "advisory",
        },
      },
      {
        $group: {
          _id: null,
          totalAdvisoryMatters: { $sum: 1 },
          activeAdvisoryMatters: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          pendingAdvisoryMatters: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedAdvisoryMatters: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),

    // By advisory type
    AdvisoryDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: "$advisoryType",
          count: { $sum: 1 },
          avgComplexity: { $avg: "$complexityLevel" },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Research questions statistics
    AdvisoryDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$researchQuestions" },
      {
        $group: {
          _id: "$researchQuestions.status",
          count: { $sum: 1 },
          answeredCount: {
            $sum: {
              $cond: [{ $ne: ["$researchQuestions.answer", null] }, 1, 0],
            },
          },
        },
      },
    ]),

    // Deliverable statistics
    AdvisoryDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$deliverables" },
      {
        $group: {
          _id: "$deliverables.status",
          count: { $sum: 1 },
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $in: ["$deliverables.status", ["pending", "in-progress"]],
                    },
                    { $lt: ["$deliverables.dueDate", new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // Recent advisories (last 30 days)
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "advisory",
          dateOpened: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dateOpened" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 10 },
    ]),
  ]);

  // Calculate totals
  const pendingDeliverables = deliverableStats.find(
    (s) => s._id === "pending" || s._id === "in-progress",
  );
  const overdueDeliverables = deliverableStats.reduce(
    (sum, stat) => sum + (stat.overdueCount || 0),
    0,
  );

  res.status(200).json({
    status: "success",
    data: {
      overview: overviewStats[0] || {
        totalAdvisoryMatters: 0,
        activeAdvisoryMatters: 0,
        pendingAdvisoryMatters: 0,
        completedAdvisoryMatters: 0,
      },
      byType,
      researchQuestions: researchStats,
      deliverables: {
        byStatus: deliverableStats,
        pending: pendingDeliverables?.count || 0,
        overdue: overdueDeliverables,
      },
      recentAdvisories,
    },
  });
});

// ============================================
// BULK OPERATIONS
// ============================================

exports.bulkUpdateAdvisoryMatters = catchAsync(async (req, res, next) => {
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
      matterType: "advisory",
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
