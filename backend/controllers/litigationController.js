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
  const { limit = 50, days = 30 } = req.query;

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  // Find all litigation matters with hearings
  const litigations = await LitigationDetail.find({
    firmId: req.firmId,
    isDeleted: false,
    "hearings.0": { $exists: true }, // Only matters with at least one hearing
  })
    .populate({
      path: "matterId",
      match: { isDeleted: false }, // Exclude deleted matters
      select: "matterNumber title client accountOfficer status priority",
      populate: [
        {
          path: "client",
          select: "firstName lastName email phone companyName",
        },
        { path: "accountOfficer", select: "firstName lastName email photo" },
      ],
    })
    .populate({
      path: "hearings.preparedBy",
      select: "firstName lastName email photo",
    })
    .populate({
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    })
    .lean();

  // Extract ALL individual hearing records
  const allHearings = [];

  litigations.forEach((litigation) => {
    // Skip if matter was deleted
    if (!litigation.matterId) return;
    if (!litigation.hearings || litigation.hearings.length === 0) return;

    // Process each hearing as a separate record
    litigation.hearings.forEach((hearing) => {
      // Determine display date: use nextHearingDate if future, otherwise hearing.date
      const displayDate = hearing.nextHearingDate
        ? new Date(hearing.nextHearingDate)
        : new Date(hearing.date);

      // Include if:
      // 1. Within date range, OR
      // 2. Past hearing without outcome (needs attention)
      const isInRange = displayDate <= futureDate;
      const needsAttention = !hearing.outcome && new Date(hearing.date) < now;

      if (isInRange || needsAttention) {
        allHearings.push({
          // Hearing-specific fields
          _id: hearing._id,
          date: hearing.date,
          purpose: hearing.purpose,
          outcome: hearing.outcome,
          notes: hearing.notes,
          nextHearingDate: hearing.nextHearingDate,
          hearingNoticeServed: hearing.hearingNoticeServed,
          lawyerPresent: hearing.lawyerPresent,
          preparedBy: hearing.preparedBy,
          createdAt: hearing.createdAt,
          updatedAt: hearing.updatedAt,

          // Litigation context
          litigationDetailId: litigation._id,
          matterId: litigation.matterId._id,
          suitNo: litigation.suitNo,
          courtName: litigation.courtName,
          courtNo: litigation.courtNo,
          courtLocation: litigation.courtLocation,
          state: litigation.state,
          division: litigation.division,
          judge: litigation.judge,
          firstParty: litigation.firstParty,
          secondParty: litigation.secondParty,

          // Populated matter
          matter: litigation.matterId,

          // For sorting/filtering
          displayDate: displayDate,

          // Store full hearings array for widget (to find linked hearing)
          hearings: litigation.hearings,
        });
      }
    });
  });

  // Sort by display date (earliest first)
  allHearings.sort((a, b) => new Date(a.displayDate) - new Date(b.displayDate));

  // Apply limit
  const limitedHearings = allHearings.slice(0, parseInt(limit));

  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: limitedHearings.length,
    today: limitedHearings.filter((h) => {
      const hDate = new Date(h.nextHearingDate || h.date);
      hDate.setHours(0, 0, 0, 0);
      return hDate.getTime() === today.getTime();
    }).length,
    thisWeek: limitedHearings.filter((h) => {
      const hDate = new Date(h.nextHearingDate || h.date);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return hDate >= today && hDate <= weekFromNow;
    }).length,
    pending: limitedHearings.filter((h) => !h.outcome).length,
    completed: limitedHearings.filter((h) => !!h.outcome).length,
  };

  res.status(200).json({
    status: "success",
    results: limitedHearings.length,
    stats,
    data: limitedHearings, // Return array directly (Redux expects this)
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
  }).populate("accountOfficer assignedLawyers");

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

  console.log("🔵 About to save litigation with hearings...");

  // ✅ THIS TRIGGERS THE MIDDLEWARE!
  await litigationDetail.save();

  console.log("🔵 Litigation saved, middleware should have run");

  // Update matter last activity
  matter.lastActivityDate = new Date();
  await matter.save();

  await litigationDetail.populate([
    { path: "hearings.preparedBy", select: "firstName lastName email photo" },
    {
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    },
  ]);

  res.status(200).json({
    status: "success",
    message: "Hearing added and synced to calendar",
    data: { litigationDetail },
  });
});
exports.getMatterHearings = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  // Verify matter exists and belongs to firm
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  // Find litigation details with all hearings
  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  })
    .populate({
      path: "hearings.preparedBy",
      select: "firstName lastName email photo",
    })
    .populate({
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    })
    .lean();

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  // Get all hearings (don't filter - return complete history)
  const allHearings = litigationDetail.hearings || [];

  // Sort hearings by date (most recent first for timeline display)
  const sortedHearings = allHearings.sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  // Calculate statistics
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: sortedHearings.length,

    // Past hearings (date has passed)
    past: sortedHearings.filter((h) => {
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      return hDate < today && !h.outcome;
    }).length,

    // Today's hearings
    today: sortedHearings.filter((h) => {
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      return hDate.getTime() === today.getTime();
    }).length,

    // Future hearings
    upcoming: sortedHearings.filter((h) => {
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      return hDate > today && !h.outcome;
    }).length,

    // Completed hearings (has outcome)
    completed: sortedHearings.filter((h) => !!h.outcome).length,

    // Pending (no outcome yet)
    pending: sortedHearings.filter((h) => !h.outcome).length,

    // With next hearing date set
    withNextDate: sortedHearings.filter((h) => !!h.nextHearingDate).length,
  };

  // Include litigation context
  const response = {
    litigationDetail: {
      _id: litigationDetail._id,
      matterId: litigationDetail.matterId,
      suitNo: litigationDetail.suitNo,
      courtName: litigationDetail.courtName,
      courtNo: litigationDetail.courtNo,
      division: litigationDetail.division,
      courtLocation: litigationDetail.courtLocation,
      state: litigationDetail.state,
      judge: litigationDetail.judge,
      nextHearingDate: litigationDetail.nextHearingDate,
      lastHearingDate: litigationDetail.lastHearingDate,
      totalHearings: litigationDetail.totalHearings,
      currentStage: litigationDetail.currentStage,
      firstParty: litigationDetail.firstParty,
      secondParty: litigationDetail.secondParty,
    },
    hearings: sortedHearings,
    stats,
  };

  res.status(200).json({
    status: "success",
    results: sortedHearings.length,
    data: response,
  });
});

