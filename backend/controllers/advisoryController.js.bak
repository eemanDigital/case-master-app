const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const AdvisoryDetail = require("../models/advisorydetailModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
const { GenericPdfGenerator, formatDate, COLORS, getStatusColors } = require("../utils/generateGenericPdf");
const PDFDocument = require("pdfkit");

// Helper function to draw status badge in PDF
function drawStatusBadge(doc, status, x, y) {
  const { fg, bg } = getStatusColors(status);
  const label = String(status || "N/A").toUpperCase();
  const badgeW = doc.widthOfString(label, { fontSize: 8 }) + 12;
  doc.roundedRect(x, y, badgeW, 14, 2).fill(bg);
  doc.fillColor(fg).fontSize(8).font("Helvetica-Bold").text(label, x + 6, y + 3);
}
const path = require("path");

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

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  // Start transaction
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    // 1. Verify matter exists
    const matter = await Matter.findOne({
      _id: matterId,
      firmId: req.firmId,
      isDeleted: false,
    });

    // .session(session);

    if (!matter) {
      // await session.abortTransaction();
      // session.endSession();
      return next(new AppError("Matter not found", 404));
    }

    if (matter.matterType !== "advisory") {
      // await session.abortTransaction();
      // session.endSession();
      return next(new AppError("Matter is not an advisory matter", 400));
    }

    // 2. Check if advisory details already exist
    const existingDetail = await AdvisoryDetail.findOne({
      matterId,
      firmId: req.firmId,
    });

    // .session(session);

    if (existingDetail) {
      // await session.abortTransaction();
      // session.endSession();
      return next(
        new AppError("Advisory details already exist for this matter", 400),
      );
    }

    // 3. Create advisory detail
    const advisoryDetail = new AdvisoryDetail({
      matterId,
      firmId: req.firmId,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id,
      ...advisoryData,
    });

    // await advisoryDetail.save({ session });
    await advisoryDetail.save();

    // 4. Update matter to link advisory detail
    matter.advisoryDetail = advisoryDetail._id;
    // await matter.save({ session });
    await matter.save();

    // await session.commitTransaction();
    // session.endSession();

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
    // await session.abortTransaction();
    // session.endSession();
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

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

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

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  // Helper function to process array items - convert temp IDs to real ObjectIds
  const processArrayItems = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map((item) => {
      const processed = { ...item };
      // If _id starts with "temp_", remove it so MongoDB generates a new one
      if (processed._id && typeof processed._id === "string" && processed._id.startsWith("temp_")) {
        delete processed._id;
      }
      return processed;
    });
  };

  // Build update object with proper field path updates for nested objects
  const setFields = {};
  const updateObj = { ...updateData };

  // Handle top-level fields and nested objects
  Object.keys(updateObj).forEach((key) => {
    if (key === "riskAssessment" && typeof updateObj[key] === "object") {
      // Handle riskAssessment nested object
      Object.keys(updateObj[key]).forEach((nestedKey) => {
        if (nestedKey === "risks") {
          // Process risks array - convert temp IDs
          setFields[`riskAssessment.${nestedKey}`] = processArrayItems(updateObj[key][nestedKey]);
        } else {
          setFields[`riskAssessment.${nestedKey}`] = updateObj[key][nestedKey];
        }
      });
    } else if (key === "opinion" && typeof updateObj[key] === "object") {
      // Handle opinion nested object
      Object.keys(updateObj[key]).forEach((nestedKey) => {
        setFields[`opinion.${nestedKey}`] = updateObj[key][nestedKey];
      });
    } else if (key === "researchQuestions") {
      // Process and replace entire research questions array
      setFields[key] = processArrayItems(updateObj[key]);
    } else if (key === "keyFindings") {
      // Process and replace entire key findings array
      setFields[key] = processArrayItems(updateObj[key]);
    } else if (key === "recommendations") {
      // Process and replace entire recommendations array
      setFields[key] = processArrayItems(updateObj[key]);
    } else if (key === "deliverables") {
      // Process and replace entire deliverables array
      setFields[key] = processArrayItems(updateObj[key]);
    } else if (key === "complianceChecklist") {
      // Process and replace entire compliance checklist array
      setFields[key] = processArrayItems(updateObj[key]);
    } else if (key === "legalPrecedents") {
      // Process and replace entire legal precedents array
      setFields[key] = processArrayItems(updateObj[key]);
    } else if (key === "jurisdiction" || key === "applicableLaws" || key === "regulatoryBodies") {
      // Replace array fields
      setFields[key] = updateObj[key];
    } else {
      // Regular top-level field
      setFields[key] = updateObj[key];
    }
  });

  // Add metadata
  setFields.lastModifiedBy = req.user._id;
  setFields.lastModifiedAt = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $set: setFields },
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
 * @desc    Delete advisory details (soft delete)
 * @route   DELETE /api/advisory-matters/:matterId/details
 * @access  Private (Admin, Lawyer)
 */
