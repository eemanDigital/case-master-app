const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const { GeneralDetail } = require("../models/retainerAndGeneralDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Initialize pagination services
const matterPaginationService = PaginationServiceFactory.createService(
  Matter,
  modelConfigs.Matter,
);

const generalDetailPaginationService = PaginationServiceFactory.createService(
  GeneralDetail,
  modelConfigs.GeneralDetail,
);

// ============================================
// GENERAL MATTERS LISTING & PAGINATION
// ============================================

/**
 * @desc    Get all general matters with pagination, filtering, and sorting
 * @route   GET /api/general-matters
 * @access  Private
 */
exports.getAllGeneralMatters = catchAsync(async (req, res, next) => {
  const {
    // Standard pagination
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    includeStats,

    // General-specific filters
    serviceType,
    status,

    // Search
    search,

    // Other
    includeDeleted,
    onlyDeleted,
  } = req.query;

  // Add general matter type filter
  const customFilter = {
    matterType: "general",
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
      serviceType,
    },
    customFilter,
    req.firmId,
  );

  // Enhance matters with general details if not already populated
  if (
    result.data.length > 0 &&
    (!populate || !populate.includes("generalDetail"))
  ) {
    const matterIds = result.data.map((matter) => matter._id);
    const generalDetails = await GeneralDetail.find({
      matterId: { $in: matterIds },
      firmId: req.firmId,
    }).lean();

    // Map general details to matters
    const detailsMap = generalDetails.reduce((map, detail) => {
      map[detail.matterId.toString()] = detail;
      return map;
    }, {});

    result.data = result.data.map((matter) => ({
      ...matter,
      generalDetail: detailsMap[matter._id.toString()] || null,
    }));
  }

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// ADVANCED GENERAL SEARCH
// ============================================

/**
 * @desc    Advanced search for general matters
 * @route   POST /api/general-matters/search
 * @access  Private
 */
exports.searchGeneralMatters = catchAsync(async (req, res, next) => {
  const { criteria = {}, options = {} } = req.body;

  // Add general matter type and firmId to criteria
  const firmCriteria = {
    ...criteria,
    firmId: req.firmId,
    matterType: "general",
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
// GENERAL DETAILS MANAGEMENT
// ============================================

/**
 * @desc    Create general details for a matter
 * @route   POST /api/general-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.createGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const generalData = req.body;

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

    if (matter.matterType !== "general") {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Matter is not a general matter", 400));
    }

    // 2. Check if general details already exist
    const existingDetail = await GeneralDetail.findOne({
      matterId,
      firmId: req.firmId,
    }).session(session);

    if (existingDetail) {
      await session.abortTransaction();
      session.endSession();
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

    await generalDetail.save({ session });

    // 4. Update matter to link general detail
    matter.generalDetail = generalDetail._id;
    await matter.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate and return
    const populatedDetail = await GeneralDetail.findById(
      generalDetail._id,
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
        generalDetail: populatedDetail,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

/**
 * @desc    Get general details for a specific matter
 * @route   GET /api/general-matters/:matterId/details
 * @access  Private
 */
exports.getGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const generalDetail = await GeneralDetail.findOne({
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

/**
 * @desc    Update general details
 * @route   PATCH /api/general-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.updateGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
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

/**
 * @desc    Delete general details
 * @route   DELETE /api/general-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.deleteGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user._id,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(
      new AppError("General details not found or already deleted", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: null,
    message: "General details deleted successfully",
  });
});

/**
 * @desc    Restore general details
 * @route   PATCH /api/general-matters/:matterId/details/restore
 * @access  Private (Admin, Lawyer)
 */
exports.restoreGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(
      new AppError("No deleted general details found to restore", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
    },
  });
});

// ============================================
// REQUIREMENTS MANAGEMENT
// ============================================

exports.addRequirement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const requirementData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        specificRequirements: {
          ...requirementData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      newRequirement:
        generalDetail.specificRequirements[
          generalDetail.specificRequirements.length - 1
        ],
    },
  });
});

exports.updateRequirement = catchAsync(async (req, res, next) => {
  const { matterId, requirementId } = req.params;
  const updateData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "specificRequirements._id": requirementId,
    },
    {
      $set: {
        "specificRequirements.$": {
          ...updateData,
          _id: requirementId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Requirement not found", 404));
  }

  const updatedRequirement =
    generalDetail.specificRequirements.id(requirementId);

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      updatedRequirement,
    },
  });
});

exports.deleteRequirement = catchAsync(async (req, res, next) => {
  const { matterId, requirementId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { specificRequirements: { _id: requirementId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or requirement not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      message: "Requirement removed successfully",
    },
  });
});

// ============================================
// PARTIES MANAGEMENT
// ============================================

exports.addParty = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const partyData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        partiesInvolved: {
          ...partyData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      newParty:
        generalDetail.partiesInvolved[generalDetail.partiesInvolved.length - 1],
    },
  });
});

exports.updateParty = catchAsync(async (req, res, next) => {
  const { matterId, partyId } = req.params;
  const updateData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "partiesInvolved._id": partyId,
    },
    {
      $set: {
        "partiesInvolved.$": {
          ...updateData,
          _id: partyId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Party not found", 404));
  }

  const updatedParty = generalDetail.partiesInvolved.id(partyId);

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      updatedParty,
    },
  });
});

exports.deleteParty = catchAsync(async (req, res, next) => {
  const { matterId, partyId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { partiesInvolved: { _id: partyId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or party not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      message: "Party removed successfully",
    },
  });
});

