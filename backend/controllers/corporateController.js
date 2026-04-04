const mongoose = require("mongoose");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const CorporateDetail = require("../models/corporateDetailModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const QueryBuilder = require("../utils/queryBuilder");
const { GenericPdfGenerator, getStatusColor, formatCurrency, formatDate } = require("../utils/generateGenericPdf");
const path = require("path");

// Initialize pagination services
const matterPaginationService = PaginationServiceFactory.createService(
  Matter,
  modelConfigs.Matter,
);

const corporateDetailPaginationService = PaginationServiceFactory.createService(
  CorporateDetail,
  modelConfigs.CorporateDetail,
);

// ============================================
// CORPORATE MATTERS LISTING & PAGINATION
// ============================================

/**
 * @desc    Get all corporate matters with pagination, filtering, and sorting
 * @route   GET /api/corporate-matters
 * @access  Private
 */
exports.getAllCorporateMatters = catchAsync(async (req, res, next) => {
  const {
    // Standard pagination
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    includeStats,

    // Corporate-specific filters
    transactionType,
    companyName,
    companyType,
    status,
    jurisdiction,
    dealValueMin,
    dealValueMax,

    // Date filters
    incorporationDateStart,
    incorporationDateEnd,
    expectedClosingDateStart,
    expectedClosingDateEnd,

    // Search
    search,

    // Other
    includeDeleted,
    onlyDeleted,
  } = req.query;

  // Add corporate matter type filter
  const customFilter = {
    matterType: "corporate",
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
      // Pass corporate-specific filters to be handled by custom logic
      transactionType,
      companyName,
      companyType,
    },
    customFilter,
    req.firmId,
  );

  // Enhance matters with corporate details if not already populated
  if (
    result.data.length > 0 &&
    (!populate || !populate.includes("corporateDetail"))
  ) {
    const matterIds = result.data.map((matter) => matter._id);
    const corporateDetails = await CorporateDetail.find({
      matterId: { $in: matterIds },
      firmId: req.firmId,
    }).lean();

    // Map corporate details to matters
    const detailsMap = corporateDetails.reduce((map, detail) => {
      map[detail.matterId.toString()] = detail;
      return map;
    }, {});

    result.data = result.data.map((matter) => ({
      ...matter,
      corporateDetail: detailsMap[matter._id.toString()] || null,
    }));
  }

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// ADVANCED CORPORATE SEARCH
// ============================================

/**
 * @desc    Advanced search for corporate matters
 * @route   POST /api/corporate-matters/search
 * @access  Private
 */
exports.searchCorporateMatters = catchAsync(async (req, res, next) => {
  const { criteria = {}, options = {} } = req.body;

  // Add corporate matter type and firmId to criteria
  const firmCriteria = {
    ...criteria,
    firmId: req.firmId,
    matterType: "corporate",
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
// CORPORATE DETAILS MANAGEMENT
// ============================================

/**
 * @desc    Create corporate details for a matter
 * @route   POST /api/corporate-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.createCorporateDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const corporateData = req.body;

  // Start transaction
  // const session = await Matter.startSession();
  // session.startTransaction();

  try {
    // 1. Verify matter exists and is corporate type
    const matter = await Matter.findOne({
      _id: matterId,
      firmId: req.firmId,
      isDeleted: false,
    });

    // .session(session);

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Matter not found", 404));
    }

    if (matter.matterType !== "corporate") {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Matter is not a corporate matter", 400));
    }

    // 2. Check if corporate details already exist
    const existingDetail = await CorporateDetail.findOne({
      matterId,
      firmId: req.firmId,
    });
    // .session(session);

    if (existingDetail) {
      // await session.abortTransaction();
      // session.endSession();
      return next(
        new AppError("Corporate details already exist for this matter", 400),
      );
    }

    // 3. Create corporate detail
    const corporateDetail = new CorporateDetail({
      matterId,
      firmId: req.firmId,
      createdBy: req.user._id,
      ...corporateData,
    });

    // await corporateDetail.save({ session });
    await corporateDetail.save();

    // 4. Update matter to link corporate detail
    matter.corporateDetail = corporateDetail._id;
    // await matter.save({ session });
    await matter.save();

    // await session.commitTransaction();
    // session.endSession();

    // Populate and return
    const populatedDetail = await CorporateDetail.findById(
      corporateDetail._id,
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
        corporateDetail: populatedDetail,
      },
    });
  } catch (error) {
    // await session.abortTransaction();
    // session.endSession();
    return next(error);
  }
});

/**
 * @desc    Get corporate details for a specific matter
 * @route   GET /api/corporate-matters/:matterId/details
 * @access  Private
 */
exports.getCorporateDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
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
        { path: "createdBy", select: "firstName lastName" },
        { path: "lastModifiedBy", select: "firstName lastName" },
      ],
    })
    .populate("createdBy", "firstName lastName")
    .populate("lastModifiedBy", "firstName lastName");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
    },
  });
});

