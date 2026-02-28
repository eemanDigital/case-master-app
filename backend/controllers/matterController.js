const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const User = require("../models/userModel");
const LitigationDetail = require("../models/litigationDetailModel");
const CorporateDetail = require("../models/corporateDetailModel");
const AdvisoryDetail = require("../models/advisoryDetailModel");
const PropertyDetail = require("../models/propertyDetailModel");
const {
  RetainerDetail,
  GeneralDetail,
} = require("../models/retainerAndGeneralDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sessionHelper = require("../utils/sessionHelper");

// Initialize pagination service for Matter model
const matterPaginationService = PaginationServiceFactory.createService(
  Matter,
  modelConfigs.Matter,
);

// Map matter types to their detail models
const DETAIL_MODEL_MAP = {
  litigation: LitigationDetail,
  corporate: CorporateDetail,
  advisory: AdvisoryDetail,
  property: PropertyDetail,
  retainer: RetainerDetail,
  general: GeneralDetail,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the appropriate detail model based on matter type
 */
const getDetailModel = (matterType) => {
  return DETAIL_MODEL_MAP[matterType];
};

/**
 * Build query filter with firm isolation
 */
const buildFirmQuery = (req, additionalFilters = {}) => {
  return {
    firmId: req.firmId,
    isDeleted: false,
    ...additionalFilters,
  };
};

/**
 * Populate detail based on matter type
 */
const populateDetailByType = async (matter) => {
  const detailFieldMap = {
    litigation: "litigationDetail",
    corporate: "corporateDetail",
    advisory: "advisoryDetail",
    property: "propertyDetail",
    retainer: "retainerDetail",
    general: "generalDetail",
  };

  const detailField = detailFieldMap[matter.matterType];
  if (detailField) {
    await matter.populate(detailField);
  }
  return matter;
};

// ============================================
// CREATE MATTER
// ============================================

/**
 * @desc    Create a new matter (any type)
 * @route   POST /api/matters
 * @access  Private
 */
exports.createMatter = catchAsync(async (req, res, next) => {
  const { matterType, detailData, ...matterData } = req.body;

  // Validate matter type
  if (!matterType) {
    return next(new AppError("Matter type is required", 400));
  }

  // Validate detail model exists
  const DetailModel = getDetailModel(matterType);
  if (!DetailModel) {
    return next(new AppError(`Invalid matter type: ${matterType}`, 400));
  }

  // Start a session for transaction
  // const session = await Matter.startSession();
  // session.startTransaction();

  try {
    // Create the main Matter document
    const matter = await Matter.create(
      [
        {
          ...matterData,
          matterType,
          firmId: req.firmId,
          createdBy: req.user._id,
        },
      ],
      // { session },
    );

    const newMatter = matter[0];

    // Create type-specific detail document if data provided
    if (detailData && Object.keys(detailData).length > 0) {
      await DetailModel.create(
        [
          {
            ...detailData,
            matterId: newMatter._id,
            firmId: req.firmId,
            createdBy: req.user._id,
          },
        ],
        // { session },
      );
    }

    // Commit transaction
    // await session.commitTransaction();
    // session.endSession();

    // Fetch the created matter with details (outside transaction)
    const populatedMatter = await Matter.findById(newMatter._id)
      .populate("accountOfficer", "firstName lastName email photo")
      .populate("client", "firstName lastName email phone");

    await populateDetailByType(populatedMatter);

    res.status(201).json({
      status: "success",
      data: {
        matter: populatedMatter,
      },
    });
  } catch (error) {
    // Abort transaction on error
    // await session.abortTransaction();
    // session.endSession();
    return next(error);
  }
});

// ============================================
// GET ALL MATTERS (Using Pagination Service)
// ============================================

/**
 * @desc    Get all matters with filtering, sorting, pagination
 * @route   GET /api/matters
 * @access  Private
 */
exports.getAllMatters = catchAsync(async (req, res, next) => {
  const {
    // Standard pagination params
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    includeStats,

    // Matter-specific filters
    matterType,
    status,
    priority,
    client,
    accountOfficer,

    // Advanced search
    search,
    startDate,
    endDate,

    // Other params
    includeDeleted,
    onlyDeleted,
  } = req.query;

  // Use the pagination service
  const result = await matterPaginationService.paginate(
    {
      page,
      limit,
      sort,
      search,
      populate,
      select,
      debug,
      includeStats,
      matterType,
      status,
      priority,
      client,
      accountOfficer,
      startDate,
      endDate,
      includeDeleted,
      onlyDeleted,
    },
    {}, // customFilter
    req.firmId, // firmId for multi-tenancy
  );

  // Populate type-specific details for each matter if needed
  if (populate && populate.includes("details")) {
    for (const matter of result.data) {
      await populateDetailByType(matter);
    }
  }

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// GET SINGLE MATTER
// ============================================

/**
 * @desc    Get single matter by ID with full details
 * @route   GET /api/matters/:id
 * @access  Private
 */
exports.getMatter = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { include } = req.query;

  // Build query with firm isolation
  let query = Matter.findOne(buildFirmQuery(req, { _id: id }))
    .populate("accountOfficer", "firstName lastName email phone photo role")
    .populate("client", "firstName lastName email phone address")
    .populate("createdBy", "firstName lastName")
    .populate("lastModifiedBy", "firstName lastName");

  // Populate type-specific detail
  const matter = await query;

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  // Populate type-specific details
  await populateDetailByType(matter);

  // Optionally populate related entities
  if (include) {
    const includes = include.split(",");
    const relatedFields = [
      "documents",
      "tasks",
      "events",
      "invoices",
      "reports",
    ];

    for (const field of includes) {
      if (relatedFields.includes(field)) {
        await matter.populate(field);
      }
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      matter,
    },
  });
});

// ============================================
// UPDATE MATTER
// ============================================

/**
 * @desc    Update matter (core fields only)
 * @route   PATCH /api/matters/:id
 * @access  Private
 */
exports.updateMatter = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { detailData, ...matterData } = req.body;

  // Fields that should not be updated directly
  const restrictedFields = [
    "firmId",
    "matterNumber",
    "createdBy",
    "createdAt",
    "matterType", // Changing matter type requires special handling
  ];

  restrictedFields.forEach((field) => delete matterData[field]);

  // Find matter first to get current type
  const existingMatter = await Matter.findOne(buildFirmQuery(req, { _id: id }));

  if (!existingMatter) {
    return next(new AppError("Matter not found", 404));
  }

  // const session = await Matter.startSession();
  // session.startTransaction();

  try {
    // Update main matter document
    const matter = await Matter.findOneAndUpdate(
      buildFirmQuery(req, { _id: id }),
      {
        ...matterData,
        lastModifiedBy: req.user._id,
        lastActivityDate: Date.now(),
      },
      {
        new: true,
        runValidators: true,
        // session,
      },
    );

    // Update type-specific details if provided
    if (detailData && Object.keys(detailData).length > 0) {
      const DetailModel = getDetailModel(existingMatter.matterType);

      if (DetailModel) {
        await DetailModel.findOneAndUpdate(
          { matterId: matter._id, firmId: req.firmId },
          {
            ...detailData,
            lastModifiedBy: req.user._id,
          },
          {
            new: true,
            runValidators: true,
            upsert: true,
            // session,
          },
        );
      }
    }

    // await session.commitTransaction();
    // session.endSession();

    // Fetch updated matter with details
    const updatedMatter = await Matter.findById(matter._id)
      .populate("accountOfficer", "firstName lastName email photo")
      .populate("client", "firstName lastName email phone");

    await populateDetailByType(updatedMatter);

    res.status(200).json({
      status: "success",
      data: {
        matter: updatedMatter,
      },
    });
  } catch (error) {
    // await session.abortTransaction();
    // session.endSession();
    return next(error);
  }
});

