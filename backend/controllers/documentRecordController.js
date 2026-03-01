const DocumentRecord = require("../models/documentRecordModel");
const catchAsync = require("../utils/catchAsync");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");

const documentRecordService = PaginationServiceFactory.createService(
  DocumentRecord,
  {
    searchableFields: [
      "documentName",
      "documentType",
      "docRef",
      "sender",
      "note",
      "tags",
    ],
    filterableFields: [
      "documentType",
      "sender",
      "recipient",
      "forwardedTo",
      "dateReceived",
      "startDate",
      "endDate",
      "status",
      "priority",
      "isUrgent",
      "isDeleted",
      "responseRequired",
      "relatedCase",
      "relatedMatter",
      "tags",
    ],
    defaultSort: "-dateReceived",
    dateField: "dateReceived",
    maxLimit: 100,
  }
);

const validateDocumentRecordInput = catchAsync(async (req, res, next) => {
  const {
    documentName,
    documentType,
    sender,
    recipient,
    forwardedTo,
    dateReceived,
    dueDate,
    priority,
    isUrgent,
    tags,
  } = req.body;

  const errors = [];

  if (!documentName || documentName.trim().length === 0) {
    errors.push("Document name is required");
  } else if (documentName.length > 100) {
    errors.push("Document name cannot exceed 100 characters");
  }

  if (!documentType) {
    errors.push("Document type is required");
  }

  if (!sender || sender.trim().length === 0) {
    errors.push("Sender is required");
  } else if (sender.length > 200) {
    errors.push("Sender name cannot exceed 200 characters");
  }

  if (dueDate && new Date(dueDate) < new Date(dateReceived || Date.now())) {
    errors.push("Due date cannot be before received date");
  }

  if (priority && !["low", "medium", "high", "urgent"].includes(priority)) {
    errors.push("Invalid priority level");
  }

  if (tags && !Array.isArray(tags)) {
    errors.push("Tags must be an array");
  } else if (tags && tags.some((tag) => tag.length > 50)) {
    errors.push("Each tag cannot exceed 50 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: "fail",
      message: "Validation failed",
      errors,
    });
  }

  next();
});

const logActivity = async (doc, action, description, userId, metadata = {}) => {
  doc.activities.push({
    action,
    description,
    performedBy: userId,
    metadata,
  });
  return doc.save();
};

const transformDocument = (doc) => {
  const obj = doc.toObject();
  
  if (obj.activities) {
    obj.activities = obj.activities.map((activity) => ({
      ...activity,
      performedBy: activity.performedBy
        ? `${activity.performedBy.firstName} ${activity.performedBy.lastName}`
        : "System",
    }));
  }
  
  return obj;
};

exports.addDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.create({
    ...req.body,
    firmId: req.firmId,
    createdBy: req.user._id,
    status: "received",
  });

  await logActivity(
    docRecord,
    "created",
    `Document "${docRecord.documentName}" was received from ${docRecord.sender}`,
    req.user._id,
    { documentType: docRecord.documentType }
  );

  res.status(201).json({
    status: "success",
    data: {
      docRecord: transformDocument(docRecord),
    },
  });
});

exports.getAllDocumentRecords = catchAsync(async (req, res) => {
  const result = await documentRecordService.paginate(
    req.query,
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      docRecord: transformDocument(docRecord),
    },
  });
});

exports.updateDocumentRecord = catchAsync(async (req, res) => {
  const allowedFields = [
    "documentName",
    "documentType",
    "docRef",
    "sender",
    "senderAddress",
    "senderContact",
    "dateReceived",
    "dueDate",
    "responseRequired",
    "recipient",
    "forwardedTo",
    "forwardNote",
    "forwardDate",
    "priority",
    "isUrgent",
    "tags",
    "note",
    "relatedCase",
    "relatedMatter",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "No valid fields to update",
    });
  }

  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  const previousStatus = docRecord.status;
  const previousPriority = docRecord.priority;

  Object.assign(docRecord, updates);
  docRecord.updatedBy = req.user._id;

  await docRecord.save();

  if (updates.status && updates.status !== previousStatus) {
    await logActivity(
      docRecord,
      "status_changed",
      `Status changed from ${previousStatus} to ${updates.status}`,
      req.user._id,
      { previousStatus, newStatus: updates.status }
    );
  }

  if (updates.priority && updates.priority !== previousPriority) {
    await logActivity(
      docRecord,
      "priority_changed",
      `Priority changed from ${previousPriority} to ${updates.priority}`,
      req.user._id,
      { previousPriority, newPriority: updates.priority }
    );
  }

  await logActivity(
    docRecord,
    "updated",
    `Document record was updated`,
    req.user._id,
    { updatedFields: Object.keys(updates) }
  );

  res.status(200).json({
    status: "success",
    data: {
      docRecord: transformDocument(docRecord),
    },
  });
});

