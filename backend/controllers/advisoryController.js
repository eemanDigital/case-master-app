const Matter = require("../models/matterModel");
const AdvisoryDetail = require("../models/advisoryDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ============================================
// ADVISORY DETAILS CRUD OPERATIONS
// ============================================

/**
 * @desc    Create advisory details for a matter
 * @route   POST /api/advisory/:matterId/details
 * @access  Private
 */
exports.createAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const advisoryData = req.body;

  // 1. Verify matter exists and is advisory type
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "advisory",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Advisory matter not found", 404));
  }

  // 2. Check if advisory details already exist
  const existingDetail = await AdvisoryDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (existingDetail) {
    return next(
      new AppError("Advisory details already exist for this matter", 400),
    );
  }

  // 3. Create advisory detail
  const advisoryDetail = new AdvisoryDetail({
    matterId,
    firmId: req.firmId,
    ...advisoryData,
  });

  await advisoryDetail.save();

  res.status(201).json({
    status: "success",
    data: {
      advisoryDetail,
    },
  });
});

/**
 * @desc    Get advisory details for a matter
 * @route   GET /api/advisory/:matterId/details
 * @access  Private
 */
exports.getAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOne({
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
 * @route   PATCH /api/advisory/:matterId/details
 * @access  Private
 */
exports.updateAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    updateData,
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

/**
 * @desc    Soft delete advisory details
 * @route   DELETE /api/advisory/:matterId/details
 * @access  Private
 */
exports.deleteAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user.id,
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(
      new AppError("Advisory details not found or already deleted", 404),
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * @desc    Restore soft-deleted advisory details
 * @route   PATCH /api/advisory/:matterId/details/restore
 * @access  Private
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
// ADVISORY LISTING WITH FILTERS
// ============================================

/**
 * @desc    Get all advisory matters
 * @route   GET /api/advisory
 * @access  Private
 */
exports.getAllAdvisoryMatters = catchAsync(async (req, res, next) => {
  const {
    advisoryType,
    status,
    page = 1,
    limit = 50,
    sort = "-dateOpened",
  } = req.query;

  const matterFilter = {
    firmId: req.firmId,
    matterType: "advisory",
    isDeleted: false,
  };

  if (status) matterFilter.status = status;

  let matterIds = null;
  if (advisoryType) {
    const detailFilter = { firmId: req.firmId, advisoryType };
    const advisoryDetails =
      await AdvisoryDetail.find(detailFilter).select("matterId");
    matterIds = advisoryDetails.map((d) => d.matterId);
    matterFilter._id = { $in: matterIds };
  }

  const skip = (page - 1) * limit;

  const matters = await Matter.find(matterFilter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("accountOfficer", "firstName lastName email photo")
    .populate("client", "firstName lastName email phone")
    .populate("advisoryDetail");

  const total = await Matter.countDocuments(matterFilter);

  res.status(200).json({
    status: "success",
    results: matters.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: { matters },
  });
});

// ============================================
// RESEARCH QUESTIONS MANAGEMENT
// ============================================

/**
 * @desc    Add research question
 * @route   POST /api/advisory/:matterId/research-questions
 * @access  Private
 */
exports.addResearchQuestion = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const questionData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { researchQuestions: questionData } },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

/**
 * @desc    Update research question
 * @route   PATCH /api/advisory/:matterId/research-questions/:questionId
 * @access  Private
 */
exports.updateResearchQuestion = catchAsync(async (req, res, next) => {
  const { matterId, questionId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`researchQuestions.$.${key}`] = updateData[key];
  });

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "researchQuestions._id": questionId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Research question not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

/**
 * @desc    Delete research question
 * @route   DELETE /api/advisory/:matterId/research-questions/:questionId
 * @access  Private
 */
exports.deleteResearchQuestion = catchAsync(async (req, res, next) => {
  const { matterId, questionId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { researchQuestions: { _id: questionId } } },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(
      new AppError("Advisory details or research question not found", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

// ============================================
// KEY FINDINGS MANAGEMENT
// ============================================

/**
 * @desc    Add key finding
 * @route   POST /api/advisory/:matterId/key-findings
 * @access  Private
 */
exports.addKeyFinding = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const findingData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { keyFindings: findingData } },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

/**
 * @desc    Update key finding
 * @route   PATCH /api/advisory/:matterId/key-findings/:findingId
 * @access  Private
 */
exports.updateKeyFinding = catchAsync(async (req, res, next) => {
  const { matterId, findingId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`keyFindings.$.${key}`] = updateData[key];
  });

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "keyFindings._id": findingId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Key finding not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

/**
 * @desc    Delete key finding
 * @route   DELETE /api/advisory/:matterId/key-findings/:findingId
 * @access  Private
 */
exports.deleteKeyFinding = catchAsync(async (req, res, next) => {
  const { matterId, findingId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { keyFindings: { _id: findingId } } },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details or key finding not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

// ============================================
// OPINION MANAGEMENT
// ============================================

/**
 * @desc    Update opinion
 * @route   PATCH /api/advisory/:matterId/opinion
 * @access  Private
 */
exports.updateOpinion = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const opinionData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { opinion: opinionData },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

// ============================================
// RECOMMENDATIONS MANAGEMENT
// ============================================

/**
 * @desc    Add recommendation
 * @route   POST /api/advisory/:matterId/recommendations
 * @access  Private
 */
exports.addRecommendation = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const recommendationData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { recommendations: recommendationData } },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

/**
 * @desc    Update recommendation
 * @route   PATCH /api/advisory/:matterId/recommendations/:recommendationId
 * @access  Private
 */
exports.updateRecommendation = catchAsync(async (req, res, next) => {
  const { matterId, recommendationId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`recommendations.$.${key}`] = updateData[key];
  });

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "recommendations._id": recommendationId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Recommendation not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

/**
 * @desc    Delete recommendation
 * @route   DELETE /api/advisory/:matterId/recommendations/:recommendationId
 * @access  Private
 */
exports.deleteRecommendation = catchAsync(async (req, res, next) => {
  const { matterId, recommendationId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { recommendations: { _id: recommendationId } } },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(
      new AppError("Advisory details or recommendation not found", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

// ============================================
// DELIVERABLES MANAGEMENT
// ============================================

/**
 * @desc    Add deliverable
 * @route   POST /api/advisory/:matterId/deliverables
 * @access  Private
 */
exports.addDeliverable = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const deliverableData = req.body;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { deliverables: deliverableData } },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

/**
 * @desc    Update deliverable
 * @route   PATCH /api/advisory/:matterId/deliverables/:deliverableId
 * @access  Private
 */
exports.updateDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`deliverables.$.${key}`] = updateData[key];
  });

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "deliverables._id": deliverableId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Deliverable not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

/**
 * @desc    Delete deliverable
 * @route   DELETE /api/advisory/:matterId/deliverables/:deliverableId
 * @access  Private
 */
exports.deleteDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { deliverables: { _id: deliverableId } } },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details or deliverable not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { advisoryDetail },
  });
});

// ============================================
// ADVISORY COMPLETION
// ============================================

/**
 * @desc    Mark advisory as completed
 * @route   POST /api/advisory/:matterId/complete
 * @access  Private
 */
exports.completeAdvisory = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { completionDate, finalOpinion } = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "advisory",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Advisory matter not found", 404));
  }

  // Update advisory detail
  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      opinion: finalOpinion,
      completionDate: completionDate || new Date(),
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  // Update matter status
  matter.status = "completed";
  matter.actualClosureDate = advisoryDetail.completionDate;
  await matter.save();

  res.status(200).json({
    status: "success",
    message: "Advisory marked as completed",
    data: {
      advisoryDetail,
      matter,
    },
  });
});

// ============================================
// STATISTICS & REPORTS
// ============================================

/**
 * @desc    Get advisory statistics
 * @route   GET /api/advisory/stats
 * @access  Private
 */
exports.getAdvisoryStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  const byType = await AdvisoryDetail.aggregate([
    { $match: firmQuery },
    { $group: { _id: "$advisoryType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const [pendingDeliverables, overdueDeliverables] = await Promise.all([
    AdvisoryDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$deliverables" },
      {
        $match: { "deliverables.status": { $in: ["pending", "in-progress"] } },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
    AdvisoryDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$deliverables" },
      {
        $match: {
          "deliverables.status": { $in: ["pending", "in-progress"] },
          "deliverables.dueDate": { $lt: new Date() },
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
  ]);

  // Research questions statistics
  const researchStats = await AdvisoryDetail.aggregate([
    { $match: firmQuery },
    { $unwind: "$researchQuestions" },
    {
      $group: {
        _id: "$researchQuestions.status",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      byType,
      pendingDeliverables: pendingDeliverables[0]?.count || 0,
      overdueDeliverables: overdueDeliverables[0]?.count || 0,
      researchQuestionsByStatus: researchStats,
    },
  });
});

module.exports = exports;
