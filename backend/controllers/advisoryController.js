const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const AdvisoryDetail = require("../models/advisoryDetailModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
const {
  GenericPdfGenerator,
  formatDate,
  COLORS,
  getStatusColors,
} = require("../utils/generateGenericPdf");
const PDFDocument = require("pdfkit");

// Helper function to draw status badge in PDF
function drawStatusBadge(doc, status, x, y) {
  const { fg, bg } = getStatusColors(status);
  const label = String(status || "N/A").toUpperCase();
  const badgeW = doc.widthOfString(label, { fontSize: 8 }) + 12;
  doc.roundedRect(x, y, badgeW, 14, 2).fill(bg);
  doc
    .fillColor(fg)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(label, x + 6, y + 3);
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
      if (
        processed._id &&
        typeof processed._id === "string" &&
        processed._id.startsWith("temp_")
      ) {
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
          setFields[`riskAssessment.${nestedKey}`] = processArrayItems(
            updateObj[key][nestedKey],
          );
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
    } else if (
      key === "jurisdiction" ||
      key === "applicableLaws" ||
      key === "regulatoryBodies"
    ) {
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
    advisoryDetail.complianceChecklist[
      advisoryDetail.complianceChecklist.length - 1
    ];

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
    return next(
      new AppError("Advisory details or compliance item not found", 404),
    );
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
    advisoryDetail.riskAssessment.risks[
      advisoryDetail.riskAssessment.risks.length - 1
    ];

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
// SPLICED INTO advisoryController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
// SPLICED INTO advisoryController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
exports.generateAdvisoryReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const Firm = require("../models/firmModel");
  const { COLORS, formatCurrency } = require("../utils/generateGenericPdf");

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

  const d = (await AdvisoryDetail.findOne({ matterId, firmId })) || {};
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Advisory Matter Report",
    headerTitle: "Advisory Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
    subtitle: matter?.title || "",
    firmContact: buildFirmContact(firm),
  });

  pdf.init(
    res,
    path.resolve(
      __dirname,
      `../output/${matter.matterNumber}_advisory_report_${Date.now()}.pdf`,
    ),
  );
  pdf.addHeader();

  // ── Helpers (self-contained per this report) ──────────────────────────────
  const h = (v) => (v == null || String(v).trim() === "" ? "—" : v);
  const titleCase = (v) =>
    String(v || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const labelOf = (map, v) =>
    v == null || v === "" ? "—" : map[v] || titleCase(v);
  const fmtDate = (v) => (v ? formatDate(v) : "—");
  const money = (m) => {
    if (m == null) return "—";
    if (typeof m === "object" && m.amount != null)
      return formatCurrency(m.amount, m.currency || "NGN");
    if (typeof m === "number") return formatCurrency(m, "NGN");
    return "—";
  };
  const listOf = (arr) => (arr || []).filter(Boolean).join(", ") || "—";
  const personName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";
  const clientName = (c) =>
    c?.companyName ||
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    c?.email ||
    "—";
  const statusAccent = (s) => {
    const x = String(s || "").toLowerCase();
    if (
      [
        "delivered",
        "approved",
        "implemented",
        "answered",
        "compliant",
      ].includes(x)
    )
      return COLORS.success;
    if (
      ["active", "pending", "in-progress", "researching", "on-hold"].includes(x)
    )
      return COLORS.info;
    if (["rejected", "non-compliant", "critical", "overdue"].includes(x))
      return COLORS.danger;
    if (["partially-compliant", "partially-won", "medium"].includes(x))
      return COLORS.warning;
    return COLORS.navyMid;
  };
  function buildFirmContact(firm) {
    const c = firm?.contact || {};
    const parts = [];
    if (c.address) {
      const seen = new Set();
      const addr = [c.address.street, c.address.city, c.address.state]
        .filter(Boolean)
        .filter((part) => {
          const k = String(part).trim().toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .join(", ");
      if (addr) parts.push(addr);
    }
    if (c.phone) parts.push(c.phone);
    if (c.email) parts.push(c.email);
    if (c.rcNumber) {
      const rc = String(c.rcNumber).trim();
      parts.push(/^rc/i.test(rc) ? rc : `RC ${rc}`);
    }
    return parts.join("   ·   ");
  }

  // ── Label maps (from advisoryDetailModel enums) ────────────────────────────
  const ADVISORY_TYPE_LABELS = {
    legal_opinion: "Legal Opinion",
    regulatory_compliance: "Regulatory Compliance",
    due_diligence: "Due Diligence",
    contract_review: "Contract Review",
    policy_development: "Policy Development",
    legal_research: "Legal Research",
    risk_assessment: "Risk Assessment",
    litigation_risk_analysis: "Litigation Risk Analysis",
    regulatory_strategy: "Regulatory Strategy",
    transaction_advisory: "Transaction Advisory",
    other: "Other",
  };
  const DELIVERABLE_TYPE_LABELS = {
    "legal-opinion": "Legal Opinion",
    memo: "Memo",
    report: "Report",
    presentation: "Presentation",
    other: "Other",
  };

  const deliverables = d.deliverables || [];
  const deliveredCount = deliverables.filter(
    (x) => x.status === "delivered" || x.status === "approved",
  ).length;
  const risk = d.riskAssessment?.overallRisk || "";
  const riskLabel =
    risk === "critical"
      ? "Critical"
      : risk === "high"
        ? "High"
        : risk === "medium"
          ? "Medium"
          : risk === "low"
            ? "Low"
            : "—";

  // ── Matter overview (KPI cards) ───────────────────────────────────────────
  pdf.addSection("Matter Overview");
  pdf.addKpiCards([
    {
      label: "Advisory Type",
      value: labelOf(ADVISORY_TYPE_LABELS, d.advisoryType),
      accent: COLORS.navyMid,
    },
    {
      label: "Overall Risk",
      value: riskLabel,
      accent: statusAccent(risk),
    },
    {
      label: "Deliverables",
      value: deliverables.length
        ? `${deliveredCount}/${deliverables.length}`
        : "—",
      accent: COLORS.info,
    },
    {
      label: "Status",
      value: titleCase(matter.status),
      accent: statusAccent(matter.status),
    },
  ]);

  pdf.addKeyValueGrid(
    [
      { label: "Matter Number", value: matter.matterNumber, bold: true },
      { label: "Status", value: titleCase(matter.status), bold: true },
      { label: "Priority", value: titleCase(matter.priority) },
      { label: "Date Opened", value: fmtDate(matter.dateOpened) },
      { label: "Expected Closure", value: fmtDate(matter.expectedClosureDate) },
      { label: "Billing Type", value: titleCase(matter.billingType) },
      { label: "Client", value: clientName(matter.client), bold: true },
      { label: "Reference", value: matter.officeFileNo || "—" },
    ],
    { cols: 2 },
  );

  // ── Client & team ─────────────────────────────────────────────────────────
  pdf.addSection("Client & Legal Team");
  pdf.addKeyValueGrid(
    [
      { label: "Client", value: clientName(matter.client), bold: true },
      { label: "Client Company", value: matter.client?.companyName || "—" },
      { label: "Client Email", value: matter.client?.email || "—" },
      { label: "Client Phone", value: matter.client?.phone || "—" },
      {
        label: "Account Officer(s)",
        value: (matter.accountOfficer || []).map(personName).join(", ") || "—",
      },
      { label: "Reference", value: matter.officeFileNo || "—" },
    ],
    { cols: 2 },
  );

  // ── Advisory overview ─────────────────────────────────────────────────────
  pdf.addSection("Advisory Overview");
  pdf.addKeyValueGrid(
    [
      {
        label: "Advisory Type",
        value: labelOf(ADVISORY_TYPE_LABELS, d.advisoryType),
        bold: true,
      },
      { label: "Other Type", value: h(d.otherAdvisoryType) },
      { label: "Request Date", value: fmtDate(d.requestDate) },
      { label: "Target Delivery", value: fmtDate(d.targetDeliveryDate) },
      { label: "Actual Delivery", value: fmtDate(d.actualDeliveryDate) },
      { label: "Confidence", value: titleCase(d.opinion?.confidence) },
      { label: "Jurisdiction(s)", value: listOf(d.jurisdiction) },
      { label: "Regulatory Body(s)", value: listOf(d.regulatoryBodies) },
      { label: "Applicable Laws", value: listOf(d.applicableLaws) },
    ],
    { cols: 2 },
  );

  // ── Request & scope ───────────────────────────────────────────────────────
  if (d.requestDescription)
    pdf.addLongTextField("Request Description", d.requestDescription);
  if (d.scope) pdf.addLongTextField("Scope of Engagement", d.scope);
  if (d.researchNotes) pdf.addLongTextField("Research Notes", d.researchNotes);

  // ── Research questions ────────────────────────────────────────────────────
  if ((d.researchQuestions || []).length) {
    pdf.addSection("Research Questions");
    pdf.addDataTable(
      ["Question", "Answer", "Status"],
      (d.researchQuestions || []).map((q) => [
        h(q.question),
        h(q.answer),
        titleCase(q.status || "pending"),
      ]),
      { widths: [2.8, 2.8, 1.2], statusColumns: [2] },
    );
  }

  // ── Key findings ──────────────────────────────────────────────────────────
  if ((d.keyFindings || []).length) {
    pdf.addSection("Key Findings");
    pdf.addDataTable(
      ["Finding", "Source", "Relevance"],
      (d.keyFindings || []).map((f) => [
        h(f.finding),
        h(f.source),
        h(f.relevance),
      ]),
      { widths: [3.2, 1.6, 2] },
    );
  }

  // ── Legal precedents ──────────────────────────────────────────────────────
  if ((d.legalPrecedents || []).length) {
    pdf.addSection("Legal Precedents");
    pdf.addDataTable(
      ["Case", "Citation", "Relevance"],
      (d.legalPrecedents || []).map((p) => [
        h(p.caseName),
        h(p.citation),
        h(p.relevance),
      ]),
      { widths: [2.2, 1.8, 2.8] },
    );
  }

  // ── Opinion & recommendations ─────────────────────────────────────────────
  if (d.opinion?.summary || d.opinion?.conclusion) {
    pdf.addSection("Opinion & Recommendations");
    pdf.addKeyValueGrid(
      [
        {
          label: "Overall Opinion",
          value: d.opinion?.summary ? "Provided" : "—",
          bold: true,
        },
        {
          label: "Conclusion",
          value: d.opinion?.conclusion ? "Provided" : "—",
        },
        { label: "Confidence Level", value: titleCase(d.opinion?.confidence) },
      ],
      { cols: 2 },
    );
    if (d.opinion?.summary)
      pdf.addLongTextField("Opinion Summary", d.opinion.summary);
    if (d.opinion?.conclusion)
      pdf.addLongTextField("Conclusion", d.opinion.conclusion);
  }

  if ((d.recommendations || []).length) {
    pdf.addSection("Recommendations");
    pdf.addDataTable(
      ["Recommendation", "Priority", "Status"],
      (d.recommendations || []).map((r) => [
        h(r.recommendation),
        titleCase(r.priority || "medium"),
        titleCase(r.implementationStatus || "pending"),
      ]),
      { widths: [4, 1.1, 1.4], statusColumns: [1, 2] },
    );
  }

  // ── Deliverables ──────────────────────────────────────────────────────────
  if (deliverables.length) {
    pdf.addSection("Deliverables");
    pdf.addDataTable(
      ["Deliverable", "Type", "Due", "Delivered", "Status"],
      deliverables.map((del) => [
        h(del.title),
        labelOf(DELIVERABLE_TYPE_LABELS, del.type),
        fmtDate(del.dueDate),
        fmtDate(del.deliveryDate),
        titleCase(del.status || "pending"),
      ]),
      { widths: [2, 1.6, 1, 1, 1.2], statusColumns: [4] },
    );
  }

  // ── Compliance checklist ──────────────────────────────────────────────────
  if ((d.complianceChecklist || []).length) {
    pdf.addSection("Compliance Checklist");
    pdf.addDataTable(
      ["Requirement", "Status", "Due", "Notes"],
      (d.complianceChecklist || []).map((c) => [
        h(c.requirement),
        titleCase(c.status || "not-applicable"),
        fmtDate(c.dueDate),
        h(c.notes),
      ]),
      { widths: [3, 1.3, 1, 1.6], statusColumns: [1] },
    );
  }

  // ── Risk assessment ───────────────────────────────────────────────────────
  const risks = d.riskAssessment?.risks || [];
  pdf.addSection("Risk Assessment");
  pdf.addKeyValueGrid(
    [
      {
        label: "Overall Risk",
        value: riskLabel,
        bold: true,
        color: statusAccent(risk),
      },
      { label: "Risks Identified", value: String(risks.length) },
    ],
    { cols: 2 },
  );
  if (risks.length) {
    pdf.addDataTable(
      ["Risk", "Likelihood", "Impact", "Mitigation"],
      risks.map((r) => [
        h(r.risk),
        titleCase(r.likelihood || "medium"),
        titleCase(r.impact || "medium"),
        h(r.mitigation),
      ]),
      { widths: [2.6, 1, 1, 2.4], statusColumns: [] },
    );
  }

  // ── Closing note ──────────────────────────────────────────────────────────
  pdf.addNote(
    `This report was generated from ${firm?.name || "the firm's"} matter management system on ${formatDate(
      new Date(),
    )}. It reflects the information recorded against matter ${
      matter.matterNumber
    } at the time of generation and is confidential to the firm and its client.`,
    { type: "gold" },
  );

  await pdf.generate();
});

module.exports = exports;
