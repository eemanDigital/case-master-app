const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      maxlength: [255, "File name cannot exceed 255 characters"],
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    // AWS S3 specific fields
    s3Key: {
      type: String,
      required: [true, "S3 key is required"],
      unique: true,
    },
    s3Bucket: {
      type: String,
      required: [true, "S3 bucket name is required"],
    },
    s3Region: {
      type: String,
      default: "us-east-1",
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "File must belong to a user"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
    },
    mimeType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      enum: [
        "general",
        "legal",
        "contract",
        "court",
        "correspondence",
        "client",
        "internal",
        "report",
        "case-document",
        "task-document",
        "other",
      ],
      default: "general",
    },
    // Reference to the entity this file belongs to
    entityType: {
      type: String,
      enum: ["Case", "Task", "User", "General"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "entityType",
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Versioning support
    version: {
      type: Number,
      default: 1,
    },
    parentFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ entityType: 1, entityId: 1 });
fileSchema.index({ uploadedBy: 1, category: 1 });
fileSchema.index({ uploadedBy: 1, isArchived: 1 });
fileSchema.index({ s3Key: 1 }, { unique: true });
fileSchema.index({ fileName: "text", description: "text" });
fileSchema.index({ isDeleted: 1 });

// Virtual for file size in MB
fileSchema.virtual("fileSizeMB").get(function () {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for file extension
fileSchema.virtual("fileExtension").get(function () {
  if (!this.originalName) return "";
  const parts = this.originalName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
});

// Pre-save middleware
fileSchema.pre("save", function (next) {
  if (this.isModified("isArchived") && this.isArchived && !this.archivedAt) {
    this.archivedAt = new Date();
  }
  if (this.isModified("isDeleted") && this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  next();
});

// Instance methods
fileSchema.methods.archive = async function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  return await this.save();
};

fileSchema.methods.unarchive = async function () {
  this.isArchived = false;
  this.archivedAt = undefined;
  return await this.save();
};

fileSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

fileSchema.methods.incrementDownloadCount = async function () {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return await this.save();
};

// Static methods
fileSchema.statics.getUserStorageUsage = async function (userId) {
  const result = await this.aggregate([
    {
      $match: {
        uploadedBy: mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
        byCategory: {
          $push: {
            category: "$category",
            size: "$fileSize",
          },
        },
      },
    },
  ]);

  return result[0] || { totalFiles: 0, totalSize: 0, byCategory: [] };
};

fileSchema.statics.getEntityFiles = async function (entityType, entityId) {
  return await this.find({
    entityType,
    entityId,
    isDeleted: false,
  }).populate("uploadedBy", "firstName lastName email");
};

fileSchema.statics.cleanupOrphanedFiles = async function () {
  const User = mongoose.model("User");
  const allFiles = await this.find({ isDeleted: false }).select(
    "uploadedBy s3Key"
  );
  const orphanedFiles = [];

  for (const file of allFiles) {
    const userExists = await User.findById(file.uploadedBy);
    if (!userExists) {
      orphanedFiles.push(file);
    }
  }

  return orphanedFiles;
};

const File = mongoose.model("File", fileSchema);

module.exports = File;
