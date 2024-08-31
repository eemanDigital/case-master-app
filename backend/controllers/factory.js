const path = require("path");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
// const setRedisCache = require("../utils/setRedisCache");

// document download handler
exports.downloadDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;

    // Fetch the case by ID
    const docData = await model.findById(parentId);
    if (!docData) {
      return next(new AppError(`No document found with ID: ${parentId}`, 404));
    }

    // Fetch the document by ID
    const document = docData.documents.id(documentId);
    if (!document) {
      return next(
        new AppError(`No document found with ID: ${documentId}`, 404)
      );
    }

    const fileUrl = document.file;
    const fileName = document.fileName;

    res.status(200).json({
      message: "success",
      data: {
        fileUrl,
        fileName,
      },
    });
  });
};

// document upload handler
exports.createDocument = (model) => {
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

    // Use Cloudinary URL instead of constructing a local file path
    const filePath = req.file.cloudinaryUrl;

    if (!filePath) {
      return next(new AppError("Error uploading file to Cloudinary", 500));
    }

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
      message: "success",
      updatedDoc,
    });
  });
};

// for documents alone
// general delete handler -
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No Tour Found with that ID`, 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  });

// delete document/file handler
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

    // set redis cache for caching data
    // setRedisCache(field, results, 5000);

    res.status(200).json({
      message: "success",
      fromCache: false,
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
