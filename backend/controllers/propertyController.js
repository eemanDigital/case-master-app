const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const PropertyDetail = require("../models/propertyDetailModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { GenericPdfGenerator, getStatusColor, getStatusBg, formatCurrency, formatDate } = require("../utils/generateGenericPdf");
const path = require("path");

// Initialize pagination services
const matterPaginationService = PaginationServiceFactory.createService(
  Matter,
  modelConfigs.Matter,
);

const propertyDetailPaginationService = PaginationServiceFactory.createService(
  PropertyDetail,
  modelConfigs.PropertyDetail,
);

// ============================================
// PROPERTY MATTERS LISTING & PAGINATION
// ============================================

exports.getAllPropertyMatters = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    sort = "-dateOpened",
    populate,
    select,
    debug,
    includeStats,
    transactionType,
    state,
    propertyType,
    status,
    search,
    includeDeleted,
    onlyDeleted,
  } = req.query;

  const customFilter = { matterType: "property" };

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
      transactionType,
      state,
      propertyType,
    },
    customFilter,
    req.firmId,
  );

  if (
    result.data.length > 0 &&
    (!populate || !populate.includes("propertyDetail"))
  ) {
    const matterIds = result.data.map((matter) => matter._id);
    const propertyDetails = await PropertyDetail.find({
      matterId: { $in: matterIds },
      firmId: req.firmId,
    }).lean();

    const detailsMap = propertyDetails.reduce((map, detail) => {
      map[detail.matterId.toString()] = detail;
      return map;
    }, {});

    result.data = result.data.map((matter) => ({
      ...matter,
      propertyDetail: detailsMap[matter._id.toString()] || null,
    }));
  }

  res.status(200).json({ status: "success", ...result });
});

// ============================================
// ADVANCED PROPERTY SEARCH
// ============================================

exports.searchPropertyMatters = catchAsync(async (req, res, next) => {
  const { criteria = {}, options = {} } = req.body;

  const firmCriteria = {
    ...criteria,
    firmId: req.firmId,
    matterType: "property",
  };

  const result = await matterPaginationService.advancedSearch(
    firmCriteria,
    options,
    req.firmId,
  );

  res.status(200).json({ status: "success", ...result });
});

// ============================================
// PROPERTY DETAILS MANAGEMENT
// ============================================

exports.createPropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const propertyData = req.body;

  try {
    const matter = await Matter.findOne({
      _id: matterId,
      firmId: req.firmId,
      isDeleted: false,
    });

    if (!matter) {
      return next(new AppError("Matter not found", 404));
    }

    if (matter.matterType !== "property") {
      return next(new AppError("Matter is not a property matter", 400));
    }

    const existingDetail = await PropertyDetail.findOne({
      matterId,
      firmId: req.firmId,
    });

    if (existingDetail) {
      return next(
        new AppError("Property details already exist for this matter", 400),
      );
    }

    const propertyDetail = new PropertyDetail({
      matterId,
      firmId: req.firmId,
      createdBy: req.user._id,
      ...propertyData,
    });

    await propertyDetail.save();

    matter.propertyDetail = propertyDetail._id;
    await matter.save();

    const populatedDetail = await PropertyDetail.findById(
      propertyDetail._id,
    ).populate({
      path: "matterId",
      select: "matterNumber title client accountOfficer status priority",
      populate: [
        { path: "client", select: "firstName lastName email phone" },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    });

    res.status(201).json({
      status: "success",
      data: { propertyDetail: populatedDetail },
    });
  } catch (error) {
    return next(error);
  }
});

exports.getPropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const propertyDetail = await PropertyDetail.findOne({
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

  res.status(200).json({
    status: "success",
    data: { propertyDetail },
  });
});

exports.updatePropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { ...updateData, lastModifiedBy: req.user._id },
    { new: true, runValidators: true },
  ).populate({
    path: "matterId",
    select: "matterNumber title client accountOfficer",
    populate: [
      { path: "client", select: "firstName lastName email" },
      { path: "accountOfficer", select: "firstName lastName email" },
    ],
  });

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail },
  });
});

exports.deletePropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: false },
    { isDeleted: true, deletedAt: Date.now(), deletedBy: req.user._id },
    { new: true },
  );

  if (!propertyDetail) {
    return next(
      new AppError("Property details not found or already deleted", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: null,
    message: "Property details deleted successfully",
  });
});

