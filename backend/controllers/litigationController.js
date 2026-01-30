const Matter = require("../models/matterModel");
const LitigationDetail = require("../models/litigationDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const {
  createCalendarEventFromHearing,
  updateNextHearingInCalendar,
  createDeadlineFromCourtOrder,
  markHearingAsCompleted,
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
      {
        path: "client",
        select: "firstName lastName email phone companyName",
      },
      {
        path: "accountOfficer",
        select: "firstName lastName email photo",
      },
    ]);
    result.data = populatedData;
  }

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// SEARCH LITIGATION MATTERS (ADVANCED)
// ============================================

exports.searchLitigationMatters = catchAsync(async (req, res, next) => {
  const criteria = { ...req.body, matterType: "litigation" };
  const result = await matterService.advancedSearch(
    criteria,
    req.query,
    req.firmId,
  );

  res.status(200).json({
    status: "success",
    ...result,
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
  const updateData = req.body;

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    updateData,
    { new: true, runValidators: true },
  );

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  // Update matter last activity
  await Matter.findByIdAndUpdate(matterId, {
    lastActivityDate: new Date(),
  });

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
    { matterId, firmId: req.firmId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user.id,
    },
    { new: true },
  );

  if (!litigationDetail) {
    return next(
      new AppError("Litigation details not found or already deleted", 404),
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ============================================
// RESTORE LITIGATION DETAILS
// ============================================

exports.restoreLitigationDetails = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    { new: true },
  );

  if (!litigationDetail) {
    return next(
      new AppError("No deleted litigation details found to restore", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// GET UPCOMING HEARINGS (WITH PAGINATION)
// ============================================

exports.getUpcomingHearings = catchAsync(async (req, res, next) => {
  const { days = 30, page = 1, limit = 20, courtName, clientId } = req.query;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + Number(days));

  const customFilter = {
    nextHearingDate: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (courtName) customFilter.courtName = courtName;

  const result = await litigationService.paginate(
    { page, limit, sort: "nextHearingDate" },
    customFilter,
    req.firmId,
  );

  // Populate matter details and filter by client if needed
  if (result.data && result.data.length > 0) {
    const populatedData = await LitigationDetail.populate(result.data, [
      {
        path: "matter",
        select: "matterNumber title client accountOfficer status priority",
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
    ]);

    // Filter by client if specified
    let filteredData = populatedData.filter(
      (detail) => detail.matter && !detail.matter.isDeleted,
    );

    if (clientId) {
      filteredData = filteredData.filter(
        (detail) => detail.matter.client._id.toString() === clientId,
      );
    }

    result.data = filteredData;
    result.pagination.count = result.data.length;
  }

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// ============================================
// ADD HEARING (WITH AUTO-CALENDAR SYNC) 🔥
// ============================================

exports.addHearing = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const hearingData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  }).populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  if (!hearingData.date) {
    return next(new AppError("Hearing date is required", 400));
  }

  let litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    litigationDetail = new LitigationDetail({
      matterId,
      firmId: req.firmId,
      suitNo: "TEMP/" + new Date().getFullYear() + "/001",
      courtName: "high court",
      state: "Lagos",
      modeOfCommencement: "writ of summons",
      filingDate: new Date(),
      currentStage: "pre-trial",
    });
  }

  const hearingWithUser = {
    ...hearingData,
    preparedBy: hearingData.preparedBy || req.user.id,
  };

  litigationDetail.hearings.push(hearingWithUser);

  if (hearingData.nextHearingDate) {
    litigationDetail.nextHearingDate = hearingData.nextHearingDate;
  }

  await litigationDetail.save();

  // Update matter last activity
  matter.lastActivityDate = new Date();
  await matter.save();

  await litigationDetail.populate([
    { path: "hearings.preparedBy", select: "firstName lastName email photo" },
    {
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    },
    {
      path: "matter",
      select: "matterNumber title client accountOfficer",
      populate: [
        { path: "client", select: "firstName lastName email phone" },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    },
  ]);

  // 🔥 AUTO-SYNC: Create calendar event
  const newHearing =
    litigationDetail.hearings[litigationDetail.hearings.length - 1];
  try {
    await createCalendarEventFromHearing(litigationDetail, newHearing, matter);
  } catch (calendarError) {
    console.error("❌ Calendar sync failed:", calendarError);
  }

  res.status(200).json({
    status: "success",
    message: "Hearing added and synced to calendar",
    data: { litigationDetail },
  });
});

// ============================================
// UPDATE HEARING (WITH AUTO-CALENDAR SYNC) 🔥
// ============================================

exports.updateHearing = catchAsync(async (req, res, next) => {
  const { matterId, hearingId } = req.params;
  const updateData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  }).populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const setObj = {};
  for (const key in updateData) {
    setObj[`hearings.$.${key}`] = updateData[key];
  }

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "hearings._id": hearingId,
    },
    { $set: setObj },
    { new: true, runValidators: true },
  ).populate([
    { path: "hearings.preparedBy", select: "firstName lastName email photo" },
    {
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    },
  ]);

  if (!litigationDetail) {
    return next(new AppError("Hearing not found", 404));
  }

  // Update matter last activity
  matter.lastActivityDate = new Date();
  await matter.save();

  // 🔥 AUTO-SYNC: Update calendar event
  const updatedHearing = litigationDetail.hearings.id(hearingId);
  if (updatedHearing) {
    try {
      await createCalendarEventFromHearing(
        litigationDetail,
        updatedHearing,
        matter,
      );
    } catch (calendarError) {
      console.error("❌ Calendar sync failed:", calendarError);
    }
  }

  res.status(200).json({
    status: "success",
    message: "Hearing updated and synced to calendar",
    data: { litigationDetail },
  });
});

// ============================================
// DELETE HEARING
// ============================================

exports.deleteHearing = catchAsync(async (req, res, next) => {
  const { matterId, hearingId } = req.params;

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { hearings: { _id: hearingId } } },
    { new: true },
  );

  if (!litigationDetail) {
    return next(new AppError("Hearing not found", 404));
  }

  // Update matter last activity
  await Matter.findByIdAndUpdate(matterId, {
    lastActivityDate: new Date(),
  });

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// ADD COURT ORDER (WITH AUTO-DEADLINE) 🔥
// ============================================

exports.addCourtOrder = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const orderData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  }).populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { courtOrders: orderData } },
    { new: true, runValidators: true },
  );

  // Update matter last activity
  matter.lastActivityDate = new Date();
  await matter.save();

  // 🔥 AUTO-SYNC: Create deadline if compliance date exists
  const newOrder =
    litigationDetail.courtOrders[litigationDetail.courtOrders.length - 1];
  if (newOrder.complianceDeadline) {
    try {
      await createDeadlineFromCourtOrder(litigationDetail, newOrder, matter);
    } catch (calendarError) {
      console.error("❌ Deadline creation failed:", calendarError);
    }
  }

  res.status(200).json({
    status: "success",
    message:
      "Court order added" +
      (newOrder.complianceDeadline ? " and deadline created" : ""),
    data: { litigationDetail },
  });
});

