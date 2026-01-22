const Matter = require("../models/matterModel");
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
const populateDetailByType = (query, matterType) => {
  const detailFieldMap = {
    litigation: "litigationDetail",
    corporate: "corporateDetail",
    advisory: "advisoryDetail",
    property: "propertyDetail",
    retainer: "retainerDetail",
    general: "generalDetail",
  };

  const detailField = detailFieldMap[matterType];
  if (detailField) {
    return query.populate(detailField);
  }
  return query;
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

  // Create the main Matter document
  const matter = await Matter.create({
    ...matterData,
    matterType,
    firmId: req.firmId,
    createdBy: req.user._id,
  });

  // Create type-specific detail document if data provided
  if (detailData && Object.keys(detailData).length > 0) {
    const DetailModel = getDetailModel(matterType);

    if (!DetailModel) {
      return next(new AppError(`Invalid matter type: ${matterType}`, 400));
    }

    await DetailModel.create({
      ...detailData,
      matterId: matter._id,
      firmId: req.firmId,
    });
  }

  // Fetch the created matter with details
  const createdMatter = await Matter.findById(matter._id)
    .populate("accountOfficer", "firstName lastName email photo")
    .populate("client", "firstName lastName email phone");

  // Populate type-specific detail
  const populatedMatter = await populateDetailByType(
    Matter.findById(matter._id)
      .populate("accountOfficer", "firstName lastName email photo")
      .populate("client", "firstName lastName email phone"),
    matterType,
  );

  res.status(201).json({
    status: "success",
    data: {
      matter: populatedMatter,
    },
  });
});

// ============================================
// GET ALL MATTERS
// ============================================

/**
 * @desc    Get all matters with filtering, sorting, pagination
 * @route   GET /api/matters
 * @access  Private
 */
exports.getAllMatters = catchAsync(async (req, res, next) => {
  const {
    matterType,
    status,
    priority,
    client,
    accountOfficer,
    search,
    page = 1,
    limit = 50,
    sort = "-dateOpened",
  } = req.query;

  // Build filter
  const filter = buildFirmQuery(req);

  if (matterType) filter.matterType = matterType;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (client) filter.client = client;
  if (accountOfficer) filter.accountOfficer = accountOfficer;

  // Text search on title and description
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { matterNumber: { $regex: search, $options: "i" } },
    ];
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;

  const matters = await Matter.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("accountOfficer", "firstName lastName email photo")
    .populate("client", "firstName lastName email phone")
    .select(
      "matterNumber title matterType status priority dateOpened client accountOfficer natureOfMatter",
    );

  // Get total count for pagination
  const total = await Matter.countDocuments(filter);

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
// GET SINGLE MATTER
// ============================================

/**
 * @desc    Get single matter by ID with full details
 * @route   GET /api/matters/:id
 * @access  Private
 */
exports.getMatter = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find matter with firm isolation
  const matter = await Matter.findOne(buildFirmQuery(req, { _id: id }))
    .populate("accountOfficer", "firstName lastName email phone photo role")
    .populate("client", "firstName lastName email phone address")
    .populate("createdBy", "firstName lastName")
    .populate("lastModifiedBy", "firstName lastName");

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  // Populate type-specific details
  await matter.populate(
    matter.matterType === "litigation"
      ? "litigationDetail"
      : matter.matterType === "corporate"
        ? "corporateDetail"
        : matter.matterType === "advisory"
          ? "advisoryDetail"
          : matter.matterType === "property"
            ? "propertyDetail"
            : matter.matterType === "retainer"
              ? "retainerDetail"
              : "generalDetail",
  );

  // Optionally populate related entities (documents, tasks, etc.)
  if (req.query.include) {
    const includes = req.query.include.split(",");

    for (const include of includes) {
      if (
        ["documents", "tasks", "events", "invoices", "reports"].includes(
          include,
        )
      ) {
        await matter.populate(include);
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
  const restrictedFields = ["firmId", "matterNumber", "createdBy", "createdAt"];
  restrictedFields.forEach((field) => delete matterData[field]);

  // Find and update matter
  const matter = await Matter.findOneAndUpdate(
    buildFirmQuery(req, { _id: id }),
    {
      ...matterData,
      lastModifiedBy: req.user._id,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  // Update type-specific details if provided
  if (detailData && Object.keys(detailData).length > 0) {
    const DetailModel = getDetailModel(matter.matterType);

    if (DetailModel) {
      await DetailModel.findOneAndUpdate(
        { matterId: matter._id, firmId: req.firmId },
        detailData,
        { new: true, runValidators: true, upsert: true },
      );
    }
  }

  // Fetch updated matter with details
  const updatedMatter = await Matter.findById(matter._id)
    .populate("accountOfficer", "firstName lastName email photo")
    .populate("client", "firstName lastName email phone");

  await updatedMatter.populate(
    matter.matterType === "litigation"
      ? "litigationDetail"
      : matter.matterType === "corporate"
        ? "corporateDetail"
        : matter.matterType === "advisory"
          ? "advisoryDetail"
          : matter.matterType === "property"
            ? "propertyDetail"
            : matter.matterType === "retainer"
              ? "retainerDetail"
              : "generalDetail",
  );

  res.status(200).json({
    status: "success",
    data: {
      matter: updatedMatter,
    },
  });
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

  const matter = await Matter.findOne(buildFirmQuery(req, { _id: id }));

  if (!matter) {
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
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
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

  const matter = await Matter.findOne({
    firmId: req.firmId,
    _id: id,
    isDeleted: true,
  });

  if (!matter) {
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
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      matter,
    },
  });
});

// ============================================
// GET MATTER STATISTICS
// ============================================

/**
 * @desc    Get matter statistics for dashboard
 * @route   GET /api/matters/stats
 * @access  Private
 */
exports.getMatterStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  // Aggregate statistics
  const stats = await Matter.aggregate([
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
        highPriorityMatters: {
          $sum: { $cond: [{ $in: ["$priority", ["high", "urgent"]] }, 1, 0] },
        },
      },
    },
  ]);

  // By matter type
  const byType = await Matter.aggregate([
    { $match: firmQuery },
    {
      $group: {
        _id: "$matterType",
        count: { $sum: 1 },
      },
    },
  ]);

  // By status
  const byStatus = await Matter.aggregate([
    { $match: firmQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      overview: stats[0] || {},
      byType,
      byStatus,
    },
  });
});

// ============================================
// GET MY MATTERS (for logged-in lawyer)
// ============================================

/**
 * @desc    Get matters assigned to the logged-in user
 * @route   GET /api/matters/my-matters
 * @access  Private
 */
exports.getMyMatters = catchAsync(async (req, res, next) => {
  const {
    status,
    priority,
    matterType,
    page = 1,
    limit = 50,
    sort = "-dateOpened",
  } = req.query;

  const filter = buildFirmQuery(req, {
    accountOfficer: req.user._id,
  });

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (matterType) filter.matterType = matterType;

  const skip = (page - 1) * limit;

  const matters = await Matter.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("client", "firstName lastName email phone")
    .select(
      "matterNumber title matterType status priority dateOpened client natureOfMatter lastActivityDate",
    );

  const total = await Matter.countDocuments(filter);

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

module.exports = exports;
