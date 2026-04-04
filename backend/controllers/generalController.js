const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const { GeneralDetail } = require("../models/retainerAndGeneralDetailModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { GenericPdfGenerator, getStatusColor, formatCurrency, formatDate } = require("../utils/generateGenericPdf");
const path = require("path");

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

exports.getAllGeneralMatters = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    includeStats,
    serviceType,
    status,
    search,
    includeDeleted,
    onlyDeleted,
    jurisdictionState,
  } = req.query;

  const customFilter = { matterType: "general" };

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

  // Enhance with general details
  if (
    result.data.length > 0 &&
    (!populate || !populate.includes("generalDetail"))
  ) {
    const matterIds = result.data.map((matter) => matter._id);
    const generalDetails = await GeneralDetail.find({
      matterId: { $in: matterIds },
      firmId: req.firmId,
    }).lean();

    const detailsMap = generalDetails.reduce((map, detail) => {
      map[detail.matterId.toString()] = detail;
      return map;
    }, {});

    result.data = result.data.map((matter) => ({
      ...matter,
      generalDetail: detailsMap[matter._id.toString()] || null,
    }));
  }

  // Filter by jurisdiction state if provided
  if (jurisdictionState && result.data.length > 0) {
    result.data = result.data.filter(
      (item) => item.generalDetail?.jurisdiction?.state === jurisdictionState,
    );
    result.total = result.data.length;
  }

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.searchGeneralMatters = catchAsync(async (req, res, next) => {
  const { criteria = {}, options = {} } = req.body;

  const firmCriteria = {
    ...criteria,
    firmId: req.firmId,
    matterType: "general",
  };

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
// GENERAL DETAILS MANAGEMENT (NO SESSION)
// ============================================

exports.createGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const generalData = req.body;

  // 1. Verify matter exists
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  if (matter.matterType !== "general") {
    return next(new AppError("Matter is not a general matter", 400));
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

  // 3. Create general detail with proper Nigerian model structure
  const generalDetail = new GeneralDetail({
    matterId,
    firmId: req.firmId,
    createdBy: req.user._id,

    // Service type and description
    serviceType: generalData.serviceType,
    otherServiceType: generalData.otherServiceType,
    serviceDescription: generalData.serviceDescription,

    // Billing structure (Nigerian model)
    billing: {
      billingType: generalData.billing?.billingType || "fixed-fee",
      fixedFee: generalData.billing?.fixedFee,
      lproScale: generalData.billing?.lproScale,
      percentage: generalData.billing?.percentage,
      vatRate: generalData.billing?.vatRate || 7.5,
      applyVAT: generalData.billing?.applyVAT !== false,
      applyWHT: generalData.billing?.applyWHT !== false,
      whtRate: generalData.billing?.whtRate || 5,
    },

    // Project stages (Nigerian billing pattern)
    projectStages: generalData.projectStages || [],

    // Requirements tracking
    specificRequirements: generalData.specificRequirements || [],

    // Parties involved
    partiesInvolved: generalData.partiesInvolved || [],

    // Deliverables
    expectedDeliverables: generalData.expectedDeliverables || [],

    // Document tracking
    documentsReceived: generalData.documentsReceived || [],

    // Disbursements (out-of-pockets)
    disbursements: generalData.disbursements || [],

    // Court appearances (if litigation)
    courtAppearances: generalData.courtAppearances || [],

    // NBA stamp compliance
    requiresNBAStamp: generalData.requiresNBAStamp || false,
    nbaStampDetails: generalData.nbaStampDetails,

    // Timeline
    requestDate: generalData.requestDate || new Date(),
    expectedCompletionDate: generalData.expectedCompletionDate,

    // Jurisdiction (Nigerian context)
    jurisdiction: generalData.jurisdiction || {},

    // Notes
    procedureNotes: generalData.procedureNotes,
  });

  await generalDetail.save();

  // 4. Update matter to link general detail
  matter.generalDetail = generalDetail._id;
  if (generalDetail.expectedCompletionDate) {
    matter.expectedClosureDate = generalDetail.expectedCompletionDate;
  }
  await matter.save();

  // 5. Populate and return
  const populatedDetail = await GeneralDetail.findById(
    generalDetail._id,
  ).populate({
    path: "matterId",
    select: "matterNumber title client accountOfficer status priority",
    populate: [
      { path: "client", select: "firstName lastName email phone" },
      { path: "accountOfficer", select: "firstName lastName email photo" },
    ],
  });

  // Add calculated totals
  const enrichedDetail = populatedDetail.toObject();
  enrichedDetail.financialSummary = populatedDetail.totalWithTax;

  res.status(201).json({
    status: "success",
    data: {
      generalDetail: enrichedDetail,
    },
  });
});

exports.getGeneralDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const generalDetail = await GeneralDetail.findOne({
    matterId,
    firmId: req.firmId,
  })
    .populate({
      path: "matterId",
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

  // Add financial summary
  const enrichedDetail = generalDetail.toObject();
  enrichedDetail.financialSummary = generalDetail.totalWithTax;

  res.status(200).json({
    status: "success",
    data: {
      generalDetail: enrichedDetail,
    },
  });
});

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
    path: "matterId",
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
          status: requirementData.status || "pending",
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

  const setObject = { lastModifiedBy: req.user._id };

  Object.keys(updateData).forEach((key) => {
    setObject[`specificRequirements.$.${key}`] = updateData[key];
  });

  setObject["specificRequirements.$.updatedBy"] = req.user._id;
  setObject["specificRequirements.$.updatedAt"] = new Date();

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "specificRequirements._id": requirementId,
    },
    { $set: setObject },
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

  const setObject = { lastModifiedBy: req.user._id };

  Object.keys(updateData).forEach((key) => {
    setObject[`partiesInvolved.$.${key}`] = updateData[key];
  });

  setObject["partiesInvolved.$.updatedBy"] = req.user._id;
  setObject["partiesInvolved.$.updatedAt"] = new Date();

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "partiesInvolved._id": partyId,
    },
    { $set: setObject },
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
          status: deliverableData.status || "pending",
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

  const setObject = { lastModifiedBy: req.user._id };

  Object.keys(updateData).forEach((key) => {
    setObject[`expectedDeliverables.$.${key}`] = updateData[key];
  });

  setObject["expectedDeliverables.$.updatedBy"] = req.user._id;
  setObject["expectedDeliverables.$.updatedAt"] = new Date();

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "expectedDeliverables._id": deliverableId,
    },
    { $set: setObject },
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
// DOCUMENTS MANAGEMENT (UPDATED FOR NEW SCHEMA)
// ============================================