// ============================================
// DELETE MATTER (SOFT DELETE)
// ============================================

/**
 * @desc    Soft delete a matter
 * @route   DELETE /api/matters/:id
 * @access  Private
 */
exports.deleteMatter = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const session = await Matter.startSession();
  session.startTransaction();

  try {
    const matter = await Matter.findOne(buildFirmQuery(req, { _id: id }));

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Matter not found", 404));
    }

    // Soft delete the matter
    await matter.softDelete(req.user._id);

    // Soft delete the associated detail
    const DetailModel = getDetailModel(matter.matterType);
    if (DetailModel) {
      await DetailModel.findOneAndUpdate(
        { matterId: matter._id, firmId: req.firmId },
        {
          isDeleted: true,
          deletedAt: Date.now(),
          deletedBy: req.user._id,
        },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

// ============================================
// RESTORE MATTER
// ============================================

/**
 * @desc    Restore a soft-deleted matter
 * @route   PATCH /api/matters/:id/restore
 * @access  Private
 */
exports.restoreMatter = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const session = await Matter.startSession();
  session.startTransaction();

  try {
    const matter = await Matter.findOne({
      firmId: req.firmId,
      _id: id,
      isDeleted: true,
    });

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Deleted matter not found", 404));
    }

    // Restore the matter
    await matter.restore();

    // Restore the associated detail
    const DetailModel = getDetailModel(matter.matterType);
    if (DetailModel) {
      await DetailModel.findOneAndUpdate(
        { matterId: matter._id, firmId: req.firmId },
        {
          isDeleted: false,
          $unset: { deletedAt: 1, deletedBy: 1 },
        },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      data: {
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
// GET MATTER STATISTICS (Enhanced)
// ============================================

/**
 * @desc    Get matter statistics for dashboard
 * @route   GET /api/matters/stats
 * @access  Private
 */
exports.getMatterStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  // Use parallel execution for better performance
  const [overviewStats, typeStats, statusStats, priorityStats, activityStats] =
    await Promise.all([
      // Overview statistics
      Matter.aggregate([
        { $match: firmQuery },
        {
          $group: {
            _id: null,
            totalMatters: { $sum: 1 },
            activeMatters: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
            pendingMatters: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            completedMatters: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            closedMatters: {
              $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
            },
            highPriorityMatters: {
              $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
            },
            urgentPriorityMatters: {
              $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
            },
            averageAgeDays: {
              $avg: {
                $divide: [
                  { $subtract: [new Date(), "$dateOpened"] },
                  1000 * 60 * 60 * 24,
                ],
              },
            },
          },
        },
      ]),

      // Statistics by matter type
      Matter.aggregate([
        { $match: firmQuery },
        {
          $group: {
            _id: "$matterType",
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Statistics by status
      Matter.aggregate([
        { $match: firmQuery },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Statistics by priority
      Matter.aggregate([
        { $match: firmQuery },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Recent activity (last 30 days)
      Matter.aggregate([
        {
          $match: {
            ...firmQuery,
            lastActivityDate: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$lastActivityDate" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 10 },
      ]),
    ]);

  // Get my matters count
  const myMattersCount = await Matter.countDocuments({
    ...firmQuery,
    accountOfficer: req.user._id,
  });

  res.status(200).json({
    status: "success",
    data: {
      overview: overviewStats[0] || {
        totalMatters: 0,
        activeMatters: 0,
        pendingMatters: 0,
        completedMatters: 0,
        closedMatters: 0,
      },
      byType: typeStats,
      byStatus: statusStats,
      byPriority: priorityStats,
      recentActivity: activityStats,
      myMatters: myMattersCount,
    },
  });
});

// ============================================
// GET MY MATTERS (Using Pagination Service)
// ============================================

/**
 * @desc    Get matters assigned to the logged-in user
 * @route   GET /api/matters/my-matters
 * @access  Private
 */
exports.getMyMatters = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    status,
    priority,
    matterType,
    search,
    startDate,
    endDate,
  } = req.query;

  // Add accountOfficer filter for "my matters"
  const customFilter = {
    accountOfficer: req.user._id,
  };

  // Use pagination service
  const result = await matterPaginationService.paginate(
    {
      page,
      limit,
      sort,
      populate,
      select,
      debug,
      status,
      priority,
      matterType,
      search,
      startDate,
      endDate,
    },
    customFilter,
    req.firmId,
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// GET ALL MATTERS WITH ACCOUNT OFFICERS
// ============================================

/**
 * @desc    Get all matters with populated account officers (for admin dashboard)
 * @route   GET /api/matters/with-officers
 * @access  Private (Admin/Lawyer/Staff)
 */
exports.getAllMattersWithOfficers = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    status,
    priority,
    matterType,
    search,
    startDate,
    endDate,
    officerId,
  } = req.query;

  // Build custom filter
  const customFilter = {};

  // Filter by account officer if provided
  if (officerId) {
    customFilter.accountOfficer = officerId;
  }

  // Use pagination service with always-populated accountOfficer
  const result = await matterPaginationService.paginate(
    {
      page,
      limit,
      sort,
      populate: "accountOfficer,client",
      select: "matterNumber title description status priority matterType natureOfMatter dateOpened expectedClosureDate client accountOfficer",
      status,
      priority,
      matterType,
      search,
      startDate,
      endDate,
    },
    customFilter,
    req.firmId,
  );

  // Aggregate account officer statistics
  const officerStats = await Matter.aggregate([
    { $match: { firmId: req.firmId, isDeleted: false } },
    { $unwind: "$accountOfficer" },
    {
      $group: {
        _id: "$accountOfficer",
        matterCount: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        completedCount: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "officer",
      },
    },
    { $unwind: "$officer" },
    {
      $project: {
        _id: 0,
        officerId: "$_id",
        officerName: { $concat: ["$officer.firstName", " ", "$officer.lastName"] },
        officerEmail: "$officer.email",
        officerPhoto: "$officer.photo",
        officerRole: "$officer.role",
        officerPosition: "$officer.position",
        matterCount: 1,
        activeCount: 1,
        pendingCount: 1,
        completedCount: 1,
      },
    },
    { $sort: { matterCount: -1 } },
  ]);

  res.status(200).json({
    status: "success",
    ...result,
    officerStatistics: officerStats,
  });
});

// ============================================
// GET USER'S MATTERS SUMMARY (For Dashboard)
// ============================================

/**
 * @desc    Get summary of matters assigned to logged-in user for dashboard
 * @route   GET /api/matters/my-matters-summary
 * @access  Private
 */
exports.getMyMattersSummary = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  // Get all matters assigned to this user
  const [
    totalMatters,
    activeMatters,
    pendingMatters,
    completedMatters,
    urgentMatters,
    highPriorityMatters,
    recentMatters,
    byType,
    byStatus,
  ] = await Promise.all([
    // Total matters assigned to user
    Matter.countDocuments({
      ...firmQuery,
      accountOfficer: userId,
    }),

    // Active matters
    Matter.countDocuments({
      ...firmQuery,
      accountOfficer: userId,
      status: "active",
    }),

    // Pending matters
    Matter.countDocuments({
      ...firmQuery,
      accountOfficer: userId,
      status: "pending",
    }),

    // Completed matters
    Matter.countDocuments({
      ...firmQuery,
      accountOfficer: userId,
      status: "completed",
    }),

    // Urgent matters
    Matter.countDocuments({
      ...firmQuery,
      accountOfficer: userId,
      priority: "urgent",
    }),

    // High priority matters
    Matter.countDocuments({
      ...firmQuery,
      accountOfficer: userId,
      priority: "high",
    }),

    // Recent matters (last 5)
    Matter.find({
      ...firmQuery,
      accountOfficer: userId,
    })
      .sort("-dateOpened")
      .limit(5)
      .select("matterNumber title status priority matterType dateOpened")
      .populate("client", "firstName lastName")
      .lean(),

    // Matters by type
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          accountOfficer: userId,
        },
      },
      {
        $group: {
          _id: "$matterType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Matters by status
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          accountOfficer: userId,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Calculate completion rate
  const completionRate = totalMatters > 0 
    ? Math.round((completedMatters / totalMatters) * 100) 
    : 0;

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        totalMatters,
        activeMatters,
        pendingMatters,
        completedMatters,
        urgentMatters,
        highPriorityMatters,
        completionRate,
      },
      recentMatters,
      byType,
      byStatus,
    },
  });
});

// ============================================
// SEARCH MATTERS (Advanced)
// ============================================

/**
 * @desc    Advanced search for matters
 * @route   POST /api/matters/search
 * @access  Private
 */
exports.searchMatters = catchAsync(async (req, res, next) => {
  const { criteria = {}, options = {} } = req.body;

  // Add firmId to criteria
  const firmCriteria = {
    ...criteria,
    firmId: req.firmId,
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
// BULK OPERATIONS
// ============================================

/**
 * @desc    Update multiple matters
 * @route   PATCH /api/matters/bulk-update
 * @access  Private (Admin/Lawyer only)
 */
exports.bulkUpdateMatters = catchAsync(async (req, res, next) => {
  const { matterIds, updates } = req.body;

  if (!matterIds || !Array.isArray(matterIds) || matterIds.length === 0) {
    return next(new AppError("Please provide matter IDs to update", 400));
  }

  if (!updates || Object.keys(updates).length === 0) {
    return next(new AppError("Please provide updates to apply", 400));
  }

  // Validate user has access to these matters
  const accessibleMatterIds = await Matter.find({
    _id: { $in: matterIds },
    firmId: req.firmId,
  }).distinct("_id");

  if (accessibleMatterIds.length === 0) {
    return next(new AppError("No accessible matters found", 404));
  }

  // Update matters
  const result = await Matter.updateMany(
    { _id: { $in: accessibleMatterIds }, firmId: req.firmId },
    {
      $set: updates,
      $push: {
        activityLog: {
          action: "bulk_update",
          user: req.user._id,
          changes: updates,
          timestamp: new Date(),
        },
      },
    },
  );

  // Get updated matters - ALWAYS return array
  const updatedMatters = await Matter.find({
    _id: { $in: accessibleMatterIds },
    firmId: req.firmId,
  })
    .populate("client", "firstName lastName email companyName")
    .populate("accountOfficer", "firstName lastName email")
    .lean();

  // Ensure it's an array
  const mattersArray = Array.isArray(updatedMatters) ? updatedMatters : [];

  res.status(200).json({
    success: true,
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      matters: mattersArray,
      clearSelection: true,
    },
  });
});

// controllers/matterController.js (continuing from your existing code)

// ============================================
// BULK ASSIGN ACCOUNT OFFICER
// ============================================

/**
 * @desc    Bulk assign account officer to multiple matters
 * @route   POST /api/matters/bulk-assign-officer
 * @access  Private (Admin/Lawyer only)
 */
exports.bulkAssignOfficer = catchAsync(async (req, res, next) => {
  const { matterIds, officerId } = req.body;

  if (!matterIds || !Array.isArray(matterIds) || matterIds.length === 0) {
    return next(new AppError("Please provide matter IDs", 400));
  }

  if (!officerId) {
    return next(new AppError("Please provide officer ID", 400));
  }

  // Verify officer exists and belongs to the same firm
  const officer = await User.findOne({
    _id: officerId,
    firmId: req.firmId,
    $or: [
      { userType: "lawyer" },
      { userType: "admin" },
      { additionalRoles: "admin" },
      { additionalRoles: "super-admin" },
    ],
  });

  if (!officer) {
    return next(
      new AppError("Officer not found or not authorized for this role", 404),
    );
  }

  // const session = await Matter.startSession();
  // session.startTransaction();

  try {
    // Update matters with new officer
    const result = await Matter.updateMany(
      {
        _id: { $in: matterIds },
        firmId: req.firmId,
      },
      {
        $addToSet: { accountOfficer: officerId },
        lastModifiedBy: req.user._id,
        lastActivityDate: Date.now(),
        $push: {
          activityLog: {
            action: "assigned_officer",
            user: req.user._id,
            officer: officerId,
            timestamp: Date.now(),
            details: `Assigned to ${officer.firstName} ${officer.lastName}`,
          },
        },
      },
      // { session },
    );

    // await session.commitTransaction();
    // session.endSession();

    res.status(200).json({
      status: "success",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        officer: {
          id: officer._id,
          name: `${officer.firstName} ${officer.lastName}`,
          email: officer.email,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    // session.endSession();
    return next(error);
  }
});

// ============================================
// BULK DELETE MATTERS
// ============================================

/**
 * @desc    Bulk delete multiple matters (soft delete)
 * @route   DELETE /api/matters/bulk-delete
 * @access  Private (Admin/Lawyer only)
 */
// exports.bulkDeleteMatters = catchAsync(async (req, res, next) => {
//   const { matterIds } = req.body;

//   if (!matterIds || !Array.isArray(matterIds) || matterIds.length === 0) {
//     return next(new AppError("Please provide matter IDs to delete", 400));
//   }

//   const session = await Matter.startSession();
//   session.startTransaction();

//   try {
//     // Find all matters to be deleted
//     const matters = await Matter.find({
//       _id: { $in: matterIds },
//       firmId: req.firmId,
//       isDeleted: false,
//     }).session(session);

//     if (matters.length === 0) {
//       await session.abortTransaction();
//       session.endSession();
//       return next(new AppError("No accessible matters found to delete", 404));
//     }

//     // Soft delete all matters
//     const deletionPromises = matters.map((matter) =>
//       matter.softDelete(req.user._id, session),
//     );

//     await Promise.all(deletionPromises);

//     // Also soft delete associated detail documents
//     const detailDeletionPromises = matters.map(async (matter) => {
//       const DetailModel = getDetailModel(matter.matterType);
//       if (DetailModel) {
//         return DetailModel.findOneAndUpdate(
//           { matterId: matter._id, firmId: req.firmId },
//           {
//             isDeleted: true,
//             deletedAt: Date.now(),
//             deletedBy: req.user._id,
//           },
//           { session },
//         );
//       }
//     });

//     await Promise.all(detailDeletionPromises);

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       status: "success",
//       data: {
//         deletedCount: matters.length,
//         deletedMatterIds: matters.map((m) => m._id),
//       },
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     return next(error);
//   }
// });

exports.bulkDeleteMatters = catchAsync(async (req, res, next) => {
  const { matterIds } = req.body;

  if (!matterIds || !Array.isArray(matterIds) || matterIds.length === 0) {
    return next(new AppError("Please provide matter IDs to delete", 400));
  }

  const session = await sessionHelper.startSession();

  try {
    // Find all matters to be deleted
    const matters = await sessionHelper.executeWithSession(
      Matter.find({
        _id: { $in: matterIds },
        firmId: req.firmId,
        isDeleted: false,
      }),
      session,
    );

    if (matters.length === 0) {
      await sessionHelper.abortTransaction(session);
      return next(new AppError("No accessible matters found to delete", 404));
    }

    // Soft delete all matters
    const deletionPromises = matters.map(async (matter) => {
      matter.isDeleted = true;
      matter.deletedAt = Date.now();
      matter.deletedBy = req.user._id;
      matter.lastModifiedBy = req.user._id;
      matter.lastActivityDate = Date.now();

      return await sessionHelper.saveWithSession(matter, session);
    });

    await Promise.all(deletionPromises);

    // Also soft delete associated detail documents
    const detailDeletionPromises = matters.map(async (matter) => {
      const DetailModel = getDetailModel(matter.matterType);
      if (DetailModel) {
        return await sessionHelper.executeWithSession(
          DetailModel.findOneAndUpdate(
            { matterId: matter._id, firmId: req.firmId },
            {
              isDeleted: true,
              deletedAt: Date.now(),
              deletedBy: req.user._id,
            },
            { new: true },
          ),
          session,
        );
      }
    });

    await Promise.all(detailDeletionPromises.filter(Boolean));

    await sessionHelper.commitTransaction(session);

    // Log deletion
    if (process.env.NODE_ENV !== "test") {
      console.log(`Bulk delete completed: ${matters.length} matters deleted`, {
        userId: req.user._id,
        firmId: req.firmId,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        deletedCount: matters.length,
        deletedMatterIds: matters.map((m) => m._id),
      },
    });
  } catch (error) {
    await sessionHelper.abortTransaction(session);

    // Handle specific errors
    if (error.name === "AppError") {
      return next(error);
    }

    // Log unexpected errors
    console.error("Bulk delete error:", error);

    return next(
      new AppError(
        error.message || "An error occurred while deleting matters",
        500,
      ),
    );
  }
});

// ============================================
// EXPORT MATTERS
// ============================================

/**
 * @desc    Export matters data in various formats
 * @route   POST /api/matters/export
 * @access  Private
 */
exports.exportMatters = catchAsync(async (req, res, next) => {
  const { matterIds, format = "csv" } = req.body;

  if (!matterIds || !Array.isArray(matterIds) || matterIds.length === 0) {
    return next(new AppError("Please provide matter IDs to export", 400));
  }

  // Get matters with necessary fields
  const matters = await Matter.find({
    _id: { $in: matterIds },
    firmId: req.firmId,
    isDeleted: false,
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email position")
    .populate("createdBy", "firstName lastName")
    .lean();

  if (matters.length === 0) {
    return next(new AppError("No accessible matters found to export", 404));
  }

  // Format data based on export format
  let data, contentType, filename;

  switch (format.toLowerCase()) {
    case "csv":
      data = convertToCSV(matters);
      contentType = "text/csv";
      filename = `matters-export-${Date.now()}.csv`;
      break;

    case "excel":
      data = await generateExcel(matters);
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      filename = `matters-export-${Date.now()}.xlsx`;
      break;

    case "pdf":
      data = await generatePDF(matters);
      contentType = "application/pdf";
      filename = `matters-export-${Date.now()}.pdf`;
      break;

    default:
      return next(new AppError(`Unsupported export format: ${format}`, 400));
  }

  // Set headers for file download
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  // Send the file data
  res.send(data);
});

// ============================================
// HELPER FUNCTIONS FOR EXPORT
// ============================================

/**
 * Convert matters array to CSV format
 */
const convertToCSV = (matters) => {
  const headers = [
    "Matter Number",
    "Title",
    "Client Name",
    "Client Email",
    "Client Phone",
    "Matter Type",
    "Status",
    "Priority",
    "Date Opened",
    "Expected Closure",
    "Account Officers",
    "Category",
    "Nature",
    "Estimated Value",
    "Currency",
    "Billing Type",
    "Created By",
    "Last Modified",
  ];

  const rows = matters.map((matter) => [
    matter.matterNumber,
    matter.title,
    matter.client ? `${matter.client.firstName} ${matter.client.lastName}` : "",
    matter.client?.email || "",
    matter.client?.phone || "",
    matter.matterType,
    matter.status,
    matter.priority,
    matter.dateOpened ? new Date(matter.dateOpened).toLocaleDateString() : "",
    matter.expectedClosureDate
      ? new Date(matter.expectedClosureDate).toLocaleDateString()
      : "",
    matter.accountOfficer
      ?.map((officer) => `${officer.firstName} ${officer.lastName}`)
      .join(", ") || "",
    matter.category,
    matter.natureOfMatter,
    matter.estimatedValue || "",
    matter.currency,
    matter.billingType,
    matter.createdBy
      ? `${matter.createdBy.firstName} ${matter.createdBy.lastName}`
      : "",
    matter.lastModifiedBy
      ? new Date(matter.lastModifiedDate).toLocaleDateString()
      : "",
  ]);

  // Convert to CSV string
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
};

/**
 * Generate Excel file from matters
 */
const generateExcel = async (matters) => {
  const ExcelJS = require("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Matters");

  // Define columns
  worksheet.columns = [
    { header: "Matter Number", key: "matterNumber", width: 15 },
    { header: "Title", key: "title", width: 30 },
    { header: "Client", key: "client", width: 25 },
    { header: "Client Email", key: "clientEmail", width: 25 },
    { header: "Client Phone", key: "clientPhone", width: 15 },
    { header: "Type", key: "type", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Date Opened", key: "dateOpened", width: 12 },
    { header: "Expected Closure", key: "expectedClosure", width: 15 },
    { header: "Account Officers", key: "officers", width: 30 },
    { header: "Category", key: "category", width: 15 },
    { header: "Nature", key: "nature", width: 20 },
    { header: "Estimated Value", key: "value", width: 15 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Billing Type", key: "billing", width: 12 },
    { header: "Created By", key: "createdBy", width: 20 },
    { header: "Last Modified", key: "lastModified", width: 12 },
  ];

  // Add data rows
  matters.forEach((matter) => {
    worksheet.addRow({
      matterNumber: matter.matterNumber,
      title: matter.title,
      client: matter.client
        ? `${matter.client.firstName} ${matter.client.lastName}`
        : "",
      clientEmail: matter.client?.email || "",
      clientPhone: matter.client?.phone || "",
      type: matter.matterType,
      status: matter.status,
      priority: matter.priority,
      dateOpened: matter.dateOpened
        ? new Date(matter.dateOpened).toLocaleDateString()
        : "",
      expectedClosure: matter.expectedClosureDate
        ? new Date(matter.expectedClosureDate).toLocaleDateString()
        : "",
      officers:
        matter.accountOfficer
          ?.map((officer) => `${officer.firstName} ${officer.lastName}`)
          .join(", ") || "",
      category: matter.category,
      nature: matter.natureOfMatter,
      value: matter.estimatedValue || "",
      currency: matter.currency,
      billing: matter.billingType,
      createdBy: matter.createdBy
        ? `${matter.createdBy.firstName} ${matter.createdBy.lastName}`
        : "",
      lastModified: matter.lastModifiedBy
        ? new Date(matter.lastModifiedDate).toLocaleDateString()
        : "",
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Generate PDF from matters
 */
const generatePDF = async (matters) => {
  const PDFDocument = require("pdfkit");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // 1. Header
    doc.fontSize(20).text("Matters Export", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(10)
      .text(
        `Generated on: ${new Date().toLocaleDateString()} | Total: ${matters.length}`,
        { align: "center" },
      );
    doc.moveDown(2);

    // 2. Table Settings
    const startX = 50;
    const colWidths = [60, 140, 80, 60, 60, 50, 60];
    const headers = [
      "Matter #",
      "Title",
      "Client",
      "Type",
      "Status",
      "Priority",
      "Date",
    ];
    let currentY = doc.y;

    // Helper to draw a row
    const drawRow = (rowArray, isHeader = false) => {
      let x = startX;
      const rowHeight = 25;

      // Check for page overflow
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }

      rowArray.forEach((text, i) => {
        doc.rect(x, currentY, colWidths[i], rowHeight).stroke();
        doc
          .fontSize(isHeader ? 9 : 8)
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .text(text || "", x + 5, currentY + 7, {
            width: colWidths[i] - 10,
            lineBreak: false,
          });
        x += colWidths[i];
      });

      currentY += rowHeight;
    };

    // 3. Render Header Row
    drawRow(headers, true);

    // 4. Render Data Rows
    matters.forEach((matter) => {
      const rowData = [
        matter.matterNumber,
        matter.title?.substring(0, 25),
        matter.client
          ? `${matter.client.firstName} ${matter.client.lastName}`
          : "N/A",
        matter.matterType,
        matter.status,
        matter.priority,
        matter.dateOpened
          ? new Date(matter.dateOpened).toLocaleDateString()
          : "",
      ];
      drawRow(rowData);
    });

    doc.end();
  });
};

// ============================================
// GET MATTERS BY TYPE
// ============================================

/**
 * @desc    Get matters by specific type
 * @route   GET /api/matters/type/:matterType
 * @access  Private
 */
exports.getMattersByType = catchAsync(async (req, res, next) => {
  const { matterType } = req.params;
  const {
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    status,
    priority,
    search,
    startDate,
    endDate,
  } = req.query;

  // Validate matter type
  if (!DETAIL_MODEL_MAP[matterType]) {
    return next(new AppError(`Invalid matter type: ${matterType}`, 400));
  }

  const customFilter = { matterType };

  const result = await matterPaginationService.paginate(
    {
      page,
      limit,
      sort,
      populate,
      select,
      debug,
      status,
      priority,
      search,
      startDate,
      endDate,
    },
    customFilter,
    req.firmId,
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// GET MATTERS BY STATUS
// ============================================

/**
 * @desc    Get matters by specific status
 * @route   GET /api/matters/status/:status
 * @access  Private
 */
exports.getMattersByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  const {
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    matterType,
    priority,
    search,
    startDate,
    endDate,
  } = req.query;

  const customFilter = { status };

  const result = await matterPaginationService.paginate(
    {
      page,
      limit,
      sort,
      populate,
      select,
      debug,
      matterType,
      priority,
      search,
      startDate,
      endDate,
    },
    customFilter,
    req.firmId,
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// GET PENDING MATTERS (Shortcut)
// ============================================

/**
 * @desc    Get all pending matters
 * @route   GET /api/matters/pending
 * @access  Private
 */
exports.getPendingMatters = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    matterType,
    priority,
    search,
    startDate,
    endDate,
  } = req.query;

  const customFilter = { status: "pending" };

  const result = await matterPaginationService.paginate(
    {
      page,
      limit,
      sort,
      populate,
      select,
      debug,
      matterType,
      priority,
      search,
      startDate,
      endDate,
    },
    customFilter,
    req.firmId,
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// GET URGENT MATTERS (Shortcut)
// ============================================

/**
 * @desc    Get all urgent/high priority matters
 * @route   GET /api/matters/urgent
 * @access  Private
 */
exports.getUrgentMatters = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    matterType,
    status,
    search,
    startDate,
    endDate,
  } = req.query;

  const customFilter = {
    $or: [{ priority: "urgent" }, { priority: "high" }],
  };

  const result = await matterPaginationService.paginate(
    {
      page,
      limit,
      sort,
      populate,
      select,
      debug,
      matterType,
      status,
      search,
      startDate,
      endDate,
    },
    customFilter,
    req.firmId,
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// GET RECENT ACTIVITY
// ============================================

/**
 * @desc    Get recently updated matters
 * @route   GET /api/matters/recent-activity
 * @access  Private
 */
exports.getRecentActivity = catchAsync(async (req, res, next) => {
  const { days = 7, limit = 10 } = req.query;

  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const recentMatters = await Matter.find({
    firmId: req.firmId,
    isDeleted: false,
    lastActivityDate: { $gte: cutoffDate },
  })
    .sort("-lastActivityDate")
    .limit(parseInt(limit))
    .populate("client", "firstName lastName")
    .populate("lastModifiedBy", "firstName lastName")
    .select("title matterNumber matterType status lastActivityDate");

  res.status(200).json({
    status: "success",
    data: {
      matters: recentMatters,
      timeframe: `${days} days`,
    },
  });
});

// ============================================
// VALIDATE MATTER NUMBER
// ============================================

/**
 * @desc    Check if matter number is unique
 * @route   GET /api/matters/validate-matter-number/:matterNumber
 * @access  Private (Admin/Lawyer/HR only)
 */
exports.validateMatterNumber = catchAsync(async (req, res, next) => {
  const { matterNumber } = req.params;

  const existingMatter = await Matter.findOne({
    matterNumber,
    firmId: req.firmId,
    isDeleted: false,
  });

  res.status(200).json({
    status: "success",
    data: {
      isAvailable: !existingMatter,
      message: existingMatter
        ? "Matter number already exists"
        : "Matter number is available",
    },
  });
});

// ============================================
// GET MATTER TIMELINE
// ============================================

/**
 * @desc    Get matter activity timeline
 * @route   GET /api/matters/:id/timeline
 * @access  Private
 */
exports.getMatterTimeline = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const matter = await Matter.findOne({
    _id: id,
    firmId: req.firmId,
    isDeleted: false,
  }).select("activityLog title matterNumber");

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  // Sort activity log by timestamp (most recent first)
  const timeline = (matter.activityLog || []).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );

  res.status(200).json({
    status: "success",
    data: {
      matter: {
        _id: matter._id,
        title: matter.title,
        matterNumber: matter.matterNumber,
      },
      timeline,
    },
  });
});

// ============================================
// ADD ACTIVITY LOG ENTRY
// ============================================

/**
 * @desc    Add activity log entry to matter
 * @route   POST /api/matters/:id/activity
 * @access  Private
 */
exports.addActivityLog = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { action, details } = req.body;

  if (!action || !details) {
    return next(new AppError("Action and details are required", 400));
  }

  const matter = await Matter.findOneAndUpdate(
    {
      _id: id,
      firmId: req.firmId,
      isDeleted: false,
    },
    {
      $push: {
        activityLog: {
          action,
          details,
          user: req.user._id,
          timestamp: Date.now(),
        },
      },
      lastActivityDate: Date.now(),
    },
    { new: true, runValidators: true },
  ).select("title matterNumber activityLog");

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      matter,
      activityAdded: matter.activityLog[matter.activityLog.length - 1],
    },
  });
});

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

/**
 * Middleware to check if user has access to matter
 */
exports.checkMatterAccess = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const matter = await Matter.findOne({
    _id: id,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Matter not found or no access", 404));
  }

  // Check if user is assigned as account officer or is admin
  const isAssignedOfficer = matter.accountOfficer.some(
    (officerId) => officerId.toString() === req.user._id.toString(),
  );
  const isAdmin =
    req.user.userType === "admin" ||
    req.user.additionalRoles?.includes("admin") ||
    req.user.additionalRoles?.includes("super-admin");

  if (!isAssignedOfficer && !isAdmin) {
    return next(
      new AppError("You don't have permission to access this matter", 403),
    );
  }

  req.matter = matter;
  next();
});

/**
 * Middleware to validate matter type
 */
exports.validateMatterType = catchAsync(async (req, res, next) => {
  const { matterType } = req.body;

  if (matterType && !DETAIL_MODEL_MAP[matterType]) {
    return next(new AppError(`Invalid matter type: ${matterType}`, 400));
  }

  next();
});

/**
 * Middleware to check bulk operation limits
 */
exports.checkBulkOperationLimit = catchAsync(async (req, res, next) => {
  const { matterIds } = req.body;

  if (!matterIds || !Array.isArray(matterIds)) {
    return next(new AppError("matterIds must be an array", 400));
  }

  if (matterIds.length === 0) {
    return next(new AppError("No matters selected for bulk operation", 400));
  }

  // Set reasonable limit (adjust as needed)
  const MAX_BULK_OPERATION = 100;
  if (matterIds.length > MAX_BULK_OPERATION) {
    return next(
      new AppError(
        `Cannot process more than ${MAX_BULK_OPERATION} matters at once`,
        400,
      ),
    );
  }

  next();
});

/**
 * Middleware to log bulk operation
 */
exports.logBulkOperation = catchAsync(async (req, res, next) => {
  const { matterIds } = req.body;
  const action = req.originalUrl.split("/").pop(); // Extract action from URL

  console.log(
    `[${new Date().toISOString()}] Bulk ${action} by user ${
      req.user._id
    }: ${matterIds.length} matters`,
  );

  next();
});

module.exports = exports;
