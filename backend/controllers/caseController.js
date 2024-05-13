const Case = require("../models/caseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/cases/docs");
  },
  filename: (req, file, cb) => {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );

    // console.log(req.file);
  },
});

const fileFilter = (req, file, cb) => {
  // filter out file if not specified here
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // For .docx files
    file.mimetype === "text/plain" // For plain text files
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Not a valid document! Please upload only valid document.",
        400
      ),
      false
    );
  }
};

exports.upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

// exports.createCase = catchAsync(async (req, res, next) => {
//   const { file, body } = req;
//   if (!file || !body) {
//     return next(new AppError("Please provide a file and request body", 400));
//   }
//   const { filename } = file;
//   const { fileName, ...rest } = body;
//   if (!fileName) {
//     return next(
//       new AppError("Please provide a fileName in the request body", 400)
//     );
//   }
//   const document = {
//     name: fileName,
//     file: filename,
//   };
//   const singleCase = await Case.create({ documents: [document], ...rest });
//   res.status(201).json({ data: singleCase });
// });

exports.createCase = catchAsync(async (req, res, next) => {
  const singleCase = await Case.create(req.body);
  res.status(201).json({
    data: singleCase,
  });
});

exports.getCases = catchAsync(async (req, res, next) => {
  const cases = await Case.find();
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
  const data = await Case.findById({ _id }).populate({
    path: "reports",
    select: "-caseReported",
  });

  // res.status(200).json({
  //   data,
  // });
  //   .populate({
  //     path: "task",
  //     select: "description status dateAssigned dueDate taskPriority",
  //   })
  //   .populate("updates");
  // res.status(200).json({
  //   data,
  // });
  // console.log(id);
  if (!data) {
    return next(new AppError("No case found with that Id", 404));
  }
  res.status(200).json({
    data,
  });
});

// exports.updateCase = catchAsync(async (req, res, next) => {
//   const { file, body } = req;
//   if (!file || !body) {
//     return next(new AppError("Please provide a file and request body", 400));
//   }
//   const { filename } = file;
//   const { docName, ...rest } = body;
//   if (!docName) {
//     return next(
//       new AppError("Please provide a fileName in the request body", 400)
//     );
//   }
//   const document = {
//     name: docName,
//     file: filename,
//   };

//   const doc = await Case.findByIdAndUpdate(req.params.caseId, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!doc) {
//     return next(new AppError(`No Case Found with that ID`, 404));
//   }
//   // console.log(updatedCase);
//   res.status(200).json({
//     message: "case successfully updated",
//     doc,
//   });
// });
exports.updateCase = catchAsync(async (req, res, next) => {
  const { body, file } = req;
  const { documents } = body;

  if (!documents || !Array.isArray(documents)) {
    return next(
      new AppError("Please provide documents array in the request body", 400)
    );
  }

  const updatedDocuments = [];

  // Iterate through the documents array and update each document
  for (const document of documents) {
    const { docName } = document;

    // Check if docName is provided
    if (!docName) {
      return next(new AppError("docName is required for each document", 400));
    }

    // If file is provided, update the document with file name
    if (file) {
      const { filename } = file;
      updatedDocuments.push({ docName, file: filename });
    } else {
      // If file is not provided, keep the existing file name
      updatedDocuments.push({ docName, file: document.file });
    }
  }

  const updatedCase = await Case.findByIdAndUpdate(
    req.params.caseId,
    { documents: updatedDocuments },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedCase) {
    return next(new AppError(`No Case Found with that ID`, 404));
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
