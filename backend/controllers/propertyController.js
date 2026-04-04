const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const modelConfigs = require("../config/modelConfigs");
const Matter = require("../models/matterModel");
const PropertyDetail = require("../models/propertyDetailModel");
const Firm = require("../models/firmModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generatePdf } = require("../utils/generatePdf");
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

  const purchasePrice =
    propertyDetails?.purchasePrice?.amount ||
    propertyDetails?.purchasePrice ||
    0;
  const rentAmount =
    propertyDetails?.rentAmount?.amount || propertyDetails?.rentAmount || 0;
  const totalAmount = purchasePrice || rentAmount || 0;
  const amountPaid =
    propertyDetails?.paymentSchedule
      ?.filter((p) => p.status === "paid")
      ?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const reportData = {
    matter: matter.toObject(),
    propertyDetails: {
      ...propertyDetails?.toObject(),
      purchasePrice,
      rentAmount,
      amountPaid,
      balance: totalAmount - amountPaid,
    },
    firm,
  };

  const filename = `${matter.matterNumber}_property_report_${Date.now()}.pdf`;

  generatePdf(
    reportData,
    res,
    path.resolve(__dirname, "../views/propertyReport.pug"),
    path.resolve(__dirname, `../output/${filename}`),
  );
});

module.exports = exports;
