const DocumentRecord = require("../models/documentRecordModel");
const catchAsync = require("../utils/catchAsync");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");

// Create pagination service for DocumentRecord
const documentRecordService = PaginationServiceFactory.createService(
  DocumentRecord,
  {
    searchableFields: [
      "documentName",
      "documentType",
      "docRef",
      "sender",
      "note",
    ],
    filterableFields: [
      "documentType",
      "sender",
      "recipient",
      "forwardedTo",
      "dateReceived",
      "startDate",
      "endDate",
      "includeDeleted",
      "onlyDeleted",
    ],
    defaultSort: "-dateReceived",
    dateField: "dateReceived",
    maxLimit: 50,
  }
);

// create a new document record
exports.addDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.create({
    ...req.body,
    firmId: req.firm._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      docRecord,
    },
  });
});

// get all document records with pagination, filtering, and sorting
exports.getAllDocumentRecords = catchAsync(async (req, res) => {
  // console.log("Query params:", req.query);
  // console.log("Date filter being applied:", {
  //   startDate: req.query.startDate,
  //   endDate: req.query.endDate,
  //   dateField: "dateReceived",
  // });

  const result = await documentRecordService.paginate(req.query);

  console.log("Filter result:", {
    total: result.pagination?.totalRecords,
    dataCount: result.data?.length,
  });

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// get a single document record
exports.getDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findOne({
    _id: req.params.id,
    firmId: req.firm._id,
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
      docRecord,
    },
  });
});

// update a document record
exports.updateDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findOneAndUpdate(
    { _id: req.params.id, firmId: req.firm._id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      docRecord,
    },
  });
});

// delete a document record
exports.deleteDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findOneAndDelete({
    _id: req.params.id,
    firmId: req.firm._id,
  });

  if (!docRecord) {
    return res.status(404).json({
      status: "fail",
      message: "Document record not found",
    });
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Advanced search for document records
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
  const result = await documentRecordService.paginate({
    ...req.query,
    documentType,
    firmId: req.firmId, // ✅ ADD THIS
  });

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsBySender = catchAsync(async (req, res) => {
  const { sender } = req.params;
  const result = await documentRecordService.paginate({
    ...req.query,
    sender: new RegExp(sender, "i"),
    firmId: req.firmId,
  });

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByRecipient = catchAsync(async (req, res) => {
  const { recipientId } = req.params;
  const result = await documentRecordService.paginate({
    ...req.query,
    recipient: recipientId,
    firmId: req.firmId,
  });

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByForwardedTo = catchAsync(async (req, res) => {
  const { forwardedToId } = req.params;
  const result = await documentRecordService.paginate({
    ...req.query,
    forwardedTo: forwardedToId,
    firmId: req.firmId,
  });

  res.status(200).json({
    status: "success",
    ...result,
  });
});

exports.getDocumentsByDateRange = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await documentRecordService.paginate({
    ...req.query,
    startDate,
    endDate,
    firmId: req.firmId,
  });

  res.status(200).json({
    status: "success",
    ...result,
  });
});
