const path = require("path");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");

// document download handler
exports.downloadDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;
    // Fetch the case by ID
    const docData = await model.findById(parentId);
    if (!docData) {
      return next(new AppError(`No case found with ID: ${parentId}`, 404));
    }
    // Fetch the document by ID
    const document = docData.documents.id(documentId);
    if (!document) {
      return next(
        new AppError(`No document found with ID: ${documentId}`, 404)
      );
    }
    const filePath = path.join(__dirname, "..", document.file);
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
};

// document upload handler
exports.createDocument = (model, fileDirectory) => {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { fileName } = req.body;
    const { file } = req;

    if (!file) {
      return next(new AppError("Please provide a document file", 400));
    }

    if (!fileName || fileName.trim() === "") {
      return next(
        new AppError("A file name is required for each document", 400)
      );
    }

    const filePath = path.join(fileDirectory, file.filename);

    const document = {
      fileName,
      file: filePath,
    };

    const updatedDoc = await model.findByIdAndUpdate(
      id,
      { $push: { documents: document } }, // Push new document to the documents array
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      return next(new AppError(`No document found with ID: ${id}`, 404));
    }

    res.status(200).json({
      message: "Document successfully uploaded",
      updatedDoc,
    });
  });
};

// delete document handler
exports.deleteDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;

    // Update the case
    const docData = await model.findByIdAndUpdate(
      parentId,
      {
        $pull: { documents: { _id: documentId } },
      },
      { new: true }
    );

    if (!docData) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};

//aggregation handler for group
exports.getCasesByGroup = (field, model) =>
  catchAsync(async (req, res, next) => {
    const results = await model.aggregate([
      {
        $group: {
          _id: field,
          count: { $sum: 1 },
          parties: {
            $push: {
              $concat: [
                { $arrayElemAt: ["$firstParty.name.name", 0] },
                " vs ",
                { $arrayElemAt: ["$secondParty.name.name", 0] },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          groupName: "$_id",
          parties: 1,
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      message: "success",
      data: results,
    });
  });

// aggregation handler for getting cases by period
// exports.getByPeriod = (field, model, period,) =>
//   catchAsync(async (req, res, next) => {
//     const results = await Model.aggregate([
//       {
//         $group: {
//           _id: { $period: field },
//           parties: {
//             $push: {
//               $concat: [
//                 { $arrayElemAt: ["$firstParty.name.name", 0] },
//                 " vs ",
//                 { $arrayElemAt: ["$secondParty.name.name", 0] },
//               ],
//             },
//           },
//           count: { $sum: 1 },
//         },
//       },

//       {
//         $project: {
//           _id: 0,
//           groupName: "$_id",
//           parties: 1,
//           count: 1,
//         },
//       },
//       {
//         $sort: { period: 1 },
//       },
//     ]);

//     res.status(200).json({
//       message: "success",
//       data: results,
//     });
//   });
