const {
  CalendarEvent,
  EVENT_TYPES,
  EVENT_STATUS,
} = require("../models/calenderEvent");
const BlockedDate = require("../models/blockedDateModel");
const Matter = require("../models/matterModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ============================================
// HELPER FUNCTIONS
// ============================================

const buildFirmQuery = (req, additionalFilters = {}) => {
  return {
    firmId: req.user.firmId,
    isDeleted: false,
    ...additionalFilters,
  };
};

// ============================================
// CREATE CALENDAR EVENT
// ============================================

/**
 * @desc    Create a new calendar event
 * @route   POST /api/calendar/events
 * @access  Private
 */
exports.createEvent = catchAsync(async (req, res, next) => {
  const {
    eventType,
    startDateTime,
    endDateTime,
    matter,
    participants,
    allowConflicts,
    ...eventData
  } = req.body;

  // 1. Validate matter ownership (if matter provided)
  if (matter) {
    const matterExists = await Matter.findOne({
      _id: matter,
      firmId: req.user.firmId,
      isDeleted: false,
    });

    if (!matterExists) {
      return next(new AppError("Matter not found or access denied", 404));
    }
  }

  // 2. Check if date is blocked
  const blockCheck = await BlockedDate.isDateBlocked(
    req.user.firmId,
    req.user._id,
    new Date(startDateTime),
    new Date(endDateTime),
    eventType,
    req.user.role,
  );

  if (blockCheck.isBlocked) {
    return next(
      new AppError(
        blockCheck.message ||
          "This date/time is blocked and cannot be scheduled",
        400,
      ),
    );
  }

  // 3. Check for conflicts (if not allowed)
  if (!allowConflicts) {
    const participantIds = participants
      ? participants.map((p) => p.user)
      : [req.user._id];

    const conflicts = await CalendarEvent.findConflicts(
      req.user.firmId,
      participantIds,
      new Date(startDateTime),
      new Date(endDateTime),
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        status: "conflict",
        message: "Scheduling conflict detected",
        conflicts: conflicts.map((c) => ({
          eventId: c.eventId,
          title: c.title,
          startDateTime: c.startDateTime,
          endDateTime: c.endDateTime,
        })),
      });
    }
  }

  // 4. Create the event
  const event = await CalendarEvent.create({
    ...eventData,
    eventType,
    startDateTime,
    endDateTime,
    matter,
    participants,
    firmId: req.user.firmId,
    organizer: req.user._id,
    createdBy: req.user._id,
  });

  // 5. Populate references
  await event.populate([
    { path: "organizer", select: "firstName lastName email photo" },
    { path: "participants.user", select: "firstName lastName email photo" },
    { path: "matter", select: "matterNumber title matterType" },
  ]);

  res.status(201).json({
    status: "success",
    data: {
      event,
      warning: blockCheck.hasWarning ? blockCheck.message : null,
    },
  });
});

// ============================================
// GET ALL EVENTS (WITH FILTERS)
// ============================================

/**
 * @desc    Get all calendar events with filtering
 * @route   GET /api/calendar/events
 * @access  Private
 */
exports.getAllEvents = catchAsync(async (req, res, next) => {
  const {
    startDate,
    endDate,
    eventType,
    matter,
    status,
    organizer,
    participant,
    visibility,
    page = 1,
    limit = 100,
  } = req.query;

  const filter = buildFirmQuery(req);

  // Date range filter (most common query)
  if (startDate && endDate) {
    filter.startDateTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Other filters
  if (eventType) filter.eventType = eventType;
  if (matter) filter.matter = matter;
  if (status) filter.status = status;
  if (organizer) filter.organizer = organizer;
  if (visibility) filter.visibility = visibility;

  // Participant filter (user is in participants array)
  if (participant) {
    filter["participants.user"] = participant;
  }

  const skip = (page - 1) * limit;

  const events = await CalendarEvent.find(filter)
    .sort({ startDateTime: 1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("organizer", "firstName lastName email photo")
    .populate("participants.user", "firstName lastName email")
    .populate("matter", "matterNumber title matterType client")
    .lean();

  // Filter by visibility (user can only see events they're allowed to see)
  const visibleEvents = events.filter((event) => {
    if (event.visibility === "firm") return true;
    if (event.visibility === "team") {
      return (
        event.organizer._id.toString() === req.user._id.toString() ||
        event.participants.some(
          (p) => p.user._id.toString() === req.user._id.toString(),
        )
      );
    }
    if (event.visibility === "private") {
      return event.organizer._id.toString() === req.user._id.toString();
    }
    return false;
  });

  const total = await CalendarEvent.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: visibleEvents.length,
    total,
    page: Number(page),
    data: {
      events: visibleEvents,
    },
  });
});

// ============================================
// GET SINGLE EVENT
// ============================================

/**
 * @desc    Get single event by ID
 * @route   GET /api/calendar/events/:id
 * @access  Private
 */
exports.getEvent = catchAsync(async (req, res, next) => {
  const event = await CalendarEvent.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  )
    .populate("organizer", "firstName lastName email phone photo")
    .populate("participants.user", "firstName lastName email phone photo")
    .populate("matter", "matterNumber title matterType client accountOfficer")
    .populate("relatedEvents", "eventId title eventType startDateTime");

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  // Check if user can view this event
  if (!event.canView(req.user._id, req.user.firmId)) {
    return next(
      new AppError("You do not have permission to view this event", 403),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      event,
    },
  });
});

