// controllers/eventController.js
const Event = require("../models/eventModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/**
 * Get all events for a firm
 */
exports.getAllEvents = catchAsync(async (req, res, next) => {
  const events = await Event.find({ firmId: req.firmId });

  res.status(200).json({
    message: "success",
    results: events.length,
    data: events,
  });
});

/**
 * Get a single event (tenant-safe)
 */
exports.getEventById = catchAsync(async (req, res, next) => {
  const event = await Event.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!event) {
    return next(new AppError("No event found with that ID", 404));
  }

  res.status(200).json({
    message: "success",
    data: event,
  });
});

/**
 * Create a new event (inject firmId)
 */
exports.createEvent = catchAsync(async (req, res, next) => {
  const newEvent = await Event.create({
    ...req.body,
    firmId: req.firmId, // 🔐 enforce tenancy
  });

  res.status(201).json({
    message: "success",
    data: newEvent,
  });
});

/**
 * Update an event (tenant-safe)
 */
exports.updateEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findOneAndUpdate(
    {
      _id: req.params.id,
      firmId: req.firmId,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!event) {
    return next(new AppError("No event found with that ID", 404));
  }

  res.status(200).json({
    message: "success",
    data: event,
  });
});

/**
 * Delete an event (tenant-safe)
 */
exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findOneAndDelete({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!event) {
    return next(new AppError("No event found with that ID", 404));
  }

  res.status(204).json({
    message: "success",
    data: null,
  });
});