// ============================================
// UPDATE COURT ORDER
// ============================================

exports.updateCourtOrder = catchAsync(async (req, res, next) => {
  const { matterId, orderId } = req.params;
  const updateData = req.body;

  const setObj = {};
  for (const key in updateData) {
    setObj[`courtOrders.$.${key}`] = updateData[key];
  }

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    {
      matterId,
      firmId: req.firmId,
      "courtOrders._id": orderId,
    },
    { $set: setObj },
    { new: true, runValidators: true },
  );

  if (!litigationDetail) {
    return next(new AppError("Court order not found", 404));
  }

  // Update matter last activity
  await Matter.findByIdAndUpdate(matterId, {
    lastActivityDate: new Date(),
  });

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// DELETE COURT ORDER
// ============================================

exports.deleteCourtOrder = catchAsync(async (req, res, next) => {
  const { matterId, orderId } = req.params;

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $pull: { courtOrders: { _id: orderId } } },
    { new: true },
  );

  if (!litigationDetail) {
    return next(new AppError("Court order not found", 404));
  }

  // Update matter last activity
  await Matter.findByIdAndUpdate(matterId, {
    lastActivityDate: new Date(),
  });

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// ADD PROCESS FILED BY PARTY
// ============================================

exports.addProcessFiled = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { party, processData } = req.body;

  if (!["firstParty", "secondParty", "otherParty"].includes(party)) {
    return next(new AppError("Invalid party specified", 400));
  }

  const updatePath =
    party === "otherParty"
      ? "otherParty.0.processesFiled"
      : `${party}.processesFiled`;

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    { $push: { [updatePath]: processData } },
    { new: true, runValidators: true },
  );

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  // Update matter last activity
  await Matter.findByIdAndUpdate(matterId, {
    lastActivityDate: new Date(),
  });

  res.status(200).json({
    status: "success",
    data: { litigationDetail },
  });
});

// ============================================
// UPDATE PROCESS FILED
// ============================================