exports.updateDocumentStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const validStatuses = [
    "received",
    "acknowledged",
    "under_review",
    "in_progress",
    "pending_action",
    "completed",
    "archived",
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid status value",
    });
  }

  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  const previousStatus = docRecord.status;
  docRecord.previousStatus = previousStatus;
  docRecord.status = status;
  docRecord.updatedBy = req.user._id;

  if (status === "acknowledged") {
    docRecord.acknowledgedBy = req.user._id;
    docRecord.acknowledgedAt = new Date();
  }

  if (status === "completed") {
    docRecord.completedAt = new Date();
    docRecord.completedBy = req.user._id;
  }

  if (status === "archived") {
    docRecord.archivedAt = new Date();
    docRecord.archivedBy = req.user._id;
  }

  await docRecord.save();

  await logActivity(
    docRecord,
    "status_changed",
    `Status changed from "${previousStatus}" to "${status}"`,
    req.user._id,
    { previousStatus, newStatus: status }
  );

  res.status(200).json({
    status: "success",
    data: {
      docRecord: transformDocument(docRecord),
    },
  });
});

exports.forwardDocument = catchAsync(async (req, res) => {
  const { forwardedTo, forwardNote } = req.body;

  if (!forwardedTo) {
    return res.status(400).json({
      status: "fail",
      message: "Forward recipient is required",
    });
  }

  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  const previousForwardedTo = docRecord.forwardedTo;
  docRecord.forwardedTo = forwardedTo;
  docRecord.forwardNote = forwardNote || "";
  docRecord.forwardDate = new Date();
  docRecord.updatedBy = req.user._id;

  await docRecord.save();

  await logActivity(
    docRecord,
    "forwarded",
    `Document forwarded to a new recipient`,
    req.user._id,
    {
      previousForwardedTo: previousForwardedTo?.toString(),
      newForwardedTo: forwardedTo,
      forwardNote,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      docRecord: transformDocument(docRecord),
    },
  });
});

exports.addInternalNote = catchAsync(async (req, res) => {
  const { content, isPrivate = true } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "Note content is required",
    });
  }

  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  docRecord.internalNotes.push({
    content: content.trim(),
    createdBy: req.user._id,
    isPrivate,
  });
  docRecord.updatedBy = req.user._id;

  await docRecord.save();

  await logActivity(
    docRecord,
    "note_added",
    `Internal note added`,
    req.user._id,
    { isPrivate }
  );

  res.status(200).json({
    status: "success",
    data: {
      docRecord: transformDocument(docRecord),
    },
  });
});

exports.addAttachment = catchAsync(async (req, res) => {
  const { fileName, fileUrl, fileType, fileSize } = req.body;

  if (!fileName || !fileUrl) {
    return res.status(400).json({
      status: "fail",
      message: "File name and URL are required",
    });
  }

  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  docRecord.attachments.push({
    fileName,
    fileUrl,
    fileType,
    fileSize,
    uploadedBy: req.user._id,
  });
  docRecord.updatedBy = req.user._id;

  await docRecord.save();

  await logActivity(
    docRecord,
    "attachment_added",
    `Attachment "${fileName}" uploaded`,
    req.user._id,
    { fileName, fileType, fileSize }
  );

  res.status(200).json({
    status: "success",
    data: {
      docRecord: transformDocument(docRecord),
    },
  });
});

