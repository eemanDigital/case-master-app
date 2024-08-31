const Note = require("../models/noteModel");
const catchAsync = require("../utils/catchAsync"); // Assuming you have a catchAsync utility
const AppError = require("../utils/appError"); // Assuming you have an AppError utility

// Create a new note
exports.createNote = catchAsync(async (req, res, next) => {
  const note = await Note.create({
    title: req.body.title,
    content: req.body.content,
    user: req.user.id, // Assuming user ID is available in req.user
  });
  res.status(201).json({
    message: "success",
    data: {
      note,
    },
  });
});

// Get all notes for a user
exports.getNotes = catchAsync(async (req, res, next) => {
  const notes = await Note.find({ user: req.user.id });
  res.status(200).json({
    message: "success",
    data: {
      notes,
    },
  });
});

// New handler to get a single note by ID
exports.getNote = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }

  res.status(200).json({
    message: "success",
    data: {
      note,
    },
  });
});

// Update a note
exports.updateNote = catchAsync(async (req, res, next) => {
  const note = await Note.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      content: req.body.content,
    },
    { new: true, runValidators: true }
  );
  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }
  res.status(200).json({
    message: "success",
    data: {
      note,
    },
  });
});

// Delete a note
exports.deleteNote = catchAsync(async (req, res, next) => {
  const note = await Note.findByIdAndDelete(req.params.id);

  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }

  res.status(204).json({
    message: "Note deleted",
    data: null,
  });
});