exports.restorePropertyDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: true },
    { isDeleted: false, deletedAt: null, deletedBy: null },
    { new: true },
  );

  if (!propertyDetail) {
    return next(
      new AppError("No deleted property details found to restore", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail },
  });
});

// ============================================
// PROPERTIES MANAGEMENT
// ============================================

exports.addProperty = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const propertyData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        properties: {
          ...propertyData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
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
      newProperty:
        propertyDetail.properties[propertyDetail.properties.length - 1],
    },
  });
});

exports.updateProperty = catchAsync(async (req, res, next) => {
  const { matterId, propertyId } = req.params;
  const propertyData = req.body;

  const setObject = { lastModifiedBy: req.user._id };
  Object.keys(propertyData).forEach((key) => {
    setObject[`properties.$.${key}`] = propertyData[key];
  });
  setObject["properties.$.updatedBy"] = req.user._id;
  setObject["properties.$.updatedAt"] = new Date();

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, "properties._id": propertyId },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
      updatedProperty: propertyDetail.properties.id(propertyId),
    },
  });
});

exports.removeProperty = catchAsync(async (req, res, next) => {
  const { matterId, propertyId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { properties: { _id: propertyId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail, message: "Property removed successfully" },
  });
});

// ============================================
// PAYMENT SCHEDULE MANAGEMENT
// ============================================

exports.addPayment = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const paymentData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        paymentSchedule: {
          ...paymentData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
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
      newPayment:
        propertyDetail.paymentSchedule[
          propertyDetail.paymentSchedule.length - 1
        ],
    },
  });
});

exports.updatePayment = catchAsync(async (req, res, next) => {
  const { matterId, installmentId } = req.params;
  const updateData = req.body;

  const setObject = { lastModifiedBy: req.user._id };
  Object.keys(updateData).forEach((key) => {
    setObject[`paymentSchedule.$.${key}`] = updateData[key];
  });
  setObject["paymentSchedule.$.updatedBy"] = req.user._id;
  setObject["paymentSchedule.$.updatedAt"] = new Date();

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, "paymentSchedule._id": installmentId },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Payment installment not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
      updatedPayment: propertyDetail.paymentSchedule.id(installmentId),
    },
  });
});

exports.deletePayment = catchAsync(async (req, res, next) => {
  const { matterId, installmentId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { paymentSchedule: { _id: installmentId } },
      lastModifiedBy: req.user._id,
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
      message: "Payment installment removed successfully",
    },
  });
});

// ============================================
// LEGAL PROCESSES
// ============================================

// ✅ ADDED - was missing entirely, causing the crash
exports.updateTitleSearch = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const titleSearchData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        titleSearch: {
          ...titleSearchData,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail },
  });
});

exports.updateGovernorsConsent = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const consentData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        governorsConsent: {
          ...consentData,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail },
  });
});

exports.updateContractOfSale = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const contractData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        contractOfSale: {
          ...contractData,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail },
  });
});

// ✅ FIXED - removed duplicate, kept single clean definition
exports.updateLeaseAgreement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const leaseData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        leaseAgreement: {
          ...leaseData,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail },
  });
});

exports.recordPhysicalInspection = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const inspectionData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        physicalInspection: {
          ...inspectionData,
          inspectedBy: req.user._id,
          inspectionDate: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail },
  });
});

// ============================================
// LEASE TRACKING & EXPIRATION MANAGEMENT
// ============================================

