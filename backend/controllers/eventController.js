// controllers/eventController.js
const Event = require("../models/eventModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Get all events
exports.getAllEvents = catchAsync(async (req, res, next) => {
  const events = await Event.find();
  res.status(200).json({
    status: "success",
    results: events.length,
    data: {
      events,
    },
  });
});

// Get a single event by ID
exports.getEventById = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next(new AppError("No event found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      event,
    },
  });
});

// Create a new event
exports.createEvent = catchAsync(async (req, res, next) => {
  const event = new Event({
    title: req.body.title,
    start: req.body.start,
    end: req.body.end,
  });

  const newEvent = await event.save();
  res.status(201).json({
    status: "success",
    data: {
      event: newEvent,
    },
  });
});

// Update an event
exports.updateEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!event) {
    return next(new AppError("No event found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      event,
    },
  });
});

// Delete an event
exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    return next(new AppError("No event found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
