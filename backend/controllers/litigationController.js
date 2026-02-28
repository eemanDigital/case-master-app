const Matter = require("../models/matterModel");
const LitigationDetail = require("../models/litigationDetailModel");
const catchAsync = require("../utils/catchAsync");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const AppError = require("../utils/appError");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const {
  createCalendarEventFromHearing,
  updateNextHearingInCalendar,
  createDeadlineFromCourtOrder,
  markHearingAsCompleted,
  deleteCalendarEventForHearing,
} = require("../controllers/calenderSync");

// ============================================
// INITIALIZE PAGINATION SERVICES
// ============================================

const matterService = PaginationServiceFactory.createService(Matter);
const litigationService =
  PaginationServiceFactory.createService(LitigationDetail);

// ============================================
// GET ALL LITIGATION MATTERS (WITH PAGINATION)
// ============================================

exports.getAllLitigationMatters = catchAsync(async (req, res, next) => {
  const { courtName, suitNo, judge, currentStage, status, clientId, year } =
    req.query;

  let matterFilter = { matterType: "litigation", isDeleted: false };

  // Client filter
  if (clientId) matterFilter.client = clientId;

  // Year filter
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    matterFilter.dateOpened = { $gte: startDate, $lte: endDate };
  }

  // If filtering by court-specific fields, get matching matter IDs
  if (courtName || suitNo || currentStage || judge) {
    const detailFilter = { firmId: req.firmId };
    if (courtName) detailFilter.courtName = courtName;
    if (suitNo) detailFilter.suitNo = { $regex: suitNo, $options: "i" };
    if (currentStage) detailFilter.currentStage = currentStage;
    if (judge) detailFilter["judge.name"] = { $regex: judge, $options: "i" };

    const litigationDetails =
      await LitigationDetail.find(detailFilter).select("matterId");
    const matterIds = litigationDetails.map((d) => d.matterId);
    matterFilter._id = { $in: matterIds };
  }

  if (status) matterFilter.status = status;

  const result = await matterService.paginate(
    req.query,
    matterFilter,
    req.firmId,
  );

  // Populate litigation details
  if (result.data && result.data.length > 0) {
    const populatedData = await Matter.populate(result.data, [
      {
        path: "litigationDetail",
        populate: [
          {
            path: "hearings.preparedBy",
            select: "firstName lastName email photo",
          },
          {
            path: "hearings.lawyerPresent",
            select: "firstName lastName email photo",
          },
        ],
      },
    ]);

    result.data = populatedData;
  }

  res.status(200).json({
    status: "success",
    results: result.data.length,
    totalPages: result.pages,
    currentPage: result.page,
    total: result.total,
    data: result.data,
  });
});

// ============================================
// CREATE LITIGATION DETAILS
// ============================================

exports.createLitigationDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const litigationData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const existingDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (existingDetail) {
    return next(
      new AppError("Litigation details already exist for this matter", 400),
    );
  }

  const litigationDetail = new LitigationDetail({
    matterId,
    firmId: req.firmId,
    ...litigationData,
  });

  await litigationDetail.save();

  // Update matter status if litigation details created
  if (litigationDetail.currentStage) {
    matter.lastActivityDate = new Date();
    await matter.save();
  }

  res.status(201).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// GET LITIGATION DETAILS
// ============================================

exports.getLitigationDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  }).populate([
    {
      path: "matter",
      select:
        "matterNumber title client accountOfficer status priority description dateOpened expectedClosureDate",
      populate: [
        {
          path: "client",
          select: "firstName lastName email phone companyName",
        },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    },
    {
      path: "hearings.preparedBy",
      select: "firstName lastName email photo",
    },
    {
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    },
    {
      path: "courtOrders.preparedBy",
      select: "firstName lastName email",
    },
    {
      path: "courtOrders.compliedBy",
      select: "firstName lastName email",
    },
  ]);

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// UPDATE LITIGATION DETAILS
// ============================================

exports.updateLitigationDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const updates = req.body;

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    updates,
    {
      new: true,
      runValidators: true,
    },
  ).populate([
    {
      path: "matter",
      select:
        "matterNumber title client accountOfficer status priority description dateOpened",
      populate: [
        { path: "client", select: "firstName lastName email phone" },
        { path: "accountOfficer", select: "firstName lastName email" },
      ],
    },
    {
      path: "hearings.preparedBy",
      select: "firstName lastName email photo",
    },
    {
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    },
  ]);

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  // Update matter last activity
  const matter = await Matter.findById(matterId);
  if (matter) {
    matter.lastActivityDate = new Date();
    await matter.save();
  }

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// DELETE LITIGATION DETAILS (SOFT DELETE)
// ============================================

