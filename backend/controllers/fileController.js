const File = require("../models/fileModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { deleteFromCloudinary } = require("../utils/multerFileUploader");

/**
 * Create a new file record with Cloudinary upload
 * @route POST /api/v1/documents
 * @access Private
 */
exports.createFile = catchAsync(async (req, res, next) => {
  const { fileName, description, category } = req.body;

  // Validate file upload
  if (!req.file) {
    return next(new AppError("Please upload a file", 400));
  }

  // Validate Cloudinary upload
  if (!req.file.cloudinaryPublicId || !req.file.cloudinaryUrl) {
    return next(
      new AppError(
        "File upload to cloud storage failed. Please try again.",
        500
      )
    );
  }

  // Log upload details
  console.log("📄 Creating file record:", {
    fileName: fileName || req.file.originalname,
    cloudinaryPublicId: req.file.cloudinaryPublicId,
    uploadedBy: req.user.id,
    size: req.file.size,
  });

  // Create file record in database
  const fileDoc = await File.create({
    fileName: fileName || req.file.cleanFilename || req.file.originalname,
    file: req.file.cloudinaryUrl,
    cloudinaryPublicId: req.file.cloudinaryPublicId,
    cloudinaryFolder: req.file.cloudinaryFolder,
    cloudinaryResourceType: req.file.cloudinaryResourceType || "raw",
    uploadedBy: req.user.id,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    originalName: req.file.originalname,
    description: description || "",
    category: category || "general",
  });

  res.status(201).json({
    status: "success",
    message: "File uploaded successfully",
    data: {
      file: fileDoc,
    },
  });
});

/**
 * Get all files for the authenticated user
 * @route GET /api/v1/documents
 * @access Private
 */
exports.getFiles = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    category,
    fileType,
    search,
  } = req.query;

  // Build query
  const query = { uploadedBy: req.user.id };

  if (category) query.category = category;
  if (fileType) query.fileType = new RegExp(fileType, "i");
  if (search) {
    query.$or = [
      { fileName: { $regex: search, $options: "i" } },
      { originalName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [files, total] = await Promise.all([
    File.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v"),
    File.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: files.length,
    data: {
      files,
    },
    pagination: {
      current: parseInt(page),
      limit: parseInt(limit),
      total: Math.ceil(total / parseInt(limit)),
      totalRecords: total,
    },
  });
});

/**
 * Get single file by ID (with ownership verification)
 * @route GET /api/v1/documents/:id
 * @access Private
 */
exports.getFile = catchAsync(async (req, res, next) => {
  const fileDoc = await File.findOne({
    _id: req.params.id,
    uploadedBy: req.user.id,
  }).select("-__v");

  if (!fileDoc) {
    return next(
      new AppError("Document not found or you don't have access", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      file: fileDoc,
    },
  });
});

/**
 * Update file metadata and optionally replace file
 * @route PATCH /api/v1/documents/:id
 * @access Private
 */
exports.updateFile = catchAsync(async (req, res, next) => {
  const { fileName, description, category } = req.body;

  // Find existing file with ownership check
  const existingFile = await File.findOne({
    _id: req.params.id,
    uploadedBy: req.user.id,
  });

  if (!existingFile) {
    return next(
      new AppError("Document not found or you don't have access", 404)
    );
  }

  // Prepare update data
  const updateData = {};
  if (fileName) updateData.fileName = fileName;
  if (description !== undefined) updateData.description = description;
  if (category) updateData.category = category;

  // If new file uploaded, replace the old one
  if (req.file) {
    console.log("🔄 Replacing file:", {
      oldPublicId: existingFile.cloudinaryPublicId,
      newPublicId: req.file.cloudinaryPublicId,
    });

    // Delete old file from Cloudinary
    try {
      await deleteFromCloudinary(
        existingFile.cloudinaryPublicId,
        existingFile.cloudinaryResourceType || "raw"
      );
    } catch (error) {
      console.error("⚠️ Failed to delete old file from Cloudinary:", error);
      // Continue with update even if deletion fails
    }

    // Update with new file data
    updateData.file = req.file.cloudinaryUrl;
    updateData.cloudinaryPublicId = req.file.cloudinaryPublicId;
    updateData.cloudinaryFolder = req.file.cloudinaryFolder;
    updateData.cloudinaryResourceType =
      req.file.cloudinaryResourceType || "raw";
    updateData.fileSize = req.file.size;
    updateData.fileType = req.file.mimetype;
    updateData.originalName = req.file.originalname;
  }

  // Update file record
  const updatedFile = await File.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-__v");

  res.status(200).json({
    status: "success",
    message: "File updated successfully",
    data: {
      file: updatedFile,
    },
  });
});

/**
 * Delete file from both database and Cloudinary
 * @route DELETE /api/v1/documents/:id
 * @access Private
 */
exports.deleteFile = catchAsync(async (req, res, next) => {
  // Find file with ownership check
  const fileDoc = await File.findOne({
    _id: req.params.id,
    uploadedBy: req.user.id,
  });

  if (!fileDoc) {
    return next(
      new AppError("Document not found or you don't have access", 404)
    );
  }

  console.log("🗑️ Deleting file:", {
    id: fileDoc._id,
    publicId: fileDoc.cloudinaryPublicId,
    fileName: fileDoc.fileName,
  });

  // Delete from Cloudinary first
  if (fileDoc.cloudinaryPublicId) {
    try {
      await deleteFromCloudinary(
        fileDoc.cloudinaryPublicId,
        fileDoc.cloudinaryResourceType || "raw"
      );
    } catch (error) {
      console.error("⚠️ Cloudinary deletion error:", error);
      // Continue with database deletion even if Cloudinary fails
      // You might want to log this for manual cleanup later
    }
  }

  // Delete from database
  await File.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Download file (returns file URL for download)
 * @route GET /api/v1/documents/:id/download
 * @access Private
 */
exports.downloadFile = catchAsync(async (req, res, next) => {
  const fileDoc = await File.findOne({
    _id: req.params.id,
    uploadedBy: req.user.id,
  }).select("file fileName originalName cloudinaryPublicId");

  if (!fileDoc) {
    return next(
      new AppError("Document not found or you don't have access", 404)
    );
  }

  // Log download activity
  console.log("📥 File download requested:", {
    id: fileDoc._id,
    fileName: fileDoc.fileName,
    user: req.user.id,
  });

  // Optionally, track download count
  await File.findByIdAndUpdate(req.params.id, {
    $inc: { downloadCount: 1 },
    lastDownloadedAt: new Date(),
  });

  res.status(200).json({
    status: "success",
    data: {
      fileUrl: fileDoc.file,
      fileName: fileDoc.fileName || fileDoc.originalName,
      publicId: fileDoc.cloudinaryPublicId,
    },
  });
});

/**
 * Get file statistics for the user
 * @route GET /api/v1/documents/stats
 * @access Private
 */
exports.getFileStats = catchAsync(async (req, res, next) => {
  const stats = await File.aggregate([
    { $match: { uploadedBy: req.user._id } },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
        avgSize: { $avg: "$fileSize" },
        fileTypes: { $addToSet: "$fileType" },
      },
    },
  ]);

  const categoryBreakdown = await File.aggregate([
    { $match: { uploadedBy: req.user._id } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats: stats[0] || {
        totalFiles: 0,
        totalSize: 0,
        avgSize: 0,
        fileTypes: [],
      },
      categoryBreakdown,
    },
  });
});

/**
 * Bulk delete files
 * @route DELETE /api/v1/documents/bulk
 * @access Private
 */
exports.bulkDeleteFiles = catchAsync(async (req, res, next) => {
  const { fileIds } = req.body;

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return next(new AppError("Please provide an array of file IDs", 400));
  }

  // Find all files with ownership check
  const files = await File.find({
    _id: { $in: fileIds },
    uploadedBy: req.user.id,
  });

  if (files.length === 0) {
    return next(new AppError("No files found to delete", 404));
  }

  console.log(`🗑️ Bulk deleting ${files.length} files`);

  // Delete from Cloudinary (parallel)
  const cloudinaryDeletions = files.map((file) =>
    deleteFromCloudinary(
      file.cloudinaryPublicId,
      file.cloudinaryResourceType || "raw"
    ).catch((err) => {
      console.error(`Failed to delete ${file.cloudinaryPublicId}:`, err);
      return null; // Continue even if some deletions fail
    })
  );

  await Promise.all(cloudinaryDeletions);

  // Delete from database
  const result = await File.deleteMany({
    _id: { $in: fileIds },
    uploadedBy: req.user.id,
  });

  res.status(200).json({
    status: "success",
    message: `Successfully deleted ${result.deletedCount} file(s)`,
    data: {
      deletedCount: result.deletedCount,
    },
  });
});