/**
 * @desc    Update corporate details
 * @route   PATCH /api/corporate-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.updateCorporateDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
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

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
    },
  });
});

// ============================================
// PARTIES MANAGEMENT (Enhanced)
// ============================================

/**
 * @desc    Add party to corporate transaction
 * @route   POST /api/corporate-matters/:matterId/parties
 * @access  Private (Admin, Lawyer)
 */
exports.addParty = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const partyData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        parties: {
          ...partyData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      newParty: corporateDetail.parties[corporateDetail.parties.length - 1],
    },
  });
});

/**
 * @desc    Update party information
 * @route   PATCH /api/corporate-matters/:matterId/parties/:partyId
 * @access  Private (Admin, Lawyer)
 */
exports.updateParty = catchAsync(async (req, res, next) => {
  const { matterId, partyId } = req.params;
  const partyData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "parties._id": partyId,
    },
    {
      $set: {
        "parties.$": {
          ...partyData,
          _id: partyId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Party not found", 404));
  }

  // Find the updated party
  const updatedParty = corporateDetail.parties.id(partyId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      updatedParty,
    },
  });
});

/**
 * @desc    Remove party from corporate transaction
 * @route   DELETE /api/corporate-matters/:matterId/parties/:partyId
 * @access  Private (Admin, Lawyer)
 */
exports.removeParty = catchAsync(async (req, res, next) => {
  const { matterId, partyId } = req.params;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { parties: { _id: partyId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      message: "Party removed successfully",
    },
  });
});

/**
 * @desc    Get all parties for a corporate matter
 * @route   GET /api/corporate-matters/:matterId/parties
 * @access  Private
 */
exports.getParties = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).select("parties");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      parties: corporateDetail.parties || [],
      count: corporateDetail.parties?.length || 0,
    },
  });
});

// ============================================
// SHAREHOLDERS MANAGEMENT
// ============================================

exports.addShareholder = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const shareholderData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        shareholders: {
          ...shareholderData,
          _id: new mongoose.Types.ObjectId(),
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      newShareholder:
        corporateDetail.shareholders[corporateDetail.shareholders.length - 1],
    },
  });
});

exports.updateShareholder = catchAsync(async (req, res, next) => {
  const { matterId, shareholderId } = req.params;
  const shareholderData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "shareholders._id": shareholderId,
    },
    {
      $set: {
        "shareholders.$": {
          ...shareholderData,
          _id: shareholderId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Shareholder not found", 404));
  }

  const updatedShareholder = corporateDetail.shareholders.id(shareholderId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      updatedShareholder,
    },
  });
});

exports.removeShareholder = catchAsync(async (req, res, next) => {
  const { matterId, shareholderId } = req.params;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { shareholders: { _id: shareholderId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      message: "Shareholder removed successfully",
    },
  });
});

exports.getShareholders = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).select("shareholders");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      shareholders: corporateDetail.shareholders || [],
      count: corporateDetail.shareholders?.length || 0,
    },
  });
});

// ============================================
// DIRECTORS MANAGEMENT
// ============================================

exports.addDirector = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const directorData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        directors: {
          ...directorData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      newDirector:
        corporateDetail.directors[corporateDetail.directors.length - 1],
    },
  });
});

exports.updateDirector = catchAsync(async (req, res, next) => {
  const { matterId, directorId } = req.params;
  const directorData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "directors._id": directorId,
    },
    {
      $set: {
        "directors.$": {
          ...directorData,
          _id: directorId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Director not found", 404));
  }

  const updatedDirector = corporateDetail.directors.id(directorId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      updatedDirector,
    },
  });
});

exports.removeDirector = catchAsync(async (req, res, next) => {
  const { matterId, directorId } = req.params;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { directors: { _id: directorId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      message: "Director removed successfully",
    },
  });
});

exports.getDirectors = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).select("directors");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      directors: corporateDetail.directors || [],
      count: corporateDetail.directors?.length || 0,
    },
  });
});

