const Note = require("../models/noteModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const buildFilterQuery = (query, firmId, userId) => {
  const filter = { firmId, isDeleted: false };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.isPinned === "true") {
    filter.isPinned = true;
  }

  if (query.isFavorite === "true") {
    filter.isFavorite = true;
  }

  if (query.tags) {
    const tags = query.tags.split(",").map(t => t.trim().toLowerCase());
    filter.tags = { $in: tags };
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  return filter;
};

const buildSortOptions = (sortBy) => {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    updated: { updatedAt: -1 },
    "updated-asc": { updatedAt: 1 },
    "a-z": { title: 1 },
    "z-a": { title: -1 },
  };
  return sortMap[sortBy] || { createdAt: -1, isPinned: -1 };
};

exports.createNote = catchAsync(async (req, res, next) => {
  const note = await Note.create({
    firmId: req.firmId,
    user: req.user.id,
    title: req.body.title,
    content: req.body.content,
    category: req.body.category || "general",
    tags: req.body.tags || [],
    isPinned: req.body.isPinned || false,
    isFavorite: req.body.isFavorite || false,
    color: req.body.color || "#ffffff",
  });

  res.status(201).json({
    status: "success",
    data: { note },
  });
});

exports.getNotes = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search,
    sort = "newest",
    category,
    isPinned,
    isFavorite,
    tags,
    startDate,
    endDate,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * pageSize;

  let query = buildFilterQuery(req.query, req.firmId, req.user.id);

  if (search) {
    query.$text = { $search: search };
  }

  const totalDocs = await Note.countDocuments(query);
  const totalPages = Math.ceil(totalDocs / pageSize);

  let notesQuery = Note.find(query)
    .sort(buildSortOptions(sort))
    .skip(skip)
    .limit(pageSize)
    .lean();

  const notes = await notesQuery;

  res.status(200).json({
    status: "success",
    data: {
      notes,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalDocs,
        pageSize,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

exports.getNote = catchAsync(async (req, res, next) => {
  const note = await Note.findOne({ 
    _id: req.params.id, 
    firmId: req.firmId,
    isDeleted: false 
  });

  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { note },
  });
});

exports.updateNote = catchAsync(async (req, res, next) => {
  const { title, content, category, tags, isPinned, isFavorite, color } = req.body;

  const existingNote = await Note.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!existingNote) {
    return next(new AppError("No note found with that ID", 404));
  }

  if (existingNote.user.toString() !== req.user.id) {
    return next(new AppError("You can only update your own notes", 403));
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (category !== undefined) updateData.category = category;
  if (tags !== undefined) updateData.tags = tags;
  if (isPinned !== undefined) updateData.isPinned = isPinned;
  if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
  if (color !== undefined) updateData.color = color;

  const note = await Note.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: { note },
  });
});

exports.deleteNote = catchAsync(async (req, res, next) => {
  const { hard } = req.query;

  if (hard === "true") {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      firmId: req.firmId,
    });

    if (!note) {
      return next(new AppError("No note found with that ID", 404));
    }

    return res.status(204).json({
      status: "success",
      data: null,
    });
  }

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, firmId: req.firmId },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Note moved to trash",
    data: null,
  });
});

exports.getTrashNotes = catchAsync(async (req, res, next) => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * pageSize;

  const query = { firmId: req.firmId, isDeleted: true };

  const totalDocs = await Note.countDocuments(query);
  const totalPages = Math.ceil(totalDocs / pageSize);

  const notes = await Note.find(query)
    .sort({ deletedAt: -1 })
    .skip(skip)
    .limit(pageSize)
    .lean();

  res.status(200).json({
    status: "success",
    data: {
      notes,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalDocs,
        pageSize,
      },
    },
  });
});

exports.restoreNote = catchAsync(async (req, res, next) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, firmId: req.firmId, isDeleted: true },
    { isDeleted: false, deletedAt: null },
    { new: true }
  );

  if (!note) {
    return next(new AppError("No note found in trash with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { note },
  });
});

exports.togglePin = catchAsync(async (req, res, next) => {
  const note = await Note.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }

  if (note.user.toString() !== req.user.id) {
    return next(new AppError("You can only pin your own notes", 403));
  }

  note.isPinned = !note.isPinned;
  await note.save();

  res.status(200).json({
    status: "success",
    data: { note },
  });
});

exports.toggleFavorite = catchAsync(async (req, res, next) => {
  const note = await Note.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }

  if (note.user.toString() !== req.user.id) {
    return next(new AppError("You can only favorite your own notes", 403));
  }

  note.isFavorite = !note.isFavorite;
  await note.save();

  res.status(200).json({
    status: "success",
    data: { note },
  });
});

exports.getNoteStats = catchAsync(async (req, res, next) => {
  const stats = await Note.aggregate([
    { $match: { firmId: req.firmId, isDeleted: false } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  const pinnedCount = await Note.countDocuments({
    firmId: req.firmId,
    isDeleted: false,
    isPinned: true,
  });

  const favoriteCount = await Note.countDocuments({
    firmId: req.firmId,
    isDeleted: false,
    isFavorite: true,
  });

  const trashCount = await Note.countDocuments({
    firmId: req.firmId,
    isDeleted: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      byCategory: stats,
      pinnedCount,
      favoriteCount,
      trashCount,
    },
  });
});
