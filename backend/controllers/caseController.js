const Case = require("../models/caseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Multer configuration

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads"); // replace with your destination path
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `case-${req.user.id}-${Date.now()}${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|doc|docx|pdf|txt/;
  const mimetype = filetypes.test(file.mimetype.toLowerCase());
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only JPEG, PNG, DOC, DOCX, PDF, TXT files are allowed.",
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadCaseFile = upload.single("file");

exports.createCase = catchAsync(async (req, res, next) => {
  const singleCase = await Case.create(req.body);
  res.status(201).json({
    data: singleCase,
  });
});

exports.getCases = catchAsync(async (req, res, next) => {
  const cases = await Case.find().sort({ filingDate: -1 });
  // .populate({
  //   path: "task",
  //   select: "description status dateAssigned dueDate taskPriority",
  // })
  // .populate({ path: "reports", select: "date update" });
  res.status(200).json({
    results: cases.length,
    data: cases,
  });
});

exports.getCase = catchAsync(async (req, res, next) => {
  //if id/caseId provided does not exist
  const _id = req.params.caseId;
  const data = await Case.findById({ _id })
    .populate({
      path: "reports",
      select: "-caseReported",
    })
    .populate({ path: "documents" });

  if (!data) {
    return next(new AppError("No case found with that Id", 404));
  }
  res.status(200).json({
    data,
  });
});

exports.updateCase = catchAsync(async (req, res, next) => {
  const caseId = req.params.caseId;
  const updatedCase = await Case.findByIdAndUpdate({ _id: caseId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedCase) {
    return next(
      new AppError(`No Case Found with ID: ${req.params.caseId}`, 404)
    );
  }

  res.status(200).json({
    message: "Case successfully updated",
    updatedCase,
  });
});

exports.deleteCase = catchAsync(async (req, res, next) => {
  const _id = req.params.caseId;
  const data = await Case.findByIdAndDelete({ _id });

  if (!data) {
    return next(new AppError("case with that Id does not exist", 404));
  }
  res.status(204).json({
    message: "Case deleted",
  });
});

// download case file handler
// exports.downloadCaseDocument = catchAsync(async (req, res, next) => {
//   const { caseId, documentId } = req.params;

//   const caseData = await Case.findById(caseId);

//   if (!caseData) {
//     return next(new AppError(`No case found with ID: ${caseId}`, 404));
//   }

//   const document = caseData.documents.id(documentId);

//   if (!document) {
//     return next(new AppError(`No document found with ID: ${documentId}`, 404));
//   }

//   const filePath = path.join(__dirname, "..", document.file);

//   fs.access(filePath, fs.constants.F_OK, (err) => {
//     if (err) {
//       console.error("File does not exist");
//       return next(new AppError("File not found", 404));
//     } else {
//       res.download(filePath, document.fileName, (err) => {
//         if (err) {
//           console.error("File download failed");
//           return next(new AppError("File download failed", 500));
//         }
//       });
//     }
//   });
// });
exports.downloadCaseDocument = catchAsync(async (req, res, next) => {
  const { caseId, documentId } = req.params;

  // Fetch the case by ID
  const caseData = await Case.findById(caseId);
  if (!caseData) {
    return next(new AppError(`No case found with ID: ${caseId}`, 404));
  }

  // Fetch the document by ID
  const document = caseData.documents.id(documentId);
  if (!document) {
    return next(new AppError(`No document found with ID: ${documentId}`, 404));
  }

  const filePath = path.join(__dirname, "..", document.file);
  // const filePath = path.join(
  //   __dirname,
  //   "..",
  //   "public",
  //   "upload",
  //   document.file
  // );

  console.log("PAth", filePath);
  // Check if the file exists synchronously
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist", filePath);
    return next(new AppError("File not found", 404));
  }

  // If the file exists, download it
  res.download(filePath, document.fileName, (err) => {
    if (err) {
      console.error("File download failed", err);
      return next(new AppError("File download failed", 500));
    }
  });
});

// upload case file handler

exports.createDocuments = catchAsync(async (req, res, next) => {
  const { caseId } = req.params;
  const { fileName } = req.body;
  const { file } = req;

  if (!file) {
    return next(new AppError("Please provide a document file", 400));
  }

  if (!fileName || fileName.trim() === "") {
    return next(new AppError("A file name is required for each document", 400));
  }

  const filePath = path.join("public/uploads", file.filename);

  const document = {
    fileName,
    file: filePath,
  };

  const updatedCase = await Case.findByIdAndUpdate(
    caseId,
    { $push: { documents: document } }, // Push new document to the documents array
    { new: true, runValidators: true }
  );

  if (!updatedCase) {
    return next(new AppError(`No case found with ID: ${caseId}`, 404));
  }

  res.status(200).json({
    message: "Document successfully uploaded",
    updatedCase,
  });
});