// ============================================
// MILESTONES MANAGEMENT
// ============================================

exports.addMilestone = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const milestoneData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        milestones: {
          ...milestoneData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      newMilestone:
        corporateDetail.milestones[corporateDetail.milestones.length - 1],
    },
  });
});

exports.updateMilestone = catchAsync(async (req, res, next) => {
  const { matterId, milestoneId } = req.params;
  const milestoneData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "milestones._id": milestoneId,
    },
    {
      $set: {
        "milestones.$": {
          ...milestoneData,
          _id: milestoneId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Milestone not found", 404));
  }

  const updatedMilestone = corporateDetail.milestones.id(milestoneId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      updatedMilestone,
    },
  });
});

exports.removeMilestone = catchAsync(async (req, res, next) => {
  const { matterId, milestoneId } = req.params;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { milestones: { _id: milestoneId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      message: "Milestone removed successfully",
    },
  });
});

exports.getMilestones = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).select("milestones");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      milestones: corporateDetail.milestones || [],
      count: corporateDetail.milestones?.length || 0,
    },
  });
});

exports.completeMilestone = catchAsync(async (req, res, next) => {
  const { matterId, milestoneId } = req.params;
  const { completionDate = new Date(), notes } = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "milestones._id": milestoneId,
    },
    {
      $set: {
        "milestones.$.status": "completed",
        "milestones.$.actualCompletionDate": completionDate,
        "milestones.$.notes": notes,
        "milestones.$.completedBy": req.user._id,
      },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Milestone not found", 404));
  }

  const completedMilestone = corporateDetail.milestones.id(milestoneId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      completedMilestone,
    },
  });
});

// ============================================
// DUE DILIGENCE MANAGEMENT
// ============================================

exports.updateDueDiligence = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const dueDiligenceData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        dueDiligence: {
          ...dueDiligenceData,
          lastUpdated: new Date(),
          updatedBy: req.user._id,
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
    },
  });
});

exports.getDueDiligence = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).select("dueDiligence");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      dueDiligence: corporateDetail.dueDiligence || {},
    },
  });
});

// ============================================
// REGULATORY APPROVALS MANAGEMENT
// ============================================

exports.addRegulatoryApproval = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const approvalData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        regulatoryApprovals: {
          ...approvalData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      newApproval:
        corporateDetail.regulatoryApprovals[
          corporateDetail.regulatoryApprovals.length - 1
        ],
    },
  });
});

exports.updateRegulatoryApproval = catchAsync(async (req, res, next) => {
  const { matterId, approvalId } = req.params;
  const approvalData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "regulatoryApprovals._id": approvalId,
    },
    {
      $set: {
        "regulatoryApprovals.$": {
          ...approvalData,
          _id: approvalId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Regulatory approval not found", 404));
  }

  const updatedApproval = corporateDetail.regulatoryApprovals.id(approvalId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      updatedApproval,
    },
  });
});

exports.removeRegulatoryApproval = catchAsync(async (req, res, next) => {
  const { matterId, approvalId } = req.params;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { regulatoryApprovals: { _id: approvalId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      message: "Regulatory approval removed successfully",
    },
  });
});

exports.getRegulatoryApprovals = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).select("regulatoryApprovals");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      regulatoryApprovals: corporateDetail.regulatoryApprovals || [],
      count: corporateDetail.regulatoryApprovals?.length || 0,
    },
  });
});

exports.updateApprovalStatus = catchAsync(async (req, res, next) => {
  const { matterId, approvalId } = req.params;
  const { status, approvalDate = new Date(), notes } = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "regulatoryApprovals._id": approvalId,
    },
    {
      $set: {
        "regulatoryApprovals.$.status": status,
        "regulatoryApprovals.$.approvalDate":
          status === "approved" ? approvalDate : null,
        "regulatoryApprovals.$.notes": notes,
        "regulatoryApprovals.$.statusUpdatedBy": req.user._id,
        "regulatoryApprovals.$.statusUpdatedAt": new Date(),
      },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Regulatory approval not found", 404));
  }

  const updatedApproval = corporateDetail.regulatoryApprovals.id(approvalId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      updatedApproval,
    },
  });
});

// ============================================
// KEY AGREEMENTS MANAGEMENT
// ============================================

exports.addKeyAgreement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const agreementData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        keyAgreements: {
          ...agreementData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      newAgreement:
        corporateDetail.keyAgreements[corporateDetail.keyAgreements.length - 1],
    },
  });
});