exports.deleteLitigationDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { isDeleted: true },
    { new: true },
  );

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Litigation details deleted successfully",
  });
});

// ============================================
// RESTORE LITIGATION DETAILS
// ============================================

exports.restoreLitigationDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { isDeleted: false },
    { new: true },
  );

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Litigation details restored successfully",
    data: { litigationDetail },
  });
});

// ============================================
// ADD HEARING
// ============================================

exports.addHearing = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const hearingData = req.body;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  // If the hearing has a nextHearingDate and we should sync to calendar
  if (hearingData.nextHearingDate) {
    const matter = await Matter.findById(matterId).populate("client");
    if (matter && hearingData.createCalendarEvent !== false) {
      try {
        await createCalendarEventFromHearing(
          matter,
          litigationDetail,
          hearingData,
          req.firmId,
        );
      } catch (calendarError) {
        console.error("Calendar sync error:", calendarError);
      }
    }
  }

  // Add hearing to array
  litigationDetail.hearings.push(hearingData);
  await litigationDetail.save();

  // Update matter status
  const matter = await Matter.findById(matterId);
  if (matter) {
    matter.lastActivityDate = new Date();
    if (hearingData.nextHearingDate) {
      matter.nextActionDate = hearingData.nextHearingDate;
    }
    await matter.save();
  }

  // Populate the newly added hearing
  const updatedDetail = await LitigationDetail.findById(litigationDetail._id)
    .populate("hearings.preparedBy", "firstName lastName email photo")
    .populate("hearings.lawyerPresent", "firstName lastName email photo");

  const newHearing =
    updatedDetail.hearings[updatedDetail.hearings.length - 1];

  res.status(201).json({
    status: "success",
    data: { hearing: newHearing, litigationDetail: updatedDetail },
  });
});

// ============================================
// UPDATE HEARING
// ============================================

exports.updateHearing = catchAsync(async (req, res, next) => {
  const { matterId, hearingId } = req.params;
  const updates = req.body;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const hearingIndex = litigationDetail.hearings.findIndex(
    (h) => h._id.toString() === hearingId,
  );

  if (hearingIndex === -1) {
    return next(new AppError("Hearing not found", 404));
  }

  // Update hearing fields
  Object.assign(litigationDetail.hearings[hearingIndex], updates);

  // If next hearing date was updated, sync to calendar
  if (updates.nextHearingDate) {
    const matter = await Matter.findById(matterId).populate("client");
    if (matter) {
      try {
        await updateNextHearingInCalendar(
          matter,
          litigationDetail,
          litigationDetail.hearings[hearingIndex],
          req.firmId,
        );
      } catch (calendarError) {
        console.error("Calendar sync error:", calendarError);
      }
    }
  }

  // If outcome is set, mark as completed in calendar
  if (updates.outcome && !litigationDetail.hearings[hearingIndex].calendarEventId) {
    const matter = await Matter.findById(matterId).populate("client");
    if (matter) {
      try {
        await markHearingAsCompleted(
          matter,
          litigationDetail,
          litigationDetail.hearings[hearingIndex],
          req.firmId,
        );
      } catch (calendarError) {
        console.error("Calendar sync error:", calendarError);
      }
    }
  }

  await litigationDetail.save();

  // Update matter last activity
  const matter = await Matter.findById(matterId);
  if (matter) {
    matter.lastActivityDate = new Date();
    if (updates.nextHearingDate) {
      matter.nextActionDate = updates.nextHearingDate;
    }
    await matter.save();
  }

  // Populate and return updated hearing
  const updatedDetail = await LitigationDetail.findById(litigationDetail._id)
    .populate("hearings.preparedBy", "firstName lastName email photo")
    .populate("hearings.lawyerPresent", "firstName lastName email photo");

  res.status(200).json({
    status: "success",
    data: { hearing: updatedDetail.hearings[hearingIndex], litigationDetail: updatedDetail },
  });
});

