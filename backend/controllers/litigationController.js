const Matter = require("../models/matterModel");
const LitigationDetail = require("../models/litigationDetailModel");
const User = require("../models/userModel");
const BlockedDate = require("../models/blockedDateModel");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const AppError = require("../utils/appError");
const { getHearingPhaseInfo } = require("../utils/hearingPhase");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const path = require("path");
const {
  GenericPdfGenerator,
  getStatusColor,
  formatCurrency,
  formatDate,
} = require("../utils/generateGenericPdf");
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

const hasOwn = (value, key) =>
  Object.prototype.hasOwnProperty.call(value, key);

const sameHearingValue = (current, incoming, field) => {
  if (current == null || incoming == null) {
    return current == null && incoming == null;
  }

  if (field === "date" || field === "nextHearingDate") {
    const currentTime = new Date(current).getTime();
    const incomingTime = new Date(incoming).getTime();
    return Number.isFinite(currentTime) && currentTime === incomingTime;
  }

  if (Array.isArray(current) && Array.isArray(incoming)) {
    const currentIds = current.map(String).sort();
    const incomingIds = incoming.map(String).sort();
    return (
      currentIds.length === incomingIds.length &&
      currentIds.every((id, index) => id === incomingIds[index])
    );
  }

  return String(current) === String(incoming);
};

const isPrivilegedHearingUser = (user) =>
  Boolean(
    user?.isSuperAdmin?.() ||
      user?.isAdmin?.() ||
      user?.hasAdminLevel?.("admin") ||
      ["super_admin", "superadmin", "super-admin", "admin"].includes(
        user?.adminLevel,
      ) ||
      [
        "firm_admin",
        "managing_partner",
        "head_of_litigation",
        "admin",
        "super_admin",
        "superadmin",
        "super-admin",
      ].includes(user?.role),
  );

const validateLitigationStepAssignee = async (assignedTo, firmId) => {
  if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
    throw new AppError("Select an officer to assign this step to", 400);
  }

  const assigneeExists = await User.exists({
    _id: assignedTo,
    firmId,
    userType: "staff",
    isActive: true,
    isDeleted: { $ne: true },
  });

  if (!assigneeExists) {
    throw new AppError(
      "The selected officer is not an active staff member of this firm",
      400,
    );
  }
};

// ============================================
// HEARING DATE BLOCK CHECKER
// ============================================

/**
 * Checks both hearing.date and hearing.nextHearingDate against firm blocked dates.
 *
 * Runs each date through BlockedDate.isDateBlocked() independently so that a
 * blocked nextHearingDate is caught even when the primary hearing.date is fine.
 *
 * Returns the FIRST hard block found, or the first warning if no hard block exists.
 *
 * @param {string} firmId
 * @param {string} userId
 * @param {string} role        - user's primary role string
 * @param {object} hearingData - may contain `date` and/or `nextHearingDate`
 * @returns {{ isBlocked: boolean, hasWarning: boolean, field?: string, message?: string }}
 */
