const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "deleted",
        "status_changed",
        "acknowledged",
        "forwarded",
        "note_added",
        "attachment_added",
        "restored",
        "priority_changed",
        "tag_added",
        "tag_removed",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const documentRecordSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "DocumentRecord must belong to a Firm"],
    },

    documentName: {
      type: String,
      required: [true, "Please provide document's name"],
      trim: true,
      maxlength: [100, "Document name cannot exceed 100 characters"],
    },
    documentType: {
      type: String,
      enum: [
        "Court Process",
        "Client Document",
        "Official Correspondence",
        "Legal Notice",
        "Contract/Agreement",
        "Affidavit",
        "Power of Attorney",
        "Judgement/Order",
        "Petition",
        "Correspondence",
        "Others",
      ],
      required: [true, "Please select document type"],
    },

    docRef: {
      type: String,
      trim: true,
      maxlength: [100, "Document reference cannot exceed 100 characters"],
    },
    sender: {
      type: String,
      required: [true, "Please provide sender's name"],
      trim: true,
      maxlength: [200, "Sender name cannot exceed 200 characters"],
    },
    senderAddress: {
      type: String,
      trim: true,
      maxlength: [500, "Sender address cannot exceed 500 characters"],
    },
    senderContact: {
      type: String,
      trim: true,
      maxlength: [100, "Sender contact cannot exceed 100 characters"],
    },

    dateReceived: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    responseRequired: {
      type: Boolean,
      default: false,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    forwardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    forwardNote: {
      type: String,
      trim: true,
      maxlength: [500, "Forward note cannot exceed 500 characters"],
    },
    forwardDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "received",
        "acknowledged",
        "under_review",
        "in_progress",
        "pending_action",
        "completed",
        "archived",
      ],
      default: "received",
    },
    previousStatus: {
      type: String,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    isUrgent: {
      type: Boolean,
      default: false,
    },

    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],

    note: {
      type: String,
      trim: true,
      maxlength: [2000, "Note cannot exceed 2000 characters"],
    },
    internalNotes: [
      {
        content: {
          type: String,
          required: true,
          maxlength: [2000, "Internal note cannot exceed 2000 characters"],
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isPrivate: {
          type: Boolean,
          default: true,
        },
      },
    ],

    attachments: [
      {
        fileName: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
        },
        fileSize: {
          type: Number,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    relatedCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
    },
    relatedMatter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matter",
    },

    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledgedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    activities: [activitySchema],
  },
  { timestamps: true }
);

documentRecordSchema.index({ documentName: "text", sender: "text", note: "text", docRef: "text" });
documentRecordSchema.index({ documentType: 1 });
documentRecordSchema.index({ status: 1 });
documentRecordSchema.index({ priority: 1 });
documentRecordSchema.index({ dateReceived: -1 });
documentRecordSchema.index({ dueDate: 1 });
documentRecordSchema.index({ sender: 1 });
documentRecordSchema.index({ recipient: 1 });
documentRecordSchema.index({ forwardedTo: 1 });
documentRecordSchema.index({ isDeleted: 1 });
documentRecordSchema.index({ tags: 1 });
documentRecordSchema.index({ relatedCase: 1 });
documentRecordSchema.index({ relatedMatter: 1 });
documentRecordSchema.index({ firmId: 1, isDeleted: 1 });
documentRecordSchema.index({ firmId: 1, status: 1 });
documentRecordSchema.index({ firmId: 1, priority: 1 });
documentRecordSchema.index({ documentType: 1, dateReceived: -1 });
documentRecordSchema.index({ status: 1, priority: 1 });
documentRecordSchema.index({ dateReceived: -1, isDeleted: 1 });

documentRecordSchema.pre(/^find/, function (next) {
  this.populate({
    path: "forwardedTo",
    select: "firstName lastName email",
  });

  this.populate({
    path: "recipient",
    select: "firstName lastName email",
  });

  this.populate({
    path: "createdBy",
    select: "firstName lastName email",
  });

  this.populate({
    path: "updatedBy",
    select: "firstName lastName email",
  });

  this.populate({
    path: "acknowledgedBy",
    select: "firstName lastName email",
  });

  this.populate({
    path: "completedBy",
    select: "firstName lastName email",
  });

  this.populate({
    path: "deletedBy",
    select: "firstName lastName email",
  });

  this.populate({
    path: "relatedCase",
    select: "caseTitle caseNumber",
  });

  this.populate({
    path: "relatedMatter",
    select: "matterTitle matterNumber",
  });

  next();
});

documentRecordSchema.methods.addActivity = async function (action, description, userId, metadata = {}) {
  this.activities.push({
    action,
    description,
    performedBy: userId,
    metadata,
  });
  return this.save();
};

documentRecordSchema.statics.getStats = async function (firmId, filters = {}) {
  const matchStage = { firmId, isDeleted: false };
  
  if (filters.status) matchStage.status = filters.status;
  if (filters.priority) matchStage.priority = filters.priority;
  if (filters.documentType) matchStage.documentType = filters.documentType;
  if (filters.startDate || filters.endDate) {
    matchStage.dateReceived = {};
    if (filters.startDate) matchStage.dateReceived.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.dateReceived.$lte = new Date(filters.endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        received: { $sum: { $cond: [{ $eq: ["$status", "received"] }, 1, 0] } },
        acknowledged: { $sum: { $cond: [{ $eq: ["$status", "acknowledged"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        archived: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
        urgent: { $sum: { $cond: ["$isUrgent", 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
        dueToday: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$responseRequired", true] },
                  {
                    $lte: [
                      "$dueDate",
                      new Date(new Date().setHours(23, 59, 59, 999)),
                    ],
                  },
                  { $eq: ["$status", { $ne: "completed" }] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const byType = await this.aggregate([
    { $match: matchStage },
    { $group: { _id: "$documentType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const byPriority = await this.aggregate([
    { $match: matchStage },
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);

  return {
    stats: stats[0] || {
      total: 0,
      received: 0,
      acknowledged: 0,
      inProgress: 0,
      completed: 0,
      archived: 0,
      urgent: 0,
      highPriority: 0,
      dueToday: 0,
    },
    byType,
    byPriority,
  };
};

const DocumentRecord = mongoose.model("DocumentRecord", documentRecordSchema);

module.exports = DocumentRecord;