// ============================================
// DELETE HEARING
// ============================================

exports.deleteHearing = catchAsync(async (req, res, next) => {
  const { matterId, hearingId } = req.params;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const hearingToDelete = litigationDetail.hearings.id(hearingId);

  if (!hearingToDelete) {
    return next(new AppError("Hearing not found", 404));
  }

  // Delete associated calendar event if exists
  if (hearingToDelete.calendarEventId) {
    const matter = await Matter.findById(matterId).populate("client");
    if (matter) {
      try {
        await deleteCalendarEventForHearing(
          matter,
          litigationDetail,
          hearingToDelete,
          req.firmId,
        );
      } catch (calendarError) {
        console.error("Calendar delete error:", calendarError);
      }
    }
  }

  hearingToDelete.deleteOne();
  await litigationDetail.save();

  res.status(200).json({
    status: "success",
    message: "Hearing deleted successfully",
  });
});

// ============================================
// GET MATTER HEARINGS
// ============================================

exports.getMatterHearings = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  })
    .populate("hearings.preparedBy", "firstName lastName email photo")
    .populate("hearings.lawyerPresent", "firstName lastName email photo");

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { hearings: litigationDetail.hearings },
  });
});

// ============================================
// ADD COURT ORDER
// ============================================

exports.addCourtOrder = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const courtOrderData = req.body;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  // If court order has a deadline, create calendar deadline
  if (courtOrderData.deadlineDate && courtOrderData.createDeadlineEvent !== false) {
    const matter = await Matter.findById(matterId).populate("client");
    if (matter) {
      try {
        await createDeadlineFromCourtOrder(
          matter,
          litigationDetail,
          courtOrderData,
          req.firmId,
        );
      } catch (calendarError) {
        console.error("Calendar sync error:", calendarError);
      }
    }
  }

  litigationDetail.courtOrders.push(courtOrderData);
  await litigationDetail.save();

  // Update matter next action date if needed
  if (courtOrderData.deadlineDate) {
    const matter = await Matter.findById(matterId);
    if (matter && (!matter.nextActionDate || new Date(courtOrderData.deadlineDate) < new Date(matter.nextActionDate))) {
      matter.nextActionDate = courtOrderData.deadlineDate;
      matter.lastActivityDate = new Date();
      await matter.save();
    }
  }

  // Populate and return
  const updatedDetail = await LitigationDetail.findById(litigationDetail._id)
    .populate("courtOrders.preparedBy", "firstName lastName email")
    .populate("courtOrders.compliedBy", "firstName lastName email");

  const newOrder =
    updatedDetail.courtOrders[updatedDetail.courtOrders.length - 1];

  res.status(201).json({
    status: "success",
    data: { courtOrder: newOrder, litigationDetail: updatedDetail },
  });
});

// ============================================
// UPDATE COURT ORDER
// ============================================

exports.updateCourtOrder = catchAsync(async (req, res, next) => {
  const { matterId, orderId } = req.params;
  const updates = req.body;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const orderIndex = litigationDetail.courtOrders.findIndex(
    (o) => o._id.toString() === orderId,
  );

  if (orderIndex === -1) {
    return next(new AppError("Court order not found", 404));
  }

  Object.assign(litigationDetail.courtOrders[orderIndex], updates);
  await litigationDetail.save();

  // Update matter next action date if compliance status changed
  if (updates.complianceStatus) {
    const matter = await Matter.findById(matterId);
    if (matter) {
      matter.lastActivityDate = new Date();
      await matter.save();
    }
  }

  // Populate and return
  const updatedDetail = await LitigationDetail.findById(litigationDetail._id)
    .populate("courtOrders.preparedBy", "firstName lastName email")
    .populate("courtOrders.compliedBy", "firstName lastName email");

  res.status(200).json({
    status: "success",
    data: { courtOrder: updatedDetail.courtOrders[orderIndex], litigationDetail: updatedDetail },
  });
});