exports.updateProcessFiled = catchAsync(async (req, res, next) => {
  const { matterId, party, processIndex } = req.params;
  const processData = req.body;

  if (!["firstParty", "secondParty", "otherParty"].includes(party)) {
    return next(new AppError("Invalid party specified", 400));
  }

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  let partyData;
  if (party === "firstParty") partyData = litigationDetail.firstParty;
  else if (party === "secondParty") partyData = litigationDetail.secondParty;
  else partyData = litigationDetail.otherParty[0];

  if (!partyData || processIndex >= partyData.processesFiled.length) {
    return next(new AppError("Process not found", 404));
  }

  partyData.processesFiled[processIndex] = {
    ...partyData.processesFiled[processIndex],
    ...processData,
  };

  await litigationDetail.save();

  // Update matter last activity
  await Matter.findByIdAndUpdate(matterId, {
    lastActivityDate: new Date(),
  });

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
  const judgmentData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      judgment: judgmentData,
      currentStage: "judgment",
    },
    { new: true, runValidators: true },
  );

  if (judgmentData.outcome) {
    const statusMap = {
      won: "won",
      lost: "lost",
      "partially-won": "completed",
      dismissed: "closed",
      "struck-out": "closed",
    };

    if (statusMap[judgmentData.outcome]) {
      matter.status = statusMap[judgmentData.outcome];
      if (judgmentData.judgmentDate) {
        matter.actualClosureDate = judgmentData.judgmentDate;
      }
      matter.lastActivityDate = new Date();
      await matter.save();
    }
  }

  // 🔥 Mark past hearings as completed
  try {
    await markHearingAsCompleted(litigationDetail, matter);
  } catch (calendarError) {
    console.error("❌ Calendar update failed:", calendarError);
  }

  res.status(200).json({
    status: "success",
    data: { litigationDetail, matter },
  });
});

// ============================================
// RECORD SETTLEMENT
// ============================================

exports.recordSettlement = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const settlementData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      settlement: { ...settlementData, isSettled: true },
      currentStage: "settled",
    },
    { new: true, runValidators: true },
  );

  matter.status = "settled";
  matter.lastActivityDate = new Date();
  if (settlementData.settlementDate) {
    matter.actualClosureDate = settlementData.settlementDate;
  }
  await matter.save();

  // 🔥 Mark past hearings as completed
  try {
    await markHearingAsCompleted(litigationDetail, matter);
  } catch (calendarError) {
    console.error("❌ Calendar update failed:", calendarError);
  }

  res.status(200).json({
    status: "success",
    data: { litigationDetail, matter },
  });
});

// ============================================
// FILE APPEAL
// ============================================

exports.fileAppeal = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const appealData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOneAndUpdate(
    { matterId, firmId: req.firmId },
    {
      appeal: { ...appealData, isAppealed: true },
      currentStage: "appeal",
    },
    { new: true, runValidators: true },
  );

  // Update matter status and activity
  matter.status = "active";
  matter.lastActivityDate = new Date();
  await matter.save();

  res.status(200).json({
    status: "success",
    data: { litigationDetail, matter },
  });
});

// ============================================
// GET LITIGATION STATISTICS
// ============================================

exports.getLitigationStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

  const [
    byCourt,
    byStage,
    upcomingHearings,
    outcomes,
    hearingsByMonth,
    pendingJudgments,
  ] = await Promise.all([
    LitigationDetail.aggregate([
      { $match: firmQuery },
      { $group: { _id: "$courtName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    LitigationDetail.aggregate([
      { $match: firmQuery },
      { $group: { _id: "$currentStage", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    LitigationDetail.countDocuments({
      ...firmQuery,
      nextHearingDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    LitigationDetail.aggregate([
      { $match: firmQuery },
      { $group: { _id: "$judgment.outcome", count: { $sum: 1 } } },
    ]),
    LitigationDetail.aggregate([
      { $match: firmQuery },
      {
        $project: {
          month: { $month: "$filingDate" },
          year: { $year: "$filingDate" },
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]),
    LitigationDetail.countDocuments({
      ...firmQuery,
      "judgment.judgmentDate": { $exists: false },
      currentStage: { $in: ["trial", "pre-trial"] },
    }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      byCourt,
      byStage,
      upcomingHearings,
      outcomes,
      hearingsByMonth,
      pendingJudgments,
      totalCases: byCourt.reduce((sum, item) => sum + item.count, 0),
    },
  });
});

// ============================================
// GET LITIGATION DASHBOARD SUMMARY
// ============================================

exports.getLitigationDashboard = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.firmId, isDeleted: false };

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

module.exports = exports;