exports.addDocument = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const documentData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        documentsReceived: {
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
        generalDetail.documentsReceived[
          generalDetail.documentsReceived.length - 1
        ],
    },
  });
});

exports.updateDocumentStatus = catchAsync(async (req, res, next) => {
  const { matterId, documentId } = req.params;
  const { isReceived, receivedDate, returnDate, receiptNumber } = req.body;

  const setObject = { lastModifiedBy: req.user._id };

  if (isReceived !== undefined) {
    setObject["documentsReceived.$.isReceived"] = isReceived;
    setObject["documentsReceived.$.receivedDate"] = isReceived
      ? receivedDate || new Date()
      : null;
    setObject["documentsReceived.$.receivedBy"] = isReceived
      ? req.user._id
      : null;
  }

  if (returnDate !== undefined) {
    setObject["documentsReceived.$.returnDate"] = returnDate;
  }

  if (receiptNumber !== undefined) {
    setObject["documentsReceived.$.receiptNumber"] = receiptNumber;
  }

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "documentsReceived._id": documentId,
    },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Document not found", 404));
  }

  const updatedDocument = generalDetail.documentsReceived.id(documentId);

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
      $pull: { documentsReceived: { _id: documentId } },
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
      message: "Document removed successfully",
    },
  });
});

// ============================================
// PROJECT STAGES MANAGEMENT (NEW)
// ============================================

exports.addProjectStage = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const stageData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        projectStages: {
          ...stageData,
          isCompleted: stageData.isCompleted || false,
          isPaid: stageData.isPaid || false,
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
      newStage:
        generalDetail.projectStages[generalDetail.projectStages.length - 1],
    },
  });
});

