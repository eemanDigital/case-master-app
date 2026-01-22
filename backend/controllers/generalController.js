const Matter = require("../models/matterModel");
const { GeneralDetail } = require("../models/retainerAndGeneralDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ============================================
// GENERAL DETAILS CRUD OPERATIONS
// ============================================

/**
 * @desc    Create general details for a matter
 * @route   POST /api/general/:matterId/details
 * @access  Private
 */
exports.createGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const generalData = req.body;

  // 1. Verify matter exists and is general type
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "general",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("General matter not found", 404));
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

/**
 * @desc    Get general details for a matter
 * @route   GET /api/general/:matterId/details
 * @access  Private
 */
exports.getGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const generalDetail = await GeneralDetail.findOne({
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
 * @route   PATCH /api/general/:matterId/details
 * @access  Private
 */
exports.updateGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    updateData,
    { new: true, runValidators: true },
  );

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
 * @desc    Soft delete general details
 * @route   DELETE /api/general/:matterId/details
 * @access  Private
 */
exports.deleteGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user.id,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(
      new AppError("General details not found or already deleted", 404),
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * @desc    Restore soft-deleted general details
 * @route   PATCH /api/general/:matterId/details/restore
 * @access  Private
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
// GENERAL MATTERS LISTING
// ============================================

/**
 * @desc    Get all general matters
 * @route   GET /api/general
 * @access  Private
 */
exports.getAllGeneralMatters = catchAsync(async (req, res, next) => {
  const {
    serviceType,
    status,
    page = 1,
    limit = 50,
    sort = "-dateOpened",
  } = req.query;

  const matterFilter = {
    firmId: req.firmId,
    matterType: "general",
    isDeleted: false,
  };

  if (status) matterFilter.status = status;

  let matterIds = null;
  if (serviceType) {
    const detailFilter = { firmId: req.firmId, serviceType };
    const generalDetails =
      await GeneralDetail.find(detailFilter).select("matterId");
    matterIds = generalDetails.map((d) => d.matterId);
    matterFilter._id = { $in: matterIds };
  }

  const skip = (page - 1) * limit;

  const matters = await Matter.find(matterFilter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("accountOfficer", "firstName lastName email photo")
    .populate("client", "firstName lastName email phone")
    .populate("generalDetail");

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
// REQUIREMENTS MANAGEMENT
// ============================================

/**
 * @desc    Add requirement
 * @route   POST /api/general/:matterId/requirements
 * @access  Private
 */
exports.addRequirement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const requirementData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { specificRequirements: requirementData } },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

/**
 * @desc    Update requirement status
 * @route   PATCH /api/general/:matterId/requirements/:requirementId
 * @access  Private
 */
exports.updateRequirement = catchAsync(async (req, res, next) => {
  const { matterId, requirementId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`specificRequirements.$.${key}`] = updateData[key];
  });

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "specificRequirements._id": requirementId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Requirement not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

/**
 * @desc    Delete requirement
 * @route   DELETE /api/general/:matterId/requirements/:requirementId
 * @access  Private
 */
exports.deleteRequirement = catchAsync(async (req, res, next) => {
  const { matterId, requirementId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { specificRequirements: { _id: requirementId } } },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or requirement not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

// ============================================
// PARTIES MANAGEMENT
// ============================================

/**
 * @desc    Add party
 * @route   POST /api/general/:matterId/parties
 * @access  Private
 */
exports.addParty = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const partyData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { partiesInvolved: partyData } },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

/**
 * @desc    Update party
 * @route   PATCH /api/general/:matterId/parties/:partyId
 * @access  Private
 */
exports.updateParty = catchAsync(async (req, res, next) => {
  const { matterId, partyId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`partiesInvolved.$.${key}`] = updateData[key];
  });

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "partiesInvolved._id": partyId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Party not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

/**
 * @desc    Delete party
 * @route   DELETE /api/general/:matterId/parties/:partyId
 * @access  Private
 */
exports.deleteParty = catchAsync(async (req, res, next) => {
  const { matterId, partyId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { partiesInvolved: { _id: partyId } } },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or party not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

// ============================================
// DELIVERABLES MANAGEMENT
// ============================================

/**
 * @desc    Add deliverable
 * @route   POST /api/general/:matterId/deliverables
 * @access  Private
 */
exports.addDeliverable = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const deliverableData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { expectedDeliverables: deliverableData } },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

/**
 * @desc    Update deliverable status
 * @route   PATCH /api/general/:matterId/deliverables/:deliverableId
 * @access  Private
 */
exports.updateDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`expectedDeliverables.$.${key}`] = updateData[key];
  });

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "expectedDeliverables._id": deliverableId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Deliverable not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

/**
 * @desc    Delete deliverable
 * @route   DELETE /api/general/:matterId/deliverables/:deliverableId
 * @access  Private
 */
exports.deleteDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { expectedDeliverables: { _id: deliverableId } } },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or deliverable not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

// ============================================
// DOCUMENTS MANAGEMENT
// ============================================

/**
 * @desc    Add document requirement
 * @route   POST /api/general/:matterId/documents
 * @access  Private
 */
exports.addDocument = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const documentData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { documentsRequired: documentData } },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

/**
 * @desc    Update document received status
 * @route   PATCH /api/general/:matterId/documents/:documentId
 * @access  Private
 */
exports.updateDocumentStatus = catchAsync(async (req, res, next) => {
  const { matterId, documentId } = req.params;
  const { isReceived, receivedDate } = req.body;

  // Build update object using dot notation
  const updateObject = {};
  if (isReceived !== undefined)
    updateObject[`documentsRequired.$.isReceived`] = isReceived;
  if (receivedDate !== undefined)
    updateObject[`documentsRequired.$.receivedDate`] = receivedDate;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "documentsRequired._id": documentId,
    },
    { $set: updateObject },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Document not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

/**
 * @desc    Delete document requirement
 * @route   DELETE /api/general/:matterId/documents/:documentId
 * @access  Private
 */
exports.deleteDocument = catchAsync(async (req, res, next) => {
  const { matterId, documentId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { documentsRequired: { _id: documentId } } },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or document not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { generalDetail },
  });
});

