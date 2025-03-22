const DocumentRecord = require("../models/documentRecordModel");
const catchAsync = require("../utils/catchAsync");

// create a new document record
exports.addDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      docRecord,
    },
  });
});

// get all document records
exports.getAllDocumentRecords = catchAsync(async (req, res) => {
  const docRecords = await DocumentRecord.find();

  res.status(200).json({
    status: "success",
    results: docRecords.length,
    data: {
      docRecords,
    },
  });
});

//  get a single document record
exports.getDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findById(req.params.id);

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

//  update a document record
exports.updateDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findByIdAndUpdate(
    req.params.id,
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

//  delete a document record
exports.deleteDocumentRecord = catchAsync(async (req, res) => {
  const docRecord = await DocumentRecord.findByIdAndDelete(req.params.id);

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