exports.getExpiringLeases = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 50, urgency, daysThreshold, status } = req.query;

  const firmQuery = {
    firmId: req.firmId,
    isDeleted: false,
    $or: [
      { transactionType: "lease" },
      { transactionType: "sublease" },
      { transactionType: "tenancy_matter" },
    ],
  };

  const now = new Date();
  let dateFilter = {};

  if (daysThreshold) {
    const thresholdDate = new Date(
      now.getTime() + daysThreshold * 24 * 60 * 60 * 1000,
    );
    dateFilter = {
      "leaseAgreement.expiryDate": { $gte: now, $lte: thresholdDate },
    };
  } else if (urgency) {
    switch (urgency) {
      case "critical":
        dateFilter = {
          "leaseAgreement.expiryDate": {
            $gte: now,
            $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "warning":
        dateFilter = {
          "leaseAgreement.expiryDate": {
            $gte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "notice":
        dateFilter = {
          "leaseAgreement.expiryDate": {
            $gte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            $lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      default:
        dateFilter = {
          "leaseAgreement.expiryDate": {
            $gte: now,
            $lte: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          },
        };
    }
  }

  if (status) firmQuery["leaseAgreement.status"] = status;

  const skip = (page - 1) * limit;

  const propertyDetails = await PropertyDetail.find({
    ...firmQuery,
    ...dateFilter,
  })
    .populate({
      path: "matterId",
      select:
        "matterNumber title client accountOfficer status priority dateOpened",
      match: { isDeleted: false },
      populate: [
        { path: "client", select: "firstName lastName email phone" },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    })
    .sort({ "leaseAgreement.expiryDate": 1 })
    .skip(skip)
    .limit(Number(limit));

  const filteredDetails = propertyDetails.filter((detail) => detail.matterId);

  const enrichedDetails = filteredDetails.map((detail) => {
    const expiryDate = new Date(detail.leaseAgreement?.expiryDate);
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    const weeksRemaining = Math.floor(daysRemaining / 7);
    const monthsRemaining = Math.floor(daysRemaining / 30);

    let urgencyLevel = "safe";
    if (daysRemaining <= 0) urgencyLevel = "expired";
    else if (daysRemaining <= 7) urgencyLevel = "critical";
    else if (daysRemaining <= 30) urgencyLevel = "warning";
    else if (daysRemaining <= 90) urgencyLevel = "notice";

    return {
      ...detail.toObject(),
      leaseCountdown: {
        days: daysRemaining,
        weeks: weeksRemaining,
        months: monthsRemaining,
        urgency: urgencyLevel,
      },
    };
  });

  const total = await PropertyDetail.countDocuments({
    ...firmQuery,
    ...dateFilter,
  });

  res.status(200).json({
    status: "success",
    results: enrichedDetails.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: { leases: enrichedDetails },
  });
});

exports.getLeaseStats = catchAsync(async (req, res, next) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const firmQuery = {
    firmId: req.firmId,
    isDeleted: false,
    "leaseAgreement.expiryDate": { $exists: true },
  };

  const [
    totalLeases,
    activeLeases,
    expiringIn7Days,
    expiringIn30Days,
    expiringIn60Days,
    expiringIn90Days,
    expiredLeases,
    renewalInProgress,
  ] = await Promise.all([
    PropertyDetail.countDocuments({
      ...firmQuery,
      $or: [
        { transactionType: "lease" },
        { transactionType: "sublease" },
        { transactionType: "tenancy_matter" },
      ],
    }),
    PropertyDetail.countDocuments({
      ...firmQuery,
      "leaseAgreement.status": "active",
    }),
    PropertyDetail.countDocuments({
      ...firmQuery,
      "leaseAgreement.expiryDate": {
        $gte: now,
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    PropertyDetail.countDocuments({
      ...firmQuery,
      "leaseAgreement.expiryDate": { $gte: now, $lte: thirtyDaysFromNow },
    }),
    PropertyDetail.countDocuments({
      ...firmQuery,
      "leaseAgreement.expiryDate": {
        $gte: thirtyDaysFromNow,
        $lte: sixtyDaysFromNow,
      },
    }),
    PropertyDetail.countDocuments({
      ...firmQuery,
      "leaseAgreement.expiryDate": {
        $gte: sixtyDaysFromNow,
        $lte: ninetyDaysFromNow,
      },
    }),
    PropertyDetail.countDocuments({
      ...firmQuery,
      "leaseAgreement.expiryDate": { $lt: now },
    }),
    PropertyDetail.countDocuments({
      firmId: req.firmId,
      isDeleted: false,
      "renewalTracking.renewalStatus": "in-progress",
    }),
  ]);

  const totalRentValue = await PropertyDetail.aggregate([
    {
      $match: {
        firmId: req.firmId,
        isDeleted: false,
        "leaseAgreement.status": "active",
      },
    },
    {
      $group: {
        _id: null,
        totalMonthlyRent: {
          $sum: {
            $cond: [
              { $eq: ["$rentAmount.frequency", "monthly"] },
              "$rentAmount.amount",
              {
                $cond: [
                  { $eq: ["$rentAmount.frequency", "annually"] },
                  { $divide: ["$rentAmount.amount", 12] },
                  {
                    $cond: [
                      { $eq: ["$rentAmount.frequency", "quarterly"] },
                      { $divide: ["$rentAmount.amount", 3] },
                      "$rentAmount.amount",
                    ],
                  },
                ],
              },
            ],
          },
        },
        totalAnnualRent: {
          $sum: {
            $cond: [
              { $eq: ["$rentAmount.frequency", "annually"] },
              "$rentAmount.amount",
              {
                $cond: [
                  { $eq: ["$rentAmount.frequency", "monthly"] },
                  { $multiply: ["$rentAmount.amount", 12] },
                  {
                    $cond: [
                      { $eq: ["$rentAmount.frequency", "quarterly"] },
                      { $multiply: ["$rentAmount.amount", 4] },
                      "$rentAmount.amount",
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      overview: { totalLeases, activeLeases, expiredLeases, renewalInProgress },
      expirationAlerts: {
        expiringIn7Days,
        expiringIn30Days,
        expiringIn60Days,
        expiringIn90Days,
      },
      financialSummary: totalRentValue[0] || {
        totalMonthlyRent: 0,
        totalAnnualRent: 0,
      },
    },
  });
});

exports.updateLeaseAlertSettings = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const alertSettings = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $set: {
        leaseAlertSettings: {
          ...alertSettings,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({ status: "success", data: { propertyDetail } });
});

exports.addLeaseMilestone = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const milestoneData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: { leaseMilestones: { ...milestoneData, createdAt: new Date() } },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(201).json({
    status: "success",
    data: {
      propertyDetail,
      newMilestone:
        propertyDetail.leaseMilestones[
          propertyDetail.leaseMilestones.length - 1
        ],
    },
  });
});

exports.updateLeaseMilestone = catchAsync(async (req, res, next) => {
  const { matterId, milestoneId } = req.params;
  const updateData = req.body;

  const setObject = { lastModifiedBy: req.user._id };
  Object.keys(updateData).forEach((key) => {
    setObject[`leaseMilestones.$.${key}`] = updateData[key];
  });

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, "leaseMilestones._id": milestoneId },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Lease milestone not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
      updatedMilestone: propertyDetail.leaseMilestones.id(milestoneId),
    },
  });
});

exports.deleteLeaseMilestone = catchAsync(async (req, res, next) => {
  const { matterId, milestoneId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { leaseMilestones: { _id: milestoneId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details or milestone not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail, message: "Milestone removed successfully" },
  });
});

// ============================================
// RENEWAL TRACKING
// ============================================

exports.initiateRenewal = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { renewalTerms, rentIncreasePercentage, renewalNoticePeriod } = req.body;
  
  let proposedNewRent = req.body.proposedNewRent;
  if (proposedNewRent && typeof proposedNewRent === "number") {
    proposedNewRent = {
      amount: proposedNewRent,
      currency: "NGN",
    };
  }

  const propertyDetail = await PropertyDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  const leaseExpiryDate = new Date(propertyDetail.leaseAgreement?.expiryDate);
  const renewalDeadline = new Date(leaseExpiryDate);
  const noticePeriod =
    renewalNoticePeriod ||
    propertyDetail.renewalTracking?.renewalNoticePeriod ||
    90;
  renewalDeadline.setDate(renewalDeadline.getDate() - noticePeriod);

  propertyDetail.renewalTracking = {
    renewalInitiated: true,
    renewalInitiatedDate: new Date(),
    renewalDeadline,
    renewalNoticePeriod: noticePeriod,
    proposedNewRent: proposedNewRent || null,
    rentIncreasePercentage: rentIncreasePercentage || 0,
    renewalTerms: renewalTerms || "",
    renewalStatus: "in-progress",
  };

  propertyDetail.lastModifiedBy = req.user._id;
  await propertyDetail.save();

  res.status(200).json({ status: "success", data: { propertyDetail } });
});

exports.updateRenewalTracking = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updateData = req.body;

  const setObject = { lastModifiedBy: req.user._id };
  Object.keys(updateData).forEach((key) => {
    setObject[`renewalTracking.${key}`] = updateData[key];
  });

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({ status: "success", data: { propertyDetail } });
});

exports.addNegotiation = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const negotiationData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        "renewalTracking.negotiationsHistory": {
          ...negotiationData,
          proposedDate: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details not found", 404));
  }

  res.status(200).json({ status: "success", data: { propertyDetail } });
});

// ============================================
// CONDITIONS MANAGEMENT
// ============================================

exports.addCondition = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const conditionData = req.body;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $push: {
        conditions: {
          ...conditionData,
          addedBy: req.user._id,
          addedAt: new Date(),
        },
      },
      lastModifiedBy: req.user._id,
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
      newCondition:
        propertyDetail.conditions[propertyDetail.conditions.length - 1],
    },
  });
});