// ============================================
// UPDATE HEARING (WITH AUTO-CALENDAR SYNC) 🔥
// ============================================

// 1. Initialize the plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

exports.updateHearing = catchAsync(async (req, res, next) => {
  const { matterId, hearingId } = req.params;
  const updateData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  }).populate("accountOfficer assignedLawyers");

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation not found", 404));
  }

  const hearing = litigationDetail.hearings.id(hearingId);
  if (!hearing) {
    return next(new AppError("Hearing not found", 404));
  }

  // ════════════════════════════════════════════════════════════
  // BUSINESS RULES LOGIC
  // ════════════════════════════════════════════════════════════

  const now = dayjs();
  const hearingDate = dayjs(hearing.date).startOf("day");
  const gracePeriodEnd = hearingDate.add(2, "day").endOf("day"); // 48hr grace

  const isBeforeHearing = now.isBefore(hearingDate);
  const isWithinGracePeriod =
    now.isSameOrAfter(hearingDate) && now.isSameOrBefore(gracePeriodEnd);
  const isAfterGracePeriod = now.isAfter(gracePeriodEnd);

  // Fields restricted to filing phase (on/after hearing date)
  const reportFields = ["outcome", "notes"];
  const hasReportFieldUpdate = reportFields.some((f) =>
    Object.prototype.hasOwnProperty.call(updateData, f),
  );

  // RULE 1: Cannot file report BEFORE hearing date
  if (hasReportFieldUpdate && isBeforeHearing) {
    return next(
      new AppError(
        `Cannot file report until hearing date (${hearingDate.format("DD MMM YYYY")}). ` +
          `You can update lawyer assignments and hearing notice flag.`,
        403,
      ),
    );
  }

  // RULE 2: Report must be filed within grace period
  if (hasReportFieldUpdate && isAfterGracePeriod && !hearing.outcome) {
    return next(
      new AppError(
        `Report filing window closed. The 48-hour grace period ended on ` +
          `${gracePeriodEnd.format("DD MMM YYYY [at] HH:mm")}. ` +
          `Please contact an administrator to file a late report.`,
        403,
      ),
    );
  }

  // RULE 2B: Allow editing existing reports ONLY within grace period
  if (
    hasReportFieldUpdate &&
    hearing.outcome &&
    !isWithinGracePeriod &&
    !isBeforeHearing
  ) {
    return next(
      new AppError(
        `Report editing window closed. Reports can only be edited within 48 hours of the hearing date. ` +
          `Grace period ended: ${gracePeriodEnd.format("DD MMM YYYY [at] HH:mm")}`,
        403,
      ),
    );
  }

  // RULE 3: Adjourned outcome requires next hearing date
  if (updateData.outcome === "adjourned" && !updateData.nextHearingDate) {
    return next(
      new AppError(
        'Next hearing date is required when outcome is "Adjourned"',
        400,
      ),
    );
  }

  // RULE 4: Validate next hearing date is in future
  if (updateData.nextHearingDate) {
    const nextDate = dayjs(updateData.nextHearingDate);
    if (nextDate.isBefore(now)) {
      return next(new AppError("Next hearing date must be in the future", 400));
    }
  }

  // RULE 5: Cannot remove outcome once filed (unless in grace)
  if (hearing.outcome && updateData.outcome === null) {
    if (!isWithinGracePeriod) {
      return next(
        new AppError(
          "Cannot remove outcome after grace period. Please contact an administrator.",
          400,
        ),
      );
    }
  }

  // ════════════════════════════════════════════════════════════
  // PROCEED WITH UPDATE
  // ════════════════════════════════════════════════════════════

  Object.keys(updateData).forEach((key) => {
    hearing[key] = updateData[key];
  });

  console.log("🔵 About to save updated litigation...");
  await litigationDetail.save();
  console.log("🔵 Litigation saved, middleware ran");

  // Update matter
  matter.lastActivityDate = new Date();
  await matter.save();

  // Populate for response
  await litigationDetail.populate([
    { path: "hearings.preparedBy", select: "firstName lastName email photo" },
    {
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    },
  ]);

  res.status(200).json({
    status: "success",
    message: "Hearing updated and synced to calendar",
    data: { litigationDetail },
  });
});
// ============================================
// DELETE HEARING (WITH CALENDAR SYNC)
// ============================================

exports.deleteHearing = catchAsync(async (req, res, next) => {
  const { matterId, hearingId } = req.params;

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation not found", 404));
  }

  // Find the hearing before deleting to get its ID
  const hearing = litigationDetail.hearings.id(hearingId);
  if (!hearing) {
    return next(new AppError("Hearing not found", 404));
  }

  // Delete associated calendar event first
  try {
    await deleteCalendarEventForHearing(litigationDetail, hearingId);
  } catch (calendarError) {
    console.error("❌ Calendar event deletion failed:", calendarError);
  }

  // Delete the hearing
  litigationDetail.hearings.pull({ _id: hearingId });

  // Mark that hearings changed so middleware syncs
  litigationDetail._hearingChanges = { hasChanges: true };

  // Save to trigger middleware for updating nextHearingDate
  await litigationDetail.save();

  // Update matter last activity
  await Matter.findByIdAndUpdate(matterId, {
    lastActivityDate: new Date(),
  });

  res.status(200).json({
    status: "success",
    message: "Hearing deleted and calendar event removed",
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