exports.updateProjectStage = catchAsync(async (req, res, next) => {
  const { matterId, stageId } = req.params;
  const updateData = req.body;

  const setObject = { lastModifiedBy: req.user._id };

  Object.keys(updateData).forEach((key) => {
    setObject[`projectStages.$.${key}`] = updateData[key];
  });

  setObject["projectStages.$.updatedBy"] = req.user._id;
  setObject["projectStages.$.updatedAt"] = new Date();

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "projectStages._id": stageId,
    },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Project stage not found", 404));
  }

  const updatedStage = generalDetail.projectStages.id(stageId);

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      updatedStage,
    },
  });
});

exports.completeProjectStage = catchAsync(async (req, res, next) => {
  const { matterId, stageId } = req.params;
  const { actualDate, amountPaid } = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "projectStages._id": stageId,
    },
    {
      $set: {
        "projectStages.$.isCompleted": true,
        "projectStages.$.actualDate": actualDate || new Date(),
        "projectStages.$.updatedBy": req.user._id,
        "projectStages.$.updatedAt": new Date(),
        lastModifiedBy: req.user._id,
      },
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("Project stage not found", 404));
  }

  const completedStage = generalDetail.projectStages.id(stageId);

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      completedStage,
    },
  });
});

// ============================================
// DISBURSEMENTS MANAGEMENT
// ============================================

exports.addDisbursement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const disbursementData = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        disbursements: {
          ...disbursementData,
          incurredDate: disbursementData.incurredDate || new Date(),
          addedBy: req.user._id,
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
      newDisbursement:
        generalDetail.disbursements[generalDetail.disbursements.length - 1],
    },
  });
});

exports.updateDisbursement = catchAsync(async (req, res, next) => {
  const { matterId, disbursementId } = req.params;
  const updateData = req.body;

  const setObject = { lastModifiedBy: req.user._id };

  Object.keys(updateData).forEach((key) => {
    setObject[`disbursements.$.${key}`] = updateData[key];
  });

  setObject["disbursements.$.updatedBy"] = req.user._id;
  setObject["disbursements.$.updatedAt"] = new Date();

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "disbursements._id": disbursementId,
    },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!generalDetail) {
    return next(new AppError("Disbursement not found", 404));
  }

  const updatedDisbursement = generalDetail.disbursements.id(disbursementId);

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      updatedDisbursement,
    },
  });
});

exports.deleteDisbursement = catchAsync(async (req, res, next) => {
  const { matterId, disbursementId } = req.params;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { disbursements: { _id: disbursementId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!generalDetail) {
    return next(new AppError("General details or disbursement not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      generalDetail,
      message: "Disbursement removed successfully",
    },
  });
});

// ============================================
// NBA STAMP MANAGEMENT
// ============================================

exports.updateNBAStamp = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { stampNumber, stampDate, stampValue } = req.body;

  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      requiresNBAStamp: true,
      nbaStampDetails: {
        stampNumber,
        stampDate: stampDate || new Date(),
        stampValue,
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
      nbaStampDetails: generalDetail.nbaStampDetails,
    },
  });
});

// ============================================
// SERVICE COMPLETION
// ============================================