// ============================================
// UPDATE EVENT
// ============================================

/**
 * @desc    Update calendar event
 * @route   PATCH /api/calendar/events/:id
 * @access  Private
 */
exports.updateEvent = catchAsync(async (req, res, next) => {
  const { startDateTime, endDateTime, participants, ...updateData } = req.body;

  const event = await CalendarEvent.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  );

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  // Only organizer can update event
  if (!event.isOrganizer(req.user._id)) {
    return next(
      new AppError("Only the event organizer can update this event", 403),
    );
  }

  // If updating date/time, check for blocks and conflicts
  if (startDateTime || endDateTime) {
    const newStart = startDateTime
      ? new Date(startDateTime)
      : event.startDateTime;
    const newEnd = endDateTime ? new Date(endDateTime) : event.endDateTime;

    // Check blocked dates
    const blockCheck = await BlockedDate.isDateBlocked(
      req.user.firmId,
      req.user._id,
      newStart,
      newEnd,
      event.eventType,
      req.user.role,
    );

    if (blockCheck.isBlocked) {
      return next(new AppError(blockCheck.message, 400));
    }

    // Check conflicts
    const participantIds = participants
      ? participants.map((p) => p.user)
      : event.participants.map((p) => p.user);

    const conflicts = await CalendarEvent.findConflicts(
      req.user.firmId,
      participantIds,
      newStart,
      newEnd,
      event._id, // Exclude current event
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        status: "conflict",
        message: "Scheduling conflict detected",
        conflicts,
      });
    }

    event.startDateTime = newStart;
    event.endDateTime = newEnd;
  }

  // Update other fields
  Object.keys(updateData).forEach((key) => {
    event[key] = updateData[key];
  });

  if (participants) {
    event.participants = participants;
  }

  event.lastModifiedBy = req.user._id;
  await event.save();

  await event.populate([
    { path: "organizer", select: "firstName lastName email photo" },
    { path: "participants.user", select: "firstName lastName email" },
    { path: "matter", select: "matterNumber title" },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      event,
    },
  });
});

// ============================================
// DELETE EVENT (SOFT DELETE)
// ============================================

/**
 * @desc    Delete (cancel) calendar event
 * @route   DELETE /api/calendar/events/:id
 * @access  Private
 */
exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await CalendarEvent.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  );

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  // Only organizer can delete event
  if (!event.isOrganizer(req.user._id)) {
    return next(
      new AppError("Only the event organizer can delete this event", 403),
    );
  }

  await event.softDelete(req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ============================================
// RESTORE DELETED EVENT
// ============================================

/**
 * @desc    Restore a deleted event
 * @route   PATCH /api/calendar/events/:id/restore
 * @access  Private
 */
exports.restoreEvent = catchAsync(async (req, res, next) => {
  const event = await CalendarEvent.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
    isDeleted: true,
  });

  if (!event) {
    return next(new AppError("Deleted event not found", 404));
  }

  await event.restore();

  res.status(200).json({
    status: "success",
    data: {
      event,
    },
  });
});

// ============================================
// GET MY CALENDAR
// ============================================

/**
 * @desc    Get events for logged-in user
 * @route   GET /api/calendar/my-calendar
 * @access  Private
 */
exports.getMyCalendar = catchAsync(async (req, res, next) => {
  const { startDate, endDate, eventType, status } = req.query;

  const filter = buildFirmQuery(req);

  // Events where user is organizer OR participant
  filter.$or = [
    { organizer: req.user._id },
    { "participants.user": req.user._id },
  ];

  // Date range
  if (startDate && endDate) {
    filter.startDateTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (eventType) filter.eventType = eventType;
  if (status) filter.status = status;

  const events = await CalendarEvent.find(filter)
    .sort({ startDateTime: 1 })
    .populate("organizer", "firstName lastName")
    .populate("participants.user", "firstName lastName")
    .populate("matter", "matterNumber title")
    .lean();

  res.status(200).json({
    status: "success",
    results: events.length,
    data: {
      events,
    },
  });
});

// ============================================
// GET UPCOMING EVENTS
// ============================================

/**
 * @desc    Get upcoming events (next 7 days by default)
 * @route   GET /api/calendar/upcoming
 * @access  Private
 */
exports.getUpcomingEvents = catchAsync(async (req, res, next) => {
  const { days = 7, limit = 20 } = req.query;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + Number(days));

  const events = await CalendarEvent.find({
    firmId: req.user.firmId,
    isDeleted: false,
    status: { $in: [EVENT_STATUS.SCHEDULED, EVENT_STATUS.CONFIRMED] },
    startDateTime: {
      $gte: startDate,
      $lte: endDate,
    },
    $or: [
      { organizer: req.user._id },
      { "participants.user": req.user._id },
      { visibility: "firm" },
    ],
  })
    .sort({ startDateTime: 1 })
    .limit(Number(limit))
    .populate("organizer", "firstName lastName")
    .populate("matter", "matterNumber title matterType");

  res.status(200).json({
    status: "success",
    results: events.length,
    data: {
      events,
    },
  });
});