exports.updateCondition = catchAsync(async (req, res, next) => {
  const { matterId, conditionId } = req.params;
  const updateData = req.body;

  const setObject = { lastModifiedBy: req.user._id };
  Object.keys(updateData).forEach((key) => {
    setObject[`conditions.$.${key}`] = updateData[key];
  });
  setObject["conditions.$.updatedBy"] = req.user._id;
  setObject["conditions.$.updatedAt"] = new Date();

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, "conditions._id": conditionId },
    { $set: setObject },
    { new: true, runValidators: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Condition not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      propertyDetail,
      updatedCondition: propertyDetail.conditions.id(conditionId),
    },
  });
});

exports.deleteCondition = catchAsync(async (req, res, next) => {
  const { matterId, conditionId } = req.params;

  const propertyDetail = await PropertyDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      $pull: { conditions: { _id: conditionId } },
      lastModifiedBy: req.user._id,
    },
    { new: true },
  );

  if (!propertyDetail) {
    return next(new AppError("Property details or condition not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { propertyDetail, message: "Condition removed successfully" },
  });
});

// ============================================
// TRANSACTION COMPLETION
// ============================================

exports.recordCompletion = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { completionDate, registrationNumber } = req.body;

  const session = await Matter.startSession();
  session.startTransaction();

  try {
    const matter = await Matter.findOneAndUpdate(
      {
        _id: matterId,
        firmId: req.firmId,
        matterType: "property",
        isDeleted: false,
      },
      {
        status: "completed",
        actualClosureDate: completionDate,
        lastModifiedBy: req.user._id,
      },
      { new: true, runValidators: true, session },
    );

    if (!matter) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Property matter not found", 404));
    }

    const propertyDetail = await PropertyDetail.findOneAndUpdate(
      { matterId, firmId: req.firmId },
      {
        $set: {
          deedOfAssignment: {
            status: "registered",
            registrationDate: completionDate,
            registrationNumber,
            updatedBy: req.user._id,
            updatedAt: new Date(),
          },
        },
        lastModifiedBy: req.user._id,
      },
      { new: true, runValidators: true, session },
    );

    if (!propertyDetail) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Property details not found", 404));
    }

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({ status: "success", data: { matter, propertyDetail } });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