exports.completeGeneralService = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { completionDate, finalNotes } = req.body;

  // ✅ FIX: First, fetch the existing general detail
  const existingGeneralDetail = await GeneralDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!existingGeneralDetail) {
    return next(new AppError("General details not found", 404));
  }

  // ✅ FIX: Now build the update object with the existing data
  const updateData = {
    actualCompletionDate: completionDate || new Date(),
    lastModifiedBy: req.user._id,
  };

  // Only update procedureNotes if finalNotes is provided
  if (finalNotes) {
    updateData.procedureNotes = existingGeneralDetail.procedureNotes
      ? `${existingGeneralDetail.procedureNotes}\n\n${finalNotes}`
      : finalNotes;
  }

  // ✅ FIX: Update general detail with the prepared data
  const generalDetail = await GeneralDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    updateData,
    { new: true, runValidators: true },
  ).populate("matterId");

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
      actualClosureDate: generalDetail.actualCompletionDate,
      lastModifiedBy: req.user._id,
      lastActivityDate: new Date(),
    },
    { new: true, runValidators: true },
  );

  if (!matter) {
    return next(new AppError("General matter not found", 404));
  }

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
    revenueStats,
    jurisdictionStats,
    recentMatters,
  ] = await Promise.all([
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
          closedGeneralMatters: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
        },
      },
    ]),

    GeneralDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
          avgFee: { $avg: "$billing.fixedFee.amount" },
        },
      },
      { $sort: { count: -1 } },
    ]),

    GeneralDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$specificRequirements" },
      {
        $group: {
          _id: "$specificRequirements.status",
          count: { $sum: 1 },
        },
      },
    ]),

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

    GeneralDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$documentsReceived" },
      {
        $group: {
          _id: "$documentsReceived.isReceived",
          count: { $sum: 1 },
          originalKeptCount: {
            $sum: {
              $cond: [
                { $eq: ["$documentsReceived.originalKeptByFirm", true] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    GeneralDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$billing.fixedFee.amount" },
          avgRevenue: { $avg: "$billing.fixedFee.amount" },
          totalDisbursements: { $sum: "$totalDisbursements" },
          matterCount: { $sum: 1 },
        },
      },
    ]),

    GeneralDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: "$jurisdiction.state",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "general",
        },
      },
      { $sort: { dateOpened: -1 } },
      { $limit: 10 },
      {
        $project: {
          matterNumber: 1,
          title: 1,
          status: 1,
          dateOpened: 1,
          expectedClosureDate: 1,
          client: 1,
        },
      },
    ]),
  ]);

  const pendingRequirements = requirementStats.find((s) => s._id === "pending");
  const pendingDeliverables = deliverableStats.find(
    (s) => s._id === "pending" || s._id === "in-progress",
  );
  const missingDocuments = documentStats.find((s) => !s._id);

  res.status(200).json({
    status: "success",
    data: {
      overview: overviewStats[0] || {
        totalGeneralMatters: 0,
        activeGeneralMatters: 0,
        pendingGeneralMatters: 0,
        completedGeneralMatters: 0,
        closedGeneralMatters: 0,
      },
      byServiceType,
      requirements: {
        byStatus: requirementStats,
        pending: pendingRequirements?.count || 0,
        completed: requirementStats.find((s) => s._id === "met")?.count || 0,
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
        received: documentStats.find((s) => s._id)?.count || 0,
        missing: missingDocuments?.count || 0,
        originalKept: documentStats.reduce(
          (sum, stat) => sum + (stat.originalKeptCount || 0),
          0,
        ),
      },
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        avgRevenue: 0,
        totalDisbursements: 0,
        matterCount: 0,
      },
      jurisdictions: jurisdictionStats,
      recentMatters,
    },
  });
});

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

// ============================================
// GENERAL MATTER REPORT PDF GENERATION
// ============================================

/**
 * @desc    Generate general matter report PDF
 * @route   GET /api/general-matters/:matterId/report
 * @access  Private
 */
exports.generateGeneralReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "general",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No general matter found with that ID", 404));
  }

  const generalDetails = await GeneralDetail.findOne({ matterId, firmId });
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "General Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
  });

  pdf.init(res, path.resolve(__dirname, `../output/${matter.matterNumber}_general_report_${Date.now()}.pdf`));

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

  // General Details
  if (generalDetails) {
    if (generalDetails.matterDescription) {
      pdf.addSection("Matter Description");
      pdf.addField("Description", generalDetails.matterDescription);
    }

    if (generalDetails.keyParties?.length > 0) {
      pdf.addSection("Key Parties");
      generalDetails.keyParties.forEach(party => {
        pdf.addField(party.role || "Party", party.name);
        if (party.contact) pdf.addField("Contact", party.contact);
      });
    }

    if (generalDetails.documents?.length > 0) {
      pdf.addSection("Documents");
      generalDetails.documents.forEach(doc => {
        pdf.addField(doc.documentType || "Document", doc.status?.toUpperCase() || "N/A");
      });
    }
  }

  await pdf.generate();
});

module.exports = exports;