exports.updateKeyAgreement = catchAsync(async (req, res, next) => {
  const { matterId, agreementId } = req.params;
  const agreementData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "keyAgreements._id": agreementId,
    },
    {
      $set: {
        "keyAgreements.$": {
          ...agreementData,
          _id: agreementId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Agreement not found", 404));
  }

  const updatedAgreement = corporateDetail.keyAgreements.id(agreementId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      updatedAgreement,
    },
  });
});

exports.removeKeyAgreement = catchAsync(async (req, res, next) => {
  const { matterId, agreementId } = req.params;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { keyAgreements: { _id: agreementId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      message: "Key agreement removed successfully",
    },
  });
});

exports.getKeyAgreements = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).select("keyAgreements");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      keyAgreements: corporateDetail.keyAgreements || [],
      count: corporateDetail.keyAgreements?.length || 0,
    },
  });
});

// ============================================
// COMPLIANCE REQUIREMENTS MANAGEMENT
// ============================================

exports.addComplianceRequirement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const complianceData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        complianceRequirements: {
          ...complianceData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      newRequirement:
        corporateDetail.complianceRequirements[
          corporateDetail.complianceRequirements.length - 1
        ],
    },
  });
});

exports.updateComplianceRequirement = catchAsync(async (req, res, next) => {
  const { matterId, requirementId } = req.params;
  const complianceData = req.body;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "complianceRequirements._id": requirementId,
    },
    {
      $set: {
        "complianceRequirements.$": {
          ...complianceData,
          _id: requirementId,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Compliance requirement not found", 404));
  }

  const updatedRequirement =
    corporateDetail.complianceRequirements.id(requirementId);

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      updatedRequirement,
    },
  });
});

exports.removeComplianceRequirement = catchAsync(async (req, res, next) => {
  const { matterId, requirementId } = req.params;

  const corporateDetail = await CorporateDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { complianceRequirements: { _id: requirementId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      corporateDetail,
      message: "Compliance requirement removed successfully",
    },
  });
});

exports.getComplianceRequirements = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const corporateDetail = await CorporateDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).select("complianceRequirements");

  if (!corporateDetail) {
    return next(new AppError("Corporate details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      complianceRequirements: corporateDetail.complianceRequirements || [],
      count: corporateDetail.complianceRequirements?.length || 0,
    },
  });
});

// ============================================
// TRANSACTION CLOSING
// ============================================

exports.recordClosing = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { actualClosingDate, closingNotes } = req.body;

  const session = await Matter.startSession();
  session.startTransaction();

  try {
    // 1. Update matter status and closing date
    const matter = await Matter.findOneAndUpdate(
      {
        _id: matterId,
        firmId: req.firmId,
        matterType: "corporate",
        isDeleted: false,
      },
      {
        status: "completed",
        actualClosureDate: actualClosingDate,
        closingNotes: closingNotes,
        lastModifiedBy: req.user._id,
      },
      { new: true, runValidators: true, session },
    );

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Corporate matter not found", 404));
    }

    // 2. Update corporate detail
    const corporateDetail = await CorporateDetail.findOneAndUpdate(
      { matterId, firmId: req.firmId },
      {
        actualClosingDate: actualClosingDate,
        closingNotes: closingNotes,
        transactionStatus: "completed",
        lastModifiedBy: req.user._id,
      },
      { new: true, runValidators: true, session },
    );

    if (!corporateDetail) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Corporate details not found", 404));
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      data: {
        matter,
        corporateDetail,
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

exports.getCorporateStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  const [
    overviewStats,
    typeStats,
    statusStats,
    upcomingClosings,
    pendingApprovals,
    recentTransactions,
  ] = await Promise.all([
    // Overview statistics
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "corporate",
        },
      },
      {
        $group: {
          _id: null,
          totalCorporateMatters: { $sum: 1 },
          activeCorporateMatters: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          pendingCorporateMatters: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedCorporateMatters: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),

    // By transaction type
    CorporateDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: "$transactionType",
          count: { $sum: 1 },
          totalValue: { $sum: "$dealValue.amount" },
          avgValue: { $avg: "$dealValue.amount" },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // By status
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "corporate",
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

    // Upcoming closings (next 30 days)
    CorporateDetail.countDocuments({
      ...firmQuery,
      expectedClosingDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      transactionStatus: { $ne: "completed" },
    }),

    // Pending regulatory approvals
    CorporateDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$regulatoryApprovals" },
      {
        $match: {
          "regulatoryApprovals.status": "pending",
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]),

    // Recent transactions (last 30 days)
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "corporate",
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

  res.status(200).json({
    status: "success",
    data: {
      overview: overviewStats[0] || {
        totalCorporateMatters: 0,
        activeCorporateMatters: 0,
        pendingCorporateMatters: 0,
        completedCorporateMatters: 0,
      },
      byType: typeStats,
      byStatus: statusStats,
      upcomingClosings: upcomingClosings || 0,
      pendingApprovals: pendingApprovals[0]?.count || 0,
      recentTransactions: recentTransactions,
    },
  });
});

