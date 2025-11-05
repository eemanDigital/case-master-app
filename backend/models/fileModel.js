// const mongoose = require("mongoose");

// const fileSchema = mongoose.Schema(
//   {
//     fileName: {
//       type: String,
//       trim: true,
//       required: [true, "File name is required"],
//       maxLength: [100, "File name cannot be more than 100 characters"],
//     },
//     file: {
//       type: String,
//       required: [true, "File URL is required"],
//     },
//     cloudinaryPublicId: {
//       type: String,
//       required: [true, "Cloudinary public ID is required"],
//     },
//     uploadedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: [true, "Uploader information is required"],
//     },
//     fileSize: {
//       type: Number,
//       default: 0,
//     },
//     fileType: {
//       type: String,
//       default: "unknown",
//     },
//     date: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   {
//     timestamps: true, // Adds createdAt and updatedAt
//   }
// );

// // Index for better performance
// fileSchema.index({ uploadedBy: 1, date: -1 });
// fileSchema.index({ cloudinaryPublicId: 1 });

// const File = mongoose.model("File", fileSchema);

// module.exports = File;

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
    file: {
      type: String,
      required: [true, "File URL is required"],
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
      unique: true,
    },
    cloudinaryFolder: {
      type: String,
      default: "documents",
    },
    cloudinaryResourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "raw",
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
        "other",
      ],
      default: "general",
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ uploadedBy: 1, category: 1 });
fileSchema.index({ uploadedBy: 1, isArchived: 1 });
fileSchema.index({ cloudinaryPublicId: 1 }, { unique: true });
fileSchema.index({ fileName: "text", description: "text" });

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

// Pre-save middleware to set archived date
fileSchema.pre("save", function (next) {
  if (this.isModified("isArchived") && this.isArchived && !this.archivedAt) {
    this.archivedAt = new Date();
  }
  next();
});

// Instance method to archive file
fileSchema.methods.archive = async function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  return await this.save();
};

// Instance method to unarchive file
fileSchema.methods.unarchive = async function () {
  this.isArchived = false;
  this.archivedAt = undefined;
  return await this.save();
};

// Static method to get user's storage usage
fileSchema.statics.getUserStorageUsage = async function (userId) {
  const result = await this.aggregate([
    { $match: { uploadedBy: userId } },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
        categories: {
          $push: {
            category: "$category",
            size: "$fileSize",
          },
        },
      },
    },
  ]);

  return result[0] || { totalFiles: 0, totalSize: 0, categories: [] };
};

// Static method to clean up orphaned files (files without valid users)
fileSchema.statics.cleanupOrphanedFiles = async function () {
  const User = mongoose.model("User");

  const allFiles = await this.find().select("uploadedBy cloudinaryPublicId");
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