exports.bulkUpdateStatus = catchAsync(async (req, res) => {
  const { documentIds, status } = req.body;

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "Document IDs array is required",
    });
  }

  const validStatuses = [
    "received",
    "acknowledged",
    "under_review",
    "in_progress",
    "pending_action",
    "completed",
    "archived",
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid status value",
    });
  }

  const updateFields = {
    status,
    updatedBy: req.user._id,
  };

  if (status === "completed") {
    updateFields.completedAt = new Date();
    updateFields.completedBy = req.user._id;
  }

  const result = await DocumentRecord.updateMany(
    {
      _id: { $in: documentIds },
      firmId: req.firmId,
      isDeleted: false,
    },
    updateFields
  );

  res.status(200).json({
    status: "success",
    data: {
      modifiedCount: result.modifiedCount,
    },
    message: `${result.modifiedCount} document(s) updated to "${status}"`,
  });
});

exports.bulkDelete = catchAsync(async (req, res) => {
  const { documentIds } = req.body;

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "Document IDs array is required",
    });
  }

  const result = await DocumentRecord.updateMany(
    {
      _id: { $in: documentIds },
      firmId: req.firmId,
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      deletedCount: result.modifiedCount,
    },
    message: `${result.modifiedCount} document(s) moved to trash`,
  });
});

exports.bulkPermanentDelete = catchAsync(async (req, res) => {
  const { documentIds } = req.body;

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "Document IDs array is required",
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      status: "fail",
      message: "Only administrators can permanently delete documents",
    });
  }

  const result = await DocumentRecord.deleteMany({
    _id: { $in: documentIds },
    firmId: req.firmId,
  });

  res.status(200).json({
    status: "success",
    data: {
      deletedCount: result.deletedCount,
    },
    message: `${result.deletedCount} document(s) permanently deleted`,
  });
});

exports.softDeleteDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: false,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  docRecord.isDeleted = true;
  docRecord.deletedAt = new Date();
  docRecord.deletedBy = req.user._id;
  docRecord.status = "archived";

  await docRecord.save();

  await logActivity(
    docRecord,
    "deleted",
    "Document record moved to trash",
    req.user._id
  );

  res.status(200).json({
    status: "success",
    message: "Document record moved to trash",
  });
});

exports.restoreDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: true,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found in trash",
    });
  }

  const wasDeleted = docRecord.isDeleted;
  docRecord.isDeleted = false;
  docRecord.deletedAt = null;
  docRecord.deletedBy = null;
  
  if (docRecord.previousStatus) {
    docRecord.status = docRecord.previousStatus;
  }

  await docRecord.save();

  await logActivity(
    docRecord,
    "restored",
    "Document record restored from trash",
    req.user._id
  );

  res.status(200).json({
    status: "success",
    data: {
      docRecord: transformDocument(docRecord),
    },
    message: "Document record restored successfully",
  });
});

exports.deleteDocumentRecord = catchAsync(async (req, res) => {
  const { permanent } = req.query;

  if (permanent === "true" && !req.user.isAdmin) {
    return res.status(403).json({
      status: "fail",
      message: "Only administrators can permanently delete documents",
    });
  }

  const query = {
    _id: req.params.id,
    firmId: req.firmId,
  };

  if (permanent !== "true") {
    query.isDeleted = false;
  }

  if (permanent === "true") {
    const docRecord = await DocumentRecord.findOneAndDelete(query);

    if (!docRecord) {
      return res.status(404).json({
        status: "fail",
        message: "Document record not found",
      });
    }

    return res.status(204).json({
      status: "success",
      message: "Document permanently deleted",
    });
  }

  const docRecord = await DocumentRecord.findOne(query);

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  docRecord.isDeleted = true;
  docRecord.deletedAt = new Date();
  docRecord.deletedBy = req.user._id;
  docRecord.status = "archived";

  await docRecord.save();

  await logActivity(
    docRecord,
    "deleted",
    "Document record moved to trash",
    req.user._id
  );

  res.status(204).json({
    status: "success",
    message: "Document moved to trash",
  });
});