exports.deleteAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { deletionType = "soft" } = req.query;

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  if (deletionType === "hard") {
    // Hard delete - completely remove the document
    const advisoryDetail = await AdvisoryDetail.findOneAndDelete({
      matterId,
      firmId: req.firmId,
    });

    if (!advisoryDetail) {
      return next(new AppError("Advisory details not found", 404));
    }

    // Remove reference from matter
    await Matter.findOneAndUpdate(
      { _id: matterId, firmId: req.firmId },
      { $unset: { advisoryDetail: 1 } },
    );

    res.status(200).json({
      status: "success",
      data: null,
      message: "Advisory details permanently deleted",
    });
  } else {
    // Soft delete - mark as deleted
    const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
      { matterId, firmId: req.firmId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
        lastModifiedBy: req.user._id,
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
      data: {
        advisoryDetail,
      },
      message: "Advisory details moved to trash",
    });
  }
});

/**
 * @desc    Restore advisory details
 * @route   PATCH /api/advisory-matters/:matterId/details/restore
 * @access  Private (Admin, Lawyer)
 */
exports.restoreAdvisoryDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      lastModifiedBy: req.user._id,
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
// RESEARCH QUESTIONS MANAGEMENT - FIXED
// ============================================

exports.addResearchQuestion = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const questionData = req.body;

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        researchQuestions: {
          ...questionData,
          _id: new mongoose.Types.ObjectId(),
          status: questionData.status || "pending",
          addedBy: req.user._id,
          addedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  const newQuestion =
    advisoryDetail.researchQuestions[
      advisoryDetail.researchQuestions.length - 1
    ];

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newQuestion,
    },
  });
});

exports.updateResearchQuestion = catchAsync(async (req, res, next) => {
  const { matterId, questionId } = req.params;
  const updateData = req.body;

  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(questionId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  // Use $set with specific field paths, not replacing entire object
  const setFields = {};
  Object.keys(updateData).forEach((key) => {
    setFields[`researchQuestions.$.${key}`] = updateData[key];
  });

  // Add metadata fields
  setFields["researchQuestions.$.updatedBy"] = req.user._id;
  setFields["researchQuestions.$.updatedAt"] = new Date();
  setFields.lastModifiedBy = req.user._id;
  setFields.lastModifiedAt = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "researchQuestions._id": questionId,
    },
    {
      $set: setFields,
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

  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(questionId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { researchQuestions: { _id: questionId } },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
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
    },
    message: "Research question removed successfully",
  });
});

// ============================================
// KEY FINDINGS MANAGEMENT - FIXED
// ============================================

exports.addKeyFinding = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const findingData = req.body;

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        keyFindings: {
          ...findingData,
          _id: new mongoose.Types.ObjectId(),
          addedBy: req.user._id,
          addedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  const newFinding =
    advisoryDetail.keyFindings[advisoryDetail.keyFindings.length - 1];

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newFinding,
    },
  });
});

exports.updateKeyFinding = catchAsync(async (req, res, next) => {
  const { matterId, findingId } = req.params;
  const updateData = req.body;

  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(findingId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  // FIXED: Use $set with specific field paths
  const setFields = {};
  Object.keys(updateData).forEach((key) => {
    setFields[`keyFindings.$.${key}`] = updateData[key];
  });

  setFields["keyFindings.$.updatedBy"] = req.user._id;
  setFields["keyFindings.$.updatedAt"] = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "keyFindings._id": findingId,
    },
    {
      $set: {
        ...setFields,
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
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

  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(findingId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { keyFindings: { _id: findingId } },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
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
    },
    message: "Key finding removed successfully",
  });
});