// ============================================
// DELIVERABLES MANAGEMENT
// ============================================

exports.addDeliverable = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const deliverableData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        expectedDeliverables: {
          ...deliverableData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      newDeliverable:
        generalDetail.expectedDeliverables[
          generalDetail.expectedDeliverables.length - 1
        ],
    },
  });
});

exports.updateDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;
  const updateData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "expectedDeliverables._id": deliverableId,
    },
    {
      $set: {
        "expectedDeliverables.$": {
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

  if (!generalDetail) {
    return next(new AppError("Deliverable not found", 404));
  }

  const updatedDeliverable =
    generalDetail.expectedDeliverables.id(deliverableId);

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      updatedDeliverable,
    },
  });
});

exports.deleteDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { expectedDeliverables: { _id: deliverableId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or deliverable not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      message: "Deliverable removed successfully",
    },
  });
});

// ============================================
// DOCUMENTS MANAGEMENT
// ============================================

exports.addDocument = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const documentData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        documentsRequired: {
          ...documentData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      newDocument:
        generalDetail.documentsRequired[
          generalDetail.documentsRequired.length - 1
        ],
    },
  });
});

exports.updateDocumentStatus = catchAsync(async (req, res, next) => {
  const { matterId, documentId } = req.params;
  const { isReceived, receivedDate } = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "documentsRequired._id": documentId,
    },
    {
      $set: {
        "documentsRequired.$.isReceived": isReceived,
        "documentsRequired.$.receivedDate": isReceived
          ? receivedDate || new Date()
          : null,
        "documentsRequired.$.receivedBy": isReceived ? req.user._id : null,
      },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("Document not found", 404));
  }

  const updatedDocument = generalDetail.documentsRequired.id(documentId);

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      updatedDocument,
    },
  });
});

exports.deleteDocument = catchAsync(async (req, res, next) => {
  const { matterId, documentId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { documentsRequired: { _id: documentId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or document not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      message: "Document requirement removed successfully",
    },
  });
});

// ============================================
// SERVICE COMPLETION
// ============================================

exports.completeGeneralService = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { completionDate } = req.body;

  const session = await Matter.startSession();
  session.startTransaction();

  try {
    // Update matter
    const matter = await Matter.findOneAndUpdate(
      {
        _id: matterId,
        firmId: req.firmId,
        matterType: "general",
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
      return next(new AppError("General matter not found", 404));
    }

    // Update general detail
    const generalDetail = await GeneralDetail.findOneAndUpdate(
      { matterId, firmId: req.firmId },
      {
        $set: {
          actualCompletionDate: completionDate || new Date(),
          lastModifiedBy: req.user._id,
        },
      },
      { new: true, runValidators: true, session },
    );

    if (!generalDetail) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("General details not found", 404));
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      message: "General service marked as completed",
      data: {
        generalDetail,
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

exports.getGeneralStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  const [
    overviewStats,
    byServiceType,
    requirementStats,
    deliverableStats,
    documentStats,
    recentMatters,
  ] = await Promise.all([
    // Overview statistics
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "general",
        },
      },
      {
        $group: {
          _id: null,
          totalGeneralMatters: { $sum: 1 },
          activeGeneralMatters: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          pendingGeneralMatters: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedGeneralMatters: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),

    // By service type
    GeneralDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Requirements statistics
    GeneralDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$specificRequirements" },
      {
        $group: {
          _id: "$specificRequirements.status",
          count: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [
                { $eq: ["$specificRequirements.status", "completed"] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // Deliverables statistics
    GeneralDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$expectedDeliverables" },
      {
        $group: {
          _id: "$expectedDeliverables.status",
          count: { $sum: 1 },
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $in: [
                        "$expectedDeliverables.status",
                        ["pending", "in-progress"],
                      ],
                    },
                    { $lt: ["$expectedDeliverables.dueDate", new Date()] },
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

    // Documents statistics
    GeneralDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$documentsRequired" },
      {
        $group: {
          _id: "$documentsRequired.isReceived",
          count: { $sum: 1 },
        },
      },
    ]),

    // Recent matters (last 30 days)
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "general",
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
  const pendingRequirements = requirementStats.find((s) => s._id === "pending");
  const pendingDeliverables = deliverableStats.find(
    (s) => s._id === "pending" || s._id === "in-progress",
  );
  const missingDocuments = documentStats.find((s) => s._id === false);

  res.status(200).json({
    status: "success",
    data: {
      overview: overviewStats[0] || {
        totalGeneralMatters: 0,
        activeGeneralMatters: 0,
        pendingGeneralMatters: 0,
        completedGeneralMatters: 0,
      },
      byServiceType,
      requirements: {
        byStatus: requirementStats,
        pending: pendingRequirements?.count || 0,
        completed: requirementStats.reduce(
          (sum, stat) => sum + (stat.completedCount || 0),
          0,
        ),
      },
      deliverables: {
        byStatus: deliverableStats,
        pending: pendingDeliverables?.count || 0,
        overdue: deliverableStats.reduce(
          (sum, stat) => sum + (stat.overdueCount || 0),
          0,
        ),
      },
      documents: {
        received: documentStats.find((s) => s._id === true)?.count || 0,
        missing: missingDocuments?.count || 0,
      },
      recentMatters,
    },
  });
});

// ============================================
// BULK OPERATIONS
// ============================================

exports.bulkUpdateGeneralMatters = catchAsync(async (req, res, next) => {
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
      matterType: "general",
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