// ============================================
// GET EVENTS BY MATTER
// ============================================

/**
 * @desc    Get all events for a specific matter
 * @route   GET /api/calendar/matter/:matterId
 * @access  Private
 */
exports.getEventsByMatter = catchAsync(async (req, res, next) => {
  const { matterId } = req.params;

  // Verify matter ownership
  const matter = await Matter.findOne({
    _id: matterId,
    firmId: req.user.firmId,
    isDeleted: false,
  });

  if (!matter) {
    return next(new AppError("Matter not found", 404));
  }

  const events = await CalendarEvent.find(
    buildFirmQuery(req, { matter: matterId }),
  )
    .sort({ startDateTime: 1 })
    .populate("organizer", "firstName lastName")
    .populate("participants.user", "firstName lastName");

  res.status(200).json({
    status: "success",
    results: events.length,
    data: {
      events,
      matter: {
        matterNumber: matter.matterNumber,
        title: matter.title,
        matterType: matter.matterType,
      },
    },
  });
});

// ============================================
// UPDATE EVENT STATUS
// ============================================

/**
 * @desc    Update event status (confirm, complete, cancel)
 * @route   PATCH /api/calendar/events/:id/status
 * @access  Private
 */
exports.updateEventStatus = catchAsync(async (req, res, next) => {
  const { status, cancellationReason } = req.body;

  const event = await CalendarEvent.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  );

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  event.status = status;
  event.lastModifiedBy = req.user._id;

  if (status === EVENT_STATUS.CANCELLED) {
    event.cancelledBy = req.user._id;
    event.cancelledAt = Date.now();
    if (cancellationReason) {
      event.cancellationReason = cancellationReason;
    }
  }

  await event.save();

  res.status(200).json({
    status: "success",
    data: {
      event,
    },
  });
});

// ============================================
// RESPOND TO EVENT INVITATION
// ============================================

/**
 * @desc    Respond to event invitation (accept/decline)
 * @route   PATCH /api/calendar/events/:id/respond
 * @access  Private
 */
exports.respondToInvitation = catchAsync(async (req, res, next) => {
  const { responseStatus } = req.body; // accepted, declined, tentative

  const event = await CalendarEvent.findOne(
    buildFirmQuery(req, { _id: req.params.id }),
  );

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  // Find participant
  const participant = event.participants.find(
    (p) => p.user.toString() === req.user._id.toString(),
  );

  if (!participant) {
    return next(new AppError("You are not invited to this event", 403));
  }

  participant.responseStatus = responseStatus;
  participant.respondedAt = Date.now();

  await event.save();

  res.status(200).json({
    status: "success",
    message: `You have ${responseStatus} the invitation`,
    data: {
      event,
    },
  });
});

// ============================================
// GET CALENDAR STATISTICS
// ============================================

/**
 * @desc    Get calendar statistics
 * @route   GET /api/calendar/stats
 * @access  Private
 */
exports.getCalendarStats = catchAsync(async (req, res, next) => {
  const firmQuery = { firmId: req.user.firmId, isDeleted: false };

  // Total events
  const totalEvents = await CalendarEvent.countDocuments(firmQuery);

  // By event type
  const byType = await CalendarEvent.aggregate([
    { $match: firmQuery },
    {
      $group: {
        _id: "$eventType",
        count: { $sum: 1 },
      },
    },
  ]);

  // By status
  const byStatus = await CalendarEvent.aggregate([
    { $match: firmQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Upcoming events (next 7 days)
  const upcomingCount = await CalendarEvent.countDocuments({
    ...firmQuery,
    startDateTime: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // My events
  const myEvents = await CalendarEvent.countDocuments({
    ...firmQuery,
    $or: [{ organizer: req.user._id }, { "participants.user": req.user._id }],
  });

  res.status(200).json({
    status: "success",
    data: {
      totalEvents,
      upcomingCount,
      myEvents,
      byType,
      byStatus,
    },
  });
});

module.exports = exports;