exports.getTrash = catchAsync(async (req, res) => {
  const result = await documentRecordService.paginate(
    { ...req.query, isDeleted: true },
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.searchDocumentRecords = catchAsync(async (req, res) => {
  const result = await documentRecordService.advancedSearch(
    { ...req.body, firmId: req.firmId },
    req.query
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByType = catchAsync(async (req, res) => {
  const { documentType } = req.params;
  const result = await documentRecordService.paginate(
    { ...req.query, documentType },
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getActivityLog = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  }).populate("activities.performedBy", "firstName lastName email");

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  const activities = docRecord.activities
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((activity) => ({
      ...activity.toObject(),
      performedBy: activity.performedBy
        ? `${activity.performedBy.firstName} ${activity.performedBy.lastName}`
        : "System",
    }));

  res.status(200).json({
    status: "success",
    data: {
      activities,
    },
  });
});

exports.getDocumentsBySender = catchAsync(async (req, res) => {
  const { sender } = req.params;
  const result = await documentRecordService.paginate(
    { ...req.query, sender: new RegExp(sender, "i") },
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByRecipient = catchAsync(async (req, res) => {
  const { recipientId } = req.params;
  const result = await documentRecordService.paginate(
    { ...req.query, recipient: recipientId },
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByForwardedTo = catchAsync(async (req, res) => {
  const { forwardedToId } = req.params;
  const result = await documentRecordService.paginate(
    { ...req.query, forwardedTo: forwardedToId },
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByDateRange = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await documentRecordService.paginate(
    { ...req.query, startDate, endDate },
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByStatus = catchAsync(async (req, res) => {
  const { status } = req.params;
  const result = await documentRecordService.paginate(
    { ...req.query, status },
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByPriority = catchAsync(async (req, res) => {
  const { priority } = req.params;
  const result = await documentRecordService.paginate(
    { ...req.query, priority },
    {},
    req.firmId
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentStats = catchAsync(async (req, res) => {
  const filters = {
    status: req.query.status,
    priority: req.query.priority,
    documentType: req.query.documentType,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };

  const stats = await DocumentRecord.getStats(req.firmId, filters);

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

exports.exportDocuments = catchAsync(async (req, res) => {
  const { format = "csv" } = req.query;

  const documents = await DocumentRecord.find({
    firmId: req.firmId,
    isDeleted: false,
  })
    .populate("recipient", "firstName lastName")
    .populate("forwardedTo", "firstName lastName")
    .populate("relatedCase", "caseTitle caseNumber")
    .sort({ dateReceived: -1 })
    .limit(1000);

  if (format === "json") {
    return res.status(200).json({
      status: "success",
      data: documents.map(transformDocument),
      exportDate: new Date(),
      count: documents.length,
    });
  }

  const csvHeader = [
    "Document Name",
    "Document Type",
    "Reference",
    "Sender",
    "Date Received",
    "Due Date",
    "Status",
    "Priority",
    "Urgent",
    "Recipient",
    "Forwarded To",
    "Related Case",
    "Note",
    "Created At",
  ].join(",");

  const csvRows = documents.map((doc) => {
    return [
      `"${(doc.documentName || "").replace(/"/g, '""')}"`,
      doc.documentType || "",
      `"${(doc.docRef || "").replace(/"/g, '""')}"`,
      `"${(doc.sender || "").replace(/"/g, '""')}"`,
      doc.dateReceived ? new Date(doc.dateReceived).toISOString().split("T")[0] : "",
      doc.dueDate ? new Date(doc.dueDate).toISOString().split("T")[0] : "",
      doc.status || "",
      doc.priority || "",
      doc.isUrgent ? "Yes" : "No",
      doc.recipient ? `${doc.recipient.firstName} ${doc.recipient.lastName}` : "",
      doc.forwardedTo ? `${doc.forwardedTo.firstName} ${doc.forwardedTo.lastName}` : "",
      doc.relatedCase ? `${doc.relatedCase.caseNumber} - ${doc.relatedCase.caseTitle}` : "",
      `"${(doc.note || "").replace(/"/g, '""')}"`,
      doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    ].join(",");
  });

  const csv = [csvHeader, ...csvRows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=document-records-${new Date().toISOString().split("T")[0]}.csv`
  );
  res.send(csv);
});