// ============================================
// OPINION MANAGEMENT - FIXED
// ============================================

exports.updateOpinion = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const opinionData = req.body;

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  // FIXED: Use individual field updates instead of replacing entire object
  const setFields = {};
  Object.keys(opinionData).forEach((key) => {
    setFields[`opinion.${key}`] = opinionData[key];
  });

  setFields["opinion.updatedBy"] = req.user._id;
  setFields["opinion.updatedAt"] = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        ...setFields,
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
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
// RECOMMENDATIONS MANAGEMENT - FIXED
// ============================================

exports.addRecommendation = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const recommendationData = req.body;

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        recommendations: {
          ...recommendationData,
          _id: new mongoose.Types.ObjectId(),
          implementationStatus:
            recommendationData.implementationStatus || "pending",
          addedBy: req.user._id,
          addedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  const newRecommendation =
    advisoryDetail.recommendations[advisoryDetail.recommendations.length - 1];

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newRecommendation,
    },
  });
});

exports.updateRecommendation = catchAsync(async (req, res, next) => {
  const { matterId, recommendationId } = req.params;
  const updateData = req.body;

  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(recommendationId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  // FIXED: Use $set with specific field paths
  const setFields = {};
  Object.keys(updateData).forEach((key) => {
    setFields[`recommendations.$.${key}`] = updateData[key];
  });

  setFields["recommendations.$.updatedBy"] = req.user._id;
  setFields["recommendations.$.updatedAt"] = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "recommendations._id": recommendationId,
    },
    {
      $set: {
        ...setFields,
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
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

  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(recommendationId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { recommendations: { _id: recommendationId } },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
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
    },
    message: "Recommendation removed successfully",
  });
});

// ============================================
// DELIVERABLES MANAGEMENT - FIXED (MAIN ERROR FIX)
// ============================================

exports.addDeliverable = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const deliverableData = req.body;

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        deliverables: {
          ...deliverableData,
          _id: new mongoose.Types.ObjectId(),
          status: deliverableData.status || "pending",
          addedBy: req.user._id,
          addedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  const newDeliverable =
    advisoryDetail.deliverables[advisoryDetail.deliverables.length - 1];

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newDeliverable,
    },
  });
});

exports.updateDeliverable = catchAsync(async (req, res, next) => {
  const { matterId, deliverableId } = req.params;
  const updateData = req.body;

  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(deliverableId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  // FIXED: Use $set with specific field paths instead of replacing entire object
  // This is the fix for the MongoDB error
  const setFields = {};
  Object.keys(updateData).forEach((key) => {
    setFields[`deliverables.$.${key}`] = updateData[key];
  });

  // Add metadata fields
  setFields["deliverables.$.updatedBy"] = req.user._id;
  setFields["deliverables.$.updatedAt"] = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "deliverables._id": deliverableId,
    },
    {
      $set: {
        ...setFields,
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
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

  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(deliverableId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { deliverables: { _id: deliverableId } },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
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
    },
    message: "Deliverable removed successfully",
  });
});

// ============================================
// SERVICE COMPLETION - FIXED
// ============================================

exports.completeAdvisory = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { completionDate, finalOpinion } = req.body;

  // Validate matterId
  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const session = await mongoose.startSession();
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
        $set: {
          status: "completed",
          actualClosureDate: completionDate || new Date(),
          lastModifiedBy: req.user._id,
          lastActivityDate: new Date(),
        },
      },
      { new: true, runValidators: true, session },
    );

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Advisory matter not found", 404));
    }

    // Update advisory detail
    const updateFields = {
      completionDate: completionDate || new Date(),
      lastModifiedBy: req.user._id,
      lastModifiedAt: new Date(),
    };

    // Add opinion fields if provided
    if (finalOpinion) {
      Object.keys(finalOpinion).forEach((key) => {
        updateFields[`opinion.${key}`] = finalOpinion[key];
      });
      updateFields["opinion.finalizedBy"] = req.user._id;
      updateFields["opinion.finalizationDate"] = new Date();
    }

    const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
      { matterId, firmId: req.firmId },
      { $set: updateFields },
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
// STATISTICS & DASHBOARD - FIXED
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
          inProgressAdvisoryMatters: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
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
  const pendingDeliverables = deliverableStats.find((s) => s._id === "pending");
  const inProgressDeliverables = deliverableStats.find(
    (s) => s._id === "in-progress",
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
        inProgressAdvisoryMatters: 0,
        completedAdvisoryMatters: 0,
      },
      byType,
      researchQuestions: {
        byStatus: researchStats,
        total: researchStats.reduce((sum, stat) => sum + stat.count, 0),
      },
      deliverables: {
        byStatus: deliverableStats,
        pending: pendingDeliverables?.count || 0,
        inProgress: inProgressDeliverables?.count || 0,
        overdue: overdueDeliverables,
        total: deliverableStats.reduce((sum, stat) => sum + stat.count, 0),
      },
      recentAdvisories,
    },
  });
});