const checkHearingDatesAgainstBlocks = async (
  firmId,
  userId,
  role,
  hearingData,
) => {
  const checks = [];

  // Build check entry for primary hearing date
  if (hearingData.date) {
    const startOfDay = new Date(hearingData.date);
    startOfDay.setHours(9, 0, 0, 0);
    const endOfDay = new Date(hearingData.date);
    endOfDay.setHours(17, 0, 0, 0);

    checks.push({
      field: "Hearing Date",
      start: startOfDay,
      end: endOfDay,
    });
  }

  // Build check entry for next hearing date
  if (hearingData.nextHearingDate) {
    const startOfNext = new Date(hearingData.nextHearingDate);
    startOfNext.setHours(9, 0, 0, 0);
    const endOfNext = new Date(hearingData.nextHearingDate);
    endOfNext.setHours(17, 0, 0, 0);

    checks.push({
      field: "Next Hearing Date",
      start: startOfNext,
      end: endOfNext,
    });
  }

  let firstWarning = null;

  for (const check of checks) {
    const result = await BlockedDate.isDateBlocked(
      firmId,
      userId,
      check.start,
      check.end,
      "hearing", // eventType
      role,
    );

    // Hard block — abort immediately, do not save the hearing
    if (result.isBlocked) {
      return {
        isBlocked: true,
        hasWarning: false,
        field: check.field,
        message: `${check.field} falls on a blocked date: ${result.message}`,
        block: result.block || null,
      };
    }

    // Soft warning — record but keep checking remaining dates
    if (result.hasWarning && !firstWarning) {
      firstWarning = {
        isBlocked: false,
        hasWarning: true,
        field: check.field,
        message: `${check.field} warning: ${result.message}`,
      };
    }
  }

  // Return first warning if any, otherwise all clear
  if (firstWarning) return firstWarning;

  return { isBlocked: false, hasWarning: false };
};

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
    {
      path: "hearings.reportFiledBy",
      select: "firstName lastName email photo",
    },
    {
      path: "hearings.auditTrail.by",
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

  const litigationDetail = await LitigationDetail.findOne({
    matterId,
    firmId: req.firmId,
  });

  if (!litigationDetail) {
    return next(new AppError("Litigation details not found", 404));
  }

  litigationDetail.set(updateData);
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

  // Extract upcoming hearings from nextHearingDate or future hearing.date
  const upcomingHearings = [];

  matters.forEach((matter) => {
    const litigation = litigationMap[matter._id];
    if (!litigation || !litigation.hearings) return;

    litigation.hearings.forEach((hearing) => {
      const candidateDate = hearing.nextHearingDate || hearing.date;
      if (!candidateDate) return;

      const hearingDate = dayjs(candidateDate);

      // Include today and future hearings (exclude only past)
      if (hearingDate.isBefore(today, "day")) return;

      // No upper date cap — include ALL future hearings
      upcomingHearings.push({
        _id: hearing._id,
        date: hearing.date,
        purpose: hearing.purpose,
        outcome: hearing.outcome,
        notes: hearing.notes,
        nextHearingDate: hearing.nextHearingDate || candidateDate,
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

  // Deduplicate by matterId keeping the earliest upcoming hearing
  const deduped = [];
  const seen = new Map();
  for (const h of upcomingHearings) {
    const key = h.matterId?.toString();
    if (!key) {
      deduped.push(h);
      continue;
    }
    if (!seen.has(key)) {
      seen.set(key, h);
      deduped.push(h);
    } else {
      const existing = seen.get(key);
      if (new Date(h.displayDate) < new Date(existing.displayDate)) {
        const idx = deduped.findIndex((x) => x.matterId?.toString() === key);
        if (idx >= 0) deduped[idx] = h;
        seen.set(key, h);
      }
    }
  }

  // Sort by nextHearingDate — earliest first
  deduped.sort(
    (a, b) => new Date(a.displayDate) - new Date(b.displayDate),
  );

  // Apply limit
  const limitedHearings = deduped.slice(0, parseInt(limit));

  // Stats - use dayjs consistently to avoid timezone issues
  const now = dayjs();
  const todayStart = now.startOf("day");
  const todayEnd = now.endOf("day");
  const tomorrowStart = now.add(1, "day").startOf("day");
  const tomorrowEnd = now.add(1, "day").endOf("day");
  const thisWeekStart = now.startOf("week");
  const thisWeekEnd = now.endOf("week");
  const nextWeekStart = now.add(1, "week").startOf("week");
  const nextWeekEnd = now.add(1, "week").endOf("week");
  const thisMonthStart = now.startOf("month");
  const thisMonthEnd = now.endOf("month");

  const stats = {
    total: limitedHearings.length,
    today: limitedHearings.filter((h) => {
      const d = dayjs(h.displayDate);
      return d.isSame(now, "day");
    }).length,
    tomorrow: limitedHearings.filter((h) => {
      const d = dayjs(h.displayDate);
      return d.isSame(now.add(1, "day"), "day");
    }).length,
    thisWeek: limitedHearings.filter((h) => {
      const d = dayjs(h.displayDate);
      return d.isSameOrAfter(thisWeekStart) && d.isSameOrBefore(thisWeekEnd);
    }).length,
    nextWeek: limitedHearings.filter((h) => {
      const d = dayjs(h.displayDate);
      return d.isSameOrAfter(nextWeekStart) && d.isSameOrBefore(nextWeekEnd);
    }).length,
    thisMonth: limitedHearings.filter((h) => {
      const d = dayjs(h.displayDate);
      return d.isSameOrAfter(thisMonthStart) && d.isSameOrBefore(thisMonthEnd);
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
// ADD HEARING (WITH BLOCKED DATE CHECK + AUTO-CALENDAR SYNC)
// ============================================

exports.addHearing = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const hearingData = { ...req.body };
  const isHistoricalEntry = hearingData.historicalEntry === true;
  const allowedFields = new Set([
    "date",
    "purpose",
    "outcome",
    "notes",
    "nextHearingDate",
    "dateToBeCommunicated",
    "hearingNoticeRequired",
    "lawyerPresent",
    "historicalEntry",
  ]);
  const invalidFields = Object.keys(hearingData).filter(
    (field) => !allowedFields.has(field),
  );

  if (invalidFields.length > 0) {
    return next(
      new AppError(
        `Unsupported hearing fields: ${invalidFields.join(", ")}`,
        400,
      ),
    );
  }

  if (
    typeof hearingData.historicalEntry !== "undefined" &&
    typeof hearingData.historicalEntry !== "boolean"
  ) {
    return next(new AppError("Historical entry flag must be a boolean.", 400));
  }

  if (
    !isHistoricalEntry &&
    (hasOwn(hearingData, "outcome") || hasOwn(hearingData, "notes"))
  ) {
    return next(
      new AppError(
        "Outcome and notes can only be recorded using historical entry.",
        400,
      ),
    );
  }

  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.firmId,
    matterType: "litigation",
    isDeleted: false,
  }).populate("accountOfficer assignedLawyers");

  if (!matter) {
    return next(new AppError("Litigation matter not found", 404));
  }

  if (
    !hearingData.date ||
    !Number.isFinite(new Date(hearingData.date).getTime())
  ) {
    return next(new AppError("A valid hearing date is required", 400));
  }

  if (
    isHistoricalEntry &&
    new Date(hearingData.date).getTime() >= Date.now()
  ) {
    return next(
      new AppError(
        "Historical hearing date must be in the past. Use Add hearing for today or future dates.",
        400,
      ),
    );
  }

  if (
    isHistoricalEntry &&
    (typeof hearingData.outcome !== "string" ||
      !hearingData.outcome.trim() ||
      typeof hearingData.notes !== "string" ||
      !hearingData.notes.trim())
  ) {
    return next(
      new AppError(
        "An outcome and court notes are required for a historical hearing.",
        400,
      ),
    );
  }

  if (hearingData.nextHearingDate) {
    const nextDate = dayjs(hearingData.nextHearingDate);
    const hearingDate = dayjs(hearingData.date);
    const isInvalidHistoricalNextDate =
      isHistoricalEntry &&
      (!nextDate.isBefore(dayjs()) || !nextDate.isAfter(hearingDate));
    const isInvalidRegularNextDate =
      !isHistoricalEntry && !nextDate.isAfter(dayjs());
    if (
      !nextDate.isValid() ||
      isInvalidHistoricalNextDate ||
      isInvalidRegularNextDate
    ) {
      return next(
        new AppError(
          isHistoricalEntry
            ? "Historical adjourned date must be after the hearing date and in the past."
            : "Next hearing date must be in the future",
          400,
        ),
      );
    }
  }

  // ─── Blocked date check ───────────────────────────────────────────────────
  // Validates both hearing.date AND hearing.nextHearingDate (if provided)
  // against firm-wide and user-specific blocked date rules.
  // Hard blocks (isBlocked: true) abort with 400.
  // Soft warnings (hasWarning: true) are forwarded in the response.
  const blockCheck = isHistoricalEntry
    ? { isBlocked: false, hasWarning: false, message: null }
    : await checkHearingDatesAgainstBlocks(
        req.firmId,
        req.user._id,
        req.user.role,
        hearingData,
      );

  if (blockCheck.isBlocked) {
    return next(new AppError(blockCheck.message, 400));
  }
  // ─────────────────────────────────────────────────────────────────────────

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
    preparedBy: req.user.id,
  };

  if (isHistoricalEntry) {
    hearingWithUser.historicalEntry = true;
    hearingWithUser.historyEnteredAt = new Date();
    hearingWithUser.historyEnteredBy = req.user.id;
    hearingWithUser.lateReport = false;
    hearingWithUser.auditTrail = [
      {
        action: "historical_entry",
        by: req.user.id,
        at: hearingWithUser.historyEnteredAt,
        reason: "Historical hearing entered during matter onboarding",
      },
    ];
  }

  litigationDetail.hearings.push(hearingWithUser);

  if (hearingData.nextHearingDate) {
    litigationDetail.nextHearingDate = hearingData.nextHearingDate;
  }

  // Save the litigation detail
  await litigationDetail.save();

  // Update matter last activity
  matter.lastActivityDate = new Date();
  await matter.save();

  await litigationDetail.populate([
    { path: "hearings.preparedBy", select: "firstName lastName email photo" },
    {
      path: "hearings.historyEnteredBy",
      select: "firstName lastName email photo",
    },
    {
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    },
  ]);

  res.status(200).json({
    status: "success",
    message: "Hearing added",
    // Forward any soft warning so the client can display it as a toast/alert
    warning: blockCheck.hasWarning ? blockCheck.message : null,
    data: { litigationDetail },
  });
});

// ============================================
// GET MATTER HEARINGS
// ============================================

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
      path: "hearings.historyEnteredBy",
      select: "firstName lastName email photo",
    })
    .populate({
      path: "hearings.lawyerPresent",
      select: "firstName lastName email photo",
    })
    .populate({
      path: "hearings.reportFiledBy",
      select: "firstName lastName email photo",
    })
    .populate({
      path: "hearings.auditTrail.by",
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
// UPDATE HEARING (WITH BLOCKED DATE CHECK + AUTO-CALENDAR SYNC)
// ============================================

exports.updateHearing = catchAsync(async (req, res, next) => {
  const { matterId, hearingId } = req.params;
  const updateData = { ...req.body };

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

  const allowedFields = new Set([
    "date",
    "purpose",
    "outcome",
    "nextHearingDate",
    "dateToBeCommunicated",
    "hearingNoticeRequired",
    "hearingNoticeServed",
    "lawyerPresent",
    "notes",
    "lateReason",
    "editReason",
    "reason",
  ]);
  const invalidFields = Object.keys(updateData).filter(
    (field) => !allowedFields.has(field),
  );

  if (invalidFields.length > 0) {
    return next(
      new AppError(
        `Unsupported hearing fields: ${invalidFields.join(", ")}`,
        400,
      ),
    );
  }

  if (updateData.dateToBeCommunicated === true) {
    if (updateData.nextHearingDate) {
      return next(
        new AppError(
          "A next hearing date cannot be set while the date is marked TBC.",
          400,
        ),
      );
    }
    updateData.nextHearingDate = null;
  }

  // ════════════════════════════════════════════════════════════
  // BUSINESS RULES LOGIC
  // ════════════════════════════════════════════════════════════

  const now = dayjs();
  const hearingDateTime = dayjs(hearing.date);
  const phaseInfo = getHearingPhaseInfo(
    hearing.date,
    !!hearing.outcome,
    hearing.nextHearingDate,
    now.toDate(),
  );
  const {
    isBeforeHearing,
    isWithinGracePeriod,
    isAfterGracePeriod,
  } = phaseInfo;

  const user = req.user;
  const isPrivileged = isPrivilegedHearingUser(user);

  const reportFields = ["outcome", "notes"];
  const changedFields = Object.keys(updateData).filter(
    (field) =>
      !["lateReason", "editReason", "reason"].includes(field) &&
      !sameHearingValue(hearing[field], updateData[field], field),
  );
  const changedReportFields = reportFields.filter((field) =>
    changedFields.includes(field),
  );
  const hasReportFieldUpdate = changedReportFields.length > 0;

  const isFirstTimeFiling = hasReportFieldUpdate && !hearing.outcome;
  const isEditingExistingReport = hasReportFieldUpdate && !!hearing.outcome;
  const { canAssignLawyers } = phaseInfo;

  if (changedFields.includes("date")) {
    return next(
      new AppError("The original hearing date cannot be changed.", 400),
    );
  }

  const lockedNonReportFields = [
    "purpose",
    "hearingNoticeRequired",
    "hearingNoticeServed",
    "nextHearingDate",
    "dateToBeCommunicated",
  ];
  if (
    isAfterGracePeriod &&
    !isPrivileged &&
    changedFields.some((field) => lockedNonReportFields.includes(field))
  ) {
    return next(
      new AppError(
        "This hearing is locked. Only an Admin/Managing Partner can change its details.",
        403,
      ),
    );
  }

  if (changedFields.includes("lawyerPresent") && !canAssignLawyers) {
    return next(
      new AppError(
        "Lawyer assignment is only available for an upcoming hearing session.",
        403,
      ),
    );
  }

  // RULE 1: Cannot file report BEFORE hearing date/time
  if (hasReportFieldUpdate && isBeforeHearing) {
    return next(
      new AppError(
        `Cannot file report until after the hearing (${hearingDateTime.format("DD MMM YYYY HH:mm")}). You can update lawyer assignments and hearing notice flag.`,
        403,
      ),
    );
  }

  if (
    isFirstTimeFiling &&
    (typeof updateData.outcome !== "string" ||
      !updateData.outcome.trim() ||
      typeof updateData.notes !== "string" ||
      !updateData.notes.trim())
  ) {
    return next(
      new AppError(
        "An outcome and court notes are required to file a report.",
        400,
      ),
    );
  }

  // RULE 2: First time filing AFTER grace -> restrict to privileged users + reason
  if (isFirstTimeFiling && isAfterGracePeriod) {
    if (!isPrivileged) {
      return next(
        new AppError(
          "Report filing window has closed. Only Admin/Managing Partner can log a late report with justification.",
          403,
        ),
      );
    }
    if (
      !(typeof updateData.lateReason === "string" && updateData.lateReason.trim()) &&
      !(typeof updateData.reason === "string" && updateData.reason.trim())
    ) {
      return next(
        new AppError("A justification is required to log a late report.", 400),
      );
    }
    updateData.lateReason = updateData.lateReason || updateData.reason;
  }

  // RULE 2B: Editing existing report
  if (isEditingExistingReport) {
    if (isAfterGracePeriod && !isPrivileged) {
      return next(
        new AppError(
          "This report can no longer be edited. Contact an Admin/Managing Partner to make changes.",
          403,
        ),
      );
    }
    if (isAfterGracePeriod && isPrivileged) {
      if (
        !(typeof updateData.editReason === "string" && updateData.editReason.trim()) &&
        !(typeof updateData.reason === "string" && updateData.reason.trim())
      ) {
        return next(
          new AppError("A reason is required to edit a past report.", 400),
        );
      }
      updateData.editReason = updateData.editReason || updateData.reason;
    }
  }

  const effectiveOutcome = hasOwn(updateData, "outcome")
    ? updateData.outcome
    : hearing.outcome;
  const effectiveDateToBeCommunicated = hasOwn(
    updateData,
    "dateToBeCommunicated",
  )
    ? Boolean(updateData.dateToBeCommunicated)
    : Boolean(hearing.dateToBeCommunicated);
  const effectiveNextHearingDate = hasOwn(updateData, "nextHearingDate")
    ? updateData.nextHearingDate
    : hearing.nextHearingDate;

  // RULE 3: Adjourned outcome requires next hearing date or date to be communicated
  if (
    effectiveOutcome === "adjourned" &&
    !effectiveNextHearingDate &&
    !effectiveDateToBeCommunicated
  ) {
    return next(
      new AppError(
        'Next hearing date is required when outcome is "Adjourned" or mark as TBC',
        400,
      ),
    );
  }

  // RULE 4: Validate next hearing date is in future
  if (
    changedFields.includes("nextHearingDate") &&
    effectiveNextHearingDate
  ) {
    const nextDate = dayjs(effectiveNextHearingDate);
    const isHistoricalNextDateInvalid =
      hearing.historicalEntry &&
      (!nextDate.isBefore(now) || !nextDate.isAfter(hearingDateTime));
    const isRegularNextDateInvalid =
      !hearing.historicalEntry && !nextDate.isAfter(now);
    if (
      !nextDate.isValid() ||
      isHistoricalNextDateInvalid ||
      isRegularNextDateInvalid
    ) {
      return next(
        new AppError(
          hearing.historicalEntry
            ? "Historical adjourned date must be after the hearing date and in the past."
            : "Next hearing date must be in the future",
          400,
        ),
      );
    }
  }

  // RULE 5: Cannot remove outcome once filed (unless in grace)
  if (
    hearing.outcome &&
    hasOwn(updateData, "outcome") &&
    (updateData.outcome === null || updateData.outcome === "")
  ) {
    if (!isWithinGracePeriod) {
      return next(
        new AppError(
          "Cannot remove outcome after grace period. Please contact an administrator.",
          400,
        ),
      );
    }
  }

  // ─── Blocked date check ───────────────────────────────────────────────────
  // Only runs when date fields are actually part of this update request.
  // Checks the new date(s) — not the existing stored dates — so we don't
  // re-validate historical hearing dates that are already saved.
  const datesToCheck = {};
  if (changedFields.includes("date")) datesToCheck.date = updateData.date;
  if (changedFields.includes("nextHearingDate") && updateData.nextHearingDate)
    datesToCheck.nextHearingDate = updateData.nextHearingDate;

  let hearingBlockWarning = null;

  if (
    Object.keys(datesToCheck).length > 0 &&
    !hearing.historicalEntry
  ) {
    const blockCheck = await checkHearingDatesAgainstBlocks(
      req.firmId,
      req.user._id,
      req.user.role,
      datesToCheck,
    );

    if (blockCheck.isBlocked) {
      return next(new AppError(blockCheck.message, 400));
    }

    if (blockCheck.hasWarning) {
      hearingBlockWarning = blockCheck.message;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ════════════════════════════════════════════════════════════
  // PROCEED WITH UPDATE
  // ════════════════════════════════════════════════════════════

  if (hasReportFieldUpdate) {
    const reportDiff = Object.fromEntries(
      changedReportFields.map((field) => [
        field,
        {
          from: hearing[field] ?? null,
          to: updateData[field] ?? null,
        },
      ]),
    );
    const action = isFirstTimeFiling
      ? isAfterGracePeriod
        ? "late_filed"
        : "filed"
      : "edited";
    const reason =
      updateData.lateReason || updateData.editReason || updateData.reason || null;

    if (!Array.isArray(hearing.auditTrail)) {
      hearing.auditTrail = [];
    }
    hearing.auditTrail.push({
      action,
      by: user._id,
      at: new Date(),
      reason,
      diff: reportDiff,
    });
  }

  Object.keys(updateData).forEach((key) => {
    if (key === "lateReason" || key === "editReason" || key === "reason") {
      return;
    }
    hearing[key] = updateData[key];
  });

  if (isFirstTimeFiling) {
    hearing.lateReport = isAfterGracePeriod;
    hearing.reportFiledAt = new Date();
    hearing.reportFiledBy = user._id;
    if (isAfterGracePeriod) {
      hearing.lateReason =
        updateData.lateReason || updateData.reason || hearing.lateReason;
    }
  }

  if (isEditingExistingReport && isAfterGracePeriod && isPrivileged) {
    hearing.editReason = updateData.editReason || updateData.reason || hearing.editReason;
  }

  // Sync matter-level nextHearingDate with hearing's nextHearingDate
  if (updateData.nextHearingDate) {
    litigationDetail.nextHearingDate = updateData.nextHearingDate;
  }

  // Save the litigation detail
  await litigationDetail.save();

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
    { path: "hearings.reportFiledBy", select: "firstName lastName email photo" },
    { path: "hearings.auditTrail.by", select: "firstName lastName email photo" },
  ]);

  res.status(200).json({
    status: "success",
    message: "Hearing updated",
    // Forward any soft warning so the client can display it as a toast/alert
    warning: hearingBlockWarning,
    data: { litigationDetail },
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
    return next(new AppError("Litigation not found", 404));
  }

  // Find the hearing before deleting
  const hearing = litigationDetail.hearings.id(hearingId);
  if (!hearing) {
    return next(new AppError("Hearing not found", 404));
  }

  if (hearing.outcome) {
    return next(
      new AppError(
        "A hearing with a filed report cannot be deleted. Contact an Admin/Managing Partner if it must be removed.",
        403,
      ),
    );
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

    const futureHearingDates = litigationDetail.hearings
      .filter((h) => new Date(h.date) > now)
      .map((h) => new Date(h.date))
      .sort((a, b) => a - b);

    litigationDetail.nextHearingDate =
      futureNextHearingDates[0] ?? futureHearingDates[0] ?? null;
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
    message: "Hearing deleted",
    data: { litigationDetail },
  });
});

// ============================================
// ADD COURT ORDER (WITH AUTO-DEADLINE)
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

  // AUTO-SYNC: Create deadline if compliance date exists using service
  const newOrder =
    litigationDetail.courtOrders[litigationDetail.courtOrders.length - 1];

  res.status(200).json({
    status: "success",
    message: "Court order added",
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

const getProcessCollection = (
  litigationDetail,
  party,
  partyIndex,
  otherPartyIndex,
) => {
  const numericPartyIndex =
    partyIndex !== undefined ? Number(partyIndex) : undefined;
  const numericOtherPartyIndex =
    otherPartyIndex !== undefined ? Number(otherPartyIndex) : undefined;

  if (
    (numericPartyIndex !== undefined &&
      (!Number.isInteger(numericPartyIndex) || numericPartyIndex < 0)) ||
    (numericOtherPartyIndex !== undefined &&
      (!Number.isInteger(numericOtherPartyIndex) ||
        numericOtherPartyIndex < 0))
  ) {
    return null;
  }

  if (party === "otherParty") {
    const partyGroup =
      litigationDetail.otherParty?.[numericOtherPartyIndex ?? 0];
    if (!partyGroup) return null;
    if (numericPartyIndex === undefined) {
      return partyGroup.processesFiled;
    }
    return partyGroup.name?.[numericPartyIndex]?.processesFiled;
  }

  const partyGroup = litigationDetail[party];
  if (!partyGroup) return null;
  if (numericPartyIndex === undefined) {
    return partyGroup.processesFiled;
  }
  return partyGroup.name?.[numericPartyIndex]?.processesFiled;
};

exports.addProcessFiled = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const { party, partyIndex, otherPartyIndex, processData } = req.body;

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

  const processCollection = getProcessCollection(
    litigationDetail,
    party,
    partyIndex,
    otherPartyIndex,
  );
  if (!processCollection) {
    return next(new AppError("Party not found for this process", 404));
  }
  processCollection.push(processData);
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
// UPDATE PROCESS FILED
// ============================================

exports.updateProcessFiled = catchAsync(async (req, res, next) => {
  const { matterId, party, processIndex } = req.params;
  const { partyIndex, otherPartyIndex } = req.query;
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

  const processCollection = getProcessCollection(
    litigationDetail,
    party,
    partyIndex,
    otherPartyIndex,
  );
  const numericProcessIndex = Number(processIndex);
  if (
    !processCollection ||
    !Number.isInteger(numericProcessIndex) ||
    numericProcessIndex < 0 ||
    numericProcessIndex >= processCollection.length
  ) {
    return next(new AppError("Process not found", 404));
  }

  processCollection[numericProcessIndex].set(processData);

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
  const { partyIndex, otherPartyIndex } = req.query;

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

  const processCollection = getProcessCollection(
    litigationDetail,
    party,
    partyIndex,
    otherPartyIndex,
  );
  const numericProcessIndex = Number(processIndex);
  if (
    !processCollection ||
    !Number.isInteger(numericProcessIndex) ||
    numericProcessIndex < 0 ||
    numericProcessIndex >= processCollection.length
  ) {
    return next(new AppError("Process not found", 404));
  }

  processCollection.splice(numericProcessIndex, 1);

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
      const candidateDate = hearing.nextHearingDate || hearing.date;
      if (!candidateDate) return;

      const hearingDate = dayjs(candidateDate);

      // Skip only if hearing date is before today
      if (hearingDate.isBefore(today, "day")) return;

      const isInRange =
        !hearingDate.isBefore(startDate, "day") &&
        !hearingDate.isAfter(endDate, "day");

      if (!isInRange) return;

      hearings.push({
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

  // Deduplicate by matter
  const dedupedPdf = [];
  const seenPdf = new Map();
  for (const h of hearings) {
    const key = h.matterNumber || h.suitNo;
    if (!key) {
      dedupedPdf.push(h);
      continue;
    }
    if (!seenPdf.has(key)) {
      seenPdf.set(key, h);
      dedupedPdf.push(h);
    } else {
      const existing = seenPdf.get(key);
      if (new Date(h.hearingDate) < new Date(existing.hearingDate)) {
        const idx = dedupedPdf.findIndex(
          (x) => (x.matterNumber || x.suitNo) === key,
        );
        if (idx >= 0) dedupedPdf[idx] = h;
        seenPdf.set(key, h);
      }
    }
  }

  dedupedPdf.sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate));

  const Firm = require("../models/firmModel");
  const firm = await Firm.findById(firmId);

  await generateCauseListPdf(
    {
      hearings: dedupedPdf,
      firm,
      periodName,
      startDate: startDate.format("MMMM D, YYYY"),
      endDate: endDate.format("MMMM D, YYYY"),
      totalHearings: dedupedPdf.length,
    },
    res,
    path.resolve(
      __dirname,
      `../output/hearings-${range || "this-week"}-${Date.now()}.pdf`,
    ),
  );
});

// ============================================
// ADD LITIGATION STEP
// ============================================

exports.getMyLitigationSteps = catchAsync(async (req, res) => {
  const litigationDetails = await LitigationDetail.find({
    firmId: req.firmId,
    isDeleted: { $ne: true },
    litigationSteps: {
      $elemMatch: {
        assignedTo: req.user._id,
        status: { $in: ["pending", "in-progress"] },
      },
    },
  })
    .select("matterId suitNo litigationSteps")
    .populate({
      path: "matter",
      select: "matterNumber title",
      match: { firmId: req.firmId, isDeleted: { $ne: true } },
    })
    .populate({
      path: "litigationSteps.assignedTo",
      select: "firstName lastName",
    })
    .lean();

  const steps = litigationDetails.flatMap((detail) => {
    if (!detail.matter) return [];

    return (detail.litigationSteps || [])
      .filter(
        (step) =>
          String(step.assignedTo?._id || step.assignedTo) ===
            String(req.user._id) &&
          ["pending", "in-progress"].includes(step.status),
      )
      .map((step) => ({
        ...step,
        matterId: detail.matterId,
        matter: detail.matter,
        suitNo: detail.suitNo,
      }));
  });

  steps.sort((left, right) => {
    const leftDueDate = left.dueDate
      ? new Date(left.dueDate).getTime()
      : Number.POSITIVE_INFINITY;
    const rightDueDate = right.dueDate
      ? new Date(right.dueDate).getTime()
      : Number.POSITIVE_INFINITY;
    return leftDueDate - rightDueDate;
  });

  res.status(200).json({
    status: "success",
    results: steps.length,
    data: steps,
  });
});

exports.addLitigationStep = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;
  const stepData = req.body;
  await validateLitigationStepAssignee(stepData.assignedTo, req.firmId);

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

  const addedStep =
    litigationDetail.litigationSteps[
      litigationDetail.litigationSteps.length - 1
    ];
  await litigationDetail.populate({
    path: "litigationSteps.assignedTo",
    select: "firstName lastName",
  });

  matter.lastActivityDate = new Date();
  await matter.save();

  res.status(201).json({
    status: "success",
    data: litigationDetail.litigationSteps.find(
      (step) => step._id.toString() === addedStep._id.toString(),
    ),
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

  await litigationDetail.populate({
    path: "litigationSteps.assignedTo",
    select: "firstName lastName",
  });
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

  if (hasOwn(updateData, "assignedTo")) {
    await validateLitigationStepAssignee(updateData.assignedTo, req.firmId);
  }

  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      litigationDetail.litigationSteps[stepIndex][field] = updateData[field];
    }
  });

  await litigationDetail.save();
  await litigationDetail.populate({
    path: "litigationSteps.assignedTo",
    select: "firstName lastName",
  });

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
  await litigationDetail.populate({
    path: "litigationSteps.assignedTo",
    select: "firstName lastName",
  });

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
  await litigationDetail.populate({
    path: "litigationSteps.assignedTo",
    select: "firstName lastName",
  });

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
// SPLICED INTO litigationController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
// SPLICED INTO litigationController.js by _splice.js.
// Contract: this body must END with the function's closing `}` (no `);`).
// The `);` that closes the catchAsync wrapper comes from the splicer.
exports.generateLitigationReportPdf = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const { matterId } = req.params;

  const Firm = require("../models/firmModel");
  const { COLORS, formatCurrency } = require("../utils/generateGenericPdf");

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

  const d = (await LitigationDetail.findOne({ matterId, firmId })) || {};
  const firm = await Firm.findById(firmId);

  const pdf = new GenericPdfGenerator({
    title: "Litigation Matter Report",
    headerTitle: "Litigation Matter Report",
    firmName: firm?.name || "Law Firm",
    matterNumber: matter?.matterNumber || "",
    subtitle: matter?.title || "",
    firmContact: buildFirmContact(firm),
  });

  pdf.init(
    res,
    path.resolve(
      __dirname,
      `../output/${matter.matterNumber}_litigation_report_${Date.now()}.pdf`,
    ),
  );
  pdf.addHeader();

  // ── Helpers (self-contained per this report) ──────────────────────────────
  const h = (v) => (v == null || String(v).trim() === "" ? "—" : v);
  const titleCase = (v) =>
    String(v || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const labelOf = (map, v) => (v == null || v === "" ? "—" : map[v] || titleCase(v));
  const fmtDate = (v) => (v ? formatDate(v) : "—");
  const money = (m) => {
    if (m == null) return "—";
    if (typeof m === "object" && m.amount != null)
      return formatCurrency(m.amount, m.currency || "NGN");
    if (typeof m === "number") return formatCurrency(m, "NGN");
    return "—";
  };
  const namesOf = (val) =>
    Array.isArray(val)
      ? (val || []).map((p) => p?.name || p).filter(Boolean).join(", ") || "—"
      : h(val);
  const personName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";
  const clientName = (c) =>
    c?.companyName ||
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    c?.email ||
    "—";
  const statusAccent = (s) => {
    const x = String(s || "").toLowerCase();
    if (["completed", "won", "settled", "closed", "complied"].includes(x)) return COLORS.success;
    if (["active", "pending", "on-hold", "scheduled", "in-progress"].includes(x)) return COLORS.info;
    if (["lost", "withdrawn", "archived", "dismissed", "struck-out", "not-complied", "cancelled"].includes(x)) return COLORS.danger;
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

  // ── Label maps (from litigationDetailModel enums) ─────────────────────────
  const LitigationCourt = {
    "supreme court": "Supreme Court",
    "court of appeal": "Court of Appeal",
    "federal high court": "Federal High Court",
    "high court": "High Court",
    "national industrial court": "National Industrial Court",
    "sharia courts of appeal": "Sharia Courts of Appeal",
    "customary court of appeal": "Customary Court of Appeal",
    "magistrate court": "Magistrate Court",
    "customary court": "Customary Court",
    "sharia court": "Sharia Court",
    "area court": "Area Court",
    coroner: "Coroner",
    tribunal: "Tribunal",
    "election tribunal": "Election Tribunal",
    "code of conduct tribunal": "Code of Conduct Tribunal",
    "tax appeal tribunal": "Tax Appeal Tribunal",
    "rent tribunal": "Rent Tribunal",
    others: "Other",
  };
  const LitigationStage = {
    "pre-trial": "Pre-Trial",
    trial: "Trial",
    judgment: "Judgment",
    appeal: "Appeal",
    execution: "Execution",
    settled: "Settled",
    closed: "Closed",
  };
  const LitigationModeOfCommencement = {
    "writ of summons": "Writ of Summons",
    "originating summons": "Originating Summons",
    "originating motion": "Originating Motion",
    petition: "Petition",
    information: "Information",
    charge: "Charge",
    complaint: "Complaint",
    indictment: "Indictment",
    application: "Application",
    "notice of appeal": "Notice of Appeal",
    "notice of application": "Notice of Application",
    other: "Other",
  };
  const LitigationOutcome = {
    won: "Won",
    lost: "Lost",
    "partially-won": "Partially Won",
    dismissed: "Dismissed",
    "struck-out": "Struck Out",
    pending: "Pending",
  };
  const LitigationAppealStatus = {
    pending: "Pending",
    won: "Won",
    lost: "Lost",
    withdrawn: "Withdrawn",
    dismissed: "Dismissed",
  };

  // ── Matter overview (KPI cards) ───────────────────────────────────────────
  pdf.addSection("Matter Overview");
  pdf.addKpiCards([
    { label: "Status", value: titleCase(matter.status), accent: statusAccent(matter.status) },
    { label: "Priority", value: titleCase(matter.priority), accent: COLORS.warning },
    { label: "Stage", value: labelOf(LitigationStage, d.currentStage), accent: COLORS.info },
    { label: "Next Hearing", value: fmtDate(d.nextHearingDate), accent: COLORS.gold },
  ]);

  pdf.addKeyValueGrid(
    [
      { label: "Matter Number", value: matter.matterNumber, bold: true },
      { label: "Status", value: titleCase(matter.status), bold: true },
      { label: "Priority", value: titleCase(matter.priority) },
      { label: "Date Opened", value: fmtDate(matter.dateOpened) },
      { label: "Expected Closure", value: fmtDate(matter.expectedClosureDate) },
      { label: "Billing Type", value: titleCase(matter.billingType) },
      {
        label: "Estimated Value",
        value:
          matter.estimatedValue != null
            ? formatCurrency(matter.estimatedValue, matter.currency || "NGN")
            : h(matter.estimatedValue),
      },
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
      { label: "Account Officer(s)", value: (matter.accountOfficer || []).map(personName).join(", ") || "—" },
      { label: "Reference", value: matter.officeFileNo || "—" },
    ],
    { cols: 2 },
  );

  // ── Case information ──────────────────────────────────────────────────────
  pdf.addSection("Case Information");
  pdf.addKeyValueGrid(
    [
      { label: "Suit Number", value: h(d.suitNo), bold: true },
      { label: "Court", value: labelOf(LitigationCourt, d.courtName) },
      { label: "Court Location", value: h(d.courtLocation) },
      { label: "State", value: h(d.state) },
      { label: "Division", value: h(d.division) },
      { label: "Mode of Commencement", value: labelOf(LitigationModeOfCommencement, d.modeOfCommencement) },
      { label: "Filing Date", value: fmtDate(d.filingDate) },
      { label: "Service Date", value: fmtDate(d.serviceDate) },
    ],
    { cols: 2 },
  );

  if ((d.judge || []).length)
    pdf.addLongTextField("Judge(s)", (d.judge || []).map((j) => j.name).join(", "));

  // ── Parties ───────────────────────────────────────────────────────────────
  pdf.addSection("Parties");
  const addPartyProcesses = (processes) => {
    if (!processes?.length) return;
    pdf.addDataTable(
      ["Process", "Filing Date", "Status", "Motion Outcome", "Decision Date"],
      processes.map((process) => [
        process.name || "—",
        fmtDate(process.filingDate),
        titleCase(process.status || "pending"),
        process.motionOutcome ? titleCase(process.motionOutcome) : "—",
        fmtDate(process.decisionDate),
      ]),
      { widths: [1.7, 1, 0.9, 1, 1], statusColumns: [2, 3] },
    );
  };

  [
    { title: "First Party (Claimant/Plaintiff)", p: d.firstParty },
    { title: "Second Party (Defendant/Respondent)", p: d.secondParty },
  ].forEach(({ title, p }) => {
    if (p?.name?.length) {
      pdf.addSubSection(title);
      if (p.description) pdf.addLongTextField("Description", p.description);
      p.name.forEach((member) => {
        pdf.addField("Party", namesOf([member]));
        addPartyProcesses(member.processesFiled);
        if (p.name.length === 1) addPartyProcesses(p.processesFiled);
      });
    }
    if (p?.processesFiled?.length && p.name?.length !== 1) {
      pdf.addSubSection(`${title} — unassigned legacy filings`);
      addPartyProcesses(p.processesFiled);
    }
  });

  if ((d.otherParty || []).length) {
    pdf.addSection("Other Parties");
    (d.otherParty || []).forEach((p) => {
      if (p?.name?.length) {
        pdf.addSubSection("Party");
        if (p.description) pdf.addLongTextField("Description", p.description);
        p.name.forEach((member) => {
          pdf.addField("Party", namesOf([member]));
          addPartyProcesses(member.processesFiled);
          if (p.name.length === 1) addPartyProcesses(p.processesFiled);
        });
      }
      if (p.processesFiled?.length && p.name?.length !== 1) {
        pdf.addSubSection("Unassigned legacy filings");
        addPartyProcesses(p.processesFiled);
      }
    });
  }

  // ── Case status ───────────────────────────────────────────────────────────
  pdf.addSection("Case Status");
  pdf.addKeyValueGrid(
    [
      { label: "Current Stage", value: labelOf(LitigationStage, d.currentStage), bold: true },
      { label: "Next Hearing Date", value: fmtDate(d.nextHearingDate) },
      { label: "Last Hearing Date", value: fmtDate(d.lastHearingDate) },
      { label: "Total Hearings", value: String(d.totalHearings ?? 0) },
      { label: "Landmark Case", value: d.isLandmark || matter.isLandmark ? "Yes" : "No" },
      { label: "Citation Reference", value: h(d.citationReference) },
    ],
    { cols: 2 },
  );

  // ── Hearings ──────────────────────────────────────────────────────────────
  if ((d.hearings || []).length) {
    const hearings = (d.hearings || [])
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const upcoming = hearings.filter((x) => new Date(x.date) >= new Date());
    pdf.addSection("Hearings");
    pdf.addSubSection("Recent Hearings");
    pdf.addDataTable(
      ["Date", "Purpose", "Outcome / Notes"],
      hearings.slice(0, 12).map((x) => [
        fmtDate(x.date),
        h(x.purpose),
        h(x.outcome),
      ]),
      { widths: [1.3, 2, 3.3] },
    );
    if (upcoming.length) {
      pdf.addSubSection("Upcoming Hearings");
      pdf.addDataTable(
        ["Date", "Purpose"],
        upcoming.slice(0, 5).map((x) => [fmtDate(x.date), h(x.purpose)]),
        { widths: [1.4, 5] },
      );
    }
  }

  // ── Court orders ──────────────────────────────────────────────────────────
  if ((d.courtOrders || []).length) {
    pdf.addSection("Court Orders");
    pdf.addDataTable(
      ["Order Date", "Description", "Status"],
      (d.courtOrders || []).slice(0, 12).map((o) => [
        fmtDate(o.orderDate),
        h(o.description),
        titleCase(o.complianceStatus || "pending"),
      ]),
      { widths: [1.4, 3.6, 1.3], statusColumns: [2] },
    );
  }

  // ── Case progress ─────────────────────────────────────────────────────────
  if ((d.litigationSteps || []).length) {
    pdf.addSection("Case Progress");
    pdf.addDataTable(
      ["Step", "Due Date", "Completed", "Status"],
      (d.litigationSteps || [])
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((s) => [
          h(s.title),
          fmtDate(s.dueDate),
          fmtDate(s.completedDate),
          titleCase(s.status || "pending"),
        ]),
      { widths: [2.6, 1.3, 1.3, 1.2], statusColumns: [3] },
    );
  }

  // ── Applicable law & issues ───────────────────────────────────────────────
  if ((d.applicableLaws || []).length || (d.legalIssues || []).length) {
    pdf.addSection("Legal Framework");
    if ((d.applicableLaws || []).length) {
      pdf.addSubSection("Applicable Laws");
      (d.applicableLaws || []).forEach((law) => pdf.addField("Law", law));
    }
    if ((d.legalIssues || []).length) {
      pdf.addSubSection("Legal Issues");
      (d.legalIssues || []).forEach((issue) => pdf.addField("Issue", issue));
    }
  }

  // ── Precedents ────────────────────────────────────────────────────────────
  if ((d.precedents || []).length) {
    pdf.addSection("Precedents");
    pdf.addDataTable(
      ["Case", "Citation", "Relevance"],
      (d.precedents || []).map((p) => [
        p.caseName || "—",
        p.citation || "—",
        p.relevance || "—",
      ]),
      { widths: [2, 2, 2.6] },
    );
  }

  // ── Judgment ──────────────────────────────────────────────────────────────
  if (d.judgment) {
    pdf.addSection("Judgment");
    pdf.addKeyValueGrid(
      [
        { label: "Judgment Date", value: fmtDate(d.judgment.judgmentDate) },
        { label: "Outcome", value: labelOf(LitigationOutcome, d.judgment.outcome) },
        { label: "Damages", value: money(d.judgment.damages) },
        { label: "Costs", value: money(d.judgment.costs) },
      ],
      { cols: 2 },
    );
    if (d.judgment.judgmentSummary)
      pdf.addLongTextField("Judgment Summary", d.judgment.judgmentSummary);
  }

  // ── Appeal ────────────────────────────────────────────────────────────────
  if (d.appeal?.isAppealed) {
    pdf.addSection("Appeal");
    pdf.addKeyValueGrid(
      [
        { label: "Appeal Date", value: fmtDate(d.appeal.appealDate) },
        { label: "Appeal Court", value: h(d.appeal.appealCourt) },
        { label: "Appeal Suit Number", value: h(d.appeal.appealSuitNo) },
        { label: "Appeal Status", value: labelOf(LitigationAppealStatus, d.appeal.appealStatus) },
      ],
      { cols: 2 },
    );
  }

  // ── Settlement ────────────────────────────────────────────────────────────
  if (d.settlement?.isSettled) {
    pdf.addSection("Settlement");
    pdf.addKeyValueGrid(
      [
        { label: "Settlement Date", value: fmtDate(d.settlement.settlementDate) },
        { label: "Settlement Amount", value: money(d.settlement.settlementAmount) },
      ],
      { cols: 2 },
    );
    if (d.settlement.settlementTerms)
      pdf.addLongTextField("Settlement Terms", d.settlement.settlementTerms);
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
}
);

module.exports = exports;
