const Matter = require("../models/matterModel");
const LitigationDetail = require("../models/litigationDetailModel");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const AppError = require("../utils/appError");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const calendarSync = require("../services/calendarSyncService");
const path = require("path");
const { GenericPdfGenerator, getStatusColor, formatCurrency, formatDate } = require("../utils/generateGenericPdf");
const { generateCauseListPdf } = require("../utils/generateCauseListPdf");

// Initialize dayjs plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

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
// GET UPCOMING HEARINGS
// Supports: this-week, next-week, this-month, all (today+week+next+month)
// Also supports legacy: limit, days parameters
// ============================================

exports.getUpcomingHearings = catchAsync(async (req, res, next) => {
  const { limit = 500 } = req.query;
  const firmId = req.firmId;
  const today = dayjs().startOf("day");

  // Fetch all active litigation matters
  const matters = await Matter.find({
    firmId,
    matterType: "litigation",
    isDeleted: { $ne: true },
    status: { $in: ["active", "pending", "open"] },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email photo")
    .lean();

  const matterIds = matters.map((m) => m._id);

  const litigationDetails = await LitigationDetail.find({
    firmId,
    matterId: { $in: matterIds },
  })
    .populate("hearings.lawyerPresent", "firstName lastName email photo")
    .populate("hearings.preparedBy", "firstName lastName email photo")
    .lean();

  const litigationMap = {};
  litigationDetails.forEach((d) => {
    litigationMap[d.matterId] = d;
  });

  // Extract all upcoming hearings using ONLY nextHearingDate
  const upcomingHearings = [];

  matters.forEach((matter) => {
    const litigation = litigationMap[matter._id];
    if (!litigation || !litigation.hearings) return;

    litigation.hearings.forEach((hearing) => {
      // Skip if no nextHearingDate
      if (!hearing.nextHearingDate) return;

      const hearingDate = dayjs(hearing.nextHearingDate);

      // Skip if nextHearingDate is today or in the past
      if (!hearingDate.isAfter(today, "day")) return;

      // No upper date cap — include ALL future hearings
      upcomingHearings.push({
        _id: hearing._id,
        date: hearing.date,
        purpose: hearing.purpose,
        outcome: hearing.outcome,
        notes: hearing.notes,
        nextHearingDate: hearing.nextHearingDate,
        hearingNoticeServed: hearing.hearingNoticeServed,
        hearingNoticeRequired: hearing.hearingNoticeRequired,
        lawyerPresent: hearing.lawyerPresent,
        preparedBy: hearing.preparedBy,
        createdAt: hearing.createdAt,
        updatedAt: hearing.updatedAt,

        litigationDetailId: litigation._id,
        matterId: matter._id,
        suitNo: litigation.suitNo,
        courtName: litigation.courtName,
        courtNo: litigation.courtNo,
        courtLocation: litigation.courtLocation,
        state: litigation.state,
        division: litigation.division,
        judge: litigation.judge,
        firstParty: litigation.firstParty,
        secondParty: litigation.secondParty,

        matter: {
          _id: matter._id,
          matterNumber: matter.matterNumber,
          title: matter.title,
          client: matter.client,
          accountOfficer: matter.accountOfficer,
          status: matter.status,
          priority: matter.priority,
        },

        displayDate: hearingDate.toDate(),
        hearingDate: hearingDate.format("YYYY-MM-DD"),
      });
    });
  });

  // Sort by nextHearingDate — earliest first
  upcomingHearings.sort(
    (a, b) => new Date(a.displayDate) - new Date(b.displayDate),
  );

  // Apply limit
  const limitedHearings = upcomingHearings.slice(0, parseInt(limit));

  // Stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const thisWeekStart = today.startOf("week").toDate();
  const thisWeekEnd = today.endOf("week").toDate();
  const nextWeekStart = today.add(1, "week").startOf("week").toDate();
  const nextWeekEnd = today.add(1, "week").endOf("week").toDate();
  const thisMonthStart = today.startOf("month").toDate();
  const thisMonthEnd = today.endOf("month").toDate();

  const stats = {
    total: limitedHearings.length,
    today: limitedHearings.filter((h) => {
      const d = new Date(h.displayDate);
      return d >= todayStart && d <= todayEnd;
    }).length,
    thisWeek: limitedHearings.filter((h) => {
      const d = new Date(h.displayDate);
      return d >= thisWeekStart && d <= thisWeekEnd;
    }).length,
    nextWeek: limitedHearings.filter((h) => {
      const d = new Date(h.displayDate);
      return d >= nextWeekStart && d <= nextWeekEnd;
    }).length,
    thisMonth: limitedHearings.filter((h) => {
      const d = new Date(h.displayDate);
      return d >= thisMonthStart && d <= thisMonthEnd;
    }).length,
    pending: limitedHearings.filter((h) => !h.outcome).length,
    completed: limitedHearings.filter((h) => !!h.outcome).length,
  };

  res.status(200).json({
    status: "success",
    results: limitedHearings.length,
    stats,
    data: limitedHearings,
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

  // Save the litigation detail FIRST
  await litigationDetail.save();

  // Then explicitly sync to calendar using the new service
  const latestHearing =
    litigationDetail.hearings[litigationDetail.hearings.length - 1];

  let calendarResult = { success: true, message: "Calendar sync skipped" };
  try {
    calendarResult = await calendarSync.syncHearing(
      matterId,
      req.firmId,
      latestHearing,
      litigationDetail,
    );

    if (!calendarResult.success) {
      console.warn("⚠️ Calendar sync failed:", calendarResult.message);
    } else {
      console.log("✅ Calendar sync:", calendarResult.message);
    }
  } catch (syncError) {
    console.error("❌ Calendar sync error:", syncError);
    // Don't fail the request if calendar sync fails
  }

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
    message:
      "Hearing added" +
      (calendarResult.success ? " and synced to calendar" : ""),
    calendarSync: calendarResult.success ? calendarResult.message : null,
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

  // Sync matter-level nextHearingDate with hearing's nextHearingDate
  if (updateData.nextHearingDate) {
    litigationDetail.nextHearingDate = updateData.nextHearingDate;
  }

  // Save the litigation detail FIRST
  await litigationDetail.save();

  // Explicitly sync to calendar using the new service
  let calendarResult = { success: true, message: "Calendar sync skipped" };
  try {
    calendarResult = await calendarSync.syncHearing(
      matterId,
      req.firmId,
      hearing,
      litigationDetail,
    );

    if (!calendarResult.success) {
      console.warn("⚠️ Calendar sync failed:", calendarResult.message);
    } else {
      console.log("✅ Calendar sync:", calendarResult.message);
    }
  } catch (syncError) {
    console.error("❌ Calendar sync error:", syncError);
    // Don't fail the request if calendar sync fails
  }

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
    message:
      "Hearing updated" +
      (calendarResult.success ? " and synced to calendar" : ""),
    calendarSync: calendarResult.success ? calendarResult.message : null,
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

  // Delete associated calendar event using new service
  let calendarResult = { success: true };
  try {
    calendarResult = await calendarSync.deleteEvent(hearingId, req.firmId);
  } catch (calendarError) {
    console.error("❌ Calendar event deletion failed:", calendarError);
  }

  // Delete the hearing
  litigationDetail.hearings.pull({ _id: hearingId });

  // Recalculate nextHearingDate
  if (litigationDetail.hearings.length > 0) {
    const now = new Date();
    const futureNextHearingDates = litigationDetail.hearings
      .filter((h) => h.nextHearingDate && new Date(h.nextHearingDate) > now)
      .map((h) => new Date(h.nextHearingDate))
      .sort((a, b) => a - b);

    litigationDetail.nextHearingDate =
      futureNextHearingDates.length > 0 ? futureNextHearingDates[0] : null;
  } else {
    litigationDetail.nextHearingDate = null;
  }

  await litigationDetail.save();

  // Update matter last activity
  await Matter.findByIdAndUpdate(matterId, {
    lastActivityDate: new Date(),
  });

  res.status(200).json({
    status: "success",
    message:
      "Hearing deleted" +
      (calendarResult.success ? " and calendar event removed" : ""),
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

  // AUTO-SYNC: Create deadline if compliance date exists using new service
  const newOrder =
    litigationDetail.courtOrders[litigationDetail.courtOrders.length - 1];
  let calendarResult = { success: true };

  if (newOrder.complianceDeadline) {
    try {
      calendarResult = await calendarSync.syncCourtOrderDeadline(
        matterId,
        req.firmId,
        newOrder,
      );
      if (!calendarResult.success) {
        console.warn("⚠️ Deadline creation failed:", calendarResult.message);
      }
    } catch (calendarError) {
      console.error("❌ Deadline creation failed:", calendarError);
    }
  }

  res.status(200).json({
    status: "success",
    message:
      "Court order added" +
      (calendarResult.success && newOrder.complianceDeadline
        ? " and deadline synced to calendar"
        : ""),
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
// DELETE PROCESS FILED
// ============================================

exports.deleteProcessFiled = catchAsync(async (req, res, next) => {
  const { matterId, party, processIndex } = req.params;

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

  partyData.processesFiled.splice(processIndex, 1);

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

  // Mark past hearings as completed using new service
  let calendarResult = { success: true };
  try {
    calendarResult = await calendarSync.markPastHearingsCompleted(
      matterId,
      req.firmId,
    );
    if (!calendarResult.success) {
      console.warn("⚠️ Calendar update failed:", calendarResult.message);
    }
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

  // Mark past hearings as completed using new service
  let calendarResult = { success: true };
  try {
    calendarResult = await calendarSync.markPastHearingsCompleted(
      matterId,
      req.firmId,
    );
    if (!calendarResult.success) {
      console.warn("⚠️ Calendar update failed:", calendarResult.message);
    }
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

// ============================================
// GET HEARINGS CALENDAR VIEW
// ============================================

/**
 * @desc    Get hearings in calendar format
 * @route   GET /api/v1/litigation/hearings-calendar
 * @access  Private
 */
exports.getHearingsCalendar = catchAsync(async (req, res, next) => {
  const { startDate, endDate, month, year } = req.query;
  const firmId = req.firmId;

  let start, end;

  if (startDate && endDate) {
    start = dayjs(startDate);
    end = dayjs(endDate);
  } else if (month && year) {
    // Specific month requested
    const m = parseInt(month);
    const y = parseInt(year);
    start = dayjs(`${y}-${m}-01`);
    end = dayjs(`${y}-${m}-01`).endOf("month");
  } else {
    // Default: include current month AND all future upcoming hearings
    const now = dayjs();
    start = now.startOf("month");
    end = now.endOf("month");

    // Also fetch all future hearings beyond current month
    req.fetchAllFutureHearings = true;
  }

  // Get all active litigation matters
  const matters = await Matter.find({
    firmId,
    matterType: "litigation",
    isDeleted: { $ne: true },
    status: { $in: ["active", "pending", "open"] },
  })
    .populate("client", "firstName lastName")
    .lean();

  const matterIds = matters.map((m) => m._id);

  const litigationDetails = await LitigationDetail.find({
    firmId,
    matterId: { $in: matterIds },
    hearings: { $exists: true, $ne: [] },
  })
    .populate("hearings.lawyerPresent", "firstName lastName")
    .lean();

  const litigationMap = {};
  litigationDetails.forEach((d) => {
    litigationMap[d.matterId] = d;
  });

  // Build calendar events
  const events = [];

  matters.forEach((matter) => {
    const litigation = litigationMap[matter._id];
    if (!litigation || !litigation.hearings) return;

    litigation.hearings.forEach((hearing) => {
      if (!hearing.date) return;

      const hearingDate = dayjs(hearing.date);
      const now = dayjs();

      let isIncluded = false;

      if (req.fetchAllFutureHearings) {
        // Include current month AND all future hearings
        isIncluded = hearingDate.isAfter(now.subtract(1, "day"));
      } else {
        // Original behavior: only include within date range
        isIncluded =
          hearingDate.isAfter(start.subtract(1, "day")) &&
          hearingDate.isBefore(end.add(1, "day"));
      }

      if (isIncluded) {
        events.push({
          id: hearing._id,
          matterId: matter._id,
          matterNumber: matter.matterNumber,
          suitNo: litigation.suitNo,
          courtName: litigation.courtName,
          judge: litigation.judge?.name,
          client: matter.client,
          date: hearing.date,
          purpose: hearing.purpose,
          outcome: hearing.outcome,
          status: hearing.outcome ? "completed" : "upcoming",
          lawyerPresent: hearing.lawyerPresent,
        });
      }
    });
  });

  // Group by date
  const calendarByDate = {};
  events.forEach((event) => {
    const dateKey = dayjs(event.date).format("YYYY-MM-DD");
    if (!calendarByDate[dateKey]) {
      calendarByDate[dateKey] = [];
    }
    calendarByDate[dateKey].push(event);
  });

  // Calculate counts
  const counts = {
    total: events.length,
    completed: events.filter((e) => e.outcome).length,
    upcoming: events.filter((e) => !e.outcome).length,
  };

  res.status(200).json({
    status: "success",
    data: {
      range: "calendar",
      dateRange: {
        start: start.toDate(),
        end: end.toDate(),
      },
      counts,
      hearings: events,
      calendarByDate,
    },
  });
});

// ============================================
// DOWNLOAD UPCOMING HEARINGS PDF
// ============================================

exports.downloadUpcomingHearingsPdf = catchAsync(async (req, res, next) => {
  const { range } = req.query; // 'this-week', 'next-week', 'this-month', 'all'
  const firmId = req.firmId;
  const path = require("path");

  const today = dayjs().startOf("day");
  let startDate, endDate, periodName;

  switch (range) {
    case "this-week":
      startDate = today;
      endDate = today.endOf("week");
      periodName = "This Week";
      break;
    case "next-week":
      startDate = today.add(1, "week").startOf("week");
      endDate = today.add(1, "week").endOf("week");
      periodName = "Next Week";
      break;
    case "this-month":
      startDate = today.startOf("month");
      endDate = today.endOf("month");
      periodName = "This Month";
      break;
    case "all":
      startDate = today;
      endDate = today.add(2, "month").endOf("month");
      periodName = "All Upcoming Hearings";
      break;
    default:
      startDate = today;
      endDate = today.endOf("week");
      periodName = "This Week";
  }

  const matters = await Matter.find({
    firmId,
    matterType: "litigation",
    isDeleted: { $ne: true },
    status: { $in: ["active", "pending", "open"] },
  })
    .populate("client", "firstName lastName")
    .populate("accountOfficer", "firstName lastName")
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
      // ONLY use nextHearingDate for upcoming hearings - NOT the old hearing date
      // If nextHearingDate doesn't exist or is in the past, skip this hearing
      if (!hearing.nextHearingDate) return;

      const hearingDate = dayjs(hearing.nextHearingDate);

      // Skip if nextHearingDate is in the past
      if (!hearingDate.isAfter(today, "day")) return;

      const isInRange =
        !hearingDate.isBefore(startDate, "day") &&
        !hearingDate.isAfter(endDate, "day");

      if (!isInRange) return;

      hearings.push({
        // Keep original date for reference (the actual hearing date that passed)
        originalDate: hearing.date,
        matterNumber: matter.matterNumber,
        matterTitle: matter.title,
        suitNo: litigation.suitNo,
        courtName: litigation.courtName,
        courtNo: litigation.courtNo,
        courtLocation: litigation.courtLocation,
        state: litigation.state,
        judge: litigation.judge?.[0]?.name,
        client: matter.client,
        accountOfficer: matter.accountOfficer,
        // Use nextHearingDate for display
        hearingDate: hearingDate.format("YYYY-MM-DD"),
        hearingDay: hearingDate.format("dddd"),
        hearingTime: "09:00 AM",
        purpose: hearing.purpose,
        outcome: hearing.outcome,
        nextHearingDate: hearing.nextHearingDate,
        lawyerPresent: hearing.lawyerPresent,
      });
    });
  });

  hearings.sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate));

  const Firm = require("../models/firmModel");
  const firm = await Firm.findById(firmId);

  await generateCauseListPdf(
    {
      hearings,
      firm,
      periodName,
      startDate: startDate.format("MMMM D, YYYY"),
      endDate: endDate.format("MMMM D, YYYY"),
      totalHearings: hearings.length,
    },
    res,
    path.resolve(__dirname, `../output/hearings-${range || "this-week"}-${Date.now()}.pdf`),
  );
});

// ============================================
// ADD LITIGATION STEP
// ============================================

exports.addLitigationStep = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const stepData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const maxOrder = litigationDetail.litigationSteps.reduce(
    (max, step) => Math.max(max, step.order || 0),
    0,
  );

  const newStep = {
    ...stepData,
    order: stepData.order ?? maxOrder + 1,
    createdAt: new Date(),
  };

  litigationDetail.litigationSteps.push(newStep);
  await litigationDetail.save();

  const addedStep = litigationDetail.litigationSteps[
    litigationDetail.litigationSteps.length - 1
  ];

  matter.lastActivityDate = new Date();
  await matter.save();

  res.status(201).json({
    status: "success",
    data: addedStep,
  });
});

// ============================================
// GET ALL LITIGATION STEPS
// ============================================

exports.getLitigationSteps = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const steps = litigationDetail.litigationSteps || [];

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  res.status(200).json({
    status: "success",
    data: sortedSteps,
  });
});

// ============================================
// UPDATE LITIGATION STEP
// ============================================

exports.updateLitigationStep = catchAsync(async (req, res, next) => {
  const { matterId, stepId } = req.params;
  const updateData = req.body;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const stepIndex = litigationDetail.litigationSteps.findIndex(
    (step) => step._id.toString() === stepId,
  );

  if (stepIndex === -1) {
    return next(new AppError("Step not found", 404));
  }

  const allowedUpdates = [
    "title",
    "description",
    "status",
    "dueDate",
    "priority",
    "assignedTo",
    "notes",
    "order",
  ];

  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      litigationDetail.litigationSteps[stepIndex][field] = updateData[field];
    }
  });

  await litigationDetail.save();

  matter.lastActivityDate = new Date();
  await matter.save();

  res.status(200).json({
    status: "success",
    data: litigationDetail.litigationSteps[stepIndex],
  });
});

// ============================================
// DELETE LITIGATION STEP
// ============================================

exports.deleteLitigationStep = catchAsync(async (req, res, next) => {
  const { matterId, stepId } = req.params;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const stepIndex = litigationDetail.litigationSteps.findIndex(
    (step) => step._id.toString() === stepId,
  );

  if (stepIndex === -1) {
    return next(new AppError("Step not found", 404));
  }

  litigationDetail.litigationSteps.splice(stepIndex, 1);
  await litigationDetail.save();

  matter.lastActivityDate = new Date();
  await matter.save();

  res.status(200).json({
    status: "success",
    message: "Step deleted successfully",
  });
});

// ============================================
// UPDATE LITIGATION STEP STATUS
// ============================================

exports.updateLitigationStepStatus = catchAsync(async (req, res, next) => {
  const { matterId, stepId } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "in-progress", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return next(new AppError("Invalid status value", 400));
  }

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  const stepIndex = litigationDetail.litigationSteps.findIndex(
    (step) => step._id.toString() === stepId,
  );

  if (stepIndex === -1) {
    return next(new AppError("Step not found", 404));
  }

  litigationDetail.litigationSteps[stepIndex].status = status;

  if (status === "completed") {
    litigationDetail.litigationSteps[stepIndex].completedDate = new Date();
  } else {
    litigationDetail.litigationSteps[stepIndex].completedDate = undefined;
  }

  await litigationDetail.save();

  matter.lastActivityDate = new Date();
  await matter.save();

  res.status(200).json({
    status: "success",
    data: litigationDetail.litigationSteps[stepIndex],
  });
});

