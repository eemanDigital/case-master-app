// fileController.js
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const File = require("../models/fileModel");
const Firm = require("../models/firmModel");
const s3Service = require("../services/s3Service");
const AppError = require("../utils/appError");

// Configure multer to use memory storage
const multerStorage = multer.memoryStorage();

// File filter function
const multerFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    // Add more MIME types for common file extensions
    "application/json",
    "text/html",
    "text/xml",
    "application/rtf",
  ];

  // Also check by file extension for safety
  const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".zip",
    ".rar",
    ".json",
    ".html",
    ".xml",
    ".rtf",
  ];

  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type. File type ${file.mimetype} (${fileExtension}) is not allowed.`,
        400
      ),
      false
    );
  }
};

// Configure multer upload
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Max 10 files
  },
});

// Middleware exports
exports.uploadSingle = upload.single("file");
exports.uploadMultiple = upload.array("files", 10); // Max 10 files
exports.uploadFields = upload.fields([
  { name: "documents", maxCount: 10 },
  { name: "images", maxCount: 5 },
]);

/**
 * Helper function to validate and sanitize entityId
 */
const validateEntityId = (entityId) => {
  if (!entityId || entityId === "undefined" || entityId === "null") {
    return null;
  }

  // Check if it's a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(entityId)) {
    return entityId;
  }

  return null;
};

/**
 * Helper function to check storage limits
 */
const checkStorageLimit = async (firmId, fileSizeBytes) => {
  const firm = await Firm.findById(firmId);
  if (!firm) {
    throw new AppError("Firm not found", 404);
  }

  // Check if subscription is active
  if (!firm.isSubscriptionActive()) {
    throw new AppError(
      "Your subscription has expired. Please renew to upload files.",
      403
    );
  }

  // Convert bytes to GB
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);

  // Check storage limit
  if (!firm.hasStorageAvailable(fileSizeGB)) {
    throw new AppError(
      `Storage limit exceeded. You have ${(
        firm.limits.storageGB - firm.usage.storageUsedGB
      ).toFixed(2)}GB available.`,
      403
    );
  }

  return firm;
};

/**
 * Helper function to update firm storage usage
 */
const updateFirmStorage = async (firmId, fileSizeBytes) => {
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const firm = await Firm.findById(firmId);
  if (firm) {
    await firm.updateStorageUsage(fileSizeGB);
  }
};

/**
 * Upload file controller
 */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("Please upload a file", 400));
    }

    const {
      description,
      category = "general",
      entityType = "General",
      entityId,
      tags,
    } = req.body;

    // Check storage limit before uploading
    await checkStorageLimit(req.firmId, req.file.size);

    // Validate and sanitize entityId
    const validEntityId = validateEntityId(entityId);

    // Upload to S3
    const uploadResult = await s3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        category,
        entityType,
        entityId: validEntityId,
        uploadedBy: req.user._id,
        firmId: req.firmId,
        metadata: {
          uploadType: "general",
          entityType,
          entityId: validEntityId,
          uploadedBy: req.user._id.toString(),
          firmId: req.firmId.toString(),
        },
      }
    );

    // Create file record in database
    const fileRecord = await File.create({
      firmId: req.firmId,
      fileName: req.file.originalname,
      originalName: req.file.originalname,
      s3Key: uploadResult.s3Key,
      s3Bucket: uploadResult.bucket,
      s3Region: uploadResult.region,
      fileUrl: uploadResult.fileUrl,
      presignedUrl: uploadResult.presignedUrl,
      uploadedBy: req.user._id,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).substring(1).toLowerCase(),
      mimeType: req.file.mimetype,
      description: description || "",
      category,
      entityType,
      entityId: validEntityId,
      tags: tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [],
      metadata: {
        uploadType: "general",
        entityType,
        entityId: validEntityId,
        uploadedBy: req.user._id.toString(),
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    // Update firm storage usage
    await updateFirmStorage(req.firmId, req.file.size);

    res.status(201).json({
      status: "success",
      data: {
        file: fileRecord,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(
        new AppError(`Validation Error: ${messages.join(", ")}`, 400)
      );
    }

    next(new AppError(error.message || "File upload failed", 500));
  }
};

/**
 * Upload multiple files controller
 */
exports.uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError("Please upload at least one file", 400));
    }

    const {
      description,
      category = "general",
      entityType = "General",
      entityId,
      tags,
    } = req.body;

    // Calculate total file size
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);

    // Check storage limit before uploading
    await checkStorageLimit(req.firmId, totalSize);

    // Validate entityId
    const validEntityId = validateEntityId(entityId);

    const uploadPromises = req.files.map(async (file, index) => {
      try {
        // Upload to S3
        const uploadResult = await s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          {
            category,
            entityType,
            entityId: validEntityId,
            uploadedBy: req.user._id,
            firmId: req.firmId,
            metadata: {
              firmId: req.firmId.toString(),
            },
          }
        );

        // Create file record
        return await File.create({
          firmId: req.firmId,
          fileName: file.originalname,
          originalName: file.originalname,
          s3Key: uploadResult.s3Key,
          s3Bucket: uploadResult.bucket,
          s3Region: uploadResult.region,
          fileUrl: uploadResult.fileUrl,
          presignedUrl: uploadResult.presignedUrl,
          uploadedBy: req.user._id,
          fileSize: file.size,
          fileType: path.extname(file.originalname).substring(1).toLowerCase(),
          mimeType: file.mimetype,
          description: description || "",
          category,
          entityType,
          entityId: validEntityId,
          tags: tags
            ? tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)
            : [],
          metadata: {
            uploadOrder: index + 1,
            totalFiles: req.files.length,
          },
        });
      } catch (fileError) {
        console.error(`Error uploading file ${file.originalname}:`, fileError);
        throw fileError;
      }
    });

    const fileRecords = await Promise.all(uploadPromises);

    // Update firm storage usage
    await updateFirmStorage(req.firmId, totalSize);

    res.status(201).json({
      status: "success",
      results: fileRecords.length,
      data: {
        files: fileRecords,
      },
    });
  } catch (error) {
    console.error("Multiple upload error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(
        new AppError(`Validation Error: ${messages.join(", ")}`, 400)
      );
    }

    next(new AppError(error.message || "Multiple file upload failed", 500));
  }
};

/**
 * Get file download URL
 */
exports.getFileDownloadUrl = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      firmId: req.firmId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    // Check if file is deleted
    if (file.isDeleted) {
      return next(new AppError("This file has been deleted", 410));
    }

    // Generate presigned URL (valid for 1 hour)
    const downloadUrl = await s3Service.getPresignedUrl(file.s3Key, 3600);

    // Update presigned URL in database
    file.presignedUrl = downloadUrl;
    await file.save();

    // Increment download count asynchronously (don't wait for it)
    file
      .incrementDownloadCount()
      .catch((err) => console.error("Error incrementing download count:", err));

    res.status(200).json({
      status: "success",
      data: {
        downloadUrl,
        expiresIn: 3600,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
      },
    });
  } catch (error) {
    console.error("Get download URL error:", error);
    next(new AppError(error.message || "Failed to get download URL", 500));
  }
};

/**
 * Get all files for an entity
 */
exports.getEntityFiles = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;

    // If entityId is "null" or "undefined", return empty array
    if (!entityId || entityId === "null" || entityId === "undefined") {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: {
          files: [],
        },
      });
    }

    const files = await File.getEntityFiles(req.firmId, entityType, entityId);

    res.status(200).json({
      status: "success",
      results: files.length,
      data: {
        files,
      },
    });
  } catch (error) {
    console.error("Get entity files error:", error);
    next(new AppError(error.message || "Failed to get entity files", 500));
  }
};

/**
 * Get user's files (general files)
 */
exports.getMyFiles = async (req, res, next) => {
  try {
    const {
      category,
      isArchived,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    const query = {
      firmId: req.firmId,
      uploadedBy: req.user._id,
      isDeleted: false,
    };

    // Filter by category if provided
    if (category && category !== "all") {
      query.category = category;
    }

    // Filter by archive status
    if (isArchived !== undefined) {
      query.isArchived = isArchived === "true";
    }

    // Search functionality
    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const totalFiles = await File.countDocuments(query);

    // Determine sort order
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    const files = await File.find(query)
      .populate("uploadedBy", "firstName lastName email avatar")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get statistics
    const stats = await File.aggregate([
      { $match: { ...query, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: "$fileSize" },
          categories: { $addToSet: "$category" },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalFiles: 0,
      totalSize: 0,
      categories: [],
    };

    res.status(200).json({
      status: "success",
      results: files.length,
      total: totalFiles,
      page: parseInt(page),
      totalPages: Math.ceil(totalFiles / limit),
      data: {
        files,
        statistics: {
          ...statistics,
          totalSizeMB: (statistics.totalSize / (1024 * 1024)).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Get my files error:", error);
    next(new AppError(error.message || "Failed to get files", 500));
  }
};

/**
 * Delete file
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      firmId: req.firmId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    // Check ownership or admin privileges
    if (
      file.uploadedBy.toString() !== req.user._id.toString() &&
      !["admin", "super-admin"].includes(req.user.role)
    ) {
      return next(
        new AppError("You do not have permission to delete this file", 403)
      );
    }

    // Store file size before deletion
    const fileSize = file.fileSize;

    // Soft delete in database
    await file.softDelete(req.user._id);

    // Update firm storage usage (decrease)
    await updateFirmStorage(req.firmId, -fileSize);

    // Note: We're not deleting from S3 to allow recovery if needed
    // If you want to delete from S3, uncomment the line below
    // await s3Service.deleteFile(file.s3Key);

    res.status(200).json({
      status: "success",
      message: "File deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete file error:", error);
    next(new AppError(error.message || "Failed to delete file", 500));
  }
};

/**
 * Permanently delete file
 */
exports.permanentlyDeleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      firmId: req.firmId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    // Only admins can permanently delete
    if (!["admin", "super-admin"].includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to permanently delete files",
          403
        )
      );
    }

    // Store file size before deletion
    const fileSize = file.fileSize;

    // Delete from S3
    await s3Service.deleteFile(file.s3Key);

    // Delete from database
    await File.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });

    // Update firm storage usage (decrease)
    await updateFirmStorage(req.firmId, -fileSize);

    res.status(200).json({
      status: "success",
      message: "File permanently deleted",
      data: null,
    });
  } catch (error) {
    console.error("Permanently delete file error:", error);
    next(
      new AppError(error.message || "Failed to permanently delete file", 500)
    );
  }
};

/**
 * Archive/Unarchive file
 */
exports.toggleArchive = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      firmId: req.firmId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return next(
        new AppError("You do not have permission to modify this file", 403)
      );
    }

    const updatedFile = file.isArchived
      ? await file.unarchive()
      : await file.archive();

    res.status(200).json({
      status: "success",
      data: {
        file: updatedFile,
      },
    });
  } catch (error) {
    console.error("Toggle archive error:", error);
    next(new AppError(error.message || "Failed to toggle archive status", 500));
  }
};

/**
 * Get user storage usage
 */
exports.getStorageUsage = async (req, res, next) => {
  try {
    const usage = await File.getUserStorageUsage(req.firmId, req.user._id);

    // Get firm limits
    const firm = await Firm.findById(req.firmId);
    const limits = firm
      ? {
          storageGB: firm.limits.storageGB,
          usedGB: firm.usage.storageUsedGB,
          availableGB: firm.limits.storageGB - firm.usage.storageUsedGB,
        }
      : null;

    res.status(200).json({
      status: "success",
      data: {
        usage,
        usageMB: {
          totalFiles: usage.totalFiles || 0,
          totalSize: usage.totalSize || 0,
          totalSizeMB: ((usage.totalSize || 0) / (1024 * 1024)).toFixed(2),
          byCategory:
            usage.byCategory?.map((cat) => ({
              category: cat.category,
              size: cat.size,
              sizeMB: (cat.size / (1024 * 1024)).toFixed(2),
            })) || [],
        },
        firmLimits: limits,
      },
    });
  } catch (error) {
    console.error("Get storage usage error:", error);
    next(new AppError(error.message || "Failed to get storage usage", 500));
  }
};

/**
 * Upload task reference documents
 */
exports.uploadTaskReferenceDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError("Please upload at least one file", 400));
    }

    const { taskId, description, tags } = req.body;

    if (!taskId) {
      return next(new AppError("Task ID is required", 400));
    }

    // Calculate total file size
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);

    // Check storage limit
    await checkStorageLimit(req.firmId, totalSize);

    // Verify task exists and belongs to firm
    const Task = require("../models/taskModel");
    const task = await Task.findOne({ _id: taskId, firmId: req.firmId });
    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    const uploadPromises = req.files.map(async (file) => {
      const uploadResult = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          category: "task-document",
          entityType: "Task",
          entityId: taskId,
          uploadedBy: req.user._id,
          firmId: req.firmId,
          metadata: {
            uploadType: "task-reference",
            taskId: taskId,
            firmId: req.firmId.toString(),
          },
        }
      );

      // Create file record
      const fileRecord = await File.create({
        firmId: req.firmId,
        fileName: file.originalname,
        originalName: file.originalname,
        s3Key: uploadResult.s3Key,
        s3Bucket: uploadResult.bucket,
        s3Region: uploadResult.region,
        fileUrl: uploadResult.fileUrl,
        presignedUrl: uploadResult.presignedUrl,
        uploadedBy: req.user._id,
        fileSize: file.size,
        fileType: path.extname(file.originalname).substring(1).toLowerCase(),
        mimeType: file.mimetype,
        description: description || "",
        category: "task-document",
        entityType: "Task",
        entityId: taskId,
        tags: tags
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          : [],
        metadata: {
          uploadType: "task-reference",
          taskId: taskId,
          taskTitle: task.title,
        },
      });

      // Add to task's reference documents
      await Task.findOneAndUpdate(
        { _id: taskId, firmId: req.firmId },
        { $addToSet: { referenceDocuments: fileRecord._id } }
      );

      return fileRecord;
    });

    const fileRecords = await Promise.all(uploadPromises);

    // Update firm storage usage
    await updateFirmStorage(req.firmId, totalSize);

    res.status(201).json({
      status: "success",
      results: fileRecords.length,
      data: {
        files: fileRecords,
      },
    });
  } catch (error) {
    console.error("Upload task reference error:", error);
    next(
      new AppError(
        error.message || "Failed to upload task reference documents",
        500
      )
    );
  }
};

/**
 * Upload task response documents
 */
exports.uploadTaskResponseDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError("Please upload at least one file", 400));
    }

    const { taskId, responseId, description, tags } = req.body;

    if (!taskId || !responseId) {
      return next(new AppError("Task ID and Response ID are required", 400));
    }

    // Calculate total file size
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);

    // Check storage limit
    await checkStorageLimit(req.firmId, totalSize);

    // Verify task and response exist and belong to firm
    const Task = require("../models/taskModel");
    const task = await Task.findOne({ _id: taskId, firmId: req.firmId });
    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    const response = task.taskResponses.id(responseId);
    if (!response) {
      return next(new AppError("Task response not found", 404));
    }

    const uploadPromises = req.files.map(async (file) => {
      const uploadResult = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          category: "task-document",
          entityType: "Task",
          entityId: taskId,
          uploadedBy: req.user._id,
          firmId: req.firmId,
          metadata: {
            uploadType: "task-response",
            taskId: taskId,
            responseId: responseId,
            firmId: req.firmId.toString(),
          },
        }
      );

      // Create file record
      const fileRecord = await File.create({
        firmId: req.firmId,
        fileName: file.originalname,
        originalName: file.originalname,
        s3Key: uploadResult.s3Key,
        s3Bucket: uploadResult.bucket,
        s3Region: uploadResult.region,
        fileUrl: uploadResult.fileUrl,
        presignedUrl: uploadResult.presignedUrl,
        uploadedBy: req.user._id,
        fileSize: file.size,
        fileType: path.extname(file.originalname).substring(1).toLowerCase(),
        mimeType: file.mimetype,
        description: description || "",
        category: "task-document",
        entityType: "Task",
        entityId: taskId,
        tags: tags
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          : [],
        metadata: {
          uploadType: "task-response",
          taskId: taskId,
          responseId: responseId,
          taskTitle: task.title,
        },
      });

      // Add to response documents
      response.documents.push(fileRecord._id);
      await task.save();

      return fileRecord;
    });

    const fileRecords = await Promise.all(uploadPromises);

    // Update firm storage usage
    await updateFirmStorage(req.firmId, totalSize);

    res.status(201).json({
      status: "success",
      results: fileRecords.length,
      data: {
        files: fileRecords,
      },
    });
  } catch (error) {
    console.error("Upload task response error:", error);
    next(
      new AppError(
        error.message || "Failed to upload task response documents",
        500
      )
    );
  }
};

/**
 * Bulk delete files
 */
exports.bulkDeleteFiles = async (req, res, next) => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return next(
        new AppError("Please provide an array of file IDs to delete", 400)
      );
    }

    // Get all files first to check permissions
    const files = await File.find({
      _id: { $in: fileIds },
      firmId: req.firmId,
    });

    // Check if user has permission to delete all files
    const unauthorizedFiles = files.filter(
      (file) =>
        file.uploadedBy.toString() !== req.user._id.toString() &&
        !["admin", "super-admin"].includes(req.user.role)
    );

    if (unauthorizedFiles.length > 0) {
      return next(
        new AppError(
          `You don't have permission to delete ${unauthorizedFiles.length} file(s)`,
          403
        )
      );
    }

    // Calculate total size to be deleted
    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);

    // Soft delete all files
    const deletePromises = files.map((file) => file.softDelete(req.user._id));
    await Promise.all(deletePromises);

    // Update firm storage usage (decrease)
    await updateFirmStorage(req.firmId, -totalSize);

    res.status(200).json({
      status: "success",
      message: `Successfully deleted ${files.length} file(s)`,
      data: {
        deletedCount: files.length,
      },
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    next(new AppError(error.message || "Failed to bulk delete files", 500));
  }
};