exports.getPendingApprovals = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  // Find corporate details with pending approvals
  const corporateDetails = await CorporateDetail.find({
    firmId: req.firmId,
    isDeleted: false,
    "regulatoryApprovals.status": "pending",
  })
    .populate({
      path: "matter",
      select:
        "matterNumber title client accountOfficer status priority dateOpened",
      match: { isDeleted: false },
      populate: [
        { path: "client", select: "firstName lastName email phone" },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    })
    .sort({ "regulatoryApprovals.applicationDate": 1 })
    .skip(skip)
    .limit(Number(limit));

  // Filter out matters that might be deleted
  const filteredDetails = corporateDetails.filter((detail) => detail.matter);

  const total = await CorporateDetail.countDocuments({
    firmId: req.firmId,
    isDeleted: false,
    "regulatoryApprovals.status": "pending",
  });

  // Extract and flatten pending approvals
  const pendingApprovals = [];
  filteredDetails.forEach((detail) => {
    detail.regulatoryApprovals.forEach((approval) => {
      if (approval.status === "pending") {
        pendingApprovals.push({
          ...approval.toObject(),
          matter: detail.matter,
          matterId: detail.matterId,
        });
      }
    });
  });

  res.status(200).json({
    status: "success",
    results: pendingApprovals.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: {
      pendingApprovals,
    },
  });
});

// ============================================
// BULK OPERATIONS
// ============================================

exports.bulkUpdateCorporateMatters = catchAsync(async (req, res, next) => {
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
      matterType: "corporate",
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
// HELPER FUNCTIONS
// ============================================

const buildFirmQuery = (req, additionalFilters = {}) => {
  return {
    firmId: req.firmId,
    isDeleted: false,
    ...additionalFilters,
  };
};

// ============================================
// CORPORATE REPORT PDF GENERATION
// ============================================

/**
 * @desc    Generate corporate matter report PDF
 * @route   GET /api/corporate-matters/:matterId/report
 * @access  Private
 */
exports.generateCorporateReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "corporate",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No corporate matter found with that ID", 404));
  }

  const corporateDetails = await CorporateDetail.findOne({ matterId, firmId });
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Corporate Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
  });

  pdf.init(res, path.resolve(__dirname, `../output/${matter.matterNumber}_corporate_report_${Date.now()}.pdf`));

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

  // Corporate Details
  if (corporateDetails) {
    pdf.addSection("Corporate Information");
    pdf.addField("Company Name", corporateDetails.companyName);
    pdf.addField("CAC Number", corporateDetails.cacRegNumber);
    pdf.addField("Company Type", corporateDetails.companyType);
    pdf.addField("Industry", corporateDetails.industry);

    if (corporateDetails.registeredAddress) {
      pdf.addSubSection("Registered Address");
      pdf.addField("Address", corporateDetails.registeredAddress);
      pdf.addField("State", corporateDetails.state);
    }

    if (corporateDetails.shareholders?.length > 0) {
      pdf.addSection("Shareholders");
      corporateDetails.shareholders.forEach(sh => {
        pdf.addField(sh.name, `${sh.percentage || 0}% ownership`);
      });
    }

    if (corporateDetails.directors?.length > 0) {
      pdf.addSection("Directors");
      corporateDetails.directors.forEach(dir => {
        pdf.addField(dir.name, dir.designation || "Director");
      });
    }

    if (corporateDetails.secretary) {
      pdf.addSection("Company Secretary");
      pdf.addField("Name", corporateDetails.secretary.name);
      if (corporateDetails.secretary.contact) pdf.addField("Contact", corporateDetails.secretary.contact);
    }
  }

  await pdf.generate();
});

module.exports = exports;