// ============================================
// REORDER LITIGATION STEPS
// ============================================

exports.reorderLitigationSteps = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { stepIds } = req.body;

  if (!Array.isArray(stepIds)) {
    return next(new AppError("stepIds must be an array", 400));
  }

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  stepIds.forEach((id, index) => {
    const step = litigationDetail.litigationSteps.find(
      (s) => s._id.toString() === id,
    );
    if (step) {
      step.order = index;
    }
  });

  await litigationDetail.save();

  const sortedSteps = [...litigationDetail.litigationSteps].sort(
    (a, b) => a.order - b.order,
  );

  matter.lastActivityDate = new Date();
  await matter.save();

  res.status(200).json({
    status: "success",
    data: sortedSteps,
  });
});

// ============================================
// LITIGATION REPORT PDF GENERATION
// ============================================

/**
 * @desc    Generate litigation matter report PDF
 * @route   GET /api/v1/litigation/:matterId/report
 * @access  Private
 */
exports.generateLitigationReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const matter = await Matter.findOne({
    _id: matterId,
    firmId,
    matterType: "litigation",
    isDeleted: { $ne: true },
  })
    .populate("client", "firstName lastName email phone companyName")
    .populate("accountOfficer", "firstName lastName email");

  if (!matter) {
    return next(new AppError("No litigation matter found with that ID", 404));
  }

  const litigationDetail = await LitigationDetail.findOne({ matterId, firmId })
    .populate("hearings.lawyerPresent", "firstName lastName")
    .populate("hearings.preparedBy", "firstName lastName");

  const Firm = require("../models/firmModel");
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Litigation Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
  });

  pdf.init(res, path.resolve(__dirname, `../output/${matter.matterNumber}_litigation_report_${Date.now()}.pdf`));

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

  // Litigation Details
  if (litigationDetail) {
    pdf.addSection("Case Information");
    pdf.addField("Suit Number", litigationDetail.suitNo);
    pdf.addField("Court", litigationDetail.courtName?.replace(/_/g, " ").toUpperCase());
    pdf.addField("Court Location", litigationDetail.courtLocation);
    pdf.addField("State", litigationDetail.state);
    if (litigationDetail.judge?.length > 0) {
      pdf.addField("Judge", litigationDetail.judge.map(j => j.name).join(", "));
    }
    pdf.addField("Mode of Commencement", litigationDetail.modeOfCommencement?.replace(/_/g, " ").toUpperCase());
    pdf.addField("Filing Date", formatDate(litigationDetail.filingDate));

    // First Party
    if (litigationDetail.firstParty?.name?.length > 0) {
      pdf.addSubSection("First Party (Claimant/Plaintiff)");
      litigationDetail.firstParty.name.forEach(n => {
        pdf.addField("Name", n.name);
      });
      if (litigationDetail.firstParty.description) {
        pdf.addLongTextField("Description", litigationDetail.firstParty.description);
      }
    }

    // Second Party
    if (litigationDetail.secondParty?.name?.length > 0) {
      pdf.addSubSection("Second Party (Defendant)");
      litigationDetail.secondParty.name.forEach(n => {
        pdf.addField("Name", n.name);
      });
      if (litigationDetail.secondParty.description) {
        pdf.addLongTextField("Description", litigationDetail.secondParty.description);
      }
    }

    // Case Status
    pdf.addSection("Case Status");
    pdf.addStatusField("Current Stage", litigationDetail.currentStage);
    pdf.addField("Next Hearing Date", formatDate(litigationDetail.nextHearingDate));
    pdf.addField("Case Value", litigationDetail.caseValue?.amount ? formatCurrency(litigationDetail.caseValue.amount) : null);

    // Hearings
    if (litigationDetail.hearings?.length > 0) {
      pdf.addSection("Hearings");
      const upcomingHearings = litigationDetail.hearings.filter(h => new Date(h.date) >= new Date()).slice(0, 5);
      if (upcomingHearings.length > 0) {
        pdf.addSubSection("Upcoming Hearings");
        upcomingHearings.forEach(h => {
          pdf.addField(
            formatDate(h.date),
            `${h.purpose || "Hearing"} | ${h.outcome || "Pending"}`
          );
        });
      }
    }

    // Court Orders
    if (litigationDetail.courtOrders?.length > 0) {
      pdf.addSection("Court Orders");
      litigationDetail.courtOrders.slice(0, 10).forEach(order => {
        pdf.addField(
          formatDate(order.orderDate),
          `${order.orderType || "Order"} - ${order.description?.substring(0, 50) || ""}`,
          { color: getStatusColor(order.complianceStatus) }
        );
      });
    }

    // Litigation Steps
    if (litigationDetail.litigationSteps?.length > 0) {
      pdf.addSection("Case Progress");
      const completed = litigationDetail.litigationSteps.filter(s => s.status === "completed").length;
      pdf.addField("Progress", `${completed}/${litigationDetail.litigationSteps.length} steps completed`);
      litigationDetail.litigationSteps.forEach(step => {
        pdf.addField(step.title, step.status?.toUpperCase(), { color: getStatusColor(step.status) });
      });
    }
  }

  await pdf.generate();
});

module.exports = exports;