// ============================================
// GENERAL SERVICE COMPLETION
// ============================================

/**
 * @desc    Mark general service as completed
 * @route   POST /api/general/:matterId/complete
 * @access  Private
 */
exports.completeGeneralService = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { completionDate } = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "general",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("General matter not found", 404));
  }

  // Update general detail
  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      actualCompletionDate: completionDate || new Date(),
    },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details not found", 404));
  }

  // Update matter status
  matter.status = "completed";
  matter.actualClosureDate = generalDetail.actualCompletionDate;
  await matter.save();

  res.status(200).json({
    status: "success",
    message: "General service marked as completed",
    data: {
      generalDetail,
      matter,
    },
  });
});

// ============================================
// STATISTICS & REPORTS
// ============================================

/**
 * @desc    Get general matter statistics
 * @route   GET /api/general/stats
 * @access  Private
 */
exports.getGeneralStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  const byServiceType = await GeneralDetail.aggregate([
    { $match: firmQuery },
    { $group: { _id: "$serviceType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const [pendingDeliverables, pendingRequirements, missingDocuments] =
    await Promise.all([
      GeneralDetail.aggregate([
        { $match: firmQuery },
        { $unwind: "$expectedDeliverables" },
        { $match: { "expectedDeliverables.status": "pending" } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      GeneralDetail.aggregate([
        { $match: firmQuery },
        { $unwind: "$specificRequirements" },
        { $match: { "specificRequirements.status": "pending" } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      GeneralDetail.aggregate([
        { $match: firmQuery },
        { $unwind: "$documentsRequired" },
        { $match: { "documentsRequired.isReceived": false } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
    ]);

  res.status(200).json({
    status: "success",
    data: {
      byServiceType,
      pendingDeliverables: pendingDeliverables[0]?.count || 0,
      pendingRequirements: pendingRequirements[0]?.count || 0,
      missingDocuments: missingDocuments[0]?.count || 0,
    },
  });
});

module.exports = exports;