// ============================================
// DELETE COURT ORDER
// ============================================

exports.deleteCourtOrder = catchAsync(async (req, res, next) => {
  const { matterId, orderId } = req.params;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const orderToDelete = litigationDetail.courtOrders.id(orderId);

  if (!orderToDelete) {
    return next(new AppError("Court order not found", 404));
  }

  orderToDelete.deleteOne();
  await litigationDetail.save();

  res.status(200).json({
    status: "success",
    message: "Court order deleted successfully",
  });
});

// ============================================
// ADD PROCESS FILED
// ============================================

exports.addProcessFiled = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { party, processData } = req.body; // party = 'firstParty' or 'secondParty'

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  if (!litigationDetail[party]) {
    litigationDetail[party] = { description: "", name: [], processesFiled: [] };
  }

  litigationDetail[party].processesFiled.push(processData);
  await litigationDetail.save();

  res.status(201).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// UPDATE PROCESS FILED
// ============================================

exports.updateProcessFiled = catchAsync(async (req, res, next) => {
  const { matterId, party, processIndex } = req.params;
  const updates = req.body;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const idx = parseInt(processIndex);
  if (
    !litigationDetail[party] ||
    !litigationDetail[party].processesFiled ||
    idx >= litigationDetail[party].processesFiled.length
  ) {
    return next(new AppError("Process not found", 404));
  }

  Object.assign(litigationDetail[party].processesFiled[idx], updates);
  await litigationDetail.save();

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// RECORD JUDGMENT
// ============================================

exports.recordJudgment = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { judgmentDate, judgmentDetails, outcome } = req.body;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  litigationDetail.judgment = {
    date: judgmentDate,
    details: judgmentDetails,
    outcome,
    recordedAt: new Date(),
  };

  // Clear any pending next hearing dates
  litigationDetail.hearings.forEach((h) => {
    if (!h.outcome) {
      h.nextHearingDate = null;
    }
  });

  await litigationDetail.save();

  // Update matter status
  const matter = await Matter.findById(matterId);
  if (matter) {
    matter.status = "closed";
    matter.lastActivityDate = new Date();
    matter.completionDate = new Date();
    await matter.save();
  }

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// RECORD SETTLEMENT
// ============================================

exports.recordSettlement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { settlementDate, settlementTerms, outcome } = req.body;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  litigationDetail.settlement = {
    date: settlementDate,
    terms: settlementTerms,
    outcome,
    recordedAt: new Date(),
  };

  // Clear any pending next hearing dates
  litigationDetail.hearings.forEach((h) => {
    if (!h.outcome) {
      h.nextHearingDate = null;
    }
  });

  await litigationDetail.save();

  // Update matter status
  const matter = await Matter.findById(matterId);
  if (matter) {
    matter.status = "settled";
    matter.lastActivityDate = new Date();
    matter.completionDate = new Date();
    await matter.save();
  }

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// FILE APPEAL
// ============================================

exports.fileAppeal = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const appealData = req.body;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  if (!litigationDetail.judgment) {
    return next(
      new AppError("Cannot file appeal - no judgment recorded", 400),
    );
  }

  litigationDetail.appeal = {
    ...appealData,
    filedAt: new Date(),
  };

  await litigationDetail.save();

  // Update matter status
  const matter = await Matter.findById(matterId);
  if (matter) {
    matter.status = "appeal";
    matter.lastActivityDate = new Date();
    await matter.save();
  }

  res.status(201).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// SEARCH LITIGATION MATTERS
// ============================================

exports.searchLitigationMatters = catchAsync(async (req, res, next) => {
  const searchCriteria = req.body;
  const { page = 1, limit = 20 } = req.query;

  // Build match conditions
  const matchConditions = {
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  };

  // Text search on litigation details
  if (searchCriteria.text) {
    matchConditions.$or = [
      { "matter.title": { $regex: searchCriteria.text, $options: "i" } },
      { "matter.matterNumber": { $regex: searchCriteria.text, $options: "i" } },
      { suitNo: { $regex: searchCriteria.text, $options: "i" } },
      { courtName: { $regex: searchCriteria.text, $options: "i" } },
      { "judge.name": { $regex: searchCriteria.text, $options: "i" } },
    ];
  }

  if (searchCriteria.status) {
    matchConditions["matter.status"] = searchCriteria.status;
  }

  if (searchCriteria.courtName) {
    matchConditions.courtName = {
      $regex: searchCriteria.courtName,
      $options: "i",
    };
  }

  if (searchCriteria.currentStage) {
    matchConditions.currentStage = searchCriteria.currentStage;
  }

  const result = await litigationService.paginate(
    { page, limit },
    matchConditions,
    req.firmId,
    [
      { path: "matter", populate: ["client", "accountOfficer"] },
    ],
  );

  res.status(200).json({
    status: "success",
    results: result.data.length,
    totalPages: result.pages,
    currentPage: result.page,
    total: result.total,
    data: result.data,
  });
});

// ============================================
// GET LITIGATION STATS
// ============================================

exports.getLitigationStats = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;

  const firmQuery = { firmId };

  const [
    totalCases,
    activeCases,
    upcomingHearings,
    casesByStatus,
    recentHearings,
    pendingActions,
  ] = await Promise.all([
    LitigationDetail.countDocuments(firmQuery),
    Matter.countDocuments({
      ...firmQuery,
      matterType: "litigation",
      status: "active",
    }),
    LitigationDetail.countDocuments({
      ...firmQuery,
      nextHearingDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "litigation",
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    LitigationDetail.find({
      ...firmQuery,
      nextHearingDate: { $gte: new Date() },
    })
      .populate({
        path: "matter",
        select: "matterNumber title client",
        populate: { path: "client", select: "firstName lastName" },
      })
      .select("suitNo courtName nextHearingDate")
      .sort({ nextHearingDate: 1 })
      .limit(5),
    LitigationDetail.countDocuments({
      ...firmQuery,
      "courtOrders.complianceStatus": "pending",
    }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalCases,
      activeCases,
      upcomingHearings,
      casesByStatus,
      recentHearings,
      pendingActions,
    },
  });
});

// ============================================
// GET LITIGATION DASHBOARD
// ============================================

exports.getLitigationDashboard = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const firmQuery = { firmId };

  const [
    totalCases,
    activeCases,
    upcomingHearings,
    casesByStatus,
    recentHearings,
    pendingActions,
  ] = await Promise.all([
    LitigationDetail.countDocuments(firmQuery),
    Matter.countDocuments({
      ...firmQuery,
      matterType: "litigation",
      status: "active",
    }),
    LitigationDetail.countDocuments({
      ...firmQuery,
      nextHearingDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    Matter.aggregate([
      {
        $match: {
          ...firmQuery,
          matterType: "litigation",
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    LitigationDetail.find({
      ...firmQuery,
      nextHearingDate: { $gte: new Date() },
    })
      .populate({
        path: "matter",
        select: "matterNumber title client",
        populate: { path: "client", select: "firstName lastName" },
      })
      .select("suitNo courtName nextHearingDate")
      .sort({ nextHearingDate: 1 })
      .limit(5),
    LitigationDetail.countDocuments({
      ...firmQuery,
      "courtOrders.complianceStatus": "pending",
    }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        totalCases,
        activeCases,
        upcomingHearings,
        pendingActions,
      },
      casesByStatus,
      recentHearings,
    },
  });
});

// ============================================
// GET UPCOMING HEARINGS
// ============================================

/**
 * @desc    Get upcoming hearings with date range filtering
 * @route   GET /api/v1/litigation/upcoming-hearings
 * @access  Private
 */
exports.getUpcomingHearings = catchAsync(async (req, res, next) => {
  const { range } = req.query;
  const firmId = req.firmId;

  const today = dayjs().startOf("day");
  const thisWeekEnd = today.endOf("week");
  const nextWeekStart = thisWeekEnd.add(1, "day").startOf("day");
  const nextWeekEnd = nextWeekStart.add(6, "day").endOf("day");
  const thisMonthEnd = today.endOf("month");

  let startDate, endDate;
  switch (range) {
    case "this-week":
      startDate = today;
      endDate = thisWeekEnd;
      break;
    case "next-week":
      startDate = nextWeekStart;
      endDate = nextWeekEnd;
      break;
    case "this-month":
      startDate = today.startOf("month");
      endDate = thisMonthEnd;
      break;
    default:
      startDate = today;
      endDate = thisWeekEnd;
  }

  const matters = await Matter.find({
    firmId,
    matterType: "litigation",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone")
    .populate("assignedTo", "firstName lastName email")
    .lean();

  const matterIds = matters.map((m) => m._id);

  const litigationDetails = await LitigationDetail.find({
    firmId,
    matterId: { $in: matterIds },
  })
    .populate("hearings.lawyerPresent", "firstName lastName")
    .populate("hearings.preparedBy", "firstName lastName")
    .lean();

  const litigationMap = {};
  litigationDetails.forEach((d) => {
    litigationMap[d.matterId] = d;
  });

  const causeList = {
    today: [],
    thisWeek: [],
    nextWeek: [],
    overdue: [],
    thisMonth: [],
  };

  matters.forEach((matter) => {
    const litigation = litigationMap[matter._id];
    if (!litigation || !litigation.hearings) return;

    litigation.hearings.forEach((hearing) => {
      let hearingDate = hearing.date ? dayjs(hearing.date) : null;

      if (hearing.nextHearingDate) {
        const nextHearing = dayjs(hearing.nextHearingDate);
        if (nextHearing.isAfter(today, "day")) {
          hearingDate = nextHearing;
        }
      }

      if (!hearingDate) return;

      const hearingData = {
        matterId: matter._id,
        matterNumber: matter.matterNumber,
        matterTitle: matter.title,
        suitNo: litigation.suitNo,
        courtName: litigation.courtName,
        courtNo: litigation.courtNo,
        courtLocation: litigation.courtLocation,
        judge: Array.isArray(litigation.judge)
          ? litigation.judge[0]?.name
          : litigation.judge?.name,
        client: matter.client,
        assignedTo: matter.assignedTo,
        hearingDate: hearingDate.toDate(),
        hearingPurpose: hearing.purpose,
        lawyerPresent: hearing.lawyerPresent,
        notes: hearing.notes,
      };

      if (hearingDate.isBefore(today, "day")) {
        causeList.overdue.push(hearingData);
      } else if (hearingDate.isSame(today, "day")) {
        causeList.today.push(hearingData);
      } else if (hearingDate.isBefore(nextWeekStart, "day")) {
        causeList.thisWeek.push(hearingData);
      } else if (
        hearingDate.isSameOrAfter(nextWeekStart, "day") &&
        hearingDate.isSameOrBefore(nextWeekEnd, "day")
      ) {
        causeList.nextWeek.push(hearingData);
      } else if (hearingDate.isSameOrBefore(thisMonthEnd, "day")) {
        causeList.thisMonth.push(hearingData);
      }
    });
  });

  const sortByDate = (a, b) => new Date(a.hearingDate) - new Date(b.hearingDate);
  Object.values(causeList).forEach((arr) => arr.sort(sortByDate));

  const counts = {
    today: causeList.today.length,
    thisWeek: causeList.thisWeek.length,
    nextWeek: causeList.nextWeek.length,
    overdue: causeList.overdue.length,
    thisMonth: causeList.thisMonth.length,
    total:
      causeList.today.length +
      causeList.thisWeek.length +
      causeList.nextWeek.length +
      causeList.overdue.length +
      causeList.thisMonth.length,
  };

  res.status(200).json({
    status: "success",
    data: {
      range: range || "this-week",
      dateRange: {
        start: startDate.toDate(),
        end: endDate.toDate(),
      },
      counts,
      hearings: causeList.today.concat(causeList.thisWeek, causeList.nextWeek, causeList.overdue, causeList.thisMonth),
      causeList,
    },
  });
});

// ============================================
// DOWNLOAD UPCOMING HEARINGS PDF
// ============================================

exports.downloadUpcomingHearingsPdf = catchAsync(async (req, res, next) => {
  const { range } = req.query;
  const firmId = req.firmId;

  const today = dayjs().startOf("day");
  const thisWeekEnd = today.endOf("week");
  const nextWeekStart = thisWeekEnd.add(1, "day").startOf("day");
  const nextWeekEnd = nextWeekStart.add(6, "day").endOf("day");
  const thisMonthEnd = today.endOf("month");

  let startDate, endDate, periodName;
  switch (range) {
    case "this-week":
      startDate = today;
      endDate = thisWeekEnd;
      periodName = "This Week";
      break;
    case "next-week":
      startDate = nextWeekStart;
      endDate = nextWeekEnd;
      periodName = "Next Week";
      break;
    case "this-month":
      startDate = today.startOf("month");
      endDate = thisMonthEnd;
      periodName = "This Month";
      break;
    default:
      startDate = today;
      endDate = thisWeekEnd;
      periodName = "This Week";
  }

  const matters = await Matter.find({
    firmId,
    matterType: "litigation",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName")
    .populate("assignedTo", "firstName lastName")
    .lean();

  const matterIds = matters.map((m) => m._id);

  const litigationDetails = await LitigationDetail.find({
    firmId,
    matterId: { $in: matterIds },
  })
    .populate("hearings.lawyerPresent", "firstName lastName")
    .lean();

  const litigationMap = {};
  litigationDetails.forEach((d) => {
    litigationMap[d.matterId] = d;
  });

  const hearings = [];

  matters.forEach((matter) => {
    const litigation = litigationMap[matter._id];
    if (!litigation || !litigation.hearings) return;

    litigation.hearings.forEach((hearing) => {
      let hearingDate = hearing.date ? dayjs(hearing.date) : null;

      if (hearing.nextHearingDate) {
        const nextHearing = dayjs(hearing.nextHearingDate);
        if (nextHearing.isAfter(today, "day")) {
          hearingDate = nextHearing;
        }
      }

      if (!hearingDate) return;

      const isInRange =
        !hearingDate.isBefore(startDate, "day") &&
        !hearingDate.isAfter(endDate, "day");

      if (!isInRange) return;

      hearings.push({
        matterNumber: matter.matterNumber,
        matterTitle: matter.title,
        suitNo: litigation.suitNo,
        courtName: litigation.courtName,
        courtNo: litigation.courtNo,
        courtLocation: litigation.courtLocation,
        judge: Array.isArray(litigation.judge)
          ? litigation.judge[0]?.name
          : litigation.judge?.name,
        client: matter.client,
        hearingDate: hearingDate.format("YYYY-MM-DD"),
        hearingDay: hearingDate.format("dddd"),
        purpose: hearing.purpose,
        nextHearingDate: hearing.nextHearingDate,
        lawyerPresent: hearing.lawyerPresent,
      });
    });
  });

  hearings.sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate));

  const pug = require("pug");
  const path = require("path");

  const templatePath = path.join(__dirname, "../views/causeListSimple.pug");

  const html = pug.renderFile(templatePath, {
    hearings,
    periodName,
    startDate: startDate.format("MMMM D, YYYY"),
    endDate: endDate.format("MMMM D, YYYY"),
    generatedAt: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    firmName: "A.T. LUKMAN & CO.",
  });

  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
  });

  await browser.close();

  const filename = `upcoming-hearings-${range || "this-week"}-${Date.now()}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

module.exports = exports;
