const multer = require("multer");
const path = require("path");
const File = require("../models/fileModel");
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
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only documents, images, and archives are allowed.",
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

    // Upload to S3
    const uploadResult = await s3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        category,
        entityType,
        entityId,
        uploadedBy: req.user._id,
        metadata: {
          uploadType: "general", // or 'task-reference', 'task-response', etc.
          entityType,
          entityId,
          uploadedBy: req.user._id.toString(),
        },
      }
    );

    // Create file record in database with both URLs
    const fileRecord = await File.create({
      fileName: req.file.originalname,
      originalName: req.file.originalname,
      s3Key: uploadResult.s3Key,
      s3Bucket: uploadResult.bucket,
      s3Region: uploadResult.region,
      fileUrl: uploadResult.fileUrl, // Permanent S3 URL
      presignedUrl: uploadResult.presignedUrl, // Temporary pre-signed URL for immediate access
      uploadedBy: req.user._id,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).substring(1),
      mimeType: req.file.mimetype,
      description,
      category,
      entityType,
      entityId: entityId || null,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      metadata: {
        uploadType: "general",
        entityType,
        entityId: entityId || null,
        uploadedBy: req.user._id.toString(),
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        // Add any additional metadata you need
      },
    });

    console.log("✅ File uploaded successfully:", {
      fileId: fileRecord._id,
      fileName: fileRecord.fileName,
      hasPresignedUrl: !!uploadResult.presignedUrl,
      hasFileUrl: !!uploadResult.fileUrl,
    });

    res.status(201).json({
      status: "success",
      data: {
        file: fileRecord,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    next(new AppError(error.message, 500));
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

    const uploadPromises = req.files.map(async (file) => {
      // Upload to S3
      const uploadResult = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          category,
          entityType,
          entityId,
          uploadedBy: req.user._id,
        }
      );

      // Create file record
      return await File.create({
        fileName: file.originalname,
        originalName: file.originalname,
        s3Key: uploadResult.s3Key,
        s3Bucket: uploadResult.bucket,
        s3Region: uploadResult.region,
        fileUrl: uploadResult.fileUrl,
        uploadedBy: req.user._id,
        fileSize: file.size,
        fileType: path.extname(file.originalname).substring(1),
        mimeType: file.mimetype,
        description,
        category,
        entityType,
        entityId: entityId || null,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      });
    });

    const fileRecords = await Promise.all(uploadPromises);

    res.status(201).json({
      status: "success",
      results: fileRecords.length,
      data: {
        files: fileRecords,
      },
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    next(new AppError(error.message, 500));
  }
};

/**
 * Get file download URL
 */
exports.getFileDownloadUrl = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    // Check if file is deleted
    if (file.isDeleted) {
      return next(new AppError("This file has been deleted", 410));
    }

    // Generate presigned URL
    const downloadUrl = await s3Service.getPresignedUrl(file.s3Key, 3600); // 1 hour

    // Increment download count
    await file.incrementDownloadCount();

    res.status(200).json({
      status: "success",
      data: {
        downloadUrl,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * Get all files for an entity
 */
exports.getEntityFiles = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;

    const files = await File.getEntityFiles(entityType, entityId);

    res.status(200).json({
      status: "success",
      results: files.length,
      data: {
        files,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * Get user's files
 */
exports.getMyFiles = async (req, res, next) => {
  try {
    const { category, isArchived } = req.query;

    const query = {
      uploadedBy: req.user._id,
      isDeleted: false,
    };

    if (category) query.category = category;
    if (isArchived !== undefined) query.isArchived = isArchived === "true";

    const files = await File.find(query).sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: files.length,
      data: {
        files,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * Delete file
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

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

    // Soft delete in database
    await file.softDelete(req.user._id);

    // Optional: Delete from S3 (comment out if you want to keep files in S3)
    // await s3Service.deleteFile(file.s3Key);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * Permanently delete file
 */
exports.permanentlyDeleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

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

    // Delete from S3
    await s3Service.deleteFile(file.s3Key);

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * Archive/Unarchive file
 */
exports.toggleArchive = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

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
    next(new AppError(error.message, 500));
  }
};

/**
 * Get user storage usage
 */
exports.getStorageUsage = async (req, res, next) => {
  try {
    const usage = await File.getUserStorageUsage(req.user._id);

    res.status(200).json({
      status: "success",
      data: {
        usage,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Upload task reference documents
exports.uploadTaskReferenceDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError("Please upload at least one file", 400));
    }

    const { taskId, description, tags } = req.body;

    // Verify task exists
    const Task = require("../models/Task");
    const task = await Task.findById(taskId);
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
          metadata: {
            uploadType: "task-reference",
            taskId: taskId,
          },
        }
      );

      // Create file record
      const fileRecord = await File.create({
        fileName: file.originalname,
        originalName: file.originalname,
        s3Key: uploadResult.s3Key,
        s3Bucket: uploadResult.bucket,
        s3Region: uploadResult.region,
        fileUrl: uploadResult.fileUrl,
        uploadedBy: req.user._id,
        fileSize: file.size,
        fileType: path.extname(file.originalname).substring(1),
        mimeType: file.mimetype,
        description,
        category: "task-document",
        entityType: "Task",
        entityId: taskId,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        metadata: {
          uploadType: "task-reference",
          taskId: taskId,
          taskTitle: task.title,
        },
      });

      // Add to task's reference documents
      await Task.findByIdAndUpdate(taskId, {
        $addToSet: { referenceDocuments: fileRecord._id },
      });

      return fileRecord;
    });

    const fileRecords = await Promise.all(uploadPromises);

    res.status(201).json({
      status: "success",
      results: fileRecords.length,
      data: {
        files: fileRecords,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
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

    // Verify task and response exist
    const Task = require("../models/Task");
    const task = await Task.findById(taskId);
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
          metadata: {
            uploadType: "task-response",
            taskId: taskId,
            responseId: responseId,
          },
        }
      );

      // Create file record
      const fileRecord = await File.create({
        fileName: file.originalname,
        originalName: file.originalname,
        s3Key: uploadResult.s3Key,
        s3Bucket: uploadResult.bucket,
        s3Region: uploadResult.region,
        fileUrl: uploadResult.fileUrl,
        uploadedBy: req.user._id,
        fileSize: file.size,
        fileType: path.extname(file.originalname).substring(1),
        mimeType: file.mimetype,
        description,
        category: "task-document",
        entityType: "Task",
        entityId: taskId,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
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

    res.status(201).json({
      status: "success",
      results: fileRecords.length,
      data: {
        files: fileRecords,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