// ============================================
// STATISTICS & DASHBOARD
// ============================================

exports.getPropertyStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  const [
    overviewStats,
    typeStats,
    stateStats,
    pendingConsents,
    overduePayments,
    recentTransactions,
  ] = await Promise.all([
    Matter.aggregate([
      { $match: { ...firmQuery, matterType: "property" } },
      {
        $group: {
          _id: null,
          totalPropertyMatters: { $sum: 1 },
          activePropertyMatters: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          pendingPropertyMatters: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedPropertyMatters: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),
    PropertyDetail.aggregate([
      { $match: firmQuery },
      {
        $group: {
          _id: "$transactionType",
          count: { $sum: 1 },
          totalValue: { $sum: "$purchasePrice.amount" },
          avgValue: { $avg: "$purchasePrice.amount" },
        },
      },
      { $sort: { count: -1 } },
    ]),
    PropertyDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$properties" },
      {
        $group: {
          _id: "$properties.state",
          count: { $sum: 1 },
          avgPrice: { $avg: "$purchasePrice.amount" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    PropertyDetail.countDocuments({
      ...firmQuery,
      "governorsConsent.status": "pending",
    }),
    PropertyDetail.aggregate([
      { $match: firmQuery },
      { $unwind: "$paymentSchedule" },
      {
        $match: {
          "paymentSchedule.status": "pending",
          "paymentSchedule.dueDate": { $lt: new Date() },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: "$paymentSchedule.amount" },
        },
      },
    ]),
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "property",
          dateOpened: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateOpened" } },
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
        totalPropertyMatters: 0,
        activePropertyMatters: 0,
        pendingPropertyMatters: 0,
        completedPropertyMatters: 0,
      },
      byType: typeStats,
      byState: stateStats,
      pendingConsents: pendingConsents || 0,
      overduePayments: overduePayments[0] || { count: 0, totalAmount: 0 },
      recentTransactions,
    },
  });
});

exports.getPendingConsents = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const propertyDetails = await PropertyDetail.find({
    firmId: req.firmId,
    isDeleted: false,
    "governorsConsent.status": "pending",
  })
    .populate({
      path: "matterId",
      select:
        "matterNumber title client accountOfficer status priority dateOpened",
      match: { isDeleted: false },
      populate: [
        { path: "client", select: "firstName lastName email phone" },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    })
    .sort({ "governorsConsent.applicationDate": 1 })
    .skip(skip)
    .limit(Number(limit));

  const filteredDetails = propertyDetails.filter((detail) => detail.matterId);

  const total = await PropertyDetail.countDocuments({
    firmId: req.firmId,
    isDeleted: false,
    "governorsConsent.status": "pending",
  });

  res.status(200).json({
    status: "success",
    results: filteredDetails.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: { matters: filteredDetails },
  });
});

