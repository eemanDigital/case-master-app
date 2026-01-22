const Matter = require("../models/matterModel");
const PropertyDetail = require("../models/propertyDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ============================================
// PROPERTY DETAILS CRUD OPERATIONS
// ============================================

/**
 * @desc    Create property details for a matter
 * @route   POST /api/property/:matterId/details
 * @access  Private
 */
exports.createPropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const propertyData = req.body;

  // 1. Verify matter exists and is property type
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "property",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Property matter not found", 404));
  }

  // 2. Check if property details already exist
  const existingDetail = await PropertyDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (existingDetail) {
    return next(
      new AppError("Property details already exist for this matter", 400),
    );
  }

  // 3. Create property detail
  const propertyDetail = new PropertyDetail({
    matterId,
    firmId: req.firmId,
    ...propertyData,
  });

  await propertyDetail.save();

  res.status(201).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Get property details for a matter
 * @route   GET /api/property/:matterId/details
 * @access  Private
 */
exports.getPropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const propertyDetail = await PropertyDetail.findOne({
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

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Update property details
 * @route   PATCH /api/property/:matterId/details
 * @access  Private
 */
exports.updatePropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    updateData,
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Soft delete property details
 * @route   DELETE /api/property/:matterId/details
 * @access  Private
 */
exports.deletePropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user.id,
    },
    { new: true },
  );

  if (!propertyDetail) {
    return next(
      new AppError("Property details not found or already deleted", 404),
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * @desc    Restore soft-deleted property details
 * @route   PATCH /api/property/:matterId/details/restore
 * @access  Private
 */
exports.restorePropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    { new: true },
  );

  if (!propertyDetail) {
    return next(
      new AppError("No deleted property details found to restore", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

// ============================================
// PROPERTY LISTING WITH FILTERS
// ============================================

/**
 * @desc    Get all property matters
 * @route   GET /api/property
 * @access  Private
 */
exports.getAllPropertyMatters = catchAsync(async (req, res, next) => {
  const {
    transactionType,
    state,
    propertyType,
    status,
    page = 1,
    limit = 50,
    sort = "-dateOpened",
  } = req.query;

  const matterFilter = {
    firmId: req.firmId,
    matterType: "property",
    isDeleted: false,
  };

  if (status) matterFilter.status = status;

  // Filter by property-specific fields if provided
  let matterIds = null;
  if (transactionType || state || propertyType) {
    const detailFilter = { firmId: req.firmId };
    if (transactionType) detailFilter.transactionType = transactionType;
    if (state) detailFilter["properties.state"] = state;
    if (propertyType) detailFilter["properties.propertyType"] = propertyType;

    const propertyDetails =
      await PropertyDetail.find(detailFilter).select("matterId");
    matterIds = propertyDetails.map((d) => d.matterId);
    matterFilter._id = { $in: matterIds };
  }

  const skip = (page - 1) * limit;

  const matters = await Matter.find(matterFilter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("accountOfficer", "firstName lastName email photo")
    .populate("client", "firstName lastName email phone")
    .populate("propertyDetail");

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
// PROPERTY MANAGEMENT OPERATIONS
// ============================================

/**
 * @desc    Add property to matter
 * @route   POST /api/property/:matterId/properties
 * @access  Private
 */
exports.addProperty = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const propertyData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: { properties: propertyData },
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Update property information
 * @route   PATCH /api/property/:matterId/properties/:index
 * @access  Private
 */
exports.updateProperty = catchAsync(async (req, res, next) => {
  const { matterId, index } = req.params;
  const propertyData = req.body;

  const propertyDetail = await PropertyDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  if (index >= propertyDetail.properties.length) {
    return next(new AppError("Invalid property index", 400));
  }

  propertyDetail.properties[index] = {
    ...propertyDetail.properties[index],
    ...propertyData,
  };

  await propertyDetail.save();

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Remove property from matter
 * @route   DELETE /api/property/:matterId/properties/:index
 * @access  Private
 */
exports.removeProperty = catchAsync(async (req, res, next) => {
  const { matterId, index } = req.params;

  const propertyDetail = await PropertyDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  if (index >= propertyDetail.properties.length) {
    return next(new AppError("Invalid property index", 400));
  }

  propertyDetail.properties.splice(index, 1);
  await propertyDetail.save();

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

// ============================================
// PAYMENT SCHEDULE MANAGEMENT
// ============================================

/**
 * @desc    Add payment schedule installment
 * @route   POST /api/property/:matterId/payments
 * @access  Private
 */
exports.addPayment = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const paymentData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: { paymentSchedule: paymentData },
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Update payment schedule installment
 * @route   PATCH /api/property/:matterId/payments/:installmentId
 * @access  Private
 */
exports.updatePayment = catchAsync(async (req, res, next) => {
  const { matterId, installmentId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`paymentSchedule.$.${key}`] = updateData[key];
  });

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "paymentSchedule._id": installmentId,
    },
    {
      $set: updateObject,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Payment installment not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Delete payment installment
 * @route   DELETE /api/property/:matterId/payments/:installmentId
 * @access  Private
 */
exports.deletePayment = catchAsync(async (req, res, next) => {
  const { matterId, installmentId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { paymentSchedule: { _id: installmentId } },
    },
    { new: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details or payment not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

// ============================================
// DUE DILIGENCE & LEGAL PROCESSES
// ============================================

/**
 * @desc    Update title search results
 * @route   PATCH /api/property/:matterId/title-search
 * @access  Private
 */
exports.updateTitleSearch = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const titleSearchData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      titleSearch: titleSearchData,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Update governor's consent status
 * @route   PATCH /api/property/:matterId/governors-consent
 * @access  Private
 */
exports.updateGovernorsConsent = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const consentData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      governorsConsent: consentData,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Update contract of sale
 * @route   PATCH /api/property/:matterId/contract-of-sale
 * @access  Private
 */
exports.updateContractOfSale = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const contractData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      contractOfSale: contractData,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Update lease agreement
 * @route   PATCH /api/property/:matterId/lease-agreement
 * @access  Private
 */
exports.updateLeaseAgreement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const leaseData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      leaseAgreement: leaseData,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Record physical inspection results
 * @route   PATCH /api/property/:matterId/physical-inspection
 * @access  Private
 */
exports.recordPhysicalInspection = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const inspectionData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      physicalInspection: inspectionData,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

// ============================================
// CONDITIONS MANAGEMENT
// ============================================

/**
 * @desc    Add condition to property transaction
 * @route   POST /api/property/:matterId/conditions
 * @access  Private
 */
exports.addCondition = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const conditionData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: { conditions: conditionData },
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Update condition status
 * @route   PATCH /api/property/:matterId/conditions/:conditionId
 * @access  Private
 */
exports.updateCondition = catchAsync(async (req, res, next) => {
  const { matterId, conditionId } = req.params;
  const updateData = req.body;

  // Build update object using dot notation
  const updateObject = {};
  Object.keys(updateData).forEach((key) => {
    updateObject[`conditions.$.${key}`] = updateData[key];
  });

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "conditions._id": conditionId,
    },
    {
      $set: updateObject,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Condition not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

/**
 * @desc    Delete condition
 * @route   DELETE /api/property/:matterId/conditions/:conditionId
 * @access  Private
 */
exports.deleteCondition = catchAsync(async (req, res, next) => {
  const { matterId, conditionId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { conditions: { _id: conditionId } },
    },
    { new: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details or condition not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
    },
  });
});

// ============================================
// PROPERTY COMPLETION & CLOSING
// ============================================

/**
 * @desc    Record property transaction completion
 * @route   PATCH /api/property/:matterId/completion
 * @access  Private
 */
exports.recordCompletion = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { completionDate, registrationNumber } = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "property",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Property matter not found", 404));
  }

  // Update property detail
  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      deedOfAssignment: {
        status: "registered",
        registrationDate: completionDate,
      },
    },
    { new: true, runValidators: true },
  );

  // Update matter status
  matter.status = "completed";
  matter.actualClosureDate = completionDate;
  await matter.save();

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
      matter,
    },
  });
});

// ============================================
// STATISTICS & REPORTS
// ============================================

/**
 * @desc    Get property-specific statistics
 * @route   GET /api/property/stats
 * @access  Private
 */
exports.getPropertyStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  // By transaction type
  const byType = await PropertyDetail.aggregate([
    { $match: firmQuery },
    {
      $group: {
        _id: "$transactionType",
        count: { $sum: 1 },
        totalValue: { $sum: "$purchasePrice.amount" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // By state
  const byState = await PropertyDetail.aggregate([
    { $match: firmQuery },
    { $unwind: "$properties" },
    {
      $group: {
        _id: "$properties.state",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Pending governor's consents
  const pendingConsents = await PropertyDetail.countDocuments({
    ...firmQuery,
    "governorsConsent.status": "pending",
  });

  // Overdue payments
  const overduePayments = await PropertyDetail.aggregate([
    { $match: firmQuery },
    { $unwind: "$paymentSchedule" },
    {
      $match: {
        "paymentSchedule.status": "pending",
        "paymentSchedule.dueDate": { $lte: new Date() },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: "$paymentSchedule.amount" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      byType,
      byState,
      pendingConsents,
      overduePayments: overduePayments[0] || { count: 0, totalAmount: 0 },
    },
  });
});

/**
 * @desc    Get all property matters with pending governor's consent
 * @route   GET /api/property/pending-consents
 * @access  Private
 */
exports.getPendingConsents = catchAsync(async (req, res, next) => {
  const propertyDetails = await PropertyDetail.find({
    firmId: req.firmId,
    isDeleted: false,
    "governorsConsent.status": "pending",
  })
    .populate({
      path: "matter",
      select: "matterNumber title client accountOfficer status priority",
      populate: [
        { path: "client", select: "firstName lastName email" },
        { path: "accountOfficer", select: "firstName lastName email" },
      ],
    })
    .sort({ "governorsConsent.applicationDate": 1 });

  const filtered = propertyDetails.filter(
    (detail) => detail.matter && !detail.matter.isDeleted,
  );

  res.status(200).json({
    status: "success",
    results: filtered.length,
    data: {
      matters: filtered,
    },
  });
});

module.exports = exports;