/**
 * Restore deleted file
 */
exports.restoreFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      firmId: req.firmId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return next(
        new AppError("You do not have permission to restore this file", 403)
      );
    }

    // Store file size before restoration
    const fileSize = file.fileSize;

    // Restore file
    file.isDeleted = false;
    file.deletedAt = undefined;
    file.deletedBy = undefined;
    await file.save();

    // Update firm storage usage (increase)
    await updateFirmStorage(req.firmId, fileSize);

    res.status(200).json({
      status: "success",
      message: "File restored successfully",
      data: {
        file,
      },
    });
  } catch (error) {
    console.error("Restore file error:", error);
    next(new AppError(error.message || "Failed to restore file", 500));
  }
};

/**
 * Update file metadata
 */
exports.updateFile = async (req, res, next) => {
  try {
    const { description, category, tags } = req.body;
    const file = await File.findOne({
      _id: req.params.id,
      firmId: req.firmId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return next(
        new AppError("You do not have permission to update this file", 403)
      );
    }

    // Update fields if provided
    if (description !== undefined) file.description = description;
    if (category !== undefined) file.category = category;
    if (tags !== undefined) {
      file.tags = Array.isArray(tags)
        ? tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
    }

    await file.save();

    res.status(200).json({
      status: "success",
      message: "File updated successfully",
      data: {
        file,
      },
    });
  } catch (error) {
    console.error("Update file error:", error);
    next(new AppError(error.message || "Failed to update file", 500));
  }
};

/**
 * Get firm files (admin only)
 */
exports.getFirmFiles = async (req, res, next) => {
  try {
    // Only admins can view all firm files
    if (!["admin", "super-admin"].includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to view all firm files", 403)
      );
    }

    const {
      category,
      entityType,
      isArchived,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    const query = {
      firmId: req.firmId,
      isDeleted: false,
    };

    if (category && category !== "all") {
      query.category = category;
    }

    if (entityType && entityType !== "all") {
      query.entityType = entityType;
    }

    if (isArchived !== undefined) {
      query.isArchived = isArchived === "true";
    }

    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const totalFiles = await File.countDocuments(query);

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    const files = await File.find(query)
      .populate("uploadedBy", "firstName lastName email avatar")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      status: "success",
      results: files.length,
      total: totalFiles,
      page: parseInt(page),
      totalPages: Math.ceil(totalFiles / limit),
      data: {
        files,
      },
    });
  } catch (error) {
    console.error("Get firm files error:", error);
    next(new AppError(error.message || "Failed to get firm files", 500));
  }
};