// ============================================
// BULK OPERATIONS - FIXED
// ============================================

exports.bulkUpdateAdvisoryMatters = catchAsync(async (req, res, next) => {
  const { matterIds, updates } = req.body;

  if (!matterIds || !Array.isArray(matterIds) || matterIds.length === 0) {
    return next(new AppError("Please provide matter IDs to update", 400));
  }

  if (!updates || Object.keys(updates).length === 0) {
    return next(new AppError("Please provide updates to apply", 400));
  }

  // Validate all matterIds
  for (const id of matterIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid matter ID format: ${id}`, 400));
    }
  }

  const result = await Matter.updateMany(
    {
      _id: { $in: matterIds },
      firmId: req.firmId,
      matterType: "advisory",
    },
    {
      $set: {
        ...updates,
        lastModifiedBy: req.user._id,
        lastActivityDate: new Date(),
      },
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
// COMPLIANCE CHECKLIST MANAGEMENT
// ============================================

exports.addComplianceItem = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const complianceData = req.body;

  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        complianceChecklist: {
          ...complianceData,
          _id: new mongoose.Types.ObjectId(),
          addedBy: req.user._id,
          addedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  const newItem =
    advisoryDetail.complianceChecklist[advisoryDetail.complianceChecklist.length - 1];

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newItem,
    },
  });
});

exports.updateComplianceItem = catchAsync(async (req, res, next) => {
  const { matterId, itemId } = req.params;
  const updateData = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  const setFields = {};
  Object.keys(updateData).forEach((key) => {
    setFields[`complianceChecklist.$.${key}`] = updateData[key];
  });
  setFields["complianceChecklist.$.updatedBy"] = req.user._id;
  setFields["complianceChecklist.$.updatedAt"] = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "complianceChecklist._id": itemId,
    },
    {
      $set: {
        ...setFields,
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Compliance item not found", 404));
  }

  const updatedItem = advisoryDetail.complianceChecklist.id(itemId);

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      updatedItem,
    },
  });
});

exports.deleteComplianceItem = catchAsync(async (req, res, next) => {
  const { matterId, itemId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { complianceChecklist: { _id: itemId } },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details or compliance item not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
    },
    message: "Compliance item removed successfully",
  });
});

// ============================================
// RISK ASSESSMENT MANAGEMENT
// ============================================

exports.updateRiskAssessment = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { overallRisk, risks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const setFields = {};

  if (overallRisk !== undefined) {
    setFields["riskAssessment.overallRisk"] = overallRisk;
  }

  if (risks !== undefined) {
    setFields["riskAssessment.risks"] = risks.map((risk) => ({
      ...risk,
      _id: risk._id || new mongoose.Types.ObjectId(),
      updatedAt: new Date(),
    }));
  }

  setFields.lastModifiedBy = req.user._id;
  setFields.lastModifiedAt = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $set: setFields },
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

exports.addRiskItem = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const riskData = req.body;

  if (!mongoose.Types.ObjectId.isValid(matterId)) {
    return next(new AppError("Invalid matter ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        "riskAssessment.risks": {
          ...riskData,
          _id: new mongoose.Types.ObjectId(),
          addedBy: req.user._id,
          addedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details not found", 404));
  }

  const newRisk =
    advisoryDetail.riskAssessment.risks[advisoryDetail.riskAssessment.risks.length - 1];

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      newRisk,
    },
  });
});

exports.updateRiskItem = catchAsync(async (req, res, next) => {
  const { matterId, riskId } = req.params;
  const updateData = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(riskId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  const setFields = {};
  Object.keys(updateData).forEach((key) => {
    setFields[`riskAssessment.risks.$.${key}`] = updateData[key];
  });
  setFields["riskAssessment.risks.$.updatedBy"] = req.user._id;
  setFields["riskAssessment.risks.$.updatedAt"] = new Date();

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "riskAssessment.risks._id": riskId,
    },
    {
      $set: {
        ...setFields,
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Risk item not found", 404));
  }

  const updatedRisk = advisoryDetail.riskAssessment.risks.id(riskId);

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
      updatedRisk,
    },
  });
});

exports.deleteRiskItem = catchAsync(async (req, res, next) => {
  const { matterId, riskId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(matterId) ||
    !mongoose.Types.ObjectId.isValid(riskId)
  ) {
    return next(new AppError("Invalid ID format", 400));
  }

  const advisoryDetail = await AdvisoryDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { "riskAssessment.risks": { _id: riskId } },
      $set: {
        lastModifiedBy: req.user._id,
        lastModifiedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!advisoryDetail) {
    return next(new AppError("Advisory details or risk item not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      advisoryDetail,
    },
    message: "Risk item removed successfully",
  });
});

// ============================================
// ADVISORY REPORT PDF GENERATION
// ============================================

/**
 * @desc    Generate advisory matter report PDF
 * @route   GET /api/advisory-matters/:matterId/report
 * @access  Private
 */
exports.generateAdvisoryReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "advisory",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No advisory matter found with that ID", 404));
  }

  const advisoryDetails = await AdvisoryDetail.findOne({ matterId, firmId });
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Advisory Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
  });

  pdf.init(res, path.resolve(__dirname, `../output/${matter.matterNumber}_advisory_report_${Date.now()}.pdf`));

  // Add Header
  pdf.addHeader();

  // Matter Information
  pdf.addSection("Matter Information");
  pdf.addTwoColumnField("Matter Number", matter?.matterNumber, "Status", matter?.status);
  pdf.addTwoColumnField("Title", matter?.title, "Priority", matter?.priority);
  pdf.addTwoColumnField("Date Opened", formatDate(matter?.dateOpened), "Client", matter?.client ? `${matter.client.firstName} ${matter.client.lastName}` : null);
  if (matter?.client?.companyName) pdf.addTwoColumnField("Company", matter.client.companyName, "Account Officer", matter?.accountOfficer ? `${matter.accountOfficer.firstName} ${matter.accountOfficer.lastName}` : null);
  if (matter?.client?.email) pdf.addTwoColumnField("Client Email", matter.client.email, "Client Phone", matter?.client?.phone || null);

  // Advisory Details
  if (advisoryDetails) {
    // Advisory Type & Industry
    pdf.addSection("Advisory Overview");
    pdf.addTwoColumnField("Advisory Type", advisoryDetails.advisoryType?.replace(/_/g, " ").toUpperCase(), "Industry", advisoryDetails.industry || "N/A");
    pdf.addTwoColumnField("Project Status", advisoryDetails.projectStatus, "Request Date", formatDate(advisoryDetails.requestDate));
    pdf.addTwoColumnField("Target Delivery", formatDate(advisoryDetails.targetDeliveryDate), "Actual Delivery", formatDate(advisoryDetails.actualDeliveryDate));

    // Scope & Request
    if (advisoryDetails.requestDescription) {
      pdf.addSubSection("Request Description");
      pdf.addLongTextField("", advisoryDetails.requestDescription);
    }

    if (advisoryDetails.scope) {
      pdf.addSubSection("Scope");
      pdf.addLongTextField("", advisoryDetails.scope);
    }

    // Jurisdiction & Laws
    if (advisoryDetails.jurisdiction?.length > 0 || advisoryDetails.applicableLaws?.length > 0 || advisoryDetails.regulatoryBodies?.length > 0) {
      pdf.addSection("Jurisdiction & Regulatory");
      if (advisoryDetails.jurisdiction?.length > 0) {
        pdf.addField("Jurisdiction", advisoryDetails.jurisdiction.join(", "));
      }
      if (advisoryDetails.applicableLaws?.length > 0) {
        pdf.addField("Applicable Laws", advisoryDetails.applicableLaws.join(", "));
      }
      if (advisoryDetails.regulatoryBodies?.length > 0) {
        pdf.addField("Regulatory Bodies", advisoryDetails.regulatoryBodies.join(", "));
      }
    }

    // Research Questions
    if (advisoryDetails.researchQuestions?.length > 0) {
      pdf.addSection("Research Questions");
      const answeredCount = advisoryDetails.researchQuestions.filter(q => q.answer).length;
      pdf.addField("Progress", `${answeredCount}/${advisoryDetails.researchQuestions.length} answered`);

      advisoryDetails.researchQuestions.forEach((q, idx) => {
        pdf.checkY(60);
        const startY = pdf.y;
        
        // Question number badge
        pdf.doc.roundedRect(pdf.leftMargin, startY, 24, 16, 3).fill(COLORS.navy);
        pdf.doc.fillColor(COLORS.white).fontSize(9).font("Helvetica-Bold").text(`Q${idx + 1}`, pdf.leftMargin + 5, startY + 3);
        
        // Question text
        pdf.doc.fontSize(9).font("Helvetica").fillColor(q.answer ? COLORS.textPrimary : COLORS.textMuted)
          .text(q.question || "N/A", pdf.leftMargin + 30, startY + 2, { width: pdf.pageWidth - 60 });
        
        pdf.y = startY + 18;

        if (q.answer) {
          // Answer label
          pdf.doc.fontSize(8).fillColor(COLORS.textMuted).font("Helvetica").text("Answer:", pdf.leftMargin + 30, pdf.y);
          pdf.y += 12;
          
          // Answer text
          pdf.doc.fontSize(9).fillColor(COLORS.textPrimary).font("Helvetica")
            .text(q.answer, pdf.leftMargin + 30, pdf.y, { width: pdf.pageWidth - 60, height: 80 });
          const answerH = pdf.doc.heightOfString(q.answer, { width: pdf.pageWidth - 60 });
          pdf.y += Math.max(answerH, 20) + 10;
        } else {
          pdf.y += 10;
        }
        
        // Status badge
        drawStatusBadge(pdf.doc, q.status, pdf.leftMargin + pdf.pageWidth - 60, startY);
      });
    }

    // Key Findings
    if (advisoryDetails.keyFindings?.length > 0) {
      pdf.addSection("Key Findings");
      advisoryDetails.keyFindings.forEach((finding, idx) => {
        pdf.checkY(50);
        const startY = pdf.y;
        
        // Finding number
        pdf.doc.roundedRect(pdf.leftMargin, startY, 24, 16, 3).fill(COLORS.gold);
        pdf.doc.fillColor(COLORS.white).fontSize(9).font("Helvetica-Bold").text(`${idx + 1}`, pdf.leftMargin + 7, startY + 3);
        
        // Finding text
        pdf.doc.fontSize(10).fillColor(COLORS.textPrimary).font("Helvetica-Bold")
          .text(finding.finding || "N/A", pdf.leftMargin + 30, startY + 2, { width: pdf.pageWidth - 90 });
        
        const findingH = pdf.doc.heightOfString(finding.finding || "", { width: pdf.pageWidth - 90 });
        pdf.y = startY + Math.max(findingH, 16) + 8;

        if (finding.source) {
          pdf.doc.fontSize(8).fillColor(COLORS.textMuted).font("Helvetica").text("Source: ", pdf.leftMargin + 30, pdf.y, { continued: true });
          pdf.doc.fillColor(COLORS.navy).font("Helvetica").text(finding.source, pdf.leftMargin + 30 + pdf.doc.widthOfString("Source: ", { fontSize: 8 }), pdf.y, { width: pdf.pageWidth - 90 });
          pdf.y += 14;
        }
        if (finding.relevance) {
          pdf.doc.fontSize(8).fillColor(COLORS.textMuted).font("Helvetica").text("Relevance: ", pdf.leftMargin + 30, pdf.y, { continued: true });
          pdf.doc.fillColor(COLORS.gold).font("Helvetica").text(finding.relevance, pdf.leftMargin + 30 + pdf.doc.widthOfString("Relevance: ", { fontSize: 8 }), pdf.y, { width: pdf.pageWidth - 90 });
          pdf.y += 14;
        }
        
        pdf.y += 5;
      });
    }

    // Legal Precedents
    if (advisoryDetails.legalPrecedents?.length > 0) {
      pdf.addSection("Legal Precedents");
      advisoryDetails.legalPrecedents.forEach((precedent, idx) => {
        pdf.checkY(60);
        const startY = pdf.y;
        
        // Case name
        pdf.doc.fontSize(10).fillColor(COLORS.navy).font("Helvetica-Bold")
          .text(`${idx + 1}. ${precedent.caseName || "N/A"}`, pdf.leftMargin, startY, { width: pdf.pageWidth });
        pdf.y = startY + 16;

        if (precedent.citation) {
          pdf.doc.fontSize(9).fillColor(COLORS.textMuted).font("Helvetica-Oblique")
            .text(precedent.citation, pdf.leftMargin + 15, pdf.y, { width: pdf.pageWidth - 15 });
          pdf.y += 14;
        }
        if (precedent.summary) {
          pdf.doc.fontSize(9).fillColor(COLORS.textSecondary).font("Helvetica")
            .text(precedent.summary.substring(0, 200) + (precedent.summary.length > 200 ? "..." : ""), pdf.leftMargin + 15, pdf.y, { width: pdf.pageWidth - 15 });
          const summaryH = pdf.doc.heightOfString(precedent.summary.substring(0, 200), { width: pdf.pageWidth - 15 });
          pdf.y += Math.max(summaryH, 16) + 8;
        }
        if (precedent.relevance) {
          pdf.doc.fontSize(8).fillColor(COLORS.textMuted).font("Helvetica").text("Relevance: ", pdf.leftMargin + 15, pdf.y, { continued: true });
          pdf.doc.fillColor(COLORS.navyMid).font("Helvetica").text(precedent.relevance, pdf.leftMargin + 15 + pdf.doc.widthOfString("Relevance: ", { fontSize: 8 }), pdf.y);
          pdf.y += 14;
        }
        
        pdf.y += 8;
      });
    }

    // Risk Assessment
    if (advisoryDetails.riskAssessment) {
      pdf.addSection("Risk Assessment");
      
      if (advisoryDetails.riskAssessment.overallRisk) {
        pdf.addTwoColumnField("Overall Risk", advisoryDetails.riskAssessment.overallRisk?.toUpperCase(), "", null);
      }

      if (advisoryDetails.riskAssessment.risks?.length > 0) {
        pdf.addSubSection("Identified Risks");
        advisoryDetails.riskAssessment.risks.forEach((risk, idx) => {
          pdf.checkY(45);
          const startY = pdf.y;
          
          // Risk description
          pdf.doc.fontSize(9).fillColor(COLORS.textPrimary).font("Helvetica")
            .text(`${idx + 1}. ${risk.risk || "N/A"}`, pdf.leftMargin, startY, { width: pdf.pageWidth - 120 });
          
          const riskH = pdf.doc.heightOfString(risk.risk || "", { width: pdf.pageWidth - 120 });
          pdf.y = startY + Math.max(riskH, 14) + 4;

          // Likelihood and Impact badges
          if (risk.likelihood) drawStatusBadge(pdf.doc, risk.likelihood, pdf.leftMargin, pdf.y);
          if (risk.impact) drawStatusBadge(pdf.doc, risk.impact, pdf.leftMargin + 60, pdf.y);
          
          pdf.y += 16;

          if (risk.mitigation) {
            pdf.doc.fontSize(8).fillColor(COLORS.textMuted).font("Helvetica").text("Mitigation: ", pdf.leftMargin, pdf.y, { continued: true });
            pdf.doc.fillColor(COLORS.textSecondary).font("Helvetica")
              .text(risk.mitigation, pdf.leftMargin + pdf.doc.widthOfString("Mitigation: ", { fontSize: 8 }), pdf.y, { width: pdf.pageWidth - 30 });
            pdf.y += 14;
          }
          
          pdf.y += 5;
        });
      }
    }

    // Opinion
    if (advisoryDetails.opinion && (advisoryDetails.opinion.summary || advisoryDetails.opinion.conclusion)) {
      pdf.addSection("Legal Opinion");
      if (advisoryDetails.opinion.summary) {
        pdf.addSubSection("Summary");
        pdf.addLongTextField("", advisoryDetails.opinion.summary);
      }
      if (advisoryDetails.opinion.conclusion) {
        pdf.addSubSection("Conclusion");
        pdf.addLongTextField("", advisoryDetails.opinion.conclusion);
      }
      if (advisoryDetails.opinion.confidence) {
        pdf.addTwoColumnField("Confidence Level", advisoryDetails.opinion.confidence?.toUpperCase(), "", null);
      }
    }

    // Recommendations
    if (advisoryDetails.recommendations?.length > 0) {
      pdf.addSection("Recommendations");
      advisoryDetails.recommendations.forEach((rec, idx) => {
        pdf.checkY(40);
        const startY = pdf.y;
        
        pdf.doc.fontSize(9).fillColor(COLORS.textPrimary).font("Helvetica-Bold")
          .text(`${idx + 1}. ${rec.recommendation || "N/A"}`, pdf.leftMargin, startY, { width: pdf.pageWidth - 100 });
        
        const recH = pdf.doc.heightOfString(rec.recommendation || "", { width: pdf.pageWidth - 100 });
        pdf.y = startY + Math.max(recH, 14) + 4;

        if (rec.priority) {
          drawStatusBadge(pdf.doc, rec.priority, pdf.leftMargin, pdf.y);
        }
        if (rec.implementationStatus) {
          drawStatusBadge(pdf.doc, rec.implementationStatus, pdf.leftMargin + 60, pdf.y);
        }
        
        pdf.y += 18;
      });
    }

    // Deliverables
    if (advisoryDetails.deliverables?.length > 0) {
      pdf.addSection("Deliverables");
      const completedCount = advisoryDetails.deliverables.filter(d => d.status === "delivered" || d.status === "approved").length;
      pdf.addField("Progress", `${completedCount}/${advisoryDetails.deliverables.length} completed`);

      advisoryDetails.deliverables.forEach((del, idx) => {
        pdf.checkY(35);
        const startY = pdf.y;
        
        pdf.doc.fontSize(9).fillColor(COLORS.textPrimary).font("Helvetica-Bold")
          .text(`${idx + 1}. ${del.title || "N/A"}`, pdf.leftMargin, startY, { width: pdf.pageWidth - 150 });
        
        const titleH = pdf.doc.heightOfString(del.title || "", { width: pdf.pageWidth - 150 });
        pdf.y = startY + Math.max(titleH, 14) + 4;

        drawStatusBadge(pdf.doc, del.status, pdf.leftMargin, pdf.y);
        if (del.dueDate) {
          pdf.doc.fontSize(8).fillColor(COLORS.textMuted).font("Helvetica")
            .text(`Due: ${formatDate(del.dueDate)}`, pdf.leftMargin + 70, pdf.y + 2);
        }
        
        pdf.y += 18;
      });
    }

    // Compliance Checklist
    if (advisoryDetails.complianceChecklist?.length > 0) {
      pdf.addSection("Compliance Checklist");
      const compliantCount = advisoryDetails.complianceChecklist.filter(c => c.status === "compliant").length;
      pdf.addField("Status", `${compliantCount}/${advisoryDetails.complianceChecklist.length} compliant`);

      advisoryDetails.complianceChecklist.forEach((item, idx) => {
        pdf.checkY(35);
        const startY = pdf.y;
        
        pdf.doc.fontSize(9).fillColor(COLORS.textPrimary).font("Helvetica")
          .text(`${idx + 1}. ${item.requirement || "N/A"}`, pdf.leftMargin, startY, { width: pdf.pageWidth - 100 });
        
        const reqH = pdf.doc.heightOfString(item.requirement || "", { width: pdf.pageWidth - 100 });
        pdf.y = startY + Math.max(reqH, 14) + 4;

        drawStatusBadge(pdf.doc, item.status, pdf.leftMargin, pdf.y);
        if (item.dueDate) {
          pdf.doc.fontSize(8).fillColor(COLORS.textMuted).font("Helvetica")
            .text(`Due: ${formatDate(item.dueDate)}`, pdf.leftMargin + 90, pdf.y + 2);
        }
        
        pdf.y += 18;
      });
    }

    // Research Notes
    if (advisoryDetails.researchNotes) {
      pdf.addSection("Research Notes");
      pdf.addLongTextField("", advisoryDetails.researchNotes);
    }
  }

  await pdf.generate();
});

module.exports = exports;