// ============================================
// BULK OPERATIONS
// ============================================

exports.bulkUpdatePropertyMatters = catchAsync(async (req, res, next) => {
  const { matterIds, updates } = req.body;

  if (!matterIds || !Array.isArray(matterIds) || matterIds.length === 0) {
    return next(new AppError("Please provide matter IDs to update", 400));
  }

  if (!updates || Object.keys(updates).length === 0) {
    return next(new AppError("Please provide updates to apply", 400));
  }

  const result = await Matter.updateMany(
    { _id: { $in: matterIds }, firmId: req.firmId, matterType: "property" },
    { ...updates, lastModifiedBy: req.user._id, lastActivityDate: Date.now() },
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
// PROPERTY REPORT PDF GENERATION
// ============================================

exports.generatePropertyReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "property",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone address")
    .populate("assignedTo", "firstName lastName email")
    .populate("createdBy", "firstName lastName");

  if (!matter) {
    return next(new AppError("No property matter found with that ID", 404));
  }

  const propertyDetails = await PropertyDetail.findOne({ matterId });
  const firm = await Firm.findById(firmId);

  const amountPaid = propertyDetails?.paymentSchedule
    ?.filter((p) => p.status === "paid")
    ?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const purchasePriceAmt = propertyDetails?.purchasePrice?.amount || 0;
  const rentAmountAmt = propertyDetails?.rentAmount?.amount || 0;
  const totalAmount = purchasePriceAmt || rentAmountAmt || 0;

  const pdf = new GenericPdfGenerator({
    title: "Property Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
  });

  pdf.init(res, path.resolve(__dirname, `../output/${matter.matterNumber}_property_report_${Date.now()}.pdf`));

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
  if (matter?.client?.email) pdf.addField("Client Email", matter.client.email);
  if (matter?.assignedTo) pdf.addField("Assigned To", `${matter.assignedTo.firstName} ${matter.assignedTo.lastName}`);

  // Transaction Details
  pdf.addSection("Transaction Details");
  pdf.addField("Transaction Type", propertyDetails?.transactionType?.replace(/_/g, " ").toUpperCase());
  pdf.addField("Payment Terms", propertyDetails?.paymentTerms?.replace(/-/g, " ").toUpperCase());

  // Financial Information
  pdf.addSection("Financial Information");
  if (propertyDetails?.purchasePrice?.amount) pdf.addMoneyField("Purchase Price", propertyDetails.purchasePrice.amount);
  if (propertyDetails?.rentAmount?.amount) pdf.addMoneyField("Rent Amount", propertyDetails.rentAmount.amount);
  if (propertyDetails?.securityDeposit?.amount) pdf.addMoneyField("Security Deposit", propertyDetails.securityDeposit.amount);
  pdf.addMoneyField("Amount Paid", amountPaid);
  pdf.addMoneyField("Balance", totalAmount - amountPaid);

  // Lease Information
  if (["lease", "sublease", "tenancy_matter"].includes(propertyDetails?.transactionType)) {
    const lease = propertyDetails?.leaseAgreement || {};

    pdf.addSection("Lease Agreement");
    pdf.addStatusField("Lease Status", lease?.status);
    pdf.addField("Commencement Date", formatDate(lease?.commencementDate));
    pdf.addField("Expiry Date", formatDate(lease?.expiryDate));
    if (lease?.duration) {
      pdf.addField("Duration", `${lease.duration.years || 0} years, ${lease.duration.months || 0} months`);
    }
    pdf.addField("Renewal Option", lease?.renewalOption ? "Yes" : "No");

    if (lease?.expiryDate) {
      const daysRemaining = Math.ceil((new Date(lease.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      let timeText, timeColor;
      if (daysRemaining < 0) {
        timeText = `Expired ${Math.abs(daysRemaining)} days ago`;
        timeColor = getStatusColor("expired");
      } else if (daysRemaining <= 7) {
        timeText = `${daysRemaining} days - CRITICAL`;
        timeColor = getStatusColor("critical");
      } else if (daysRemaining <= 30) {
        timeText = `${daysRemaining} days - WARNING`;
        timeColor = getStatusColor("warning");
      } else {
        timeText = `${daysRemaining} days remaining`;
        timeColor = getStatusColor("active");
      }
      pdf.addField("Time Remaining", timeText, { color: timeColor, bold: true });
    }

    // Alert Settings
    if (propertyDetails?.leaseAlertSettings?.enabled) {
      pdf.addSection("Alert Settings");
      pdf.addField("Alerts Enabled", "Yes");
      pdf.addField("Email Notifications", propertyDetails.leaseAlertSettings.emailNotification ? "Yes" : "No");
      pdf.addField("SMS Notifications", propertyDetails.leaseAlertSettings.smsNotification ? "Yes" : "No");
      pdf.addField("Notify Landlord", propertyDetails.leaseAlertSettings.notifyLandlord ? "Yes" : "No");
      pdf.addField("Notify Tenant", propertyDetails.leaseAlertSettings.notifyTenant ? "Yes" : "No");
    }

    // Renewal Tracking
    if (propertyDetails?.renewalTracking?.renewalInitiated) {
      pdf.addSection("Renewal Tracking");
      pdf.addStatusField("Renewal Status", propertyDetails.renewalTracking.renewalStatus);
      pdf.addField("Initiated Date", formatDate(propertyDetails.renewalTracking.renewalInitiatedDate));
      pdf.addField("Renewal Deadline", formatDate(propertyDetails.renewalTracking.renewalDeadline));
      pdf.addField("Notice Period", propertyDetails.renewalTracking.renewalNoticePeriod ? `${propertyDetails.renewalTracking.renewalNoticePeriod} days` : null);
      if (propertyDetails.renewalTracking.proposedNewRent?.amount) {
        pdf.addMoneyField("Proposed New Rent", propertyDetails.renewalTracking.proposedNewRent.amount);
      }
      if (propertyDetails.renewalTracking.rentIncreasePercentage) {
        pdf.addField("Proposed Increase", `+${propertyDetails.renewalTracking.rentIncreasePercentage}%`);
      }
      pdf.addField("Negotiations", `${propertyDetails.renewalTracking.negotiationsHistory?.length || 0} recorded`);
    }

    // Milestones
    if (propertyDetails?.leaseMilestones?.length > 0) {
      pdf.addSection("Lease Milestones");
      const completed = propertyDetails.leaseMilestones.filter(m => m.status === "completed").length;
      pdf.addField("Progress", `${completed}/${propertyDetails.leaseMilestones.length} completed`);

      propertyDetails.leaseMilestones.forEach(milestone => {
        pdf.addField(
          milestone.title,
          `${milestone.status?.toUpperCase() || "PENDING"} | Target: ${formatDate(milestone.targetDate) || "N/A"}`,
          { color: getStatusColor(milestone.status) }
        );
      });
    }
  }

  // Parties Involved
  pdf.addSection("Parties Involved");
  if (propertyDetails?.landlord?.name) {
    pdf.addSubSection("Landlord");
    pdf.addField("Name", propertyDetails.landlord.name);
    if (propertyDetails.landlord.contact) pdf.addField("Contact", propertyDetails.landlord.contact);
    if (propertyDetails.landlord.email) pdf.addField("Email", propertyDetails.landlord.email);
  }
  if (propertyDetails?.tenant?.name) {
    pdf.addSubSection("Tenant");
    pdf.addField("Name", propertyDetails.tenant.name);
    if (propertyDetails.tenant.contact) pdf.addField("Contact", propertyDetails.tenant.contact);
    if (propertyDetails.tenant.email) pdf.addField("Email", propertyDetails.tenant.email);
  }
  if (propertyDetails?.vendor?.name) {
    pdf.addSubSection("Vendor");
    pdf.addField("Name", propertyDetails.vendor.name);
    if (propertyDetails.vendor.contact) pdf.addField("Contact", propertyDetails.vendor.contact);
  }
  if (propertyDetails?.purchaser?.name) {
    pdf.addSubSection("Purchaser");
    pdf.addField("Name", propertyDetails.purchaser.name);
    if (propertyDetails.purchaser.contact) pdf.addField("Contact", propertyDetails.purchaser.contact);
  }

  // Property Information
  if (propertyDetails?.properties?.length > 0) {
    pdf.addSection("Property Information");
    propertyDetails.properties.forEach((prop, idx) => {
      if (propertyDetails.properties.length > 1) {
        pdf.addSubSection(`Property ${idx + 1}`);
      }
      if (prop?.address) pdf.addField("Address", prop.address);
      pdf.addTwoColumnField("State", prop?.state, "LGA", prop?.lga);
      if (prop?.propertyType) pdf.addField("Property Type", prop.propertyType.replace(/_/g, " ").toUpperCase());
      if (prop?.titleDocument) pdf.addField("Title Document", prop.titleDocument.replace(/_/g, " ").toUpperCase());
      if (prop?.landSize?.value) pdf.addField("Land Size", `${prop.landSize.value.toLocaleString()} ${prop.landSize.unit || ""}`);
    });
  }

  // Legal Status
  pdf.addSection("Legal Status");
  const contract = propertyDetails?.contractOfSale || {};
  pdf.addStatusField("Contract of Sale", contract?.status);
  if (contract?.executionDate) pdf.addField("Contract Date", formatDate(contract.executionDate));

  const govConsent = propertyDetails?.governorsConsent || {};
  pdf.addStatusField("Governor's Consent", govConsent?.status);
  if (govConsent?.applicationDate) pdf.addField("Application Date", formatDate(govConsent.applicationDate));
  if (govConsent?.approvalDate) pdf.addField("Approval Date", formatDate(govConsent.approvalDate));
  if (govConsent?.referenceNumber) pdf.addField("Reference #", govConsent.referenceNumber);

  const deed = propertyDetails?.deedOfAssignment || {};
  pdf.addStatusField("Deed of Assignment", deed?.status);
  if (deed?.executionDate) pdf.addField("Execution Date", formatDate(deed.executionDate));
  if (deed?.registrationDate) pdf.addField("Registration Date", formatDate(deed.registrationDate));
  if (deed?.registrationNumber) pdf.addField("Registration #", deed.registrationNumber);

  // Due Diligence
  pdf.addSection("Due Diligence");
  const titleSearch = propertyDetails?.titleSearch || {};
  pdf.addStatusField("Title Search", titleSearch.isCompleted ? "Completed" : "Pending");
  if (titleSearch?.searchDate) pdf.addField("Search Date", formatDate(titleSearch.searchDate));
  if (titleSearch?.encumbrances?.length > 0) pdf.addField("Encumbrances", titleSearch.encumbrances.join(", "));

  const inspection = propertyDetails?.physicalInspection || {};
  pdf.addStatusField("Physical Inspection", inspection.isCompleted ? "Completed" : "Pending");
  if (inspection?.inspectionDate) pdf.addField("Inspection Date", formatDate(inspection.inspectionDate));

  const survey = propertyDetails?.surveyPlan || {};
  pdf.addStatusField("Survey Plan", survey.isAvailable ? "Available" : "Not Available");
  if (survey?.surveyNumber) pdf.addField("Survey #", survey.surveyNumber);

  // Payment Schedule
  if (propertyDetails?.paymentSchedule?.length > 0) {
    pdf.addSection("Payment Schedule");
    pdf.addTable(
      ["#", "Due Date", "Amount", "Status", "Paid Date"],
      propertyDetails.paymentSchedule.map(p => [
        `#${p.installmentNumber || "?"}`,
        formatDate(p.dueDate) || "-",
        formatCurrency(p.amount || 0),
        (p.status || "pending").toUpperCase(),
        formatDate(p.paidDate) || "-"
      ]),
      { colWidths: [30, 80, 90, 70, 80] }
    );
  }

  // Conditions
  if (propertyDetails?.conditions?.length > 0) {
    pdf.addSection("Conditions");
    propertyDetails.conditions.forEach(c => {
      pdf.addField(c.condition, `${c.status?.toUpperCase() || "PENDING"} | Due: ${formatDate(c.dueDate) || "N/A"}`, { color: getStatusColor(c.status) });
    });
  }

  await pdf.generate();
});

module.exports = exports;
